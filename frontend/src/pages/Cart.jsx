import React, { useEffect, useState } from 'react';
import { getCart, addToCart, updateQuantity, removeItem, createPaymentLink } from '../services/cartService';

export default function Cart() {
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null); // Lưu thông tin item đang chuẩn bị xóa
  const userId = 1; // Mặc định dùng userId 1 để test

  const loadCart = async () => {
    try {
      setLoading(true);
      const data = await getCart(userId);
      setCartData(data);
    } catch (error) {
      console.error("Lỗi khi tải giỏ hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
    
    // Đọc tham số từ URL khi từ trang PayOS quay về
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      alert("Thanh toán thành công! Mã đơn hàng của bạn đã được ghi nhận.");
      // Xóa param khỏi URL để tránh báo lại khi F5
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancel') {
      alert("Bạn đã hủy thanh toán.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleAddSampleItem = async (variantId) => {
    try {
      setAdding(true);
      const updatedCart = await addToCart(userId, variantId, 1);
      setCartData(updatedCart);
    } catch (error) {
      console.error("Lỗi thêm sản phẩm:", error);
      alert('Thêm sản phẩm thất bại. Có thể do hết hàng hoặc chưa có Variant ID ' + variantId + ' trong Database.');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return; // Không cho giảm dưới 1 bằng nút này, phải dùng nút xóa
    try {
      setUpdatingItemId(cartItemId);
      const updatedCart = await updateQuantity(userId, cartItemId, newQuantity);
      setCartData(updatedCart);
    } catch (error) {
      console.error("Lỗi cập nhật số lượng:", error);
      alert('Cập nhật thất bại. Có thể do hết hàng trong kho.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Mở modal xác nhận thay vì dùng window.confirm
  const handleRemoveItemRequest = (item) => {
    setItemToDelete(item);
  };

  const confirmRemoveItem = async () => {
    if (!itemToDelete) return;
    try {
      setUpdatingItemId(itemToDelete.cartItemId);
      const updatedCart = await removeItem(userId, itemToDelete.cartItemId);
      setCartData(updatedCart);
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
      alert('Xóa sản phẩm thất bại.');
    } finally {
      setUpdatingItemId(null);
      setItemToDelete(null); // Đóng modal
    }
  };

  const cancelRemoveItem = () => {
    setItemToDelete(null); // Đóng modal
  };

  const handleCheckout = async () => {
    if (!cartData || !cartData.items || cartData.items.length === 0) {
      alert("Giỏ hàng của bạn đang trống!");
      return;
    }
    try {
      setLoading(true);
      const data = await createPaymentLink(userId);
      if (data && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert("Lỗi: Không nhận được URL thanh toán từ server.");
      }
    } catch (error) {
      console.error("Lỗi thanh toán:", error);
      alert("Không thể khởi tạo thanh toán. Vui lòng kiểm tra API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '0', color: '#111827' }}>
      
      <div style={{ padding: '24px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid #e5e7eb', marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Giỏ hàng của bạn</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => handleAddSampleItem(1)} 
              disabled={adding}
              style={{ padding: '10px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: adding ? 0.7 : 1, fontWeight: '600' }}
            >
              {adding ? 'Đang thêm...' : '+ Áo Đen'}
            </button>
            <button 
              onClick={() => handleAddSampleItem(3)} 
              disabled={adding}
              style={{ padding: '10px 16px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: adding ? 0.7 : 1, fontWeight: '600' }}
            >
              {adding ? 'Đang thêm...' : '+ Áo Trắng'}
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Đang tải giỏ hàng...</p>
        ) : !cartData || !cartData.items || cartData.items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <svg viewBox="0 0 24 24" style={{ width: '80px', height: '80px', opacity: 0.3, marginBottom: '16px', margin: '0 auto', display: 'block', color: '#6b7280' }}><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
            
            <div style={{ marginTop: '32px', textAlign: 'right', fontSize: '1.25rem', padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
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
