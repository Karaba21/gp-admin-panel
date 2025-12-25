import { useEffect, useState } from 'react';
import { Auto } from '@/types/auto';
import { getAutosAction, deleteAutoAction, deleteFileAction } from '@/app/actions/autos';
import { isVideoUrl, getFileNameFromUrl } from '@/lib/storageHelpers';
import EditAutoModal from './EditAutoModal';

export default function AutosList() {
    const [autos, setAutos] = useState<Auto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingAuto, setEditingAuto] = useState<Auto | null>(null);

    const loadAutos = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await getAutosAction();
            setAutos(data || []);
        } catch (err) {
            setError('Error al cargar autos: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAutos();
    }, []);

    const handleDelete = async (auto: Auto) => {
        if (!confirm(`¿Estás seguro de que quieres eliminar el auto "${auto.marca} ${auto.modelo}"?`)) {
            return;
        }

        try {
            // Eliminar archivos del storage mediante Action
            if (auto.imagenes && auto.imagenes.length > 0) {
                for (const url of auto.imagenes) {
                    const filename = getFileNameFromUrl(url);
                    if (filename) await deleteFileAction(filename);
                }
            }

            // Eliminar auto de la base de datos
            await deleteAutoAction(auto.id);

            alert('Auto eliminado correctamente ✅');
            loadAutos();
        } catch (err) {
            alert('Error al eliminar auto: ' + (err as Error).message);
        }
    };

    if (loading) {
        return <div className="autos-lista"><p>Cargando autos...</p></div>;
    }

    if (error) {
        return <div className="autos-lista"><p style={{ color: 'red' }}>{error}</p></div>;
    }

    if (autos.length === 0) {
        return <div className="autos-lista"><p>No hay autos publicados.</p></div>;
    }

    return (
        <>
            <div className="autos-lista">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Autos Publicados ({autos.length})</h3>
                    <button className="btn-refresh" onClick={loadAutos}>
                        🔄 Actualizar
                    </button>
                </div>

                {autos.map((auto) => (
                    <div key={auto.id} className="auto-item">
                        <div className="auto-header">
                            <h4 className="auto-title">
                                {auto.marca} {auto.modelo}
                                {auto.en_oferta && <span className="oferta-badge">OFERTA</span>}
                                {auto.vendido && <span className="vendido-badge">VENDIDO</span>}
                                {auto.reservado && <span className="reservado-badge">RESERVADO</span>}
                            </h4>
                            <div>
                                {auto.en_oferta && auto.precio_oferta ? (
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.9rem' }}>
                                            ${Number(auto.precio).toLocaleString()}
                                        </div>
                                        <div className="precio-oferta">
                                            ${Number(auto.precio_oferta).toLocaleString()}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="auto-price">
                                        ${Number(auto.precio).toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="auto-details">
                            <strong>Año:</strong> {auto.año} | <strong>ID:</strong> {auto.id}
                            {auto.en_oferta && ' | '}
                            {auto.en_oferta && <strong style={{ color: '#dc3545' }}>EN OFERTA</strong>}
                            {auto.vendido && ' | '}
                            {auto.vendido && <strong style={{ color: '#28a745' }}>VENDIDO</strong>}
                            {auto.reservado && ' | '}
                            {auto.reservado && <strong style={{ color: '#ffc107' }}>RESERVADO</strong>}
                        </div>

                        {auto.descripcion && (
                            <p style={{ margin: '0.5rem 0', color: '#666' }}>{auto.descripcion}</p>
                        )}

                        {auto.imagenes && auto.imagenes.length > 0 && (
                            <div className="auto-images">
                                {auto.imagenes.map((media, index) => {
                                    if (isVideoUrl(media)) {
                                        return (
                                            <video
                                                key={index}
                                                className="auto-image"
                                                controls
                                                style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                                            >
                                                <source src={media} type="video/mp4" />
                                                Tu navegador no soporta videos.
                                            </video>
                                        );
                                    } else {
                                        return (
                                            <img
                                                key={index}
                                                src={media}
                                                alt="Imagen del auto"
                                                className="auto-image"
                                            />
                                        );
                                    }
                                })}
                            </div>
                        )}

                        <div className="auto-actions">
                            <button className="btn-edit" onClick={() => setEditingAuto(auto)}>
                                ✏️ Editar
                            </button>
                            <button className="btn-delete" onClick={() => handleDelete(auto)}>
                                🗑️ Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {editingAuto && (
                <EditAutoModal
                    auto={editingAuto}
                    onClose={() => setEditingAuto(null)}
                    onSave={() => {
                        setEditingAuto(null);
                        loadAutos();
                    }}
                />
            )}
        </>
    );
}
