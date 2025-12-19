/**
 * Comprime una imagen usando canvas y toBlob
 * @param file - Archivo de imagen a comprimir
 * @param quality - Calidad de compresión (0-1), default 0.7
 * @param maxWidth - Ancho máximo, default 1920
 * @param maxHeight - Alto máximo, default 1080
 * @returns Promise con el archivo comprimido
 */
export async function compressImage(
    file: File,
    quality: number = 0.7,
    maxWidth: number = 1920,
    maxHeight: number = 1080
): Promise<File> {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const img = new Image();

        img.onload = function () {
            // Calcular nuevas dimensiones manteniendo la proporción
            const { width, height } = calculateDimensions(
                img.width,
                img.height,
                maxWidth,
                maxHeight
            );

            // Configurar canvas
            canvas.width = width;
            canvas.height = height;

            // Dibujar imagen redimensionada
            ctx.drawImage(img, 0, 0, width, height);

            // Convertir a blob con compresión
            canvas.toBlob(
                (blob) => {
                    // Crear nuevo archivo con el blob comprimido
                    const compressedFile = new File([blob!], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                },
                'image/jpeg',
                quality
            );
        };

        img.src = URL.createObjectURL(file);
    });
}

/**
 * Calcula dimensiones manteniendo proporción
 */
function calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    // Si la imagen es más grande que los límites, redimensionar
    if (width > maxWidth || height > maxHeight) {
        const ratioWidth = maxWidth / width;
        const ratioHeight = maxHeight / height;
        const ratio = Math.min(ratioWidth, ratioHeight);

        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
    }

    return { width, height };
}

/**
 * Comprime múltiples archivos (solo imágenes, mantiene videos sin cambios)
 */
export async function compressFiles(
    files: File[],
    quality: number = 0.7
): Promise<File[]> {
    const compressedFiles: File[] = [];

    for (const file of files) {
        // Solo comprimir imágenes, no videos
        if (file.type.startsWith('image/')) {
            const compressed = await compressImage(file, quality);
            compressedFiles.push(compressed);
        } else {
            // Para videos, mantener el archivo original
            compressedFiles.push(file);
        }
    }

    return compressedFiles;
}

/**
 * Muestra información de compresión en consola
 */
export function showCompressionInfo(
    originalFiles: File[],
    compressedFiles: File[]
): void {
    let originalSize = 0;
    let compressedSize = 0;

    for (let i = 0; i < originalFiles.length; i++) {
        if (originalFiles[i].type.startsWith('image/')) {
            originalSize += originalFiles[i].size;
            compressedSize += compressedFiles[i].size;
        }
    }

    const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    const originalMB = (originalSize / 1024 / 1024).toFixed(2);
    const compressedMB = (compressedSize / 1024 / 1024).toFixed(2);

    console.log(`📊 Compresión completada:`);
    console.log(`   Tamaño original: ${originalMB} MB`);
    console.log(`   Tamaño comprimido: ${compressedMB} MB`);
    console.log(`   Reducción: ${reduction}%`);
}
