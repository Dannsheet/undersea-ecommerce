import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './Breadcrumbs.css';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (!pathnames.length || pathnames[0] !== 'admin') {
    return null;
  }

  // Capitaliza la primera letra
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <nav aria-label="breadcrumb" className="admin-breadcrumbs">
      <ol className="breadcrumb-list">
        <li className="breadcrumb-item">
          <Link to="/admin">Admin</Link>
        </li>
        {pathnames.slice(1).map((value, index) => {
          const to = `/${pathnames.slice(0, index + 2).join('/')}`;
          const isLast = index === pathnames.length - 2;

          return isLast ? (
            <li key={to} className="breadcrumb-item active" aria-current="page">
              {capitalize(value.replace(/-/g, ' '))}
            </li>
          ) : (
            <li key={to} className="breadcrumb-item">
              <Link to={to}>{capitalize(value.replace(/-/g, ' '))}</Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
