import React, { useEffect, useMemo, useState } from 'react';
import { getAllCategories } from '../../services/customerCategoryService';
import { getFilterFacets } from '../../services/customerProductService';

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

/* -----------------------------------------------------------------
   SMART FILTER SIDEBAR

   Improvements over the previous hardcoded version:

   1.  Sizes / colors / genders are loaded from /api/customer/filters
       so the panel only shows values that ACTUALLY exist in the
       catalogue (no more dead "S" pills when nothing is in stock).

   2.  Each option shows a count badge "Đỏ (12)" so the shopper
       sees how many results they'll get before clicking.

   3.  A new "Khoảng giá" section renders 5 preset price buckets
       (Dưới 200k, 200k-500k, 500k-1tr, 1tr-2tr, Trên 2tr) as
       quick-pick chips — much faster than typing two numbers.

   4.  A free-text min/max price input still sits below the chips
       for power-users who want an exact range. Both inputs and
       chips stay in sync; clearing one clears the other.

   5.  A "Có sẵn" (in stock only) toggle is added so shoppers
       don't waste time scrolling through out-of-stock items.
   ----------------------------------------------------------------- */

const PRICE_PRESETS = [
  { id: '0-200',      label: 'Dưới 200k',     min: 0,       max: 200000  },
  { id: '200-500',    label: '200k – 500k',   min: 200000,  max: 500000  },
  { id: '500-1000',   label: '500k – 1tr',    min: 500000,  max: 1000000 },
  { id: '1000-2000',  label: '1tr – 2tr',     min: 1000000, max: 2000000 },
  { id: '2000',       label: 'Trên 2tr',      min: 2000000, max: null    },
];

function detectActivePreset(minPrice, maxPrice) {
  if (minPrice === '' && maxPrice === '') return '';
  const lo = Number(minPrice) || 0;
  const hi = maxPrice === '' ? null : Number(maxPrice);
  const match = PRICE_PRESETS.find((p) => p.min === lo && (p.max === hi || (p.max === null && hi === null)));
  return match ? match.id : '';
}

export default function ProductFilterSidebar({ filters, onChange }) {
  const [flat, setFlat] = useState([]);
  const [facets, setFacets] = useState(null);
  const [loadingFacets, setLoadingFacets] = useState(true);

  // Categories (with product counts)
  useEffect(() => {
    let mounted = true;
    getAllCategories()
      .then((data) => { if (mounted) setFlat(flattenCategories(data || [])); })
      .catch((err) => console.warn('Filter categories load failed:', err));
    return () => { mounted = false; };
  }, []);

  // Aggregated facets (sizes, colors, genders, price buckets)
  useEffect(() => {
    let mounted = true;
    setLoadingFacets(true);
    getFilterFacets()
      .then((data) => { if (mounted) { setFacets(data || null); setLoadingFacets(false); } })
      .catch((err) => { console.warn('Filter facets load failed:', err); if (mounted) setLoadingFacets(false); });
    return () => { mounted = false; };
  }, []);

  const update = (patch) => onChange({ ...filters, ...patch });

  const clearAll = () => onChange({
    keyword: filters.keyword || '',
    categoryId: null,
    gender: '',
    minPrice: '',
    maxPrice: '',
    color: '',
    size: '',
    inStockOnly: false,
  });

  const toggleSize = (s) => update({ size: filters.size === s ? '' : s });
  const toggleColor = (c) => update({ color: filters.color === c ? '' : c });

  const applyPricePreset = (preset) => {
    // If the same preset is clicked again, clear it.
    if (detectActivePreset(filters.minPrice, filters.maxPrice) === preset.id) {
      update({ minPrice: '', maxPrice: '' });
      return;
    }
    update({
      minPrice: preset.min === 0 ? '' : String(preset.min),
      maxPrice: preset.max === null ? '' : String(preset.max),
    });
  };

  const onPriceInputChange = (which, raw) => {
    const value = raw.replace(/[^0-9]/g, '');
    if (which === 'min') update({ minPrice: value });
    else update({ maxPrice: value });
  };

  const activePresetId = useMemo(
    () => detectActivePreset(filters.minPrice, filters.maxPrice),
    [filters.minPrice, filters.maxPrice]
  );

  const activeFilterCount =
    (filters.categoryId ? 1 : 0) +
    (filters.gender ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.color ? 1 : 0) +
    (filters.size ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0);

  return (
    <aside className="filter-sidebar">
      <div className="filter-sidebar-header">
        <h3>
          Bộ lọc
          {activeFilterCount > 0 && (
            <span className="filter-active-count">{activeFilterCount}</span>
          )}
        </h3>
        <button
          type="button"
          className="filter-clear"
          onClick={clearAll}
          disabled={activeFilterCount === 0}
        >
          Xóa hết
        </button>
      </div>

      {/* === Danh mục === */}
      <div className="filter-group-block">
        <h4>Danh mục</h4>
        <div className="filter-categories">
          <button
            type="button"
            className={`filter-cat-pill ${!filters.categoryId ? 'active' : ''}`}
            onClick={() => update({ categoryId: null })}
          >
            Tất cả
          </button>
          {flat.map((cat) => (
            <button
              key={cat.categoryId}
              type="button"
              className={`filter-cat-pill ${filters.categoryId === cat.categoryId ? 'active' : ''}`}
              style={{ paddingLeft: 10 + cat.depth * 12 }}
              onClick={() => update({ categoryId: cat.categoryId })}
            >
              <span className="filter-cat-label">{cat.name}</span>
              {typeof cat.productCount === 'number' && (
                <span className="filter-cat-count">{cat.productCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* === Giới tính (facet-driven) === */}
      <div className="filter-group-block">
        <h4>Giới tính</h4>
        <div className="filter-radio-row">
          <label className={`filter-radio ${!filters.gender ? 'active' : ''}`}>
            <input
              type="radio"
              name="gender"
              checked={!filters.gender}
              onChange={() => update({ gender: '' })}
            />
            <span>Tất cả</span>
          </label>
          {(facets?.genders || []).map((opt) => (
            <label
              key={opt.value}
              className={`filter-radio ${filters.gender === opt.value ? 'active' : ''}`}
              title={`${opt.label} — ${opt.count} sản phẩm`}
            >
              <input
                type="radio"
                name="gender"
                checked={filters.gender === opt.value}
                onChange={() => update({ gender: filters.gender === opt.value ? '' : opt.value })}
              />
              <span>{opt.label}</span>
              <span className="filter-pill-count">{opt.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* === Khoảng giá — preset chips + manual inputs === */}
      <div className="filter-group-block">
        <h4>Khoảng giá</h4>
        <div className="filter-price-chips">
          {PRICE_PRESETS.map((p) => {
            const bucket = (facets?.priceBuckets || []).find((b) => String(b.minPrice) === String(p.min));
            const cnt = bucket ? bucket.count : 0;
            return (
              <button
                key={p.id}
                type="button"
                disabled={cnt === 0 && !loadingFacets}
                className={`filter-price-chip ${activePresetId === p.id ? 'active' : ''}`}
                onClick={() => applyPricePreset(p)}
              >
                <span>{p.label}</span>
                {!loadingFacets && <span className="filter-pill-count">{cnt}</span>}
              </button>
            );
          })}
        </div>
        <div className="filter-price-divider"><span>hoặc</span></div>
        <div className="filter-price-row">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Từ"
            value={filters.minPrice || ''}
            onChange={(e) => onPriceInputChange('min', e.target.value)}
            className="filter-price-input"
          />
          <span>–</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Đến"
            value={filters.maxPrice || ''}
            onChange={(e) => onPriceInputChange('max', e.target.value)}
            className="filter-price-input"
          />
        </div>
        {facets?.minPrice != null && facets?.maxPrice != null && (
          <div className="filter-price-range-hint">
            Khoảng giá hiện có: {Number(facets.minPrice).toLocaleString('vi-VN')}đ
            – {Number(facets.maxPrice).toLocaleString('vi-VN')}đ
          </div>
        )}
      </div>

      {/* === Size === */}
      <div className="filter-group-block">
        <h4>
          Size
          {!loadingFacets && facets?.sizes && (
            <span className="filter-group-meta">({facets.sizes.length})</span>
          )}
        </h4>
        <div className="filter-size-row">
          {loadingFacets && (
            <span className="filter-loading">…</span>
          )}
          {!loadingFacets && (facets?.sizes || []).map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={opt.count === 0}
              className={`filter-size-pill ${filters.size === opt.value ? 'active' : ''}`}
              onClick={() => toggleSize(opt.value)}
              title={`Size ${opt.label} — ${opt.count} sản phẩm`}
            >
              {opt.label}
            </button>
          ))}
          {!loadingFacets && (!facets?.sizes || facets.sizes.length === 0) && (
            <span className="filter-empty">Không có size nào</span>
          )}
        </div>
      </div>

      {/* === Màu sắc === */}
      <div className="filter-group-block">
        <h4>
          Màu sắc
          {!loadingFacets && facets?.colors && (
            <span className="filter-group-meta">({facets.colors.length})</span>
          )}
        </h4>
        <div className="filter-color-row">
          {loadingFacets && <span className="filter-loading">…</span>}
          {!loadingFacets && (facets?.colors || []).map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={opt.count === 0}
              className={`filter-color-pill ${filters.color === opt.value ? 'active' : ''}`}
              onClick={() => toggleColor(opt.value)}
              title={`${opt.label} — ${opt.count} sản phẩm`}
            >
              <span
                className="filter-color-dot"
                style={{ background: opt.hex || '#9ca3af' }}
              />
              <span>{opt.label}</span>
              <span className="filter-pill-count">{opt.count}</span>
            </button>
          ))}
          {!loadingFacets && (!facets?.colors || facets.colors.length === 0) && (
            <span className="filter-empty">Không có màu nào</span>
          )}
        </div>
      </div>

      {/* === Có sẵn (in stock only) === */}
      <div className="filter-group-block">
        <label className="filter-toggle">
          <input
            type="checkbox"
            checked={!!filters.inStockOnly}
            onChange={(e) => update({ inStockOnly: e.target.checked })}
          />
          <span>Chỉ hiện sản phẩm còn hàng</span>
        </label>
      </div>
    </aside>
  );
}
