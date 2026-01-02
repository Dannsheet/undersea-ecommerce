import React from 'react';

const SiteWrapper = ({ children, visible }) => {
  return (
    <div id="site-wrapper" className={visible ? 'content-visible' : ''}>
      {children}
    </div>
  );
};

export default SiteWrapper;
