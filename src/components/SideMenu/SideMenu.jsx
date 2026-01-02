import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './SideMenu.css';

const SideMenu = ({ isOpen, toggleMenu, categories }) => {
    const { profile } = useAuth();
    return (
        <>
            {isOpen && <div className="side-menu-backdrop" onClick={toggleMenu}></div>}
            <div className={`side-menu ${isOpen ? 'open' : ''}`}>
                <div className="side-menu-header">
                    <button onClick={toggleMenu} className="close-btn">&times;</button>
                </div>
                <ul className="side-menu-links">
                    {categories.map(cat => (
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
