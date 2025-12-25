'use client';

import { useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';

interface Lead {
    full_name: string;
    email: string;
    phone: string;
}

interface Coupon {
    id: string;
    coupon_code: string;
    status: 'issued' | 'redeemed' | 'void';
    issued_at: string;
    redeemed_at?: string;
}

interface SearchResult {
    found: boolean;
    coupon?: Coupon;
    lead?: Lead | null;
}

export default function CouponVerifier() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SearchResult | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch(`/api/admin/coupon?code=${encodeURIComponent(code)}`);
            if (!res.ok) throw new Error('Error buscando cupón');
            const data = await res.json();
            setResult(data);
            if (!data.found) {
                toast.error('Cupón no encontrado');
            }
        } catch (error) {
            console.error(error);
            toast.error('Ocurrió un error al buscar');
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async () => {
        if (!result?.coupon) return;

        if (!confirm('¿Estás seguro de que deseas marcar este cupón como usado? Esta acción no se puede deshacer.')) {
            return;
        }

        const toastId = toast.loading('Procesando canje...');

        try {
            const res = await fetch('/api/admin/coupon/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: result.coupon.coupon_code }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al canjear');
            }

            toast.success('¡Cupón canjeado exitosamente!', { id: toastId });

            // Actualizar estado local
            setResult((prev) =>
                prev && prev.coupon
                    ? {
                        ...prev,
                        coupon: {
                            ...prev.coupon,
                            status: 'redeemed',
                            redeemed_at: new Date().toISOString(),
                        }
                    }
                    : prev
            );

        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Error al canjear', { id: toastId });
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        // Ajustar a la zona horaria local o mostrar como string simple si hay problemas
        return new Date(dateStr).toLocaleString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="coupon-verifier">
            <Toaster position="top-right" toastOptions={{
                style: {
                    background: '#333',
                    color: '#fff',
                }
            }} />

            <form onSubmit={handleSearch} className="mb-8">
                <label htmlFor="coupon-input">Código del Cupón</label>
                <div className="flex gap-4">
                    <input
                        id="coupon-input"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Ej: GP-XXXXXX"
                        className="flex-1 uppercase font-mono tracking-wider"
                        required
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !code.trim()}
                        style={{ marginTop: 0, width: 'auto' }}
                    >
                        {loading ? '...' : 'Buscar'}
                    </button>
                </div>
            </form>

            {result && !result.found && (
                <div className="p-8 text-center border-2 border-dashed border-gray-600 rounded-2xl bg-white/5">
                    <p className="text-xl text-gray-400">🚫 Cupón no encontrado</p>
                </div>
            )}

            {result && result.found && result.coupon && (
                <div className="animate-fade-in space-y-6">

                    {/* Status Badge Area */}
                    <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10">
                        <div>
                            <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Cupón</p>
                            <h2 className="text-3xl font-bold font-mono text-[var(--accent-primary)] tracking-wide">
                                {result.coupon.coupon_code}
                            </h2>
                        </div>

                        <div className={`mt-4 md:mt-0 px-6 py-2 rounded-xl font-bold text-lg uppercase tracking-wider ${result.coupon.status === 'issued'
                                ? 'bg-[var(--accent-success)] text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                                : result.coupon.status === 'redeemed'
                                    ? 'bg-[var(--accent-warning)] text-white'
                                    : 'bg-[var(--accent-danger)] text-white'
                            }`}>
                            {result.coupon.status === 'issued' ? 'ACTIVO' :
                                result.coupon.status === 'redeemed' ? 'CANJEADO' : 'ANULADO'}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Info Container */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h3 className="text-[var(--accent-secondary)] font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Información del Cupón</h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-gray-400 text-sm block">Generado el:</span>
                                    <span className="text-lg">{formatDate(result.coupon.issued_at)}</span>
                                </div>
                                {result.coupon.redeemed_at && (
                                    <div>
                                        <span className="text-gray-400 text-sm block">Canjeado el:</span>
                                        <span className="text-[var(--accent-warning)] text-lg font-bold">{formatDate(result.coupon.redeemed_at)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lead Info */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h3 className="text-[var(--accent-secondary)] font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Datos del Cliente</h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-gray-400 text-sm block">Nombre:</span>
                                    <span className="text-lg">{result.lead?.full_name || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 text-sm block">Email:</span>
                                    <span className="text-lg">{result.lead?.email || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 text-sm block">Teléfono:</span>
                                    <span className="text-lg">{result.lead?.phone || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-white/10">
                        <button
                            onClick={handleRedeem}
                            disabled={result.coupon.status !== 'issued'}
                            className="w-full py-4 text-xl"
                            style={{
                                background: result.coupon.status === 'issued' ? 'var(--gradient-success)' : 'rgba(255,255,255,0.1)',
                                cursor: result.coupon.status === 'issued' ? 'pointer' : 'not-allowed',
                                opacity: result.coupon.status === 'issued' ? 1 : 0.5
                            }}
                        >
                            {result.coupon.status === 'issued' ? '✅ MARCAR COMO USADO' : 'CUPÓN YA PROCESADO'}
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
}
