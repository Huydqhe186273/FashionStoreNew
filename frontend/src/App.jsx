import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardOverview from './pages/DashboardOverview';
import ManageUsers from './pages/ManageUsers';
import ManageStaff from './pages/ManageStaff';
import ManageCategories from './pages/ManageCategories';
import ManageProducts from './pages/ManageProducts';
import Cart from './pages/Cart';

export default function App() {
  return (
    <Router>
      <Sidebar />
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/users" element={<ManageUsers />} />
        <Route path="/staff" element={<ManageStaff />} />
        <Route path="/categories" element={<ManageCategories />} />
        <Route path="/products" element={<ManageProducts />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>
    </Router>
  );
}
