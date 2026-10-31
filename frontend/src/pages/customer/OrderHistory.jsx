import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserOrders, cancelOrder, createReturnRequest } from '../../services/orderService';
import { createPaymentLink } from '../../services/cartService';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './OrderHistory.css';

// Chuẩn hóa màu sắc
const formatColor = (color) => {
  if (!color) return '';
  if (color.includes('Tr?ng')) return color.replace('Tr?ng', 'Trắng');
  return color;
};

// Từ điển trạng thái đơn hàng tiếng Việt
const ORDER_STATUS_MAP = {
  pending: { label: 'Chờ xử lý', class: 'pending' },
  confirmed: { label: 'Đã xác nhận', class: 'confirmed' },
  shipping: { label: 'Đang vận chuyển', class: 'shipping' },
  delivered: { label: 'Đã giao thành công', class: 'delivered' },
  cancelled: { label: 'Đã hủy', class: 'cancelled' },
  returned: { label: 'Đã trả hàng', class: 'cancelled' }
};

const PAYMENT_STATUS_MAP = {
  paid: { label: 'Đã thanh toán', class: 'paid' },
  unpaid: { label: 'Chưa thanh toán', class: 'unpaid' },
  refunded: { label: 'Đã hoàn tiền', class: 'paid' }
};

export default function OrderHistory() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const { toast } = useToast();
  const navigate = useNavigate();
  const userId = user?.id;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState(null);

  // Return & Refund Modal
  const [orderToReturn, setOrderToReturn] = useState(null);
  const [returnReasonType, setReturnReasonType] = useState('Hàng bị lỗi hoặc hư hại do vận chuyển');
  const [returnReasonDetail, setReturnReasonDetail] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getUserOrders(userId);
      setOrders(data || []);
    } catch (err) {
      console.error('Lỗi khi tải lịch sử đơn hàng:', err);
      toast.error('Không thể tải lịch sử đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if (authLoading) return;
    if (userId) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [userId, authLoading, fetchOrders]);

  // Lọc đơn hàng theo tab
  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    if (activeTab === 'paid') return orders.filter((o) => o.paymentStatus === 'paid');
    return orders.filter((o) => o.orderStatus === activeTab);
  }, [orders, activeTab]);

  // Hủy đơn hàng
  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    try {
      setCancelling(true);
      await cancelOrder(orderToCancel.orderId, userId);
      toast.success(`Đã hủy thành công đơn hàng #${orderToCancel.orderId}`);
      setOrderToCancel(null);
      fetchOrders();
    } catch (err) {
      console.error('Lỗi hủy đơn:', err);
      toast.error(err.response?.data?.error || err.message || 'Hủy đơn hàng thất bại.');
    } finally {
      setCancelling(false);
    }
  };

  // Gửi yêu cầu trả hàng & hoàn tiền
  const handleConfirmReturn = async () => {
    if (!orderToReturn) return;
    const fullReason = returnReasonDetail.trim()
      ? `${returnReasonType}: ${returnReasonDetail.trim()}`
      : returnReasonType;

    try {
      setSubmittingReturn(true);
      await createReturnRequest(orderToReturn.orderId, userId, fullReason);
      toast.success(`Đã gửi yêu cầu trả hàng & hoàn tiền cho đơn #${orderToReturn.orderId}`);
      setOrderToReturn(null);
      setReturnReasonDetail('');
      fetchOrders();
    } catch (err) {
      console.error('Lỗi gửi yêu cầu hoàn tiền:', err);
      toast.error(err.response?.data?.error || err.message || 'Gửi yêu cầu hoàn tiền thất bại.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Thanh toán lại cho đơn chưa thanh toán
  const handleRepay = async (orderId) => {
    try {
      setPayingOrderId(orderId);
      const res = await createPaymentLink(orderId);
      if (res && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        toast.error('Không nhận được đường dẫn thanh toán từ cổng PayOS.');
      }
    } catch (err) {
      console.error('Lỗi tạo link thanh toán:', err);
      toast.error(err.response?.data?.error || 'Không thể khởi tạo thanh toán PayOS.');
    } finally {
      setPayingOrderId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="orders-page-wrapper" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#64748b', fontWeight: '500' }}>Đang tải danh sách đơn hàng của bạn...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="orders-page-wrapper">
        <div className="orders-empty-wrap">
          <div className="orders-empty-icon">🔒</div>
          <h2 className="orders-empty-title">Bạn chưa đăng nhập</h2>
          <p className="orders-empty-desc">Vui lòng đăng nhập tài khoản để theo dõi lịch sử và tiến độ giao hàng.</p>
          <button type="button" onClick={() => navigate('/login')} className="orders-empty-btn">
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page-wrapper">
      {/* Header */}
      <div className="orders-header-bar">
        <div className="orders-title-group">
          <button
            type="button"
            onClick={() => navigate('/shop')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontWeight: '600', fontSize: '0.9rem', marginRight: '8px' }}
          >
            ← Cửa hàng
          </button>
          <h1 className="orders-title">Lịch sử đơn hàng</h1>
          <span className="orders-count-badge">{orders.length} đơn</span>
        </div>
      </div>

      {/* Tabs lọc trạng thái */}
      <div className="orders-filter-tabs">
        <button
          type="button"
          className={`orders-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Tất cả ({orders.length})
        </button>
        <button
          type="button"
          className={`orders-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Chờ xử lý ({orders.filter((o) => o.orderStatus === 'pending').length})
        </button>
        <button
          type="button"
          className={`orders-tab-btn ${activeTab === 'paid' ? 'active' : ''}`}
          onClick={() => setActiveTab('paid')}
        >
          Đã thanh toán ({orders.filter((o) => o.paymentStatus === 'paid').length})
        </button>
        <button
          type="button"
          className={`orders-tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
          onClick={() => setActiveTab('shipping')}
        >
          Đang vận chuyển ({orders.filter((o) => o.orderStatus === 'shipping').length})
        </button>
        <button
          type="button"
          className={`orders-tab-btn ${activeTab === 'delivered' ? 'active' : ''}`}
          onClick={() => setActiveTab('delivered')}
        >
          Hoàn thành ({orders.filter((o) => o.orderStatus === 'delivered').length})
        </button>
        <button
          type="button"
          className={`orders-tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`}
          onClick={() => setActiveTab('cancelled')}
        >
          Đã hủy ({orders.filter((o) => o.orderStatus === 'cancelled').length})
        </button>
      </div>

      {/* Danh sách đơn hàng */}
      {filteredOrders.length === 0 ? (
        <div className="orders-empty-wrap">
          <div className="orders-empty-icon">📦</div>
          <h2 className="orders-empty-title">Không tìm thấy đơn hàng nào</h2>
          <p className="orders-empty-desc">
            {activeTab === 'all'
              ? 'Bạn chưa có đơn hàng nào tại Fashion Store. Hãy khám phá ngay các bộ sưu tập thời trang mới nhất!'
              : `Hiện không có đơn hàng nào ở trạng thái này.`}
          </p>
          <button type="button" onClick={() => navigate('/shop')} className="orders-empty-btn">
            Khám phá mua sắm ngay
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => {
            const statusMeta = ORDER_STATUS_MAP[order.orderStatus?.toLowerCase()] || {
              label: order.orderStatus,
              class: 'pending'
            };
            const paymentMeta = PAYMENT_STATUS_MAP[order.paymentStatus?.toLowerCase()] || {
              label: order.paymentStatus,
              class: 'unpaid'
            };

            const canRepay = order.orderStatus === 'pending' && order.paymentStatus !== 'paid';
            const canReview = order.orderStatus?.toLowerCase() === 'confirmed'
              && order.paymentStatus?.toLowerCase() === 'paid';

            return (
              <div key={order.orderId} className="order-card">
                {/* Header đơn */}
                <div className="order-card-header">
                  <div className="order-meta-info">
                    <span className="order-code-badge">Đơn hàng #{order.orderId}</span>
                    <span className="order-date">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : ''}
                    </span>
                  </div>

                  <div className="order-status-badges">
                    <span className={`badge-status ${statusMeta.class}`}>
                      {statusMeta.label}
                    </span>
                    <span className={`badge-payment ${paymentMeta.class}`}>
                      {paymentMeta.label}
                    </span>
                  </div>
                </div>

                {/* Danh sách sản phẩm của đơn */}
                <div className="order-card-body">
                  {order.items && order.items.map((item) => (
                    <div key={item.orderItemId} className="order-item-row">
                      <div className="order-item-left">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} className="order-item-thumb" />
                        ) : (
                          <div className="order-item-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            👕
                          </div>
                        )}
                        <div className="order-item-info">
                          <span className="order-item-name">{item.productName}</span>
                          <span className="order-item-variant">
                            Phân loại: {formatColor(item.color)} • Size {item.size}
                          </span>
                          <span className="order-item-qty">
                            {item.priceAtPurchase?.toLocaleString()}₫ × {item.quantity}
                          </span>
                        </div>
                      </div>

                      <div className="order-item-price-wrap">
                        <span className="order-item-subtotal">
                          {item.subTotal?.toLocaleString()}₫
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer đơn */}
                <div className="order-card-footer">
                  <div className="order-footer-left">
                    <div className="order-shipping-summary">
                      Giao tới: <strong>{order.recipientName}</strong> ({order.phone}) - {order.addressLine}, {order.city}
                    </div>
                    {order.discountCode && (
                      <div className="order-coupon-pill">
                        🏷️ Voucher: {order.discountCode}
                      </div>
                    )}
                  </div>

                  <div className="order-footer-right">
                    <div>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', marginRight: '6px' }}>Tổng thanh toán:</span>
                      <span className="order-total-amount">
                        {order.totalAmount?.toLocaleString()}₫
                      </span>
                    </div>

                    <div className="order-actions-group">
                      {canReview && (
                        <button
                          type="button"
                          onClick={() => navigate(`/shop/reviews?orderId=${order.orderId}`)}
                          className="btn-order-view"
                        >
                          ⭐ Đánh giá
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="btn-order-view"
                      >
                        Chi tiết
                      </button>

                      {order.returnStatus === 'pending' && (
                        <span className="badge-return-status pending" title={order.returnReason || ''}>
                          ⏳ Chờ duyệt hoàn tiền
                        </span>
                      )}

                      {(order.returnStatus === 'approved' || order.returnStatus === 'refunded') && (
                        <span className="badge-return-status approved">
                          ✅ Đã hoàn tiền
                        </span>
                      )}

                      {order.returnStatus === 'rejected' && (
                        <span className="badge-return-status rejected" title={order.returnReason || ''}>
                          ❌ Hoàn tiền bị từ chối
                        </span>
                      )}

                      {order.canReturn && (
                        <button
                          type="button"
                          onClick={() => {
                            setOrderToReturn(order);
                            setReturnReasonType('Hàng bị lỗi hoặc hư hại do vận chuyển');
                            setReturnReasonDetail('');
                          }}
                          className="btn-order-return"
                        >
                          🔄 Trả hàng / Hoàn tiền
                        </button>
                      )}

                      {order.canCancel && (
                        <button
                          type="button"
                          onClick={() => setOrderToCancel(order)}
                          className="btn-order-cancel"
                        >
                          Hủy đơn
                        </button>
                      )}

                      {canRepay && (
                        <button
                          type="button"
                          onClick={() => handleRepay(order.orderId)}
                          disabled={payingOrderId === order.orderId}
                          className="btn-order-pay"
                        >
                          {payingOrderId === order.orderId ? 'Đang mở PayOS...' : '💳 Thanh toán PayOS'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Chi Tiết Đơn Hàng */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px' }}>
          <div className="order-detail-modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                  Chi tiết đơn hàng #{selectedOrder.orderId}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Ngày tạo: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('vi-VN') : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {/* Thông tin giao hàng */}
            <div className="order-detail-section">
              <div className="order-detail-section-title">📍 Địa chỉ nhận hàng</div>
              <div className="order-detail-address-box">
                <div><strong>Người nhận:</strong> {selectedOrder.recipientName}</div>
                <div><strong>Số điện thoại:</strong> {selectedOrder.phone}</div>
                <div><strong>Địa chỉ:</strong> {selectedOrder.addressLine}, {selectedOrder.city}</div>
              </div>
            </div>

            {/* Danh sách sản phẩm */}
            <div className="order-detail-section">
              <div className="order-detail-section-title">🛍️ Sản phẩm đã đặt ({selectedOrder.itemCount} món)</div>
              <div>
                {selectedOrder.items?.map((item) => (
                  <div key={item.orderItemId} className="order-item-row">
                    <div className="order-item-left">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="order-item-thumb" />
                      ) : (
                        <div className="order-item-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👕</div>
                      )}
                      <div className="order-item-info">
                        <span className="order-item-name">{item.productName}</span>
                        <span className="order-item-variant">
                          Phân loại: {formatColor(item.color)} • Size {item.size}
                        </span>
                        <span className="order-item-qty">
                          {item.priceAtPurchase?.toLocaleString()}₫ × {item.quantity}
                        </span>
                      </div>
                    </div>
                    <span className="order-item-subtotal">
                      {item.subTotal?.toLocaleString()}₫
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tóm tắt thanh toán */}
            <div className="order-detail-section" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <div className="order-detail-summary-row">
                <span>Phí vận chuyển:</span>
                <span style={{ color: '#059669', fontWeight: '600' }}>Miễn phí</span>
              </div>
              {selectedOrder.discountCode && (
                <div className="order-detail-summary-row">
                  <span>Mã giảm giá ({selectedOrder.discountCode}):</span>
                  <span style={{ color: '#059669', fontWeight: '600' }}>Đã áp dụng</span>
                </div>
              )}
              <div className="order-detail-summary-row" style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
                <span>Tổng cộng:</span>
                <span>{selectedOrder.totalAmount?.toLocaleString()}₫</span>
              </div>
              <div className="order-detail-summary-row" style={{ marginTop: '4px' }}>
                <span>Trạng thái thanh toán:</span>
                <span style={{ fontWeight: '700', color: selectedOrder.paymentStatus === 'paid' ? '#059669' : '#e11d48' }}>
                  {PAYMENT_STATUS_MAP[selectedOrder.paymentStatus?.toLowerCase()]?.label || selectedOrder.paymentStatus}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ padding: '8px 18px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Xác Nhận Hủy Đơn Hàng */}
      {orderToCancel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' }}>
              Xác nhận hủy đơn hàng #{orderToCancel.orderId}
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#475569', lineHeight: '1.5', fontSize: '0.95rem' }}>
              Bạn có chắc chắn muốn hủy đơn hàng này không? Thao tác này không thể hoàn tác sau khi xác nhận.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                style={{ padding: '9px 16px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
              >
                Giữ đơn hàng
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                style={{ padding: '9px 18px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', opacity: cancelling ? 0.7 : 1 }}
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Yêu Cầu Trả Hàng & Hoàn Tiền */}
      {orderToReturn && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '520px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                  🔄 Yêu cầu trả hàng & hoàn tiền
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Đơn hàng #{orderToReturn.orderId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOrderToReturn(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {/* Thông tin hoàn tiền */}
            <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '10px', marginBottom: '18px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Số tiền dự kiến hoàn:</span>
                <strong style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: '800' }}>
                  {orderToReturn.totalAmount?.toLocaleString()}₫
                </strong>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                * Số tiền sẽ được hoàn lại sau khi yêu cầu được nhân viên cửa hàng xác nhận.
              </div>
            </div>

            {/* Chọn lý do */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Lý do hoàn trả:
              </label>
              <select
                value={returnReasonType}
                onChange={(e) => setReturnReasonType(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#1e293b', backgroundColor: '#ffffff', outline: 'none' }}
              >
                <option value="Hàng bị lỗi hoặc hư hại do vận chuyển">Hàng bị lỗi hoặc hư hại do vận chuyển</option>
                <option value="Giao sai sản phẩm / sai kích thước hoặc màu sắc">Giao sai sản phẩm / sai kích thước hoặc màu sắc</option>
                <option value="Sản phẩm khác biệt so với mô tả & hình ảnh">Sản phẩm khác biệt so với mô tả & hình ảnh</option>
                <option value="Không vừa kích cỡ, muốn đổi trả">Không vừa kích cỡ, muốn đổi trả</option>
                <option value="Khác">Lý do khác</option>
              </select>
            </div>

            {/* Mô tả chi tiết */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Mô tả chi tiết / Ghi chú thêm:
              </label>
              <textarea
                rows={3}
                value={returnReasonDetail}
                onChange={(e) => setReturnReasonDetail(e.target.value)}
                placeholder="Mô tả cụ thể tình trạng sản phẩm để shop hỗ trợ nhanh nhất..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#1e293b', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            {/* Nút hành động */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setOrderToReturn(null)}
                disabled={submittingReturn}
                style={{ padding: '9px 18px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                disabled={submittingReturn}
                style={{ padding: '9px 20px', backgroundColor: '#b45309', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', opacity: submittingReturn ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {submittingReturn ? 'Đang gửi...' : 'Xác nhận gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
