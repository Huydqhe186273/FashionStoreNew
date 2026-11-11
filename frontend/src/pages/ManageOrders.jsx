
// Helper chuẩn hóa mã ngân hàng VietQR
const getVietQrBankCode = (bankName) => {
  if (!bankName) return 'MB';
  const b = bankName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (b.includes('mbbank') || b.includes('quan doi') || b === 'mb') return 'MB';
  if (b.includes('vietcombank') || b.includes('vcb') || b.includes('ngoai thuong')) return 'VCB';
  if (b.includes('techcombank') || b.includes('tcb')) return 'TCB';
  if (b.includes('vietinbank') || b.includes('icb') || b.includes('cong thuong')) return 'ICB';
  if (b.includes('bidv') || b.includes('dau tu')) return 'BIDV';
  if (b.includes('tpbank') || b.includes('tpb') || b.includes('tien phong')) return 'TPB';
  if (b.includes('vpbank') || b.includes('vpb')) return 'VPB';
  if (b.includes('acb') || b.includes('a chau')) return 'ACB';
  if (b.includes('sacombank') || b.includes('stb')) return 'STB';
  if (b.includes('hdbank') || b.includes('hdb')) return 'HDB';
  if (b.includes('ocb')) return 'OCB';
  if (b.includes('shb')) return 'SHB';
  if (b.includes('msb') || b.includes('hang hai')) return 'MSB';
  if (b.includes('vib')) return 'VIB';
  return bankName.trim().split(' ')[0].toUpperCase();
};
import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import {
  Clock,
  Package,
  Truck,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  CreditCard,
  Banknote,
  Eye,
  AlertCircle,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Copy,
  X,
  XCircle,
  Check,
  Zap,
  QrCode,
  FileText,
  Building2,
  Ban,
  Camera
} from 'lucide-react';
import {
  getStaffOrders,
  getStaffOrderDetail,
  updateOrderStatus,
  createStaffReturn,
  markOrderRTO,
  approveReturn,
  rejectReturn,
  acceptReturnRequest,
  receiveReturnedGoods,
  processRefund
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

  // Staff Return / Refund State
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Return Request modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveRefundModalOpen, setIsApproveRefundModalOpen] = useState(false);
  const [refundModalOrder, setRefundModalOrder] = useState(null);
  const [approvingRefund, setApprovingRefund] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [returningOrderId, setReturningOrderId] = useState(null);
  const [previewEvidenceUrl, setPreviewEvidenceUrl] = useState(null);

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

  // Bước 1: Shop đồng ý yêu cầu trả hàng
  const handleAcceptReturn = async (orderId) => {
    if (!window.confirm(`Xác nhận ĐỒNG Ý YÊU CẦU TRẢ HÀNG cho đơn #ORD-${orderId}?\n\nKhách hàng sẽ nhận thông báo để gửi hàng về địa chỉ của shop để kiểm tra.`)) {
      return;
    }
    setActionError('');
    setActionSuccess('');
    try {
      const updated = await acceptReturnRequest(orderId);
      setActionSuccess(`✅ Đã chấp thuận yêu cầu trả hàng cho đơn #ORD-${orderId}. Đang chờ nhận hàng gửi về kho!`);
      setSelectedOrder(updated);
      loadOrders();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Lỗi khi đồng ý trả hàng!';
      setActionError(message);
    }
  };

  // Bước 2: Shop tiếp nhận hàng hoàn & nhập lại kho (FIFO)
  const handleReceiveReturnedGoods = async (orderId) => {
    if (!window.confirm(`Xác nhận ĐÃ NHẬN HÀNG HOÀN & KIỂM TRA HỢP LỆ cho đơn #ORD-${orderId}?\n\nToàn bộ sản phẩm sẽ được tự động nhập lại vào kho hàng (Cộng tồn kho biến thể & cập nhật lô hàng FIFO). Sau bước này, bạn sẽ tiến hành hoàn tiền cho khách.`)) {
      return;
    }
    setActionError('');
    setActionSuccess('');
    try {
      const updated = await receiveReturnedGoods(orderId);
      setActionSuccess(`✅ Đã tiếp nhận hàng hoàn và nhập kho FIFO cho đơn #ORD-${orderId} thành công! Bây giờ bạn có thể hoàn tiền.`);
      setSelectedOrder(updated);
      loadOrders();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Lỗi khi tiếp nhận hàng hoàn!';
      setActionError(message);
    }
  };

  // Bước 3: Hoàn tiền qua PayOS tự động
  const handleApproveReturn = async (orderId) => {
    setActionError('');
    setActionSuccess('');
    const isPayOS = selectedOrder?.paymentMethod === 'PayOS';
    const targetAcc = selectedOrder?.returnRequest?.bankAccount || selectedOrder?.payerBankAccount || '';
    const targetBank = selectedOrder?.returnRequest?.bankName || selectedOrder?.payerBankName || (targetAcc ? 'TPBank' : '');
    const refundAmt = formatCurrency(selectedOrder?.returnRequest?.refundAmount != null ? selectedOrder.returnRequest.refundAmount : (selectedOrder?.refundAmount || selectedOrder?.totalAmount));

    if (isPayOS) {
      const promptText = `Xác nhận CHUYỂN HOÀN TIỀN PAYOS cho đơn #ORD-${orderId}?\n\n⚡ Hình thức: Thẻ / Ngân hàng (PayOS)\nSố tiền: ${refundAmt}\n\nHệ thống sẽ tự động gọi cổng PayOS để chuyển hoàn tiền trực tiếp về STK ${targetAcc} (${targetBank}) của khách hàng.`;
      if (!window.confirm(promptText)) return;
      try {
        const updated = await processRefund(orderId);
        const note = updated.returnRequest?.adminNote ? ` (${updated.returnRequest.adminNote})` : '';
        setActionSuccess(`✅ Đã chuyển hoàn tiền PayOS cho đơn #ORD-${orderId} thành công!${note}`);
        setSelectedOrder(updated);
        loadOrders();
      } catch (err) {
        const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Lỗi khi hoàn tiền PayOS!';
        setActionError(message);
      }
    } else {
      handleOpenApproveRefundModal(selectedOrder);
    }
  };

  const handleOpenApproveRefundModal = (order) => {
    setRefundModalOrder(order);
    setIsApproveRefundModalOpen(true);
  };

  const handleConfirmApproveRefund = async () => {
    if (!refundModalOrder) return;
    setApprovingRefund(true);
    setActionError('');
    setActionSuccess('');
    try {
      const updated = await processRefund(refundModalOrder.orderId);
      setActionSuccess(`✅ Đã xác nhận hoàn tiền cho đơn #ORD-${refundModalOrder.orderId} thành công!`);
      setSelectedOrder(updated);
      setIsApproveRefundModalOpen(false);
      setRefundModalOrder(null);
      loadOrders();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Lỗi khi hoàn tiền!';
      setActionError(message);
      alert('Không thể hoàn tiền: ' + message);
    } finally {
      setApprovingRefund(false);
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
      setActionSuccess(`❌ Đã từ chối yêu cầu trả hàng cho đơn #${returningOrderId}.`);
      setIsRejectModalOpen(false);
      setSelectedOrder(updated);
      loadOrders();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Lỗi khi từ chối hoàn trả!';
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

    if (newStatus === 'CANCELLED') {
      const isPayOS = selectedOrder?.paymentMethod === 'PayOS' || selectedOrder?.paymentStatus === 'PAID';
      const payerAcc = selectedOrder?.payerBankAccount || selectedOrder?.returnRequest?.bankAccount || '';
      const payerBank = selectedOrder?.payerBankName || selectedOrder?.returnRequest?.bankName || 'Ngân hàng';
      const payerHolder = selectedOrder?.payerAccountHolder || selectedOrder?.customerName || '';
      const refundAmt = formatCurrency(selectedOrder?.totalAmount || 0);

      const confirmMsg = isPayOS
        ? `Xác nhận HỦY ĐƠN HÀNG và HOÀN TIỀN cho đơn #ORD-${orderId}?\n\n` +
          `⚡ Đơn hàng đã được khách thanh toán trực tuyến qua PayOS.\n` +
          `• Số tiền hoàn lại: ${refundAmt}\n` +
          `• Hoàn về tài khoản thanh toán: ${payerAcc ? `${payerAcc} (${payerBank}) - ${payerHolder}` : 'Tài khoản khách đã thanh toán'}\n\n` +
          `Hệ thống sẽ tự động hoàn tiền về tài khoản ngân hàng của khách và cập nhật trạng thái đơn thành ĐÃ HỦY (ĐÃ HOÀN TIỀN).`
        : `Bạn có chắc muốn thực hiện: "Hủy đơn hàng (CANCELLED)" cho đơn #${orderId}?`;

      if (!window.confirm(confirmMsg)) return;
    } else {
      if (!window.confirm(`Bạn có chắc muốn thực hiện: "${actionName}" cho đơn #${orderId}?`)) {
        return;
      }
    }

    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      if (newStatus === 'CANCELLED' && updated.paymentStatus === 'REFUNDED') {
        const payerAcc = updated.payerBankAccount || updated.returnRequest?.bankAccount || '';
        const payerBank = updated.payerBankName || updated.returnRequest?.bankName || '';
        setActionSuccess(`✅ Đã hủy đơn #ORD-${orderId} thành công và tự động hoàn tiền về tài khoản ngân hàng ${payerAcc ? `${payerAcc} (${payerBank})` : ''} của khách hàng!`);
      } else {
        setActionSuccess(`✅ Đã chuyển trạng thái đơn #${orderId} sang ${newStatus} thành công!`);
      }
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

  // Handler: Tiếp nhận hoàn hàng & nhập kho trực tiếp (Không cần mở modal tạo phiếu phụ)
  const handleAcceptReturnAndRestock = async (order) => {
    if (!order) return;
    const rr = order.returnRequest;
    const refundAmt = Number(rr?.refundAmount != null ? rr.refundAmount : (order.refundAmount != null ? order.refundAmount : order.totalAmount)) || 0;
    const accNumber = rr?.bankAccount || order.payerBankAccount || '';
    const bankName = rr?.bankName || order.payerBankName || '';
    const accHolder = rr?.accountHolder || order.payerAccountHolder || order.recipientName || order.customerName || '';

    const confirmMsg = `Xác nhận TIẾP NHẬN HOÀN HÀNG & NHẬP KHO cho đơn hàng #ORD-${order.orderId}?\n\n` +
      `• Số tiền hoàn: ${refundAmt.toLocaleString('vi-VN')} đ\n` +
      `• Tài khoản hoàn tiền: ${accNumber ? `${accNumber} (${bankName}) - ${accHolder}` : 'Chưa cung cấp'}\n` +
      `• Toàn bộ sản phẩm trong đơn sẽ được tự động cộng lại vào tồn kho hàng.\n\n` +
      `Bấm OK để tiếp nhận và lưu thông tin phiếu hoàn hàng.`;

    if (!window.confirm(confirmMsg)) return;

    setActionError('');
    setActionSuccess('');
    setSubmittingReturn(true);

    try {
      const payload = {
        reason: rr?.reason || order.returnReason || 'Khách hàng gửi trả lại hàng về kho shop',
        refundAmount: refundAmt,
        bankName: bankName || null,
        bankAccount: accNumber || null,
        accountHolder: accHolder || null,
        restock: true,
        adminNote: 'Đã kiểm tra hàng nguyên tem mác, tiếp nhận hoàn hàng và nhập kho thành công.'
      };

      const updated = await createStaffReturn(order.orderId, payload);
      setActionSuccess(`✅ Đã tiếp nhận hoàn hàng & hoàn kho đơn #ORD-${order.orderId} thành công! Sản phẩm đã được nhập lại vào kho.`);
      setSelectedOrder(updated);
      loadOrders();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Lỗi khi tiếp nhận hoàn hàng!';
      setActionError(message);
      alert('Không thể tiếp nhận hoàn hàng: ' + message);
    } finally {
      setSubmittingReturn(false);
    }
  };

  const getStatusBadge = (status, paymentMethod, returnStatus, paymentStatus) => {
    const s = (status || '').toUpperCase();
    const isCod = (paymentMethod || '').toUpperCase() === 'COD';
    const rStatus = (returnStatus || '').toLowerCase();
    const pStatus = (paymentStatus || '').toLowerCase();
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

    // 1. Ưu tiên cao nhất: Nếu đã hoàn tiền (dù từ returnStatus hay paymentStatus)
    if (rStatus === 'completed' || rStatus === 'refunded' || pStatus === 'refunded') {
      return (
        <span style={{ ...baseStyle, backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
          <CheckCircle2 size={13} /> Đã hoàn tiền
        </span>
      );
    }

    if (rStatus === 'pending') {
      return (
        <span style={{ ...baseStyle, backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
          <Clock size={13} /> Chờ duyệt trả hàng
        </span>
      );
    }
    if (rStatus === 'return_approved' || rStatus === 'approved') {
      return (
        <span style={{ ...baseStyle, backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
          <Package size={13} /> Chờ nhận hàng hoàn
        </span>
      );
    }
    if (rStatus === 'goods_received') {
      return (
        <span style={{ ...baseStyle, backgroundColor: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff' }}>
          <Clock size={13} /> Đã nhận hàng - Chờ hoàn tiền
        </span>
      );
    }
    if (rStatus === 'rejected') {
      return (
        <span style={{ ...baseStyle, backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          <XCircle size={13} /> Từ chối trả hàng
        </span>
      );
    }

    switch (s) {
      case 'PENDING':
        return (
          <span style={{ ...baseStyle, backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
            <Clock size={13} /> Chờ xác nhận
          </span>
        );
      case 'PROCESSING':
        return (
          <span style={{ ...baseStyle, backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
            <Package size={13} /> Đang xử lý
          </span>
        );
      case 'SHIPPED':
        return (
          <span style={{ ...baseStyle, backgroundColor: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff' }}>
            <Truck size={13} /> Đang giao
          </span>
        );
      case 'DELIVERED':
        return (
          <span style={{ ...baseStyle, backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
            <CheckCircle2 size={13} /> {isCod ? 'Đã giao (Đã thanh toán)' : 'Hoàn tất'}
          </span>
        );
      case 'RETURNED':
        return (
          <span style={{ ...baseStyle, backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
            <RotateCcw size={13} /> Đã hoàn hàng
          </span>
        );
      case 'CANCELLED':
        return (
          <span style={{ ...baseStyle, backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
            <XCircle size={13} /> {returnStatus === 'approved' ? 'Đã hủy (Đã hoàn tiền)' : 'Đã hủy'}
          </span>
        );
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
          <div className="stat-icon" style={{ color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-val">{countPending}</div>
            <div className="stat-label">Chờ Xác Nhận (PENDING)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={24} />
          </div>
          <div>
            <div className="stat-val">{countProcessing}</div>
            <div className="stat-label">Đang Xử Lý (PROCESSING)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={24} />
          </div>
          <div>
            <div className="stat-val">{countShipped}</div>
            <div className="stat-label">Đang Giao Hàng (SHIPPED)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-val">{countDelivered}</div>
            <div className="stat-label">Giao Thành Công (DELIVERED)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RotateCcw size={24} />
          </div>
          <div>
            <div className="stat-val">{countReturned}</div>
            <div className="stat-label">Đã Hoàn Hàng (RETURNED)</div>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', border: countReturnPending > 0 ? '2px solid #f59e0b' : undefined }} onClick={() => setStatusFilter(statusFilter === 'RETURN_PENDING' ? '' : 'RETURN_PENDING')}>
          <div className="stat-icon" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={24} />
          </div>
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
            <option value="RETURN_PENDING">Chờ Duyệt Hoàn Tiền (RETURN_PENDING)</option>
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span><strong>Không thể thực hiện:</strong> {actionError}</span>
          </div>
          <button style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', display: 'flex' }} onClick={() => setActionError('')}><X size={18} /></button>
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <span>{actionSuccess}</span>
          </div>
          <button style={{ background: 'none', border: 'none', color: '#6ee7b7', cursor: 'pointer', display: 'flex' }} onClick={() => setActionSuccess('')}><X size={18} /></button>
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
                        <div>
                          {o.paymentMethod === 'PayOS' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '3px', fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                              <CreditCard size={12} /> PayOS
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '3px', fontSize: '0.68rem', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                              <Banknote size={12} /> COD
                            </span>
                          )}
                        </div>
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
                        {getStatusBadge(o.orderStatus, o.paymentMethod, o.returnStatus, o.paymentStatus)}
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
                              backgroundColor: 'rgba(59, 130, 246, 0.12)',
                              color: '#2563eb',
                              borderColor: 'rgba(59, 130, 246, 0.35)',
                              whiteSpace: 'nowrap',
                              padding: '5px 14px',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                            onClick={() => handleOpenDetail(o.orderId)}
                            title="Xem chi tiết các sản phẩm và xử lý đơn"
                          >
                            <Eye size={14} /> Chi tiết
                          </button>
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
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span><strong>Không thể thực hiện:</strong> {actionError}</span>
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
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>THÔNG TIN NGƯỜI NHẬN</div>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main, #111827)', marginBottom: '6px' }}>{selectedOrder.recipientName || selectedOrder.customerName}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} /> {selectedOrder.recipientPhone || selectedOrder.customerPhone || 'Chưa có SĐT'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} /> {selectedOrder.customerEmail}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.4', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{selectedOrder.shippingAddress}</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>TRẠNG THÁI & THANH TOÁN</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Trạng thái đơn:</span> {getStatusBadge(selectedOrder.orderStatus, selectedOrder.paymentMethod, selectedOrder.returnStatus, selectedOrder.paymentStatus)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Hình thức:</span>
                  <strong style={{ color: selectedOrder.paymentMethod === 'PayOS' ? '#2563eb' : '#b45309', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {selectedOrder.paymentMethod === 'PayOS' ? <><CreditCard size={14} /> Thẻ / Ngân Hàng (PayOS)</> : <><Banknote size={14} /> Tiền Mặt Khi Nhận (COD)</>}
                  </strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Thanh toán:</span>
                  <strong style={{
                    color: (selectedOrder.paymentStatus?.toUpperCase() === 'PAID' || selectedOrder.orderStatus?.toUpperCase() === 'DELIVERED')
                      ? '#10b981'
                      : (selectedOrder.paymentStatus?.toUpperCase() === 'REFUNDED' || selectedOrder.orderStatus?.toUpperCase() === 'RETURNED')
                        ? '#c2410c'
                        : '#f59e0b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {(selectedOrder.paymentStatus?.toUpperCase() === 'PAID' || selectedOrder.orderStatus?.toUpperCase() === 'DELIVERED') ? (
                      <><CheckCircle2 size={14} /> Đã thanh toán</>
                    ) : (selectedOrder.paymentStatus?.toUpperCase() === 'REFUNDED' || selectedOrder.orderStatus?.toUpperCase() === 'RETURNED') ? (
                      <><RotateCcw size={14} /> Đã hoàn tiền</>
                    ) : (
                      <><Clock size={14} /> Chưa thanh toán (COD)</>
                    )}
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
                              <div style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <AlertTriangle size={12} /> Thiếu hàng!
                              </div>
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

            {/* QUY TRÌNH TRẢ HÀNG & HOÀN TIỀN (3 BƯỚC) */}
            {selectedOrder.returnStatus && (() => {
              const rStatus = (selectedOrder.returnStatus || '').toLowerCase();
              const isPayOS = selectedOrder.paymentMethod === 'PayOS';
              const isStep1Current = rStatus === 'pending';
              const isStep1Done = rStatus === 'return_approved' || rStatus === 'approved' || rStatus === 'goods_received' || rStatus === 'completed' || rStatus === 'refunded';
              const isStep2Current = rStatus === 'return_approved' || rStatus === 'approved';
              const isStep2Done = rStatus === 'goods_received' || rStatus === 'completed' || rStatus === 'refunded';
              const isStep3Current = rStatus === 'goods_received';
              const isStep3Done = rStatus === 'completed' || rStatus === 'refunded';
              const isRejected = rStatus === 'rejected';

              const bName = selectedOrder.returnRequest?.bankName || selectedOrder.payerBankName || '';
              const bAcc = selectedOrder.returnRequest?.bankAccount || selectedOrder.payerBankAccount || '';
              const bHolder = selectedOrder.returnRequest?.accountHolder || selectedOrder.payerAccountHolder || selectedOrder.recipientName || selectedOrder.customerName || '';
              const refundAmt = Number(selectedOrder.returnRequest?.refundAmount != null ? selectedOrder.returnRequest.refundAmount : (selectedOrder.refundAmount != null ? selectedOrder.refundAmount : selectedOrder.totalAmount)) || 0;
              const reasonText = selectedOrder.returnRequest?.reason || selectedOrder.returnReason;
              const rawImgs = selectedOrder.returnRequest?.evidenceImages;
              const imgList = rawImgs ? rawImgs.split(',').map(s => s.trim()).filter(Boolean) : [];

              return (
                <div style={{
                  marginBottom: '20px',
                  padding: '18px 20px',
                  borderRadius: '12px',
                  border: isRejected ? '1.5px solid #fecaca' : isStep3Done ? '1.5px solid #86efac' : '1.5px solid #fed7aa',
                  backgroundColor: isRejected ? '#fef2f2' : isStep3Done ? '#f0fdf4' : '#fffaf5',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{
                      fontWeight: 800,
                      fontSize: '0.98rem',
                      color: isRejected ? '#991b1b' : isStep3Done ? '#166534' : '#9a3412',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <RotateCcw size={18} />
                      <span>QUY TRÌNH TRẢ HÀNG & HOÀN TIỀN (3 BƯỚC)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '12px',
                        backgroundColor: isPayOS ? '#dbeafe' : '#ffedd5',
                        color: isPayOS ? '#1d4ed8' : '#c2410c',
                        border: isPayOS ? '1px solid #bfdbfe' : '1px solid #fdba74',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {isPayOS ? <><CreditCard size={12} /> Cổng PayOS</> : <><Banknote size={12} /> Tiền mặt (COD)</>}
                      </span>
                      {getStatusBadge(selectedOrder.orderStatus, selectedOrder.paymentMethod, selectedOrder.returnStatus, selectedOrder.paymentStatus)}
                    </div>
                  </div>

                  {/* Thanh Tiến Trình 3 Bước (Visual Stepper) */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '10px',
                    marginBottom: '16px'
                  }}>
                    {/* Bước 1 */}
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: isStep1Current ? '#fef3c7' : isStep1Done ? '#ecfdf5' : isRejected ? '#fef2f2' : '#f8fafc',
                      border: isStep1Current ? '2px solid #f59e0b' : isStep1Done ? '1.5px solid #10b981' : isRejected ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: isStep1Current ? '#f59e0b' : isStep1Done ? '#10b981' : isRejected ? '#ef4444' : '#cbd5e1',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}>
                        {isStep1Done ? <Check size={16} /> : isRejected ? <X size={16} /> : '1'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isStep1Current ? '#92400e' : isStep1Done ? '#065f46' : isRejected ? '#991b1b' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          1. Duyệt Yêu Cầu
                        </div>
                        <div style={{ fontSize: '0.72rem', color: isStep1Current ? '#b45309' : isStep1Done ? '#047857' : isRejected ? '#dc2626' : '#94a3b8' }}>
                          {isStep1Done ? 'Shop đã đồng ý' : isStep1Current ? 'Chờ shop duyệt' : isRejected ? 'Đã từ chối' : 'Chờ xử lý'}
                        </div>
                      </div>
                    </div>

                    {/* Bước 2 */}
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: isStep2Current ? '#eff6ff' : isStep2Done ? '#ecfdf5' : '#f8fafc',
                      border: isStep2Current ? '2px solid #3b82f6' : isStep2Done ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: isStep2Current ? '#3b82f6' : isStep2Done ? '#10b981' : '#cbd5e1',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}>
                        {isStep2Done ? <Check size={16} /> : '2'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isStep2Current ? '#1e40af' : isStep2Done ? '#065f46' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          2. Nhận Hàng & Nhập Kho
                        </div>
                        <div style={{ fontSize: '0.72rem', color: isStep2Current ? '#2563eb' : isStep2Done ? '#047857' : '#94a3b8' }}>
                          {isStep2Done ? 'Đã nhập kho FIFO' : isStep2Current ? 'Chờ bưu phẩm gửi về' : 'Chờ bước 1'}
                        </div>
                      </div>
                    </div>

                    {/* Bước 3 */}
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: isStep3Current ? '#faf5ff' : isStep3Done ? '#ecfdf5' : '#f8fafc',
                      border: isStep3Current ? '2px solid #8b5cf6' : isStep3Done ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: isStep3Current ? '#8b5cf6' : isStep3Done ? '#10b981' : '#cbd5e1',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}>
                        {isStep3Done ? <Check size={16} /> : '3'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isStep3Current ? '#6b21a8' : isStep3Done ? '#065f46' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          3. Hoàn Tiền Khách Hàng
                        </div>
                        <div style={{ fontSize: '0.72rem', color: isStep3Current ? '#7c3aed' : isStep3Done ? '#047857' : '#94a3b8' }}>
                          {isStep3Done ? 'Đã hoàn tiền xong' : isStep3Current ? (isPayOS ? 'Chờ hoàn PayOS' : 'Chờ quét QR chuyển tiền') : 'Chờ nhận hàng'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Instructions & Action Banner for the Current Step */}
                  {isStep1Current && (
                    <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', marginBottom: '14px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#92400e', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertCircle size={16} /> Bước 1: Nhân viên kiểm tra yêu cầu trả hàng từ khách
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#78350f', lineHeight: 1.5, marginBottom: '10px' }}>
                        Vui lòng kiểm tra kỹ <strong>Lý do</strong> và <strong>Ảnh chụp bằng chứng</strong> của khách hàng bên dưới. Nếu đủ điều kiện, bấm <strong>"Đồng Ý Trả Hàng"</strong> để hướng dẫn khách đóng gói gửi hàng về kho; hoặc bấm <strong>"Từ Chối"</strong> nếu không hợp lệ.
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ backgroundColor: '#10b981', borderColor: '#10b981', padding: '8px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => handleAcceptReturn(selectedOrder.orderId)}
                        >
                          <Check size={15} /> Đồng Ý Trả Hàng (Bước 1)
                        </button>
                        <button
                          type="button"
                          className="btn-action btn-lock"
                          style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#dc2626', backgroundColor: '#ffffff', padding: '8px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => handleOpenRejectModal(selectedOrder.orderId)}
                        >
                          <XCircle size={15} /> Từ Chối Yêu Cầu
                        </button>
                      </div>
                    </div>
                  )}

                  {isStep2Current && (
                    <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', marginBottom: '14px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0369a1', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Truck size={16} /> Bước 2: Chờ nhận hàng gửi về kho & kiểm tra hàng hóa
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#0c4a6e', lineHeight: 1.5, marginBottom: '10px' }}>
                        Shop đã đồng ý yêu cầu trả hàng. Khi kiện hàng được bưu tá chuyển về tới cửa hàng, nhân viên mở kiểm tra nguyên vẹn tem mác. Sau khi kiểm tra đạt chuẩn, bấm <strong>"Tiếp Nhận Hàng Hoàn & Nhập Kho FIFO"</strong> để hệ thống tự động cộng lại số lượng vào tồn kho biến thể và các lô hàng FIFO cũ nhất.
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ backgroundColor: '#ea580c', borderColor: '#c2410c', padding: '8px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => handleReceiveReturnedGoods(selectedOrder.orderId)}
                        >
                          <Package size={15} /> Tiếp Nhận Hàng Hoàn & Nhập Kho FIFO (Bước 2)
                        </button>
                        <button
                          type="button"
                          className="btn-action btn-lock"
                          style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#dc2626', backgroundColor: '#ffffff', padding: '8px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => handleOpenRejectModal(selectedOrder.orderId)}
                        >
                          <XCircle size={15} /> Từ Chối (Hàng không hợp lệ / Tráo hàng)
                        </button>
                      </div>
                    </div>
                  )}

                  {isStep3Current && (
                    <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', marginBottom: '14px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#7e22ce', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Package size={16} /> Bước 3: Đã tiếp nhận & hoàn kho FIFO - Tiến hành hoàn tiền
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#581c87', lineHeight: 1.5, marginBottom: '10px' }}>
                        Toàn bộ sản phẩm trong đơn đã được cộng lại vào tồn kho hàng thành công. Hãy thực hiện chuyển tiền hoàn cho khách hàng {formatCurrency(refundAmt)}.
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {isPayOS ? (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ backgroundColor: '#10b981', borderColor: '#10b981', padding: '8px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => handleApproveReturn(selectedOrder.orderId)}
                          >
                            <Zap size={15} /> Duyệt & Chuyển Hoàn Tiền PayOS (Bước 3)
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ backgroundColor: '#10b981', borderColor: '#10b981', padding: '8px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => handleOpenApproveRefundModal(selectedOrder)}
                          >
                            <Banknote size={15} /> Hoàn Tiền Chuyển Khoản (Quét Mã VietQR) (Bước 3)
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {isStep3Done && (
                    <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', marginBottom: '14px', color: '#166534', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={18} color="#15803d" />
                      <div>
                        <strong>Đã hoàn tất toàn bộ quy trình:</strong> Sản phẩm đã được nhập kho FIFO và tiền đã được hoàn trả thành công {formatCurrency(refundAmt)}.
                      </div>
                    </div>
                  )}

                  {isRejected && (
                    <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', marginBottom: '14px', color: '#991b1b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Ban size={18} color="#dc2626" />
                      <div>
                        <strong>Yêu cầu trả hàng đã bị từ chối:</strong> {selectedOrder.returnReason || 'Không đáp ứng điều kiện hoàn trả.'} (Không tiếp nhận hoàn tiền nữa).
                      </div>
                    </div>
                  )}

                  {/* Thông Tin Chi Tiết Của Phiếu */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '12px', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Số tiền cần hoàn lại: </span>
                      <strong style={{ color: '#dc2626', fontSize: '1.05rem', fontWeight: 800 }}>
                        {formatCurrency(refundAmt)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Phương thức thanh toán: </span>
                      <strong style={{ color: '#1e293b' }}>
                        {isPayOS ? 'Cổng PayOS (Trực Tuyến)' : 'Thanh toán khi nhận hàng (COD)'}
                      </strong>
                    </div>
                    {reasonText && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Lý do hoàn trả: </span>
                        <strong style={{ color: '#0f172a' }}>{reasonText}</strong>
                      </div>
                    )}
                  </div>

                  {/* Thông tin tài khoản ngân hàng nhận tiền hoàn (Chỉ hiển thị ở Bước 3 khi bắt đầu hoàn tiền hoặc khi đã hoàn tất) */}
                  {(isStep3Current || isStep3Done) && (
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      marginBottom: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building2 size={15} color="#2563eb" />
                          <span>Tài khoản ngân hàng nhận tiền hoàn (Khách cung cấp):</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                          {isPayOS ? 'Tài khoản hoàn PayOS' : 'Chuyển khoản VietQR'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '0.84rem' }}>
                        <div>
                          <span style={{ color: '#64748b' }}>Ngân hàng: </span>
                          <strong style={{ color: '#0f172a' }}>{bName || 'Chưa cung cấp'}</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                          <span style={{ color: '#64748b' }}>Số tài khoản: </span>
                          <strong style={{ fontFamily: 'monospace', color: '#2563eb', fontSize: '0.98rem', letterSpacing: '0.03em' }}>{bAcc || 'Chưa cung cấp'}</strong>
                          {bAcc && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(bAcc);
                                alert(`Đã sao chép số tài khoản: ${bAcc}`);
                              }}
                              style={{
                                padding: '2px 7px',
                                fontSize: '0.72rem',
                                backgroundColor: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Copy size={12} /> Sao chép
                            </button>
                          )}
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Chủ tài khoản: </span>
                          <strong style={{ color: '#0f172a', textTransform: 'uppercase' }}>{bHolder || 'Chưa cung cấp'}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {(isStep1Current || isStep2Current) && (
                    <div style={{ fontSize: '0.76rem', color: '#64748b', fontStyle: 'italic', marginBottom: '12px', padding: '6px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                      * Thông tin tài khoản nhận tiền hoàn của khách hàng đã được lưu an toàn trên hệ thống và sẽ hiển thị tại <strong>Bước 3 (Hoàn tiền)</strong> sau khi hoàn tất kiểm tra và nhập lại kho.
                    </div>
                  )}

                  {/* Ảnh bằng chứng từ khách hàng */}
                  {imgList.length > 0 && (
                    <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', marginBottom: '10px' }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Camera size={16} color="#0284c7" />
                          <span>Hình ảnh bằng chứng từ khách hàng:</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                          {imgList.length} ảnh
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {imgList.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            onClick={() => setPreviewEvidenceUrl(imgUrl)}
                            style={{
                              position: 'relative',
                              width: '72px',
                              height: '72px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: '1.5px solid #cbd5e1',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                              cursor: 'pointer'
                            }}
                            title="Nhấn để phóng to ảnh bằng chứng"
                          >
                            <img
                              src={imgUrl}
                              alt={`Bằng chứng ${idx + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundColor: 'rgba(0,0,0,0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                            >
                              <Eye size={16} color="#ffffff" />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>
                        * Nhấn vào từng ảnh để phóng to và kiểm tra chi tiết lỗi sản phẩm trước khi duyệt.
                      </div>
                    </div>
                  )}

                  {/* Ghi chú quản trị */}
                  {selectedOrder.returnRequest?.adminNote && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px dashed #86efac', fontSize: '0.82rem', color: '#166534' }}>
                      <strong>Ghi chú xử lý:</strong> {selectedOrder.returnRequest.adminNote}
                    </div>
                  )}
                </div>
              );
            })()}

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
                    style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '9px 18px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleUpdateStatus(selectedOrder.orderId, 'CANCELLED')}
                  >
                    <XCircle size={15} /> Hủy Đơn Hàng
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
                    style={{ backgroundColor: '#10b981', borderColor: '#10b981', padding: '9px 20px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleUpdateStatus(selectedOrder.orderId, 'PROCESSING')}
                  >
                    <Check size={16} /> Xác Nhận Đơn (Trừ Tồn Kho)
                  </button>
                )}

                {selectedOrder.orderStatus === 'PROCESSING' && (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', padding: '9px 20px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleUpdateStatus(selectedOrder.orderId, 'SHIPPED')}
                  >
                    <Truck size={16} /> Bắt Đầu Giao Hàng (SHIPPED)
                  </button>
                )}

                {selectedOrder.orderStatus === 'SHIPPED' && (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ backgroundColor: '#10b981', borderColor: '#10b981', padding: '9px 20px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleUpdateStatus(selectedOrder.orderId, 'DELIVERED')}
                  >
                    <CheckCircle2 size={16} /> Xác Nhận Đã Giao (DELIVERED)
                  </button>
                )}

                {/* Các nút hành động tương ứng từng bước trong quy trình trả hàng & hoàn tiền */}
                {selectedOrder.returnStatus === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ backgroundColor: '#10b981', borderColor: '#10b981', padding: '9px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => handleAcceptReturn(selectedOrder.orderId)}
                    >
                      <Check size={16} /> Đồng Ý Trả Hàng (Bước 1)
                    </button>
                    <button
                      type="button"
                      className="btn-action btn-lock"
                      style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#dc2626', backgroundColor: '#fef2f2', padding: '9px 18px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => handleOpenRejectModal(selectedOrder.orderId)}
                    >
                      <XCircle size={16} /> Từ Chối Yêu Cầu
                    </button>
                  </div>
                )}

                {(selectedOrder.returnStatus === 'return_approved' || selectedOrder.returnStatus === 'approved') && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ backgroundColor: '#ea580c', borderColor: '#c2410c', padding: '9px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => handleReceiveReturnedGoods(selectedOrder.orderId)}
                    >
                      <Package size={16} /> Tiếp Nhận Hàng Hoàn & Nhập Kho FIFO (Bước 2)
                    </button>
                    <button
                      type="button"
                      className="btn-action btn-lock"
                      style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#dc2626', backgroundColor: '#fef2f2', padding: '9px 18px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => handleOpenRejectModal(selectedOrder.orderId)}
                    >
                      <XCircle size={16} /> Từ Chối (Hàng không hợp lệ)
                    </button>
                  </div>
                )}

                {selectedOrder.returnStatus === 'goods_received' && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {selectedOrder.paymentMethod === 'PayOS' ? (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ backgroundColor: '#10b981', borderColor: '#10b981', padding: '9px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => handleApproveReturn(selectedOrder.orderId)}
                      >
                        <Zap size={16} /> Duyệt & Chuyển Hoàn Tiền PayOS (Bước 3)
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ backgroundColor: '#10b981', borderColor: '#10b981', padding: '9px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => handleOpenApproveRefundModal(selectedOrder)}
                      >
                        <Banknote size={16} /> Hoàn Tiền Chuyển Khoản (Quét Mã VietQR) (Bước 3)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Modal Từ Chối Hoàn Tiền */}
      {isRejectModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 40px -8px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <XCircle size={18} color="#dc2626" /> Từ chối yêu cầu hoàn tiền #{returningOrderId}
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

      {/* Modal Xác Nhận Hoàn Tiền Bằng Phương Thức Chuyển Khoản */}
      {isApproveRefundModalOpen && refundModalOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '540px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={20} color="#2563eb" /> Hoàn Tiền Chuyển Khoản
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Đơn hàng #ORD-{refundModalOrder.orderId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsApproveRefundModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Thông tin số tiền hoàn */}
            <div style={{ backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Số tiền cần hoàn lại:</div>
                <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#dc2626' }}>
                  {formatCurrency(refundModalOrder.returnRequest?.refundAmount != null ? refundModalOrder.returnRequest.refundAmount : refundModalOrder.refundAmount || refundModalOrder.totalAmount)}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#475569' }}>
                <div>Khách hàng: <strong>{refundModalOrder.recipientName || refundModalOrder.customerName}</strong></div>
                <div>SĐT: <strong>{refundModalOrder.phone || refundModalOrder.customerPhone || 'N/A'}</strong></div>
              </div>
            </div>

            {/* Ảnh bằng chứng từ khách hàng */}
            {refundModalOrder.returnRequest?.evidenceImages && (
              <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={14} color="#0284c7" /> Ảnh bằng chứng của khách hàng ({refundModalOrder.returnRequest.evidenceImages.split(',').filter(Boolean).length} ảnh):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {refundModalOrder.returnRequest.evidenceImages.split(',').filter(Boolean).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Bằng chứng ${idx + 1}`}
                      onClick={() => setPreviewEvidenceUrl(img)}
                      style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                      title="Nhấn để xem phóng to"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Thông tin tài khoản người đã chuyển */}
            {(() => {
              const bName = refundModalOrder.returnRequest?.bankName || refundModalOrder.payerBankName || '';
              const bAcc = refundModalOrder.returnRequest?.bankAccount || refundModalOrder.payerBankAccount || '';
              const bHolder = refundModalOrder.returnRequest?.accountHolder || refundModalOrder.payerAccountHolder || refundModalOrder.recipientName || '';
              const refundAmt = Number(refundModalOrder.returnRequest?.refundAmount != null ? refundModalOrder.returnRequest.refundAmount : refundModalOrder.totalAmount) || 0;
              const hasPayer = Boolean(refundModalOrder.payerBankAccount);

              return (
                <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CreditCard size={15} /> Tài Khoản Nhận Tiền Hoàn
                    </div>
                    {hasPayer && (
                      <span style={{ fontSize: '0.72rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                        Đã chuyển lúc thanh toán
                      </span>
                    )}
                  </div>

                  {bAcc ? (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', fontSize: '0.875rem', marginBottom: '12px' }}>
                        <span style={{ color: '#4b5563' }}>Ngân hàng:</span>
                        <strong style={{ color: '#111827' }}>{bName || 'N/A'}</strong>

                        <span style={{ color: '#4b5563' }}>Số tài khoản:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: '#2563eb', fontSize: '1rem', fontFamily: 'monospace' }}>{bAcc}</strong>
                          <button
                            type="button"
                            onClick={() => { navigator.clipboard.writeText(bAcc); alert('Đã sao chép số tài khoản: ' + bAcc); }}
                            style={{ padding: '2px 6px', fontSize: '0.72rem', borderRadius: '4px', border: '1px solid #93c5fd', backgroundColor: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            <Copy size={11} /> Sao chép
                          </button>
                        </div>

                        <span style={{ color: '#4b5563' }}>Chủ tài khoản:</span>
                        <strong style={{ color: '#111827' }}>{bHolder || 'N/A'}</strong>
                      </div>

                      {/* Mã VietQR chuyển khoản */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px dashed #86efac' }}>
                        <img
                          src={`https://img.vietqr.io/image/${getVietQrBankCode(bName)}-${bAcc.replace(/\s+/g, '')}-compact2.png?amount=${refundAmt}&addInfo=Hoan tien don ORD ${refundModalOrder.orderId}&accountName=${encodeURIComponent(bHolder)}`}
                          alt="VietQR Chuyển Khoản"
                          style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                        />
                        <div style={{ fontSize: '0.8rem', color: '#166534', lineHeight: 1.4 }}>
                          <strong style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', marginBottom: '4px' }}>
                            <QrCode size={15} /> Quét mã để hoàn tiền trong 3 giây
                          </strong>
                          Mở ứng dụng ngân hàng quét mã QR trên. Hệ thống tự động điền đúng Số tài khoản, Ngân hàng và Số tiền cần hoàn ({formatCurrency(refundAmt)}).
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#dc2626', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={15} /> Chưa có thông tin tài khoản ngân hàng của người chuyển tiền. Vui lòng liên hệ khách hàng để lấy STK trước khi duyệt.
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setIsApproveRefundModalOpen(false)}
                disabled={approvingRefund}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ backgroundColor: '#10b981', borderColor: '#10b981', padding: '9px 20px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={handleConfirmApproveRefund}
                disabled={approvingRefund}
              >
                {approvingRefund ? <Clock size={16} /> : <Check size={16} />}
                {approvingRefund ? 'Đang hoàn tất...' : 'Đã Chuyển Khoản & Duyệt Hoàn Tiền'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Phóng To Ảnh Bằng Chứng Cho Nhân Viên / Admin */}
      {previewEvidenceUrl && (
        <div
          onClick={() => setPreviewEvidenceUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000000,
            padding: '24px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <button
              type="button"
              onClick={() => setPreviewEvidenceUrl(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={22} />
            </button>
            <img
              src={previewEvidenceUrl}
              alt="Ảnh bằng chứng kiểm duyệt phóng to"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                borderRadius: '8px',
                objectFit: 'contain',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
              }}
            />
            <div style={{ marginTop: '10px', color: '#e2e8f0', fontSize: '0.85rem' }}>
              Nhấn ra ngoài hoặc bấm nút [X] để đóng xem ảnh
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
