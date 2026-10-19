import api from './api';

export const getReportsSummary = async (params) => {
  const response = await api.get('/admin/reports/summary', { params });
  return response.data;
};

export const getRevenueReport = async (params) => {
  const response = await api.get('/admin/reports/revenue', { params });
  return response.data;
};

export const getOrderReport = async (params) => {
  const response = await api.get('/admin/reports/orders', { params });
  return response.data;
};

export const getBestSellerReport = async (params) => {
  const response = await api.get('/admin/reports/best-sellers', { params });
  return response.data;
};
