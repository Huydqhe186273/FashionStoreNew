import axios from 'axios';

/* -----------------------------------------------------------------------------
 * Thuan-owned filter helpers.
 *
 * The "customerProductService.js" module is owned by Cuộc; this module
 * adds helpers specific to the SMART filter sidebar so we don't have to
 * touch Cuộc's file. Both helpers hit existing backend endpoints
 * (GET /api/customer/filters and GET /api/customer/products) — no new
 * API surface required on the frontend side.
 * -------------------------------------------------------------------------- */

const api = axios.create({
  baseURL: '/api/customer',
  headers: { 'Content-Type': 'application/json' },
});

/** Fetch the aggregated facets used by the smart filter sidebar. */
export const getFilterFacets = async () => {
  const response = await api.get('/filters');
  return response.data;
};

/**
 * Query products with every smart-filter param supported by the
 * backend. Pass `filters` as a plain object — every defined field
 * is forwarded to the backend; null/undefined/empty fields are
 * omitted so the server-side filter is bypassed for that field.
 */
export const queryProducts = async (params = {}) => {
  const cleaned = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    cleaned[k] = v;
  }
  const response = await api.get('/products', { params: cleaned });
  return response.data;
};
