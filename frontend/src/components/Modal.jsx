import React from 'react';

export default function Modal({ isOpen, title, onClose, children, maxWidth, size, style = {} }) {
  if (!isOpen) return null;

  const widthStyle = {};
  if (maxWidth) {
    widthStyle.maxWidth = maxWidth;
  } else if (size === 'sm') {
    widthStyle.maxWidth = '420px';
  } else if (size === 'lg') {
    widthStyle.maxWidth = '750px';
  } else if (size === 'xl') {
    widthStyle.maxWidth = '920px';
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ 
          ...widthStyle, 
          maxHeight: '90vh', 
          overflowY: 'auto',
          ...style 
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

