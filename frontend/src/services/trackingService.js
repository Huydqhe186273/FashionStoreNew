import api from './api';

export const getSessionId = () => {
  try {
    let sid = localStorage.getItem('fs_session_id');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
      localStorage.setItem('fs_session_id', sid);
    }
    return sid;
  } catch (_) {
    return 'sess_fallback_' + Date.now();
  }
};

export const logBehavior = async ({ productId, actionType = 'view', durationSeconds = null }) => {
  if (!productId) return;
  try {
    // userId được backend lấy từ JWT (api.js tự gắn header Authorization)
    await api.post('/tracking/log', {
      sessionId: getSessionId(),
      productId: Number(productId),
      actionType,
      durationSeconds
    });
  } catch (err) {
    // Tracking is non-blocking; don't disrupt user workflow
    console.debug('Tracking non-fatal error:', err?.message);
  }
};

export const trackClick = (productId) => {
  return logBehavior({ productId, actionType: 'click' });
};

export const trackView = (productId, durationSeconds = null) => {
  return logBehavior({ productId, actionType: 'view', durationSeconds });
};

export const trackSearch = (productId) => {
  return logBehavior({ productId, actionType: 'search' });
};

export const trackAddToCart = (productId) => {
  return logBehavior({ productId, actionType: 'add_to_cart' });
};

export const trackFavorite = (productId) => {
  return logBehavior({ productId, actionType: 'favorite' });
};

export const trackPurchase = (productId) => {
  return logBehavior({ productId, actionType: 'purchase' });
};

export default {
  logBehavior,
  trackClick,
  trackView,
  trackSearch,
  trackAddToCart,
  trackFavorite,
  trackPurchase,
  getSessionId
};
