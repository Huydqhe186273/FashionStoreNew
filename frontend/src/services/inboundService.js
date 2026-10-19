import api from './api';

export const getInboundOrders = async (params) => {
  const response = await api.get('/staff/inbound/orders', { params });
  return response.data;
};

export const getInboundOrderDetail = async (id) => {
  const response = await api.get(`/staff/inbound/orders/${id}`);
  return response.data;
};

export const createInboundOrder = async (data) => {
  const response = await api.post('/staff/inbound/orders', data);
  return response.data;
};

export const getInboundBatches = async (params) => {
  const response = await api.get('/staff/inbound/batches', { params });
  return response.data;
};
