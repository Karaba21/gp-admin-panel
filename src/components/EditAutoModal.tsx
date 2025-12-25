import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { Auto } from '@/types/auto';
import { compressFiles } from '@/lib/imageCompression';
import { isVideoUrl, getFileNameFromUrl } from '@/lib/storageHelpers';
import { updateAutoAction, deleteFileAction, getUploadParams } from '@/app/actions/autos';

interface EditAutoModalProps {
    auto: Auto;
    onClose: () => void;
    onSave: () => void;
}

export default function EditAutoModal({ auto, onClose, onSave }: EditAutoModalProps) {
    const [marca, setMarca] = useState(auto.marca);
    const [modelo, setModelo] = useState(auto.modelo);
    const [año, setAño] = useState(auto.año.toString());
    const [precio, setPrecio] = useState(auto.precio.toString());
    const [descripcion, setDescripcion] = useState(auto.descripcion || '');
    const [enOferta, setEnOferta] = useState(auto.en_oferta);
    const [precioOferta, setPrecioOferta] = useState(auto.precio_oferta?.toString() || '');
    const [vendido, setVendido] = useState(auto.vendido);
    const [reservado, setReservado] = useState(auto.reservado);
    const [currentFiles, setCurrentFiles] = useState<string[]>(auto.imagenes || []);
    const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
    const [newFiles, setNewFiles] = useState<FileList | null>(null);
    const [estado, setEstado] = useState('');
    const [loading, setLoading] = useState(false);

    const handleNewFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
        setNewFiles(e.target.files);
    };

    const markFileForDeletion = (fileUrl: string) => {
        if (confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
            setFilesToDelete([...filesToDelete, fileUrl]);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Validaciones
        if (enOferta && (!precioOferta || parseFloat(precioOferta) <= 0)) {
            alert('Si el auto está en oferta, debes ingresar un precio de oferta válido');
            return;
        }

        if (enOferta && parseFloat(precioOferta) >= parseFloat(precio)) {
            alert('El precio de oferta debe ser menor al precio original');
            return;
        }

        setLoading(true);
        setEstado('Actualizando auto...');

        try {
            // Procesar archivos
            let finalFiles = currentFiles.filter(file => !filesToDelete.includes(file));

            // Subir nuevos archivos si los hay
            if (newFiles && newFiles.length > 0) {
                setEstado('Procesando nuevas imágenes...');
                const newFilesArray = Array.from(newFiles);
                const compressedFiles = await compressFiles(newFilesArray, 0.7);

                const uploadedUrls: string[] = [];
                for (const file of compressedFiles) {
                    const uniqueName = `${Date.now()}-${file.name}`;
                    const { signedUrl, publicUrl } = await getUploadParams(uniqueName);

                    await fetch(signedUrl, {
                        method: 'PUT',
                        body: file,
                        headers: { 'Content-Type': file.type }
                    });
                    uploadedUrls.push(publicUrl);
                }

                finalFiles = [...finalFiles, ...uploadedUrls];
            }

            // Eliminar archivos del storage
            if (filesToDelete.length > 0) {
                setEstado('Eliminando archivos...');
                for (const url of filesToDelete) {
                    const filename = getFileNameFromUrl(url);
                    if (filename) await deleteFileAction(filename);
                }
            }

            setEstado('Guardando cambios...');

            // Actualizar en base de datos
            await updateAutoAction(auto.id, {
                marca,
                modelo,
                año: parseInt(año),
                precio: parseFloat(precio),
                descripcion,
                en_oferta: enOferta,
                precio_oferta: enOferta ? parseFloat(precioOferta) : null,
                vendido,
                reservado,
                imagenes: finalFiles,
            });

            setEstado('Auto actualizado correctamente ✅');
            setTimeout(() => {
                onSave();
            }, 500);
        } catch (error) {
            setEstado('Error al actualizar auto: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay show">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">Editar Auto</h3>
                    <button className="close-modal" onClick={onClose} disabled={loading}>
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="edit-marca">Marca</label>
                        <input
                            id="edit-marca"
                            type="text"
                            value={marca}
                            onChange={(e) => setMarca(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-modelo">Modelo</label>
                        <input
                            id="edit-modelo"
                            type="text"
                            value={modelo}
                            onChange={(e) => setModelo(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-año">Año</label>
                        <input
                            id="edit-año"
                            type="number"
                            value={año}
                            onChange={(e) => setAño(e.target.value)}
                            required
                            min="1900"
                            max="2030"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-precio">Precio Original</label>
                        <input
                            id="edit-precio"
                            type="number"
                            value={precio}
                            onChange={(e) => setPrecio(e.target.value)}
                            required
                            min="0"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-descripcion">Descripción</label>
                        <textarea
                            id="edit-descripcion"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            rows={4}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>Oferta</label>
                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="edit-en-oferta"
                                checked={enOferta}
                                onChange={(e) => setEnOferta(e.target.checked)}
                                disabled={loading}
                            />
                            <label htmlFor="edit-en-oferta">Marcar como oferta</label>
                        </div>

                        <div className={`precio-oferta-group ${enOferta ? 'show' : ''}`}>
                            <label htmlFor="edit-precio-oferta">Precio de Oferta</label>
                            <input
                                id="edit-precio-oferta"
                                type="number"
                                value={precioOferta || ''}
                                onChange={(e) => setPrecioOferta(e.target.value)}
                                min="0"
                                placeholder="Ingresa el precio con descuento"
                                disabled={loading}
                            />
                            <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                                Este precio se mostrará como precio de oferta en el sitio web
                            </small>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Estado de Venta</label>
                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="edit-vendido"
                                checked={vendido}
                                onChange={(e) => setVendido(e.target.checked)}
                                disabled={loading}
                            />
                            <label htmlFor="edit-vendido">Marcar como vendido</label>
                        </div>
                        <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                            Marca este auto como vendido. El auto permanecerá en la base de datos pero se puede ocultar del sitio web.
                        </small>
                    </div>

                    <div className="form-group">
                        <label>Estado de Reserva</label>
                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="edit-reservado"
                                checked={reservado}
                                onChange={(e) => setReservado(e.target.checked)}
                                disabled={loading}
                            />
                            <label htmlFor="edit-reservado">Marcar como reservado</label>
                        </div>
                        <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                            Marca este auto como reservado. El auto permanecerá visible pero con indicación de que está reservado.
                        </small>
                    </div>

                    <div className="form-group">
                        <label>Archivos Actuales</label>
                        <div style={{ marginTop: '0.5rem' }}>
                            {currentFiles.length === 0 ? (
                                <p style={{ color: '#666', fontStyle: 'italic' }}>No hay archivos subidos</p>
                            ) : (
                                <div className="current-files-container">
                                    {currentFiles.map((fileUrl, index) => {
                                        const isMarkedForDeletion = filesToDelete.includes(fileUrl);
                                        const isVideo = isVideoUrl(fileUrl);

                                        return (
                                            <div
                                                key={index}
                                                className={`file-preview-item ${isMarkedForDeletion ? 'file-marked-for-deletion' : ''}`}
                                            >
                                                {isVideo ? (
                                                    <video controls style={{ width: '80px', height: '60px', objectFit: 'cover' }}>
                                                        <source src={fileUrl} type="video/mp4" />
                                                    </video>
                                                ) : (
                                                    <img src={fileUrl} alt={`Archivo ${index + 1}`} style={{ width: '80px', height: '60px', objectFit: 'cover' }} />
                                                )}
                                                <button
                                                    type="button"
                                                    className="file-delete-btn"
                                                    onClick={() => markFileForDeletion(fileUrl)}
                                                    disabled={isMarkedForDeletion || loading}
                                                    title="Eliminar archivo"
                                                >
                                                    {isMarkedForDeletion ? '✓' : '×'}
                                                </button>
                                                <div className="file-type-badge">{isVideo ? 'VIDEO' : 'IMG'}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-nuevos-archivos">Agregar Nuevos Archivos (Opcional)</label>
                        <input
                            id="edit-nuevos-archivos"
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleNewFilesChange}
                            disabled={loading}
                        />
                        <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                            Selecciona nuevas imágenes o videos para agregar a los existentes
                        </small>
                    </div>

                    <button type="submit" className="btn-save" disabled={loading}>
                        💾 {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                    <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                        ❌ Cancelar
                    </button>
                </form>

                {estado && <p style={{ marginTop: '1rem', textAlign: 'center' }}>{estado}</p>}
            </div>
        </div>
    );
}
