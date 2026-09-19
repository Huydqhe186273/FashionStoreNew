import api from './api';

export const getCategories = async (params) => {
  const response = await api.get('/admin/categories', { params });
  return response.data;
};

export const createCategory = async (data) => {
  const response = await api.post('/admin/categories', data);
  return response.data;
};

export const updateCategory = async (categoryId, data) => {
  const response = await api.put(`/admin/categories/${categoryId}`, data);
  return response.data;
};

export const deleteCategory = async (categoryId) => {
  const response = await api.delete(`/admin/categories/${categoryId}`);
  return response.data;
};
