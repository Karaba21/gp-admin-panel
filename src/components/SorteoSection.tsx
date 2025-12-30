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
        <div className="sorteo-section space-y-8">
            <Toaster position="top-center" />

            {/* Header / Config */}
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        🏆 Sorteo Mensual
                    </h2>
                    <p className="text-white/60 mt-2">Selecciona un mes para cargar los participantes validados.</p>
                </div>

                <div className="flex gap-4 items-center bg-black/30 p-2 rounded-xl border border-white/5">
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="bg-transparent text-white font-bold p-2 outline-none cursor-pointer"
                    />
                    <button
                        onClick={loadParticipants}
                        disabled={loadingParticipants || isAnimating}
                        className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-2 rounded-lg transition-all"
                    >
                        {loadingParticipants ? 'Cargando...' : 'Cargar Participantes'}
                    </button>
                    {participants.length > 0 && (
                        <div className="px-4 py-2 bg-[var(--accent-primary)] text-black font-bold rounded-lg rounded-full">
                            {participants.length}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Stage */}
            <div className="relative min-h-[500px] flex items-center justify-center">

                {/* Background Decor */}
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black/50 rounded-3xl border border-white/5"></div>

                {(!winner && !isAnimating) && participants.length > 0 && (
                    <div className="relative z-10 text-center">
                        <div className="text-8xl mb-8 opacity-20 hover:opacity-100 transition-opacity duration-700 cursor-default select-none">
                            🎰
                        </div>
                        <button
                            onClick={startDraw}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-2xl font-bold py-6 px-16 rounded-full shadow-[0_0_50px_rgba(168,85,247,0.4)] hover:scale-110 transition-transform duration-300 animate-pulse"
                        >
                            INICIAR SORTEO
                        </button>
                    </div>
                )}

                {(isAnimating || winner) && (
                    <div className="relative z-10 flex flex-col items-center animate-fade-in">
                        <div className="mb-4 text-purple-300 uppercase tracking-[0.5em] text-sm font-bold">
                            {isAnimating ? 'Sorteando...' : '¡GANADOR!'}
                        </div>

                        {/* Slot Display */}
                        <div className={`
                            bg-black border-4 rounded-2xl p-12 mb-8 text-center min-w-[300px]
                            ${winner ? 'border-yellow-400 shadow-[0_0_100px_rgba(250,204,21,0.3)] scale-110' : 'border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.2)]'}
                            transition-all duration-500
                        `}>
                            <div className={`font-mono text-6xl md:text-8xl font-black ${winner ? 'text-yellow-400' : 'text-white'}`}>
                                {displayCode}
                            </div>
                        </div>

                        {winner && (
                            <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 animate-slide-up">
                                <h3 className="text-center text-xl font-bold mb-4">Detalles del Ganador</h3>
                                <div className="space-y-3 text-center">
                                    <p className="text-2xl font-bold">{winner.lead?.full_name}</p>
                                    <p className="text-white/60">{winner.lead?.email}</p>
                                    <p className="text-white/40 text-sm mt-4">Validado: {new Date(winner.validated_at).toLocaleDateString()}</p>

                                    <button
                                        onClick={confirmWinner}
                                        className="w-full mt-6 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase text-xl py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
                                    >
                                        CONFIRMAR Y GUARDAR
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {participants.length === 0 && !loadingParticipants && (
                    <div className="relative z-10 text-white/30 text-center">
                        <p>Carga participantes para comenzar</p>
                    </div>
                )}
            </div>
        </div>
    );
}
