import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const filter = searchParams.get('filter') || 'all'; // all, validated, unvalidated
        const query = searchParams.get('query') || '';
        const limit = parseInt(searchParams.get('limit') || '50');

        const supabase = createAdminClient();

        let dbQuery = supabase
            .from('coupons_issued')
            .select(`
                *,
                leads!inner (
                    id,
                    full_name,
                    email,
                    phone
                )
            `)
            .order('issued_at', { ascending: false })
            .limit(limit);

        // Apply Status Filter
        if (filter === 'validated') {
            dbQuery = dbQuery.eq('validated', true);
        } else if (filter === 'unvalidated') {
            dbQuery = dbQuery.eq('validated', false);
        }

        // Apply Search Query
        if (query) {
            const normalizedQuery = query.trim();
            // Search in coupon_code OR lead fields using 'or'
            // Since we are joining leads, we can filter on joined columns if we use the right syntax.
            // Supabase postgREST syntax for OR across tables is tricky.
            // Simpler approach: 
            // If it looks like a coupon (starts with GP), search coupon_code.
            // Else try to search lead info.

            if (normalizedQuery.toUpperCase().startsWith('GP-')) {
                dbQuery = dbQuery.ilike('coupon_code', `%${normalizedQuery}%`);
            } else {
                // To search across joined tables with OR is complex in one go without raw SQL or embedding
                // For simplicity/performance given the inner join above:
                // We'll use the search query on the Leads columns.
                dbQuery = dbQuery.or(`email.ilike.%${normalizedQuery}%,full_name.ilike.%${normalizedQuery}%,phone.ilike.%${normalizedQuery}%`, { foreignTable: 'leads' });
            }
        }

        const { data, error } = await dbQuery;

        if (error) {
            console.error('Error fetching coupons:', error);
            throw error;
        }

        // Format for frontend
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted = data.map((item: any) => ({
            ...item,
            lead: item.leads,
            leads: undefined // Cleanup
        }));

        return NextResponse.json({ coupons: formatted });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
