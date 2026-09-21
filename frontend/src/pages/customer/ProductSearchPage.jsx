import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../../components/customer/ProductCard';
import ProductFilterSidebar from '../../components/customer/ProductFilterSidebar';
import { searchProducts } from '../../services/customerProductService';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'bestseller', label: 'Bán chạy' },
  { value: 'discount', label: 'Giảm giá nhiều' },
];

const mockProducts = [
  { productId: 1001, name: 'Áo Polo Nam Premium Flex', categoryId: 1, categoryName: 'Áo Nam', basePrice: 350000, discountPrice: 299000, finalPrice: 299000, discountPercent: 15, soldCount: 142, images: [], primaryImage: '', availableSizes: ['S', 'M', 'L', 'XL'], availableColors: ['Đen', 'Trắng'] },
  { productId: 1005, name: 'Áo Thun Cotton Basic', categoryId: 1, categoryName: 'Áo Nam', basePrice: 180000, discountPrice: 150000, finalPrice: 150000, discountPercent: 17, soldCount: 220, images: [], primaryImage: '', availableSizes: ['S', 'M', 'L', 'XL'], availableColors: ['Đen', 'Trắng', 'Xám'] },
  { productId: 1003, name: 'Váy Dáng Xòe Floral Spring', categoryId: 3, categoryName: 'Váy Nữ', basePrice: 620000, discountPrice: 550000, finalPrice: 550000, discountPercent: 11, soldCount: 76, images: [], primaryImage: '', availableSizes: ['S', 'M', 'L'], availableColors: ['Trắng', 'Be'] },
  { productId: 1007, name: 'Đầm Midi Hoa Nhí Hàn Quốc', categoryId: 3, categoryName: 'Váy Nữ', basePrice: 480000, discountPrice: 399000, finalPrice: 399000, discountPercent: 17, soldCount: 88, images: [], primaryImage: '', availableSizes: ['S', 'M', 'L'], availableColors: ['Trắng', 'Hồng'] },
];

const filterMock = (list, filters, keyword) => {
  const kw = (keyword || '').toLowerCase();
  return list.filter((p) => {
    if (kw && !p.name.toLowerCase().includes(kw)) return false;
    if (filters.categoryId && p.categoryId !== filters.categoryId) return false;
    if (filters.minPrice && Number(p.finalPrice) < Number(filters.minPrice)) return false;
    if (filters.maxPrice && Number(p.finalPrice) > Number(filters.maxPrice)) return false;
    if (filters.size && !(p.availableSizes || []).includes(filters.size)) return false;
    if (filters.color && !(p.availableColors || []).includes(filters.color)) return false;
    return true;
  });
};

export default function ProductSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';

  const [filters, setFilters] = useState({ categoryId: null, gender: '', minPrice: '', maxPrice: '', color: '', size: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);
  const [products, setProducts] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const setKeyword = (next) => {
    const sp = new URLSearchParams(searchParams);
    if (next) sp.set('keyword', next); else sp.delete('keyword');
    setSearchParams(sp);
    setPage(0);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!keyword) { setProducts([]); setTotalElements(0); setTotalPages(1); return; }
      setLoading(true);
      try {
        const data = await searchProducts(keyword, page, pageSize);
        if (cancelled) return;
        setProducts(data.content || []);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 1);
        setIsLive(true);
      } catch (err) {
        if (cancelled) return;
        console.warn('searchProducts fallback:', err);
        const filtered = filterMock(mockProducts, filters, keyword);
        const total = filtered.length;
        const tp = Math.max(1, Math.ceil(total / pageSize));
        const from = page * pageSize;
        setProducts(filtered.slice(from, from + pageSize));
        setTotalElements(total);
        setTotalPages(tp);
        setIsLive(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, page]);

  return (
    <div className="shop-page">
      <div className="shop-hero">
        <h1>Tìm kiếm</h1>
        <p>{keyword ? <><strong>"{keyword}"</strong> — {totalElements} sản phẩm</> : 'Nhập từ khóa để tìm kiếm.'}</p>
      </div>

      <div className="shop-search-bar">
        <input type="text" placeholder="Nhập từ khóa..." defaultValue={keyword}
          onKeyDown={(e) => { if (e.key === 'Enter') setKeyword(e.currentTarget.value.trim()); }}
          className="shop-search-input" />
        <button type="button" className="btn-primary" onClick={(e) => setKeyword(e.target.previousSibling.value.trim())}>🔍 Tìm kiếm</button>
      </div>

      <div className="shop-body">
        <ProductFilterSidebar filters={filters} onChange={(f) => { setFilters(f); setPage(0); }} />

        <section className="shop-content">
          <div className="shop-toolbar">
            <div className="shop-toolbar-info">
              {isLive ? <span className="shop-live-badge">● Trực tiếp</span> : <span className="shop-offline-badge">● Chế độ demo</span>}
              {loading && <span className="shop-loading">Đang tải…</span>}
            </div>
            <div className="shop-toolbar-sort">
              <label>Sắp xếp:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>

          {!keyword ? (
            <div className="shop-empty"><span>🔎</span><p>Nhập từ khóa để tìm kiếm sản phẩm.</p></div>
          ) : products.length === 0 && !loading ? (
            <div className="shop-empty"><span>😕</span><p>Không tìm thấy sản phẩm nào với từ khóa "{keyword}".</p></div>
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
        </section>
      </div>
    </div>
  );
}
