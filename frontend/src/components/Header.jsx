import React from 'react';

export default function Header({ title, subtitle, isLive, onRefresh }) {
  return (
    <header>
      <div className="header-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="header-actions">
        <div 
          className="status-badge" 
          style={{ color: isLive ? 'var(--success)' : 'var(--warning)', borderColor: isLive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)' }}
        >
          <span className="status-dot" style={{ background: isLive ? 'var(--success)' : 'var(--warning)' }}></span>
          {isLive ? 'Backend Live Axios Connected' : 'Demo Mode (Axios Fallback)'}
        </div>
        {onRefresh && (
          <button className="btn-action" onClick={onRefresh} style={{ padding: '8px 16px' }}>
            🔄 Làm Mới
          </button>
        )}
      </div>
    </header>
  );
}
