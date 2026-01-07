import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import './Admin.css';

const ReportsAdminPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOrders = useCallback(async () => {
    const fullQuery = await supabase
      .from('ordenes')
      .select(
        `
          id,
          estado,
          total,
          fecha,
          usuarios ( nombre, email ),
          orden_items ( id, color, talla, cantidad, precio, productos ( nombre ) )
        `
      )
      .order('fecha', { ascending: false });

    if (!fullQuery.error) {
      return fullQuery.data || [];
    }

    const minimalQuery = await supabase
      .from('ordenes')
      .select(
        `
          id,
          estado,
          total,
          fecha,
          usuarios ( nombre, email )
        `
      )
      .order('fecha', { ascending: false });

    if (minimalQuery.error) {
      throw minimalQuery.error;
    }

    return minimalQuery.data || [];
  }, []);

  const reloadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (error) {
      setError(error.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [fetchOrders]);

  useEffect(() => {
    reloadOrders();
  }, [reloadOrders]);

  const handleConfirm = async (orderId) => {
    setActionLoading(orderId);
    setError(null);

    const { error } = await supabase.functions.invoke('confirm-order', {
      body: { orderId },
    });

    if (error) {
      setError(error.message || 'No se pudo confirmar el pedido.');
    } else {
      await reloadOrders();
    }

    setActionLoading(null);
  };

  const handleUnconfirmed = async (orderId) => {
    setActionLoading(orderId);
    setError(null);

    const { error } = await supabase.functions.invoke('mark-order-unconfirmed', {
      body: { orderId },
    });

    if (error) {
      setError(error.message || 'No se pudo marcar como no confirmado.');
    } else {
      await reloadOrders();
    }

    setActionLoading(null);
  };

  if (loading) return <p>Cargando reportes...</p>;
  if (error) return <p className="admin-error">Error: {error}</p>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Pagos / Reportes</h2>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Detalle</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? (
            orders.map((order) => {
              const items = order.orden_items || [];
              const customerName = order.usuarios?.nombre || 'N/A';
              const customerEmail = order.usuarios?.email || 'N/A';
              const isConfirmed = String(order.estado || '').toLowerCase() === 'pagado';
              const isUnconfirmed = String(order.estado || '').toLowerCase() === 'pendiente';

              return (
                <tr key={order.id}>
                  <td title={order.id}>{order.id.substring(0, 8)}...</td>
                  <td>
                    <div>{customerName}</div>
                    <div style={{ color: '#666', fontSize: 12 }}>{customerEmail}</div>
                  </td>
                  <td>{order.fecha ? new Date(order.fecha).toLocaleString() : 'N/A'}</td>
                  <td>${Number(order.total || 0).toFixed(2)}</td>
                  <td>
                    <span className={`status-badge status-${order.estado}`}>{order.estado}</span>
                  </td>
                  <td>
                    {items.length > 0 ? (
                      <div style={{ maxWidth: 420 }}>
                        {items.map((it) => (
                          <div key={it.id}>
                            {it.productos?.nombre || 'Producto'} {it.color ? `(${it.color}` : ''}{it.talla ? ` - ${it.talla}` : ''}{it.color || it.talla ? ')' : ''} x{it.cantidad}
                          </div>
                        ))}
                      </div>
                    ) : (
                      'Sin items'
                    )}
                  </td>
                  <td className="admin-table-actions">
                    <button
                      className="admin-button-secondary"
                      onClick={() => handleConfirm(order.id)}
                      disabled={isConfirmed || actionLoading === order.id}
                    >
                      {isConfirmed ? 'Pagado' : actionLoading === order.id ? 'Guardando...' : 'Marcar pagado'}
                    </button>
                    <button
                      className="admin-button-secondary"
                      onClick={() => handleUnconfirmed(order.id)}
                      disabled={isConfirmed || isUnconfirmed || actionLoading === order.id}
                      style={{ marginLeft: 8 }}
                    >
                      {isUnconfirmed ? 'Pendiente' : actionLoading === order.id ? 'Guardando...' : 'Marcar pendiente'}
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7">No hay registros todavía.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ReportsAdminPage;
