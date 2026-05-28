'use client';

import { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';

interface Lead {
    full_name: string;
    email: string;
    phone: string;
}

interface Coupon {
    id: string;
    coupon_code: string;
    status: 'issued' | 'redeemed' | 'void'; // Keeping status for compatibility but relying on validated field
    issued_at: string;
    validated: boolean;
    validated_at?: string;
    validated_by?: string;
    notes?: string;
    lead?: Lead;
}

export default function CouponVerifier() {
    const [searchCode, setSearchCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [recentCoupons, setRecentCoupons] = useState<Coupon[]>([]);
    const [filter, setFilter] = useState<'all' | 'validated' | 'unvalidated'>('all');
    const [editingNotes, setEditingNotes] = useState(false);
    const [notesBuffer, setNotesBuffer] = useState('');

    const fetchCoupons = async () => {
        try {
            const res = await fetch(`/api/admin/coupons?filter=${filter}&limit=20`);
            const data = await res.json();
            if (data.coupons) {
                setRecentCoupons(data.coupons);
            }
        } catch (error) {
            console.error('Error fetching list:', error);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, [filter]);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchCode.trim()) return;

        setLoading(true);
        setSelectedCoupon(null);

        try {
            const res = await fetch(`/api/admin/coupon?code=${encodeURIComponent(searchCode)}`);
            const data = await res.json();

            if (data.found && data.coupon) {
                setSelectedCoupon({ ...data.coupon, lead: data.lead });
                setNotesBuffer(data.coupon.notes || '');
            } else {
                toast.error('Cupón no encontrado');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al buscar');
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async () => {
        if (!selectedCoupon) return;
        const toastId = toast.loading('Validando cupón...');

        try {
            const res = await fetch('/api/admin/coupon/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: selectedCoupon.coupon_code,
                    notes: notesBuffer
                }),
            });

            if (!res.ok) throw new Error('Error al validar');

            toast.success('¡Cupón validado!', { id: toastId });

            // Refresh
            handleSearch();
            fetchCoupons();
        } catch (error) {
            toast.error('Falló la validación', { id: toastId });
        }
    };

    const handleUnvalidate = async () => {
        if (!selectedCoupon) return;
        if (!confirm('¿Seguro deseas anular la validación de este cupón?')) return;

        const toastId = toast.loading('Anulando validación...');

        try {
            const res = await fetch('/api/admin/coupon/unvalidate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: selectedCoupon.coupon_code }),
            });

            if (!res.ok) throw new Error('Error al anular');

            toast.success('Validación anulada', { id: toastId });

            // Refresh
            handleSearch();
            fetchCoupons();
        } catch (error) {
            toast.error('Falló la anulación', { id: toastId });
        }
    };

    const saveNotes = async () => {
        if (!selectedCoupon) return;
        // We reuse the validate endpoint or imply a separate one. 
        // The requirements mentioned "(Opcional) POST /api/admin/coupon/notes", 
        // but explicitely said "Validar compra... si hay notes, guardar notes".
        // Let's just use validate endpoint efficiently purely for notes 
        // OR simply re-validate which is idempotent.
        // Or better, just call validate again with new notes. 
        // IF validated=false, calling validate will validate it. 
        // If we want to save notes WITHOUT validating, we might need a separate call 
        // but for now let's assume notes are mostly relevant for validation context.
        // Actually, let's just use the validate endpoint which updates notes too if provided.
        // CAUTION: If it's not validated, this will validate it. 
        // If user wants to just add notes to an unvalidated coupon? 
        // The prompt says "Guardar notas (si se edita)".
        // I'll implement a dedicated simple fetch for just notes update if needed,
        // but for speed I will use the validate endpoint and warn if it changes status, 
        // OR simply create that optional endpoint. 
        // Let's stick to Validate doing both for now as per "Validar compra debe setear... si hay notes, guardar notes".

        // If already validated, re-validating updates notes. Perfect.
        // If NOT validated, checking "Guardar notas" might trigger validation? 
        // Let's assumes notes are editable always. 
        // I'll add a quick specific handle for just notes if I had the endpoint.
        // For now, I'll use validate endpoint but ONLY if validated. 
        // If not validated yet, I will warn user "Esto también validará el cupón".

        if (!selectedCoupon.validated) {
            if (!confirm("Guardar notas también validará el cupón. ¿Continuar?")) return;
        }

        await handleValidate();
        setEditingNotes(false);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('es-AR', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="coupon-verifier space-y-8">
            <Toaster position="top-center" toastOptions={{
                style: { background: '#222', color: '#fff', border: '1px solid #333' }
            }} />

            {/* Top Section: Search & Filter */}
            <div className="flex flex-col md:flex-row gap-6">

                {/* Search Box */}
                <div className="flex-1 bg-white/5 p-6 rounded-2xl border border-white/10">
                    <h3 className="text-lg font-bold mb-4 opacity-80">🔍 Buscar Cupón</h3>
                    <form onSubmit={handleSearch} className="flex gap-4 items-center">
                        <input
                            type="text"
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value)}
                            placeholder="GP-XXXXXX"
                            className="w-48 bg-black/20 border border-white/10 rounded-xl px-4 py-3 font-mono font-bold text-lg uppercase tracking-wider focus:border-[var(--accent-primary)] outline-none transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[var(--accent-primary)] text-black font-black text-sm uppercase tracking-widest px-8 py-3 rounded-xl hover:brightness-110 disabled:opacity-50 hover:scale-105 transition-all shadow-lg shadow-[var(--accent-primary)]/20"
                        >
                            {loading ? '...' : 'BUSCAR'}
                        </button>
                    </form>
                </div>

                {/* Filters */}
                <div className="flex-1 bg-white/5 p-6 rounded-2xl border border-white/10">
                    <h3 className="text-lg font-bold mb-4 opacity-80">📋 Filtros de Lista</h3>
                    <div className="flex gap-2">
                        {(['all', 'validated', 'unvalidated'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg capitalize ${filter === f ? 'bg-white text-black font-bold' : 'bg-black/20 text-white/60 hover:bg-white/10'}`}
                            >
                                {f === 'all' ? 'Todos' : f === 'validated' ? 'Validados' : 'Sin Validar'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid lg:grid-cols-2 gap-8">

                {/* Left: Recent List */}
                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10 bg-black/20">
                        <h3 className="font-bold">Últimos Cupones</h3>
                    </div>
                    <div className="max-h-[600px] overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-white/40 bg-white/5 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Código</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentCoupons.map((c) => (
                                    <tr
                                        key={c.id}
                                        className={`hover:bg-white/5 cursor-pointer transition-colors ${selectedCoupon?.id === c.id ? 'bg-white/10' : ''}`}
                                        onClick={() => {
                                            setSelectedCoupon(c);
                                            setNotesBuffer(c.notes || '');
                                        }}
                                    >
                                        <td className="px-4 py-3 font-mono font-medium">{c.coupon_code}</td>
                                        <td className="px-4 py-3">
                                            {c.validated ?
                                                <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs border border-green-500/20">Validado</span> :
                                                <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs border border-yellow-500/20">Pendiente</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-white/60">{formatDate(c.issued_at)}</td>
                                    </tr>
                                ))}
                                {recentCoupons.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-white/30">
                                            No hay cupones recientes
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Detail Card */}
                <div className="space-y-6">
                    {selectedCoupon ? (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl animate-fade-in">
                            {/* Header */}
                            <div style={{ padding: '28px 32px 22px 32px', borderBottom: '1px solid #f3f4f6' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                                    <p style={{ margin: 0, color: '#9ca3af', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Detalle del Cupón</p>
                                    <span style={{
                                        flexShrink: 0, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                                        textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid',
                                        background: selectedCoupon.validated ? '#f0fdf4' : '#fffbeb',
                                        color: selectedCoupon.validated ? '#16a34a' : '#d97706',
                                        borderColor: selectedCoupon.validated ? '#bbf7d0' : '#fde68a',
                                    }}>
                                        {selectedCoupon.validated ? '✓ Validado' : 'Sin validar'}
                                    </span>
                                </div>
                                <h2 style={{ margin: 0, fontFamily: 'monospace', fontSize: 30, fontWeight: 700, color: '#111827', letterSpacing: '0.05em' }}>{selectedCoupon.coupon_code}</h2>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {/* Lead Info */}
                                <div>
                                    <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>Datos del Cliente</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 16px', minWidth: 0 }}>
                                            <span style={{ display: 'block', color: '#9ca3af', fontSize: 11, marginBottom: 4 }}>Nombre</span>
                                            <span style={{ fontWeight: 600, color: '#1f2937', fontSize: 14, wordBreak: 'break-word' }}>{selectedCoupon.lead?.full_name || '-'}</span>
                                        </div>
                                        <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 16px', minWidth: 0 }}>
                                            <span style={{ display: 'block', color: '#9ca3af', fontSize: 11, marginBottom: 4 }}>Teléfono</span>
                                            <span style={{ fontWeight: 600, color: '#1f2937', fontSize: 14, wordBreak: 'break-word' }}>{selectedCoupon.lead?.phone || '-'}</span>
                                        </div>
                                        <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 16px', gridColumn: '1 / -1', minWidth: 0 }}>
                                            <span style={{ display: 'block', color: '#9ca3af', fontSize: 11, marginBottom: 4 }}>Email</span>
                                            <span style={{ fontWeight: 600, color: '#1f2937', fontSize: 14, wordBreak: 'break-all' }}>{selectedCoupon.lead?.email || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Timestamps */}
                                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
                                    <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>Historial</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#6b7280' }}>Emitido:</span>
                                            <span style={{ color: '#374151', fontWeight: 500 }}>{formatDate(selectedCoupon.issued_at)}</span>
                                        </div>
                                        {selectedCoupon.validated_at && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#6b7280' }}>Validado:</span>
                                                <span style={{ color: '#16a34a', fontWeight: 600 }}>{formatDate(selectedCoupon.validated_at)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>Notas</p>
                                        <button
                                            onClick={() => setEditingNotes(!editingNotes)}
                                            style={{ width: 'auto', marginTop: 0, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: editingNotes ? '#fee2e2' : '#f3f4f6', color: editingNotes ? '#dc2626' : '#374151', border: 'none', cursor: 'pointer' }}
                                        >
                                            {editingNotes ? 'Cancelar' : 'Editar'}
                                        </button>
                                    </div>
                                    {editingNotes ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <textarea
                                                style={{ width: '100%', boxSizing: 'border-box', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, fontSize: 14, color: '#1f2937', resize: 'none', height: 96, outline: 'none', fontFamily: 'inherit' }}
                                                value={notesBuffer}
                                                onChange={(e) => setNotesBuffer(e.target.value)}
                                                placeholder="Agregar notas internas..."
                                            />
                                            <button
                                                onClick={saveNotes}
                                                style={{ width: 'auto', marginTop: 0, padding: '8px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, background: '#1e40af', color: '#fff', border: 'none', cursor: 'pointer' }}
                                            >
                                                Guardar notas
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 16px', minHeight: 60, fontSize: 14, color: '#6b7280', fontStyle: 'italic' }}>
                                            {selectedCoupon.notes || 'Sin notas.'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div style={{ padding: '0 32px 32px' }}>
                                {selectedCoupon.validated ? (
                                    <button
                                        onClick={handleUnvalidate}
                                        style={{ width: '100%', marginTop: 0, background: '#fff1f2', color: '#dc2626', border: '1px solid #fecaca' }}
                                        className="py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80"
                                    >
                                        Anular validación
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleValidate}
                                        style={{ width: '100%', marginTop: 0, background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }}
                                        className="py-4 rounded-xl font-bold text-base tracking-wide transition-all hover:opacity-90 hover:scale-[1.01]"
                                    >
                                        Validar compra
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-2xl text-gray-400 border-dashed">
                            <span className="text-4xl mb-4">👈</span>
                            <p>Selecciona un cupón de la lista</p>
                            <p className="text-sm">o busca por código</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
