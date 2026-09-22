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

export const clearCart = async (userId) => {
  const response = await api.delete(`/cart/clear?userId=${userId}`);
  return response.data;
};

export const addToCart = async (userId, variantId, quantity) => {
  const response = await api.post(`/cart/add`, { variantId, quantity }, { params: { userId } });
  return response.data;
};

export const createAddress = async (userId, addressData) => {
  const response = await api.post(`/addresses?userId=${userId}`, addressData);
  return response.data;
};

export const createOrder = async (userId, addressId) => {
  const response = await api.post(`/orders/create-from-cart?userId=${userId}&addressId=${addressId}`);
  return response.data;
};

export const createPaymentLink = async (orderId) => {
  try {
    const response = await api.post(`/payment/create-payment-link?orderId=${orderId}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi tạo link thanh toán PayOS:", error);
    throw error;
  }
};

export const verifyPayment = async (orderCode) => {
  const response = await api.post(`/payment/verify?orderCode=${orderCode}`);
  return response.data;
};
