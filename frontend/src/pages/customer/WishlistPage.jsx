import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/customer/ProductCard';
import { getFavorites, removeFavorite } from '../../services/customerFavoriteService';

export default function WishlistPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getFavorites();
      setProducts(Array.isArray(data) ? data : []);
      setIsLive(true);
    } catch (err) {
      console.warn('getFavorites fallback:', err);
      setProducts([]);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await removeFavorite(null, productId);
      setProducts((prev) => prev.filter((p) => p.productId !== productId));
    } catch (err) {
      console.warn('removeFavorite failed:', err);
    }
  };

  return (
    <div className="shop-page">
      <div className="shop-hero">
        <h1>Sản phẩm yêu thích</h1>
        <p>{products.length} sản phẩm trong danh sách của bạn</p>
      </div>

      <div className="shop-content">
        <div className="shop-toolbar">
          <div className="shop-toolbar-info">
            {isLive ? (
              <span className="shop-live-badge">● Trực tiếp</span>
            ) : (
              <span className="shop-offline-badge">● Chế độ demo</span>
            )}
            {loading && <span className="shop-loading">Đang tải…</span>}
          </div>
        </div>

        {products.length === 0 && !loading ? (
          <div className="shop-empty">
            <span>💖</span>
            <p>Bạn chưa có sản phẩm yêu thích nào.</p>
            <Link to="/shop" className="shop-empty-reset">Khám phá sản phẩm</Link>
          </div>
        ) : (
          <>
            <div className="shop-grid">
              {products.map((p) => (
                <div key={p.productId} className="wishlist-item">
                  <ProductCard product={p} />
                  <button
                    type="button"
                    className="wishlist-remove-btn"
                    onClick={() => handleRemove(p.productId)}
                    aria-label="Bỏ yêu thích"
                  >
                    Bỏ yêu thích
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
