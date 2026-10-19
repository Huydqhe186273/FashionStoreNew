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
