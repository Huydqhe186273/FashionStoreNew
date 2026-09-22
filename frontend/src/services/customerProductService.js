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

export const searchProducts = async (params = {}) => {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
  );
  const response = await api.get('/customer/products/search', { params: cleaned });
  return response.data;
};

export const getProductsByCategory = async (categoryId, params = {}) => {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
  );
  const response = await api.get(`/customer/products/category/${categoryId}`, { params: cleaned });
  return response.data;
};

// ===== Recommendation sections =====

export const getNewProducts = async (limit = 10) => {
  const response = await api.get('/customer/products/new', { params: { limit } });
  return response.data;
};

export const getBestsellers = async (limit = 10) => {
  const response = await api.get('/customer/products/bestsellers', { params: { limit } });
  return response.data;
};

export const getDiscountedProducts = async (limit = 10) => {
  const response = await api.get('/customer/products/discounts', { params: { limit } });
  return response.data;
};
