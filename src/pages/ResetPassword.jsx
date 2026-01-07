import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import './Auth.css';

const ResetPassword = () => {
  const token = (() => {
    const url = new URL(window.location.href);
    return (url.searchParams.get('token') || '').trim();
  })();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(() =>
    token ? null : 'El enlace de recuperación no es válido o ha expirado.'
  );
  const [loading, setLoading] = useState(false);
  const [ready] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.functions.invoke('reset-password-with-token', {
      body: { token, newPassword: password },
    });

    if (error) {
      setError('El enlace de recuperación no es válido o ha expirado.');
    } else {
      toast.success('Contraseña actualizada correctamente.');
      navigate('/login', { replace: true });
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>NUEVA CONTRASEÑA</h2>
        <p>Ingresa tu nueva contraseña para finalizar.</p>

        {error && <p className="auth-error">{error}</p>}

        {ready && !error && (
          <>
            <div className="form-group">
              <label htmlFor="password">Nueva Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </>
        )}

        <p className="auth-switch">
          <Link to="/login">Volver a Iniciar Sesión</Link>
        </p>
      </form>
    </div>
  );
};

export default ResetPassword;
