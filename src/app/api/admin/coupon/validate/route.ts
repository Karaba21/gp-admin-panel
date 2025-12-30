import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code, notes } = body;

        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        const normalizedCode = code.trim().toUpperCase();
        const supabase = createAdminClient();

        // Check availability
        const { data: existing, error: fetchError } = await supabase
            .from('coupons_issued')
            .select('id, validated')
            .eq('coupon_code', normalizedCode)
            .single();

        if (fetchError || !existing) {
            return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404 });
        }

        // Idempotency: if already validated, just update notes if provided, or return success
        // But user asked to set validated_at=now(), which technically changes state if we re-validate.
        // Assuming we update everything.

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {
            validated: true,
            validated_at: new Date().toISOString(),
            validated_by: 'admin', // Fixed for now as per requirements
        };

        if (notes !== undefined) {
            updateData.notes = notes;
        }

        const { error: updateError } = await supabase
            .from('coupons_issued')
            .update(updateData)
            .eq('id', existing.id);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
