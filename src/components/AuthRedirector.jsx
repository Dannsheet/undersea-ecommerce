import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Este componente no renderiza UI. Su único propósito es redirigir al usuario
 * a la página correcta después de iniciar sesión, basándose en su rol.
 */
const AuthRedirector = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Solo actuar si tenemos un perfil y estamos en la página de inicio
    const authPages = ['/login', '/signup', '/forgot-password'];

    // Redirigir solo si el usuario está en una página de autenticación y obtiene un perfil.
    if (profile && authPages.includes(location.pathname)) {
      if (profile.rol === 'admin') {
        navigate('/admin', { replace: true });
      }
      // Para 'cliente', no hacemos nada, se queda en la página de inicio.
    }
  }, [profile, navigate, location]);

  return null; // No renderiza nada
};

export default AuthRedirector;
