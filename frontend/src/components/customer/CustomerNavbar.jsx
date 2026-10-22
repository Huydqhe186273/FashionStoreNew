import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllCategories } from '../../services/customerCategoryService';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/notificationService';
import { AuthContext } from '../../context/AuthContext';

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
  const { user } = useContext(AuthContext);
  const userId = user?.id;

  const [categories, setCategories] = useState([]);
  const [flat, setFlat] = useState([]);
  const [showCat, setShowCat] = useState(false);
  const [keyword, setKeyword] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const loadNotifs = async () => {
    if (!userId) return;
    try {
      const data = await getNotifications(userId);
      setNotifications(data || []);
    } catch (err) {
      console.warn("Lỗi tải thông báo:", err);
    }
  };

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

  useEffect(() => {
    if (userId) {
      loadNotifs();
    }
  }, [userId]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (trimmed) {
      navigate(`/shop?keyword=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/shop');
    }
  };

  const handleMarkRead = async (notifId) => {
    try {
      await markNotificationRead(notifId);
      loadNotifs();
    } catch (err) {
      console.error("Lỗi đánh dấu đã đọc:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(userId);
      loadNotifs();
    } catch (err) {
      console.error("Lỗi đánh dấu đọc tất cả:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <nav className="customer-navbar">
      <div className="customer-navbar-inner">
        <Link to="/" className="customer-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="/logo.png" 
            alt="FS Clothing Logo" 
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              objectFit: 'cover' 
            }} 
          />
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
          {/* Nút Chuông Thông Báo (Notification List & Mark Read) */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="customer-icon-btn"
              title="Thông báo"
              style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  backgroundColor: '#ef4444', color: '#fff', fontSize: '0.7rem',
                  fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <div style={{
                position: 'absolute', right: 0, top: '40px', width: '320px',
                backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                border: '1px solid #e5e7eb', zIndex: 999, overflow: 'hidden'
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.95rem' }}>Thông báo ({unreadCount} chưa đọc)</strong>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{ border: 'none', background: 'none', color: '#3b82f6', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500' }}
                    >
                      Đọc tất cả
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
                      Bạn chưa có thông báo nào.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.notificationId}
                        onClick={() => !n.isRead && handleMarkRead(n.notificationId)}
                        style={{
                          padding: '12px 16px', borderBottom: '1px solid #f3f4f6',
                          backgroundColor: n.isRead ? '#ffffff' : '#eff6ff',
                          cursor: n.isRead ? 'default' : 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <div style={{ fontSize: '0.85rem', fontWeight: n.isRead ? 'normal' : 'bold', color: '#111827', marginBottom: '4px' }}>
                          {n.content}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          {n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{
                  padding: '10px 16px',
                  textAlign: 'center',
                  backgroundColor: '#f9fafb',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <Link
                    to="/shop/notifications"
                    onClick={() => setShowNotif(false)}
                    style={{
                      color: '#2563eb',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      textDecoration: 'none'
                    }}
                  >
                    Xem tất cả thông báo →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link to="/shop/orders" className="customer-icon-btn" title="Đơn mua / Lịch sử đơn hàng" aria-label="Đơn mua">📦</Link>
          <Link to="/shop/reviews" className="customer-icon-btn" title="Đánh giá sản phẩm đã mua" aria-label="Đánh giá sản phẩm">⭐</Link>
          <Link to="/shop/wishlist" className="customer-icon-btn" title="Yêu thích" aria-label="Yêu thích">♡</Link>
          <Link to="/profile" className="customer-icon-btn" title="Tài khoản" aria-label="Tài khoản">👤</Link>
          <Link to="/shop/cart" className="customer-icon-btn" title="Giỏ hàng" aria-label="Giỏ hàng">
            🛒 <span className="cart-badge">0</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
