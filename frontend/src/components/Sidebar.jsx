import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside>
      <div>
        <div className="brand-logo" style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
          <img src="/logo.jpg" alt="Fashion Store" style={{ height: '70px', objectFit: 'contain' }} />
        </div>

        <ul className="nav-menu">
          <li className="nav-item">
            <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
              Tổng quan (Dashboard)
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/admin/users" className={({ isActive }) => (isActive ? 'active' : '')}>
              <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
              Quản lý Khách Hàng
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/admin/staff" className={({ isActive }) => (isActive ? 'active' : '')}>
              <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6M23 11h-6" /></svg>
              Quản lý Nhân Viên
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/admin/categories" className={({ isActive }) => (isActive ? 'active' : '')}>
              <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7" /></svg>
              Quản lý Danh Mục
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/admin/products" className={({ isActive }) => (isActive ? 'active' : '')}>
              <svg viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              Quản lý Sản Phẩm
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/" className="nav-item" style={{ color: '#2563eb' }}>
              <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path d="M9 22V12h6v10" /></svg>
              Về Trang Mua Sắm
            </NavLink>
          </li>
        </ul>
      </div>

      <div 
        className="user-profile" 
        style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px', cursor: 'pointer', marginTop: 'auto' }} 
        onClick={handleLogout} 
        title="Click to logout"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="user-avatar">{user?.email?.charAt(0).toUpperCase() || 'U'}</div>
          <div className="user-info" style={{ overflow: 'hidden' }}>
            <div className="name">{user?.role === 'admin' ? 'Administrator' : 'User'}</div>
            <div className="role" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
              {user?.email}
            </div>
          </div>
        </div>
        <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', fontWeight: '600', padding: '6px 0', borderTop: '1px solid #e5e7eb' }}>
          Đăng xuất
        </div>
      </div>
    </aside>
  );
}
