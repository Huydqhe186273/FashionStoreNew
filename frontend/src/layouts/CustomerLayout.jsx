import React from 'react';
import { Outlet } from 'react-router-dom';
import CustomerNavbar from '../components/CustomerNavbar';

export default function CustomerLayout() {
  return (
    <>
      <style>{`
        body, #root {
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          min-height: 100vh !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow-x: hidden !important;
        }
        main.customer-main-wrapper {
          margin-left: 0 !important;
          margin-right: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
      `}</style>
      <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f9fafb', color: '#111827', display: 'flex', flexDirection: 'column' }}>
        <CustomerNavbar />
        <main className="customer-main-wrapper customer-main" style={{ flexGrow: 1, padding: '20px 24px 60px', margin: 0, width: '100%', maxWidth: '100%' }}>
          <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', boxSizing: 'border-box' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
