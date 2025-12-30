'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import LoginForm from '@/components/LoginForm';
import AdminNavbar from '@/components/AdminNavbar';
import AutoForm from '@/components/AutoForm';
import AutosList from '@/components/AutosList';
import CouponVerifier from '@/components/CouponVerifier';
import SorteoSection from '@/components/SorteoSection';

export default function AdminPage() {
    const { user, loading } = useAuth();
    const [activeSection, setActiveSection] = useState('agregar');

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Cargando...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <h1 className="login-title">🚗 Admin Panel</h1>
                    <p className="login-subtitle">Gestión de Autos - Inicia sesión para continuar</p>
                    <LoginForm />
                </div>
            </div>
        );
    }

    return (
        <>
            <AdminNavbar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
            />

            <div className="admin-container">
                {activeSection === 'agregar' && (
                    <div className="content-card">
                        <h2 className="section-title">➕ Agregar Nuevo Auto</h2>
                        <AutoForm />
                    </div>
                )}

                {activeSection === 'gestionar' && (
                    <div className="content-card">
                        <h2 className="section-title">📋 Gestionar Autos</h2>
                        <AutosList />
                    </div>
                )}

                {activeSection === 'leads' && (
                    <div className="content-card">
                        <h2 className="section-title">📊 Leads y Cupones</h2>
                        <CouponVerifier />
                    </div>
                )}

                {activeSection === 'sorteo' && (
                    <div className="content-card">
                        <SorteoSection />
                    </div>
                )}
            </div>

        </>
    );
}

