import React, { useEffect, useState } from 'react';
import { getReviewsByProduct } from '../../services/customerReviewService';
import StarRating from './StarRating';

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (_) {
    return iso;
  }
};

export default function ReviewList({ productId, refreshKey }) {
  const [reviews, setReviews] = useState([]);
  const [count, setCount] = useState(0);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getReviewsByProduct(productId)
      .then((data) => {
        if (cancelled) return;
        setReviews(data?.reviews || []);
        setCount(data?.count || 0);
        setAverage(data?.average || 0);
      })
      .catch((err) => console.warn('getReviewsByProduct failed:', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId, refreshKey]);

  return (
    <section className="review-section">
      <h3>Đánh giá sản phẩm</h3>
      <div className="review-summary">
        <div className="review-summary-score">
          <span className="review-summary-number">{Number(average).toFixed(1)}</span>
          <StarRating value={Math.round(Number(average))} readOnly />
          <span className="review-summary-count">{count} đánh giá</span>
        </div>
      </div>

      {loading ? (
        <p className="review-loading">Đang tải đánh giá…</p>
      ) : reviews.length === 0 ? (
        <p className="review-empty">Chưa có đánh giá nào cho sản phẩm này.</p>
      ) : (
        <ul className="review-list">
          {reviews.map((r) => (
            <li key={r.reviewId} className="review-item">
              <div className="review-item-head">
                <div>
                  <div className="review-item-name">{r.userName || `Khách #${r.userId}`}</div>
                  <div className="review-item-date">{formatDate(r.createdAt)}</div>
                </div>
                <StarRating value={r.rating} readOnly />
              </div>
              {r.comment && <p className="review-item-comment">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
