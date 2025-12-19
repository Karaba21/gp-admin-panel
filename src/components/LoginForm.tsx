'use client';

import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Por favor, completa todos los campos');
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError('Error de autenticación: ' + error.message);
                return;
            }

            if (!data.user) {
                setError('Error de autenticación');
            }
        } catch (err) {
            setError('Error de conexión: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Email
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="tu@email.com"
                />
            </label>
            <label>
                Contraseña
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="••••••••"
                />
            </label>
            <button type="submit" disabled={loading}>
                {loading ? '🔄 Entrando...' : '🔐 Entrar'}
            </button>
            {error && (
                <p style={{ color: 'var(--danger)', marginTop: '1rem', textAlign: 'center', fontWeight: '500' }}>
                    ⚠️ {error}
                </p>
            )}
        </form>
    );
}

