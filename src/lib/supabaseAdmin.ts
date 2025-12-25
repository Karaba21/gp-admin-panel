import { createClient } from '@supabase/supabase-js';

// Cliente con privilegios de administrador (SERVICE_ROLE)
// SOLO debe usarse en código ejecutado en el servidor (API Routes, Server Actions, getServerSideProps)
// NUNCA exponer al cliente

export const createAdminClient = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};
