import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'Falta el código del cupón' }, { status: 400 });
        }

        const normalizedCode = code.trim().toUpperCase();
        const supabase = createAdminClient();

        // 1. Buscar el cupón
        const { data: coupon, error: couponError } = await supabase
            .from('coupons_issued')
            .select('*')
            .eq('coupon_code', normalizedCode)
            .single();

        if (couponError || !coupon) {
            // Si error es PGRST116 es que no encontró resultados
            if (couponError && couponError.code !== 'PGRST116') {
                console.error('Error buscando cupón:', couponError);
                return NextResponse.json({ error: 'Error interno verificando cupón' }, { status: 500 });
            }
            return NextResponse.json({ found: false });
        }

        // 2. Buscar el lead asociado
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('full_name, email, phone')
            .eq('id', coupon.lead_id)
            .single();

        if (leadError) {
            console.error('Error buscando lead del cupón:', leadError);
            // Retornamos el cupón aunque no encontremos el lead (caso borde)
            return NextResponse.json({
                found: true,
                coupon,
                lead: null
            });
        }

        return NextResponse.json({
            found: true,
            coupon,
            lead
        });

    } catch (error) {
        console.error('Error procesando request:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
