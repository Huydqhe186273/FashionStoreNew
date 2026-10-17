import api from './api';

export const getUserAddresses = async (userId) => {
  const response = await api.get('/addresses', { params: { userId } });
  return response.data;
};

export const createAddress = async (userId, addressData) => {
  const response = await api.post(`/addresses?userId=${userId}`, addressData);
  return response.data;
};
