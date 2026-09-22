import React, { useState } from 'react';
import StarRating from './StarRating';
import { createReview } from '../../services/customerReviewService';

export default function ReviewForm({ productId, orderItemId, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!rating || rating < 1) {
      setError('Vui lòng chọn số sao.');
      return;
    }
    if (!orderItemId) {
      setError('Bạn chỉ có thể đánh giá sau khi mua sản phẩm này.');
      return;
    }
    setBusy(true);
    try {
      await createReview({ productId, orderItemId, rating, comment: comment.trim() });
      setComment('');
      setRating(5);
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError(err?.message || 'Không thể gửi đánh giá.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h4>Viết đánh giá của bạn</h4>
      <div className="review-form-row">
        <label>Chất lượng:</label>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm…"
        rows={3}
        className="review-form-textarea"
      />
      {error && <p className="review-form-error">{error}</p>}
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? 'Đang gửi…' : 'Gửi đánh giá'}
      </button>
    </form>
  );
}
