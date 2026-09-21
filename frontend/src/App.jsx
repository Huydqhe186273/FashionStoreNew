import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';
import DashboardOverview from './pages/DashboardOverview';
import ManageUsers from './pages/ManageUsers';
import ManageStaff from './pages/ManageStaff';
import ManageCategories from './pages/ManageCategories';
import ManageProducts from './pages/ManageProducts';
import Cart from './pages/Cart';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import ProductListPage from './pages/customer/ProductListPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import ProductSearchPage from './pages/customer/ProductSearchPage';
import ProductCategoryPage from './pages/customer/ProductCategoryPage';
import WishlistPage from './pages/customer/WishlistPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['customer', 'admin']}><Profile /></ProtectedRoute>} />
          <Route path="/shop" element={<CustomerLayout />}>
            <Route index element={<ProductListPage />} />
            <Route path="search" element={<ProductSearchPage />} />
            <Route path="category/:id" element={<ProductCategoryPage />} />
            <Route path="product/:id" element={<ProductDetailPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="cart" element={<Cart />} />
          </Route>
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<DashboardOverview />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="staff" element={<ManageStaff />} />
            <Route path="categories" element={<ManageCategories />} />
            <Route path="products" element={<ManageProducts />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
