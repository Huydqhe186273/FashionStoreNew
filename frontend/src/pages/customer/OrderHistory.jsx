import React, { useEffect, useState, useContext, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Package,
  Truck,
  CheckCircle2,
  RotateCcw,
  XCircle,
  CreditCard,
  Banknote,
  Eye,
  Star,
  MapPin,
  ShoppingBag,
  Building2,
  Lock,
  AlertTriangle,
  AlertCircle,
  ArrowLeft,
  X,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { getUserOrders, cancelOrder, createReturnRequest, confirmOrderReceived } from '../../services/orderService';
import { getReviewableItems, createReview } from '../../services/customerReviewService';
import { uploadGenericImage } from '../../services/productImageService';
import { createPaymentLink, verifyPayment } from '../../services/cartService';
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
  processing: { label: 'Đang xử lý', class: 'confirmed' },
  shipping: { label: 'Đang giao hàng', class: 'shipping' },
  shipped: { label: 'Đang giao hàng', class: 'shipping' },
  delivered: { label: 'Đã giao thành công', class: 'delivered' },
  cancelled: { label: 'Đã hủy', class: 'cancelled' },
  returned: { label: 'Đã trả hàng', class: 'cancelled' }
};

// Hàm xác định duy nhất 1 trạng thái mới nhất & chính xác nhất của đơn hàng
const getLatestOrderStatus = (order) => {
  if (!order) return { label: 'Đang xử lý', icon: Clock, class: 'pending', color: '#ffffff', bg: '#475569' };
  const oStatus = (order.orderStatus || '').toLowerCase();
  const pStatus = (order.paymentStatus || '').toLowerCase();
  const rStatus = (order.returnStatus || '').toLowerCase();
  const isPaid = pStatus === 'paid' || oStatus === 'delivered';
  const isCod = order.paymentMethod?.toUpperCase() === 'COD';

  // 1. Trạng thái đã hoàn tiền (ƯU TIÊN CAO NHẤT khi quy trình hoàn tiền đã hoàn tất)
  if (rStatus === 'completed' || rStatus === 'refunded' || rStatus === 'approved' || pStatus === 'refunded') {
    return { label: 'Đã hoàn tiền thành công', icon: RotateCcw, class: 'delivered', color: '#ffffff', bg: '#059669' };
  }

  // 2. Trạng thái trả hàng & hoàn tiền đang tiến hành
  if (rStatus === 'pending') {
    return { label: 'Chờ shop duyệt trả hàng', icon: Clock, class: 'pending', color: '#ffffff', bg: '#d97706' };
  }
  if (rStatus === 'return_approved') {
    return { label: 'Shop đồng ý - Vui lòng gửi hàng', icon: Truck, class: 'shipping', color: '#ffffff', bg: '#0284c7' };
  }
  if (rStatus === 'goods_received') {
    return { label: 'Shop đã nhận hàng - Đang hoàn tiền', icon: Clock, class: 'pending', color: '#ffffff', bg: '#7c3aed' };
  }
  if (rStatus === 'rejected') {
    return { label: 'Yêu cầu trả hàng bị từ chối', icon: XCircle, class: 'cancelled', color: '#ffffff', bg: '#dc2626' };
  }

  // 3. Trạng thái đơn hàng thông thường
  if (oStatus === 'cancelled') {
    return { label: 'Đã hủy', icon: XCircle, class: 'cancelled', color: '#ffffff', bg: '#dc2626' };
  }
  if (oStatus === 'returned') {
    return { label: 'Đã hoàn hàng về kho', icon: RotateCcw, class: 'cancelled', color: '#ffffff', bg: '#ea580c' };
  }
  if (oStatus === 'delivered') {
    return { label: isCod ? 'Đã nhận hàng (Đã thanh toán)' : 'Đã giao thành công', icon: CheckCircle2, class: 'delivered', color: '#ffffff', bg: '#059669' };
  }
  if (oStatus === 'shipping' || oStatus === 'shipped') {
    return { label: 'Đang giao hàng', icon: Truck, class: 'shipping', color: '#ffffff', bg: '#4f46e5' };
  }
  if (oStatus === 'processing' || oStatus === 'confirmed') {
    return { label: 'Đang xử lý', icon: Package, class: 'confirmed', color: '#ffffff', bg: '#2563eb' };
  }
  if (oStatus === 'pending') {
    if (isCod) {
      return { label: 'Chờ xác nhận (COD)', icon: Clock, class: 'pending', color: '#ffffff', bg: '#d97706' };
    }
    if (isPaid) {
      return { label: 'Đã thanh toán (Chờ xác nhận)', icon: CheckCircle2, class: 'confirmed', color: '#ffffff', bg: '#059669' };
    }
    return { label: 'Chờ thanh toán PayOS', icon: Clock, class: 'pending', color: '#ffffff', bg: '#d97706' };
  }

  return { label: order.orderStatus || 'Đang xử lý', icon: Clock, class: 'pending', color: '#ffffff', bg: '#475569' };
};

// Hàm xác định trạng thái thanh toán chính xác
const getPaymentStatusDisplay = (order) => {
  if (!order) return { label: 'Chưa thanh toán', icon: AlertCircle, color: '#e11d48' };
  const pStatus = (order.paymentStatus || '').toLowerCase();
  const oStatus = (order.orderStatus || '').toLowerCase();
  const rStatus = (order.returnStatus || '').toLowerCase();

  // Đơn đã hoàn tiền
  if (pStatus === 'refunded' || rStatus === 'completed' || rStatus === 'refunded' || rStatus === 'approved') {
    return { label: 'Đã hoàn tiền', icon: RotateCcw, color: '#059669' };
  }

  // Đang trong quy trình hoàn hàng
  if (rStatus === 'goods_received') {
    return { label: 'Đã nhận hàng - Chờ hoàn tiền', icon: Clock, color: '#7c3aed' };
  }
  if (rStatus === 'return_approved') {
    return { label: 'Shop đồng ý - Chờ gửi hàng', icon: Truck, color: '#0284c7' };
  }
  if (rStatus === 'pending') {
    return { label: 'Chờ duyệt trả hàng', icon: Clock, color: '#d97706' };
  }

  // Đơn đã thanh toán, hoặc đã nhận hàng (delivered)
  if (pStatus === 'paid' || oStatus === 'delivered') {
    return { label: 'Đã thanh toán', icon: CheckCircle2, color: '#059669' };
  }

  // Đơn COD chưa nhận hàng
  if (order.paymentMethod?.toUpperCase() === 'COD') {
    return { label: 'Thanh toán khi nhận hàng (Chưa thanh toán)', icon: Clock, color: '#d97706' };
  }

  return { label: 'Chưa thanh toán', icon: AlertCircle, color: '#e11d48' };
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
  const [ordersError, setOrdersError] = useState('');
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
  const [returnBankName, setReturnBankName] = useState('');
  const [returnBankAccount, setReturnBankAccount] = useState('');
  const [returnAccountHolder, setReturnAccountHolder] = useState('');

  // Ảnh bằng chứng hoàn hàng
  const [evidenceImages, setEvidenceImages] = useState([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [previewImageModalUrl, setPreviewImageModalUrl] = useState(null);
  const evidenceFileInputRef = useRef(null);

  // Review Modal State
  const [orderToReview, setOrderToReview] = useState(null);
  const [reviewItems, setReviewItems] = useState([]);
  const [loadingReviewItems, setLoadingReviewItems] = useState(false);
  const [reviewRatings, setReviewRatings] = useState({});
  const [reviewComments, setReviewComments] = useState({});
  const [submittingReviewMap, setSubmittingReviewMap] = useState({});
  const [hoverRatingMap, setHoverRatingMap] = useState({});

  const handleOpenReviewModal = async (order) => {
    setOrderToReview(order);
    setLoadingReviewItems(true);
    setReviewItems([]);
    try {
      const data = await getReviewableItems(order.orderId);
      if (data && data.length > 0) {
        setReviewItems(data);
        const initialRatings = {};
        const initialComments = {};
        data.forEach(item => {
          initialRatings[item.orderItemId] = item.rating || 5;
          initialComments[item.orderItemId] = item.comment || '';
        });
        setReviewRatings(initialRatings);
        setReviewComments(initialComments);
      } else if (order.items && order.items.length > 0) {
        const fallback = order.items.map(it => ({
          orderId: order.orderId,
          orderItemId: it.orderItemId,
          productId: it.productId,
          productName: it.productName,
          imageUrl: it.imageUrl,
          color: it.color,
          size: it.size,
          quantity: it.quantity,
          rating: null,
          comment: ''
        }));
        setReviewItems(fallback);
        const initialRatings = {};
        const initialComments = {};
        fallback.forEach(item => {
          initialRatings[item.orderItemId] = 5;
          initialComments[item.orderItemId] = '';
        });
        setReviewRatings(initialRatings);
        setReviewComments(initialComments);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách sản phẩm để đánh giá:', err);
      if (order.items && order.items.length > 0) {
        setReviewItems(order.items);
      }
    } finally {
      setLoadingReviewItems(false);
    }
  };

  const handleSubmitItemReview = async (orderItemId) => {
    const rating = reviewRatings[orderItemId] || 5;
    const comment = (reviewComments[orderItemId] || '').trim();
    setSubmittingReviewMap(prev => ({ ...prev, [orderItemId]: true }));
    try {
      await createReview({ orderItemId, rating, comment });
      toast.success('Đã gửi đánh giá sản phẩm thành công!');
      setReviewItems(prev => prev.map(item => item.orderItemId === orderItemId ? { ...item, rating, comment, reviewedAt: new Date().toISOString() } : item));
    } catch (err) {
      const resp = err.response?.data;
      const msg = typeof resp === 'string' ? resp : resp?.message || resp?.error || 'Không thể gửi đánh giá sản phẩm.';
      toast.error(msg);
    } finally {
      setSubmittingReviewMap(prev => ({ ...prev, [orderItemId]: false }));
    }
  };

  const handleUploadEvidenceFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (evidenceImages.length + files.length > 5) {
      toast.warning('Tối đa tải lên 5 ảnh bằng chứng!');
      return;
    }

    setUploadingEvidence(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast.warning(`Tệp "${file.name}" không phải là ảnh hợp lệ.`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.warning(`Ảnh "${file.name}" quá lớn (vượt 10MB).`);
          continue;
        }
        const res = await uploadGenericImage(file, 'returns');
        const url = res?.secureUrl || res?.url;
        if (url) {
          uploadedUrls.push(url);
        }
      }
      if (uploadedUrls.length > 0) {
        setEvidenceImages((prev) => [...prev, ...uploadedUrls]);
        toast.success(`Đã tải lên ${uploadedUrls.length} ảnh bằng chứng thành công!`);
      }
    } catch (err) {
      console.error('Lỗi khi tải ảnh bằng chứng:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi tải ảnh lên Cloudinary.');
    } finally {
      setUploadingEvidence(false);
      if (evidenceFileInputRef.current) {
        evidenceFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveEvidenceImage = (indexToRemove) => {
    setEvidenceImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const isMountedRef = useRef(true);
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setOrdersError('');
      const data = await getUserOrders(userId);
      if (isMountedRef.current) {
        setOrders(data || []);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Lỗi khi tải lịch sử đơn hàng:', err);
      const status = err.response?.status;
      const serverError = err.response?.data?.error || err.response?.data?.message;
      const message = status
        ? `Không thể tải lịch sử đơn hàng (HTTP ${status})${serverError ? `: ${serverError}` : '.'}`
        : 'Không thể tải lịch sử đơn hàng. Vui lòng kiểm tra kết nối backend.';
      setOrdersError(message);
      toastRef.current?.error(message, { duration: 5000 });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    isMountedRef.current = true;
    if (authLoading) return;
    if (userId) {
      fetchOrders();
    } else {
      setLoading(false);
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [userId, authLoading, fetchOrders]);

  // Lọc đơn hàng theo tab
  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    if (activeTab === 'paid') return orders.filter((o) => (o.paymentStatus || '').toLowerCase() === 'paid');
    if (activeTab === 'shipping') {
      return orders.filter((o) => {
        const s = (o.orderStatus || '').toLowerCase();
        return s === 'shipping' || s === 'shipped';
      });
    }
    if (activeTab === 'returned') {
      return orders.filter((o) => {
        const os = (o.orderStatus || '').toLowerCase();
        const ps = (o.paymentStatus || '').toLowerCase();
        const rs = (o.returnStatus || '').toLowerCase();
        return os === 'returned' || Boolean(rs) || ps === 'refunded';
      });
    }
    return orders.filter((o) => (o.orderStatus || '').toLowerCase() === activeTab);
  }, [orders, activeTab]);

  // Tự động kiểm tra kết quả thanh toán từ PayOS redirect về
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderCode = urlParams.get('orderCode');
    const status = urlParams.get('status');
    const cancel = urlParams.get('cancel');

    if (orderCode && (status === 'PAID' || urlParams.get('code') === '00' || cancel === 'false')) {
      verifyPayment(orderCode)
        .then((res) => {
          toast.success(res.message || 'Thanh toán đơn hàng thành công và đã lưu thông tin tài khoản chuyển tiền!');
          window.history.replaceState({}, document.title, window.location.pathname);
          fetchOrders();
        })
        .catch((err) => {
          console.error("Lỗi xác minh thanh toán:", err);
          window.history.replaceState({}, document.title, window.location.pathname);
          fetchOrders();
        });
    } else if (cancel === 'true') {
      toast.warning('Bạn đã hủy giao dịch thanh toán.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchOrders, toast]);

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

    // Validate thông tin tài khoản nếu là đơn COD hoặc chưa có tài khoản thanh toán gốc
    if (!orderToReturn.payerBankAccount) {
      if (!returnBankName || !returnBankName.trim()) {
        toast.error('Vui lòng nhập tên ngân hàng nhận tiền hoàn!');
        return;
      }
      const cleanAcc = (returnBankAccount || '').trim();
      if (!cleanAcc) {
        toast.error('Vui lòng nhập số tài khoản ngân hàng nhận tiền hoàn!');
        return;
      }
      if (!/^[0-9]{6,25}$/.test(cleanAcc)) {
        toast.error('Số tài khoản ngân hàng phải gồm từ 6 đến 25 chữ số!');
        return;
      }
      if (!returnAccountHolder || !returnAccountHolder.trim()) {
        toast.error('Vui lòng nhập tên chủ tài khoản nhận tiền hoàn!');
        return;
      }
    }

    const fullReason = returnReasonDetail.trim()
      ? `${returnReasonType}: ${returnReasonDetail.trim()}`
      : returnReasonType;

    const payload = {
      reason: fullReason,
      bankName: returnBankName.trim(),
      bankAccount: returnBankAccount.trim(),
      accountHolder: returnAccountHolder.trim().toUpperCase(),
      evidenceImages: evidenceImages.filter(Boolean).join(',')
    };

    try {
      setSubmittingReturn(true);
      await createReturnRequest(orderToReturn.orderId, userId, payload);
      toast.success(`Đã gửi yêu cầu trả hàng & hoàn tiền cho đơn #${orderToReturn.orderId}`);
      setOrderToReturn(null);
      setReturnReasonDetail('');
      setEvidenceImages([]);
      fetchOrders();
    } catch (err) {
      console.error('Lỗi gửi yêu cầu hoàn tiền:', err);
      toast.error(err.response?.data?.error || err.message || 'Gửi yêu cầu hoàn tiền thất bại.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Xác nhận đã nhận hàng (Chuyển sang DELIVERED & PAID)
  const handleConfirmReceived = async (orderId) => {
    if (!window.confirm(`Xác nhận bạn đã nhận được hàng và thanh toán đầy đủ cho đơn hàng #${orderId}?`)) return;
    try {
      await confirmOrderReceived(orderId);
      toast.success(`Đã xác nhận nhận hàng và thanh toán thành công cho đơn #${orderId}!`);
      fetchOrders();
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, orderStatus: 'delivered', paymentStatus: 'paid' } : null);
      }
    } catch (err) {
      console.error('Lỗi xác nhận nhận hàng:', err);
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message || 'Lỗi khi xác nhận nhận hàng!');
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
          <div className="orders-empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
            <Lock size={44} color="#94a3b8" />
          </div>
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
            <ArrowLeft size={16} /> Cửa hàng
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
          Đang giao hàng ({orders.filter((o) => {
            const s = (o.orderStatus || '').toLowerCase();
            return s === 'shipping' || s === 'shipped';
          }).length})
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
          Đã hủy ({orders.filter((o) => (o.orderStatus || '').toLowerCase() === 'cancelled').length})
        </button>
        <button
          type="button"
          className={`orders-tab-btn ${activeTab === 'returned' ? 'active' : ''}`}
          onClick={() => setActiveTab('returned')}
        >
          Trả hàng / Hoàn tiền ({orders.filter((o) => {
            const os = (o.orderStatus || '').toLowerCase();
            const ps = (o.paymentStatus || '').toLowerCase();
            const rs = (o.returnStatus || '').toLowerCase();
            return os === 'returned' || Boolean(rs) || ps === 'refunded';
          }).length})
        </button>
      </div>

      {/* Danh sách đơn hàng */}
      {ordersError ? (
        <div className="orders-empty-wrap" role="alert">
          <div className="orders-empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
            <AlertTriangle size={44} color="#f59e0b" />
          </div>
          <h2 className="orders-empty-title">Không thể tải lịch sử đơn hàng</h2>
          <p className="orders-empty-desc orders-error-details">{ordersError}</p>
          <button type="button" onClick={() => fetchOrders()} className="orders-empty-btn">
            Thử tải lại
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="orders-empty-wrap">
          <div className="orders-empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
            <Package size={44} color="#94a3b8" />
          </div>
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
            const latestStatus = getLatestOrderStatus(order);
            const StatusIcon = latestStatus.icon;
            const isCod = order.paymentMethod?.toUpperCase() === 'COD';
            const canRepay = order.orderStatus === 'pending' && order.paymentStatus !== 'paid' && !isCod;
            const isReturnedOrRefunding = ['pending', 'return_approved', 'goods_received', 'completed', 'refunded'].includes((order.returnStatus || '').toLowerCase()) || (order.orderStatus || '').toLowerCase() === 'returned';
            const oStatus = (order.orderStatus || '').toLowerCase();
            const pStatus = (order.paymentStatus || '').toLowerCase();
            const canReview = !isReturnedOrRefunding &&
              ['confirmed', 'delivered', 'completed'].includes(oStatus) &&
              (pStatus === 'paid' || oStatus === 'delivered' || oStatus === 'completed');

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
                    <span
                      className={`badge-status ${latestStatus.class}`}
                      style={{
                        backgroundColor: latestStatus.bg,
                        color: '#ffffff',
                        fontWeight: 800,
                        border: 'none',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
                        letterSpacing: '0.02em'
                      }}
                    >
                      {StatusIcon && <StatusIcon size={14} />}
                      {latestStatus.label}
                    </span>
                    <span className={`badge-method ${isCod ? 'cod' : 'payos'}`} style={{ fontSize: '0.72rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      {isCod ? <><Banknote size={12} /> COD</> : <><CreditCard size={12} /> PayOS</>}
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
                            <Package size={20} />
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
                        Mã ưu đãi: {order.discountCode}
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
                          onClick={() => handleOpenReviewModal(order)}
                          className="btn-order-view"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: '#fffbeb',
                            color: '#b45309',
                            borderColor: '#fde68a',
                            fontWeight: '600'
                          }}
                        >
                          <Star size={14} fill="#f59e0b" color="#f59e0b" /> Đánh giá
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="btn-order-view"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={14} /> Chi tiết
                      </button>

                      {(order.orderStatus?.toLowerCase() === 'shipping' || order.orderStatus?.toLowerCase() === 'shipped') && (
                        <button
                          type="button"
                          onClick={() => handleConfirmReceived(order.orderId)}
                          className="btn-order-received"
                          style={{
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            fontWeight: 600,
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.85rem'
                          }}
                        >
                          <CheckCircle2 size={14} /> Đã nhận hàng
                        </button>
                      )}


                      {order.canReturn && order.returnStatus !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => {
                            setOrderToReturn(order);
                            setReturnReasonType('Hàng bị lỗi hoặc hư hại do vận chuyển');
                            setReturnReasonDetail('');
                            setEvidenceImages([]);
                            setReturnBankName(order.payerBankName || order.returnBankName || (order.payerBankAccount ? 'TPBank' : ''));
                            setReturnBankAccount(order.payerBankAccount || order.returnBankAccount || '');
                            setReturnAccountHolder(order.payerAccountHolder || order.returnAccountHolder || order.recipientName || '');
                          }}
                          className="btn-order-return"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <RotateCcw size={14} /> Trả hàng / Hoàn tiền
                        </button>
                      )}

                      {order.canCancel && (
                        <button
                          type="button"
                          onClick={() => setOrderToCancel(order)}
                          className="btn-order-cancel"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <XCircle size={14} /> Hủy đơn
                        </button>
                      )}

                      {isCod && order.orderStatus === 'pending' && (
                        <div className="cod-pending-tag">
                          <span>Trả tiền mặt khi nhận hàng</span>
                        </div>
                      )}

                      {canRepay && (
                        <button
                          type="button"
                          onClick={() => handleRepay(order.orderId)}
                          disabled={payingOrderId === order.orderId}
                          className="btn-order-pay"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <CreditCard size={14} /> {payingOrderId === order.orderId ? 'Đang mở PayOS...' : 'Thanh toán PayOS'}
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
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Thông tin giao hàng */}
            <div className="order-detail-section">
              <div className="order-detail-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} /> Địa chỉ nhận hàng
              </div>
              <div className="order-detail-address-box">
                <div><strong>Người nhận:</strong> {selectedOrder.recipientName}</div>
                <div><strong>Số điện thoại:</strong> {selectedOrder.phone}</div>
                <div><strong>Địa chỉ:</strong> {selectedOrder.addressLine}, {selectedOrder.city}</div>
              </div>
            </div>

            {/* Danh sách sản phẩm */}
            <div className="order-detail-section">
              <div className="order-detail-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShoppingBag size={16} /> Sản phẩm đã đặt ({selectedOrder.itemCount} món)
              </div>
              <div>
                {selectedOrder.items?.map((item) => (
                  <div key={item.orderItemId} className="order-item-row">
                    <div className="order-item-left">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="order-item-thumb" />
                      ) : (
                        <div className="order-item-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                          <Package size={20} />
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
                <span>Phương thức thanh toán:</span>
                <span style={{ fontWeight: '700', color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {selectedOrder.paymentMethod?.toUpperCase() === 'COD' ? <><Banknote size={14} /> Thanh toán khi nhận hàng (COD)</> : <><CreditCard size={14} /> Cổng thanh toán PayOS</>}
                </span>
              </div>
              <div className="order-detail-summary-row" style={{ marginTop: '4px' }}>
                <span>Trạng thái đơn hàng:</span>
                <span style={{ fontWeight: '700', color: getLatestOrderStatus(selectedOrder).bg, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {(() => {
                    const st = getLatestOrderStatus(selectedOrder);
                    const IconComp = st.icon;
                    return <>{IconComp && <IconComp size={14} />} {st.label}</>;
                  })()}
                </span>
              </div>
              <div className="order-detail-summary-row" style={{ marginTop: '4px' }}>
                <span>Trạng thái thanh toán:</span>
                <span style={{ fontWeight: '700', color: getPaymentStatusDisplay(selectedOrder).color, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {(() => {
                    const pay = getPaymentStatusDisplay(selectedOrder);
                    const PayIcon = pay.icon;
                    return <>{PayIcon && <PayIcon size={14} />} {pay.label}</>;
                  })()}
                </span>
              </div>
              {/* Thông báo tiến trình hoàn hàng & hoàn tiền cho khách hàng */}
              {(() => {
                const selR = (selectedOrder.returnStatus || '').toLowerCase();
                const selP = (selectedOrder.paymentStatus || '').toLowerCase();
                const isCompleted = selR === 'completed' || selR === 'refunded' || selR === 'approved' || selP === 'refunded';

                if (isCompleted && selectedOrder.orderStatus?.toLowerCase() !== 'cancelled') {
                  return (
                    <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: '700', color: '#166534', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={15} /> Hoàn tất: Đã hoàn hàng & hoàn tiền thành công
                      </div>
                      <div style={{ color: '#15803d', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        Toàn bộ quy trình hoàn trả đã hoàn tất. Tiền hoàn đã được chuyển về tài khoản ngân hàng của bạn.
                      </div>
                    </div>
                  );
                }
                if (selR === 'pending') {
                  return (
                    <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: '700', color: '#b45309', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={15} /> Bước 1: Yêu cầu trả hàng đang chờ shop xét duyệt
                      </div>
                      <div style={{ color: '#92400e', fontSize: '0.8rem' }}>
                        Cửa hàng đang kiểm tra lý do và bằng chứng bạn cung cấp. Shop sẽ thông báo cho bạn ngay khi có kết quả.
                      </div>
                    </div>
                  );
                }
                if (selR === 'return_approved') {
                  return (
                    <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: '700', color: '#0369a1', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Truck size={15} /> Bước 2: Shop đã đồng ý trả hàng - Vui lòng gửi hàng về shop
                      </div>
                      <div style={{ color: '#0c4a6e', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        Vui lòng đóng gói sản phẩm cẩn thận và gửi về địa chỉ shop (ghi rõ mã đơn #{selectedOrder.orderId}). Khi nhận và kiểm tra kiện hàng, shop sẽ tiến hành hoàn tiền cho bạn.
                      </div>
                    </div>
                  );
                }
                if (selR === 'goods_received') {
                  return (
                    <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#faf5ff', borderRadius: '8px', border: '1px solid #e9d5ff', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: '700', color: '#7e22ce', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Package size={15} /> Bước 3: Shop đã nhận hàng hoàn - Đang tiến hành hoàn tiền
                      </div>
                      <div style={{ color: '#581c87', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        Shop đã tiếp nhận kiện hàng hoàn, kiểm tra hàng hợp lệ và đã nhập lại kho thành công. Tiền đang được chuyển hoàn về tài khoản ngân hàng của bạn.
                      </div>
                    </div>
                  );
                }
                if (selR === 'rejected') {
                  return (
                    <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: '700', color: '#991b1b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <XCircle size={15} /> Yêu cầu hoàn tiền đã bị từ chối
                      </div>
                      <div style={{ color: '#b91c1c' }}>
                        {selectedOrder.returnReason ? selectedOrder.returnReason : 'Đơn hàng không đáp ứng điều kiện hoàn trả.'} (Đơn hàng này không thể gửi lại yêu cầu hoàn tiền)
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              {selectedOrder.returnEvidenceImages && (
                <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: '700', color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Camera size={15} color="#0284c7" /> Ảnh bằng chứng bạn đã gửi:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedOrder.returnEvidenceImages.split(',').filter(Boolean).map((img, idx) => (
                      <div
                        key={idx}
                        style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                        onClick={() => setPreviewImageModalUrl(img)}
                        title="Nhấn để phóng to ảnh"
                      >
                        <img
                          src={img}
                          alt={`Bằng chứng ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              {(() => {
                const isReturnedOrRefunding = ['pending', 'return_approved', 'goods_received', 'completed', 'refunded'].includes((selectedOrder.returnStatus || '').toLowerCase()) || (selectedOrder.orderStatus || '').toLowerCase() === 'returned';
                const oStatus = (selectedOrder.orderStatus || '').toLowerCase();
                const pStatus = (selectedOrder.paymentStatus || '').toLowerCase();
                const canReviewSelected = !isReturnedOrRefunding &&
                  ['confirmed', 'delivered', 'completed'].includes(oStatus) &&
                  (pStatus === 'paid' || oStatus === 'delivered' || oStatus === 'completed');
                if (canReviewSelected) {
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        const targetOrder = selectedOrder;
                        setSelectedOrder(null);
                        handleOpenReviewModal(targetOrder);
                      }}
                      style={{ padding: '8px 18px', backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Star size={16} fill="#f59e0b" color="#f59e0b" /> Đánh giá đơn hàng
                    </button>
                  );
                }
                return null;
              })()}
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
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <XCircle size={20} color="#dc2626" /> Xác nhận hủy đơn hàng #{orderToCancel.orderId}
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
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '520px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RotateCcw size={20} color="#b45309" /> Yêu cầu trả hàng & hoàn tiền
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Đơn hàng #{orderToReturn.orderId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOrderToReturn(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
              >
                <X size={20} />
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

            {/* Thông tin tài khoản nhận hoàn tiền */}
            <div style={{ backgroundColor: '#f0fdf4', padding: '14px 16px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={16} /> Tài khoản nhận tiền hoàn (Chuyển khoản)
                </div>
                {Boolean(orderToReturn.payerBankAccount) && (
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Lock size={11} /> Cố định theo tài khoản thanh toán
                  </span>
                )}
              </div>
              {orderToReturn.payerBankAccount ? (
                <div style={{ fontSize: '0.78rem', color: '#15803d', marginBottom: '10px', lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <Lock size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Hệ thống sẽ tự động hoàn tiền trực tiếp về tài khoản ngân hàng bạn đã dùng để thanh toán đơn hàng này (không thể thay đổi để đảm bảo an toàn giao dịch).</span>
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '10px' }}>
                  Vui lòng cung cấp thông tin tài khoản ngân hàng để nhận tiền hoàn qua chuyển khoản.
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    <span>Tên Ngân Hàng</span>
                    {Boolean(orderToReturn.payerBankAccount) && <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>(<Lock size={10} /> Khóa)</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="VD: TPBank, Vietcombank, MBBank..."
                    value={returnBankName}
                    readOnly={Boolean(orderToReturn.payerBankAccount)}
                    disabled={Boolean(orderToReturn.payerBankAccount)}
                    onChange={(e) => setReturnBankName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                      backgroundColor: orderToReturn.payerBankAccount ? '#f1f5f9' : '#ffffff',
                      color: orderToReturn.payerBankAccount ? '#334155' : '#0f172a',
                      cursor: orderToReturn.payerBankAccount ? 'not-allowed' : 'text',
                      fontWeight: orderToReturn.payerBankAccount ? '600' : 'normal'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                    <span>Số Tài Khoản</span>
                    {Boolean(orderToReturn.payerBankAccount) && <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>(<Lock size={10} /> Khóa)</span>}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={25}
                    placeholder="VD: 0987654321"
                    value={returnBankAccount}
                    readOnly={Boolean(orderToReturn.payerBankAccount)}
                    disabled={Boolean(orderToReturn.payerBankAccount)}
                    onChange={(e) => setReturnBankAccount(e.target.value.replace(/[^0-9]/g, ''))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                      backgroundColor: orderToReturn.payerBankAccount ? '#f1f5f9' : '#ffffff',
                      color: orderToReturn.payerBankAccount ? '#334155' : '#0f172a',
                      cursor: orderToReturn.payerBankAccount ? 'not-allowed' : 'text',
                      fontWeight: orderToReturn.payerBankAccount ? '700' : 'normal',
                      letterSpacing: orderToReturn.payerBankAccount ? '0.5px' : 'normal'
                    }}
                  />
                  {!orderToReturn.payerBankAccount && (
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                      * Nhập từ 6 đến 25 chữ số
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  <span>Tên Chủ Tài Khoản</span>
                  {Boolean(orderToReturn.payerBankAccount) && <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>(<Lock size={10} /> Khóa)</span>}
                </label>
                <input
                  type="text"
                  placeholder="VD: NGUYEN VAN A"
                  value={returnAccountHolder}
                  readOnly={Boolean(orderToReturn.payerBankAccount)}
                  disabled={Boolean(orderToReturn.payerBankAccount)}
                  onChange={(e) => setReturnAccountHolder(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                    backgroundColor: orderToReturn.payerBankAccount ? '#f1f5f9' : '#ffffff',
                    color: orderToReturn.payerBankAccount ? '#334155' : '#0f172a',
                    cursor: orderToReturn.payerBankAccount ? 'not-allowed' : 'text',
                    fontWeight: orderToReturn.payerBankAccount ? '600' : 'normal'
                  }}
                />
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
            <div style={{ marginBottom: '18px' }}>
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

            {/* Tải ảnh bằng chứng */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={16} color="#0284c7" />
                  <span>Ảnh chụp bằng chứng (Hư hại / Sai hàng / Lỗi SP):</span>
                </label>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  {evidenceImages.length}/5 ảnh
                </span>
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                Khuyến khích tải ảnh chụp rõ tình trạng sản phẩm, tem mác hoặc bưu phẩm để shop kiểm tra và duyệt nhanh nhất.
              </p>

              {/* Input file ẩn */}
              <input
                type="file"
                ref={evidenceFileInputRef}
                multiple
                accept="image/*"
                onChange={handleUploadEvidenceFiles}
                style={{ display: 'none' }}
              />

              {/* Danh sách ảnh & Nút thêm ảnh */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                {evidenceImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      width: '74px',
                      height: '74px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1.5px solid #cbd5e1',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`Bằng chứng ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => setPreviewImageModalUrl(imgUrl)}
                      title="Nhấn để phóng to ảnh"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidenceImage(idx)}
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                      title="Xóa ảnh này"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {evidenceImages.length < 5 && (
                  <button
                    type="button"
                    onClick={() => evidenceFileInputRef.current?.click()}
                    disabled={uploadingEvidence}
                    style={{
                      width: '74px',
                      height: '74px',
                      borderRadius: '8px',
                      border: '2px dashed #0284c7',
                      backgroundColor: '#f0f9ff',
                      color: '#0284c7',
                      cursor: uploadingEvidence ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      opacity: uploadingEvidence ? 0.7 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {uploadingEvidence ? (
                      <>
                        <Clock size={16} />
                        <span>Đang tải...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span>Tải ảnh</span>
                      </>
                    )}
                  </button>
                )}
              </div>
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

      {/* MODAL 4: Phóng To Ảnh Bằng Chứng (Lightbox) */}
      {previewImageModalUrl && (
        <div
          onClick={() => setPreviewImageModalUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
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
              onClick={() => setPreviewImageModalUrl(null)}
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
              src={previewImageModalUrl}
              alt="Ảnh bằng chứng phóng to"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                borderRadius: '8px',
                objectFit: 'contain',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
              }}
            />
            <div style={{ marginTop: '10px', color: '#e2e8f0', fontSize: '0.85rem' }}>
              Nhấn ra ngoài hoặc bấm nút đóng để thoát xem ảnh
            </div>
          </div>
        </div>
      )}
      {/* MODAL 4: Đánh Giá Sản Phẩm */}
      {orderToReview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px' }}>
          <div className="order-detail-modal-card" style={{ maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star size={22} fill="#f59e0b" color="#f59e0b" /> Đánh Giá Đơn Hàng #{orderToReview.orderId}
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Chia sẻ nhận xét chân thực của bạn để giúp Fashion Store nâng cao chất lượng dịch vụ!
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOrderToReview(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            {loadingReviewItems ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <Clock size={28} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
                <p>Đang tải danh sách sản phẩm để đánh giá...</p>
              </div>
            ) : reviewItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                <AlertCircle size={36} color="#d97706" style={{ margin: '0 auto 10px auto' }} />
                <h4 style={{ margin: '0 0 6px 0', color: '#0f172a' }}>Không có sản phẩm nào khả dụng để đánh giá</h4>
                <p style={{ fontSize: '0.85rem' }}>Đơn hàng này có thể đã được hoàn trả hoặc chưa hoàn tất.</p>
                <button
                  type="button"
                  onClick={() => setOrderToReview(null)}
                  style={{ marginTop: '12px', padding: '6px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Đóng
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {reviewItems.map((item) => {
                  const currentRating = reviewRatings[item.orderItemId] || 5;
                  const currentHover = hoverRatingMap[item.orderItemId] || 0;
                  const activeRating = currentHover || currentRating;
                  const isSubmitted = item.rating != null;
                  const isBusy = submittingReviewMap[item.orderItemId] || false;

                  const ratingTexts = {
                    1: '1/5 - Rất tệ',
                    2: '2/5 - Không hài lòng',
                    3: '3/5 - Bình thường',
                    4: '4/5 - Hài lòng',
                    5: '5/5 - Rất tuyệt vời'
                  };

                  return (
                    <div
                      key={item.orderItemId}
                      style={{
                        padding: '16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        backgroundColor: isSubmitted ? '#f8fafc' : '#ffffff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                      }}
                    >
                      {/* Sản phẩm info */}
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'center' }}>
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          />
                        ) : (
                          <div style={{ width: '56px', height: '56px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            <Package size={24} />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#0f172a', fontWeight: '700' }}>
                            {item.productName}
                          </h4>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {[item.color && `Màu: ${formatColor(item.color)}`, item.size && `Size: ${item.size}`, item.quantity && `SL: ${item.quantity}`].filter(Boolean).join(' • ')}
                          </div>
                        </div>
                        {isSubmitted && (
                          <span style={{ fontSize: '0.75rem', padding: '3px 8px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: '600', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> Đã đánh giá
                          </span>
                        )}
                      </div>

                      {/* Chọn số sao */}
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                          Chất lượng sản phẩm:
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => setReviewRatings(prev => ({ ...prev, [item.orderItemId]: star }))}
                                onMouseEnter={() => !isSubmitted && setHoverRatingMap(prev => ({ ...prev, [item.orderItemId]: star }))}
                                onMouseLeave={() => !isSubmitted && setHoverRatingMap(prev => ({ ...prev, [item.orderItemId]: 0 }))}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '2px',
                                  cursor: isSubmitted ? 'default' : 'pointer',
                                  transition: 'transform 0.1s'
                                }}
                              >
                                <Star
                                  size={24}
                                  fill={star <= activeRating ? '#f59e0b' : 'none'}
                                  color={star <= activeRating ? '#f59e0b' : '#cbd5e1'}
                                />
                              </button>
                            ))}
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: activeRating >= 4 ? '#059669' : activeRating === 3 ? '#d97706' : '#dc2626' }}>
                            {ratingTexts[activeRating]}
                          </span>
                        </div>
                      </div>

                      {/* Nhận xét */}
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                          Nhận xét chi tiết:
                        </label>
                        {isSubmitted ? (
                          <div style={{ padding: '10px 12px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.85rem', color: '#334155', fontStyle: item.comment ? 'normal' : 'italic' }}>
                            {item.comment || 'Không có nhận xét bằng chữ.'}
                          </div>
                        ) : (
                          <textarea
                            rows={3}
                            value={reviewComments[item.orderItemId] || ''}
                            onChange={(e) => setReviewComments(prev => ({ ...prev, [item.orderItemId]: e.target.value }))}
                            placeholder="Hãy chia sẻ trải nghiệm về sản phẩm, chất liệu, form dáng, độ vừa vặn để giúp người mua khác..."
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.85rem',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        )}
                      </div>

                      {/* Action */}
                      {!isSubmitted && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleSubmitItemReview(item.orderItemId)}
                            style={{
                              padding: '8px 18px',
                              backgroundColor: '#b45309',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                              cursor: isBusy ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            {isBusy ? <Clock size={14} className="animate-spin" /> : <Star size={14} fill="#ffffff" />}
                            {isBusy ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const oid = orderToReview.orderId;
                      setOrderToReview(null);
                      navigate(`/shop/reviews?orderId=${oid}`);
                    }}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                  >
                    Mở trang đánh giá tập trung →
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderToReview(null)}
                    style={{ padding: '8px 20px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
