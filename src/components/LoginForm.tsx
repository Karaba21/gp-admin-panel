import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/actions/auth';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Por favor, completa todos los campos');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);

            const res = await loginAction(formData);

            if (res.error) {
                setError('Error: ' + res.error);
                setLoading(false);
                return;
            }

            // Éxito: recargar para que el AuthProvider detecte la sesión
            // o redirigir
            window.location.reload();
        } catch (err) {
            setError('Error de conexión');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="login-form">
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
                {loading ? 'Entrando...' : 'Iniciar sesión'}
            </button>
            {error && (
                <p style={{ color: 'var(--danger)', marginTop: '1rem', textAlign: 'center', fontWeight: '500' }}>
                    ⚠️ {error}
                </p>
            )}
        </form>
    );
}

