import api from './api';

export const getAllCategories = async (gender = null) => {
  const params = gender ? { gender } : {};
  const response = await api.get('/customer/categories', { params });
  return response.data;
};

export const getCategoryById = async (id) => {
  const response = await api.get(`/customer/categories/${id}`);
  return response.data;
};
