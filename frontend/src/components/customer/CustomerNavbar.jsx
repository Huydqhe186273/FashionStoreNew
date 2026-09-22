import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllCategories } from '../../services/customerCategoryService';

const flattenCategories = (nodes, depth = 0) => {
  const result = [];
  for (const node of nodes || []) {
    result.push({ ...node, depth });
    if (node.children && node.children.length > 0) {
      result.push(...flattenCategories(node.children, depth + 1));
    }
  }
  return result;
};

export default function CustomerNavbar() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [flat, setFlat] = useState([]);
  const [showCat, setShowCat] = useState(false);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    let mounted = true;
    getAllCategories()
      .then((data) => {
        if (!mounted) return;
        setCategories(data || []);
        setFlat(flattenCategories(data || []));
      })
      .catch((err) => console.warn('Navbar category load failed:', err));
    return () => { mounted = false; };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (trimmed) {
      navigate(`/shop/search?keyword=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/shop');
    }
  };

  return (
    <nav className="customer-navbar">
      <div className="customer-navbar-inner">
        <Link to="/shop" className="customer-brand">
          <span className="customer-brand-icon">FS</span>
          <span className="customer-brand-name">FashionStore</span>
        </Link>

        <ul className="customer-nav-links">
          <li>
            <Link to="/shop">Trang chủ</Link>
          </li>
          <li
            className="customer-nav-dropdown"
            onMouseEnter={() => setShowCat(true)}
            onMouseLeave={() => setShowCat(false)}
          >
            <button type="button" className="customer-nav-trigger">
              Danh mục <span className="caret">▾</span>
            </button>
            {showCat && (
              <div className="customer-dropdown-menu">
                {flat.length === 0 && (
                  <div className="customer-dropdown-empty">Đang tải danh mục…</div>
                )}
                {flat.map((cat) => (
                  <Link
                    key={cat.categoryId}
                    to={`/shop/category/${cat.categoryId}`}
                    className="customer-dropdown-item"
                    style={{ paddingLeft: 12 + cat.depth * 14 }}
                  >
                    {cat.name}
                    {cat.productCount > 0 && (
                      <span className="customer-dropdown-count">({cat.productCount})</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </li>
        </ul>

        <form className="customer-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="customer-search-input"
          />
          <button type="submit" className="customer-search-btn" aria-label="Search">🔍</button>
        </form>

        <div className="customer-nav-actions">
          <Link to="/shop/wishlist" className="customer-icon-btn" title="Yêu thích" aria-label="Yêu thích">♡</Link>
          <button type="button" className="customer-icon-btn" title="Tài khoản"
            onClick={() => alert('Tính năng tài khoản đang phát triển')}>👤</button>
          <button type="button" className="customer-icon-btn" title="Giỏ hàng"
            onClick={() => alert('Giỏ hàng đang phát triển')}>🛒 <span className="cart-badge">0</span></button>
        </div>
      </div>
    </nav>
  );
}
