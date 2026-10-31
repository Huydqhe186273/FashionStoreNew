import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ReviewForm from '../../components/customer/ReviewForm';
import StarRating from '../../components/customer/StarRating';
import { getReviewableItems } from '../../services/customerReviewService';
import './ReviewCenterPage.css';

const formatDate = (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '';

export default function ReviewCenterPage() {
  const [searchParams] = useSearchParams();
  const orderId = Number(searchParams.get('orderId')) || null;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadItems = async () => {
    setError('');
    try {
      setItems(await getReviewableItems(orderId));
    } catch (err) {
      const response = err.response?.data;
      setError(typeof response === 'string' ? response : response?.message || 'Không thể tải danh sách sản phẩm đã mua.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [orderId]);

  return (
    <main className="review-center-page">
      <header className="review-center-header">
        <Link to="/shop/orders" className="review-center-back">← Đơn mua</Link>
        <p className="review-center-eyebrow">GÓC CHIA SẺ</p>
        <h1>{orderId ? `Đánh giá đơn hàng #${orderId}` : 'Sản phẩm đã mua'}</h1>
        <p>Đánh giá chỉ mở cho đơn đã xác nhận và thanh toán.</p>
      </header>

      {loading ? (
        <p className="review-center-state">Đang tải sản phẩm…</p>
      ) : error ? (
        <div className="review-center-state review-center-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => { setLoading(true); loadItems(); }}>Thử lại</button>
        </div>
      ) : items.length === 0 ? (
        <div className="review-center-state">
          <h2>{orderId ? 'Đơn này chưa có sản phẩm đủ điều kiện đánh giá' : 'Chưa có sản phẩm để đánh giá'}</h2>
          <p>{orderId ? 'Chỉ đơn đã xác nhận và thanh toán mới có thể được đánh giá.' : 'Sau khi đơn được xác nhận và thanh toán, sản phẩm sẽ xuất hiện ở đây.'}</p>
          <Link to={orderId ? '/shop/orders' : '/shop'}>{orderId ? 'Quay lại đơn mua' : 'Khám phá sản phẩm'}</Link>
        </div>
      ) : (
        <section className="review-center-list" aria-label="Sản phẩm thuộc đơn đã xác nhận và thanh toán">
          {items.map((item) => (
            <article className="review-center-item" key={item.orderItemId}>
              <div className="review-center-product">
                <Link to={`/shop/product/${item.productId}`} className="review-center-image-link">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="review-center-image" />
                  ) : (
                    <span className="review-center-image-placeholder" aria-hidden="true">FS</span>
                  )}
                </Link>
                <div className="review-center-product-info">
                  <Link to={`/shop/product/${item.productId}`} className="review-center-product-name">{item.productName}</Link>
                  <span>{[item.color, item.size && `Size ${item.size}`].filter(Boolean).join(' · ')}</span>
                  <span>Số lượng: {item.quantity}</span>
                </div>
                <Link to={`/shop/product/${item.productId}`} className="review-center-detail-link">Xem sản phẩm</Link>
              </div>

              <div className="review-center-review">
                {item.rating ? (
                  <div className="review-center-submitted">
                    <div className="review-center-submitted-head">
                      <strong>Bạn đã đánh giá</strong>
                      <StarRating value={item.rating} readOnly />
                    </div>
                    {item.comment && <p>{item.comment}</p>}
                    <span>{formatDate(item.reviewedAt)}</span>
                  </div>
                ) : (
                  <ReviewForm orderItemId={item.orderItemId} onSubmitted={loadItems} />
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}