'use client';

import { useState, useEffect } from 'react';
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

    // Cerrar el menú cuando se hace clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (isMenuOpen && !target.closest('.mobile-sidebar') && !target.closest('.mobile-menu-toggle')) {
                closeMenu();
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = '';
        };
    }, [isMenuOpen]);

    return (
        <>
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

            {/* Mobile Sidebar */}
            <div className={`mobile-sidebar-overlay ${isMenuOpen ? 'open' : ''}`} onClick={closeMenu}></div>
            <div className={`mobile-sidebar ${isMenuOpen ? 'open' : ''}`}>
                <div className="mobile-sidebar-header">
                    <div className="mobile-sidebar-brand">
                        <h2 className="mobile-sidebar-title">🚗 Admin Panel</h2>
                        <p className="mobile-sidebar-subtitle">Gestión de Autos</p>
                    </div>
                    <button className="mobile-sidebar-close" onClick={closeMenu} aria-label="Cerrar menú">
                        ✕
                    </button>
                </div>

                <div className="mobile-sidebar-content">
                    <div className="mobile-user-info">
                        <span className="mobile-user-email">{user.email}</span>
                    </div>

                    <div className="mobile-nav-items">
                        <button
                            className={`mobile-nav-item ${activeSection === 'agregar' ? 'active' : ''}`}
                            onClick={() => handleSectionChange('agregar')}
                        >
                            <span className="mobile-nav-indicator"></span>
                            <span className="mobile-nav-icon">➕</span>
                            <span className="mobile-nav-text">Agregar Auto</span>
                        </button>
                        <button
                            className={`mobile-nav-item ${activeSection === 'gestionar' ? 'active' : ''}`}
                            onClick={() => handleSectionChange('gestionar')}
                        >
                            <span className="mobile-nav-indicator"></span>
                            <span className="mobile-nav-icon">📋</span>
                            <span className="mobile-nav-text">Gestionar Autos</span>
                        </button>
                        <button
                            className={`mobile-nav-item ${activeSection === 'leads' ? 'active' : ''}`}
                            onClick={() => handleSectionChange('leads')}
                        >
                            <span className="mobile-nav-indicator"></span>
                            <span className="mobile-nav-icon">📊</span>
                            <span className="mobile-nav-text">Leads/Cupones</span>
                        </button>
                    </div>

                    <button className="mobile-logout-btn" onClick={() => { signOut(); closeMenu(); }}>
                        <span className="mobile-logout-icon">🚪</span>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </>
    );
}
