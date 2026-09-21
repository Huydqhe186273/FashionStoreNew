import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductCard from '../../components/customer/ProductCard';
import { getCategoryById } from '../../services/customerCategoryService';
import { getProductsByCategory } from '../../services/customerProductService';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'bestseller', label: 'Bán chạy' },
  { value: 'discount', label: 'Giảm giá nhiều' },
];

const mockCategory = (id) => ({ categoryId: Number(id), name: 'Áo Nam', gender: 'nam', season: 'summer', productCount: 24, children: [] });
const mockProductsForCategory = (catId) => [
  { productId: 1001, name: 'Áo Polo Nam Premium Flex', categoryId: catId, categoryName: 'Áo Nam', basePrice: 350000, discountPrice: 299000, finalPrice: 299000, discountPercent: 15, soldCount: 142, images: [], primaryImage: '' },
  { productId: 1005, name: 'Áo Thun Cotton Basic', categoryId: catId, categoryName: 'Áo Nam', basePrice: 180000, discountPrice: 150000, finalPrice: 150000, discountPercent: 17, soldCount: 220, images: [], primaryImage: '' },
];

export default function ProductCategoryPage() {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const catId = Number(id);
    Promise.all([
      getCategoryById(id).catch((err) => { console.warn('getCategoryById fallback:', err); return mockCategory(id); }),
      getProductsByCategory(id, 0, 100).catch((err) => { console.warn('getProductsByCategory fallback:', err); return { content: mockProductsForCategory(catId), totalElements: mockProductsForCategory(catId).length, totalPages: 1 }; }),
    ]).then(([cat, pageData]) => {
      if (cancelled) return;
      setCategory(cat);
      setProducts(pageData.content || []);
      setTotalElements(pageData.totalElements || (pageData.content || []).length);
      setTotalPages(pageData.totalPages || 1);
      setIsLive(true);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc': return Number(a.finalPrice) - Number(b.finalPrice);
      case 'price_desc': return Number(b.finalPrice) - Number(a.finalPrice);
      case 'bestseller': return (b.soldCount || 0) - (a.soldCount || 0);
      case 'discount': return (b.discountPercent || 0) - (a.discountPercent || 0);
      default: return 0;
    }
  });

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
            {isLive ? <span className="shop-live-badge">● Trực tiếp</span> : <span className="shop-offline-badge">● Chế độ demo</span>}
          </div>
          <div className="shop-toolbar-sort">
            <label>Sắp xếp:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {sortedProducts.length === 0 && !loading ? (
          <div className="shop-empty"><span>📦</span><p>Danh mục này hiện chưa có sản phẩm.</p><Link to="/shop" className="shop-empty-reset">Về trang sản phẩm</Link></div>
        ) : (
          <div className="shop-grid">{sortedProducts.map((p) => <ProductCard key={p.productId} product={p} />)}</div>
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
