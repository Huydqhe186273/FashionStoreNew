import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductCard from '../../components/customer/ProductCard';
import { getCategoryById } from '../../services/customerCategoryService';
import { getProductsByCategory } from '../../services/customerProductService';
import { AuthContext } from '../../context/AuthContext';

const SORT_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'bestseller', label: 'Bán chạy' },
  { value: 'discount', label: 'Giảm giá' },
  { value: 'favorites', label: 'Yêu thích' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
];

export default function ProductCategoryPage() {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [sortBy, setSortBy] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!user && sortBy === 'favorites') {
      setSortBy('all');
    }
  }, [user, sortBy]);

  // Load category only when id changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCategoryById(id)
      .then((cat) => { if (!cancelled) setCategory(cat); })
      .catch((err) => { console.warn('getCategoryById error:', err); if (!cancelled) setCategory(null); });
    return () => { cancelled = true; };
  }, [id]);

  // Re-fetch products whenever id, page, or sortBy changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProductsByCategory(id, { sortBy, sortDir: 'desc', page, size })
      .then((data) => {
        if (cancelled) return;
        setProducts(data.content || []);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 1);
        setIsLive(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('getProductsByCategory error:', err);
        setProducts([]);
        setTotalElements(0);
        setTotalPages(1);
        setIsLive(false);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, page, sortBy]);

  if (loading && !category) return <div className="shop-loading-page">Đang tải danh mục…</div>;
  if (!category) return <div className="shop-empty"><span>😕</span><p>Không tìm thấy danh mục.</p><Link to="/shop" className="shop-empty-reset">Về trang sản phẩm</Link></div>;

  return (
    <div className="shop-page">
      <div className="shop-hero category-hero">
        <h1>{category.name}</h1>
        <div className="category-meta">
          {category.gender && <span className="category-pill">Giới tính: {category.gender}</span>}
          {category.season && <span className="category-pill">Mùa: {category.season}</span>}
          <span className="category-pill">{totalElements} sản phẩm</span>
        </div>
        {category.children && category.children.length > 0 && (
          <div className="sub-category-nav">
            <span className="sub-category-label">Danh mục con:</span>
            {category.children.map((sub) => (
              <Link key={sub.categoryId} to={`/shop/category/${sub.categoryId}`} className="sub-category-pill">{sub.name}</Link>
            ))}
          </div>
        )}
      </div>

      <div className="shop-content">
        <div className="shop-toolbar">
          <div className="shop-toolbar-info">
            {isLive && <span className="shop-live-badge">● Trực tiếp</span>}
            {loading && <span className="shop-loading">Đang tải…</span>}
          </div>
          <div className="shop-toolbar-sort">
            <label>Sắp xếp:</label>
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(0); }}>
              {SORT_OPTIONS.filter((opt) => user || opt.value !== 'favorites')
                .map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {products.length === 0 && !loading ? (
          <div className="shop-empty"><span>📦</span><p>Danh mục này hiện chưa có sản phẩm.</p><Link to="/shop" className="shop-empty-reset">Về trang sản phẩm</Link></div>
        ) : (
          <div className="shop-grid">{products.map((p) => <ProductCard key={p.productId} product={p} />)}</div>
        )}

        {totalPages > 1 && (
          <div className="shop-pagination">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>← Trước</button>
            <span>Trang {page + 1} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>Sau →</button>
          </div>
        )}
      </div>
    </div>
  );
}
