import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, updateQuantity, removeItem, clearCart, createPaymentLink, createAddress, createOrder, verifyPayment } from '../services/cartService';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Cart.css';

// Chuẩn hóa chuỗi hiển thị màu (sửa lỗi font tiếng Việt cũ như Tr?ng -> Trắng)
const formatColor = (color) => {
  if (!color) return '';
  if (color.includes('Tr?ng')) return color.replace('Tr?ng', 'Trắng');
  return color;
};

export default function Cart() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const { toast, showToast, confirm } = useToast();
  const navigate = useNavigate();
  const userId = user?.id;

  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [address, setAddress] = useState({
    recipientName: user?.fullName || user?.name || '',
    phone: user?.phone || '',
    addressLine: '',
    city: ''
  });

  const loadCart = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getCart(userId);
      setCartData(data);
    } catch (error) {
      console.error("Lỗi khi tải giỏ hàng:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Tự động load lại giỏ hàng khi userId hoặc authLoading sẵn sàng
  useEffect(() => {
    if (authLoading) return;
    if (userId) {
      loadCart();
    } else {
      setLoading(false);
    }
  }, [userId, authLoading, loadCart]);

  useEffect(() => {
    // URL xem có phải vừa đi quét mã QR PayOS về không
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const orderCode = urlParams.get('orderCode');

    if (paymentStatus === 'success' && orderCode) {
      verifyPayment(orderCode).then(res => {
        showToast('success', res.message || 'Thanh toán đơn hàng thành công!');
        window.history.replaceState({}, document.title, window.location.pathname);
        if (userId) loadCart();
      }).catch(() => {
        showToast('error', "Có lỗi khi xác minh thanh toán.");
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    } else if (paymentStatus === 'cancel') {
      showToast('error', "Bạn đã hủy thanh toán.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [userId, loadCart]);

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      setUpdatingItemId(cartItemId);
      const updatedCart = await updateQuantity(userId, cartItemId, newQuantity);
      setCartData(updatedCart);
    } catch (error) {
      console.error("Lỗi cập nhật số lượng:", error);
      showToast('error', 'Cập nhật thất bại. Có thể do hết hàng trong kho.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItemRequest = (item) => {
    setItemToDelete(item);
  };

  const confirmRemoveItem = async () => {
    if (!itemToDelete) return;
    try {
      setUpdatingItemId(itemToDelete.cartItemId);
      const updatedCart = await removeItem(userId, itemToDelete.cartItemId);
      setCartData(updatedCart);
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng.');
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
      toast.error('Xóa sản phẩm thất bại.');
    } finally {
      setUpdatingItemId(null);
      setItemToDelete(null);
    }
  };

  const cancelRemoveItem = () => {
    setItemToDelete(null);
  };

  const handleClearCart = async () => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa toàn bộ giỏ hàng',
      message: 'Bạn có chắc chắn muốn xóa tất cả sản phẩm đang có trong giỏ hàng không?',
      confirmText: 'Xóa tất cả',
      cancelText: 'Giữ lại',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      const updatedCart = await clearCart(userId);
      setCartData(updatedCart);
      toast.success('Đã xóa tất cả sản phẩm khỏi giỏ hàng.');
    } catch (error) {
      console.error("Lỗi xóa giỏ hàng:", error);
      toast.error('Xóa tất cả sản phẩm thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (cartData?.items && cartData.items.length > 0 && cartData.items[0].productId) {
      navigate(`/shop/product/${cartData.items[0].productId}`);
    } else {
      navigate('/shop');
    }
  };

  const handleCheckout = async () => {
    if (!cartData || !cartData.items || cartData.items.length === 0) {
      toast.error("Giỏ hàng của bạn đang trống!");
      return;
    }
    if (!address.recipientName.trim() || !address.phone.trim() || !address.addressLine.trim() || !address.city.trim()) {
      toast.warning("Vui lòng điền đầy đủ thông tin địa chỉ giao hàng!");
      return;
    }
    try {
      setLoading(true);
      const savedAddress = await createAddress(userId, address);
      const orderResponse = await createOrder(userId, savedAddress.addressId);
      const data = await createPaymentLink(orderResponse.orderId);
      if (data && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error("Lỗi: Không nhận được URL thanh toán từ server.");
      }
    } catch (error) {
      console.error("Lỗi thanh toán:", error);
      toast.error("Không thể khởi tạo thanh toán. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const totalItemsCount = cartData?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="cart-page-wrapper">
      {/* Thanh Header Giỏ hàng */}
      <div className="cart-header-bar">
        <div className="cart-header-left">
          <button
            type="button"
            onClick={handleBack}
            className="cart-back-btn"
            title="Quay lại xem sản phẩm / chọn size"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Quay lại</span>
          </button>
          
          <div className="cart-title-wrap">
            <h1 className="cart-main-title">Giỏ hàng của bạn</h1>
            {totalItemsCount > 0 && (
              <span className="cart-badge-count">{totalItemsCount} sản phẩm</span>
            )}
          </div>
        </div>

        {cartData && cartData.items && cartData.items.length > 0 && (
          <button
            type="button"
            onClick={handleClearCart}
            disabled={loading}
            className="cart-clear-all-btn"
            title="Xóa tất cả sản phẩm khỏi giỏ hàng"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>Xóa tất cả</span>
          </button>
        )}
      </div>

      {(loading || authLoading) ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>Đang tải thông tin giỏ hàng...</p>
        </div>
      ) : !userId ? (
        <div className="cart-empty-container">
          <div className="cart-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 11c0 3.532 2.156 6.453 5.342 7.575a7.973 7.973 0 01-10.684 0C9.844 17.453 12 14.532 12 11zm0 0a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
          </div>
          <h2 className="cart-empty-title">Bạn chưa đăng nhập</h2>
          <p className="cart-empty-desc">Vui lòng đăng nhập để lưu trữ và quản lý các sản phẩm trong giỏ hàng của bạn.</p>
          <button type="button" onClick={() => navigate('/login')} className="cart-empty-btn">
            Đăng nhập ngay
          </button>
        </div>
      ) : !cartData || !cartData.items || cartData.items.length === 0 ? (
        <div className="cart-empty-container">
          <div className="cart-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="cart-empty-title">Giỏ hàng của bạn đang trống</h2>
          <p className="cart-empty-desc">Hãy khám phá bộ sưu tập thời trang thời thượng và chọn cho mình những món đồ ưng ý nhé!</p>
          <button type="button" onClick={() => navigate('/shop')} className="cart-empty-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Khám phá mua sắm ngay
          </button>
        </div>
      ) : (
        /* Layout 2 cột rõ ràng & chuyên nghiệp */
        <div className="cart-layout-grid">
          
          {/* CỘT TRÁI: Bảng sản phẩm & Form địa chỉ */}
          <div className="cart-left-col">
            
            {/* Khối danh sách sản phẩm */}
            <div className="cart-card">
              <div className="cart-card-header">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  Danh sách sản phẩm ({cartData.items.length})
                </h3>
              </div>

              <div className="cart-table-wrapper">
                <table className="cart-items-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Sản phẩm</th>
                      <th style={{ width: '18%' }}>Đơn giá</th>
                      <th style={{ width: '18%', textAlign: 'center' }}>Số lượng</th>
                      <th style={{ width: '16%' }}>Thành tiền</th>
                      <th style={{ width: '8%', textAlign: 'center' }}>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartData.items.map((item) => (
                      <tr
                        key={item.cartItemId}
                        style={{
                          opacity: updatingItemId === item.cartItemId ? 0.45 : 1,
                          transition: 'opacity 0.2s'
                        }}
                      >
                        {/* Cột Sản phẩm & Phân loại */}
                        <td>
                          <div className="cart-product-cell">
                            <div className="cart-product-thumb">
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
                              </svg>
                            </div>
                            <div className="cart-product-meta">
                              <span
                                className="cart-product-name"
                                onClick={() => item.productId && navigate(`/shop/product/${item.productId}`)}
                                title="Bấm để xem sản phẩm"
                              >
                                {item.productName}
                              </span>

                              <div className="cart-variant-badges">
                                <span className="variant-tag">
                                  <span>Phân loại:</span>
                                  <strong>{formatColor(item.color)}</strong> • <strong>Size {item.size}</strong>
                                </span>
                              </div>

                              {item.productId && (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/shop/product/${item.productId}`)}
                                  className="cart-change-size-link"
                                >
                                  Đổi size / màu khác
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Đơn giá */}
                        <td>
                          <span className="cart-unit-price">
                            {item.price?.toLocaleString()}₫
                          </span>
                        </td>

                        {/* Bộ điều khiển số lượng */}
                        <td style={{ textAlign: 'center' }}>
                          <div className="cart-qty-stepper">
                            <button
                              type="button"
                              className="cart-qty-btn"
                              onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity - 1)}
                              disabled={item.quantity <= 1 || updatingItemId === item.cartItemId}
                              title="Giảm số lượng"
                            >
                              −
                            </button>
                            <span className="cart-qty-val">{item.quantity}</span>
                            <button
                              type="button"
                              className="cart-qty-btn"
                              onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity + 1)}
                              disabled={updatingItemId === item.cartItemId}
                              title="Tăng số lượng"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Thành tiền */}
                        <td>
                          <span className="cart-subtotal-price">
                            {item.subTotal?.toLocaleString()}₫
                          </span>
                        </td>

                        {/* Thao tác xóa */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="cart-item-delete-btn"
                            onClick={() => handleRemoveItemRequest(item)}
                            disabled={updatingItemId === item.cartItemId}
                            title="Xóa món này khỏi giỏ"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Khối thông tin giao hàng */}
            <div className="cart-card">
              <div className="cart-card-header">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  Thông tin người nhận & Địa chỉ giao hàng
                </h3>
              </div>

              <div className="cart-shipping-form">
                <div className="cart-form-group">
                  <label className="cart-form-label">
                    Họ và tên người nhận <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="cart-form-input"
                    value={address.recipientName}
                    onChange={(e) => setAddress({ ...address, recipientName: e.target.value })}
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>

                <div className="cart-form-group">
                  <label className="cart-form-label">
                    Số điện thoại liên hệ <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    className="cart-form-input"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    placeholder="VD: 0987654321"
                  />
                </div>

                <div className="cart-form-group col-span-2">
                  <label className="cart-form-label">
                    Tỉnh / Thành phố <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="cart-form-input"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="VD: Hà Nội, TP. Hồ Chí Minh, Đà Nẵng..."
                  />
                </div>

                <div className="cart-form-group col-span-2">
                  <label className="cart-form-label">
                    Địa chỉ chi tiết (Số nhà, ngõ, tên đường, phường/xã) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="cart-form-input"
                    value={address.addressLine}
                    onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                    placeholder="VD: Số 123 Đường Cầu Giấy, Phường Dịch Vọng..."
                  />
                </div>
              </div>
            </div>

          </div>

          {/* CỘT PHẢI: Tóm tắt đơn hàng & Nút thanh toán Sticky */}
          <div className="cart-right-col">
            <div className="cart-summary-card">
              <div className="cart-card-header">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  Tóm tắt đơn hàng
                </h3>
              </div>

              <div className="cart-summary-body">
                <div className="cart-summary-row">
                  <span>Tạm tính ({cartData.items.length} món)</span>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>
                    {cartData.totalAmount?.toLocaleString()}₫
                  </span>
                </div>

                <div className="cart-summary-row">
                  <span>Phí vận chuyển</span>
                  <span className="freeship-badge">MIỄN PHÍ</span>
                </div>

                <div className="cart-summary-row">
                  <span>Giảm giá</span>
                  <span style={{ color: '#059669', fontWeight: '600' }}>-0₫</span>
                </div>

                <div className="cart-summary-divider" />

                <div className="cart-total-row">
                  <span className="cart-total-label">Tổng thanh toán:</span>
                  <span className="cart-total-amount">
                    {cartData.totalAmount?.toLocaleString()}₫
                  </span>
                </div>

                <div className="cart-vat-note">
                  (Đã bao gồm VAT & Miễn phí ship toàn quốc)
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={loading}
                  className="cart-checkout-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  <span>{loading ? 'Đang kết nối PayOS...' : 'Tiến hành thanh toán PayOS'}</span>
                </button>
              </div>

              {/* Cam kết tin cậy & an toàn */}
              <div className="cart-trust-badges">
                <div className="trust-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Thanh toán bảo mật chuẩn quốc tế qua cổng PayOS</span>
                </div>
                <div className="trust-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Hỗ trợ đổi trả miễn phí trong vòng 7 ngày</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Modal Xác Nhận Xóa Từng Món */}
      {itemToDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' }}>
              Xác nhận xóa sản phẩm
            </h3>
            <p style={{ margin: '0 0 24px 0', color: '#475569', lineHeight: '1.5', fontSize: '0.95rem' }}>
              Bạn có chắc chắn muốn xóa <strong>{itemToDelete.productName}</strong> ({formatColor(itemToDelete.color)}, Size {itemToDelete.size}) khỏi giỏ hàng?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={cancelRemoveItem}
                style={{ padding: '9px 16px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={confirmRemoveItem}
                disabled={updatingItemId !== null}
                style={{ padding: '9px 18px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', opacity: updatingItemId ? 0.7 : 1 }}
              >
                {updatingItemId ? 'Đang xóa...' : 'Xóa món này'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
