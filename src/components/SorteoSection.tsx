'use client';

import { useState, useRef, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';

interface Participant {
    coupon_code: string;
    validated_at: string;
    lead: {
        full_name: string;
        email: string;
        phone: string;
    };
}

interface Winner extends Participant {
    won_month: string;
}

export default function SorteoSection() {
    const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [winner, setWinner] = useState<Winner | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [displayCode, setDisplayCode] = useState('00-000000');

    // Animation refs
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const loadParticipants = async () => {
        setLoadingParticipants(true);
        setWinner(null);
        setParticipants([]);
        try {
            const res = await fetch(`/api/admin/draw/participants?month=${month}`);
            const data = await res.json();
            if (data.participants) {
                setParticipants(data.participants);
                toast.success(`${data.participants.length} participantes cargados`);
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar participantes');
        } finally {
            setLoadingParticipants(false);
        }
    };

    const startDraw = async () => {
        if (participants.length === 0) {
            toast.error('No hay participantes');
            return;
        }

        // 1. Get Winner from Server
        let serverWinner: Winner | null = null;
        try {
            const res = await fetch('/api/admin/draw/pick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            serverWinner = data.winner;
        } catch (error) {
            toast.error('Error al iniciar sorteo');
            return;
        }

        if (!serverWinner) return;

        // 2. Start Animation
        setIsAnimating(true);
        setWinner(null);

        const duration = 6000; // 6 seconds
        const startTime = Date.now();

        // Slot effect: rapid random codes
        intervalRef.current = setInterval(() => {
            // Pick random from loaded participants for visual effect
            const randomP = participants[Math.floor(Math.random() * participants.length)];
            setDisplayCode(randomP.coupon_code);

            // Check if time up
            if (Date.now() - startTime > duration) {
                finishDraw(serverWinner!);
            }
        }, 80); // Fast switching
    };

    const finishDraw = (actualWinner: Winner) => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        // Slow down effect optional - lets just stop on winner
        setDisplayCode(actualWinner.coupon_code);
        setIsAnimating(false);
        setWinner(actualWinner);

        // Throw confetti? (Optional but nice)
        // For now just a big nice reveal
    };

    const confirmWinner = async () => {
        if (!winner) return;

        const toastId = toast.loading('Confirmando ganador...');
        try {
            const res = await fetch('/api/admin/draw/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    month,
                    coupon_code: winner.coupon_code
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            toast.success('¡GANADOR CONFIRMADO Y GUARDADO!', { id: toastId });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al confirmar', { id: toastId });
        }
    };

    return (
        <div className="sorteo-section space-y-6">
            <Toaster position="top-center" />

            {/* Header / Config */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                        🏆 Sorteo Mensual
                    </h2>
                    <p className="text-gray-500 mt-2">Selecciona un mes para cargar los participantes validados.</p>
                </div>

                <div className="flex gap-3 items-center bg-gray-50 p-2 rounded-xl border border-gray-200">
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="bg-transparent text-gray-800 font-bold p-2 outline-none cursor-pointer"
                    />
                    <button
                        onClick={loadParticipants}
                        disabled={loadingParticipants || isAnimating}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-lg transition-colors"
                    >
                        {loadingParticipants ? 'Cargando...' : 'Cargar Participantes'}
                    </button>
                    {participants.length > 0 && (
                        <div className="px-4 py-2 bg-purple-100 text-purple-700 font-bold rounded-full text-sm">
                            {participants.length}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Stage */}
            <div className="relative min-h-[400px] flex items-center justify-center bg-white rounded-2xl border border-gray-200 shadow-sm">

                {(!winner && !isAnimating) && participants.length > 0 && (
                    <div className="text-center py-16">
                        <div className="text-8xl mb-8 opacity-30 hover:opacity-80 transition-opacity duration-700 cursor-default select-none">
                            🎰
                        </div>
                        <button
                            onClick={startDraw}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-2xl font-bold py-6 px-16 rounded-full shadow-lg hover:shadow-purple-200 hover:scale-105 transition-all duration-300 animate-pulse"
                        >
                            INICIAR SORTEO
                        </button>
                    </div>
                )}

                {(isAnimating || winner) && (
                    <div className="flex flex-col items-center py-16 animate-fade-in">
                        <div className="mb-4 text-purple-600 uppercase tracking-[0.5em] text-sm font-bold">
                            {isAnimating ? 'Sorteando...' : '¡GANADOR!'}
                        </div>

                        {/* Slot Display */}
                        <div className={`
                            border-4 rounded-2xl p-12 mb-8 text-center min-w-[300px]
                            ${winner
                                ? 'bg-amber-50 border-amber-400 shadow-lg scale-105'
                                : 'bg-gray-50 border-purple-400 shadow-md'}
                            transition-all duration-500
                        `}>
                            <div className={`font-mono text-6xl md:text-8xl font-black ${winner ? 'text-amber-500' : 'text-gray-800'}`}>
                                {displayCode}
                            </div>
                        </div>

                        {winner && (
                            <div className="max-w-md w-full bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm animate-slide-up">
                                <h3 className="text-center text-xl font-bold text-gray-800 mb-4">Detalles del Ganador</h3>
                                <div className="space-y-3 text-center">
                                    <p className="text-2xl font-bold text-gray-900">{winner.lead?.full_name}</p>
                                    <p className="text-gray-500">{winner.lead?.email}</p>
                                    <p className="text-gray-400 text-sm mt-4">Validado: {new Date(winner.validated_at).toLocaleDateString()}</p>

                                    <button
                                        onClick={confirmWinner}
                                        className="w-full mt-6 bg-amber-500 hover:bg-amber-400 text-white font-black uppercase text-xl py-4 rounded-xl shadow-md transition-all hover:scale-[1.02]"
                                    >
                                        CONFIRMAR Y GUARDAR
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {participants.length === 0 && !loadingParticipants && (
                    <div className="text-gray-300 text-center py-16">
                        <p>Carga participantes para comenzar</p>
                    </div>
                )}
            </div>
        </div>
    );
}
