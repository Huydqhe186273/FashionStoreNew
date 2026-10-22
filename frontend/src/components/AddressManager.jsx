import React, { useState, useEffect } from 'react';
import { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '../services/addressService';
import './AddressManager.css';

export default function AddressManager({ userId, selectedAddressId, onSelectAddress, selectable = false }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const initialForm = {
    recipientName: '',
    phone: '',
    addressLine: '',
    city: '',
    isDefault: false
  };
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  const loadAddresses = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getAddresses(userId);
      setAddresses(Array.isArray(data) ? data : []);
      if (selectable && onSelectAddress && Array.isArray(data) && data.length > 0) {
        if (!selectedAddressId) {
          const defaultAddr = data.find(a => a.isDefault) || data[0];
          onSelectAddress(defaultAddr.addressId);
        }
      }
    } catch (err) {
      console.warn('Could not load addresses from server:', err);
      const mock = [
        { addressId: 1, recipientName: 'Nguyễn Văn A', phone: '0987654321', addressLine: '123 Đường Cầu Giấy, Phường Quan Hoa', city: 'Hà Nội', isDefault: true }
      ];
      setAddresses(mock);
      if (selectable && onSelectAddress && !selectedAddressId) {
        onSelectAddress(1);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [userId]);

  const showToast = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 3500);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 3500);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.recipientName?.trim()) errors.recipientName = 'Vui lòng nhập tên người nhận';
    if (!formData.phone?.trim() || !/^0\d{9}$/.test(formData.phone.trim()))
      errors.phone = 'Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0';
    if (!formData.addressLine?.trim()) errors.addressLine = 'Vui lòng nhập địa chỉ cụ thể';
    if (!formData.city?.trim()) errors.city = 'Vui lòng nhập Tỉnh/Thành phố';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setFormData({ ...initialForm, isDefault: addresses.length === 0 });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (addr) => {
    setEditingAddress(addr);
    setFormData({
      recipientName: addr.recipientName || '',
      phone: addr.phone || '',
      addressLine: addr.addressLine || '',
      city: addr.city || '',
      isDefault: Boolean(addr.isDefault)
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.addressId, userId, formData);
        showToast('Cập nhật địa chỉ thành công!');
      } else {
        const created = await createAddress(userId, formData);
        showToast('Thêm địa chỉ giao hàng thành công!');
        if (selectable && onSelectAddress && created?.addressId) {
          onSelectAddress(created.addressId);
        }
      }
      setModalOpen(false);
      loadAddresses();
    } catch (err) {
      console.error('Error saving address:', err);
      showToast(err.response?.data?.error || 'Có lỗi xảy ra khi lưu địa chỉ', true);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAddress(id, userId);
      showToast('Đã xóa địa chỉ thành công');
      setDeleteConfirmId(null);
      loadAddresses();
    } catch (err) {
      showToast(err.response?.data?.error || 'Không thể xóa địa chỉ này', true);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id, userId);
      showToast('Đã đặt làm địa chỉ mặc định');
      loadAddresses();
    } catch (err) {
      showToast(err.response?.data?.error || 'Không thể đổi địa chỉ mặc định', true);
    }
  };

  return (
    <div className="am-wrapper">
      {/* Toast */}
      {(successMsg || errorMsg) && (
        <div className={`am-toast ${errorMsg ? 'am-toast--error' : 'am-toast--success'}`}>
          <span className="am-toast__icon">{errorMsg ? '✕' : '✓'}</span>
          <span>{successMsg || errorMsg}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="am-header">
        <div>
          <h3 className="am-header__title">
            {selectable ? 'Chọn địa chỉ nhận hàng' : 'Sổ địa chỉ giao hàng'}
          </h3>
          <p className="am-header__sub">
            {selectable
              ? 'Đơn hàng sẽ được chuyển tới địa chỉ bạn chọn bên dưới'
              : 'Quản lý các địa chỉ nhận hàng thuận tiện cho việc mua sắm'}
          </p>
        </div>
        <button className="am-btn-add" type="button" onClick={handleOpenAdd}>
          <span>+</span> Thêm địa chỉ mới
        </button>
      </div>

      {/* Address list */}
      {loading ? (
        <div className="am-loading">Đang tải địa chỉ...</div>
      ) : addresses.length === 0 ? (
        <div className="am-empty">
          <svg className="am-empty__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="am-empty__text">Bạn chưa có địa chỉ giao hàng nào.</p>
          <button className="am-btn-add-inline" type="button" onClick={handleOpenAdd}>
            Thêm địa chỉ ngay
          </button>
        </div>
      ) : (
        <div className={`am-grid ${selectable ? 'am-grid--single' : ''}`}>
          {addresses.map((addr) => {
            const isSelected = selectable && selectedAddressId === addr.addressId;
            return (
              <div
                key={addr.addressId}
                className={`am-card ${isSelected ? 'am-card--selected' : ''}`}
                onClick={() => selectable && onSelectAddress && onSelectAddress(addr.addressId)}
              >
                {/* Card top row */}
                <div className="am-card__top">
                  <div className="am-card__name-row">
                    {selectable && (
                      <input
                        type="radio"
                        name="shippingAddress"
                        className="am-radio"
                        checked={isSelected}
                        onChange={() => onSelectAddress && onSelectAddress(addr.addressId)}
                      />
                    )}
                    <span className="am-card__name">{addr.recipientName}</span>
                    <span className="am-card__sep">|</span>
                    <span className="am-card__phone">{addr.phone}</span>
                  </div>
                  {addr.isDefault && (
                    <span className="am-badge am-badge--default">Mặc định</span>
                  )}
                </div>

                {/* Address lines */}
                <p className="am-card__line">{addr.addressLine}</p>
                <p className="am-card__city">{addr.city}</p>

                {/* Action buttons */}
                <div className="am-card__actions">
                  {!addr.isDefault && (
                    <button
                      type="button"
                      className="am-action-btn am-action-btn--set-default"
                      onClick={(e) => { e.stopPropagation(); handleSetDefault(addr.addressId); }}
                    >
                      Thiết lập mặc định
                    </button>
                  )}
                  <button
                    type="button"
                    className="am-action-btn am-action-btn--edit"
                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(addr); }}
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    className="am-action-btn am-action-btn--delete"
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(addr.addressId); }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add / Edit */}
      {modalOpen && (
        <div className="am-overlay" onClick={() => setModalOpen(false)}>
          <div className="am-modal" onClick={(e) => e.stopPropagation()}>
            <div className="am-modal__header">
              <h3 className="am-modal__title">
                {editingAddress ? 'Chỉnh sửa địa chỉ nhận hàng' : 'Thêm địa chỉ nhận hàng mới'}
              </h3>
              <button className="am-modal__close" type="button" onClick={() => setModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="am-field">
                <label className="am-label">Họ và tên người nhận *</label>
                <input
                  type="text"
                  className={`am-input ${formErrors.recipientName ? 'am-input--error' : ''}`}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                />
                {formErrors.recipientName && <span className="am-field-error">{formErrors.recipientName}</span>}
              </div>

              <div className="am-field">
                <label className="am-label">Số điện thoại *</label>
                <input
                  type="tel"
                  className={`am-input ${formErrors.phone ? 'am-input--error' : ''}`}
                  placeholder="Ví dụ: 0987654321"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                {formErrors.phone && <span className="am-field-error">{formErrors.phone}</span>}
              </div>

              <div className="am-field">
                <label className="am-label">Tỉnh / Thành phố *</label>
                <input
                  type="text"
                  className={`am-input ${formErrors.city ? 'am-input--error' : ''}`}
                  placeholder="Ví dụ: Hà Nội, TP. Hồ Chí Minh, Đà Nẵng..."
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                {formErrors.city && <span className="am-field-error">{formErrors.city}</span>}
              </div>

              <div className="am-field">
                <label className="am-label">Địa chỉ chi tiết (Số nhà, ngõ/đường, phường/xã) *</label>
                <textarea
                  rows="3"
                  className={`am-textarea ${formErrors.addressLine ? 'am-input--error' : ''}`}
                  placeholder="Ví dụ: Số 20, Ngõ 102 Cầu Giấy, Phường Quan Hoa"
                  value={formData.addressLine}
                  onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                />
                {formErrors.addressLine && <span className="am-field-error">{formErrors.addressLine}</span>}
              </div>

              <div className="am-checkbox-row">
                <input
                  type="checkbox"
                  id="isDefaultCheckbox"
                  className="am-checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
                <label htmlFor="isDefaultCheckbox" className="am-checkbox-label">
                  Đặt làm địa chỉ nhận hàng mặc định
                </label>
              </div>

              <div className="am-modal__footer">
                <button type="button" className="am-btn-cancel" onClick={() => setModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="am-btn-submit">
                  {editingAddress ? 'Cập nhật' : 'Thêm địa chỉ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirm */}
      {deleteConfirmId && (
        <div className="am-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="am-modal am-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="am-modal__header">
              <h4 className="am-modal__title">Xác nhận xóa địa chỉ</h4>
              <button className="am-modal__close" type="button" onClick={() => setDeleteConfirmId(null)}>✕</button>
            </div>
            <p className="am-modal__desc">
              Bạn có chắc chắn muốn xóa địa chỉ giao hàng này không? Thao tác này không thể hoàn tác.
            </p>
            <div className="am-modal__footer">
              <button type="button" className="am-btn-cancel" onClick={() => setDeleteConfirmId(null)}>
                Hủy
              </button>
              <button type="button" className="am-btn-danger" onClick={() => handleDelete(deleteConfirmId)}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
