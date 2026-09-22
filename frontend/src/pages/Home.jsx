import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Home.css';

export default function Home() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <img src="/logo.jpg" alt="Fashion Store" style={{ height: '50px', objectFit: 'contain' }} />
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="#" className="nav-link">Shop</Link>
          <Link to="#" className="nav-link">Collections</Link>
          <Link to="#" className="nav-link">About</Link>
        </div>
        <div className="nav-actions">
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn-outline">Dashboard</Link>
              )}
              <Link to="/shop/cart" className="btn-outline">Giỏ hàng</Link>
              <Link to="/profile" className="btn-outline">Profile</Link>
              <button onClick={logout} className="btn-primary" style={{ padding: '8px 16px', borderRadius: '8px' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline">Login</Link>
              <Link to="/register" className="btn-primary" style={{ padding: '8px 16px', borderRadius: '8px' }}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>ELEVATE YOUR STYLE</h1>
          <p>
            Discover the latest trends in fashion and explore our new collections. 
            Designed for the modern trendsetter.
          </p>
          <Link to="#" className="hero-btn">Shop Now</Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="featured-section">
        <h2 className="section-title">Shop by Category</h2>
        <div className="categories-grid">
          <div className="category-card">
            <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Women" />
            <div className="category-overlay">
              <h3>Women's Collection</h3>
              <p>Explore latest styles</p>
            </div>
          </div>
          <div className="category-card">
            <img src="https://images.unsplash.com/photo-1617137968427-85924c800a22?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Men" />
            <div className="category-overlay">
              <h3>Men's Collection</h3>
              <p>Sharp and sophisticated</p>
            </div>
          </div>
          <div className="category-card">
            <img src="https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Shoes" />
            <div className="category-overlay">
              <h3>Footwear</h3>
              <p>Step up your game</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2026 Fashion Store. All rights reserved.</p>
      </footer>
    </div>
  );
}
