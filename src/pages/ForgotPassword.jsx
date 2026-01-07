import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailValue = (email || '').trim();
    if (!emailValue) return;
    const toastId = toast.loading('Enviando enlace...');

    navigate('/login');

    const { error } = await supabase.functions.invoke('request-password-reset', {
      body: { email: emailValue },
    });

    if (error) {
      toast.error('No se pudo enviar el correo de recuperación. Intenta nuevamente.', {
        id: toastId,
      });
    } else {
      toast.success('Si el correo está registrado, recibirás un enlace de recuperación.', {
        id: toastId,
      });
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>RECUPERAR CONTRASEÑA</h2>
        <p>Te enviaremos un enlace para restablecer tu contraseña.</p>

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

        <button type="submit" className="auth-button">
          Enviar enlace
        </button>

        <p className="auth-switch">
          <Link to="/login">Volver a Iniciar Sesión</Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;
