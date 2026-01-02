'use server';

import { createServerClient } from '@/lib/supabaseClient';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { getSessionUser } from './auth'; // Assuming auth.ts is in the same folder
import { Auto } from '@/types/auto';

export async function getAutosAction() {
    // For reading, we use the standard client. 
    // If specific RLS is needed for reading that requires auth, we might need to adjust,
    // but usually public reading is allowed or handled by anon key if configured.
    // If this is strictly admin only, we should protect it too.
    // For now assuming existing behavior for read is fine (anon/authenticated).
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from('Autos')
        .select('*')
        .order('id', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Auto[];
}

export async function deleteAutoAction(id: number) {
    // Verificar autenticación
    const user = await getSessionUser();
    if (!user) {
        throw new Error('No autorizado');
    }

    // Usar admin client para la operación de base de datos
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('Autos')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
}

export async function createAutoAction(auto: Partial<Auto>) {
    // Verificar autenticación
    const user = await getSessionUser();
    if (!user) {
        throw new Error('No autorizado');
    }

    // Usar admin client para la operación de base de datos
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('Autos')
        .insert(auto);

    if (error) throw new Error(error.message);
    return true;
}

export async function updateAutoAction(id: number, updates: Partial<Auto>) {
    console.log('updateAutoAction called for id:', id);

    // 1. Verificar autenticación usando la utilidad robusta
    const user = await getSessionUser();

    if (!user) {
        console.error('Unauthorized attempt to update auto');
        throw new Error('No autorizado: Debes iniciar sesión');
    }

    console.log('User authorized:', user.id);

    // 2. Usar Admin Client para la escritura (bypassing RLS)
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('Autos')
        .update(updates)
        .eq('id', id)
        .select();

    if (error) {
        console.error('Error updating auto with admin client:', error.message);
        throw new Error(error.message);
    }

    console.log('Update successful:', data);
    return true;
}

// Storage Action
export async function getUploadParams(filename: string) {
    const user = await getSessionUser();
    if (!user) {
        throw new Error('No autorizado');
    }

    const supabase = createAdminClient();

    // createSignedUploadUrl genera una URL para hacer un PUT
    const { data: uploadData, error } = await supabase.storage
        .from('autos-fotos')
        .createSignedUploadUrl(filename);

    if (error) throw new Error(error.message);

    // URL para ver (Public)
    const { data: publicUrlData } = supabase.storage
        .from('autos-fotos')
        .getPublicUrl(uploadData.path);

    return {
        signedUrl: uploadData.signedUrl,
        path: uploadData.path,
        publicUrl: publicUrlData.publicUrl
    };
}

export async function deleteFileAction(filename: string) {
    const user = await getSessionUser();
    if (!user) {
        throw new Error('No autorizado');
    }

    const supabase = createAdminClient();
    const { error } = await supabase.storage
        .from('autos-fotos')
        .remove([filename]);

    if (error) throw new Error(error.message);
}
