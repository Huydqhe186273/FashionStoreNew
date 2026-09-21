import React from 'react';
import { Outlet } from 'react-router-dom';
import CustomerNavbar from '../components/CustomerNavbar';

export default function CustomerLayout() {
  return (
    <>
      <style>{`
        body, #root {
          display: block !important;
          width: 100vw !important;
          min-height: 100vh !important;
          margin: 0;
          padding: 0;
        }
      `}</style>
      <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f9fafb', color: '#111827', display: 'flex', flexDirection: 'column' }}>
        <CustomerNavbar />
        <main style={{ flexGrow: 1, padding: '20px', margin: 0, maxWidth: '100%' }}>
          <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
