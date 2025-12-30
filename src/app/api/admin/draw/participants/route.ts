import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const month = searchParams.get('month'); // YYYY-MM

        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return NextResponse.json({ error: 'Valid Month (YYYY-MM) is required' }, { status: 400 });
        }

        const startDate = `${month}-01T00:00:00.000Z`;
        // Calculate end date (first day of next month)
        const [year, m] = month.split('-').map(Number);

        // Removed unused nextMonthDate which caused lint warning

        // Simple next month calculation
        let nextYear = year;
        let nextMonth = m + 1;
        if (nextMonth > 12) {
            nextMonth = 1;
            nextYear++;
        }
        const nextMonthStr = nextMonth.toString().padStart(2, '0');
        const endDate = `${nextYear}-${nextMonthStr}-01T00:00:00.000Z`;

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('coupons_issued')
            .select(`
                coupon_code,
                validated_at,
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const participants = data.map((p: any) => ({
            coupon_code: p.coupon_code,
            validated_at: p.validated_at,
            lead: p.leads
        }));

        return NextResponse.json({ participants });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
