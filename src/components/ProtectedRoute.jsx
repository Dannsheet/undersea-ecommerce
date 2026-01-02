import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Si todavía está cargando la sesión, no renderizamos nada para evitar parpadeos
  if (loading) {
    return null; 
  }

  // Si no hay usuario, redirigimos a la página de login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay un usuario, renderizamos el componente hijo (la página protegida)
  return children;
};

export default ProtectedRoute;
