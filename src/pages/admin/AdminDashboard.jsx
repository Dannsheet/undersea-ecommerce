import React from 'react';
import { FaPlus, FaBoxes, FaMoneyBillWave, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAdminStats } from '../../hooks/useAdminStats';
import './Dashboard.css'; // Nuevo CSS para el dashboard

// Componente para las tarjetas de resumen
const SummaryCard = ({ icon, title, value, colorClass }) => (
  <div className="summary-card">
    <div className={`card-icon ${colorClass}`}>{icon}</div>
    <div className="card-info">
      <h3>{value}</h3>
      <p>{title}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { stats, loading, error } = useAdminStats();

  return (
    <div className="dashboard-grid">
      <h2 className="dashboard-title">PANEL DE ADMINISTRACIÓN</h2>
      
      {/* Tarjetas de Resumen */}
      <section className="summary-cards">
        {loading ? (
          <p>Cargando estadísticas...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <>
            <SummaryCard 
              icon={<FaBoxes />} 
              title="Productos" 
              value={stats.products} 
              colorClass="products"
            />
            <SummaryCard 
              icon={<FaMoneyBillWave />} 
              title="Pedidos Hoy" 
              value={stats.ordersToday} 
              colorClass="orders"
            />
            <SummaryCard 
              icon={<FaUsers />} 
              title="Usuarios" 
              value={stats.users} 
              colorClass="users"
            />
          </>
        )}
      </section>

      {/* Acciones Rápidas */}
      <section>
        <h3 className="section-title">ACCIONES RÁPIDAS</h3>
        <div className="quick-actions">
          <div className="actions-grid">
            <button onClick={() => navigate('/admin/products')} className="action-button">
              <FaPlus />
              <span>Agregar Producto</span>
            </button>
            <button onClick={() => navigate('/admin/inventory')} className="action-button">
              <FaBoxes />
              <span>Ver Inventario</span>
            </button>
            <button onClick={() => navigate('/admin/reports')} className="action-button">
              <FaMoneyBillWave />
              <span>Ver Ventas</span>
            </button>
          </div>
        </div>
      </section>

      {/* Actividad Reciente */}
      <section>
        <h3 className="section-title">ACTIVIDAD RECIENTE</h3>
        <div className="recent-activity">
          <p>PRÓXIMAMENTE: ACTIVIDAD RECIENTE DE PEDIDOS Y ACTUALIZACIONES</p>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
