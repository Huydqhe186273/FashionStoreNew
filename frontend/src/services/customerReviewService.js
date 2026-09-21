import api from './api';

const resolveUserId = () => {
  try {
    const raw = localStorage.getItem('userId');
    return raw ? Number(raw) : null;
  } catch (_) {
    return null;
  }
};

export const getReviewsByProduct = async (productId) => {
  const response = await api.get(`/customer/reviews/product/${productId}`);
  return response.data || { reviews: [], count: 0, average: 0 };
};

export const createReview = async ({ userId, productId, orderItemId, rating, comment }) => {
  const uid = userId ?? resolveUserId();
  if (!uid) throw new Error('Bạn cần đăng nhập để viết đánh giá.');
  const response = await api.post('/customer/reviews', {
    userId: uid,
    productId,
    orderItemId,
    rating,
    comment,
  });
  return response.data;
};

export const updateReview = async (id, { userId, rating, comment }) => {
  const uid = userId ?? resolveUserId();
  if (!uid) throw new Error('Bạn cần đăng nhập để sửa đánh giá.');
  const response = await api.put(`/customer/reviews/${id}`, {
    userId: uid,
    rating,
    comment,
  });
  return response.data;
};

export const deleteReview = async (id, userId) => {
  const uid = userId ?? resolveUserId();
  if (!uid) throw new Error('Bạn cần đăng nhập để xóa đánh giá.');
  const response = await api.delete(`/customer/reviews/${id}`, { params: { userId: uid } });
  return response.data;
};
