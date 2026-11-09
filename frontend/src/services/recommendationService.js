import api from './api';
import { getSessionId } from './trackingService';

/*
 * Module gợi ý sản phẩm.
 * - userId được backend lấy từ JWT (api.js tự gắn header Authorization).
 * - sessionId dùng cho khách vãng lai và để nối hành vi trước khi đăng nhập.
 */

/**
 * Gợi ý "Dành cho bạn".
 * @returns {Promise<{source: 'personalized'|'cold_start', basedOnCategories: string[], products: object[]}>}
 */
export const getPersonalizedRecommendations = async (limit = 8) => {
  try {
    const response = await api.get('/recommendations/personalized', {
      params: { limit, sessionId: getSessionId() },
    });
    return response.data;
  } catch (err) {
    console.warn('Failed to load personalized recommendations, falling back to cold start:', err);
    const products = await getColdStartRecommendations(limit);
    return { source: 'cold_start', basedOnCategories: [], products };
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

/** Hồ sơ sở thích hiện tại của người đang xem (null nếu chưa có dữ liệu). */
export const getMyPreferences = async () => {
  try {
    const response = await api.get('/recommendations/preferences', {
      params: { sessionId: getSessionId() },
    });
    return response.status === 204 ? null : response.data;
  } catch (err) {
    console.error('Failed to fetch preferences:', err);
    return null;
  }
};

/** Chỉ ADMIN: tính lại bảng độ tương đồng sản phẩm. */
export const calculateSimilarities = async () => {
  const response = await api.post('/recommendations/similarity/calculate');
  return response.data;
};

/** Xoá lịch sử hành vi của người đang xem (user theo JWT + phiên hiện tại). */
export const resetUserAIHistory = async () => {
  const response = await api.delete('/recommendations/reset', {
    params: { sessionId: getSessionId() },
  });
  return response.data;
};

export default {
  getPersonalizedRecommendations,
  getColdStartRecommendations,
  getSimilarProducts,
  getMyPreferences,
  calculateSimilarities,
  resetUserAIHistory,
};
