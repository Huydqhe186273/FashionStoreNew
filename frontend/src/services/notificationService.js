import api from './api';

export const getNotifications = async (userId) => {
  const response = await api.get('/notifications', { params: { userId } });
  const rawList = Array.isArray(response.data) ? response.data : [];
  return rawList.map((n) => ({
    notificationId: n.notificationId ?? n.NotificationId,
    type: n.type ?? n.Type,
    content: n.content ?? n.Content,
    isRead: Boolean(n.isRead ?? n.IsRead),
    createdAt: n.createdAt ?? n.CreatedAt,
  }));
};

export const markNotificationRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsRead = async (userId) => {
  const response = await api.put(`/notifications/read-all`, null, { params: { userId } });
  return response.data;
};
