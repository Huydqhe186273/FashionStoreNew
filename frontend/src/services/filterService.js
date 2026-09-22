import axios from 'axios';

/* -----------------------------------------------------------------------------
 * Thuan-owned filter helpers.
 *
 * The "customerProductService.js" module is owned by Cuộc; this module
 * adds helpers specific to the SMART filter bar so we don't have to
 * touch Cuộc's file. Both helpers hit existing backend endpoints
 * (GET /api/customer/filters and GET /api/customer/products) — no new
 * API surface required on the frontend side.
 *
 * Also: category normalization (`slugify` + `flattenCategories`) so
 * we never feed raw `Category.Name` strings (which still come back
 * from the legacy seed with duplicates and occasional mojibake) into
 * UI components. The component layer receives clean objects:
 *
 *   { id: number, slug: string, name: string, gender?: string, childCount: number }
 *
 * Backed by `flavors/as-of V001 migration UNIQUE on Name`, dedupe by
 * slug is a defense-in-depth — we never rely on the DB to give us
 * unique rows for the UI.
 * -------------------------------------------------------------------------- */

const api = axios.create({
  baseURL: '/api/customer',
  headers: { 'Content-Type': 'application/json' },
});

/** Fetch the aggregated facets used by the smart filter bar. */
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

/* ----- category normalization ----- */

/**
 * slugify('Áo thun') === 'ao-thun'
 * - lower-case
 * - NFD + strip combining diacritics (so "Á" → "a", "ê" → "e")
 * - strip anything that's not a-z 0-9
 * - collapse runs of "-" and trim
 *
 * Used both for display deduplication and as a stable React `key`.
 */
export function slugify(input) {
  if (input == null) return '';
  return String(input)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Coerce one backend category row into the clean shape the UI uses.
 * NEVER throws — bogus rows become placeholder records.
 */
function normalizeCategory(c) {
  if (!c || typeof c !== 'object') return null;
  const rawName = (c.name ?? c.categoryName ?? '').toString().trim();
  if (!rawName) return null;
  const id = Number(c.categoryId ?? c.id);
  if (!Number.isFinite(id)) return null;
  const childCount = Array.isArray(c.children) ? c.children.length : 0;
  return {
    id,
    slug: slugify(rawName) || `cat-${id}`,
    name: rawName,
    gender: c.gender || null,
    parentId: c.parentId ?? null,
    childCount,
  };
}

/**
 * Flatten the nested tree returned by `GET /api/customer/categories`
 * into a sorted list of root-level categories suitable for the Shop
 * filter bar. Each row is deduped by slug (in case the legacy DB
 * returns both "Áo" and "Ao thun" under the same parent); on
 * collision we keep the row with the lowest id, and its display name
 * becomes the first-seen non-mojibake version.
 */
export function flattenCategories(tree, { rootOnly = true } = {}) {
  if (!Array.isArray(tree)) return [];
  const out = [];
  const seen = new Map(); // slug → index in out

  const visit = (node) => {
    const norm = normalizeCategory(node);
    if (!norm) return;
    if (rootOnly && norm.parentId) return;

    const existingIdx = seen.get(norm.slug);
    if (existingIdx != null) {
      // merge: keep lowest id, sum childCount
      const existing = out[existingIdx];
      if (norm.id < existing.id) {
        out[existingIdx] = { ...existing, id: norm.id };
      }
      out[existingIdx].childCount += norm.childCount;
    } else {
      seen.set(norm.slug, out.length);
      out.push(norm);
    }
  };

  for (const node of tree) visit(node);
  return out.sort((a, b) => a.id - b.id);
}
