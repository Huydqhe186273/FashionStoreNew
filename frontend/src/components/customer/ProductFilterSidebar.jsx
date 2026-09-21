import React, { useEffect, useMemo, useState } from 'react';
import { getAllCategories } from '../../services/customerCategoryService';
import { getFilterFacets } from '../../services/filterService';

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
   SMART FILTER SIDEBAR (v2 — quality-aware)

   Now exposes six new chip groups so shoppers can drill into
   "real" products that have images, descriptions, discounts,
   variants, and popularity — instead of placeholder rows.

   1. Quality flags       (3 chips)  : Có ảnh, Có mô tả, Còn hàng
   2. Discount % chips    (4 chips)  : ≥10%, ≥30%, ≥50%, ≥70%
   3. Popularity chips    (3 chips)  : Bán chạy, Hot, Top
   4. Size-count chips    (3 chips)  : 1 size, 2-3 sizes, ≥4 sizes
   5. Color-count chips   (3 chips)  : 1 màu, 2-3 màu, ≥4 màu
   6. Đầy đủ thông số     (1 chip)   : hoàn thiện (ảnh+mô tả+≥1 size)
   ----------------------------------------------------------------- */

const PRICE_PRESETS = [
  { id: '0-200',      label: 'Dưới 200k',     min: 0,       max: 200000  },
  { id: '200-500',    label: '200k – 500k',   min: 200000,  max: 500000  },
  { id: '500-1000',   label: '500k – 1tr',    min: 500000,  max: 1000000 },
  { id: '1000-2000',  label: '1tr – 2tr',     min: 1000000, max: 2000000 },
  { id: '2000',       label: 'Trên 2tr',      min: 2000000, max: null    },
];

/** Preset chips for "đầy đủ size" — min distinct sizes threshold. */
const SIZE_COUNT_PRESETS = [
  { id: 'size-1', label: '1 size',     minSizeCount: 1 },
  { id: 'size-2', label: '2–3 sizes',  minSizeCount: 2 },
  { id: 'size-4', label: '≥4 sizes',   minSizeCount: 4 },
];

/** Preset chips for "đầy đủ màu" — min distinct colors threshold. */
const COLOR_COUNT_PRESETS = [
  { id: 'color-1', label: '1 màu',     minColorCount: 1 },
  { id: 'color-2', label: '2–3 màu',   minColorCount: 2 },
  { id: 'color-4', label: '≥4 màu',    minColorCount: 4 },
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

  // Aggregated facets (sizes, colors, genders, price buckets, smart facets)
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
    hasImage: false,
    hasDescription: false,
    hasDiscount: false,
    completeOnly: false,
    minDiscountPercent: null,
    minSoldCount: null,
    minSizeCount: null,
    minColorCount: null,
  });

  const toggleSize = (s) => update({ size: filters.size === s ? '' : s });
  const toggleColor = (c) => update({ color: filters.color === c ? '' : c });
  const toggleBool = (key) => update({ [key]: !filters[key] });

  const applyPricePreset = (preset) => {
    if (detectActivePreset(filters.minPrice, filters.maxPrice) === preset.id) {
      update({ minPrice: '', maxPrice: '' });
      return;
    }
    update({
      minPrice: preset.min === 0 ? '' : String(preset.min),
      maxPrice: preset.max === null ? '' : String(preset.max),
    });
  };

  const applyDiscountBucket = (b) => {
    update({
      minDiscountPercent:
        filters.minDiscountPercent === b.minPercent ? null : b.minPercent,
    });
  };

  const applyPopularityBucket = (b) => {
    update({
      minSoldCount: filters.minSoldCount === b.minCount ? null : b.minCount,
    });
  };

  const applySizeCountPreset = (p) => {
    update({
      minSizeCount: filters.minSizeCount === p.minSizeCount ? null : p.minSizeCount,
    });
  };

  const applyColorCountPreset = (p) => {
    update({
      minColorCount: filters.minColorCount === p.minColorCount ? null : p.minColorCount,
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
    (filters.inStockOnly ? 1 : 0) +
    (filters.hasImage ? 1 : 0) +
    (filters.hasDescription ? 1 : 0) +
    (filters.hasDiscount ? 1 : 0) +
    (filters.completeOnly ? 1 : 0) +
    (filters.minDiscountPercent ? 1 : 0) +
    (filters.minSoldCount ? 1 : 0) +
    (filters.minSizeCount ? 1 : 0) +
    (filters.minColorCount ? 1 : 0);

  // Helpers for rendering chips with counts (defensive: backend may not
  // yet expose the smart facet on older builds).
  const safe = (v, d = 0) => (typeof v === 'number' ? v : d);

  return (
    <aside className="filter-sidebar">
      <div className="filter-sidebar-header">
        <h3>
          Bộ lọc thông minh
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

      {/* === Chất lượng sản phẩm (smart chips) === */}
      <div className="filter-group-block">
        <h4>
          Chất lượng sản phẩm
          {!loadingFacets && facets && (
            <span className="filter-group-meta" title="Số sản phẩm hoàn thiện">
              ({safe(facets.productsComplete)} hoàn thiện)
            </span>
          )}
        </h4>
        <div className="filter-quality-chips">
          <button
            type="button"
            className={`filter-quality-chip ${filters.hasImage ? 'active' : ''}`}
            onClick={() => toggleBool('hasImage')}
            disabled={!loadingFacets && safe(facets?.productsWithImages) === 0}
            title="Sản phẩm có ít nhất một hình ảnh"
          >
            <span className="filter-quality-icon">🖼</span>
            <span className="filter-quality-label">Có hình ảnh</span>
            {!loadingFacets && (
              <span className="filter-pill-count">{safe(facets?.productsWithImages)}</span>
            )}
          </button>
          <button
            type="button"
            className={`filter-quality-chip ${filters.hasDescription ? 'active' : ''}`}
            onClick={() => toggleBool('hasDescription')}
            disabled={!loadingFacets && safe(facets?.productsWithDescription) === 0}
            title="Sản phẩm có mô tả chi tiết"
          >
            <span className="filter-quality-icon">📝</span>
            <span className="filter-quality-label">Có mô tả</span>
            {!loadingFacets && (
              <span className="filter-pill-count">{safe(facets?.productsWithDescription)}</span>
            )}
          </button>
          <button
            type="button"
            className={`filter-quality-chip ${filters.inStockOnly ? 'active' : ''}`}
            onClick={() => toggleBool('inStockOnly')}
            disabled={!loadingFacets && safe(facets?.productsInStock) === 0}
            title="Sản phẩm còn hàng"
          >
            <span className="filter-quality-icon">📦</span>
            <span className="filter-quality-label">Còn hàng</span>
            {!loadingFacets && (
              <span className="filter-pill-count">{safe(facets?.productsInStock)}</span>
            )}
          </button>
        </div>
      </div>

      {/* === Đầy đủ thông số (1 chip tổng hợp) === */}
      <div className="filter-group-block">
        <button
          type="button"
          className={`filter-complete-chip ${filters.completeOnly ? 'active' : ''}`}
          onClick={() => toggleBool('completeOnly')}
          disabled={!loadingFacets && safe(facets?.productsComplete) === 0}
          title="Sản phẩm có ảnh + mô tả + ít nhất 1 biến thể size"
        >
          <span className="filter-quality-icon">✓</span>
          <span className="filter-quality-label">Đầy đủ thông số</span>
          {!loadingFacets && (
            <span className="filter-pill-count">{safe(facets?.productsComplete)}</span>
          )}
        </button>
      </div>

      {/* === Giảm giá theo % === */}
      <div className="filter-group-block">
        <h4>Mức giảm giá</h4>
        <div className="filter-discount-chips">
          {(facets?.discountBuckets || []).map((b) => (
            <button
              key={b.minPercent}
              type="button"
              disabled={b.count === 0 && !loadingFacets}
              className={`filter-discount-chip ${filters.minDiscountPercent === b.minPercent ? 'active' : ''}`}
              onClick={() => applyDiscountBucket(b)}
              title={`Sản phẩm ${b.label.toLowerCase()} (${b.count} sp)`}
            >
              <span>{b.label}</span>
              {!loadingFacets && <span className="filter-pill-count">{b.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* === Độ phổ biến === */}
      <div className="filter-group-block">
        <h4>Độ phổ biến</h4>
        <div className="filter-popularity-chips">
          {(facets?.popularityBuckets || []).map((b) => (
            <button
              key={b.minCount}
              type="button"
              disabled={b.count === 0 && !loadingFacets}
              className={`filter-popularity-chip ${filters.minSoldCount === b.minCount ? 'active' : ''}`}
              onClick={() => applyPopularityBucket(b)}
              title={`Sản phẩm đã bán ≥ ${b.minCount} (${b.count} sp)`}
            >
              <span className="filter-quality-icon">🔥</span>
              <span>{b.label}</span>
              {!loadingFacets && <span className="filter-pill-count">{b.count}</span>}
            </button>
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
        {/* Size-count chips */}
        <div className="filter-size-count-chips">
          {SIZE_COUNT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`filter-quality-chip ${filters.minSizeCount === p.minSizeCount ? 'active' : ''}`}
              onClick={() => applySizeCountPreset(p)}
              title={`Sản phẩm có ≥${p.minSizeCount} size khác nhau`}
            >
              <span>{p.label}</span>
            </button>
          ))}
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
        {/* Color-count chips */}
        <div className="filter-color-count-chips">
          {COLOR_COUNT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`filter-quality-chip ${filters.minColorCount === p.minColorCount ? 'active' : ''}`}
              onClick={() => applyColorCountPreset(p)}
              title={`Sản phẩm có ≥${p.minColorCount} màu khác nhau`}
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
