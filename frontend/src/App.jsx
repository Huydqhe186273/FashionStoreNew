import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';

// Pages
import DashboardOverview from './pages/DashboardOverview';
import ManageUsers from './pages/ManageUsers';
import ManageStaff from './pages/ManageStaff';
import ManageCategories from './pages/ManageCategories';
import ManageProducts from './pages/ManageProducts';
import Cart from './pages/Cart';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect trang chủ vào thẳng store */}
        <Route path="/" element={<Navigate to="/store/cart" replace />} />

        {/* --- CUSTOMER LAYOUT (Không có Sidebar, có Navbar mua hàng) --- */}
        <Route path="/store" element={<CustomerLayout />}>
          <Route path="cart" element={<Cart />} />
          {/* Sau này thêm trang Home, Chi tiết sản phẩm vào đây */}
        </Route>

        {/* --- ADMIN LAYOUT (Có Sidebar bên trái) --- */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="staff" element={<ManageStaff />} />
          <Route path="categories" element={<ManageCategories />} />
          <Route path="products" element={<ManageProducts />} />
        </Route>
      </Routes>
    </Router>
  );
}
