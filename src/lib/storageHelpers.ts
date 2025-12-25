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
