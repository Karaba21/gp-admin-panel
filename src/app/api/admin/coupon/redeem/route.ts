import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json({ error: 'Falta el código del cupón' }, { status: 400 });
        }

        const normalizedCode = code.trim().toUpperCase();
        const supabase = createAdminClient();

        // 1. Verificar estado actual del cupón
        const { data: coupon, error: checkError } = await supabase
            .from('coupons_issued')
            .select('id, status, redeemed_at')
            .eq('coupon_code', normalizedCode)
            .single();

        if (checkError || !coupon) {
            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error verificando cupón:', checkError);
                return NextResponse.json({ error: 'Error interno' }, { status: 500 });
            }
            return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404 });
        }

        // 2. Validar reglas de negocio
        if (coupon.status === 'redeemed') {
            return NextResponse.json({
                error: 'Este cupón ya fue canjeado',
                redeemed_at: coupon.redeemed_at
            }, { status: 409 });
        }

        if (coupon.status !== 'issued') {
            return NextResponse.json({
                error: `El cupón no está activo (Estado: ${coupon.status})`
            }, { status: 409 });
        }

        // 3. Canjear (Update)
        const { error: updateError } = await supabase
            .from('coupons_issued')
            .update({
                status: 'redeemed',
                redeemed_at: new Date().toISOString()
            })
            .eq('id', coupon.id);

        if (updateError) {
            console.error('Error al canjear cupón:', updateError);
            return NextResponse.json({ error: 'No se pudo canjear el cupón' }, { status: 500 });
        }

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('Error procesando request de canje:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
