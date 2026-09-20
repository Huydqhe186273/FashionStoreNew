import api from './api';

export const getCart = async (userId) => {
  const response = await api.get(`/cart`, { params: { userId } });
  return response.data;
};

export const addToCart = async (userId, variantId, quantity) => {
  const response = await api.post(`/cart/add`, { variantId, quantity }, { params: { userId } });
  return response.data;
};
