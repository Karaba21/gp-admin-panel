'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';

interface AdminNavbarProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
}

export default function AdminNavbar({ activeSection, onSectionChange }: AdminNavbarProps) {
    const { user, signOut } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    if (!user) return null;

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    const handleSectionChange = (section: string) => {
        onSectionChange(section);
        closeMenu();
    };

    return (
        <nav className="admin-navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <h1 className="brand-title">🚗 Admin Panel</h1>
                    <p className="brand-subtitle">Gestión de Autos</p>
                </div>

                <button
                    className={`mobile-menu-toggle ${isMenuOpen ? 'active' : ''}`}
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </button>

                <div className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
                    <div className="navbar-sections">
                        <button
                            className={`nav-section-btn ${activeSection === 'agregar' ? 'active' : ''}`}
                            onClick={() => handleSectionChange('agregar')}
                        >
                            <span className="nav-icon">➕</span>
                            <span>Agregar Auto</span>
                        </button>
                        <button
                            className={`nav-section-btn ${activeSection === 'gestionar' ? 'active' : ''}`}
                            onClick={() => handleSectionChange('gestionar')}
                        >
                            <span className="nav-icon">📋</span>
                            <span>Gestionar Autos</span>
                        </button>
                        <button
                            className={`nav-section-btn ${activeSection === 'leads' ? 'active' : ''}`}
                            onClick={() => handleSectionChange('leads')}
                        >
                            <span className="nav-icon">📊</span>
                            <span>Leads/Cupones</span>
                        </button>
                    </div>

                    <div className="navbar-actions">
                        <div className="user-info">
                            <span className="user-email">{user.email}</span>
                        </div>
                        <button className="logout-btn" onClick={() => { signOut(); closeMenu(); }}>
                            <span className="logout-icon">🚪</span>
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
