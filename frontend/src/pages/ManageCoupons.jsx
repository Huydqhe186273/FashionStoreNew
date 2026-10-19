import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
  disableCoupon
} from '../services/couponService';

export default function ManageCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State (Gộp Thêm & Sửa làm 1)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null); // null = Thêm mới, object = Sửa

  const initialForm = {
    code: '',
    discountType: 'percent', // 'percent' or 'fixed'
    value: '',
    minOrderValue: 0,
    startDate: '',
    endDate: '',
    usageLimit: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.keyword = search;
      if (typeFilter) params.discountType = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const data = await getCoupons(params);
      setCoupons(data);
      setIsLive(true);
    } catch (err) {
      console.error('Lỗi khi tải danh sách mã giảm giá:', err);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [search, typeFilter, statusFilter]);

  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setErrorMsg('');
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCoupon(c);
    setErrorMsg('');

    // Format dates to YYYY-MM-DDTHH:mm for datetime-local input
    const formatForInput = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setFormData({
      code: c.code || '',
      discountType: c.discountType || 'percent',
      value: c.value !== undefined && c.value !== null ? c.value : '',
      minOrderValue: c.minOrderValue !== undefined && c.minOrderValue !== null ? c.minOrderValue : 0,
      startDate: formatForInput(c.startDate),
      endDate: formatForInput(c.endDate),
      usageLimit: c.usageLimit !== undefined && c.usageLimit !== null ? c.usageLimit : ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
    setFormData(initialForm);
    setErrorMsg('');
  };

  const handleGenerateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'SALE';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, code }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.code || !formData.code.trim()) {
      setErrorMsg('Vui lòng nhập mã giảm giá!');
      return;
    }

    if (!formData.value || Number(formData.value) <= 0) {
      setErrorMsg('Vui lòng nhập giá trị giảm giá hợp lệ lớn hơn 0!');
      return;
    }

    const valNum = Number(formData.value);
    if (formData.discountType === 'percent') {
      if (valNum < 1 || valNum > 100) {
        setErrorMsg('Với loại phần trăm, giá trị giảm giá phải từ 1 đến 100%!');
        return;
      }
    }

    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      setErrorMsg('Ngày kết thúc không được trước ngày bắt đầu!');
      return;
    }

    const payload = {
      code: formData.code.trim().toUpperCase(),
      discountType: formData.discountType,
      value: valNum,
      minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : 0,
      startDate: formData.startDate ? formData.startDate : null,
      endDate: formData.endDate ? formData.endDate : null,
      usageLimit: formData.usageLimit !== '' ? Number(formData.usageLimit) : null
    };

    try {
      if (editingCoupon) {
        await updateCoupon(editingCoupon.discountCodeId, payload);
      } else {
        await createCoupon(payload);
      }
      handleCloseModal();
      loadCoupons();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Có lỗi xảy ra khi lưu mã giảm giá!';
      setErrorMsg(msg);
    }
  };

  const handleToggleStatus = async (coupon) => {
    const actionText = coupon.active ? 'vô hiệu hóa' : 'kích hoạt lại';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} mã giảm giá "${coupon.code}"?`)) {
      return;
    }

    try {
      await toggleCouponStatus(coupon.discountCodeId);
      loadCoupons();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || `Không thể ${actionText} mã giảm giá!`;
      alert(`⚠️ Lỗi: ${msg}`);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Metrics
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.active).length;
  const disabledCoupons = coupons.filter((c) => !c.active).length;
  const totalOrdersUsed = coupons.reduce((sum, c) => sum + (c.ordersCount || 0), 0);

  return (
    <main>
      <Header
        title="Quản Lý Mã Giảm Giá (Coupons)"
        subtitle="Tạo mới, chỉnh sửa, vô hiệu hóa và theo dõi hiệu suất mã khuyến mãi cho khách hàng"
        isLive={isLive}
        onRefresh={loadCoupons}
      />

      {/* Stats Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#6366f1' }}>🎟️</div>
          <div>
            <div className="stat-val">{totalCoupons}</div>
            <div className="stat-label">Tổng Số Mã Khuyến Mãi</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#10b981' }}>✅</div>
          <div>
            <div className="stat-val">{activeCoupons}</div>
            <div className="stat-label">Đang Hoạt Động</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#ef4444' }}>⏸️</div>
          <div>
            <div className="stat-val">{disabledCoupons}</div>
            <div className="stat-label">Đã Vô Hiệu Hóa / Hết Hạn</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#f59e0b' }}>🛍️</div>
          <div>
            <div className="stat-val">{totalOrdersUsed}</div>
            <div className="stat-label">Lượt Dùng Qua Đơn Hàng</div>
          </div>
        </div>
      </div>

      {/* Toolbar Filter & Add Action */}
      <div className="toolbar-card">
        <div className="filter-group">
          <input
            type="text"
            className="input-control"
            placeholder="Tìm theo mã coupon (e.g. SUMMER, SALE)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select-control"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Tất cả loại giảm giá</option>
            <option value="percent">Giảm theo phần trăm (%)</option>
            <option value="fixed">Giảm số tiền cố định (VNĐ)</option>
          </select>
          <select
            className="select-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động (Active)</option>
            <option value="disabled">Đã vô hiệu hóa (Disabled)</option>
          </select>
        </div>
        <button
          className="btn btn-primary"
          style={{ whiteSpace: 'nowrap' }}
          onClick={handleOpenAdd}
        >
          <svg
            style={{ width: '18px', height: '18px', marginRight: '6px' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Tạo Mã Giảm Giá Mới
        </button>
      </div>

      {/* Coupons Table */}
      <div className="table-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ CODE</th>
                <th>LOẠI GIẢM</th>
                <th>GIÁ TRỊ GIẢM</th>
                <th>ĐƠN TỐI THIỂU</th>
                <th>THỜI HẠN</th>
                <th>LƯỢT DÙNG</th>
                <th>TRẠNG THÁI</th>
                <th>NGƯỜI TẠO</th>
                <th style={{ textAlign: 'center' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading && coupons.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                    Đang tải dữ liệu mã giảm giá...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                    Không tìm thấy mã giảm giá nào phù hợp.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.discountCodeId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            letterSpacing: '0.5px',
                            background: '#f3f4f6',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb',
                            color: '#1f2937'
                          }}
                        >
                          {c.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(c.code)}
                          title="Sao chép mã"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: copiedCode === c.code ? '#10b981' : '#9ca3af',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {copiedCode === c.code ? (
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>✓</span>
                          ) : (
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2"></path>
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                    <td>
                      {c.discountType === 'percent' ? (
                        <span className="badge" style={{ background: '#ede9fe', color: '#6d28d9' }}>
                          Phần trăm (%)
                        </span>
                      ) : (
                        <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                          Cố định (VNĐ)
                        </span>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: '#111827', fontSize: '1rem' }}>
                        {c.discountType === 'percent'
                          ? `${Number(c.value)}%`
                          : `${Number(c.value).toLocaleString('vi-VN')} đ`}
                      </strong>
                    </td>
                    <td>
                      {c.minOrderValue && Number(c.minOrderValue) > 0
                        ? `${Number(c.minOrderValue).toLocaleString('vi-VN')} đ`
                        : <span style={{ color: '#9ca3af' }}>0 đ (Không yêu cầu)</span>}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: '1.4' }}>
                        {c.startDate ? (
                          <div>Từ: {new Date(c.startDate).toLocaleDateString('vi-VN')}</div>
                        ) : null}
                        {c.endDate ? (
                          <div style={{ color: !c.active ? '#ef4444' : '#4b5563' }}>
                            Đến: {new Date(c.endDate).toLocaleDateString('vi-VN')}
                          </div>
                        ) : (
                          <span style={{ color: '#10b981' }}>Vô thời hạn</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: '600', color: '#2563eb' }}>{c.ordersCount || 0}</span>
                        {c.usageLimit ? (
                          <span style={{ color: '#6b7280' }}> / {c.usageLimit} lượt</span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}> (Không giới hạn)</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {c.active ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="badge" style={{ background: '#fee2e2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span>
                          Đã vô hiệu hóa
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                        {c.createdByName || 'Hệ thống'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          onClick={() => handleOpenEdit(c)}
                          title="Sửa mã giảm giá"
                        >
                          <svg
                            style={{ width: '15px', height: '15px', marginRight: '4px' }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                          Sửa
                        </button>

                        <button
                          type="button"
                          className={`btn ${c.active ? 'btn-danger' : 'btn-success'}`}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: c.active ? '#ef4444' : '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleToggleStatus(c)}
                          title={c.active ? 'Vô hiệu hóa mã giảm giá' : 'Kích hoạt lại mã'}
                        >
                          {c.active ? (
                            <>
                              <svg style={{ width: '15px', height: '15px', marginRight: '4px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                              Vô hiệu hóa
                            </>
                          ) : (
                            <>
                              <svg style={{ width: '15px', height: '15px', marginRight: '4px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Kích hoạt
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCoupon ? `Cập Nhật Mã Giảm Giá: ${editingCoupon.code}` : 'Tạo Mã Giảm Giá Khuyến Mãi Mới'}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          {errorMsg && (
            <div
              style={{
                background: '#fee2e2',
                border: '1px solid #f87171',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Code */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: '600' }}>
              Mã Giảm Giá (Code) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input-control"
                placeholder="VD: SUMMER2026, FREESHIP50..."
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                style={{ textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}
                required
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleGenerateCode}
                title="Tạo mã ngẫu nhiên"
                style={{ whiteSpace: 'nowrap' }}
              >
                Tạo mã tự động
              </button>
            </div>
            <small style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
              Mã phải là duy nhất trong hệ thống, chỉ bao gồm chữ cái in hoa và số.
            </small>
          </div>

          {/* Discount Type */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: '600' }}>
              Loại Giảm Giá (Discount Type) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: `2px solid ${formData.discountType === 'percent' ? '#2563eb' : '#e5e7eb'}`,
                  background: formData.discountType === 'percent' ? '#eff6ff' : '#fff',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="discountType"
                  value="percent"
                  checked={formData.discountType === 'percent'}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                />
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937' }}>Phần Trăm (%)</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Giảm từ 1 đến 100%</div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: `2px solid ${formData.discountType === 'fixed' ? '#2563eb' : '#e5e7eb'}`,
                  background: formData.discountType === 'fixed' ? '#eff6ff' : '#fff',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="discountType"
                  value="fixed"
                  checked={formData.discountType === 'fixed'}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                />
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937' }}>Cố Định (VNĐ)</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Giảm số tiền cụ thể</div>
                </div>
              </label>
            </div>
          </div>

          {/* Value & Min Order Value */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: '600' }}>
                Giá Trị Giảm ({formData.discountType === 'percent' ? '%' : 'VNĐ'}) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                className="input-control"
                placeholder={formData.discountType === 'percent' ? '1 - 100' : 'VD: 50000'}
                value={formData.value}
                min={formData.discountType === 'percent' ? 1 : 1}
                max={formData.discountType === 'percent' ? 100 : undefined}
                step="any"
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                required
              />
              <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                {formData.discountType === 'percent' ? 'Nhập từ 1 đến 100%' : 'Số tiền trừ trực tiếp vào đơn hàng'}
              </small>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: '600' }}>
                Đơn Hàng Tối Thiểu (VNĐ)
              </label>
              <input
                type="number"
                className="input-control"
                placeholder="VD: 200000 (0 nếu không yêu cầu)"
                value={formData.minOrderValue}
                min="0"
                step="any"
                onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
              />
              <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                Giá trị đơn hàng cần đạt để áp dụng mã
              </small>
            </div>
          </div>

          {/* Usage Limit */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: '600' }}>
              Giới Hạn Lượt Sử Dụng (Tùy chọn)
            </label>
            <input
              type="number"
              className="input-control"
              placeholder="Để trống nếu không giới hạn số lượt dùng"
              value={formData.usageLimit}
              min="0"
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
            />
          </div>

          {/* Dates: StartDate & EndDate */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: '600' }}>
                Ngày Bắt Đầu Hiệu Lực
              </label>
              <input
                type="datetime-local"
                className="input-control"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: '600' }}>
                Ngày Kết Thúc (Hạn Sử Dụng)
              </label>
              <input
                type="datetime-local"
                className="input-control"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCloseModal}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {editingCoupon ? 'Lưu Thay Đổi' : 'Tạo Mã Giảm Giá'}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
