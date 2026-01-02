import React from 'react';
import './Modal.css';

const ProductModal = ({ isOpen, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {children}
      </div>
    </div>
  );
};

export default ProductModal;
