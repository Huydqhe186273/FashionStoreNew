import api from './api';

export const getVariants = async (params) => {
  const response = await api.get('/admin/variants', { params });
  return response.data;
};

export const getVariantById = async (id) => {
  const response = await api.get(`/admin/variants/${id}`);
  return response.data;
};

export const createVariant = async (data) => {
  const response = await api.post('/admin/variants', data);
  return response.data;
};

export const generateMatrixVariants = async (matrixData) => {
  const response = await api.post('/admin/variants/matrix', matrixData);
  return response.data;
};

export const createBatchVariants = async (variantsList) => {
  const response = await api.post('/admin/variants/batch', variantsList);
  return response.data;
};

export const updateVariant = async (id, data) => {
  const response = await api.put(`/admin/variants/${id}`, data);
  return response.data;
};

export const deleteVariant = async (id) => {
  const response = await api.delete(`/admin/variants/${id}`);
  return response.data;
};
