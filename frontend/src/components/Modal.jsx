import React from 'react';

export default function Modal({ isOpen, title, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
