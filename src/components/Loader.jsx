import React from 'react';
import Logo from '/Logo_Principal_con_eslogan_color.png';

const Loader = () => {
  return (
    <div id="loader-container">
      <img src={Logo} alt="Undersea Loading" className="logo-loader" />
    </div>
  );
};

export default Loader;
