import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaSearch, FaShoppingCart, FaUser } from 'react-icons/fa';
import './Navbar.css';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../context/CartContext';

const Navbar = ({ toggleMenu, categories }) => {
    const { user, profile } = useAuth();
    const { cartCount } = useCart();
        const [searchQuery, setSearchQuery] = useState('');
        const navigate = useNavigate();

    
    
    const handleSearchIconClick = () => {
        navigate('/collections');
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/collections?search=${searchQuery.trim()}`);
        }
    };

    return (
        <header className="header-container">
            <div className="top-bar">
                <p>Envío gratis en la ciudad de Manta</p>
            </div>
            <div className="main-nav-container">
                <div className="menu-icon" onClick={toggleMenu}>
                    <FaBars />
                </div>
                <div className="logo-container">
                    <Link to="/">
                        <img src="/Logo-horizontal_blanco.png" alt="Undersea Logo" className="logo-img" />
                    </Link>
                </div>

                <nav className="categories-nav-desktop">
                    <ul className="nav-links">
                        {categories.map(cat => (
                            <li key={cat.slug}>
                                <Link to={`/categoria/${cat.slug}`}>{cat.nombre.toUpperCase()}</Link>
                            </li>
                        ))}
                        {profile?.rol === 'admin' && (
                          <li><Link to="/admin">ADMIN</Link></li>
                        )}
                    </ul>
                </nav>

                <div className="nav-right-section">
                    <form className="search-bar-desktop" onSubmit={handleSearchSubmit}>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Buscar productos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="search-btn" aria-label="Buscar">
                            <FaSearch />
                        </button>
                    </form>
                    <div className="nav-icons">
                        <div className="icon-wrapper" onClick={handleSearchIconClick}>
                            <FaSearch className="icon search-icon-mobile" />
                        </div>
                        <Link to="/cart" className="icon-wrapper cart-icon-wrapper">
                            <FaShoppingCart className="icon" />
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </Link>
                        <Link to={user ? "/profile" : "/login"} className="icon-link">
                            <FaUser className="icon" />
                        </Link>
                    </div>
                </div>
            </div>
                    </header>
    );
};

export default Navbar;
