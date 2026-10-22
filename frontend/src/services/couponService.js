import api from './api';

export const getCoupons = async (params) => {
  const response = await api.get('/admin/coupons', { params });
  return response.data;
};

export const getCouponById = async (id) => {
  const response = await api.get(`/admin/coupons/${id}`);
  return response.data;
};

export const createCoupon = async (data) => {
  const response = await api.post('/admin/coupons', data);
  return response.data;
};

export const updateCoupon = async (id, data) => {
  const response = await api.put(`/admin/coupons/${id}`, data);
  return response.data;
};

export const toggleCouponStatus = async (id) => {
  const response = await api.put(`/admin/coupons/${id}/toggle`);
  return response.data;
};

export const disableCoupon = async (id) => {
  const response = await api.delete(`/admin/coupons/${id}`);
  return response.data;
};

export const getActiveCoupons = async () => {
  const response = await api.get('/coupons/active');
  return response.data;
};

export const applyCoupon = async (code, orderTotal) => {
  const response = await api.post('/coupons/apply', { code, orderTotal });
  return response.data;
};
