import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

const SignUp = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await signUp({
        email,
        password,
        options: {
          data: {
            nombre: nombre,
          },
        },
      });

      if (error) {
        throw error;
      }

      // Redirigir al usuario o mostrar un mensaje de éxito/verificación
      alert('¡Registro exitoso! Revisa tu correo para verificar tu cuenta.');
      navigate('/'); // O a una página de 'revisar email'
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>CREAR CUENTA</h2>
        <p>Únete a la comunidad de Undersea.</p>
        
        {error && <p className="auth-error">{error}</p>}

        <div className="form-group">
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Correo Electrónico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
          />
        </div>

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>

        <p className="auth-switch">
          ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
};

export default SignUp;
