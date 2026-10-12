import api from './api';

export const getNotifications = async (userId) => {
  const response = await api.get('/notifications', { params: { userId } });
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsRead = async (userId) => {
  const response = await api.put(`/notifications/read-all`, null, { params: { userId } });
  return response.data;
};
