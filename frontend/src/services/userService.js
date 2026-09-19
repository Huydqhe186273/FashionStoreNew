import api from './api';

export const getUsers = async (params) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const updateUser = async (userId, data) => {
  const response = await api.put(`/admin/users/${userId}`, data);
  return response.data;
};

export const toggleUserLock = async (userId) => {
  const response = await api.put(`/admin/users/${userId}/lock`);
  return response.data;
};
