import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import DashboardOverview from './pages/DashboardOverview';
import ManageUsers from './pages/ManageUsers';
import ManageStaff from './pages/ManageStaff';
import ManageCategories from './pages/ManageCategories';
import ManageProducts from './pages/ManageProducts';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';

const AppLayout = ({ children }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const noSidebarRoutes = ['/', '/login', '/register', '/forgot-password'];
  const showSidebar = user?.role === 'admin' && !noSidebarRoutes.includes(location.pathname);

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', flexDirection: showSidebar ? 'row' : 'column' }}>
      {showSidebar && <Sidebar />}
      <div style={{ flex: 1, width: '100%' }}>
        {children}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected Routes for Customer & Admin */}
            <Route path="/profile" element={
              <ProtectedRoute allowedRoles={['customer', 'admin']}>
                <Profile />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardOverview />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageUsers />
              </ProtectedRoute>
            } />
            <Route path="/staff" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageStaff />
              </ProtectedRoute>
            } />
            <Route path="/categories" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageCategories />
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageProducts />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AppLayout>
      </Router>
    </AuthProvider>
  );
}
