import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { month } = body;

        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return NextResponse.json({ error: 'Valid Month (YYYY-MM) is required' }, { status: 400 });
        }

        // Logic duplicates fetching participants, but that's safer to ensure consistent state at "pick" time
        const startDate = `${month}-01T00:00:00.000Z`;
        const [year, m] = month.split('-').map(Number);

        let nextYear = year;
        let nextMonth = m + 1;
        if (nextMonth > 12) {
            nextMonth = 1;
            nextYear++;
        }
        const nextMonthStr = nextMonth.toString().padStart(2, '0');
        const endDate = `${nextYear}-${nextMonthStr}-01T00:00:00.000Z`;

        const supabase = createAdminClient();

        // Check if there is already a winner for this month to warn? 
        // The requirements say "reproducible" but also "elegir random en servidor". 
        // If we want it to be reproducible for the same set of participants, we 'could' use a seed, 
        // but typically 'random' means a fresh pick. 
        // The user says "Guardar ganador (recomendado)... Al confirmar ganador, marcar...".
        // The PICK endpoint just selects one. The CONFIRM endpoint persists it.
        // So PICK can be random every time.

        const { data, error } = await supabase
            .from('coupons_issued')
            .select(`
                *,
                leads (
                    full_name,
                    email,
                    phone
                )
            `)
            .eq('validated', true)
            .gte('validated_at', startDate)
            .lt('validated_at', endDate);

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'No hay participantes validados para este mes' }, { status: 400 });
        }

        // Randomly select 1
        const randomIndex = Math.floor(Math.random() * data.length);
        const winner = data[randomIndex];

        return NextResponse.json({
            ok: true,
            winner: {
                ...winner,
                lead: winner.leads, // Flatten
                leads: undefined
            }
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
