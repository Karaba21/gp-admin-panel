import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { month, coupon_code } = body;

        if (!month || !coupon_code) {
            return NextResponse.json({ error: 'Month and Coupon Code are required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Check if a winner already exists for this month
        const { data: existingWinner, error: checkError } = await supabase
            .from('coupons_issued')
            .select('id')
            .eq('won_month', month)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existingWinner) {
            return NextResponse.json({ error: 'Ya existe un ganador confirmado para este mes' }, { status: 409 });
        }

        // Update the winner
        const { error: updateError } = await supabase
            .from('coupons_issued')
            .update({
                won: true,
                won_at: new Date().toISOString(),
                won_month: month
            })
            .eq('coupon_code', coupon_code);

        if (updateError) throw updateError;

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
