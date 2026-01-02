import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import './Admin.css';

const OrderListAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      // Obtenemos las órdenes y la información del usuario relacionado
      const { data, error } = await supabase
        .from('ordenes')
        .select(`
          id,
          estado,
          total,
          fecha,
          usuarios ( email )
        `)
        .order('fecha', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setOrders(data);
      }
      setLoading(false);
    };

    fetchOrders();
  }, []);

  if (loading) return <p>Cargando órdenes...</p>;
  if (error) return <p className="admin-error">Error: {error}</p>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gestión de Órdenes</h2>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID Orden</th>
            <th>Usuario</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? (
            orders.map((order) => (
              <tr key={order.id}>
                <td title={order.id}>{order.id.substring(0, 8)}...</td>
                <td>{order.usuarios?.email || 'N/A'}</td>
                <td>{new Date(order.fecha).toLocaleDateString()}</td>
                <td>${order.total}</td>
                <td><span className={`status-badge status-${order.estado}`}>{order.estado}</span></td>
                <td className="admin-table-actions">
                  <button className="admin-button-secondary">Ver Detalles</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">No se encontraron órdenes.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrderListAdmin;
