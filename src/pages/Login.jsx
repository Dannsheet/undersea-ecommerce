import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn({ email, password });

    if (error) {
      setError('Email o contraseña incorrectos.'); // Mensaje genérico por seguridad
    } else {
      // Redirigir siempre a la raíz. AuthRedirector se encargará del resto.
      navigate('/');
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>INICIAR SESIÓN</h2>
        <p>Bienvenido de nuevo a Undersea.</p>

        {error && <p className="auth-error">{error}</p>}

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
          />
        </div>

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>

        <p className="auth-switch">
          ¿No tienes una cuenta? <Link to="/signup">Regístrate</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
