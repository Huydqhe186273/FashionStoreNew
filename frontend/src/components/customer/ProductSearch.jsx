import React, { useEffect, useRef, useState } from 'react';
import './ProductSearch.css';

/* -----------------------------------------------------------------------------
 * ProductSearch
 * ------------------------------------------------------------
 * Hero-center keyword search input for the /shop page. Lives
 * between the page heading and the filter bar so users can type
 * a product name first, then narrow with category / price / size.
 *
 * Controlled component: parent owns the keyword value and gets
 * the new value via `onCommit(value)`. Local state holds the
 * typed text so we can debounce without spamming the API:
 *   • typing → debounce 300ms before commit
 *   • Enter    → commit immediately
 *   • Escape   → clear and commit ''
 *   • × button → clear and commit ''
 *
 * External reset (parent rewrites `value` to '') syncs back into
 * the local input so URL navigation / chip removal updates the
 * visible text.
 *
 * NOTE: class names use the `ps-` prefix to avoid colliding with
 * the legacy `.shop-search-bar` / `.shop-search-input` rules in
 * styles/theme.css.
 * -------------------------------------------------------------------------- */

export default function ProductSearch({ value = '', onCommit }) {
  const [local, setLocal] = useState(value || '');
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  // External reset → sync local (URL keyword, chip remove, etc.)
  useEffect(() => {
    if ((value || '') !== local) setLocal(value || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Cleanup pending debounce on unmount
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const commit = (next) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onCommit?.(next);
  };

  const handleChange = (e) => {
    const next = e.target.value;
    setLocal(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => commit(next), 300);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit(e.currentTarget.value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setLocal('');
      commit('');
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setLocal('');
    commit('');
    inputRef.current?.focus();
  };

  return (
    <form
      className="ps-search"
      role="search"
      onSubmit={(e) => { e.preventDefault(); commit(local); }}
    >
      <span className="ps-search-icon" aria-hidden="true">🔍</span>
      <input
        ref={inputRef}
        type="text"
        className="ps-search-input"
        placeholder="Tìm áo, quần, váy, phụ kiện…"
        value={local}
        onChange={handleChange}
        onKeyDown={handleKey}
        aria-label="Tìm kiếm sản phẩm"
      />
      {local ? (
        <button
          type="button"
          className="ps-search-clear"
          onClick={handleClear}
          aria-label="Xoá từ khoá"
        >
          ×
        </button>
      ) : (
        <button
          type="submit"
          className="ps-search-submit"
          aria-label="Tìm kiếm"
        >
          Tìm
        </button>
      )}
    </form>
  );
}
