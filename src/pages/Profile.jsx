import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Auth.css'; // Reutilizamos los estilos para consistencia

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    // Redirigir a la página de inicio después de cerrar sesión
    navigate('/');
  };

  if (!user) {
    // Esto es una salvaguarda, ProtectedRoute ya debería haber redirigido
    return <p>No estás autenticado.</p>;
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Perfil de Usuario</h2>
        <p>¡Bienvenido de nuevo, {user.user_metadata?.nombre || user.email}!</p>
        
        <div className="profile-info">
          <strong>Email:</strong> {user.email}
        </div>

        <button onClick={handleLogout} className="auth-button">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Profile;
