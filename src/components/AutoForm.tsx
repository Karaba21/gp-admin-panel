'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { compressFiles } from '@/lib/imageCompression';
import { createAutoAction, getUploadParams } from '@/app/actions/autos';

export default function AutoForm() {
    const [marca, setMarca] = useState('');
    const [modelo, setModelo] = useState('');
    const [año, setAño] = useState('');
    const [precio, setPrecio] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [files, setFiles] = useState<FileList | null>(null);
    const [estado, setEstado] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFiles(e.target.files);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setEstado('Procesando imágenes...');
        setLoading(true);

        try {
            // Comprimir archivos (solo imágenes)
            const filesArray = files ? Array.from(files) : [];
            const compressedFiles = await compressFiles(filesArray, 0.7);

            // Subir archivos mediante Signed URLs
            const uploadedUrls: string[] = [];
            for (const file of compressedFiles) {
                const uniqueName = `${Date.now()}-${file.name}`;
                const { signedUrl, publicUrl } = await getUploadParams(uniqueName);

                await fetch(signedUrl, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        'Content-Type': file.type
                    }
                });

                uploadedUrls.push(publicUrl);
            }

            // Insertar en base de datos llamando al Server Action
            await createAutoAction({
                marca,
                modelo,
                año: parseInt(año),
                precio: parseFloat(precio),
                descripcion,
                imagenes: uploadedUrls,
            });

            setEstado('Auto subido correctamente ✅');
            // Limpiar formulario
            setMarca('');
            setModelo('');
            setAño('');
            setPrecio('');
            setDescripcion('');
            setFiles(null);
            // Reset file input
            const fileInput = document.getElementById('imagenes') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (error) {
            setEstado('Error: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <form id="auto-form" onSubmit={handleSubmit}>
                <label>
                    Marca
                    <input
                        type="text"
                        value={marca}
                        onChange={(e) => setMarca(e.target.value)}
                        required
                        disabled={loading}
                    />
                </label>
                <label>
                    Modelo
                    <input
                        type="text"
                        value={modelo}
                        onChange={(e) => setModelo(e.target.value)}
                        required
                        disabled={loading}
                    />
                </label>
                <label>
                    Año
                    <input
                        type="number"
                        value={año}
                        onChange={(e) => setAño(e.target.value)}
                        required
                        min="1900"
                        max="2030"
                        disabled={loading}
                    />
                </label>
                <label>
                    Precio
                    <input
                        type="number"
                        value={precio}
                        onChange={(e) => setPrecio(e.target.value)}
                        required
                        min="0"
                        disabled={loading}
                    />
                </label>
                <label>
                    Descripción
                    <textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        rows={4}
                        disabled={loading}
                    />
                </label>
                <label>
                    Imágenes y Videos (múltiples)
                    <input
                        id="imagenes"
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleFileChange}
                        disabled={loading}
                    />
                </label>
                <button type="submit" disabled={loading}>
                    {loading ? 'Subiendo...' : 'Subir auto'}
                </button>
            </form>
            {estado && <p id="estado">{estado}</p>}
        </div>
    );
}
