import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import {
  getStaffOrders,
  getStaffOrderDetail,
  updateOrderStatus,
  createStaffReturn,
  markOrderRTO,
  approveReturn,
  rejectReturn
} from '../services/orderService';

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

  // Staff Return / Refund Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnOrder, setReturnOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('Khách thử không vừa size / chật rộng');
  const [customReason, setCustomReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [restock, setRestock] = useState(true);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Return Request modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [returningOrderId, setReturningOrderId] = useState(null);

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

  const handleApproveReturn = async (orderId) => {
    setActionError('');
    setActionSuccess('');
    if (!window.confirm(`Bạn có chắc muốn DUYỆT yêu cầu trả hàng & hoàn tiền cho đơn #${orderId}?`)) return;
    try {
      const updated = await approveReturn(orderId);
      setActionSuccess(`✅ Đã duyệt hoàn tiền cho đơn #${orderId} thành công!`);
      setSelectedOrder(updated);
      loadOrders();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Lỗi khi duyệt hoàn tiền!';
      setActionError(message);
    }
  };

  const handleOpenRejectModal = (orderId) => {
    setReturningOrderId(orderId);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    setActionError('');
    setActionSuccess('');
    try {
      const updated = await rejectReturn(returningOrderId, rejectReason || 'Không đủ điều kiện hoàn trả');
      setActionSuccess(`❌ Đã từ chối hoàn tiền cho đơn #${returningOrderId}.`);
      setIsRejectModalOpen(false);
      setSelectedOrder(updated);
      loadOrders();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Lỗi khi từ chối hoàn tiền!';
      setActionError(message);
      setIsRejectModalOpen(false);
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
    if (newStatus === 'RETURNED') actionName = 'Hoàn hàng về kho (RETURNED)';

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

  // Handler: Bưu tá giao thất bại & hoàn về kho (RTO)
  const handleMarkRTO = async (orderId) => {
    const note = window.prompt(
      `Xác nhận bưu tá giao thất bại & hoàn hàng về kho cho đơn #ORD-${orderId}?\nNhập ghi chú kiểm tra kiện hàng (VD: Giao không thành công 3 lần, hàng hoàn về còn nguyên tem):`,
      'Bưu tá giao hàng thất bại, trả hàng về kho shop'
    );
    if (note === null) return;

    try {
      setActionError('');
      setActionSuccess('');
      const updated = await markOrderRTO(orderId, note);
      setActionSuccess(`✅ Đã tiếp nhận đơn hàng #ORD-${orderId} hoàn về kho (RTO) thành công! Tồn kho các sản phẩm đã được tự động hoàn lại.`);
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder(updated);
      }
      loadOrders();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Lỗi khi ghi nhận hàng hoàn RTO!';
      setActionError(message);
    }
  };

  // Handler: Mở modal hoàn hàng cho đơn DELIVERED
  const handleOpenReturnModal = (order) => {
    setReturnOrder(order);
    setReturnReason('Khách thử không vừa size / chật rộng');
    setCustomReason('');
    setRefundAmount(order.totalAmount || 0);
    setBankName('');
    setBankAccount('');
    setAccountHolder(order.recipientName || order.customerName || '');
    setAdminNote('Kiểm tra hàng nguyên tem mác, bao bì còn tốt.');
    setRestock(true);
    setIsReturnModalOpen(true);
  };

  // Handler: Xác nhận tạo phiếu hoàn hàng & hoàn kho
  const handleConfirmReturn = async (e) => {
    e.preventDefault();
    if (!returnOrder) return;

    const finalReason = returnReason === 'Khác' && customReason.trim()
      ? customReason.trim()
      : returnReason;

    const refund = Number(refundAmount) || 0;
    if (refund < 0) {
      alert('Số tiền hoàn trả không được âm!');
      return;
    }
    const maxRefund = Number(returnOrder.totalAmount) || 0;
    if (refund > maxRefund) {
      alert(`Số tiền hoàn trả (${refund.toLocaleString('vi-VN')} đ) không được vượt quá giá trị đơn hàng (${maxRefund.toLocaleString('vi-VN')} đ)!`);
      return;
    }

    const cleanBankAcc = bankAccount.trim();
    if (cleanBankAcc && !/^[0-9]{6,25}$/.test(cleanBankAcc)) {
      alert('Số tài khoản ngân hàng phải gồm từ 6 đến 25 chữ số!');
      return;
    }

    setSubmittingReturn(true);
    try {
      const payload = {
        reason: finalReason,
        refundAmount: refund,
        bankName: bankName.trim(),
        bankAccount: cleanBankAcc,
        accountHolder: accountHolder.trim().toUpperCase(),
        adminNote: adminNote.trim(),
        restock: restock
      };

      const updated = await createStaffReturn(returnOrder.orderId, payload);
      setActionSuccess(`✅ Đã tạo phiếu hoàn hàng cho đơn #ORD-${returnOrder.orderId} thành công! ${restock ? 'Sản phẩm đã được nhập lại vào kho hàng.' : ''}`);
      setIsReturnModalOpen(false);
      if (selectedOrder && selectedOrder.orderId === returnOrder.orderId) {
        setSelectedOrder(updated);
      }
      loadOrders();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Lỗi khi xử lý phiếu hoàn hàng!';
      alert('Không thể tạo phiếu hoàn: ' + message);
    } finally {
      setSubmittingReturn(false);
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
      case 'RETURNED':
        return <span style={{ ...baseStyle, backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>↩️ Đã hoàn hàng</span>;
      case 'CANCELLED':
        return <span style={{ ...baseStyle, backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>❌ Đã hủy</span>;
      default:
        return <span style={{ ...baseStyle, backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb' }}>{status}</span>;
    }
  };

  const countPending = orders.filter(o => (o.orderStatus || '').toUpperCase() === 'PENDING').length;
  const countProcessing = orders.filter(o => (o.orderStatus || '').toUpperCase() === 'PROCESSING').length;
  const countShipped = orders.filter(o => (o.orderStatus || '').toUpperCase() === 'SHIPPED').length;
  const countDelivered = orders.filter(o => (o.orderStatus || '').toUpperCase() === 'DELIVERED').length;
  const countReturned = orders.filter(o => (o.orderStatus || '').toUpperCase() === 'RETURNED').length;
  const countReturnPending = orders.filter(o => (o.returnStatus || '').toLowerCase() === 'pending').length;

  return (
    <main>
      <Header
        title="Quản Lý & Xử Lý Đơn Hàng (Staff Orders)"
        subtitle="Quy trình xử lý đơn hàng: PENDING → PROCESSING (Kiểm tra & Trừ kho) → SHIPPED → DELIVERED hoặc HỦY ĐƠN"
        isLive={isLive}
        onRefresh={loadOrders}
      />

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
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
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#ea580c' }}>↩️</div>
          <div>
            <div className="stat-val">{countReturned}</div>
            <div className="stat-label">Đã Hoàn Hàng (RETURNED)</div>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', border: countReturnPending > 0 ? '2px solid #f59e0b' : undefined }} onClick={() => setStatusFilter(statusFilter === 'RETURN_PENDING' ? '' : 'RETURN_PENDING')}>
          <div className="stat-icon" style={{ color: '#f59e0b' }}>🔄</div>
          <div>
            <div className="stat-val" style={{ color: countReturnPending > 0 ? '#f59e0b' : undefined }}>{countReturnPending}</div>
            <div className="stat-label">Chờ Duyệt Hoàn Tiền</div>
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
            <option value="RETURNED">RETURNED (Đã hoàn hàng / hoàn kho)</option>
            <option value="CANCELLED">CANCELLED (Đã hủy)</option>
            <option value="RETURN_PENDING">🔄 Chờ Duyệt Hoàn Tiền</option>
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

      <div className="panel-card" style={{ padding: '18px' }}>
        <div className="table-responsive">
          <table style={{ minWidth: '820px', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '85px', padding: '10px 8px', whiteSpace: 'nowrap' }}>Mã Đơn</th>
                <th style={{ minWidth: '125px', padding: '10px 8px', whiteSpace: 'nowrap' }}>Khách Hàng / SĐT</th>
                <th style={{ minWidth: '130px', maxWidth: '200px', padding: '10px 8px' }}>Địa Chỉ Nhận Hàng</th>
                <th style={{ width: '65px', padding: '10px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>SL</th>
                <th style={{ width: '105px', padding: '10px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>Tổng Tiền</th>
                <th style={{ width: '115px', padding: '10px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>Trạng Thái</th>
                <th style={{ width: '85px', padding: '10px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>Thời Gian</th>
                <th style={{ width: '140px', padding: '10px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>Thao Tác</th>
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
                  const canRTO = status === 'SHIPPED';
                  const canReturn = status === 'DELIVERED';
                  const hasReturnPending = o.returnStatus === 'pending';

                  return (
                    <tr key={o.orderId}>
                      <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 7px',
                          borderRadius: '6px',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          fontFamily: 'monospace',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          border: '1px solid #dbeafe',
                          whiteSpace: 'nowrap'
                        }}>
                          #ORD-{o.orderId}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main, #111827)', whiteSpace: 'nowrap' }}>
                          {o.customerName || 'Khách vãng lai'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #6b7280)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                          {o.customerPhone ? o.customerPhone : (o.customerEmail || 'Chưa có SĐT')}
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <div
                          style={{
                            maxWidth: '200px',
                            fontSize: '0.82rem',
                            lineHeight: 1.4,
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
                      <td style={{ padding: '10px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span
                          className="role-tag role-staff"
                          style={{
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '3px 7px',
                            fontWeight: 700,
                            fontSize: '0.72rem'
                          }}
                        >
                          {o.itemCount || 1} MÓN
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <strong style={{ color: '#111827', fontSize: '0.88rem', fontWeight: 800 }}>
                          {formatCurrency(o.totalAmount)}
                        </strong>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {getStatusBadge(o.orderStatus)}
                        {o.returnStatus === 'pending' && (
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #fde68a' }}>
                              🔄 Chờ duyệt hoàn tiền
                            </span>
                          </div>
                        )}
                        {o.returnStatus === 'approved' && (
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #a7f3d0' }}>
                              ✅ Đã hoàn tiền
                            </span>
                          </div>
                        )}
                        {o.returnStatus === 'rejected' && (
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #fecaca' }}>
                              ❌ Từ chối hoàn tiền
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {(() => {
                          const { time, date } = formatDateTime(o.createdAt);
                          return (
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>{time}</div>
                              <div style={{ fontSize: '0.74rem', color: '#6b7280' }}>{date}</div>
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div className="action-buttons" style={{ display: 'inline-flex', gap: '4px', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center' }}>
                          <button
                            className="btn-action"
                            style={{
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              color: '#2563eb',
                              borderColor: 'rgba(59, 130, 246, 0.3)',
                              whiteSpace: 'nowrap',
                              padding: '4px 7px',
                              fontSize: '0.78rem'
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
                                padding: '4px 7px',
                                fontSize: '0.78rem'
                              }}
                              onClick={() => handleUpdateStatus(o.orderId, 'PROCESSING')}
                              title="Xác nhận đơn hàng và trừ tồn kho biến thể"
                            >
                              ✅ Duyệt
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
                                padding: '4px 7px',
                                fontSize: '0.78rem'
                              }}
                              onClick={() => handleUpdateStatus(o.orderId, 'SHIPPED')}
                              title="Chuyển sang giao hàng (SHIPPED)"
                            >
                              🚚 Gửi
                            </button>
                          )}

                          {canRTO && (
                            <button
                              className="btn-action"
                              style={{
                                backgroundColor: 'rgba(234, 88, 12, 0.12)',
                                color: '#c2410c',
                                borderColor: 'rgba(234, 88, 12, 0.35)',
                                whiteSpace: 'nowrap',
                                padding: '4px 7px',
                                fontSize: '0.78rem'
                              }}
                              onClick={() => handleMarkRTO(o.orderId)}
                              title="Giao thất bại / Bưu tá hoàn hàng về kho (Cộng lại tồn kho)"
                            >
                              📦 RTO
                            </button>
                          )}

                          {canReturn && (
                            <button
                              className="btn-action"
                              style={{
                                backgroundColor: 'rgba(234, 88, 12, 0.12)',
                                color: '#c2410c',
                                borderColor: 'rgba(234, 88, 12, 0.35)',
                                whiteSpace: 'nowrap',
                                padding: '4px 7px',
                                fontSize: '0.78rem'
                              }}
                              onClick={() => handleOpenReturnModal(o)}
                              title="Tiếp nhận khách gửi trả lại hàng về kho"
                            >
                              ↩️ Hoàn
                            </button>
                          )}

                          {canCancel && (
                            <button
                              className="btn-action btn-lock"
                              style={{
                                borderColor: 'rgba(239, 68, 68, 0.35)',
                                color: '#dc2626',
                                whiteSpace: 'nowrap',
                                padding: '4px 6px',
                                fontSize: '0.78rem'
                              }}
                              onClick={() => handleUpdateStatus(o.orderId, 'CANCELLED')}
                              title="Hủy đơn hàng (Cộng lại kho nếu đã xử lý)"
                            >
                              ❌ Hủy
                            </button>
                          )}

                          {hasReturnPending && (
                            <>
                              <button
                                className="btn-action"
                                style={{
                                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                  color: '#047857',
                                  borderColor: 'rgba(16, 185, 129, 0.35)',
                                  whiteSpace: 'nowrap',
                                  padding: '5px 8px',
                                  fontWeight: 700
                                }}
                                onClick={() => { handleOpenDetail(o.orderId); }}
                                title="Duyệt yêu cầu hoàn tiền"
                              >
                                🔄 Duyệt HT
                              </button>
                            </>
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
                  Thanh toán: <strong style={{ color: selectedOrder.paymentStatus === 'PAID' ? '#10b981' : selectedOrder.paymentStatus === 'REFUNDED' ? '#c2410c' : '#f59e0b' }}>
                    {selectedOrder.paymentStatus === 'PAID' ? '✅ Đã thanh toán' : selectedOrder.paymentStatus === 'REFUNDED' ? '↩️ Đã hoàn tiền' : '⏳ Chưa thanh toán (COD)'}
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

            {/* Thông tin hoàn hàng nếu đơn ở trạng thái RETURNED */}
            {selectedOrder.orderStatus === 'RETURNED' && (
              <div style={{
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                padding: '16px 20px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c2410c', fontWeight: 800, fontSize: '0.95rem' }}>
                    <span>📦 THÔNG TIN HOÀN HÀNG & HOÀN TIỀN</span>
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#fed7aa', color: '#9a3412', padding: '2px 8px', borderRadius: '12px' }}>
                      {selectedOrder.returnRequest?.status ? selectedOrder.returnRequest.status.toUpperCase() : 'COMPLETED'}
                    </span>
                  </div>
                  {selectedOrder.returnRequest?.createdAt && (
                    <span style={{ fontSize: '0.8rem', color: '#9a3412' }}>
                      Thời gian: {formatDate(selectedOrder.returnRequest.createdAt)}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ color: '#9a3412', fontWeight: 600 }}>Lý do hoàn trả: </span>
                    <span style={{ color: '#111827', fontWeight: 700 }}>
                      {selectedOrder.returnRequest?.reason || 'Bưu tá hoàn hàng về kho / Khách gửi trả'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#9a3412', fontWeight: 600 }}>Số tiền hoàn lại: </span>
                    <strong style={{ color: '#dc2626', fontSize: '1rem' }}>
                      {formatCurrency(selectedOrder.returnRequest?.refundAmount != null ? selectedOrder.returnRequest.refundAmount : selectedOrder.totalAmount)}
                    </strong>
                  </div>
                  {selectedOrder.returnRequest?.bankAccount && (
                    <div style={{ gridColumn: '1 / -1', backgroundColor: '#fff', padding: '10px 14px', borderRadius: '6px', border: '1px dashed #fdba74' }}>
                      <div style={{ color: '#9a3412', fontWeight: 700, marginBottom: '4px' }}>🏦 Tài khoản nhận hoàn tiền:</div>
                      <div>Ngân hàng: <strong>{selectedOrder.returnRequest.bankName || 'N/A'}</strong></div>
                      <div>Số tài khoản: <strong style={{ fontFamily: 'monospace', color: '#2563eb' }}>{selectedOrder.returnRequest.bankAccount}</strong></div>
                      <div>Chủ tài khoản: <strong>{selectedOrder.returnRequest.accountHolder || 'N/A'}</strong></div>
                    </div>
                  )}
                  {selectedOrder.returnRequest?.adminNote && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: '#9a3412', fontWeight: 600 }}>Ghi chú nhân viên kho: </span>
                      <span style={{ color: '#374151', fontStyle: 'italic' }}>{selectedOrder.returnRequest.adminNote}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

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

            {/* Return Request Info & Actions */}
            {selectedOrder.returnStatus && (
              <div style={{ marginBottom: '20px', padding: '14px 18px', borderRadius: '10px', border: '1.5px solid #fde68a', backgroundColor: '#fffbeb' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400e', marginBottom: '8px' }}>
                  🔄 Yêu cầu trả hàng & hoàn tiền
                </div>
                <div style={{ fontSize: '0.85rem', color: '#78350f', marginBottom: '4px' }}>
                  <strong>Trạng thái:</strong>{' '}
                  {selectedOrder.returnStatus === 'pending' && <span style={{ color: '#b45309', fontWeight: 700 }}>⏳ Đang chờ duyệt</span>}
                  {selectedOrder.returnStatus === 'approved' && <span style={{ color: '#047857', fontWeight: 700 }}>✅ Đã duyệt</span>}
                  {selectedOrder.returnStatus === 'rejected' && <span style={{ color: '#b91c1c', fontWeight: 700 }}>❌ Đã từ chối</span>}
                </div>
                {selectedOrder.returnReason && (
                  <div style={{ fontSize: '0.85rem', color: '#78350f', marginBottom: '4px' }}>
                    <strong>Lý do khách hàng:</strong> {selectedOrder.returnReason}
                  </div>
                )}
                {selectedOrder.refundAmount != null && (
                  <div style={{ fontSize: '0.85rem', color: '#78350f', marginBottom: '8px' }}>
                    <strong>Số tiền hoàn:</strong> {formatCurrency(selectedOrder.refundAmount)}
                  </div>
                )}
                {selectedOrder.returnStatus === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ backgroundColor: '#10b981', borderColor: '#10b981', padding: '8px 18px', fontWeight: 700 }}
                      onClick={() => handleApproveReturn(selectedOrder.orderId)}
                    >
                      ✅ Duyệt hoàn tiền
                    </button>
                    <button
                      type="button"
                      className="btn-action btn-lock"
                      style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#dc2626', padding: '8px 18px', fontWeight: 700 }}
                      onClick={() => handleOpenRejectModal(selectedOrder.orderId)}
                    >
                      ❌ Từ chối
                    </button>
                  </div>
                )}
              </div>
            )}

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
                  <>
                    <button
                      type="button"
                      className="btn-action"
                      style={{ backgroundColor: 'rgba(234, 88, 12, 0.12)', color: '#c2410c', borderColor: 'rgba(234, 88, 12, 0.35)', padding: '9px 18px', fontWeight: 600 }}
                      onClick={() => handleMarkRTO(selectedOrder.orderId)}
                    >
                      📦 Bưu Tá Hoàn Về Kho (RTO)
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ backgroundColor: '#10b981', borderColor: '#10b981', padding: '9px 20px', fontWeight: 600 }}
                      onClick={() => handleUpdateStatus(selectedOrder.orderId, 'DELIVERED')}
                    >
                      🏁 Xác Nhận Đã Giao (DELIVERED)
                    </button>
                  </>
                )}

                {selectedOrder.orderStatus === 'DELIVERED' && (
                  <button
                    type="button"
                    className="btn-action"
                    style={{ backgroundColor: 'rgba(234, 88, 12, 0.12)', color: '#c2410c', borderColor: 'rgba(234, 88, 12, 0.35)', padding: '9px 18px', fontWeight: 600 }}
                    onClick={() => handleOpenReturnModal(selectedOrder)}
                  >
                    ↩️ Tiếp Nhận Hoàn Hàng & Nhập Kho
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Modal Tiếp Nhận Hoàn Hàng Cho Staff */}
      <Modal
        isOpen={isReturnModalOpen}
        size="md"
        title={returnOrder ? `Tạo Phiếu Hoàn Hàng #ORD-${returnOrder.orderId}` : "Tạo Phiếu Hoàn Hàng"}
        onClose={() => setIsReturnModalOpen(false)}
      >
        {returnOrder && (
          <form onSubmit={handleConfirmReturn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem'
            }}>
              <div>Đơn hàng: <strong>#ORD-{returnOrder.orderId}</strong> | Khách: <strong>{returnOrder.recipientName || returnOrder.customerName}</strong></div>
              <div>Tổng giá trị ban đầu: <strong style={{ color: '#059669' }}>{formatCurrency(returnOrder.totalAmount)}</strong></div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Lý do hoàn hàng <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                className="select-control"
                style={{ width: '100%', marginBottom: returnReason === 'Khác' ? '8px' : '0' }}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
              >
                <option value="Khách thử không vừa size / chật rộng">Khách thử không vừa size / chật rộng</option>
                <option value="Sản phẩm lỗi đường may / vải / rách">Sản phẩm lỗi đường may / vải / rách</option>
                <option value="Khách đổi ý không muốn nhận / không ưng mẫu">Khách đổi ý không muốn nhận / không ưng mẫu</option>
                <option value="Giao nhầm màu / nhầm size / nhầm mã SP">Giao nhầm màu / nhầm size / nhầm mã SP</option>
                <option value="Khách hàng liên hệ gửi trả lại kiện hàng">Khách hàng liên hệ gửi trả lại kiện hàng</option>
                <option value="Khác">Lý do khác (tự nhập)...</option>
              </select>

              {returnReason === 'Khác' && (
                <input
                  type="text"
                  className="input-control"
                  style={{ width: '100%' }}
                  placeholder="Nhập lý do cụ thể..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  required
                />
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Số tiền hoàn lại cho khách (VNĐ) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                className="input-control"
                style={{ width: '100%' }}
                value={refundAmount}
                min="0"
                max={returnOrder.totalAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                required
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Tương đương: {formatCurrency(refundAmount)} (có thể điều chỉnh nếu khấu trừ phí ship)
              </div>
            </div>

            <div style={{
              backgroundColor: '#f1f5f9',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                🏦 Thông Tin Ngân Hàng Hoàn Tiền (Chuyển khoản)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Tên Ngân Hàng</label>
                  <input
                    type="text"
                    className="input-control"
                    style={{ width: '100%' }}
                    placeholder="VD: MBBank, Vietcombank..."
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Số Tài Khoản</label>
                  <input
                    type="text"
                    className="input-control"
                    style={{ width: '100%' }}
                    placeholder="VD: 0987654321"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Tên Chủ Tài Khoản</label>
                <input
                  type="text"
                  className="input-control"
                  style={{ width: '100%' }}
                  placeholder="VD: NGUYEN VAN A"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="restockCheck"
                checked={restock}
                onChange={(e) => setRestock(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="restockCheck" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                📦 Nhập lại sản phẩm vào kho hàng (Cộng lại tồn kho biến thể & lô hàng)
              </label>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Ghi chú của nhân viên kiểm tra hàng
              </label>
              <textarea
                className="input-control"
                style={{ width: '100%', minHeight: '60px' }}
                placeholder="VD: Đã kiểm tra kiện hàng, tem mác đầy đủ, sản phẩm còn mới..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setIsReturnModalOpen(false)}
                disabled={submittingReturn}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}
                disabled={submittingReturn}
              >
                {submittingReturn ? 'Đang xử lý...' : 'Xác Nhận Hoàn Hàng & Hoàn Kho'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Từ Chối Hoàn Tiền */}
      {isRejectModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 40px -8px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
              ❌ Từ chối yêu cầu hoàn tiền #{returningOrderId}
            </h3>
            <p style={{ margin: '0 0 14px 0', color: '#475569', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Vui lòng nhập lý do từ chối để thông báo đến khách hàng.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Sản phẩm đã qua sử dụng, không đáp ứng điều kiện hoàn trả..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#1e293b', resize: 'vertical', boxSizing: 'border-box', marginBottom: '18px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                style={{ padding: '9px 18px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                style={{ padding: '9px 20px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' }}
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
