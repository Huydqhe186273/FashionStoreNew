import React, { useEffect, useState } from 'react';
import { getAllCategories } from '../../services/customerCategoryService';

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

const GENDER_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'nam', label: 'Nam' },
  { value: 'nu', label: 'Nữ' },
  { value: 'unisex', label: 'Unisex' },
];

export default function ProductFilterSidebar({ filters, onChange }) {
  const [flat, setFlat] = useState([]);

  useEffect(() => {
    let mounted = true;
    getAllCategories()
      .then((data) => { if (mounted) setFlat(flattenCategories(data || [])); })
      .catch((err) => console.warn('Filter categories load failed:', err));
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
  });

  return (
    <aside className="filter-sidebar">
      <div className="filter-sidebar-header">
        <h3>Bộ lọc</h3>
        <button type="button" className="filter-clear" onClick={clearAll}>Xóa hết</button>
      </div>

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
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group-block">
        <h4>Giới tính</h4>
        <div className="filter-radio-row">
          {GENDER_OPTIONS.map((opt) => (
            <label key={opt.value} className="filter-radio">
              <input
                type="radio"
                name="gender"
                checked={(filters.gender || '') === opt.value}
                onChange={() => update({ gender: opt.value })}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-group-block">
        <h4>Khoảng giá</h4>
        <div className="filter-price-row">
          <input type="number" min="0" placeholder="Từ"
            value={filters.minPrice || ''} onChange={(e) => update({ minPrice: e.target.value })} className="filter-price-input" />
          <span>–</span>
          <input type="number" min="0" placeholder="Đến"
            value={filters.maxPrice || ''} onChange={(e) => update({ maxPrice: e.target.value })} className="filter-price-input" />
        </div>
      </div>

      <div className="filter-group-block">
        <h4>Size</h4>
        <div className="filter-size-row">
          {['S', 'M', 'L', 'XL', 'XXL'].map((s) => (
            <button key={s} type="button"
              className={`filter-size-pill ${filters.size === s ? 'active' : ''}`}
              onClick={() => update({ size: filters.size === s ? '' : s })}>{s}</button>
          ))}
        </div>
      </div>

      <div className="filter-group-block">
        <h4>Màu sắc</h4>
        <div className="filter-color-row">
          {[
            { name: 'Đen', hex: '#222' }, { name: 'Trắng', hex: '#f5f5f5' },
            { name: 'Xám', hex: '#888' }, { name: 'Đỏ', hex: '#dc2626' },
            { name: 'Xanh dương', hex: '#2563eb' }, { name: 'Be', hex: '#d6c19a' },
          ].map((c) => (
            <button key={c.name} type="button"
              className={`filter-color-pill ${filters.color === c.name ? 'active' : ''}`}
              onClick={() => update({ color: filters.color === c.name ? '' : c.name })} title={c.name}>
              <span className="filter-color-dot" style={{ background: c.hex }} />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
