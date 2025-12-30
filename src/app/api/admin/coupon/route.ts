import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        const normalizedCode = code.trim().toUpperCase();
        const supabase = createAdminClient();

        // Join coupons_issued with leads
        const { data: coupon, error } = await supabase
            .from('coupons_issued')
            .select(`
                *,
                leads (
                    id,
                    full_name,
                    email,
                    phone
                )
            `)
            .eq('coupon_code', normalizedCode)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // No rows found
                return NextResponse.json({ found: false });
            }
            console.error('Error fetching coupon:', error);
            throw error;
        }

        // Flatten the structure slightly for the frontend convenience if needed, 
        // but keeping it standard is also fine.
        // Returning lead details under 'lead' alias key to match frontend expectation or just use the joined data
        const result = {
            found: true,
            coupon: {
                ...coupon,
                // Remove the nested leads object from within coupon to avoid confusion? 
                // Or keep it. Let's return it separately to match the requested format: { found: true, coupon, lead }
            },
            lead: coupon.leads
        };

        // Remove leads from coupon object to keep it clean (optional but nice)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (result.coupon as any).leads;

        return NextResponse.json(result);


    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
