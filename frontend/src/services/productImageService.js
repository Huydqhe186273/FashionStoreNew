import api from './api';

export const getProductImages = async (productId) => {
  const response = await api.get(`/admin/products/${productId}/images`);
  return response.data;
};

export const uploadProductImage = async (productId, file, isPrimary = false) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('isPrimary', isPrimary);

  const response = await api.post(`/admin/products/${productId}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const addProductImageUrl = async (productId, imageUrl, isPrimary = false) => {
  const response = await api.post(`/admin/products/${productId}/images/url`, {
    imageUrl,
    isPrimary,
  });
  return response.data;
};

export const uploadGenericImage = async (file, folder = 'uploads') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await api.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const setPrimaryImage = async (productId, imageId) => {
  const response = await api.put(`/admin/products/${productId}/images/${imageId}/primary`);
  return response.data;
};

export const deleteProductImage = async (productId, imageId) => {
  const response = await api.delete(`/admin/products/${productId}/images/${imageId}`);
  return response.data;
};
