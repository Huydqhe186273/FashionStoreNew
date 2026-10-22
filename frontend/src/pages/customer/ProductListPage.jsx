import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../../components/customer/ProductCard';
import ProductSearch from '../../components/customer/ProductSearch';
import ShopFilterBar from '../../components/customer/ShopFilterBar';
import { getProducts } from '../../services/customerProductService';
import { getFilterFacets } from '../../services/filterService';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import './shop.css';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Mới nhất',         sortDir: 'desc' },
  { value: 'price_asc',  label: 'Giá tăng dần',     sortDir: 'asc'  },
  { value: 'price_desc', label: 'Giá giảm dần',     sortDir: 'desc' },
  { value: 'bestseller', label: 'Bán chạy',         sortDir: 'desc' },
  { value: 'favorites',  label: 'Yêu thích',         sortDir: 'desc' },
];

/* sortDir for the current sortBy — kept here so the request to the
 * backend is unambiguous. Backend `CustomerProductService` keys
 * `price_asc`/`price_desc` with built-in direction (see
 * `buildComparator`), so for those we MUST send sortDir=asc; for
 * everything else we follow the SORT_OPTIONS table above. */
function sortDirFor(sortBy) {
  const opt = SORT_OPTIONS.find((o) => o.value === sortBy);
  return opt ? opt.sortDir : 'desc';
}

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKeyword = searchParams.get('keyword') || '';

  const [filters, setFilters] = useState({
    keyword: initialKeyword,
    categoryId: null,
    minPrice: '',
    maxPrice: '',
    size: '',
    minDiscountPercent: null,
  });
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const [size] = useState(18);

  const [products, setProducts] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [facets, setFacets] = useState(null);

  useDocumentTitle('Sản phẩm');

  // Fetch facets once for the price-slider bounds.
  useEffect(() => {
    let cancelled = false;
    getFilterFacets()
      .then((res) => { if (!cancelled) setFacets(res); })
      .catch(() => { if (!cancelled) setFacets(null); });
    return () => { cancelled = true; };
  }, []);

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
        const sizeList = filters.size ? String(filters.size).split(',').filter(Boolean) : [];
        const data = await getProducts({
          keyword: filters.keyword || '',
          categoryId: filters.categoryId || null,
          minPrice: filters.minPrice || null,
          maxPrice: filters.maxPrice || null,
          variantSize: sizeList[0] || null,
          minDiscountPercent: filters.minDiscountPercent || null,
          sortBy,
          sortDir: sortDirFor(sortBy),
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
        console.warn('getProducts error:', err);
        setProducts([]);
        setTotalElements(0);
        setTotalPages(1);
        setIsLive(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy, page]);

  /* ---------- handlers for ShopFilterBar ---------- */

  const changeFilters = (next) => {
    setFilters(next);
    setPage(0);
    const sp = new URLSearchParams(searchParams);
    if (next.keyword) sp.set('keyword', next.keyword);
    else sp.delete('keyword');
    setSearchParams(sp, { replace: true });
  };

  const changeSort = (sort) => {
    setSortBy(sort);
    setPage(0);
  };

  const setKeyword = (value) => {
    setFilters((f) => ({ ...f, keyword: value || '' }));
    setPage(0);
    const sp = new URLSearchParams(searchParams);
    if (value) sp.set('keyword', value);
    else sp.delete('keyword');
    setSearchParams(sp, { replace: true });
  };

  const clearAll = () => changeFilters({
    keyword: filters.keyword,
    categoryId: null,
    minPrice: '',
    maxPrice: '',
    size: '',
    minDiscountPercent: null,
  });

  /* ---------- derived UI strings ---------- */

  const banner = useMemo(() => {
    if (filters.keyword) return `Kết quả tìm kiếm cho "${filters.keyword}"`;
    return 'Tất cả sản phẩm';
  }, [filters.keyword]);

  const sortLabel = useMemo(() => {
    const opt = SORT_OPTIONS.find((o) => o.value === sortBy);
    return opt ? opt.label : '';
  }, [sortBy]);

  return (
    <div className="shop-page">
      <div className="shop-hero">
        <h1>{banner}</h1>
        <p>
          <span className="shop-hero-count">{totalElements} sản phẩm</span>
          {loading && <span className="shop-hero-sort-hint"> — đang tải…</span>}
          {!loading && sortLabel && sortBy !== 'newest' && (
            <span className="shop-hero-sort-hint"> — đang lọc theo: {sortLabel}</span>
          )}
        </p>

        {/* === Hero-center keyword search === */}
        <ProductSearch value={filters.keyword} onCommit={setKeyword} />
      </div>

      {/* === Single horizontal filter bar === */}
      <ShopFilterBar
        filters={filters}
        sortBy={sortBy}
        onFiltersChange={changeFilters}
        onSortChange={changeSort}
        facets={facets}
      />

      <div className="shop-source-status" aria-live="polite">
        {isLive && <span className="shop-live-badge" title="Dữ liệu từ API backend">● Trực tiếp</span>}
      </div>

      {products.length === 0 && !loading ? (
        <div className="shop-empty">
          <span>🛍️</span>
          <p>Không tìm thấy sản phẩm phù hợp.</p>
          <button className="shop-empty-reset" onClick={clearAll}>
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
    </div>
  );
}
