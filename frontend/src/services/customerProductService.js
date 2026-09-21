import api from './api';

export const getProducts = async (params = {}) => {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
  );
  const response = await api.get('/customer/products', { params: cleaned });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/customer/products/${id}`);
  return response.data;
};

export const getProductVariants = async (id) => {
  const response = await api.get(`/customer/products/${id}/variants`);
  return response.data;
};

export const searchProducts = async (keyword, page = 0, size = 12) => {
  const response = await api.get('/customer/products/search', {
    params: { keyword, page, size },
  });
  return response.data;
};

export const getProductsByCategory = async (categoryId, page = 0, size = 12) => {
  const response = await api.get(`/customer/products/category/${categoryId}`, {
    params: { page, size },
  });
  return response.data;
};
