import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside>
      <div>
        <div className="brand-logo">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          </div>
          <div>
            <div className="brand-title">Fashion Store</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Admin React SPA</div>
          </div>
        </div>

        <ul className="nav-menu">
          <li className="nav-item">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Tổng quan (Dashboard)
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/users" className={({ isActive }) => (isActive ? 'active' : '')}>
              <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              Quản lý Khách Hàng
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/staff" className={({ isActive }) => (isActive ? 'active' : '')}>
              <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>
              Quản lý Nhân Viên
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/categories" className={({ isActive }) => (isActive ? 'active' : '')}>
              <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
              Quản lý Danh Mục
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/products" className={({ isActive }) => (isActive ? 'active' : '')}>
              <svg viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              Quản lý Sản Phẩm
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/cart" className={({ isActive }) => (isActive ? 'active' : '')}>
              <svg viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Giỏ Hàng
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
