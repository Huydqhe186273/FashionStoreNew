import React, { useEffect, useMemo, useState, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getProductById, getProducts } from '../../services/customerProductService';
import { addToCart } from '../../services/cartService';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ProductCard from '../../components/customer/ProductCard';
import FavoriteButton from '../../components/customer/FavoriteButton';
import ReviewList from '../../components/customer/ReviewList';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getSimilarProducts } from '../../services/recommendationService';
import { trackView, trackAddToCart } from '../../services/trackingService';
import { resolveProductImage } from '../../utils/productImage';

const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="100%" height="100%" fill="%23222a3a"/><text x="50%" y="50%" fill="%23667085" font-family="sans-serif" font-size="28" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>';

const formatVND = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const userId = user?.id; // Lấy userId thật từ AuthContext

  useDocumentTitle(product?.name || 'Chi tiết sản phẩm');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setProduct(null);
    
    // Ghi nhận hành vi xem sản phẩm (Tracking)
    trackView(id);

    // Tải thông tin chi tiết sản phẩm
    getProductById(id)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        setIsLive(true);
        setActiveImage(0);

        if (data?.categoryId) {
          getProducts({ categoryId: data.categoryId, size: 5 })
            .then((res) => {
              if (!cancelled && res?.content) {
                setRelatedProducts(res.content.filter((p) => p.productId !== data.productId).slice(0, 4));
              }
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('getProductById failed:', err);
        setProduct(null);
        setIsLive(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Tải danh sách gợi ý sản phẩm tương tự bằng AI Similarity
    getSimilarProducts(id, 4)
      .then((data) => {
        if (!cancelled && data && data.length > 0) {
          setSimilarProducts(data);
        }
      })
      .catch((err) => console.warn('Lỗi tải sản phẩm tương tự:', err));

    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!product) return;
    setSelectedColor((prev) => prev || product.availableColors?.[0] || null);
  }, [product]);

  const images = useMemo(() => {
    if (!product) return [];
    const list = product.images && product.images.length > 0 ? product.images : [product.primaryImage].filter(Boolean);
    return list.length > 0 ? list : [resolveProductImage(product)];
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

  const handleAddToCart = async (isBuyNow = false) => {
    if (!userId) {
      toast.warning('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
      navigate('/login');
      return;
    }
    if (!selectedSize || !selectedColor) {
      toast.warning('Vui lòng chọn size và màu sắc.');
      return;
    }
    const variant = product.variants?.find((v) => v.size === selectedSize && v.color === selectedColor);
    if (!variant) {
      toast.error('Sản phẩm này không có sẵn biến thể bạn chọn.');
      return;
    }
    if (!isLive) {
      toast.info('Sản phẩm đang hiển thị ở chế độ Demo (không kết nối được backend). Không thể thêm vào giỏ hàng thật!');
      return;
    }
    
    try {
      setIsAdding(true);
      await addToCart(userId, variant.variantId, quantity);
      
      // Ghi nhận hành vi thêm vào giỏ hàng
      trackAddToCart(product.productId);

      if (isBuyNow) {
        navigate('/shop/cart');
      } else {
        toast.success('Đã thêm sản phẩm vào giỏ hàng thành công!');
      }
    } catch (error) {
      console.error('Lỗi thêm vào giỏ hàng:', error);
      toast.error('Thêm vào giỏ hàng thất bại. Vui lòng thử lại.');
    } finally {
      setIsAdding(false);
    }
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
            <img src={images[activeImage] || PLACEHOLDER} alt={product.name} decoding="async" onError={(e) => { e.currentTarget.src = PLACEHOLDER; }} />
            {product.discountPercent ? <span className="product-card-discount">-{product.discountPercent}%</span> : null}
          </div>
          {images.length > 1 && (
            <div className="product-detail-thumbs">
              {images.map((img, idx) => (
                <button type="button" key={idx} className={`product-detail-thumb ${idx === activeImage ? 'active' : ''}`} onClick={() => setActiveImage(idx)}>
                  <img src={img} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.src = PLACEHOLDER; }} />
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
            <button type="button" className="btn-add-cart" onClick={() => handleAddToCart(false)} disabled={currentStock <= 0 || isAdding}>
              {isAdding ? 'Đang thêm...' : '🛒 Thêm vào giỏ'}
            </button>
            <button type="button" className="btn-buy-now" onClick={() => handleAddToCart(true)} disabled={currentStock <= 0 || isAdding}>
              ⚡ Mua ngay
            </button>
          </div>

          <div className="product-detail-description">
            <h4>Mô tả sản phẩm</h4>
            <p>{product.description || 'Đang cập nhật...'}</p>
          </div>
        </div>
      </div>

      <ReviewList productId={product.productId} />

      {((similarProducts.length > 0 ? similarProducts : relatedProducts).length > 0) && (
        <section className="product-detail-related">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✨</span> {similarProducts.length > 0 ? 'Sản phẩm tương tự' : 'Sản phẩm liên quan'}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                {similarProducts.length > 0
                  ? 'Mô hình AI phân tích dựa trên chất liệu, danh mục và phong cách'
                  : 'Các sản phẩm cùng danh mục được gợi ý cho bạn'}
              </p>
            </div>
            {similarProducts.length > 0 && (
              <span style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: '#eef2ff',
                color: '#4f46e5',
                fontWeight: '600'
              }}>
                AI Content-based Similarity
              </span>
            )}
          </div>
          <div className="shop-grid">
            {(similarProducts.length > 0 ? similarProducts : relatedProducts).map((p) => (
              <ProductCard key={p.productId} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
