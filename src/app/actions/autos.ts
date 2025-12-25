'use server';

import { createServerClient } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';
import { Auto } from '@/types/auto';

async function getAuthClient() {
    const supabase = await createServerClient();
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    if (token) {
        await supabase.auth.setSession({
            access_token: token,
            refresh_token: '' // No necesitamos refresh para una llamada puntual
        });
    }
    return supabase;
}

export async function getAutosAction() {
    const supabase = await getAuthClient();
    const { data, error } = await supabase
        .from('Autos')
        .select('*')
        .order('id', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Auto[];
}

export async function deleteAutoAction(id: number) {
    const supabase = await getAuthClient();
    const { error } = await supabase
        .from('Autos')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
}

export async function createAutoAction(auto: Partial<Auto>) {
    const supabase = await getAuthClient();
    const { error } = await supabase
        .from('Autos')
        .insert(auto);

    if (error) throw new Error(error.message);
    return true;
}

export async function updateAutoAction(id: number, updates: Partial<Auto>) {
    const supabase = await getAuthClient();
    const { error } = await supabase
        .from('Autos')
        .update(updates)
        .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
}

// Storage Action
export async function getUploadParams(filename: string) {
    // Necesitamos usar service role o el usuario autenticado para generar la URL?
    // Si la politica permite upload a autenticados, entonces authenticated client.
    const supabase = await getAuthClient();

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
    const supabase = await getAuthClient();
    const { error } = await supabase.storage
        .from('autos-fotos')
        .remove([filename]);

    if (error) throw new Error(error.message);
}
