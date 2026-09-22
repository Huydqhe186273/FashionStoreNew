/**
 * productImage.js
 * --------------------------------------------------------------
 * Resolves a representative product image. Priority:
 *   1) Backend-provided primaryImage / images[0] — used as-is when
 *      it's a real URL.
 *   2) Generated SVG artwork (utils/productArtwork.js) — built from
 *      the product's name + category so each card shows art that
 *      actually matches the product. No external CDN required.
 *   3) Inline SVG placeholder — only if artwork building fails.
 *
 * Why this exists: Unsplash Source was deprecated mid-2024 and was
 * rate-limiting us. The generated artwork is name-aware so a card
 * titled "Áo Phao Unisex Puffer" gets a puffer silhouette, not a
 * random photo.
 */

import { buildProductArtwork } from './productArtwork';

const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500">' +
  '<rect width="100%" height="100%" fill="#222a3a"/>' +
  '<text x="50%" y="50%" fill="#667085" font-family="sans-serif" ' +
  'font-size="20" text-anchor="middle" dominant-baseline="middle">No Image</text>' +
  '</svg>'
);

const COLOR_HEX = {
  đen: '#111111', den: '#111111', black: '#111111',
  trắng: '#f5f5f5', trang: '#f5f5f5', white: '#f5f5f5',
  xám: '#9aa0a6', xam: '#9aa0a6', grey: '#9aa0a6', gray: '#9aa0a6',
  đỏ: '#dc2626', do: '#dc2626', red: '#dc2626',
  xanh: '#2563eb', blue: '#2563eb', navy: '#1e3a8a',
  xanhdương: '#2563eb', xanhduong: '#2563eb',
  vàng: '#facc15', vang: '#facc15', yellow: '#facc15',
  hồng: '#ec4899', hong: '#ec4899', pink: '#ec4899',
  be: '#e7d7b7', beige: '#e7d7b7',
  nâu: '#92400e', nau: '#92400e', brown: '#92400e',
  tím: '#7c3aed', tim: '#7c3aed', purple: '#7c3aed',
  xanhlá: '#16a34a', xanhla: '#16a34a', green: '#16a34a',
};

/**
 * Pick the best image URL for a product. Backend URLs win when
 * they exist; otherwise we synthesize one from the product name.
 */
export function resolveProductImage(product, options) {
  const backendImg =
    product?.primaryImage ||
    (Array.isArray(product?.images) && product.images[0]) ||
    null;
  if (backendImg && /^https?:\/\//.test(backendImg)) return backendImg;
  if (backendImg && backendImg.startsWith('/')) {
    // Local backend image path — return as-is. If the file is
    // missing the <img onError> fallback will kick in.
    return backendImg;
  }

  // No backend image (or it's a relative path we can't trust):
  // generate name-aware SVG artwork. This guarantees the picture
  // visually matches the product title.
  try {
    return buildProductArtwork(product || {});
  } catch (_e) {
    return PLACEHOLDER;
  }
}

/** Map a Vietnamese / English color label to a hex code (best-effort). */
export function colorHex(label) {
  if (!label) return '#888888';
  const k = label.toLowerCase().trim();
  return COLOR_HEX[k] || '#888888';
}

export { PLACEHOLDER };
export { buildProductArtwork } from './productArtwork';
