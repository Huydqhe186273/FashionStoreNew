import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside>
      <div>
        <div className="brand-logo">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          </div>
          <div>
            <div className="brand-title">Fashion Store</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Admin React SPA</div>
          </div>
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

        </ul>
      </div>

      <div className="user-profile">
        <div className="user-avatar">AD</div>
        <div className="user-info">
          <div className="name">Admin System</div>
          <div className="role">admin@fashionstore.vn</div>
        </div>
      </div>
    </aside>
  );
}
