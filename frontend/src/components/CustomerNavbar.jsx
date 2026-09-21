import React from 'react';
import { Link } from 'react-router-dom';

export default function CustomerNavbar() {
  return (
    <nav style={{ width: '100%', backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link to="/store" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', backgroundColor: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '20px' }}>F</span>
              </div>
              <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#111827' }}>FashionStore</span>
            </Link>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link 
              to="/store/cart" 
              style={{ color: '#6b7280', textDecoration: 'none', padding: '8px', display: 'flex', alignItems: 'center' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}
