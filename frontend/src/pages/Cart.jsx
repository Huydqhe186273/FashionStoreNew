import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, addToCart, updateQuantity, removeItem, clearCart, createPaymentLink, createAddress, createOrder, verifyPayment } from '../services/cartService';
import { AuthContext } from '../context/AuthContext';

export default function Cart() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const userId = user?.id; // Lấy userId từ người dùng đã đăng nhập

  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null); // Lưu thông tin item đang chuẩn bị xóa
  const [address, setAddress] = useState({
    recipientName: '',
    phone: '',
    addressLine: '',
    city: ''
  });

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadCart = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Gọi API qua Axios để lấy dữ liệu CartDTO từ Backend
      const data = await getCart(userId);
      // Cập nhật state để render danh sách sản phẩm lên giao diện
      setCartData(data);
    } catch (error) {
      console.error("Lỗi khi tải giỏ hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();

    // Kiểm tra URL parameters để xác định kết quả trả về từ cổng thanh toán PayOS
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const orderCode = urlParams.get('orderCode');

    if (paymentStatus === 'success' && orderCode) {
      // Xác minh thanh toán tại Backend để đảm bảo tính bảo mật của giao dịch
      verifyPayment(orderCode).then(res => {
        showToast('success', res.message);
        // Xóa query parameters trên URL để làm sạch thanh địa chỉ
        window.history.replaceState({}, document.title, window.location.pathname);
        loadCart();
      }).catch(err => {
        showToast('error', "Có lỗi khi xác minh thanh toán.");
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    } else if (paymentStatus === 'cancel') {
      showToast('error', "Bạn đã hủy thanh toán.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    // Không cho phép giảm số lượng xuống dưới 1 qua nút bấm
    if (newQuantity < 1) return;
    try {
      // Kích hoạt trạng thái loading cho item đang cập nhật
      setUpdatingItemId(cartItemId);
      // Gọi API để cập nhật số lượng sản phẩm trong cơ sở dữ liệu
      const updatedCart = await updateQuantity(userId, cartItemId, newQuantity);
      // Cập nhật lại state với dữ liệu giỏ hàng mới nhất
      setCartData(updatedCart);
    } catch (error) {
      console.error("Lỗi cập nhật số lượng:", error);
      showToast('error', 'Cập nhật thất bại. Có thể do hết hàng trong kho.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Mở modal xác nhận trước khi thực hiện xóa sản phẩm
  const handleRemoveItemRequest = (item) => {
    setItemToDelete(item);
  };

  const confirmRemoveItem = async () => {
    if (!itemToDelete) return;
    try {
      // Bật state loading chờ xóa
      setUpdatingItemId(itemToDelete.cartItemId);
      // Gọi API đá item này ra khỏi DB
      const updatedCart = await removeItem(userId, itemToDelete.cartItemId);
      setCartData(updatedCart);
      showToast('success', 'Đã xóa sản phẩm khỏi giỏ hàng.');
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
      showToast('error', 'Xóa sản phẩm thất bại.');
    } finally {
      // Dọn dẹp state, ẩn modal
      setUpdatingItemId(null);
      setItemToDelete(null);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng không?")) {
      try {
        setLoading(true);
        const updatedCart = await clearCart(userId);
        setCartData(updatedCart);
        showToast('success', 'Đã xóa tất cả sản phẩm khỏi giỏ hàng.');
      } catch (error) {
        console.error("Lỗi xóa giỏ hàng:", error);
        showToast('error', 'Xóa tất cả sản phẩm thất bại.');
      } finally {
        setLoading(false);
      }
    }
  };

  const cancelRemoveItem = () => {
    // Đóng modal xác nhận xóa
    setItemToDelete(null);
  };

  const handleCheckout = async () => {
    // Kiểm tra giỏ hàng trống trước khi tiến hành thanh toán
    if (!cartData || !cartData.items || cartData.items.length === 0) {
      showToast('error', "Giỏ hàng của bạn đang trống!");
      return;
    }
    if (!address.recipientName || !address.phone || !address.addressLine || !address.city) {
      showToast('error', "Vui lòng điền đầy đủ thông tin địa chỉ giao hàng!");
      return;
    }
    try {
      setLoading(true);
      // BƯỚC 1: Lưu thông tin giao hàng vào Database
      const savedAddress = await createAddress(userId, address);

      // BƯỚC 2: Chuyển dữ liệu từ Giỏ hàng sang Đơn hàng (Trạng thái UNPAID)
      const orderResponse = await createOrder(userId, savedAddress.addressId);

      // BƯỚC 3: Khởi tạo phiên thanh toán PayOS và chuyển hướng người dùng
      const data = await createPaymentLink(orderResponse.orderId);
      if (data && data.checkoutUrl) {
        // Chuyển hướng người dùng sang cổng thanh toán PayOS
        window.location.href = data.checkoutUrl;
      } else {
        showToast('error', "Lỗi: Không nhận được URL thanh toán từ server.");
      }
    } catch (error) {
      console.error("Lỗi thanh toán:", error);
      showToast('error', "Không thể khởi tạo thanh toán. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '0', color: '#111827' }}>

      {toastMessage && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          padding: '16px 24px', borderRadius: '8px', color: '#fff',
          backgroundColor: toastMessage.type === 'success' ? '#10b981' : '#ef4444',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          display: 'flex', alignItems: 'center', gap: '12px',
          transition: 'all 0.3s ease',
          animation: 'slideIn 0.3s ease-out forwards'
        }}>
          {toastMessage.type === 'success' ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          )}
          <span style={{ fontWeight: '500' }}>{toastMessage.text}</span>
        </div>
      )}
      <style>
        {`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}
      </style>

      <div style={{ padding: '24px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid #e5e7eb', marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Giỏ hàng của bạn</h2>
          {cartData && cartData.items && cartData.items.length > 0 && (
            <button
              onClick={handleClearCart}
              disabled={loading}
              style={{ padding: '8px 16px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', opacity: loading ? 0.7 : 1, fontWeight: '600', fontSize: '0.9rem' }}
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Đang tải giỏ hàng...</p>
        ) : !userId ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <svg viewBox="0 0 24 24" style={{ width: '80px', height: '80px', opacity: 0.3, marginBottom: '16px', margin: '0 auto', display: 'block', color: '#6b7280' }}><path d="M12 11c0 3.532 2.156 6.453 5.342 7.575a7.973 7.973 0 01-10.684 0C9.844 17.453 12 14.532 12 11zm0 0a4 4 0 100-8 4 4 0 000 8z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <p style={{ fontSize: '1.2rem', marginTop: '16px', fontWeight: '500', color: '#4b5563' }}>Bạn cần đăng nhập để xem giỏ hàng.</p>
            <button onClick={() => navigate('/login')} style={{ marginTop: '16px', padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
              Đăng nhập ngay
            </button>
          </div>
        ) : !cartData || !cartData.items || cartData.items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <svg viewBox="0 0 24 24" style={{ width: '80px', height: '80px', opacity: 0.3, marginBottom: '16px', margin: '0 auto', display: 'block', color: '#6b7280' }}><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <p style={{ fontSize: '1.2rem', marginTop: '16px', fontWeight: '500', color: '#4b5563' }}>Giỏ hàng của bạn đang trống.</p>
          </div>
        ) : (
          <>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '16px 12px', fontWeight: '600' }}>Sản Phẩm</th>
                  <th style={{ padding: '16px 12px', fontWeight: '600' }}>Phân Loại</th>
                  <th style={{ padding: '16px 12px', fontWeight: '600' }}>Đơn Giá</th>
                  <th style={{ padding: '16px 12px', textAlign: 'center', fontWeight: '600' }}>Số Lượng</th>
                  <th style={{ padding: '16px 12px', fontWeight: '600' }}>Thành Tiền</th>
                  <th style={{ padding: '16px 12px', textAlign: 'center', fontWeight: '600' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {cartData.items.map((item) => (
                  <tr key={item.cartItemId} style={{ borderBottom: '1px solid #f3f4f6', opacity: updatingItemId === item.cartItemId ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                    <td style={{ padding: '16px 12px' }}>
                      <strong style={{ color: '#111827' }}>{item.productName}</strong>
                    </td>
                    <td style={{ padding: '16px 12px', color: '#4b5563' }}>{item.color} - Size {item.size}</td>
                    <td style={{ padding: '16px 12px', color: '#4b5563' }}>{item.price?.toLocaleString()}đ</td>
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <button
                          onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updatingItemId === item.cartItemId}
                          style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', color: '#374151', cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                        >-</button>
                        <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '600', color: '#111827' }}>{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity + 1)}
                          disabled={updatingItemId === item.cartItemId}
                          style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', color: '#374151', cursor: 'pointer', fontWeight: 'bold' }}
                        >+</button>
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px', color: '#ef4444', fontWeight: 'bold' }}>
                      {item.subTotal?.toLocaleString()}đ
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleRemoveItemRequest(item)}
                        disabled={updatingItemId === item.cartItemId}
                        style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '40px', padding: '24px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#111827' }}>Thông tin giao hàng</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#4b5563', fontSize: '0.9rem', fontWeight: '500' }}>Tên người nhận</label>
                  <input
                    type="text"
                    value={address.recipientName}
                    onChange={(e) => setAddress({ ...address, recipientName: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }}
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#4b5563', fontSize: '0.9rem', fontWeight: '500' }}>Số điện thoại</label>
                  <input
                    type="text"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }}
                    placeholder="VD: 0987654321"
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#4b5563', fontSize: '0.9rem', fontWeight: '500' }}>Địa chỉ cụ thể</label>
                  <input
                    type="text"
                    value={address.addressLine}
                    onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }}
                    placeholder="VD: Số nhà 10, Ngõ 20..."
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#4b5563', fontSize: '0.9rem', fontWeight: '500' }}>Tỉnh/Thành phố</label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }}
                    placeholder="VD: Hà Nội"
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right', fontSize: '1.25rem', padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <span style={{ color: '#4b5563', marginRight: '10px' }}>Tổng thanh toán: </span>
              <strong style={{ color: '#ef4444', fontSize: '1.75rem' }}>
                {cartData.totalAmount?.toLocaleString()}đ
              </strong>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                onClick={handleCheckout}
                disabled={loading}
                style={{ padding: '14px 28px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Đang khởi tạo...' : 'Tiến hành thanh toán PayOS'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal Xác Nhận Xóa */}
      {itemToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17, 24, 39, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: '#111827' }}>Xác nhận xóa</h3>
            <p style={{ margin: '0 0 24px 0', color: '#4b5563', lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn xóa <strong>{itemToDelete.productName}</strong> (Size {itemToDelete.size}, {itemToDelete.color}) khỏi giỏ hàng không?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={cancelRemoveItem}
                style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
              >
                Hủy
              </button>
              <button
                onClick={confirmRemoveItem}
                disabled={updatingItemId !== null}
                style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', opacity: updatingItemId ? 0.7 : 1 }}
              >
                {updatingItemId ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
