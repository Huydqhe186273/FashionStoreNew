import api from './api';

export const getUserAddresses = async (userId) => {
  const response = await api.get('/addresses', { params: { userId } });
  return response.data;
};

export const getAddresses = getUserAddresses;

export const createAddress = async (userId, addressData) => {
  const response = await api.post(`/addresses?userId=${userId}`, addressData);
  return response.data;
};

export const updateAddress = async (id, userId, addressData) => {
  const response = await api.put(`/addresses/${id}?userId=${userId}`, addressData);
  return response.data;
};

export const deleteAddress = async (id, userId) => {
  const response = await api.delete(`/addresses/${id}?userId=${userId}`);
  return response.data;
};

export const setDefaultAddress = async (id, userId) => {
  const response = await api.put(`/addresses/${id}/default?userId=${userId}`);
  return response.data;
};
