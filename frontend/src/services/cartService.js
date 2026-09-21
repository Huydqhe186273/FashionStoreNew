import api from './api';

export const getCart = async (userId) => {
  const response = await api.get(`/cart`, { params: { userId } });
  return response.data;
};

export const updateQuantity = async (userId, cartItemId, quantity) => {
  const response = await api.put(`/cart/update/${cartItemId}?userId=${userId}&quantity=${quantity}`);
  return response.data;
};

export const removeItem = async (userId, cartItemId) => {
  const response = await api.delete(`/cart/remove/${cartItemId}?userId=${userId}`);
  return response.data;
};

export const addToCart = async (userId, variantId, quantity) => {
  const response = await api.post(`/cart/add`, { variantId, quantity }, { params: { userId } });
  return response.data;
};

export const createPaymentLink = async (userId) => {
  try {
    const response = await api.post(`/payment/create-payment-link?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi tạo link thanh toán PayOS:", error);
    throw error;
  }
};
