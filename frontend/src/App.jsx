import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardOverview from './pages/DashboardOverview';
import ManageUsers from './pages/ManageUsers';
import ManageStaff from './pages/ManageStaff';
import ManageCategories from './pages/ManageCategories';
import ManageProducts from './pages/ManageProducts';
import CustomerLayout from './components/customer/CustomerLayout';
import ProductListPage from './pages/customer/ProductListPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import ProductSearchPage from './pages/customer/ProductSearchPage';
import ProductCategoryPage from './pages/customer/ProductCategoryPage';

function AdminShell({ children }) {
  return (
    <>
      <Sidebar />
      {children}
    </>
  );
}

function CustomerShell({ children }) {
  return <CustomerLayout>{children}</CustomerLayout>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/shop" element={<CustomerShell><ProductListPage /></CustomerShell>} />
        <Route path="/shop/search" element={<CustomerShell><ProductSearchPage /></CustomerShell>} />
        <Route path="/shop/category/:id" element={<CustomerShell><ProductCategoryPage /></CustomerShell>} />
        <Route path="/shop/product/:id" element={<CustomerShell><ProductDetailPage /></CustomerShell>} />
        <Route path="/" element={<AdminShell><DashboardOverview /></AdminShell>} />
        <Route path="/users" element={<AdminShell><ManageUsers /></AdminShell>} />
        <Route path="/staff" element={<AdminShell><ManageStaff /></AdminShell>} />
        <Route path="/categories" element={<AdminShell><ManageCategories /></AdminShell>} />
        <Route path="/products" element={<AdminShell><ManageProducts /></AdminShell>} />
      </Routes>
    </Router>
  );
}
