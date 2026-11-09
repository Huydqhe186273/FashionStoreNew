import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import CustomerNavbar from '../components/CustomerNavbar';
import ProductCard from '../components/customer/ProductCard';
import { getPersonalizedRecommendations, getColdStartRecommendations, resetUserAIHistory } from '../services/recommendationService';
import api from '../services/api';
import './Home.css';

export default function Home() {
  const { user } = useContext(AuthContext);
  const [recommendations, setRecommendations] = useState([]);
  const [recSource, setRecSource] = useState('cold_start');
  const [recCategories, setRecCategories] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [loadingBestsellers, setLoadingBestsellers] = useState(true);

  const applyRecommendations = (data) => {
    setRecommendations(data?.products || []);
    setRecSource(data?.source || 'cold_start');
    setRecCategories(data?.basedOnCategories || []);
  };

  const handleResetAI = async () => {
    try {
      setLoadingRecs(true);
      await resetUserAIHistory();
      applyRecommendations(await getPersonalizedRecommendations(8));
      alert('Đã xóa sạch dữ liệu AI! Bạn có thể bắt đầu xem sản phẩm mới để AI học lại gu từ đầu.');
    } catch (err) {
      console.error('Lỗi reset AI:', err);
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    // Load AI Personalized / Cold-start recommendations
    getPersonalizedRecommendations(8)
      .then((data) => {
        if (!cancelled) applyRecommendations(data);
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
      {/* Unified Navbar */}
      <CustomerNavbar />

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className="ai-pill">✨ AI CÁ NHÂN HÓA</span>
              {user ? (
                <span className="user-greeting-pill">Dành cho {user.fullName || 'bạn'}</span>
              ) : (
                <span className="user-greeting-pill">Theo phiên xem (Khách vãng lai)</span>
              )}
              <button
                type="button"
                onClick={handleResetAI}
                title="Xóa dữ liệu để test lại AI từ đầu"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                🔄 Reset AI
              </button>
            </div>
            <h2 className="home-section-title">Gợi ý dành riêng cho bạn</h2>
            <p className="home-section-subtitle">
              {recSource === 'personalized' && recCategories.length > 0 ? (
                <>Vì bạn quan tâm <strong>{recCategories.slice(0, 3).join(', ')}</strong></>
              ) : (
                'Xem thêm vài sản phẩm, chúng tôi sẽ gợi ý theo gu của bạn. Hiện đang hiển thị sản phẩm bán chạy và hàng mới.'
              )}
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
            <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Women" loading="lazy" decoding="async" />
            <div className="category-overlay">
              <h3>Bộ sưu tập Nữ</h3>
              <p>Thanh lịch & Xu hướng mới nhất</p>
            </div>
          </Link>
          <Link to="/shop?gender=men" className="category-card" style={{ textDecoration: 'none' }}>
            <img src="https://images.unsplash.com/photo-1617137968427-85924c800a22?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Men" loading="lazy" decoding="async" />
            <div className="category-overlay">
              <h3>Bộ sưu tập Nam</h3>
              <p>Lịch lãm & Hiện đại</p>
            </div>
          </Link>
          <Link to="/shop" className="category-card" style={{ textDecoration: 'none' }}>
            <img src="https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Shoes" loading="lazy" decoding="async" />
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
