import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './CustomerNavbar.css';

export default function CustomerNavbar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const pathname = location.pathname;

  const isActive = (path) => {
    if (path === '/') return pathname === '/';
    if (path === '/shop') {
      return (
        pathname === '/shop' ||
        pathname.startsWith('/shop/category') ||
        pathname.startsWith('/shop/product') ||
        pathname.startsWith('/shop/wishlist')
      );
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="customer-navbar">
      <div className="customer-navbar-inner">
        
        {/* Brand */}
        <Link to="/" className="customer-navbar-brand">
          <img 
            src="/logo.png" 
            alt="FS Clothing Logo" 
            className="customer-navbar-logo"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <span className="customer-navbar-title">
            FASHION<span>STORE</span>
          </span>
        </Link>

        {/* Navigation Tabs */}
        <div className="customer-navbar-links">
          <Link 
            to="/" 
            className={`customer-navbar-link ${isActive('/') ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/shop" 
            className={`customer-navbar-link ${isActive('/shop') ? 'active' : ''}`}
          >
            Shop
          </Link>
          <Link 
            to="/shop/orders" 
            className={`customer-navbar-link ${isActive('/shop/orders') ? 'active' : ''}`}
          >
            Đơn hàng
          </Link>
          <Link 
            to="/shop/notifications" 
            className={`customer-navbar-link ${isActive('/shop/notifications') ? 'active' : ''}`}
          >
            Thông báo
          </Link>
        </div>

        {/* Actions */}
        <div className="customer-navbar-actions">
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="navbar-action-pill admin-pill">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span>Admin</span>
                </Link>
              )}

              {user.role === 'staff' && (
                <Link to="/staff/orders" className="navbar-action-pill staff-pill">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  <span>Nhân viên</span>
                </Link>
              )}
              
              <Link to="/shop/cart" className="navbar-action-pill cart-pill" title="Giỏ hàng của bạn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                <span>Giỏ hàng</span>
              </Link>

              <Link to="/profile" className="navbar-action-pill user-pill" title="Trang cá nhân & Cài đặt">
                <span className="navbar-user-avatar-badge">
                  {(user.fullName || (user.email ? user.email.split('@')[0] : 'U')).charAt(0).toUpperCase()}
                </span>
                <span className="navbar-user-name">
                  {user.fullName || (user.email ? user.email.split('@')[0] : 'Tài khoản')}
                </span>
              </Link>

              <button 
                onClick={logout} 
                className="navbar-action-pill logout-pill"
                title="Đăng xuất khỏi tài khoản"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Đăng xuất</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-action-pill login-pill">
                Đăng nhập
              </Link>
              <Link to="/register" className="navbar-action-pill register-pill">
                Đăng ký
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
