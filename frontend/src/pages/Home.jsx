import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProductCard from '../components/customer/ProductCard';
import { getPersonalizedRecommendations, getColdStartRecommendations } from '../services/recommendationService';
import api from '../services/api';
import './Home.css';

export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const [recommendations, setRecommendations] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [loadingBestsellers, setLoadingBestsellers] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Load AI Personalized / Cold-start recommendations
    getPersonalizedRecommendations(user?.id, 8)
      .then((data) => {
        if (!cancelled && data && data.length > 0) {
          setRecommendations(data);
        }
      })
      .catch((err) => console.warn('Lỗi tải gợi ý:', err))
      .finally(() => {
        if (!cancelled) setLoadingRecs(false);
      });

    // Load Bestseller products
    api.get('/customer/products/bestsellers?limit=8')
      .then((res) => {
        if (!cancelled && res.data && res.data.length > 0) {
          setBestsellers(res.data);
        }
      })
      .catch(() => {
        // Fallback to cold start if needed
        getColdStartRecommendations(8).then((res) => {
          if (!cancelled) setBestsellers(res || []);
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingBestsellers(false);
      });

    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="nav-brand" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/logo.png" 
            alt="FS Clothing Logo" 
            style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
            }} 
          />
          <span style={{
            fontSize: '20px',
            fontWeight: '800',
            letterSpacing: '-0.5px',
            color: '#111827'
          }}>
            Fashion<span style={{ color: '#d29f96' }}>Store</span>
          </span>
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/shop" className="nav-link">Shop</Link>
          <Link to="/shop/orders" className="nav-link">Đơn hàng</Link>
          <Link to="/shop/notifications" className="nav-link">Thông báo</Link>
        </div>
        <div className="nav-actions">
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn-outline">Dashboard</Link>
              )}
              <Link to="/shop/cart" className="btn-outline">🛒 Giỏ hàng</Link>
              <Link to="/profile" className="btn-outline">👤 {user.fullName || 'Tài khoản'}</Link>
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
            Khám phá xu hướng thời trang mới nhất cùng trải nghiệm cá nhân hóa thông minh từ trí tuệ nhân tạo.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to="/shop" className="hero-btn">Mua sắm ngay</Link>
            <a href="#ai-recommendations" className="hero-btn-secondary">Gợi ý AI cho bạn ✨</a>
          </div>
        </div>
      </section>

      {/* AI Recommendation Section */}
      <section id="ai-recommendations" className="home-recommendations-section">
        <div className="home-section-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="ai-pill">✨ AI PERSONALIZED</span>
              {user && <span className="user-greeting-pill">Dành cho {user.fullName || 'bạn'}</span>}
            </div>
            <h2 className="home-section-title">Gợi ý dành riêng cho bạn</h2>
            <p className="home-section-subtitle">
              Sản phẩm được chọn lọc dựa trên phong cách, mức giá và hành vi yêu thích của bạn
            </p>
          </div>
          <Link to="/shop" className="view-more-link">
            Xem tất cả →
          </Link>
        </div>

        {loadingRecs ? (
          <div className="home-loading-grid">Đang chuẩn bị danh sách gợi ý AI…</div>
        ) : recommendations.length > 0 ? (
          <div className="home-products-grid">
            {recommendations.map((p) => (
              <ProductCard key={p.productId} product={p} />
            ))}
          </div>
        ) : (
          <div className="home-empty-recs">Chưa có sản phẩm gợi ý phù hợp.</div>
        )}
      </section>

      {/* Bestsellers Section */}
      <section className="home-recommendations-section" style={{ backgroundColor: '#f9fafb' }}>
        <div className="home-section-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="bestseller-pill">🔥 BESTSELLERS</span>
            </div>
            <h2 className="home-section-title">Sản phẩm bán chạy nhất</h2>
            <p className="home-section-subtitle">
              Những thiết kế thịnh hành được cộng đồng thời trang săn đón nhiều nhất
            </p>
          </div>
          <Link to="/shop?sortBy=bestseller" className="view-more-link">
            Xem thêm →
          </Link>
        </div>

        {loadingBestsellers ? (
          <div className="home-loading-grid">Đang tải sản phẩm bán chạy…</div>
        ) : (
          <div className="home-products-grid">
            {bestsellers.map((p) => (
              <ProductCard key={p.productId} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Featured Categories */}
      <section className="featured-section">
        <h2 className="section-title">Khám phá theo danh mục</h2>
        <div className="categories-grid">
          <Link to="/shop?gender=women" className="category-card" style={{ textDecoration: 'none' }}>
            <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Women" />
            <div className="category-overlay">
              <h3>Bộ sưu tập Nữ</h3>
              <p>Thanh lịch & Xu hướng mới nhất</p>
            </div>
          </Link>
          <Link to="/shop?gender=men" className="category-card" style={{ textDecoration: 'none' }}>
            <img src="https://images.unsplash.com/photo-1617137968427-85924c800a22?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Men" />
            <div className="category-overlay">
              <h3>Bộ sưu tập Nam</h3>
              <p>Lịch lãm & Hiện đại</p>
            </div>
          </Link>
          <Link to="/shop" className="category-card" style={{ textDecoration: 'none' }}>
            <img src="https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Shoes" />
            <div className="category-overlay">
              <h3>Phụ kiện & Giày</h3>
              <p>Hoàn thiện phong cách của bạn</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2026 Fashion Store. All rights reserved.</p>
      </footer>
    </div>
  );
}
