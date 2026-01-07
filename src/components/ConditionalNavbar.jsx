import { useLocation } from 'react-router-dom';
import Navbar from './Navbar/Navbar';

const ConditionalNavbar = ({ toggleMenu, categories }) => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password';

  if (isAdminPage || isAuthPage) {
    return null; // No renderizar Navbar en rutas de admin
  }

  return <Navbar toggleMenu={toggleMenu} categories={categories} />;
};

export default ConditionalNavbar;
