import React from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumbs from './Breadcrumbs';
import { useAuth } from '../../../hooks/useAuth';
import { FaSignOutAlt, FaBars, FaStore } from 'react-icons/fa';
import Notifications from './Notifications';
import './AdminLayout.css';

const AdminHeader = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    // El AuthProvider se encargará de redirigir
  };

  return (
    <header className="admin-header-main">
      <div className="header-left">
        <button onClick={toggleSidebar} className="header-icon-btn mobile-menu-btn">
          <FaBars />
        </button>
        <Breadcrumbs />
      </div>
      <div className="header-right">
        <button onClick={() => navigate('/')} className="header-icon-btn store-btn" title="Ver Tienda">
          <FaStore />
        </button>
        <Notifications />
        <div className="user-info">
          <div className="user-avatar">{profile?.nombre?.charAt(0) || 'U'}</div>
          <div className="user-details">
            <span className="user-name">{profile?.nombre || 'Usuario'}</span>
            <span className="user-email">{user?.email}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="header-icon-btn logout-btn">
          <FaSignOutAlt />
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
