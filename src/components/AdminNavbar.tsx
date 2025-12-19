'use client';

import { useAuth } from './AuthProvider';

interface AdminNavbarProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
}

export default function AdminNavbar({ activeSection, onSectionChange }: AdminNavbarProps) {
    const { user, signOut } = useAuth();

    if (!user) return null;

    return (
        <nav className="admin-navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <h1 className="brand-title">🚗 Admin Panel</h1>
                    <p className="brand-subtitle">Gestión de Autos</p>
                </div>

                <div className="navbar-sections">
                    <button
                        className={`nav-section-btn ${activeSection === 'agregar' ? 'active' : ''}`}
                        onClick={() => onSectionChange('agregar')}
                    >
                        <span className="nav-icon">➕</span>
                        <span>Agregar Auto</span>
                    </button>
                    <button
                        className={`nav-section-btn ${activeSection === 'gestionar' ? 'active' : ''}`}
                        onClick={() => onSectionChange('gestionar')}
                    >
                        <span className="nav-icon">📋</span>
                        <span>Gestionar Autos</span>
                    </button>
                    <button
                        className={`nav-section-btn ${activeSection === 'leads' ? 'active' : ''}`}
                        onClick={() => onSectionChange('leads')}
                    >
                        <span className="nav-icon">📊</span>
                        <span>Leads/Cupones</span>
                    </button>
                </div>

                <div className="navbar-actions">
                    <div className="user-info">
                        <span className="user-email">{user.email}</span>
                    </div>
                    <button className="logout-btn" onClick={signOut}>
                        <span className="logout-icon">🚪</span>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
