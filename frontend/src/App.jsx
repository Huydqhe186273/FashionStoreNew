import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';

// Public & Customer Pages (Lazy Loaded)
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const Cart = lazy(() => import('./pages/Cart'));
const ProductListPage = lazy(() => import('./pages/customer/ProductListPage'));
const ProductDetailPage = lazy(() => import('./pages/customer/ProductDetailPage'));
const ProductCategoryPage = lazy(() => import('./pages/customer/ProductCategoryPage'));
const WishlistPage = lazy(() => import('./pages/customer/WishlistPage'));

// Admin & Staff Pages (Lazy Loaded - Code Splitting)
const DashboardOverview = lazy(() => import('./pages/DashboardOverview'));
const ManageUsers = lazy(() => import('./pages/ManageUsers'));
const ManageStaff = lazy(() => import('./pages/ManageStaff'));
const ManageCategories = lazy(() => import('./pages/ManageCategories'));
const ManageProducts = lazy(() => import('./pages/ManageProducts'));
const ManageVariants = lazy(() => import('./pages/ManageVariants'));
const ManageOrders = lazy(() => import('./pages/ManageOrders'));
const ManageInbound = lazy(() => import('./pages/ManageInbound'));
const ManageCoupons = lazy(() => import('./pages/ManageCoupons'));
const ManageReports = lazy(() => import('./pages/ManageReports'));

function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '12px',
      color: '#6b7280'
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        border: '3px solid #e5e7eb',
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Đang tải...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/profile" element={<ProtectedRoute allowedRoles={['customer', 'admin', 'staff']}><Profile /></ProtectedRoute>} />
            <Route path="/shop" element={<CustomerLayout />}>
              <Route index element={<ProductListPage />} />
              <Route path="category/:id" element={<ProductCategoryPage />} />
              <Route path="product/:id" element={<ProductDetailPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
              <Route path="cart" element={<Cart />} />
            </Route>
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<ProtectedRoute allowedRoles={['admin']}><DashboardOverview /></ProtectedRoute>} />
              <Route path="users" element={<ProtectedRoute allowedRoles={['admin']}><ManageUsers /></ProtectedRoute>} />
              <Route path="staff" element={<ProtectedRoute allowedRoles={['admin']}><ManageStaff /></ProtectedRoute>} />
              <Route path="coupons" element={<ProtectedRoute allowedRoles={['admin']}><ManageCoupons /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute allowedRoles={['admin']}><ManageReports /></ProtectedRoute>} />
              {/* Shared management features */}
              <Route path="categories" element={<ManageCategories />} />
              <Route path="products" element={<ManageProducts />} />
              <Route path="variants" element={<ManageVariants />} />
              <Route path="inbound" element={<ManageInbound />} />
              <Route path="orders" element={<ManageOrders />} />
            </Route>
            <Route path="/staff" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/staff/orders" replace />} />
              <Route path="orders" element={<ManageOrders />} />
              <Route path="inbound" element={<ManageInbound />} />
              <Route path="products" element={<ManageProducts />} />
              <Route path="variants" element={<ManageVariants />} />
              <Route path="categories" element={<ManageCategories />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}
