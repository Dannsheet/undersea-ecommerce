import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './SideMenu.css';

const SideMenu = ({ isOpen, toggleMenu, categories }) => {
    const { profile } = useAuth();

    const normalizeSlug = (value) => (value || '').trim().toLowerCase();
    const normalizeName = (value) =>
        (value || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');

    const sortedCategories = [...(categories || [])].sort((a, b) => {
        const aOrder = Number.isFinite(a?.orden) ? a.orden : Number.POSITIVE_INFINITY;
        const bOrder = Number.isFinite(b?.orden) ? b.orden : Number.POSITIVE_INFINITY;

        if (aOrder !== bOrder) return aOrder - bOrder;

        const aName = normalizeName(a?.nombre);
        const bName = normalizeName(b?.nombre);
        const aSlug = normalizeSlug(a?.slug);
        const bSlug = normalizeSlug(b?.slug);

        const aIsCustomGear = aSlug === 'custom-gear' || aName === 'custom gear';
        const bIsCustomGear = bSlug === 'custom-gear' || bName === 'custom gear';

        if (aIsCustomGear && !bIsCustomGear) return 1;
        if (!aIsCustomGear && bIsCustomGear) return -1;

        return aName.localeCompare(bName);
    });

    return (
        <>
            {isOpen && <div className="side-menu-backdrop" onClick={toggleMenu}></div>}
            <div className={`side-menu ${isOpen ? 'open' : ''}`}>
                <div className="side-menu-header">
                    <button onClick={toggleMenu} className="close-btn">&times;</button>
                </div>
                <ul className="side-menu-links">
                    {sortedCategories.map(cat => (
                        <li key={cat.slug}>
                            <Link to={`/categoria/${cat.slug}`} onClick={toggleMenu}>
                                {cat.nombre.toUpperCase()}
                            </Link>
                        </li>
                    ))}
                    {profile?.rol === 'admin' && (
                        <li>
                            <Link to="/admin" onClick={toggleMenu}>
                                ADMIN
                            </Link>
                        </li>
                    )}
                </ul>
            </div>
        </>
    );
};

export default SideMenu;
