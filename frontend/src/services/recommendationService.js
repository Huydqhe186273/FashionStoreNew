import api from './api';

export const getPersonalizedRecommendations = async (userId, limit = 8) => {
  try {
    const params = { limit };
    if (userId) params.userId = userId;
    const sid = localStorage.getItem('fs_session_id');
    if (sid) params.sessionId = sid;

    const response = await api.get('/recommendations/personalized', { params });
    return response.data;
  } catch (err) {
    console.warn('Failed to load personalized recommendations, falling back to cold start:', err);
    return getColdStartRecommendations(limit);
  }
};

export const getColdStartRecommendations = async (limit = 8) => {
  try {
    const response = await api.get('/recommendations/cold-start', { params: { limit } });
    return response.data;
  } catch (err) {
    console.error('Failed to load cold start recommendations:', err);
    return [];
  }
};

export const getSimilarProducts = async (productId, limit = 6) => {
  try {
    const response = await api.get(`/customer/products/${productId}/similar`, { params: { limit } });
    return response.data;
  } catch (err) {
    console.warn('Failed to load similar products:', err);
    return [];
  }
};

export const getUserPreferences = async (userId) => {
  if (!userId) return null;
  try {
    const response = await api.get('/recommendations/preferences', { params: { userId } });
    return response.data;
  } catch (err) {
    console.error('Failed to fetch user preferences:', err);
    return null;
  }
};

export const calculateSimilarities = async () => {
  const response = await api.post('/recommendations/similarity/calculate');
  return response.data;
};

export default {
  getPersonalizedRecommendations,
  getColdStartRecommendations,
  getSimilarProducts,
  getUserPreferences,
  calculateSimilarities
};
