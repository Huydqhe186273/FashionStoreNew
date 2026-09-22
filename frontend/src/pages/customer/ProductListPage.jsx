import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../../components/customer/ProductCard';
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

/* ----- clothing-domain constants used to enrich mockProducts -----
 * Centralised so the mock and the artwork generator agree on the
 * vocabulary (no "Ao thun" without diacritics slipping in). */
const TOP_SIZES    = ['S', 'M', 'L', 'XL'];
const TOP_SIZES_NU = ['XS', 'S', 'M', 'L'];
const PANT_SIZES   = ['28', '30', '32', '34', '36'];
const DRESS_SIZES  = ['S', 'M', 'L', 'XL'];
const SHOE_SIZES   = ['39', '40', '41', '42', '43'];
const ACC_SIZES    = ['Free Size'];
const NEUTRAL_COLORS = ['Đen', 'Trắng', 'Xám'];
const WARM_COLORS    = ['Đen', 'Nâu', 'Be'];
const COOL_COLORS    = ['Đen', 'Xanh dương', 'Trắng'];
const FLORAL_COLORS  = ['Trắng', 'Hồng', 'Be'];
const DENIM_COLORS   = ['Xanh dương', 'Xanh nhạt', 'Đen'];
const LEATHER_COLORS = ['Đen', 'Nâu', 'Be'];
const HOODIE_COLORS  = ['Đen', 'Xám', 'Xanh dương'];
const POLO_COLORS    = ['Trắng', 'Xanh dương', 'Đen'];
const GIRL_COLORS    = ['Hồng', 'Trắng', 'Tím'];

const mockProducts = [
  { productId: 1001, name: 'Áo Polo Nam Premium Flex', categoryId: 1, categoryName: 'Áo Nam', basePrice: 350000, discountPrice: 299000, finalPrice: 299000, discountPercent: 15, soldCount: 142, images: [], primaryImage: '', availableSizes: TOP_SIZES, availableColors: POLO_COLORS },
  { productId: 1002, name: 'Quần Jean Slimfit Co Giãn', categoryId: 2, categoryName: 'Quần Nam', basePrice: 550000, discountPrice: 480000, finalPrice: 480000, discountPercent: 13, soldCount: 98, images: [], primaryImage: '', availableSizes: PANT_SIZES, availableColors: DENIM_COLORS },
  { productId: 1003, name: 'Váy Dáng Xòe Floral Spring', categoryId: 3, categoryName: 'Váy Nữ', basePrice: 620000, discountPrice: 550000, finalPrice: 550000, discountPercent: 11, soldCount: 76, images: [], primaryImage: '', availableSizes: DRESS_SIZES, availableColors: FLORAL_COLORS },
  { productId: 1004, name: 'Áo Khoác Bomber Minimalist', categoryId: 4, categoryName: 'Áo Khoác', basePrice: 850000, discountPrice: null, finalPrice: 850000, discountPercent: 0, soldCount: 24, images: [], primaryImage: '', availableSizes: TOP_SIZES, availableColors: ['Đen', 'Xám', 'Nâu'] },
  { productId: 1005, name: 'Áo Thun Cotton Basic', categoryId: 1, categoryName: 'Áo Nam', basePrice: 180000, discountPrice: 150000, finalPrice: 150000, discountPercent: 17, soldCount: 220, images: [], primaryImage: '', availableSizes: TOP_SIZES, availableColors: NEUTRAL_COLORS },
  { productId: 1006, name: 'Quần Short Kaki Nam', categoryId: 2, categoryName: 'Quần Nam', basePrice: 280000, discountPrice: 220000, finalPrice: 220000, discountPercent: 21, soldCount: 110, images: [], primaryImage: '', availableSizes: PANT_SIZES, availableColors: WARM_COLORS },
  { productId: 1007, name: 'Đầm Midi Hoa Nhí Hàn Quốc', categoryId: 3, categoryName: 'Váy Nữ', basePrice: 480000, discountPrice: 399000, finalPrice: 399000, discountPercent: 17, soldCount: 88, images: [], primaryImage: '', availableSizes: DRESS_SIZES, availableColors: FLORAL_COLORS },
  { productId: 1008, name: 'Áo Hoodie Unisex Streetwear', categoryId: 4, categoryName: 'Áo Khoác', basePrice: 540000, discountPrice: 450000, finalPrice: 450000, discountPercent: 17, soldCount: 67, images: [], primaryImage: '', availableSizes: TOP_SIZES, availableColors: HOODIE_COLORS },
  { productId: 1009, name: 'Áo Sơ Mi Oxford Nữ', categoryId: 3, categoryName: 'Váy Nữ', basePrice: 420000, discountPrice: 369000, finalPrice: 369000, discountPercent: 12, soldCount: 56, images: [], primaryImage: '', availableSizes: TOP_SIZES_NU, availableColors: ['Trắng', 'Xanh nhạt', 'Hồng'] },
  { productId: 1010, name: 'Quần Tây Âu Nam Slim', categoryId: 2, categoryName: 'Quần Nam', basePrice: 690000, discountPrice: 599000, finalPrice: 599000, discountPercent: 13, soldCount: 41, images: [], primaryImage: '', availableSizes: PANT_SIZES, availableColors: ['Đen', 'Xám', 'Xanh dương'] },
  { productId: 1011, name: 'Áo Len Cổ Lọ Nữ', categoryId: 3, categoryName: 'Váy Nữ', basePrice: 460000, discountPrice: null, finalPrice: 460000, discountPercent: 0, soldCount: 19, images: [], primaryImage: '', availableSizes: TOP_SIZES_NU, availableColors: ['Be', 'Hồng', 'Trắng'] },
  { productId: 1012, name: 'Áo Thun In Họa Tiết', categoryId: 1, categoryName: 'Áo Nam', basePrice: 220000, discountPrice: 179000, finalPrice: 179000, discountPercent: 19, soldCount: 132, images: [], primaryImage: '', availableSizes: TOP_SIZES, availableColors: ['Trắng', 'Đen', 'Đỏ'] },
  { productId: 1013, name: 'Váy Tennis Ngắn Trẻ Trung', categoryId: 3, categoryName: 'Váy Nữ', basePrice: 380000, discountPrice: 319000, finalPrice: 319000, discountPercent: 16, soldCount: 72, images: [], primaryImage: '', availableSizes: DRESS_SIZES, availableColors: ['Trắng', 'Be', 'Hồng pastel'] },
  { productId: 1014, name: 'Áo Bomber Nam Denim', categoryId: 4, categoryName: 'Áo Khoác', basePrice: 920000, discountPrice: 799000, finalPrice: 799000, discountPercent: 13, soldCount: 28, images: [], primaryImage: '', availableSizes: TOP_SIZES, availableColors: DENIM_COLORS },
  { productId: 1015, name: 'Quần Jogger Nam Thun', categoryId: 2, categoryName: 'Quần Nam', basePrice: 340000, discountPrice: 269000, finalPrice: 269000, discountPercent: 21, soldCount: 95, images: [], primaryImage: '', availableSizes: PANT_SIZES, availableColors: ['Đen', 'Xám', 'Xanh dương'] },
  { productId: 1016, name: 'Áo Kiểu Nữ Tay Phồng', categoryId: 3, categoryName: 'Váy Nữ', basePrice: 540000, discountPrice: 449000, finalPrice: 449000, discountPercent: 17, soldCount: 48, images: [], primaryImage: '', availableSizes: TOP_SIZES_NU, availableColors: GIRL_COLORS },
  { productId: 1017, name: 'Áo Vest Nam Hàn Quốc', categoryId: 4, categoryName: 'Áo Khoác', basePrice: 1280000, discountPrice: 1099000, finalPrice: 1099000, discountPercent: 14, soldCount: 15, images: [], primaryImage: '', availableSizes: TOP_SIZES, availableColors: ['Đen', 'Xám', 'Xanh dương đậm'] },
  { productId: 1018, name: 'Áo Tank Top Nam Basic', categoryId: 1, categoryName: 'Áo Nam', basePrice: 150000, discountPrice: null, finalPrice: 150000, discountPercent: 0, soldCount: 12, images: [], primaryImage: '', availableSizes: TOP_SIZES, availableColors: NEUTRAL_COLORS },
];

const sortMock = (list, sortBy) => {
  const arr = [...list];
  switch (sortBy) {
    case 'price_asc': arr.sort((a, b) => Number(a.finalPrice) - Number(b.finalPrice)); break;
    case 'price_desc': arr.sort((a, b) => Number(b.finalPrice) - Number(a.finalPrice)); break;
    case 'bestseller': arr.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)); break;
    default: break;
  }
  return arr;
};

const filterMock = (list, filters) => {
  // ShopFilterBar passes size as a CSV string ("M,L"). Mock has
  // availableSizes array — intersect via single-token OR for
  // parity with the old UI's behaviour.
  const sizes = (filters.size ? String(filters.size).split(',').filter(Boolean) : []);
  return list.filter((p) => {
    if (filters.categoryId && p.categoryId !== filters.categoryId) return false;
    if (filters.minPrice && Number(p.finalPrice) < Number(filters.minPrice)) return false;
    if (filters.maxPrice && Number(p.finalPrice) > Number(filters.maxPrice)) return false;
    if (filters.minDiscountPercent && (p.discountPercent || 0) < Number(filters.minDiscountPercent)) return false;
    if (sizes.length > 0 && !sizes.some((s) => (p.availableSizes || []).includes(s))) return false;
    return true;
  });
};

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
  /* Page size = 18 (= 3 rows × 6 columns). Keeps the layout
   * balanced in every screen state — empty rows are fine, weird
   * "lone card on row 4" never happens. */
  const [size] = useState(18);

  const [products, setProducts] = useState(mockProducts);
  const [totalElements, setTotalElements] = useState(mockProducts.length);
  const [totalPages, setTotalPages] = useState(Math.max(1, Math.ceil(mockProducts.length / 18)));
  const [loading, setLoading] = useState(false);
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
        // The ShopFilterBar emits a CSV in filters.size, but the
        // backend's /api/customer/products still only accepts a
        // single variantSize. Pick the first one for the request —
        // the multi-select UI promise still applies because every
        // chip clears with one click and the toolbar shows the full
        // list.
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
          {totalElements} sản phẩm
          {loading && <span className="shop-hero-sort-hint"> — đang tải…</span>}
          {!loading && sortLabel && sortBy !== 'newest' && (
            <span className="shop-hero-sort-hint"> — đang lọc theo: {sortLabel}</span>
          )}
        </p>
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
        {isLive ? (
          <span className="shop-live-badge" title="Dữ liệu từ API backend">● API</span>
        ) : (
          <span className="shop-offline-badge" title="Backend không phản hồi — đang hiển thị dữ liệu mẫu">● Mock</span>
        )}
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
