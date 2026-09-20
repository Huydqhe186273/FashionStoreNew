import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { getCart, addToCart } from '../services/cartService';

export default function Cart() {
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
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
  }, []);

  const handleAddSampleItem = async (variantId) => {
    try {
      setAdding(true);
      // Thêm sản phẩm variantId
      const updatedCart = await addToCart(userId, variantId, 1);
      setCartData(updatedCart);
      // alert('Đã thêm sản phẩm mẫu vào giỏ hàng thành công!');
    } catch (error) {
      console.error("Lỗi thêm sản phẩm:", error);
      alert('Thêm sản phẩm thất bại. Có thể do hết hàng hoặc chưa có Variant ID ' + variantId + ' trong Database.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <main className="main-content">
      <Header title="Giỏ Hàng Của Khách (Test)" />
      
      <div style={{ padding: '20px', background: 'var(--surface-color, #1e1e2d)', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Thông tin giỏ hàng</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => handleAddSampleItem(1)} 
              disabled={adding}
              style={{ padding: '10px 15px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: adding ? 0.7 : 1, fontWeight: 'bold' }}
            >
              {adding ? 'Đang thêm...' : '+ Thêm Áo phông (Đen)'}
            </button>
            <button 
              onClick={() => handleAddSampleItem(3)} 
              disabled={adding}
              style={{ padding: '10px 15px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: adding ? 0.7 : 1, fontWeight: 'bold' }}
            >
              {adding ? 'Đang thêm...' : '+ Thêm Áo phông (Trắng)'}
            </button>
          </div>
        </div>

        {loading ? (
          <p>Đang tải giỏ hàng...</p>
        ) : !cartData || !cartData.items || cartData.items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <svg viewBox="0 0 24 24" width="48" height="48" style={{ opacity: 0.5, marginBottom: '10px' }}><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <p>Giỏ hàng của bạn đang trống.</p>
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên Sản Phẩm</th>
                  <th>Phân Loại</th>
                  <th>Đơn Giá</th>
                  <th>Số Lượng</th>
                  <th>Thành Tiền</th>
                </tr>
              </thead>
              <tbody>
                {cartData.items.map((item, idx) => (
                  <tr key={idx}>
                    <td><strong>{item.productName}</strong></td>
                    <td>{item.color} - Size {item.size}</td>
                    <td>{item.price?.toLocaleString()}đ</td>
                    <td>{item.quantity}</td>
                    <td style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{item.subTotal?.toLocaleString()}đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{ marginTop: '20px', textAlign: 'right', fontSize: '1.2rem' }}>
              <span>Tổng thanh toán: </span>
              <strong style={{ color: 'var(--danger-color)', fontSize: '1.5rem' }}>
                {cartData.totalAmount?.toLocaleString()}đ
              </strong>
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button style={{ padding: '12px 24px', backgroundColor: 'var(--success-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>
                Tiến hành thanh toán
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
