import React, { useContext, useEffect, useState } from 'react';
import { addFavorite, checkFavorite, removeFavorite } from '../../services/customerFavoriteService';
import { trackFavorite } from '../../services/trackingService';
import { useToast } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';

export default function FavoriteButton({ productId, className = '' }) {
  const { toast } = useToast();
  const { user } = useContext(AuthContext);
  const userId = user?.id;
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!productId) return;
    if (!userId) {
      setActive(false);
      setChecked(true);
      return () => { cancelled = true; };
    }
    setChecked(false);
    checkFavorite(userId, productId)
      .then((val) => { if (!cancelled) { setActive(Boolean(val)); setChecked(true); } })
      .catch(() => { if (!cancelled) setChecked(true); });
    return () => { cancelled = true; };
  }, [productId, userId]);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!productId || busy) return;
    if (!userId) {
      toast.warning('Vui lòng đăng nhập để sử dụng tính năng yêu thích.');
      return;
    }
    setBusy(true);
    try {
      if (active) {
        await removeFavorite(userId, productId);
        setActive(false);
        toast.info('Đã xóa khỏi danh sách yêu thích.');
      } else {
        await addFavorite(userId, productId);
        setActive(true);
        trackFavorite(productId);
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
      aria-pressed={active}
      aria-busy={busy || (!checked && Boolean(userId))}
    >
      <span className="favorite-icon" aria-hidden="true">{active ? '♥' : '♡'}</span>
    </button>
  );
}
