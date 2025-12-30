import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        const normalizedCode = code.trim().toUpperCase();
        const supabase = createAdminClient();

        const { error } = await supabase
            .from('coupons_issued')
            .update({
                validated: false,
                validated_at: null,
                validated_by: null
                // Keeping notes as per requirements (User: "notes se puede mantener o limpiar (dejarla)")
            })
            .eq('coupon_code', normalizedCode);

        if (error) {
            throw error;
        }

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
