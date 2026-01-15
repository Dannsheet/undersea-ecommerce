import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaBoxOpen, FaClipboardList, FaUsers, FaChartBar, FaImages } from 'react-icons/fa';
import './AdminLayout.css';

const AdminSidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={toggleSidebar}></div>}
      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <span className="sidebar-logo-box">U</span>
        <h1 className="sidebar-title">UNDERSEA</h1>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/admin" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FaTachometerAlt />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/admin/orders" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FaClipboardList />
          <span>Órdenes</span>
        </NavLink>
        <NavLink to="/admin/products" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FaBoxOpen />
          <span>Productos</span>
        </NavLink>
        <NavLink to="/admin/first-section" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FaImages />
          <span>Primera sección</span>
        </NavLink>
        <NavLink to="/admin/portadas" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FaImages />
          <span>Portadas</span>
        </NavLink>
        <NavLink to="/admin/inventory" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FaUsers />
          <span>Inventario</span>
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FaUsers />
          <span>Usuarios</span>
        </NavLink>
        <NavLink to="/admin/reports" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FaChartBar />
          <span>Pagos/Reportes</span>
        </NavLink>
      </nav>
    </aside>
    </>
  );
};

export default AdminSidebar;
