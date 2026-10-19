import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { getStaffOrders, getStaffOrderDetail, updateOrderStatus } from '../services/orderService';

const mockOrders = [
  {
    orderId: 101,
    customerName: "Nguyễn Văn An",
    customerEmail: "an.nguyen@gmail.com",
    customerPhone: "0909123456",
    orderStatus: "PENDING",
    paymentStatus: "unpaid",
    totalAmount: 649000,
    itemCount: 2,
    createdAt: "2026-10-16T14:30:00",
    shippingAddress: "Số 123 Đường Cầu Giấy, Hà Nội"
  },
  {
    orderId: 102,
    customerName: "Lê Thị Mai",
    customerEmail: "mai.le@gmail.com",
    customerPhone: "0918765432",
    orderStatus: "PROCESSING",
    paymentStatus: "PAID",
    totalAmount: 1100000,
    itemCount: 2,
    createdAt: "2026-10-16T11:15:00",
    shippingAddress: "Toà nhà Landmark 81, P. 22, Bình Thạnh, TP.HCM"
  },
  {
    orderId: 103,
    customerName: "Trần Quang Huy",
    customerEmail: "huy.tran@gmail.com",
    customerPhone: "0987654321",
    orderStatus: "SHIPPED",
    paymentStatus: "unpaid",
    totalAmount: 480000,
    itemCount: 1,
    createdAt: "2026-10-15T09:45:00",
    shippingAddress: "Số 45 Lê Duẩn, Hải Châu, Đà Nẵng"
  },
  {
    orderId: 104,
    customerName: "Phạm Thu Hương",
    customerEmail: "huong.pham@gmail.com",
    customerPhone: "0934567890",
    orderStatus: "DELIVERED",
    paymentStatus: "PAID",
    totalAmount: 850000,
    itemCount: 1,
    createdAt: "2026-10-14T16:20:00",
    shippingAddress: "78 Nguyễn Trãi, Thanh Xuân, Hà Nội"
  },
  {
    orderId: 105,
    customerName: "Đỗ Minh Tuấn",
    customerEmail: "tuan.do@gmail.com",
    customerPhone: "0977889900",
    orderStatus: "CANCELLED",
    paymentStatus: "unpaid",
    totalAmount: 550000,
    itemCount: 1,
    createdAt: "2026-10-14T10:00:00",
    shippingAddress: "Số 12 Quang Trung, Hà Đông, Hà Nội"
  }
];

export default function ManageOrders() {
  const [orders, setOrders] = useState(mockOrders);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Detail Modal State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return { time: 'N/A', date: '' };
    try {
      const d = new Date(dateStr);
      const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return { time, date };
    } catch {
      return { time: dateStr, date: '' };
    }
  };

  const loadOrders = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.keyword = search;
      const data = await getStaffOrders(params);
      setOrders(data);
      setIsLive(true);
    } catch (err) {
      console.warn('Axios error loading orders, fallback to mock:', err);
      setIsLive(false);
      let filtered = mockOrders.filter(o => {
        const matchSearch = !search ||
          String(o.orderId).includes(search) ||
          o.customerName.toLowerCase().includes(search.toLowerCase()) ||
          o.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
          o.customerPhone.includes(search);
        const matchStatus = !statusFilter || o.orderStatus === statusFilter;
        return matchSearch && matchStatus;
      });
      setOrders(filtered);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [search, statusFilter]);

  const handleOpenDetail = async (orderId) => {
    setIsDetailOpen(true);
    setLoadingDetail(true);
    setActionError('');
    setActionSuccess('');
    setSelectedOrder(null);

    try {
      const detail = await getStaffOrderDetail(orderId);
      setSelectedOrder(detail);
    } catch (err) {
      console.warn('Could not load order detail from server, fallback to local:', err);
      const found = orders.find(o => o.orderId === orderId);
      if (found) {
        setSelectedOrder({
          ...found,
          recipientName: found.customerName,
          recipientPhone: found.customerPhone,
          items: [
            {
              orderItemId: 1,
              productId: 1,
              productName: "Sản phẩm thời trang cao cấp",
              size: "M",
              color: "Đen",
              sku: "PRD-BLK-M",
              quantity: found.itemCount || 1,
              priceAtPurchase: found.totalAmount / (found.itemCount || 1),
              subtotal: found.totalAmount,
              currentStockQuantity: 10
            }
          ]
        });
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setActionError('');
    setActionSuccess('');

    let actionName = newStatus;
    if (newStatus === 'PROCESSING') actionName = 'Xác nhận đơn hàng (PROCESSING) và trừ tồn kho';
    if (newStatus === 'SHIPPED') actionName = 'Giao hàng (SHIPPED)';
    if (newStatus === 'DELIVERED') actionName = 'Hoàn tất đơn hàng (DELIVERED)';
    if (newStatus === 'CANCELLED') actionName = 'Hủy đơn hàng (CANCELLED)';

    if (!window.confirm(`Bạn có chắc muốn thực hiện: "${actionName}" cho đơn #${orderId}?`)) {
      return;
    }

    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setActionSuccess(`✅ Đã chuyển trạng thái đơn #${orderId} sang ${newStatus} thành công!`);
      setSelectedOrder(updated);
      loadOrders();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Lỗi cập nhật trạng thái đơn!';
      setActionError(message);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '700',
      whiteSpace: 'nowrap'
    };

    switch (s) {
      case 'PENDING':
        return <span style={{ ...baseStyle, backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>⏳ Chờ xác nhận</span>;
      case 'PROCESSING':
        return <span style={{ ...baseStyle, backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>⚙️ Đang xử lý</span>;
      case 'SHIPPED':
        return <span style={{ ...baseStyle, backgroundColor: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff' }}>🚚 Đang giao</span>;
      case 'DELIVERED':
        return <span style={{ ...baseStyle, backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>🏁 Hoàn tất</span>;
      case 'CANCELLED':
        return <span style={{ ...baseStyle, backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>❌ Đã hủy</span>;
      default:
        return <span style={{ ...baseStyle, backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb' }}>{status}</span>;
    }
  };

  const countPending = orders.filter(o => o.orderStatus === 'PENDING').length;
  const countProcessing = orders.filter(o => o.orderStatus === 'PROCESSING').length;
  const countShipped = orders.filter(o => o.orderStatus === 'SHIPPED').length;
  const countDelivered = orders.filter(o => o.orderStatus === 'DELIVERED').length;

  return (
    <main>
      <Header
        title="Quản Lý & Xử Lý Đơn Hàng (Staff Orders)"
        subtitle="Quy trình xử lý đơn hàng: PENDING → PROCESSING (Kiểm tra & Trừ kho) → SHIPPED → DELIVERED hoặc HỦY ĐƠN"
        isLive={isLive}
        onRefresh={loadOrders}
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#eab308' }}>⏳</div>
          <div>
            <div className="stat-val">{countPending}</div>
            <div className="stat-label">Chờ Xác Nhận (PENDING)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#3b82f6' }}>⚙️</div>
          <div>
            <div className="stat-val">{countProcessing}</div>
            <div className="stat-label">Đang Xử Lý (PROCESSING)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#a855f7' }}>🚚</div>
          <div>
            <div className="stat-val">{countShipped}</div>
            <div className="stat-label">Đang Giao Hàng (SHIPPED)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#10b981' }}>🏁</div>
          <div>
            <div className="stat-val">{countDelivered}</div>
            <div className="stat-label">Giao Thành Công (DELIVERED)</div>
          </div>
        </div>
      </div>

      <div className="toolbar-card">
        <div className="filter-group">
          <input
            type="text"
            className="input-control"
            placeholder="Tìm theo mã đơn #, tên khách, SĐT, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả Trạng Thái ({orders.length})</option>
            <option value="PENDING">PENDING (Chờ xác nhận)</option>
            <option value="PROCESSING">PROCESSING (Đang xử lý)</option>
            <option value="SHIPPED">SHIPPED (Đang giao)</option>
            <option value="DELIVERED">DELIVERED (Giao thành công)</option>
            <option value="CANCELLED">CANCELLED (Đã hủy)</option>
          </select>
        </div>
      </div>

      {/* Action Global Error / Success Alert */}
      {actionError && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: '#fca5a5',
          padding: '12px 18px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div><strong>⚠️ Không thể thực hiện:</strong> {actionError}</div>
          <button style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }} onClick={() => setActionError('')}>✖</button>
        </div>
      )}

      {actionSuccess && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          color: '#6ee7b7',
          padding: '12px 18px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>{actionSuccess}</div>
          <button style={{ background: 'none', border: 'none', color: '#6ee7b7', cursor: 'pointer' }} onClick={() => setActionSuccess('')}>✖</button>
        </div>
      )}

      <div className="panel-card">
        <div className="table-responsive">
          <table style={{ minWidth: '1020px', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '100px', whiteSpace: 'nowrap' }}>Mã Đơn</th>
                <th style={{ minWidth: '170px', whiteSpace: 'nowrap' }}>Khách Hàng / SĐT</th>
                <th style={{ minWidth: '240px', maxWidth: '320px', whiteSpace: 'nowrap' }}>Địa Chỉ Nhận Hàng</th>
                <th style={{ width: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Số Lượng</th>
                <th style={{ width: '140px', textAlign: 'right', whiteSpace: 'nowrap' }}>Tổng Tiền</th>
                <th style={{ width: '140px', textAlign: 'center', whiteSpace: 'nowrap' }}>Trạng Thái</th>
                <th style={{ width: '110px', whiteSpace: 'nowrap' }}>Thời Gian</th>
                <th style={{ width: '130px', textAlign: 'center', whiteSpace: 'nowrap' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                orders.map(o => {
                  const status = (o.orderStatus || '').toUpperCase();
                  const canConfirm = status === 'PENDING';
                  const canShip = status === 'PROCESSING';
                  const canCancel = status === 'PENDING' || status === 'PROCESSING';

                  return (
                    <tr key={o.orderId}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          fontFamily: 'monospace',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          border: '1px solid #dbeafe',
                          whiteSpace: 'nowrap'
                        }}>
                          #ORD-{o.orderId}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main, #111827)', whiteSpace: 'nowrap' }}>
                          {o.customerName || 'Khách vãng lai'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #6b7280)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                          {o.customerPhone ? o.customerPhone : (o.customerEmail || 'Chưa có SĐT')}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            maxWidth: '300px',
                            fontSize: '0.85rem',
                            lineHeight: 1.45,
                            color: 'var(--text-main, #374151)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={o.shippingAddress}
                        >
                          {o.shippingAddress || 'Chưa cung cấp địa chỉ'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span
                          className="role-tag role-staff"
                          style={{
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px 10px',
                            fontWeight: 700,
                            fontSize: '0.78rem'
                          }}
                        >
                          {o.itemCount || 1} MÓN
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <strong style={{ color: '#111827', fontSize: '0.95rem', fontWeight: 800 }}>
                          {formatCurrency(o.totalAmount)}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {getStatusBadge(o.orderStatus)}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {(() => {
                          const { time, date } = formatDateTime(o.createdAt);
                          return (
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>{time}</div>
                              <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{date}</div>
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div className="action-buttons" style={{ flexWrap: 'nowrap', justifyContent: 'center' }}>
                          <button
                            className="btn-action"
                            style={{
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              color: '#2563eb',
                              borderColor: 'rgba(59, 130, 246, 0.3)',
                              whiteSpace: 'nowrap',
                              padding: '5px 10px'
                            }}
                            onClick={() => handleOpenDetail(o.orderId)}
                            title="Xem chi tiết các sản phẩm và xử lý đơn"
                          >
                            👁️ Chi tiết
                          </button>

                          {/* Quick Workflow Action */}
                          {canConfirm && (
                            <button
                              className="btn-action"
                              style={{
                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                color: '#059669',
                                borderColor: 'rgba(16, 185, 129, 0.35)',
                                whiteSpace: 'nowrap',
                                padding: '5px 10px'
                              }}
                              onClick={() => handleUpdateStatus(o.orderId, 'PROCESSING')}
                              title="Xác nhận đơn hàng và trừ tồn kho biến thể"
                            >
                              ✅ Xác nhận
                            </button>
                          )}

                          {canShip && (
                            <button
                              className="btn-action"
                              style={{
                                backgroundColor: 'rgba(168, 85, 247, 0.12)',
                                color: '#7e22ce',
                                borderColor: 'rgba(168, 85, 247, 0.35)',
                                whiteSpace: 'nowrap',
                                padding: '5px 10px'
                              }}
                              onClick={() => handleUpdateStatus(o.orderId, 'SHIPPED')}
                              title="Chuyển sang giao hàng (SHIPPED)"
                            >
                              🚚 Gửi hàng
                            </button>
                          )}

                          {canCancel && (
                            <button
                              className="btn-action btn-lock"
                              style={{
                                borderColor: 'rgba(239, 68, 68, 0.35)',
                                color: '#dc2626',
                                whiteSpace: 'nowrap',
                                padding: '5px 8px'
                              }}
                              onClick={() => handleUpdateStatus(o.orderId, 'CANCELLED')}
                              title="Hủy đơn hàng (Cộng lại kho nếu đã xử lý)"
                            >
                              ❌ Hủy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View Order Detail & Process */}
      <Modal
        isOpen={isDetailOpen}
        size="xl"
        title={selectedOrder ? `Chi Tiết Đơn Hàng #ORD-${selectedOrder.orderId}` : "Chi Tiết Đơn Hàng"}
        onClose={() => setIsDetailOpen(false)}
      >
        {loadingDetail ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Đang tải chi tiết đơn hàng...
          </div>
        ) : selectedOrder ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {actionError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.875rem',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                ⚠️ <strong>Không thể thực hiện:</strong> {actionError}
              </div>
            )}

            {actionSuccess && (
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#6ee7b7',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.875rem',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                {actionSuccess}
              </div>
            )}

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>THÔNG TIN NGƯỜI NHẬN</div>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main, #111827)', marginBottom: '4px' }}>{selectedOrder.recipientName || selectedOrder.customerName}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2px' }}>📞 {selectedOrder.recipientPhone || selectedOrder.customerPhone || 'Chưa có SĐT'}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>✉️ {selectedOrder.customerEmail}</div>
                <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.4' }}>📍 {selectedOrder.shippingAddress}</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>TRẠNG THÁI & THANH TOÁN</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Trạng thái đơn:</span> {getStatusBadge(selectedOrder.orderStatus)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Thanh toán: <strong style={{ color: selectedOrder.paymentStatus === 'PAID' ? '#10b981' : '#f59e0b' }}>
                    {selectedOrder.paymentStatus === 'PAID' ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán (COD)'}
                  </strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Ngày đặt: {formatDate(selectedOrder.createdAt)}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>
                  Tổng tiền: {formatCurrency(selectedOrder.totalAmount)}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-main, #111827)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Danh sách sản phẩm trong đơn ({selectedOrder.items ? selectedOrder.items.length : 0})</span>
              </div>
              <div className="table-responsive" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ minWidth: '180px' }}>Sản Phẩm</th>
                      <th>Biến Thể</th>
                      <th>Mã SKU</th>
                      <th>Tồn Kho</th>
                      <th>SL Mua</th>
                      <th>Đơn Giá</th>
                      <th>Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.map(item => {
                      const isPending = selectedOrder.orderStatus === 'PENDING';
                      const isOutOfStock = isPending && (item.currentStockQuantity || 0) < item.quantity;

                      return (
                        <tr key={item.orderItemId || item.variantId}>
                          <td>
                            <strong style={{ color: 'var(--text-main, #111827)' }}>{item.productName}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mã SP: #{item.productId}</div>
                          </td>
                          <td>
                            <span className="role-tag role-staff">
                              {item.size || 'N/A'} - {item.color || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace', color: '#60a5fa', fontSize: '0.85rem' }}>{item.sku || 'N/A'}</span>
                          </td>
                          <td>
                            <strong style={{ color: isOutOfStock ? '#ef4444' : '#10b981' }}>
                              {item.currentStockQuantity !== undefined ? item.currentStockQuantity : 'N/A'}
                            </strong>
                            {isOutOfStock && (
                              <div style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 600 }}>⚠️ Thiếu hàng!</div>
                            )}
                          </td>
                          <td>
                            <strong style={{ fontSize: '0.95rem' }}>x{item.quantity}</strong>
                          </td>
                          <td>{formatCurrency(item.priceAtPurchase)}</td>
                          <td>
                            <strong style={{ color: 'var(--text-main, #111827)' }}>{formatCurrency(item.subtotal || item.priceAtPurchase * item.quantity)}</strong>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Workflow Action Buttons */}
            <div className="modal-footer" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div>
                {(selectedOrder.orderStatus === 'PENDING' || selectedOrder.orderStatus === 'PROCESSING') && (
                  <button
                    type="button"
                    className="btn-action btn-lock"
                    style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '9px 18px', fontWeight: 600 }}
                    onClick={() => handleUpdateStatus(selectedOrder.orderId, 'CANCELLED')}
                  >
                    ❌ Hủy Đơn Hàng
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-cancel"
                  style={{ padding: '9px 18px' }}
                  onClick={() => setIsDetailOpen(false)}
                >
                  Đóng
                </button>

                {selectedOrder.orderStatus === 'PENDING' && (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ backgroundColor: '#10b981', borderColor: '#10b981', padding: '9px 20px', fontWeight: 600 }}
                    onClick={() => handleUpdateStatus(selectedOrder.orderId, 'PROCESSING')}
                  >
                    ✅ Xác Nhận Đơn (Trừ Tồn Kho)
                  </button>
                )}

                {selectedOrder.orderStatus === 'PROCESSING' && (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', padding: '9px 20px', fontWeight: 600 }}
                    onClick={() => handleUpdateStatus(selectedOrder.orderId, 'SHIPPED')}
                  >
                    🚚 Bắt Đầu Giao Hàng (SHIPPED)
                  </button>
                )}

                {selectedOrder.orderStatus === 'SHIPPED' && (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ backgroundColor: '#10b981', borderColor: '#10b981', padding: '9px 20px', fontWeight: 600 }}
                    onClick={() => handleUpdateStatus(selectedOrder.orderId, 'DELIVERED')}
                  >
                    🏁 Xác Nhận Đã Giao (DELIVERED)
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </main>
  );
}
