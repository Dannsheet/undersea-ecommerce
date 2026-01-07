import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSent(false);
    setLoading(true);

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setError('No se pudo enviar el correo de recuperación. Intenta nuevamente.');
    } else {
      setSent(true);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>RECUPERAR CONTRASEÑA</h2>
        <p>Te enviaremos un enlace para restablecer tu contraseña.</p>

        {error && <p className="auth-error">{error}</p>}
        {sent && (
          <p>
            Si el correo está registrado, recibirás un enlace de recuperación en unos minutos.
          </p>
        )}

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

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar enlace'}
        </button>

        <p className="auth-switch">
          <Link to="/login">Volver a Iniciar Sesión</Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;
