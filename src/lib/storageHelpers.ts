import { supabase } from './supabaseClient';

/**
 * Sube múltiples archivos al bucket de Supabase
 */
export async function uploadFiles(
    files: File[],
    bucketName: string = 'autos-fotos'
): Promise<string[]> {
    const urls: string[] = [];

    for (const file of files) {
        const uniqueName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(uniqueName, file);

        if (error) {
            throw new Error(`Error al subir archivo: ${error.message}`);
        }

        const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(uniqueName);

        urls.push(urlData.publicUrl);
    }

    return urls;
}

/**
 * Elimina archivos del storage de Supabase
 */
export async function deleteFiles(
    urls: string[],
    bucketName: string = 'autos-fotos'
): Promise<void> {
    for (const url of urls) {
        const fileName = getFileNameFromUrl(url);
        const { error } = await supabase.storage
            .from(bucketName)
            .remove([fileName]);

        if (error) {
            console.warn('Error al eliminar archivo del storage:', error);
        }
    }
}

/**
 * Extrae el nombre del archivo de una URL pública
 */
export function getFileNameFromUrl(url: string): string {
    return url.split('/').pop() || '';
}

/**
 * Verifica si una URL es un video
 */
export function isVideoUrl(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return (
        lowerUrl.includes('.mp4') ||
        lowerUrl.includes('.webm') ||
        lowerUrl.includes('.ogg')
    );
}
