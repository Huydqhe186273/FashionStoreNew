import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getAllCategories } from '../../services/customerCategoryService';
import { flattenCategories, slugify } from '../../services/filterService';
import './ShopFilterBar.css';

/* -----------------------------------------------------------------------------
 * ShopFilterBar
 * ------------------------------------------------------------
 * Single horizontal filter bar that replaces the old sidebar +
 * category tabs combination on /Shop.

 * Layout (top → bottom):
 *   Row 1  •  Category pills, horizontally scrollable. Active pill
 *           is filled black; inactive pills are outlined.
 *   Row 2  •  [Bộ lọc] button (with badge count)  ──  chips of
 *           currently-applied filters (click × to remove)  ──
 *           [Sắp xếp: <select>] aligned right.
 *
 * Clicking [Bộ lọc] opens a popover anchored to that button. The
 * popover owns a DRAFT copy of the price slider, size pills and
 * "≥30% off" smart chip — so users can fiddle without committing
 * until they hit [Áp dụng]. [Xoá lọc] clears the draft + parent.
 *
 * Controlled component: parent owns `filters` + `sortBy` and supplies
 * callbacks. We do not call any backend ourselves.
 * -------------------------------------------------------------------------- */

/* Quickset chip IDs the popover emits into `filters`. Keep in sync
 * with the size-pill onClick handlers below. */
const SIZE_VALUES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const POPOVER_PRICE_DEFAULT_CAP = 3_000_000;

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Mới nhất' },
  { value: 'price_asc',  label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'bestseller', label: 'Bán chạy' },
];

/* ----- helpers ----- */

function formatVND(n) {
  return Number(n || 0).toLocaleString('vi-VN');
}

function priceBoundsFromFacets(facets) {
  const lo = Number(facets?.minPrice);
  const hi = Number(facets?.maxPrice);
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo >= hi) {
    return { min: 0, max: POPOVER_PRICE_DEFAULT_CAP };
  }
  return { min: Math.max(0, Math.floor(lo)), max: Math.ceil(hi) };
}

function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v == null || v === '') return [];
  return [v];
}

/* ----- tiny uncontrolled slider. Two ranges overlaid, no deps. ----- */
function PriceSlider({ min, max, valueMin, valueMax, onChange }) {
  const ceiling = max;
  const lo = Math.max(min, valueMin ?? min);
  const hi = Math.min(ceiling, valueMax ?? ceiling);
  const pctLo = ((lo - min) / (ceiling - min || 1)) * 100;
  const pctHi = ((hi - min) / (ceiling - min || 1)) * 100;

  const setLo = (v) => onChange({
    min: Math.min(Number(v), hi - 10000),
    max: hi,
  });
  const setHi = (v) => onChange({
    min: lo,
    max: Math.max(Number(v), lo + 10000),
  });

  return (
    <div className="filterbar-range">
      <div className="filterbar-range-track">
        <div
          className="filterbar-range-fill"
          style={{ left: `${pctLo}%`, width: `${pctHi - pctLo}%` }}
        />
        <input
          type="range"
          min={min}
          max={ceiling}
          step={10000}
          value={lo}
          onChange={(e) => setLo(e.target.value)}
          aria-label="Giá tối thiểu"
        />
        <input
          type="range"
          min={min}
          max={ceiling}
          step={10000}
          value={hi}
          onChange={(e) => setHi(e.target.value)}
          aria-label="Giá tối đa"
        />
      </div>
      <div className="filterbar-range-readout">
        <span>{formatVND(lo)}đ</span>
        <span>–</span>
        <span>{formatVND(hi)}đ</span>
      </div>
    </div>
  );
}

/* ----- main component ----- */

export default function ShopFilterBar({
  filters = {},
  sortBy = 'newest',
  onFiltersChange,
  onSortChange,
  facets,
}) {
  /* category list ----------------------------------------------------- */
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    let alive = true;
    getAllCategories()
      .then((tree) => {
        if (!alive) return;
        // rootOnly=true: pills only show top-level categories. The
        // slug-dedup step means "Áo" + "Ao thun" → 1 pill at runtime
        // even if the backend returns both.
        setCategories(flattenCategories(tree, { rootOnly: true }));
      })
      .catch(() => alive && setCategories([]));
    return () => { alive = false; };
  }, []);

  /* popover open/close + outside-click close -------------------------- */
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);
  useEffect(() => {
    if (!popoverOpen) return undefined;
    const handler = (e) => {
      if (popoverRef.current?.contains(e.target)) return;
      if (buttonRef.current?.contains(e.target)) return;
      setPopoverOpen(false);
    };
    const esc = (e) => { if (e.key === 'Escape') setPopoverOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [popoverOpen]);

  /* popover draft ----------------------------------------------------- */
  // Draft mirrors `filters` while the popover is open. "Áp dụng"
  // commits via onFiltersChange, "Xoá lọc" wipes both draft + parent.
  const bounds = useMemo(() => priceBoundsFromFacets(facets), [facets]);

  const initialDraft = useMemo(() => {
    const sizes = asArray(filters.size);
    return {
      priceMin: filters.minPrice === '' || filters.minPrice == null ? bounds.min : Number(filters.minPrice),
      priceMax: filters.maxPrice === '' || filters.maxPrice == null ? bounds.max : Number(filters.maxPrice),
      sizes,
      minDiscountPercent: filters.minDiscountPercent == null ? null : Number(filters.minDiscountPercent),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popoverOpen]);

  const [draft, setDraft] = useState(initialDraft);
  useEffect(() => { setDraft(initialDraft); }, [initialDraft]);

  /* count "filter conditions" for the button badge -------------------- */
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.minPrice && Number(filters.minPrice) > bounds.min) n += 1;
    if (filters.maxPrice && Number(filters.maxPrice) < bounds.max) n += 1;
    if (filters.size) n += 1;
    if (filters.minDiscountPercent) n += 1;
    return n;
  }, [filters, bounds]);

  /* commit handlers --------------------------------------------------- */
  const setCategory = (id) => {
    onFiltersChange?.({ ...filters, categoryId: id || null });
  };
  const removeChip = (key) => {
    const next = { ...filters };
    if (key === 'priceMin') next.minPrice = '';
    if (key === 'priceMax') next.maxPrice = '';
    if (key === 'size')     next.size = '';
    if (key === 'discount') next.minDiscountPercent = null;
    onFiltersChange?.(next);
  };
  const applyDraft = () => {
    const next = { ...filters };
    next.minPrice = draft.priceMin > bounds.min ? String(draft.priceMin) : '';
    next.maxPrice = draft.priceMax < bounds.max ? String(draft.priceMax) : '';
    next.size = draft.sizes.length > 0 ? draft.sizes.join(',') : '';
    next.minDiscountPercent = draft.minDiscountPercent;
    onFiltersChange?.(next);
    setPopoverOpen(false);
  };
  const clearPopover = () => {
    setDraft({
      priceMin: bounds.min,
      priceMax: bounds.max,
      sizes: [],
      minDiscountPercent: null,
    });
    onFiltersChange?.({
      ...filters,
      minPrice: '',
      maxPrice: '',
      size: '',
      minDiscountPercent: null,
    });
    setPopoverOpen(false);
  };

  const toggleDraftSize = (s) => {
    setDraft((d) => {
      const has = d.sizes.includes(s);
      return { ...d, sizes: has ? d.sizes.filter((x) => x !== s) : [...d.sizes, s] };
    });
  };

  /* derived active-chips for display in the toolbar ------------------- */
  const chips = useMemo(() => {
    const out = [];
    if (filters.minPrice && Number(filters.minPrice) > bounds.min) {
      out.push({ key: 'priceMin', label: `Từ ${formatVND(filters.minPrice)}đ` });
    }
    if (filters.maxPrice && Number(filters.maxPrice) < bounds.max) {
      out.push({ key: 'priceMax', label: `Đến ${formatVND(filters.maxPrice)}đ` });
    }
    if (filters.size) {
      out.push({ key: 'size', label: `Size: ${filters.size}` });
    }
    if (filters.minDiscountPercent) {
      out.push({ key: 'discount', label: `≥ ${filters.minDiscountPercent}% OFF` });
    }
    return out;
  }, [filters, bounds]);

  return (
    <div className="filterbar">
      {/* ===== Row 1: category pills ===== */}
      <div className="filterbar-cat-row" role="tablist" aria-label="Danh mục sản phẩm">
        <button
          type="button"
          role="tab"
          aria-selected={!filters.categoryId}
          className={`filterbar-cat-pill${!filters.categoryId ? ' active' : ''}`}
          onClick={() => setCategory(null)}
        >
          Tất cả
        </button>
        {categories.map((c) => (
          <button
            key={`${c.id}-${c.slug}`}
            type="button"
            role="tab"
            aria-selected={filters.categoryId === c.id}
            className={`filterbar-cat-pill${filters.categoryId === c.id ? ' active' : ''}`}
            onClick={() => setCategory(c.id)}
            title={c.name}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* ===== Row 2: toolbar ===== */}
      <div className="filterbar-toolbar">
        <div className="filterbar-toolbar-left">
          <button
            ref={buttonRef}
            type="button"
            className={`filterbar-trigger${popoverOpen ? ' open' : ''}`}
            aria-haspopup="dialog"
            aria-expanded={popoverOpen}
            onClick={() => setPopoverOpen((v) => !v)}
          >
            <span className="filterbar-trigger-icon" aria-hidden="true">≡</span>
            <span>Bộ lọc</span>
            {activeFilterCount > 0 && (
              <span className="filterbar-badge" aria-label={`${activeFilterCount} điều kiện`}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {chips.length > 0 && (
            <div className="filterbar-chips" role="list">
              {chips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  role="listitem"
                  className="filterbar-chip"
                  onClick={() => removeChip(c.key)}
                  aria-label={`Gỡ ${c.label}`}
                >
                  {c.label}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="filterbar-toolbar-right">
          <label className="filterbar-sort" htmlFor="filterbar-sort-select">
            <span>Sắp xếp:</span>
            <select
              id="filterbar-sort-select"
              value={sortBy}
              onChange={(e) => onSortChange?.(e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* ===== Popover ===== */}
      {popoverOpen && (
        <div
          ref={popoverRef}
          className="filterbar-popover"
          role="dialog"
          aria-label="Bộ lọc sản phẩm"
        >
          <section className="filterbar-popover-section">
            <h4>Khoảng giá</h4>
            <PriceSlider
              min={bounds.min}
              max={bounds.max}
              valueMin={draft.priceMin}
              valueMax={draft.priceMax}
              onChange={({ min: a, max: b }) =>
                setDraft((d) => ({ ...d, priceMin: a, priceMax: b }))
              }
            />
            <div className="filterbar-popover-meta">
              Hiện đang hiển thị sản phẩm từ <strong>{formatVND(bounds.min)}đ</strong> đến <strong>{formatVND(bounds.max)}đ</strong>.
            </div>
          </section>

          <section className="filterbar-popover-section">
            <h4>Size</h4>
            <div className="filterbar-size-row">
              {SIZE_VALUES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`filterbar-size-pill${draft.sizes.includes(s) ? ' active' : ''}`}
                  aria-pressed={draft.sizes.includes(s)}
                  onClick={() => toggleDraftSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section className="filterbar-popover-section">
            <h4>Khyến mãi</h4>
            <div className="filterbar-smart-row">
              <button
                type="button"
                className={`filterbar-smart-pill${draft.minDiscountPercent === 30 ? ' active' : ''}`}
                aria-pressed={draft.minDiscountPercent === 30}
                onClick={() => setDraft((d) => ({
                  ...d,
                  minDiscountPercent: d.minDiscountPercent === 30 ? null : 30,
                }))}
                title="Chỉ hiện sản phẩm giảm từ 30% trở lên"
              >
                Giảm từ 30%
              </button>
            </div>
          </section>

          <footer className="filterbar-popover-footer">
            <button
              type="button"
              className="filterbar-btn-clear"
              onClick={clearPopover}
            >
              Xoá lọc
            </button>
            <button
              type="button"
              className="filterbar-btn-apply"
              onClick={applyDraft}
            >
              Áp dụng
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}

/* re-export slugify so ProductListPage (or other consumers) can use
 * the same normalization for accessibility labels if they need to. */
export { slugify };
