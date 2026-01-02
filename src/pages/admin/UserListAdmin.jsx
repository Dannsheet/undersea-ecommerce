import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import './Admin.css';

const UserListAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setUsers(data);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Cargando usuarios...</p>;
  if (error) return <p className="admin-error">Error: {error}</p>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gestión de Usuarios</h2>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Fecha de Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id}>
                <td>{user.nombre}</td>
                <td>{user.email}</td>
                <td>{user.rol}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="admin-table-actions">
                  <button className="admin-button-secondary">Editar Rol</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No se encontraron usuarios.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserListAdmin;
