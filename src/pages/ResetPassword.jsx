import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import './Auth.css';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      setError(null);

      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setError('El enlace de recuperación no es válido o ha expirado.');
          }
        } else {
          const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
          if (error) {
            setError('El enlace de recuperación no es válido o ha expirado.');
          }
        }

        const { data } = await supabase.auth.getSession();
        if (!data?.session) {
          setError('El enlace de recuperación no es válido o ha expirado.');
        }
      } catch {
        setError('No se pudo validar el enlace de recuperación.');
      } finally {
        setReady(true);
      }
    };

    init();
  }, []);

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

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError('No se pudo actualizar la contraseña. Intenta nuevamente.');
    } else {
      await supabase.auth.signOut();
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
