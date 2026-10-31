import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { getInboundOrders, getInboundOrderDetail, createInboundOrder, getInboundBatches, getInboundStats } from '../services/inboundService';
import { getProducts } from '../services/productService';
import { getVariants } from '../services/variantService';
import { getCategories } from '../services/categoryService';

// Helper functions for date handling (local time)
const getLocalDateTimeString = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getTodayStartString = () => {
  const pad = (n) => String(n).padStart(2, '0');
  const date = new Date();
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}T00:00`;
};

export default function ManageInbound() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'batches'

  // Data states
  const [orders, setOrders] = useState([]);
  const [batches, setBatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [allVariants, setAllVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalDataLoading, setModalDataLoading] = useState(false);
  const [stats, setStats] = useState({ totalOrders: 0, totalBatches: 0, activeBatches: 0, depletedBatches: 0, totalRemainingStock: 0 });

  // Pagination for Batches tab
  const [batchPage, setBatchPage] = useState(1);
  const [batchPageSize, setBatchPageSize] = useState(25);

  // Filters for Orders tab
  const [orderSearch, setOrderSearch] = useState('');
  const [orderCategoryFilter, setOrderCategoryFilter] = useState('');

  // Filters for Batches tab
  const [batchSearch, setBatchSearch] = useState('');
  const [batchStatusFilter, setBatchStatusFilter] = useState('');
  const [batchCategoryFilter, setBatchCategoryFilter] = useState('');

  // Modal Create Inbound Order
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    batchCode: '',
    categoryId: '',
    supplierName: '',
    importDate: getLocalDateTimeString(),
    note: '',
    items: [
      { productId: '', variantId: '', quantity: 10, importPrice: 150000 }
    ]
  });

  // Modal Detail Order
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load Categories, stats, products & variants on mount
  useEffect(() => {
    loadCategories();
    loadStats();
    loadProducts();
    loadVariants();
  }, []);

  // Reset pagination when Batches filters change
  useEffect(() => {
    setBatchPage(1);
  }, [batchSearch, batchStatusFilter, batchCategoryFilter]);

  // Reload data when switching tabs or filter changes
  useEffect(() => {
    if (activeTab === 'orders') {
      loadInboundOrders();
    } else {
      loadInboundBatches(false);
    }
  }, [activeTab, orderSearch, orderCategoryFilter, batchSearch, batchStatusFilter, batchCategoryFilter]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error loading categories:', err);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getInboundStats();
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.warn('Error loading inbound stats:', err);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error loading products:', err);
    }
  };

  const loadVariants = async () => {
    try {
      const data = await getVariants();
      setAllVariants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error loading variants:', err);
    }
  };

  const loadInboundOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (orderSearch) params.keyword = orderSearch;
      if (orderCategoryFilter) params.categoryId = orderCategoryFilter;
      const data = await getInboundOrders(params);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading inbound orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadInboundBatches = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = {};
      if (batchSearch) params.keyword = batchSearch;
      if (batchStatusFilter) params.status = batchStatusFilter;
      if (batchCategoryFilter) params.categoryId = batchCategoryFilter;
      const data = await getInboundBatches(params);
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading batches:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleOpenDetail = async (orderId) => {
    setDetailLoading(true);
    setIsDetailModalOpen(true);
    try {
      const data = await getInboundOrderDetail(orderId);
      setSelectedOrder(data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      if (toast) toast.error('Không thể tải chi tiết đợt nhập: ' + msg);
      else alert('Không thể tải chi tiết đợt nhập: ' + msg);
      setIsDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const generateUniqueBatchCode = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const rand = Math.floor(100 + Math.random() * 900);
    return `LO-${dateStr}-${rand}`;
  };

  const handleOpenCreateModal = async () => {
    const needProducts = products.length === 0;
    const needVariants = allVariants.length === 0;
    if (needProducts || needVariants) {
      setModalDataLoading(true);
      await Promise.all([
        needProducts ? loadProducts() : Promise.resolve(),
        needVariants ? loadVariants() : Promise.resolve()
      ]);
      setModalDataLoading(false);
    }
    const defaultCode = generateUniqueBatchCode();
    setFormData({
      batchCode: defaultCode,
      categoryId: '',
      supplierName: 'Nhà cung cấp Việt Nam',
      importDate: getLocalDateTimeString(),
      note: 'Nhập hàng mới theo đợt',
      items: [
        { productId: '', variantId: '', quantity: 20, importPrice: 200000 }
      ]
    });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleGenerateBatchCode = () => {
    setFormData(prev => ({ ...prev, batchCode: generateUniqueBatchCode() }));
  };

  // When changing category in create modal, clear any selected products that don't belong to the new category
  const handleCategoryChange = (newCatId) => {
    setFormData(prev => {
      let updatedItems = prev.items;
      if (newCatId) {
        updatedItems = prev.items.map(it => {
          if (!it.productId) return it;
          const prod = products.find(p => String(p.productId) === String(it.productId));
          if (prod && String(prod.categoryId) !== String(newCatId)) {
            return { ...it, productId: '', variantId: '' };
          }
          return it;
        });
      }
      return {
        ...prev,
        categoryId: newCatId,
        items: updatedItems
      };
    });
  };

  // Dynamic Item row handlers in Create Modal
  const handleAddItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { productId: '', variantId: '', quantity: 10, importPrice: 150000 }
      ]
    }));
  };

  const handleRemoveItemRow = (index) => {
    if (formData.items.length <= 1) {
      if (toast) toast.warning('Đợt nhập phải có ít nhất 1 mặt hàng!');
      else alert('Đợt nhập phải có ít nhất 1 mặt hàng!');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };

      // If user changes productId, reset variantId
      if (field === 'productId') {
        newItems[index].variantId = '';
      }
      return { ...prev, items: newItems };
    });
  };

  const handleSubmitInbound = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.batchCode || !formData.batchCode.trim()) {
      setFormError('Vui lòng nhập mã đợt nhập / mã lô!');
      return;
    }
    const cleanBatchCode = formData.batchCode.trim().toUpperCase();
    if (cleanBatchCode.length > 50) {
      setFormError('Mã đợt nhập không được vượt quá 50 ký tự!');
      return;
    }
    if (!/^[A-Z0-9_-]+$/.test(cleanBatchCode)) {
      setFormError('Mã đợt nhập chỉ được chứa chữ cái, số, dấu gạch ngang (-) hoặc gạch dưới (_) !');
      return;
    }
    if (!formData.supplierName || !formData.supplierName.trim()) {
      setFormError('Vui lòng nhập tên nhà cung cấp!');
      return;
    }
    if (formData.supplierName.trim().length > 150) {
      setFormError('Tên nhà cung cấp không được vượt quá 150 ký tự!');
      return;
    }
    if (formData.note && formData.note.trim().length > 500) {
      setFormError('Ghi chú đợt nhập không được vượt quá 500 ký tự!');
      return;
    }

    if (formData.importDate) {
      const chosenDate = new Date(formData.importDate);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      if (chosenDate < todayStart) {
        setFormError('Ngày nhập kho không hợp lệ! Chỉ cho phép tạo phiếu nhập kho trong ngày hôm nay hoặc tương lai.');
        return;
      }
    }

    const seenVariants = new Set();
    for (let i = 0; i < formData.items.length; i++) {
      const it = formData.items[i];
      if (!it.productId || !it.variantId) {
        setFormError(`Dòng #${i + 1}: Vui lòng chọn sản phẩm và phân loại (biến thể)!`);
        return;
      }
      if (seenVariants.has(String(it.variantId))) {
        setFormError(`Dòng #${i + 1}: Biến thể này đã được chọn ở một dòng khác! Vui lòng gộp số lượng vào 1 dòng.`);
        return;
      }
      seenVariants.add(String(it.variantId));

      const qty = Number(it.quantity);
      if (!qty || qty <= 0 || !Number.isInteger(qty)) {
        setFormError(`Dòng #${i + 1}: Số lượng nhập phải là số nguyên lớn hơn 0!`);
        return;
      }
      if (qty > 100000) {
        setFormError(`Dòng #${i + 1}: Số lượng nhập mỗi mặt hàng tối đa là 100.000 sản phẩm!`);
        return;
      }

      const price = Number(it.importPrice);
      if (it.importPrice === '' || isNaN(price) || price < 0) {
        setFormError(`Dòng #${i + 1}: Giá nhập không được âm!`);
        return;
      }
      if (price > 1000000000) {
        setFormError(`Dòng #${i + 1}: Giá nhập tối đa là 1.000.000.000 đ!`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        batchCode: formData.batchCode.trim(),
        categoryId: formData.categoryId ? Number(formData.categoryId) : null,
        supplierName: formData.supplierName.trim(),
        importDate: formData.importDate ? formData.importDate : null,
        note: formData.note,
        items: formData.items.map(it => ({
          variantId: Number(it.variantId),
          quantity: Number(it.quantity),
          importPrice: Number(it.importPrice)
        }))
      };

      await createInboundOrder(payload);
      if (toast) toast.success('Tạo đợt nhập kho thành công! Hàng đã được ghi nhận vào lô và cộng tồn kho.');
      else alert('Tạo đợt nhập kho thành công! Hàng đã được ghi nhận vào lô và cộng tồn kho.');
      setIsCreateModalOpen(false);
      loadStats();
      if (activeTab === 'orders') {
        loadInboundOrders();
      } else {
        loadInboundBatches();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data || err.message || 'Lỗi khi tạo đợt nhập kho');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper calculation for Create Modal summary
  const totalModalQuantity = formData.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const totalModalAmount = formData.items.reduce((sum, it) => sum + ((Number(it.quantity) || 0) * (Number(it.importPrice) || 0)), 0);

  // Batch summary metrics
  const activeBatchesCount = batches.filter(b => b.status === 'ACTIVE').length;
  const depletedBatchesCount = batches.filter(b => b.status === 'DEPLETED').length;
  const totalRemainingStock = batches.reduce((sum, b) => sum + (b.remainingQuantity || 0), 0);

  return (
    <main>
      <Header
        title="Quản Lý Nhập Kho & Lô Hàng (FIFO)"
        subtitle="Đánh lô nhập theo từng đợt, ghi nhận danh mục & giá vốn chi tiết, xuất bán tự động theo FIFO (Hết hàng cũ mới bán lô mới)"
        isLive={true}
        onRefresh={() => {
          loadStats();
          if (activeTab === 'orders') loadInboundOrders();
          else loadInboundBatches();
        }}
      />

      {/* Stats Summary Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#6366f1' }}>📋</div>
          <div>
            <div className="stat-val">{stats.totalOrders ?? orders.length}</div>
            <div className="stat-label">Tổng Đợt Nhập Kho</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#10b981' }}>🟢</div>
          <div>
            <div className="stat-val">{stats.activeBatches ?? (batches.length ? activeBatchesCount : 0)}</div>
            <div className="stat-label">Lô Đang Xuất Bán (FIFO)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#3b82f6' }}>📦</div>
          <div>
            <div className="stat-val">{(stats.totalRemainingStock ?? (batches.length ? totalRemainingStock : 0)).toLocaleString('vi-VN')}</div>
            <div className="stat-label">Tổng Tồn Kho Trong Lô (Cái)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#ef4444' }}>🏁</div>
          <div>
            <div className="stat-val">{stats.depletedBatches ?? (batches.length ? depletedBatchesCount : 0)}</div>
            <div className="stat-label">Lô Đã Xuất Hết Hàng</div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '12px 22px',
            borderRadius: '10px',
            border: activeTab === 'orders' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            background: activeTab === 'orders' ? 'var(--primary-gradient)' : '#ffffff',
            color: activeTab === 'orders' ? '#ffffff' : 'var(--text-main)',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'orders' ? 'var(--shadow-glow)' : 'var(--shadow-card)',
            fontSize: '0.92rem',
            transition: 'all 0.2s'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
          Danh Sách Đợt Nhập Kho ({stats.totalOrders || orders.length})
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          style={{
            padding: '12px 22px',
            borderRadius: '10px',
            border: activeTab === 'batches' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            background: activeTab === 'batches' ? 'var(--primary-gradient)' : '#ffffff',
            color: activeTab === 'batches' ? '#ffffff' : 'var(--text-main)',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'batches' ? 'var(--shadow-glow)' : 'var(--shadow-card)',
            fontSize: '0.92rem',
            transition: 'all 0.2s'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
          Theo Dõi Từng Lô Hàng FIFO ({stats.totalBatches || batches.length})
        </button>
      </div>

      {/* TAB 1: INBOUND ORDERS */}
      {activeTab === 'orders' && (
        <div>
          {/* Toolbar Filters & Action */}
          <div className="toolbar-card">
            <div className="filter-group">
              <div className="search-input-wrapper">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Tìm mã đợt nhập, nhà cung cấp..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                />
              </div>
              <select
                className="select-control"
                value={orderCategoryFilter}
                onChange={e => setOrderCategoryFilter(e.target.value)}
              >
                <option value="">-- Tất cả danh mục --</option>
                {categories.map(c => (
                  <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                ))}
              </select>
            </div>
            <button 
              className="btn-primary" 
              onClick={handleOpenCreateModal}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Tạo Đợt Nhập Kho Mới
            </button>
          </div>

          {/* Table Orders */}
          <div className="panel-card">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã Đợt Nhập</th>
                    <th>Danh Mục</th>
                    <th>Nhà Cung Cấp</th>
                    <th>Ngày Nhập Kho</th>
                    <th style={{ textAlign: 'center' }}>Số Mặt Hàng</th>
                    <th style={{ textAlign: 'center' }}>Tổng Số Lượng</th>
                    <th style={{ textAlign: 'right' }}>Tổng Giá Vốn</th>
                    <th>Người Thực Hiện</th>
                    <th style={{ textAlign: 'center' }}>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>Đang tải dữ liệu đợt nhập kho...</td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                        Chưa có đợt nhập kho nào. Hãy bấm <strong>"+ Tạo Đợt Nhập Kho Mới"</strong> để bắt đầu.
                      </td>
                    </tr>
                  ) : (
                    orders.map(o => (
                      <tr key={o.inboundOrderId}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: '700', color: '#1f2937', background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontFamily: 'monospace' }}>
                            {o.batchCode}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{o.categoryName || 'Đa danh mục'}</td>
                        <td style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>{o.supplierName || '—'}</td>
                        <td style={{ color: '#4b5563', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                          {o.importDate ? new Date(o.importDate).toLocaleString('vi-VN') : '—'}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '600' }}>{o.totalItems}</td>
                        <td style={{ textAlign: 'center', fontWeight: '700', color: '#2563eb' }}>{o.totalQuantity}</td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: '#059669', whiteSpace: 'nowrap' }}>
                          {Number(o.totalAmount || 0).toLocaleString('vi-VN')} đ
                        </td>
                        <td style={{ color: '#6b7280', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{o.createdByName || 'Hệ thống'}</td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            className="btn-action"
                            onClick={() => handleOpenDetail(o.inboundOrderId)}
                            style={{ margin: '0 auto', whiteSpace: 'nowrap' }}
                          >
                            👁️ Xem Chi Tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BATCHES FIFO TRACKING */}
      {activeTab === 'batches' && (
        <div>
          {/* Toolbar Filters */}
          <div className="toolbar-card">
            <div className="filter-group">
              <div className="search-input-wrapper">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Tìm tên sản phẩm, mã SKU, mã lô..."
                  value={batchSearch}
                  onChange={e => setBatchSearch(e.target.value)}
                />
              </div>
              <select
                className="select-control"
                value={batchStatusFilter}
                onChange={e => setBatchStatusFilter(e.target.value)}
              >
                <option value="">-- Tất cả trạng thái lô --</option>
                <option value="ACTIVE">🟢 Đang xuất bán (Còn hàng)</option>
                <option value="DEPLETED">⚪ Đã bán hết (Hết hàng)</option>
              </select>
              <select
                className="select-control"
                value={batchCategoryFilter}
                onChange={e => setBatchCategoryFilter(e.target.value)}
              >
                <option value="">-- Tất cả danh mục --</option>
                {categories.map(c => (
                  <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                ))}
              </select>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
              <strong>Nguyên tắc FIFO:</strong> Tự động xuất bán lô cũ nhất trước
            </div>
          </div>

          {/* Table Batches */}
          <div className="panel-card">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã Lô Nhập</th>
                    <th>Sản Phẩm & Danh Mục</th>
                    <th>Biến Thể (Size - Màu)</th>
                    <th>Mã SKU</th>
                    <th style={{ textAlign: 'right' }}>Giá Nhập (Vốn)</th>
                    <th style={{ textAlign: 'center' }}>Nhập Ban Đầu</th>
                    <th style={{ textAlign: 'center' }}>Còn Lại</th>
                    <th>Ngày Nhập Kho</th>
                    <th style={{ textAlign: 'center' }}>Trạng Thái FIFO</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>Đang tải danh sách lô hàng...</td>
                    </tr>
                  ) : batches.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                        Không tìm thấy lô hàng nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    batches.slice((batchPage - 1) * batchPageSize, batchPage * batchPageSize).map(b => {
                      const isDepleted = b.status === 'DEPLETED' || b.remainingQuantity === 0;
                      return (
                        <tr key={b.batchId} style={{ opacity: isDepleted ? 0.65 : 1 }}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: '700', color: '#1f2937', background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontFamily: 'monospace' }}>
                              {b.batchCode}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: '600', color: '#111827' }}>{b.productName}</div>
                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{b.categoryName || 'N/A'}</div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'inline-block', padding: '2px 8px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '500', marginRight: '6px' }}>
                              Size {b.size}
                            </span>
                            <span style={{ color: '#4b5563', fontSize: '0.85rem' }}>{b.color}</span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <code style={{ fontSize: '0.85rem', color: '#4b5563' }}>{b.sku}</code>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '600', whiteSpace: 'nowrap' }}>
                            {Number(b.importPrice || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '600' }}>{b.initialQuantity}</td>
                          <td style={{ textAlign: 'center', fontWeight: '700', color: b.remainingQuantity > 0 ? '#2563eb' : '#9ca3af' }}>
                            {b.remainingQuantity}
                          </td>
                          <td style={{ color: '#4b5563', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                            {b.importDate ? new Date(b.importDate).toLocaleString('vi-VN') : '—'}
                          </td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {b.isCurrentFifoActive ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#dcfce7',
                                color: '#15803d',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                border: '1px solid #86efac',
                                whiteSpace: 'nowrap'
                              }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }}></span>
                                Đang Xuất Bán (FIFO)
                              </span>
                            ) : isDepleted ? (
                              <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                ⚪ Đã bán hết
                              </span>
                            ) : (
                              <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                ⏳ Chờ xuất (Lô kế tiếp)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Batches Pagination Footer */}
            {batches.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderTop: '1px solid #e5e7eb',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ fontSize: '0.88rem', color: '#6b7280' }}>
                  Hiển thị <strong>{Math.min((batchPage - 1) * batchPageSize + 1, batches.length)}</strong> - <strong>{Math.min(batchPage * batchPageSize, batches.length)}</strong> trên tổng số <strong>{batches.length.toLocaleString('vi-VN')}</strong> lô hàng
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Mỗi trang:</span>
                  <select
                    value={batchPageSize}
                    onChange={e => {
                      setBatchPageSize(Number(e.target.value));
                      setBatchPage(1);
                    }}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  >
                    <option value={25}>25 lô</option>
                    <option value={50}>50 lô</option>
                    <option value={100}>100 lô</option>
                  </select>
                  <button
                    type="button"
                    className="btn-action"
                    disabled={batchPage <= 1}
                    onClick={() => setBatchPage(p => Math.max(1, p - 1))}
                    style={{ padding: '6px 12px', fontSize: '0.85rem', cursor: batchPage <= 1 ? 'not-allowed' : 'pointer' }}
                  >
                    ◀ Trước
                  </button>
                  <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#374151' }}>
                    {batchPage} / {Math.max(1, Math.ceil(batches.length / batchPageSize))}
                  </span>
                  <button
                    type="button"
                    className="btn-action"
                    disabled={batchPage >= Math.ceil(batches.length / batchPageSize)}
                    onClick={() => setBatchPage(p => Math.min(Math.ceil(batches.length / batchPageSize), p + 1))}
                    style={{ padding: '6px 12px', fontSize: '0.85rem', cursor: batchPage >= Math.ceil(batches.length / batchPageSize) ? 'not-allowed' : 'pointer' }}
                  >
                    Sau ▶
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE INBOUND ORDER */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Tạo Đợt Nhập Kho Mới (Đánh Lô & Giá Vốn)"
          maxWidth="900px"
        >
          <form onSubmit={handleSubmitInbound}>
            {formError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#b91c1c', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                {formError}
              </div>
            )}

            {/* General Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>
                  Mã Lô / Mã Đợt Nhập *
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={formData.batchCode}
                    onChange={e => setFormData({ ...formData, batchCode: e.target.value })}
                    placeholder="VD: LO-20261017-01"
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontFamily: 'monospace', fontWeight: '600' }}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateBatchCode}
                    className="btn-action"
                    style={{ padding: '6px 12px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                    title="Tự sinh mã ngẫu nhiên"
                  >
                    🎲 Tự sinh
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>
                  Nhà Cung Cấp / Đơn Vị Giao *
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={formData.supplierName}
                  onChange={e => setFormData({ ...formData, supplierName: e.target.value })}
                  placeholder="Nhập tên nhà cung cấp..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>
                  Ngày Giờ Nhập Kho *
                </label>
                <input
                  type="datetime-local"
                  required
                  min={getTodayStartString()}
                  value={formData.importDate}
                  onChange={e => setFormData({ ...formData, importDate: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
                <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '0.75rem' }}>
                  Chỉ cho phép chọn thời gian trong ngày hôm nay hoặc tương lai.
                </small>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>
                  Danh Mục Nhập Khẩu (Tùy chọn)
                </label>
                <select
                  value={formData.categoryId}
                  onChange={e => handleCategoryChange(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                >
                  <option value="">-- Đa danh mục / Tự do --</option>
                  {categories.map(c => (
                    <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>
                Ghi Chú Đợt Nhập (Tối đa 500 ký tự)
              </label>
              <input
                type="text"
                maxLength={500}
                value={formData.note}
                onChange={e => setFormData({ ...formData, note: e.target.value })}
                placeholder="Ví dụ: Nhập bổ sung đợt đầu mùa đông, xuất xứ Việt Nam..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
            </div>

            {/* Items List Table */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#111827' }}>
                  Danh Sách Mặt Hàng Trong Lô Nhập ({formData.items.length})
                </h4>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="btn-action"
                  style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Thêm Mặt Hàng
                </button>
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '8px 10px', textAlign: 'left', width: '30%' }}>Sản Phẩm</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', width: '25%' }}>Phân Loại (Biến Thể)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: '15%' }}>Số Lượng</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: '18%' }}>Giá Nhập (VNĐ)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: '12%' }}>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((row, idx) => {
                      // Filter products if category is chosen
                      const filteredProducts = formData.categoryId
                        ? products.filter(p => String(p.categoryId) === String(formData.categoryId))
                        : products;

                      // Filter variants of selected product
                      const availableVariants = row.productId
                        ? allVariants.filter(v => String(v.productId) === String(row.productId))
                        : [];

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '8px 10px' }}>
                            <select
                              required
                              disabled={modalDataLoading}
                              value={row.productId}
                              onChange={e => handleItemChange(idx, 'productId', e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                            >
                              {modalDataLoading ? (
                                <option value="">⏳ Đang tải sản phẩm...</option>
                              ) : (
                                <>
                                  <option value="">-- Chọn sản phẩm --</option>
                                  {filteredProducts.map(p => (
                                    <option key={p.productId} value={p.productId}>{p.name}</option>
                                  ))}
                                </>
                              )}
                            </select>
                          </td>

                          <td style={{ padding: '8px 10px' }}>
                            <select
                              required
                              disabled={!row.productId || availableVariants.length === 0}
                              value={row.variantId}
                              onChange={e => handleItemChange(idx, 'variantId', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.85rem',
                                backgroundColor: (!row.productId || availableVariants.length === 0) ? '#f3f4f6' : '#ffffff'
                              }}
                            >
                              {!row.productId ? (
                                <option value="">-- Vui lòng chọn sản phẩm trước --</option>
                              ) : availableVariants.length === 0 ? (
                                <option value="">⚠️ Sản phẩm chưa có biến thể (Tạo ở trang Biến thể)</option>
                              ) : (
                                <>
                                  <option value="">-- Chọn Size / Màu --</option>
                                  {availableVariants.map(v => (
                                    <option key={v.variantId} value={v.variantId}>
                                      Size {v.size} - {v.color} ({v.sku})
                                    </option>
                                  ))}
                                </>
                              )}
                            </select>
                          </td>

                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <input
                              type="number"
                              required
                              min="1"
                              max="100000"
                              value={row.quantity}
                              onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                              style={{ width: '80px', padding: '6px 8px', borderRadius: '4px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '0.85rem' }}
                            />
                          </td>

                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                            <input
                              type="number"
                              required
                              min="0"
                              max="1000000000"
                              step="1000"
                              value={row.importPrice}
                              onChange={e => handleItemChange(idx, 'importPrice', e.target.value)}
                              style={{ width: '120px', padding: '6px 8px', borderRadius: '4px', border: '1px solid #d1d5db', textAlign: 'right', fontSize: '0.85rem' }}
                            />
                          </td>

                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                              title="Xóa mặt hàng này"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Summary Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Tổng số lượng nhập: </span>
                <strong style={{ fontSize: '1rem', color: '#1e293b' }}>{totalModalQuantity} chiếc</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Tổng giá trị đợt nhập: </span>
                <strong style={{ fontSize: '1.2rem', color: '#059669', marginLeft: '6px' }}>
                  {totalModalAmount.toLocaleString('vi-VN')} đ
                </strong>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-action"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ minWidth: '150px' }}
              >
                {submitting ? 'Đang Nhập Kho...' : 'Xác Nhận Nhập Kho'}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL 2: INBOUND ORDER DETAIL */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Chi Tiết Đợt Nhập: ${selectedOrder?.batchCode || ''}`}
          maxWidth="940px"
        >
          {detailLoading || !selectedOrder ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải thông tin...</div>
          ) : (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '10px 18px',
                padding: '14px 18px',
                background: '#f8fafc',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #e2e8f0',
                fontSize: '0.88rem'
              }}>
                <div><span style={{ color: '#64748b' }}>Mã đợt / Lô: </span><strong style={{ fontFamily: 'monospace' }}>{selectedOrder.batchCode}</strong></div>
                <div><span style={{ color: '#64748b' }}>Nhà cung cấp: </span><strong>{selectedOrder.supplierName || '—'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Ngày nhập: </span><strong>{new Date(selectedOrder.importDate).toLocaleString('vi-VN')}</strong></div>
                <div><span style={{ color: '#64748b' }}>Người tạo: </span><strong>{selectedOrder.createdByName || 'Hệ thống'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Tổng số lượng: </span><strong style={{ color: '#2563eb' }}>{selectedOrder.totalQuantity} chiếc</strong></div>
                <div><span style={{ color: '#64748b' }}>Tổng chi phí vốn: </span><strong style={{ color: '#059669' }}>{Number(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')} đ</strong></div>
              </div>

              {selectedOrder.note && (
                <div style={{ marginBottom: '14px', fontSize: '0.86rem', color: '#4b5563', fontStyle: 'italic', background: '#fffbeb', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fef3c7' }}>
                  Ghi chú: {selectedOrder.note}
                </div>
              )}

              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>
                Danh Sách Mặt Hàng & Tồn Kho Hiện Tại Trong Lô:
              </h4>

              <div style={{
                maxHeight: '340px',
                overflowY: 'auto',
                overflowX: 'hidden',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: '#ffffff'
              }}>
                <table style={{
                  width: '100%',
                  minWidth: '100%',
                  tableLayout: 'fixed',
                  borderCollapse: 'collapse',
                  fontSize: '0.85rem'
                }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ width: '28%', padding: '10px 12px', textAlign: 'left', fontWeight: '700' }}>Sản Phẩm</th>
                      <th style={{ width: '18%', padding: '10px 8px', textAlign: 'left', fontWeight: '700' }}>Biến Thể</th>
                      <th style={{ width: '14%', padding: '10px 8px', textAlign: 'left', fontWeight: '700' }}>Mã SKU</th>
                      <th style={{ width: '14%', padding: '10px 8px', textAlign: 'right', fontWeight: '700' }}>Giá Nhập</th>
                      <th style={{ width: '8%', padding: '10px 6px', textAlign: 'center', fontWeight: '700' }}>Nhập</th>
                      <th style={{ width: '8%', padding: '10px 6px', textAlign: 'center', fontWeight: '700' }}>Còn</th>
                      <th style={{ width: '10%', padding: '10px 8px', textAlign: 'center', fontWeight: '700' }}>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!selectedOrder.items || selectedOrder.items.length === 0) ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                          Đợt nhập chưa có chi tiết mặt hàng.
                        </td>
                      </tr>
                    ) : (
                      selectedOrder.items.map(it => (
                        <tr key={it.batchId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '9px 12px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={it.productName}>
                            {it.productName}
                          </td>
                          <td style={{ padding: '9px 8px', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Size {it.size} - {it.color}
                          </td>
                          <td style={{ padding: '9px 8px', whiteSpace: 'nowrap' }}>
                            <code style={{ fontSize: '0.8rem', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', color: '#4b5563' }}>{it.sku}</code>
                          </td>
                          <td style={{ padding: '9px 8px', textAlign: 'right', fontWeight: '600', color: '#047857', whiteSpace: 'nowrap' }}>
                            {Number(it.importPrice).toLocaleString('vi-VN')} đ
                          </td>
                          <td style={{ padding: '9px 6px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                            {it.initialQuantity}
                          </td>
                          <td style={{ padding: '9px 6px', textAlign: 'center', fontWeight: '700', color: it.remainingQuantity > 0 ? '#2563eb' : '#9ca3af' }}>
                            {it.remainingQuantity}
                          </td>
                          <td style={{ padding: '9px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '0.74rem',
                              fontWeight: '600',
                              background: it.remainingQuantity > 0 ? '#dcfce7' : '#f3f4f6',
                              color: it.remainingQuantity > 0 ? '#15803d' : '#6b7280'
                            }}>
                              {it.remainingQuantity > 0 ? 'Còn hàng' : 'Đã hết'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button className="btn-action" onClick={() => setIsDetailModalOpen(false)}>
                  Đóng
                </button>
              </div>
            </div>
          )}
        </Modal>
    </main>
  );
}
