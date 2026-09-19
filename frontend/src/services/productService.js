import api from './api';

export const getProducts = async (params) => {
  const response = await api.get('/admin/products', { params });
  return response.data;
};

export const createProduct = async (data) => {
  const response = await api.post('/admin/products', data);
  return response.data;
};

export const updateProduct = async (productId, data) => {
  const response = await api.put(`/admin/products/${productId}`, data);
  return response.data;
};

export const toggleProductStatus = async (productId) => {
  const response = await api.put(`/admin/products/${productId}/status`);
  return response.data;
};
