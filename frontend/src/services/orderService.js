import api from './api';

export const getUserOrders = async (userId) => {
  const response = await api.get('/orders', { params: { userId } });
  return response.data;
};

export const getOrderDetail = async (orderId, userId) => {
  const response = await api.get(`/orders/${orderId}`, { params: { userId } });
  return response.data;
};

export const cancelOrder = async (orderId, userId) => {
  const response = await api.put(`/orders/${orderId}/cancel`, null, { params: { userId } });
  return response.data;
};
