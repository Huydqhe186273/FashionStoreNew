import api from './api';

export const getActiveCoupons = async () => {
  const response = await api.get('/coupons/active');
  return response.data;
};

export const applyCoupon = async (code, orderTotal) => {
  const response = await api.post('/coupons/apply', { code, orderTotal });
  return response.data;
};
