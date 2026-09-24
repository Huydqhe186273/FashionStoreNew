import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';
import { resolveProductImage, PLACEHOLDER, colorHex } from '../../utils/productImage';

const SIZE_LIMIT = 4;   // show first 4 sizes; rest hidden behind "+N"
const COLOR_LIMIT = 5;  // show first 5 swatches

/* ----- keyword highlight -----
 * Wraps every case-insensitive occurrence of `keyword` in <mark>.
 * Returns a React fragment so the caller can drop it straight into
 * JSX without further wrapping.
 */
function highlightText(text, keyword) {
  if (!text) return text;
  if (!keyword) return text;
  const kw = String(keyword).trim();
  if (!kw) return text;
  // Escape regex special chars in keyword before building the pattern
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === kw.toLowerCase()
      ? <mark key={i} className="product-card-mark">{part}</mark>
      : <React.Fragment key={i}>{part}</React.Fragment>
  );
}

export default function ProductCard({ product }) {
  /* Read keyword from URL so search highlights survive even when
   * the parent doesn't explicitly pass a prop. Falls back to ''.
   */
  const location = useLocation();
  const urlKeyword = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('keyword') || '';
  }, [location.search]);
  const keyword = (product._keyword ?? urlKeyword) || '';

  const price = product.finalPrice ?? product.discountPrice ?? product.basePrice ?? 0;
  const hasDiscount =
    product.discountPrice && product.basePrice &&
    Number(product.discountPrice) < Number(product.basePrice);

  const imgSrc = resolveProductImage(product, { w: 400, h: 500 });

  const sizes = (product.availableSizes || []).filter(Boolean);
  const colors = (product.availableColors || []).filter(Boolean);
  const visibleSizes = sizes.slice(0, SIZE_LIMIT);
  const hiddenSizeCount = Math.max(0, sizes.length - SIZE_LIMIT);
  const visibleColors = colors.slice(0, COLOR_LIMIT);
  const hiddenColorCount = Math.max(0, colors.length - COLOR_LIMIT);

  return (
    <Link to={`/shop/product/${product.productId}`} className="product-card">
      <div className="product-card-image">
        <img
          src={imgSrc}
          alt={product.name}
          loading="lazy"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
        />
        {product.discountPercent ? (
          <span className="product-card-discount">-{product.discountPercent}%</span>
        ) : null}
        <FavoriteButton productId={product.productId} className="product-card-favorite" />
      </div>

      <div className="product-card-body">
        <div className="product-card-category">{product.categoryName || 'Sản phẩm'}</div>
        <div className="product-card-name">{highlightText(product.name, keyword)}</div>

        {visibleSizes.length > 0 && (
          <div className="product-card-sizes" aria-label="Size có sẵn">
            {visibleSizes.map((s) => (
              <span key={s} className="product-card-size">{s}</span>
            ))}
            {hiddenSizeCount > 0 && (
              <span className="product-card-size-more">+{hiddenSizeCount}</span>
            )}
          </div>
        )}

        {visibleColors.length > 0 && (
          <div className="product-card-colors" aria-label="Màu có sẵn">
            {visibleColors.map((c) => (
              <span
                key={c}
                className="product-card-color"
                title={c}
                style={{ backgroundColor: colorHex(c) }}
              />
            ))}
            {hiddenColorCount > 0 && (
              <span className="product-card-color-more">+{hiddenColorCount}</span>
            )}
          </div>
        )}

        <div className="product-card-pricing">
          <span className="product-card-price">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
          </span>
          {hasDiscount && (
            <span className="product-card-base-price">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice)}
            </span>
          )}
        </div>
        <div className="product-card-meta">
          <span>Đã bán {product.soldCount ?? 0}</span>
        </div>
      </div>
    </Link>
  );
}
