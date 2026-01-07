import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const RecoveryRedirector = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = location.hash || '';
    const search = location.search || '';

    const params = new URLSearchParams(search);
    const hasCode = Boolean(params.get('code'));
    const hasRecoveryType = params.get('type') === 'recovery';

    const isRecoveryLink =
      hasCode ||
      hasRecoveryType ||
      hash.includes('type=recovery') ||
      hash.includes('access_token=') ||
      hash.includes('refresh_token=');

    if (isRecoveryLink && location.pathname !== '/reset-password') {
      navigate(`/reset-password${search}${hash}`, { replace: true });
    }
  }, [location, navigate]);

  return null;
};

export default RecoveryRedirector;
