import React, { useContext } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="admin-sidebar">
      <div className="brand-logo" style={{ display: 'flex', justifyContent: 'center', padding: '12px 14px' }}>
        <img src="/logo.jpg" alt="Fashion Store" style={{ height: '48px', objectFit: 'contain' }} />
      </div>

      <div className="sidebar-nav-container">
        <ul className="nav-menu">
          {/* Admin only: Dashboard */}
          {user?.role === 'admin' && (
            <li className="nav-item">
              <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>
                <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                Tổng quan (Dashboard)
              </NavLink>
            </li>
          )}

          {/* Admin only: Manage Customers */}
          {user?.role === 'admin' && (
            <li className="nav-item">
              <NavLink to="/admin/users" className={({ isActive }) => (isActive ? 'active' : '')}>
                <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                Quản lý Khách Hàng
              </NavLink>
            </li>
          )}

          {/* Admin only: Manage Staff */}
          {user?.role === 'admin' && (
            <li className="nav-item">
              <NavLink to="/admin/staff" className={({ isActive }) => (isActive ? 'active' : '')}>
                <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6M23 11h-6" /></svg>
                Quản lý Nhân Viên
              </NavLink>
            </li>
          )}

          {/* Shared: Order Processing (Staff & Admin) */}
          <li className="nav-item">
            <NavLink 
              to={user?.role === 'staff' ? '/staff/orders' : '/admin/orders'} 
              className={({ isActive }) => (isActive || location.pathname.includes('/orders') ? 'active' : '')}
            >
              <svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" /><path d="M9 14l2 2 4-4" /></svg>
              Xử lý Đơn Hàng
            </NavLink>
          </li>

          {/* Shared: Product Catalog (Staff & Admin) */}
          <li className="nav-item">
            <NavLink to="/admin/products" className={({ isActive }) => (isActive ? 'active' : '')}>
              <svg viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              Quản lý Sản Phẩm
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/admin/variants" className={({ isActive }) => (isActive ? 'active' : '')}>
              <svg viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
              Quản lý Biến Thể
            </NavLink>
          </li>
          {/* Shared: Inbound Inventory Batches (Staff & Admin) */}
          <li className="nav-item">
            <NavLink 
              to={user?.role === 'staff' ? '/staff/inbound' : '/admin/inbound'} 
              className={({ isActive }) => (isActive || location.pathname.includes('/inbound') ? 'active' : '')}
            >
              <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
              Nhập Kho (Theo Lô)
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/admin/categories" className={({ isActive }) => (isActive ? 'active' : '')}>
              <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7" /></svg>
              Quản lý Danh Mục
            </NavLink>
          </li>

          {/* Admin only: Coupons */}
          {user?.role === 'admin' && (
            <li className="nav-item">
              <NavLink to="/admin/coupons" className={({ isActive }) => (isActive ? 'active' : '')}>
                <svg viewBox="0 0 24 24"><path d="M21 5H3a2 2 0 0 0-2 2v2.5a2.5 2.5 0 0 1 0 5V17a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-2.5a2.5 2.5 0 0 1 0-5V7a2 2 0 0 0-2-2z" /><path d="M9 9h.01M15 15h.01M9 15l6-6" /></svg>
                Quản lý Mã Giảm Giá
              </NavLink>
            </li>
          )}

          {/* Admin only: Reports */}
          {user?.role === 'admin' && (
            <li className="nav-item">
              <NavLink to="/admin/reports" className={({ isActive }) => (isActive ? 'active' : '')}>
                <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                Báo Cáo Thống Kê
              </NavLink>
            </li>
          )}

          <li className="nav-item">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')} style={{ color: '#2563eb' }}>
              <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path d="M9 22V12h6v10" /></svg>
              Về Trang Mua Sắm
            </NavLink>
          </li>
        </ul>
      </div>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-profile-info">
            <div className="user-avatar">{user?.email?.charAt(0).toUpperCase() || 'A'}</div>
            <div className="user-info">
              <div className="name">{user?.role === 'admin' ? 'Administrator' : user?.role === 'staff' ? 'Nhân viên (Staff)' : 'User'}</div>
              <div className="role" title={user?.email || 'admin@fashionstore.vn'}>
                {user?.email || 'admin@fashionstore.vn'}
              </div>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-sidebar-logout" 
            onClick={handleLogout}
            title="Đăng xuất khỏi hệ thống"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
}
