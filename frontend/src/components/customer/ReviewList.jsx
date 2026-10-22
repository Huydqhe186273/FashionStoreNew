import React, { useEffect, useState } from 'react';
import { getReviewsByProduct } from '../../services/customerReviewService';
import StarRating from './StarRating';
import './ReviewList.css';

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

  const ratingBreakdown = reviews.reduce((breakdown, review) => {
    const rating = Number(review.rating);
    if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
      breakdown[rating] = (breakdown[rating] || 0) + 1;
    }
    return breakdown;
  }, {});

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
        <div className="review-summary-overview">
          <span className="review-summary-caption">Điểm trung bình</span>
          <span className="review-summary-number">{Number(average).toFixed(1)}</span>
          <StarRating value={Math.round(Number(average))} readOnly />
          <span className="review-summary-count">{count} lượt đánh giá</span>
        </div>
        <div className="review-breakdown" aria-label="Phân bố số lượt đánh giá theo sao">
          {[5, 4, 3, 2, 1].map((rating) => {
            const ratingCount = ratingBreakdown[rating] || 0;
            const percentage = count > 0 ? (ratingCount / count) * 100 : 0;
            return (
              <div className="review-breakdown-row" key={rating}>
                <span className="review-breakdown-label">{rating} sao</span>
                <div
                  className="review-breakdown-track"
                  role="progressbar"
                  aria-label={`${rating} sao`}
                  aria-valuemin={0}
                  aria-valuemax={count}
                  aria-valuenow={ratingCount}
                >
                  <span style={{ width: `${percentage}%` }} />
                </div>
                <span className="review-breakdown-count">{ratingCount}</span>
              </div>
            );
          })}
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
