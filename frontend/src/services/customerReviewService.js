import api from './api';

export const getReviewsByProduct = async (productId) => {
  const response = await api.get(`/customer/reviews/product/${productId}`);
  return response.data || { reviews: [], count: 0, average: 0 };
};

export const getReviewableItems = async () => {
  const response = await api.get('/customer/reviews/eligible');
  return response.data || [];
};

export const createReview = async ({ orderItemId, rating, comment }) => {
  const response = await api.post('/customer/reviews', {
    orderItemId,
    rating,
    comment,
  });
  return response.data;
};

export const updateReview = async (id, { userId, rating, comment }) => {
  const response = await api.put(`/customer/reviews/${id}`, {
    rating,
    comment,
  });
  return response.data;
};

export const deleteReview = async (id) => {
  const response = await api.delete(`/customer/reviews/${id}`);
  return response.data;
};
