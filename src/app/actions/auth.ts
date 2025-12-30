'use server';

import { createServerClient } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email y contraseña requeridos' };
    }

    try {
        const supabase = await createServerClient();

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { error: error.message };
        }

        if (data.session) {
            const cookieStore = await cookies();

            // Guardar tokens en cookies HttpOnly
            cookieStore.set('sb-access-token', data.session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 1 semana
                path: '/',
            });

            cookieStore.set('sb-refresh-token', data.session.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 1 semana
                path: '/',
            });

            return { success: true };
        }

        return { error: 'No se pudo iniciar sesión' };
    } catch (e) {
        return { error: 'Error interno del servidor' };
    }
}

export async function logoutAction() {
    console.log('logoutAction called');
    const cookieStore = await cookies();
    cookieStore.delete('sb-access-token');
    cookieStore.delete('sb-refresh-token');
    return { success: true };
}

export async function getSessionUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    if (!token) return null;

    try {
        const supabase = await createServerClient();
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) return null;

        return user;
    } catch {
        return null;
    }
}
