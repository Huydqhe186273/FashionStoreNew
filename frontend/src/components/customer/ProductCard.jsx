import React from 'react';
import { Link } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';

const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="100%" height="100%" fill="%23222a3a"/><text x="50%" y="50%" fill="%23667085" font-family="sans-serif" font-size="20" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>';

export default function ProductCard({ product }) {
  const price = product.finalPrice ?? product.discountPrice ?? product.basePrice ?? 0;
  const hasDiscount = product.discountPrice && product.basePrice
    && Number(product.discountPrice) < Number(product.basePrice);

  return (
    <Link to={`/shop/product/${product.productId}`} className="product-card">
      <div className="product-card-image">
        <img
          src={product.primaryImage || (product.images && product.images[0]) || PLACEHOLDER}
          alt={product.name}
          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
        />
        {product.discountPercent ? (
          <span className="product-card-discount">-{product.discountPercent}%</span>
        ) : null}
        <FavoriteButton productId={product.productId} className="product-card-favorite" />
      </div>
      <div className="product-card-body">
        <div className="product-card-category">{product.categoryName || 'Sản phẩm'}</div>
        <div className="product-card-name">{product.name}</div>
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
