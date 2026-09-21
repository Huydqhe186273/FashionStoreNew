import React, { useEffect, useState } from 'react';
import { addFavorite, checkFavorite, removeFavorite } from '../../services/customerFavoriteService';

export default function FavoriteButton({ productId, className = '' }) {
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!productId) return;
    checkFavorite(null, productId)
      .then((val) => { if (!cancelled) { setActive(Boolean(val)); setChecked(true); } })
      .catch(() => { if (!cancelled) setChecked(true); });
    return () => { cancelled = true; };
  }, [productId]);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!productId || busy) return;
    setBusy(true);
    try {
      if (active) {
        await removeFavorite(null, productId);
        setActive(false);
      } else {
        await addFavorite(null, productId);
        setActive(true);
      }
    } catch (err) {
      alert(err?.message || 'Không thể cập nhật yêu thích. Vui lòng đăng nhập.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`favorite-btn ${active ? 'is-active' : ''} ${className}`}
      onClick={handleToggle}
      disabled={busy}
      title={active ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
      aria-label={active ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
    >
      <span className="favorite-icon">{active ? '♥' : '♡'}</span>
    </button>
  );
}
