import React, { useEffect, useState } from 'react';
import { addFavorite, checkFavorite, removeFavorite } from '../../services/customerFavoriteService';
import { useToast } from '../../context/ToastContext';

export default function FavoriteButton({ productId, className = '' }) {
  const { toast } = useToast();
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
        toast.info('Đã xóa khỏi danh sách yêu thích.');
      } else {
        await addFavorite(null, productId);
        setActive(true);
        toast.success('Đã thêm sản phẩm vào danh sách yêu thích!');
      }
    } catch (err) {
      toast.warning(err?.message || 'Không thể cập nhật yêu thích. Vui lòng đăng nhập.');
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
