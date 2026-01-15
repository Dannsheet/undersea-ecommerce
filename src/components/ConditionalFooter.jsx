import { useLocation } from 'react-router-dom';
import Footer from './Footer/Footer';

const ConditionalFooter = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password';

  if (isAdminPage || isAuthPage) return null;

  return <Footer />;
};

export default ConditionalFooter;
