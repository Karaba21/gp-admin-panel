'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSessionUser, logoutAction } from '@/app/actions/auth';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const user = await getSessionUser();
                setUser(user);
                // No tenemos session object completo aqui, pero basta con el user
            } catch (error) {
                console.error('Error checking session', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const signOut = async () => {
        console.log('AuthProvider signOut called');
        await logoutAction();
        setUser(null);
        setSession(null);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
