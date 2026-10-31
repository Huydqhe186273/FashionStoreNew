import api from './api';

export const getStaffOrders = async (params) => {
  const response = await api.get('/staff/orders', { params });
  return response.data;
};

export const getStaffOrderDetail = async (orderId) => {
  const response = await api.get(`/staff/orders/${orderId}`);
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await api.put(`/staff/orders/${orderId}/status`, { status });
  return response.data;
};

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

export const createReturnRequest = async (orderId, userId, reason) => {
  const response = await api.post(`/orders/${orderId}/return-request`, { reason }, { params: { userId } });
  return response.data;
};
