import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function CustomerNavbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav style={{ width: '100%', backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/logo.jpg" alt="Fashion Store Logo" style={{ height: '48px', objectFit: 'contain' }} />
            </Link>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link 
              to="/store/cart" 
              style={{ color: '#6b7280', textDecoration: 'none', padding: '8px', display: 'flex', alignItems: 'center' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#d29f96'}
              onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
              title="Giỏ hàng"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </Link>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link to="/profile" style={{ color: '#374151', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                  Xin chào, {user.email?.split('@')[0]}
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" style={{ color: '#d29f96', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                    Admin Panel
                  </Link>
                )}
                <button 
                  onClick={logout} 
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link to="/login" style={{ color: '#d29f96', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                  Đăng nhập
                </Link>
                <Link to="/register" style={{ backgroundColor: '#d29f96', color: 'white', padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
