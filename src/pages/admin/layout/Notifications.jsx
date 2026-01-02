import React, { useState, useEffect } from 'react';
import { FaBell, FaTimes } from 'react-icons/fa';
import { supabase } from '../../../lib/supabaseClient';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Escuchar nuevas órdenes
    const orderChannel = supabase.channel('public:ordenes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ordenes' }, (payload) => {
        console.log('Nueva orden recibida:', payload);
        const newNotification = {
          id: payload.new.id,
          message: `Nueva orden #${payload.new.id.substring(0, 6)} recibida.`,
          timestamp: payload.commit_timestamp,
          read: false,
        };
        setNotifications(prev => [newNotification, ...prev]);
      })
      .subscribe();

    // Limpieza al desmontar el componente
    return () => {
      supabase.removeChannel(orderChannel);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-container">
      <button onClick={() => setIsOpen(!isOpen)} className="header-icon-btn notification-btn">
        <FaBell />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notificaciones</h3>
            <button onClick={() => setIsOpen(false)} className="close-btn"><FaTimes /></button>
          </div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">No hay notificaciones nuevas.</p>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className={`notification-item ${notif.read ? 'read' : ''}`}>
                  <p>{notif.message}</p>
                  <span className="notification-time">{new Date(notif.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
