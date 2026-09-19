import api from './api';

export const getStaff = async (params) => {
  const response = await api.get('/admin/staff', { params });
  return response.data;
};

export const createStaff = async (data) => {
  const response = await api.post('/admin/staff', data);
  return response.data;
};

export const updateStaff = async (staffId, data) => {
  const response = await api.put(`/admin/staff/${staffId}`, data);
  return response.data;
};

export const toggleStaffLock = async (staffId) => {
  const response = await api.put(`/admin/staff/${staffId}/lock`);
  return response.data;
};
