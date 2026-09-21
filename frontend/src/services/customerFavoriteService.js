import api from './api';

const resolveUserId = () => {
  try {
    const raw = localStorage.getItem('userId');
    return raw ? Number(raw) : null;
  } catch (_) {
    return null;
  }
};

export const getFavorites = async (userId) => {
  const uid = userId ?? resolveUserId();
  if (!uid) return [];
  const response = await api.get('/customer/favorites', { params: { userId: uid } });
  return response.data || [];
};

export const checkFavorite = async (userId, productId) => {
  const uid = userId ?? resolveUserId();
  if (!uid) return false;
  const response = await api.get('/customer/favorites/check', { params: { userId: uid, productId } });
  return Boolean(response.data?.favorited);
};

export const addFavorite = async (userId, productId) => {
  const uid = userId ?? resolveUserId();
  if (!uid) throw new Error('Bạn cần đăng nhập để sử dụng tính năng yêu thích.');
  const response = await api.post('/customer/favorites', null, { params: { userId: uid, productId } });
  return response.data;
};

export const removeFavorite = async (userId, productId) => {
  const uid = userId ?? resolveUserId();
  if (!uid) throw new Error('Bạn cần đăng nhập để sử dụng tính năng yêu thích.');
  const response = await api.delete('/customer/favorites', { params: { userId: uid, productId } });
  return response.data;
};
