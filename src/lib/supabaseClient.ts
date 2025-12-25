import { createClient } from '@supabase/supabase-js';

// Factory function para crear un cliente nuevo en cada petición (Server Actions)
// Esto evita compartir estado entre usuarios (seguridad) y permite usar cookies
export const createServerClient = async () => {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan variables de entorno de Supabase');
  }

  return createClient(supabaseUrl, supabaseKey);
};
