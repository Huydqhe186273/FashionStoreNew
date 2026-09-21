import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../../components/customer/ProductCard';
import ProductFilterSidebar from '../../components/customer/ProductFilterSidebar';
import {
  getProducts,
  getNewProducts,
  getBestsellers,
  getDiscountedProducts,
} from '../../services/customerProductService';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'bestseller', label: 'Bán chạy' },
  { value: 'discount', label: 'Giảm giá nhiều' },
];

const mockProducts = [
  { productId: 1001, name: 'Áo Polo Nam Premium Flex', categoryId: 1, categoryName: 'Áo Nam', basePrice: 350000, discountPrice: 299000, finalPrice: 299000, discountPercent: 15, soldCount: 142, images: [], primaryImage: '', availableSizes: ['M', 'L', 'XL'], availableColors: ['Đen', 'Trắng'] },
  { productId: 1002, name: 'Quần Jean Slimfit Co Giãn', categoryId: 2, categoryName: 'Quần Nam', basePrice: 550000, discountPrice: 480000, finalPrice: 480000, discountPercent: 13, soldCount: 98, images: [], primaryImage: '', availableSizes: ['30', '32', '34'], availableColors: ['Xanh dương'] },
  { productId: 1003, name: 'Váy Dáng Xòe Floral Spring', categoryId: 3, categoryName: 'Váy Nữ', basePrice: 620000, discountPrice: 550000, finalPrice: 550000, discountPercent: 11, soldCount: 76, images: [], primaryImage: '', availableSizes: ['S', 'M', 'L'], availableColors: ['Trắng', 'Be'] },
  { productId: 1004, name: 'Áo Khoác Bomber Minimalist', categoryId: 4, categoryName: 'Áo Khoác', basePrice: 850000, discountPrice: null, finalPrice: 850000, discountPercent: 0, soldCount: 24, images: [], primaryImage: '', availableSizes: ['M', 'L'], availableColors: ['Đen'] },
  { productId: 1005, name: 'Áo Thun Cotton Basic', categoryId: 1, categoryName: 'Áo Nam', basePrice: 180000, discountPrice: 150000, finalPrice: 150000, discountPercent: 17, soldCount: 220, images: [], primaryImage: '', availableSizes: ['S', 'M', 'L', 'XL'], availableColors: ['Đen', 'Trắng', 'Xám'] },
  { productId: 1006, name: 'Quần Short Kaki Nam', categoryId: 2, categoryName: 'Quần Nam', basePrice: 280000, discountPrice: 220000, finalPrice: 220000, discountPercent: 21, soldCount: 110, images: [], primaryImage: '', availableSizes: ['30', '32', '34'], availableColors: ['Xám', 'Be'] },
  { productId: 1007, name: 'Đầm Midi Hoa Nhí Hàn Quốc', categoryId: 3, categoryName: 'Váy Nữ', basePrice: 480000, discountPrice: 399000, finalPrice: 399000, discountPercent: 17, soldCount: 88, images: [], primaryImage: '', availableSizes: ['S', 'M', 'L'], availableColors: ['Trắng', 'Hồng'] },
  { productId: 1008, name: 'Áo Hoodie Unisex Streetwear', categoryId: 4, categoryName: 'Áo Khoác', basePrice: 540000, discountPrice: 450000, finalPrice: 450000, discountPercent: 17, soldCount: 67, images: [], primaryImage: '', availableSizes: ['M', 'L', 'XL'], availableColors: ['Đen', 'Xám'] },
];

const sortMock = (list, sortBy) => {
  const arr = [...list];
  switch (sortBy) {
    case 'price_asc': arr.sort((a, b) => Number(a.finalPrice) - Number(b.finalPrice)); break;
    case 'price_desc': arr.sort((a, b) => Number(b.finalPrice) - Number(a.finalPrice)); break;
    case 'bestseller': arr.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)); break;
    case 'discount': arr.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0)); break;
    default: break;
  }
  return arr;
};

const filterMock = (list, filters) => {
  return list.filter((p) => {
    if (filters.categoryId && p.categoryId !== filters.categoryId) return false;
    if (filters.gender && filters.gender === 'nam' && !p.categoryName?.toLowerCase().includes('nam')) return false;
    if (filters.gender && filters.gender === 'nu' && !p.categoryName?.toLowerCase().includes('nữ')) return false;
    if (filters.minPrice && Number(p.finalPrice) < Number(filters.minPrice)) return false;
    if (filters.maxPrice && Number(p.finalPrice) > Number(filters.maxPrice)) return false;
    if (filters.size && !(p.availableSizes || []).includes(filters.size)) return false;
    if (filters.color && !(p.availableColors || []).includes(filters.color)) return false;
    return true;
  });
};

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKeyword = searchParams.get('keyword') || '';

  const [filters, setFilters] = useState({
    keyword: initialKeyword,
    categoryId: null,
    gender: '',
    minPrice: '',
    maxPrice: '',
    color: '',
    size: '',
  });
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const [size] = useState(12);

  const [products, setProducts] = useState(mockProducts);
  const [totalElements, setTotalElements] = useState(mockProducts.length);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [discounted, setDiscounted] = useState([]);

  useEffect(() => {
    const kw = searchParams.get('keyword') || '';
    if (kw !== filters.keyword) {
      setFilters((f) => ({ ...f, keyword: kw }));
      setPage(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getProducts({
          keyword: filters.keyword || '',
          categoryId: filters.categoryId || null,
          gender: filters.gender || null,
          minPrice: filters.minPrice || null,
          maxPrice: filters.maxPrice || null,
          color: filters.color || null,
          variantSize: filters.size || null,
          inStockOnly: filters.inStockOnly || false,
          sortBy,
          page,
          size,
        });
        if (cancelled) return;
        setProducts(data.content || []);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 1);
        setIsLive(true);
      } catch (err) {
        if (cancelled) return;
        console.warn('getProducts fallback to mock:', err);
        const filtered = filterMock(mockProducts, filters);
        const sorted = sortMock(filtered, sortBy);
        const total = sorted.length;
        const tp = Math.max(1, Math.ceil(total / size));
        const from = page * size;
        setProducts(sorted.slice(from, from + size));
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
  }, [filters, sortBy, page]);

  // Load recommendation lists once on mount (only when no filter/keyword)
  useEffect(() => {
    if (filters.keyword || filters.categoryId || filters.gender || filters.minPrice || filters.maxPrice || filters.color || filters.size) return;
    let cancelled = false;
    Promise.all([
      getNewProducts(8).catch(() => []),
      getBestsellers(8).catch(() => []),
      getDiscountedProducts(8).catch(() => []),
    ]).then(([fresh, hot, deals]) => {
      if (cancelled) return;
      setNewArrivals(Array.isArray(fresh) ? fresh : []);
      setBestSellers(Array.isArray(hot) ? hot : []);
      setDiscounted(Array.isArray(deals) ? deals : []);
    });
    return () => { cancelled = true; };
  }, [filters]);

  const handleFilterChange = (next) => {
    setFilters(next);
    setPage(0);
    const sp = new URLSearchParams(searchParams);
    if (next.keyword) sp.set('keyword', next.keyword);
    else sp.delete('keyword');
    setSearchParams(sp, { replace: true });
  };

  const banner = useMemo(() => {
    if (filters.keyword) return `Kết quả tìm kiếm cho "${filters.keyword}"`;
    if (filters.categoryId) return 'Danh sách sản phẩm';
    return 'Tất cả sản phẩm';
  }, [filters]);

  return (
    <div className="shop-page">
      <div className="shop-hero">
        <h1>{banner}</h1>
        <p>{totalElements} sản phẩm</p>
      </div>

      {!filters.keyword && !filters.categoryId && !filters.gender && !filters.minPrice && !filters.maxPrice && !filters.color && !filters.size && (newArrivals.length > 0 || bestSellers.length > 0 || discounted.length > 0) && (
        <div className="shop-recommendations">
          {newArrivals.length > 0 && (
            <section className="shop-rec-block">
              <h2 className="shop-rec-title">Sản phẩm mới</h2>
              <div className="shop-rec-row">
                {newArrivals.map((p) => <ProductCard key={p.productId} product={p} />)}
              </div>
            </section>
          )}
          {bestSellers.length > 0 && (
            <section className="shop-rec-block">
              <h2 className="shop-rec-title">Bán chạy</h2>
              <div className="shop-rec-row">
                {bestSellers.map((p) => <ProductCard key={p.productId} product={p} />)}
              </div>
            </section>
          )}
          {discounted.length > 0 && (
            <section className="shop-rec-block">
              <h2 className="shop-rec-title">Đang giảm giá</h2>
              <div className="shop-rec-row">
                {discounted.map((p) => <ProductCard key={p.productId} product={p} />)}
              </div>
            </section>
          )}
        </div>
      )}

      <div className="shop-body">
        <ProductFilterSidebar filters={filters} onChange={handleFilterChange} />

        <section className="shop-content">
          <div className="shop-toolbar">
            <div className="shop-toolbar-info">
              {isLive ? (
                <span className="shop-live-badge">● Trực tiếp</span>
              ) : (
                <span className="shop-offline-badge">● Chế độ demo</span>
              )}
              {loading && <span className="shop-loading">Đang tải…</span>}
            </div>
            <div className="shop-toolbar-sort">
              <label>Sắp xếp:</label>
              <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(0); }}>
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {products.length === 0 && !loading ? (
            <div className="shop-empty">
              <span>🛍️</span>
              <p>Không tìm thấy sản phẩm phù hợp.</p>
              <button className="shop-empty-reset" onClick={() => handleFilterChange({ keyword: '', categoryId: null, gender: '', minPrice: '', maxPrice: '', color: '', size: '' })}>
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="shop-grid">
              {products.map((p) => (
                <ProductCard key={p.productId} product={p} />
              ))}
            </div>
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
