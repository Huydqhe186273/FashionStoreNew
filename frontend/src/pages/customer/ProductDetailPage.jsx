import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProductById } from '../../services/customerProductService';
import ProductCard from '../../components/customer/ProductCard';
import FavoriteButton from '../../components/customer/FavoriteButton';
import ReviewList from '../../components/customer/ReviewList';
import ReviewForm from '../../components/customer/ReviewForm';

const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="100%" height="100%" fill="%23222a3a"/><text x="50%" y="50%" fill="%23667085" font-family="sans-serif" font-size="28" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>';

const mockDetail = (id) => ({
  productId: Number(id),
  name: 'Áo Polo Nam Premium Flex (Demo)',
  description: 'Chất liệu cotton 100% thoáng mát, form regular fit phù hợp nhiều dáng người. Đường may tỉ mỉ, bền màu theo thời gian. Phù hợp đi làm, đi chơi, dạo phố.',
  basePrice: 350000,
  discountPrice: 299000,
  finalPrice: 299000,
  discountPercent: 15,
  soldCount: 142,
  totalStock: 24,
  status: 'active',
  categoryId: 1,
  categoryName: 'Áo Nam',
  images: [],
  primaryImage: '',
  availableSizes: ['S', 'M', 'L', 'XL'],
  availableColors: ['Đen', 'Trắng', 'Xám'],
  variants: [
    { variantId: 1, size: 'S', color: 'Đen', stockQuantity: 5, sku: 'POLO-S-DEN' },
    { variantId: 2, size: 'M', color: 'Đen', stockQuantity: 8, sku: 'POLO-M-DEN' },
    { variantId: 3, size: 'L', color: 'Đen', stockQuantity: 3, sku: 'POLO-L-DEN' },
    { variantId: 4, size: 'M', color: 'Trắng', stockQuantity: 4, sku: 'POLO-M-WHT' },
    { variantId: 5, size: 'L', color: 'Trắng', stockQuantity: 2, sku: 'POLO-L-WHT' },
    { variantId: 6, size: 'XL', color: 'Xám', stockQuantity: 2, sku: 'POLO-XL-GRY' },
  ],
});

const mockRelated = [
  { productId: 1001, name: 'Áo Polo Nam Premium Flex', categoryName: 'Áo Nam', basePrice: 350000, discountPrice: 299000, finalPrice: 299000, soldCount: 142, images: [], primaryImage: '' },
  { productId: 1002, name: 'Quần Jean Slimfit Co Giãn', categoryName: 'Quần Nam', basePrice: 550000, discountPrice: 480000, finalPrice: 480000, soldCount: 98, images: [], primaryImage: '' },
  { productId: 1005, name: 'Áo Thun Cotton Basic', categoryName: 'Áo Nam', basePrice: 180000, discountPrice: 150000, finalPrice: 150000, soldCount: 220, images: [], primaryImage: '' },
  { productId: 1008, name: 'Áo Hoodie Unisex Streetwear', categoryName: 'Áo Khoác', basePrice: 540000, discountPrice: 450000, finalPrice: 450000, soldCount: 67, images: [], primaryImage: '' },
];

const formatVND = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProductById(id)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        setIsLive(true);
        setActiveImage(0);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('getProductById fallback:', err);
        setProduct(mockDetail(id));
        setIsLive(false);
        setActiveImage(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!product) return;
    setSelectedColor((prev) => prev || product.availableColors?.[0] || null);
  }, [product]);

  const images = useMemo(() => {
    if (!product) return [];
    const list = product.images && product.images.length > 0 ? product.images : [product.primaryImage].filter(Boolean);
    return list.length > 0 ? list : [PLACEHOLDER];
  }, [product]);

  const availableSizes = useMemo(() => {
    if (!product) return [];
    if (selectedColor && product.variants) {
      const sizes = product.variants.filter((v) => v.color === selectedColor).map((v) => v.size);
      if (sizes.length > 0) return [...new Set(sizes)];
    }
    return product.availableSizes || [];
  }, [product, selectedColor]);

  const currentStock = useMemo(() => {
    if (!product || !product.variants) return 0;
    const match = product.variants.find((v) => v.size === selectedSize && v.color === selectedColor);
    return match?.stockQuantity || 0;
  }, [product, selectedSize, selectedColor]);

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      alert('Vui lòng chọn size và màu sắc.');
      return;
    }
    alert(`Đã thêm vào giỏ:\n- Sản phẩm: ${product.name}\n- Size: ${selectedSize}\n- Màu: ${selectedColor}\n- SL: ${quantity}\n(Giỏ hàng đang được phát triển)`);
  };

  if (loading && !product) {
    return <div className="shop-loading-page">Đang tải sản phẩm…</div>;
  }

  if (!product) {
    return (
      <div className="shop-empty">
        <span>😕</span>
        <p>Không tìm thấy sản phẩm.</p>
        <Link to="/shop" className="shop-empty-reset">Về trang sản phẩm</Link>
      </div>
    );
  }

  const hasDiscount = product.discountPrice && product.basePrice && Number(product.discountPrice) < Number(product.basePrice);

  return (
    <div className="product-detail-page">
      <nav className="breadcrumb">
        <Link to="/shop">Trang chủ</Link>
        <span>›</span>
        {product.categoryId && (
          <>
            <Link to={`/shop/category/${product.categoryId}`}>{product.categoryName}</Link>
            <span>›</span>
          </>
        )}
        <span className="breadcrumb-current">{product.name}</span>
      </nav>

      <div className="product-detail-grid">
        <div className="product-detail-images">
          <div className="product-detail-main-image">
            <img src={images[activeImage] || PLACEHOLDER} alt={product.name} onError={(e) => { e.currentTarget.src = PLACEHOLDER; }} />
            {product.discountPercent ? <span className="product-card-discount">-{product.discountPercent}%</span> : null}
          </div>
          {images.length > 1 && (
            <div className="product-detail-thumbs">
              {images.map((img, idx) => (
                <button type="button" key={idx} className={`product-detail-thumb ${idx === activeImage ? 'active' : ''}`} onClick={() => setActiveImage(idx)}>
                  <img src={img} alt="" onError={(e) => { e.currentTarget.src = PLACEHOLDER; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-detail-info">
          <div className="product-detail-category">{product.categoryName}</div>
          <div className="product-detail-name-row">
            <h1 className="product-detail-name">{product.name}</h1>
            <FavoriteButton productId={product.productId} className="product-detail-favorite" />
          </div>

          <div className="product-detail-meta">
            <span>Đã bán {product.soldCount ?? 0}</span>
            <span>•</span>
            <span>Còn {product.totalStock ?? 0} sản phẩm</span>
            {!isLive && <span className="shop-offline-badge">● Demo</span>}
          </div>

          <div className="product-detail-price-box">
            <span className="product-detail-price">{formatVND(product.finalPrice ?? product.basePrice)}</span>
            {hasDiscount && (
              <>
                <span className="product-detail-base-price">{formatVND(product.basePrice)}</span>
                {product.discountPercent ? <span className="product-detail-save">Tiết kiệm {product.discountPercent}%</span> : null}
              </>
            )}
          </div>

          <div className="product-detail-section">
            <h4>Màu sắc: <span className="product-detail-current">{selectedColor || '—'}</span></h4>
            <div className="product-detail-colors">
              {(product.availableColors || []).map((c) => (
                <button type="button" key={c}
                  className={`product-detail-color-pill ${selectedColor === c ? 'active' : ''}`}
                  onClick={() => { setSelectedColor(c); setSelectedSize(null); }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="product-detail-section">
            <h4>Size: <span className="product-detail-current">{selectedSize || '—'}</span></h4>
            <div className="product-detail-sizes">
              {availableSizes.map((s) => {
                const variantStock = (product.variants || []).find((v) => v.size === s && v.color === selectedColor)?.stockQuantity || 0;
                const disabled = variantStock <= 0;
                return (
                  <button type="button" key={s}
                    className={`product-detail-size-pill ${selectedSize === s ? 'active' : ''}`}
                    onClick={() => setSelectedSize(s)}
                    disabled={disabled}
                    title={disabled ? 'Hết hàng' : `Còn ${variantStock}`}>
                    {s}
                  </button>
                );
              })}
            </div>
            {selectedSize && <p className="product-detail-stock">{currentStock > 0 ? `Còn ${currentStock} sản phẩm` : 'Hết hàng'}</p>}
          </div>

          <div className="product-detail-section">
            <h4>Số lượng</h4>
            <div className="product-detail-qty">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
              <input type="number" min="1" max={Math.max(1, currentStock || 99)} value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(currentStock || 99, Number(e.target.value) || 1)))} />
              <button type="button" onClick={() => setQuantity((q) => Math.min(currentStock || 99, q + 1))}>+</button>
            </div>
          </div>

          <div className="product-detail-actions">
            <button type="button" className="btn-add-cart" onClick={handleAddToCart} disabled={currentStock <= 0}>🛒 Thêm vào giỏ</button>
            <button type="button" className="btn-buy-now" disabled={currentStock <= 0}>⚡ Mua ngay</button>
          </div>

          <div className="product-detail-description">
            <h4>Mô tả sản phẩm</h4>
            <p>{product.description || 'Đang cập nhật...'}</p>
          </div>
        </div>
      </div>

      <ReviewList productId={product.productId} refreshKey={reviewRefreshKey} />
      <ReviewForm
        productId={product.productId}
        orderItemId={null}
        onSubmitted={() => setReviewRefreshKey((k) => k + 1)}
      />

      <section className="product-detail-related">
        <h2>Sản phẩm liên quan</h2>
        <div className="shop-grid">
          {mockRelated.map((p) => <ProductCard key={p.productId} product={p} />)}
        </div>
      </section>
    </div>
  );
}
