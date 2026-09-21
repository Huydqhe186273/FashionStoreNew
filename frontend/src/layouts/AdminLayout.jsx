import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function AdminLayout() {
  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:ml-64 transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
