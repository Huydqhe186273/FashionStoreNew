import React, { useEffect, useMemo, useState } from 'react';
import { getAllCategories } from '../../services/customerCategoryService';
import { getFilterFacets } from '../../services/filterService';

/* -----------------------------------------------------------------
   PRODUCT FILTER SIDEBAR — v4 (Smart Minimal)

   Goals:
   • No collapsible sections — every filter is one short row.
   • Show ONLY facets with count > 0; zero-count options hidden automatically.
   • Top-N + a "Thêm" popover for long facet lists, so the sidebar
     never grows taller than the product grid.
   • Price uses a single dual-handle range slider (visually thinner).
   • Active filters surfaced as removable chips at the top.
   • Gender merged into category (filter by parent root label,
     e.g. "Nam / Nữ") — no separate gender row.
   ----------------------------------------------------------------- */

const TOP_N = 8;
const MIN = 0;
/**
 * Price-slider upper bound. Default used as a safety cap if facets
 * haven't loaded yet. Sidebar passes the actual range derived from
 * `facets.minPrice` / `facets.maxPrice` (computed from real product
 * prices in backend `CustomerProductService.getFilterFacets`).
 */
const MAX_DEFAULT = 3_000_000;

function clampPrice(n, maxBound) {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  return Math.max(0, Math.min(maxBound ?? MAX_DEFAULT, v));
}

function formatVND(n) {
  return Number(n || 0).toLocaleString('vi-VN');
}

function pickTop(items = [], getValue) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const k = getValue(it);
    if (k == null || seen.has(k)) continue;
    seen.add(k);
    out.push(it);
    if (out.length >= TOP_N) break;
  }
  return out;
}

/* Lightweight dual-handle slider — no external UI lib. */
function PriceRange({ min, max, maxBound, onChange }) {
  const ceiling = Number.isFinite(maxBound) ? maxBound : MAX_DEFAULT;
  const lo = Math.max(MIN, min ?? MIN);
  const hi = Math.min(ceiling, max ?? ceiling);
  const pctLo = (lo / ceiling) * 100;
  const pctHi = (hi / ceiling) * 100;

  const setLo = (v) => onChange({ min: Math.min(Number(v), hi - 1000), max: hi });
  const setHi = (v) => onChange({ min: lo, max: Math.max(Number(v), lo + 1000) });

  return (
    <div className="filter-range">
      <div className="filter-range-track">
        <div className="filter-range-fill" style={{ left: `${pctLo}%`, width: `${pctHi - pctLo}%` }} />
        <input
          type="range"
          min={MIN}
          max={ceiling}
          step={10000}
          value={lo}
          onChange={(e) => setLo(e.target.value)}
          aria-label="Giá tối thiểu"
        />
        <input
          type="range"
          min={MIN}
          max={ceiling}
          step={10000}
          value={hi}
          onChange={(e) => setHi(e.target.value)}
          aria-label="Giá tối đa"
        />
      </div>
      <div className="filter-range-readout">
        <span>{formatVND(lo)}đ</span>
        <span>–</span>
        <span>{formatVND(hi)}đ</span>
      </div>
    </div>
  );
}

function Row({ label, children, active, onClear, collapsible, expanded, onToggle, summaryChip }) {
  const cls = [
    'filter-row',
    collapsible && 'filter-row--collapsible',
    collapsible && expanded && 'filter-row--expanded',
    active && 'active',
  ].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <div
        className="filter-row-label"
        onClick={collapsible ? onToggle : undefined}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? !!expanded : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={collapsible ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle && onToggle(); } } : undefined}
      >
        <span>{label}</span>
        {collapsible && <span className="filter-row-caret">▸</span>}
        {active && onClear && !summaryChip && (
          <button type="button" className="filter-row-clear" onClick={(e) => { e.stopPropagation(); onClear(); }} aria-label="Xóa">
            ×
          </button>
        )}
        {active && onClear && summaryChip && (
          <button
            type="button"
            className="filter-row-summary"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            title="Bỏ filter này"
          >
            {summaryChip} ×
          </button>
        )}
      </div>
      <div className="filter-row-body">{children}</div>
    </div>
  );
}

function Pill({ active, disabled, onClick, title, children }) {
  return (
    <button
      type="button"
      className={`filter-pill ${active ? 'active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

function Popover({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="filter-popover-wrap" onClick={onClose}>
      <div className="filter-popover" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default function ProductFilterSidebar({ filters, onChange }) {
  const [facets, setFacets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [openPopover, setOpenPopover] = useState(null); // 'category'|'size'|'color'|null

  const [expanded, setExpanded] = useState({
    category: true,
    price: true,
    size: false,
    color: false,
    quality: false,
  });
  const toggle = (key) => setExpanded((e) => ({ ...e, [key]: !e[key] }));

  /* Load facets + categories in parallel — they are independent. */
  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.allSettled([getFilterFacets(), getAllCategories()])
      .then(([fRes, cRes]) => {
        if (!alive) return;
        if (fRes.status === 'fulfilled') setFacets(fRes.value || null);
        if (cRes.status === 'fulfilled') setCategories(cRes.value || []);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const update = (patch) => onChange({ ...filters, ...patch });

  /* ----- derived: visible facets (count > 0 only) ----- */
  const visibleSizes = useMemo(
    () => (facets?.sizes || []).filter((s) => (s.count || 0) > 0),
    [facets]
  );
  const visibleColors = useMemo(
    () => (facets?.colors || []).filter((c) => (c.count || 0) > 0),
    [facets]
  );
  const rootCategories = useMemo(
    () => (categories || []).filter((c) => !c.parentId),
    [categories]
  );

const activeCategory = useMemo(
    () => (categories || []).find((c) => c.categoryId === filters.categoryId) || null,
    [categories, filters.categoryId]
  );

  /**
   * Price ceiling derived from real product data via /api/facets —
   * not a magic number. Falls back to MAX_DEFAULT while facets load.
   */
  const priceBounds = useMemo(() => {
    const lo = Number(facets?.minPrice);
    const hi = Number(facets?.maxPrice);
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo >= hi) {
      return { min: MIN, max: MAX_DEFAULT };
    }
    return {
      min: Math.max(0, Math.floor(lo)),
      max: Math.ceil(hi),
    };
  }, [facets]);

  const priceActive =
    (filters.minPrice != null && filters.minPrice !== '') ||
    (filters.maxPrice != null && filters.maxPrice !== '');

  /* ----- active filter count for the header badge ----- */
  const activeCount = (
    (filters.categoryId ? 1 : 0) +
    (priceActive ? 1 : 0) +
    (filters.size ? 1 : 0) +
    (filters.color ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.completeOnly ? 1 : 0) +
    (filters.minDiscountPercent ? 1 : 0) +
    (filters.minSoldCount ? 1 : 0)
  );
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

  return (
    <aside className="filter-sidebar filter-sidebar--minimal">
      {/* ----- header ----- */}
      <div className="filter-sidebar-header">
        <h3>
          Bộ lọc
          {activeCount > 0 && <span className="filter-active-count">{activeCount}</span>}
        </h3>
        <button
          type="button"
          className="filter-clear"
          onClick={clearAll}
          disabled={activeCount === 0}
        >
          Xóa hết
        </button>
      </div>

      {/* ----- active chip strip (always visible, max 6) ----- */}
      {activeCount > 0 && (
        <div className="filter-active-chips">
          {filters.categoryId && activeCategory && (
            <button
              type="button"
              className="filter-active-chip"
              onClick={() => update({ categoryId: null })}
            >
              {activeCategory.name} ×
            </button>
          )}
          {filters.size && (
            <button
              type="button"
              className="filter-active-chip"
              onClick={() => update({ size: '' })}
            >
              Size {filters.size} ×
            </button>
          )}
          {filters.color && (
            <button
              type="button"
              className="filter-active-chip"
              onClick={() => update({ color: '' })}
            >
              {filters.color} ×
            </button>
          )}
          {priceActive && (
            <button
              type="button"
              className="filter-active-chip"
              onClick={() => update({ minPrice: '', maxPrice: '' })}
            >
              {formatVND(filters.minPrice || priceBounds.min)}–{formatVND(filters.maxPrice || priceBounds.max)}đ ×
            </button>
          )}
          {filters.inStockOnly && (
            <button
              type="button"
              className="filter-active-chip"
              onClick={() => update({ inStockOnly: false })}
            >
              Còn hàng ×
            </button>
          )}
          {filters.completeOnly && (
            <button
              type="button"
              className="filter-active-chip"
              onClick={() => update({ completeOnly: false })}
            >
              Đủ thông tin ×
            </button>
          )}
        </div>
      )}

      {/* ----- DANH MỤC row ----- */}
      <Row
        label="Danh mục"
        active={!!filters.categoryId}
        onClear={() => update({ categoryId: null })}
        collapsible
        expanded={expanded.category}
        onToggle={() => toggle('category')}
        summaryChip={activeCategory?.name}
      >
        <div className="filter-pill-row">
          <Pill
            active={!filters.categoryId}
            onClick={() => update({ categoryId: null })}
          >
            Tất cả
          </Pill>
          {loading && <span className="filter-loading">…</span>}
          {pickTop(rootCategories, (c) => c.categoryId).map((c) => (
            <Pill
              key={c.categoryId}
              active={filters.categoryId === c.categoryId}
              onClick={() => update({ categoryId: c.categoryId })}
            >
              {c.name}
            </Pill>
          ))}
          {rootCategories.length > TOP_N && (
            <Pill onClick={() => setOpenPopover('category')}>Thêm…</Pill>
          )}
          <Popover
            open={openPopover === 'category'}
            onClose={() => setOpenPopover(null)}
          >
            <div className="filter-popover-title">Chọn danh mục</div>
            <div className="filter-popover-grid">
              {rootCategories.map((c) => (
                <Pill
                  key={c.categoryId}
                  active={filters.categoryId === c.categoryId}
                  onClick={() => {
                    update({ categoryId: c.categoryId });
                    setOpenPopover(null);
                  }}
                >
                  {c.name}
                </Pill>
              ))}
            </div>
          </Popover>
        </div>
      </Row>

      {/* ----- KHOẢNG GIÁ row ----- */}
      <Row
        label="Khoảng giá"
        active={priceActive}
        onClear={() => update({ minPrice: '', maxPrice: '' })}
        collapsible
        expanded={expanded.price}
        onToggle={() => toggle('price')}
        summaryChip={`${formatVND(filters.minPrice || priceBounds.min)}–${formatVND(filters.maxPrice || priceBounds.max)}đ`}
      >
        <PriceRange
          min={clampPrice(filters.minPrice, priceBounds.max)}
          max={clampPrice(filters.maxPrice, priceBounds.max)}
          maxBound={priceBounds.max}
          onChange={(v) =>
            update({
              minPrice: v.min === priceBounds.min ? '' : String(v.min),
              maxPrice: v.max === priceBounds.max ? '' : String(v.max),
            })
          }
        />
      </Row>

      {/* ----- SMART QUALITY row ----- */}
      <Row
        label="Chất lượng"
        collapsible
        expanded={expanded.quality}
        onToggle={() => toggle('quality')}
      >
        <div className="filter-pill-row">
          <Pill
            active={!!filters.completeOnly}
            onClick={() => update({ completeOnly: !filters.completeOnly })}
            title="Có ảnh + mô tả + size"
          >
            Đủ thông tin
          </Pill>
          <Pill
            active={!!filters.inStockOnly}
            onClick={() => update({ inStockOnly: !filters.inStockOnly })}
            title="Còn size trong kho"
          >
            Còn hàng
          </Pill>
          <Pill
            active={filters.minDiscountPercent === 30}
            onClick={() =>
              update({
                minDiscountPercent: filters.minDiscountPercent === 30 ? null : 30,
              })
            }
            title="Giảm giá từ 30% trở lên"
          >
            Giảm sốc 30%+
          </Pill>
          <Pill
            active={filters.minSoldCount === 100}
            onClick={() =>
              update({ minSoldCount: filters.minSoldCount === 100 ? null : 100 })
            }
            title="Đã bán từ 100 sản phẩm"
          >
            Bán ≥ 100
          </Pill>
        </div>
      </Row>
    </aside>
  );
}
