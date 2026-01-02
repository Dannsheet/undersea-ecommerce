import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };
  return (
    <div className="admin-layout">
      <AdminSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <main className="admin-main-content">
        <AdminHeader toggleSidebar={toggleSidebar} />
        <div className="admin-page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
