import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  // Si todavía está cargando la sesión o el perfil, no renderizamos nada
  if (loading || !profile && user) {
    return <div>Cargando...</div>; // O un spinner/loader más elegante
  }

  // Si no hay usuario o el rol no es 'admin', redirigimos a la página de inicio
  if (!user || profile?.rol !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Si el usuario es admin, renderizamos el componente hijo
  return children;
};

export default AdminRoute;
