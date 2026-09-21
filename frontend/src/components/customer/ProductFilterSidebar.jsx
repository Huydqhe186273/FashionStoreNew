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
   PRODUCT FILTER SIDEBAR (v3 — clean, scroll-friendly)

   Layout principles (after v2 feedback "quá nhiều chip rối mắt"):
     1. NO chip grids. Each section is a collapsible header with
        a list of radio rows / inline pills — same shape as
        Shopee / Lazada / most e-commerce filter sidebars.
     2. ONE smart-quality toggle at the top, then 4 collapsible
        sections: Category, Price, Size, Color.
     3. Discount%, popularity, size-count, color-count moved to
        a small "Thêm bộ lọc" disclosure inside each section
        (advanced, hidden by default).
     4. Counts render inline "(123)" so chips don't fight for
        attention with badges.
     5. Each section remembers its own open/closed state so the
        user can collapse the noise.
   ----------------------------------------------------------------- */

const PRICE_PRESETS = [
  { id: '0-200',      label: 'Dưới 200k',     min: 0,       max: 200000  },
  { id: '200-500',    label: '200k – 500k',   min: 200000,  max: 500000  },
  { id: '500-1000',   label: '500k – 1tr',    min: 500000,  max: 1000000 },
  { id: '1000-2000',  label: '1tr – 2tr',     min: 1000000, max: 2000000 },
  { id: '2000',       label: 'Trên 2tr',      min: 2000000, max: null    },
];

const DISCOUNT_OPTIONS = [
  { id: 'd10', label: '≥ 10%', min: 10 },
  { id: 'd30', label: '≥ 30%', min: 30 },
  { id: 'd50', label: '≥ 50%', min: 50 },
];

const POPULARITY_OPTIONS = [
  { id: 'p50',  label: 'Bán chạy (≥ 50)',  minSoldCount: 50  },
  { id: 'p100', label: 'Hot (≥ 100)',      minSoldCount: 100 },
  { id: 'p300', label: 'Top (≥ 300)',      minSoldCount: 300 },
];

function detectActivePreset(minPrice, maxPrice) {
  if (minPrice === '' && maxPrice === '') return '';
  const lo = Number(minPrice) || 0;
  const hi = maxPrice === '' ? null : Number(maxPrice);
  const match = PRICE_PRESETS.find((p) => p.min === lo && (p.max === hi || (p.max === null && hi === null)));
  return match ? match.id : '';
}

/* Reusable collapsible header — no external UI lib. */
function Section({ title, count, open, onToggle, children }) {
  return (
    <section className={`filter-section ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="filter-section-header"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="filter-section-title">
          {title}
          {typeof count === 'number' && count > 0 && (
            <span className="filter-section-count">{count}</span>
          )}
        </span>
        <span className="filter-section-caret" aria-hidden="true">▾</span>
      </button>
      {open && <div className="filter-section-body">{children}</div>}
    </section>
  );
}

export default function ProductFilterSidebar({ filters, onChange }) {
  const [flat, setFlat] = useState([]);
  const [facets, setFacets] = useState(null);
  const [loadingFacets, setLoadingFacets] = useState(true);

  // Open/closed state — start with everything expanded so the user
  // sees all filters at first glance; they can collapse as needed.
  const [openSections, setOpenSections] = useState({
    category: true,
    price:    true,
    size:     true,
    color:    true,
    more:     false,
  });
  const toggleSection = (key) =>
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  // Categories (with product counts)
  useEffect(() => {
    let mounted = true;
    getAllCategories()
      .then((data) => { if (mounted) setFlat(flattenCategories(data || [])); })
      .catch((err) => console.warn('Filter categories load failed:', err));
    return () => { mounted = false; };
  }, []);

  // Aggregated facets
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
    completeOnly: false,
    minDiscountPercent: null,
    minSoldCount: null,
  });

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
    (filters.completeOnly ? 1 : 0) +
    (filters.minDiscountPercent ? 1 : 0) +
    (filters.minSoldCount ? 1 : 0);

  return (
    <aside className="filter-sidebar">
      {/* Header — single line so it never grows. */}
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

      {/* ===== Smart quality row — single line, single toggle ===== */}
      <div className="filter-quality-row">
        <label className="filter-quality-toggle">
          <input
            type="checkbox"
            checked={!!filters.completeOnly}
            onChange={(e) => update({ completeOnly: e.target.checked })}
          />
          <span>Chỉ sản phẩm hoàn thiện</span>
          {!loadingFacets && facets && (
            <span className="filter-quality-count">
              ({facets.productsComplete ?? 0})
            </span>
          )}
        </label>
        <label className="filter-quality-toggle">
          <input
            type="checkbox"
            checked={!!filters.inStockOnly}
            onChange={(e) => update({ inStockOnly: e.target.checked })}
          />
          <span>Còn hàng</span>
          {!loadingFacets && facets && (
            <span className="filter-quality-count">
              ({facets.productsInStock ?? 0})
            </span>
          )}
        </label>
      </div>

      {/* ===== Category ===== */}
      <Section
        title="Danh mục"
        open={openSections.category}
        onToggle={() => toggleSection('category')}
      >
        <ul className="filter-list filter-list-flat">
          <li>
            <button
              type="button"
              className={`filter-list-row ${!filters.categoryId ? 'active' : ''}`}
              onClick={() => update({ categoryId: null })}
            >
              <span>Tất cả</span>
            </button>
          </li>
          {flat.map((cat) => (
            <li key={cat.categoryId}>
              <button
                type="button"
                className={`filter-list-row ${filters.categoryId === cat.categoryId ? 'active' : ''}`}
                style={{ paddingLeft: 10 + cat.depth * 12 }}
                onClick={() => update({ categoryId: cat.categoryId })}
              >
                <span className="filter-list-label">{cat.name}</span>
                {typeof cat.productCount === 'number' && (
                  <span className="filter-list-count">{cat.productCount}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </Section>

      {/* ===== Price ===== */}
      <Section
        title="Khoảng giá"
        open={openSections.price}
        onToggle={() => toggleSection('price')}
      >
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
                {!loadingFacets && <span className="filter-pill-count">({cnt})</span>}
              </button>
            );
          })}
        </div>
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
      </Section>

      {/* ===== Size ===== */}
      <Section
        title="Size"
        count={facets?.sizes?.length ?? null}
        open={openSections.size}
        onToggle={() => toggleSection('size')}
      >
        {loadingFacets && <span className="filter-loading">…</span>}
        {!loadingFacets && (
          <div className="filter-size-pills">
            {(facets?.sizes || []).map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={opt.count === 0}
                className={`filter-size-pill ${filters.size === opt.value ? 'active' : ''}`}
                onClick={() => update({ size: filters.size === opt.value ? '' : opt.value })}
                title={`Size ${opt.label} — ${opt.count} sản phẩm`}
              >
                <span>{opt.label}</span>
                <span className="filter-pill-count">({opt.count})</span>
              </button>
            ))}
            {(!facets?.sizes || facets.sizes.length === 0) && (
              <span className="filter-empty">Không có size nào</span>
            )}
          </div>
        )}
      </Section>

      {/* ===== Color ===== */}
      <Section
        title="Màu sắc"
        count={facets?.colors?.length ?? null}
        open={openSections.color}
        onToggle={() => toggleSection('color')}
      >
        {loadingFacets && <span className="filter-loading">…</span>}
        {!loadingFacets && (
          <div className="filter-color-pills">
            {(facets?.colors || []).map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={opt.count === 0}
                className={`filter-color-pill ${filters.color === opt.value ? 'active' : ''}`}
                onClick={() => update({ color: filters.color === opt.value ? '' : opt.value })}
                title={`${opt.label} — ${opt.count} sản phẩm`}
              >
                <span
                  className="filter-color-dot"
                  style={{ background: opt.hex || '#9ca3af' }}
                />
                <span>{opt.label}</span>
                <span className="filter-pill-count">({opt.count})</span>
              </button>
            ))}
            {(!facets?.colors || facets.colors.length === 0) && (
              <span className="filter-empty">Không có màu nào</span>
            )}
          </div>
        )}
      </Section>

      {/* ===== More filters (advanced) — collapsed by default ===== */}
      <Section
        title="Thêm bộ lọc"
        open={openSections.more}
        onToggle={() => toggleSection('more')}
      >
        <div className="filter-subhead">Giới tính</div>
        <ul className="filter-list">
          <li>
            <label className={`filter-radio-row ${!filters.gender ? 'active' : ''}`}>
              <input
                type="radio"
                name="gender"
                checked={!filters.gender}
                onChange={() => update({ gender: '' })}
              />
              <span>Tất cả</span>
            </label>
          </li>
          {(facets?.genders || []).map((opt) => (
            <li key={opt.value}>
              <label className={`filter-radio-row ${filters.gender === opt.value ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="gender"
                  checked={filters.gender === opt.value}
                  onChange={() => update({ gender: filters.gender === opt.value ? '' : opt.value })}
                />
                <span>{opt.label}</span>
                <span className="filter-list-count">({opt.count})</span>
              </label>
            </li>
          ))}
        </ul>

        <div className="filter-subhead">Mức giảm giá</div>
        <ul className="filter-list">
          <li>
            <label className={`filter-radio-row ${!filters.minDiscountPercent ? 'active' : ''}`}>
              <input
                type="radio"
                name="discount"
                checked={!filters.minDiscountPercent}
                onChange={() => update({ minDiscountPercent: null })}
              />
              <span>Tất cả</span>
            </label>
          </li>
          {(facets?.discountBuckets || []).map((b) => (
            <li key={b.minPercent}>
              <label className={`filter-radio-row ${filters.minDiscountPercent === b.minPercent ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="discount"
                  checked={filters.minDiscountPercent === b.minPercent}
                  onChange={() => update({
                    minDiscountPercent: filters.minDiscountPercent === b.minPercent ? null : b.minPercent,
                  })}
                />
                <span>{b.label}</span>
                {!loadingFacets && <span className="filter-list-count">({b.count})</span>}
              </label>
            </li>
          ))}
        </ul>

        <div className="filter-subhead">Độ phổ biến</div>
        <ul className="filter-list">
          <li>
            <label className={`filter-radio-row ${!filters.minSoldCount ? 'active' : ''}`}>
              <input
                type="radio"
                name="popularity"
                checked={!filters.minSoldCount}
                onChange={() => update({ minSoldCount: null })}
              />
              <span>Tất cả</span>
            </label>
          </li>
          {POPULARITY_OPTIONS.map((p) => {
            const bucket = (facets?.popularityBuckets || []).find((b) => b.minCount === p.minSoldCount);
            const cnt = bucket ? bucket.count : 0;
            return (
              <li key={p.id}>
                <label className={`filter-radio-row ${filters.minSoldCount === p.minSoldCount ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="popularity"
                    checked={filters.minSoldCount === p.minSoldCount}
                    onChange={() => update({
                      minSoldCount: filters.minSoldCount === p.minSoldCount ? null : p.minSoldCount,
                    })}
                  />
                  <span>{p.label}</span>
                  {!loadingFacets && <span className="filter-list-count">({cnt})</span>}
                </label>
              </li>
            );
          })}
        </ul>
      </Section>
    </aside>
  );
}
