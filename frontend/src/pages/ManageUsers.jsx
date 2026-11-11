import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import {
  Users,
  CheckCircle2,
  Lock,
  Unlock,
  Plus,
  Edit,
  AlertCircle
} from 'lucide-react';
import { getUsers, createUser, updateUser, toggleUserLock } from '../services/userService';
import { useToast } from '../context/ToastContext';

export default function ManageUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State (Gộp Thêm & Sửa làm 1)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null: Thêm mới, object: Đang sửa
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    fullName: '',
    email: '',
    phone: '',
    status: 'active'
  };
  const [formData, setFormData] = useState(initialForm);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers({ keyword: search, status: statusFilter });
      setUsers(data || []);
      setIsLive(true);
    } catch (err) {
      console.error('Lỗi khi tải danh sách khách hàng:', err);
      setIsLive(false);
      toast?.error?.('Không thể tải danh sách khách hàng từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, statusFilter]);

  const handleToggleLock = async (u) => {
    const action = u.status === 'locked' ? 'Mở khóa' : 'Khóa';
    if (!window.confirm(`Xác nhận ${action} tài khoản khách hàng #${u.userId} (${u.fullName})?`)) return;
    try {
      await toggleUserLock(u.userId);
      toast?.success?.(`Đã ${action.toLowerCase()} tài khoản khách hàng #${u.userId} thành công!`);
      loadUsers();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || `Lỗi khi ${action.toLowerCase()} tài khoản.`;
      toast?.error?.(msg);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData(initialForm);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      status: user.status || 'active'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData(initialForm);
    setFormError('');
    setSubmitting(false);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setFormError('');

    const cleanFullName = (formData.fullName || '').trim();
    const cleanEmail = (formData.email || '').trim().toLowerCase();
    const cleanPhone = (formData.phone || '').trim();

    if (!cleanFullName) {
      setFormError('Họ và tên khách hàng không được để trống!');
      return;
    }

    if (!cleanEmail) {
      setFormError('Email khách hàng không được để trống!');
      return;
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,64}$/;
    if (!emailRegex.test(cleanEmail)) {
      setFormError('Email không hợp lệ! Vui lòng nhập đúng định dạng (Ví dụ: customer@gmail.com).');
      return;
    }

    if (cleanPhone) {
      const phoneRegex = /^0[35789][0-9]{8}$/;
      if (!phoneRegex.test(cleanPhone)) {
        setFormError('Số điện thoại không hợp lệ! Vui lòng nhập đúng số điện thoại di động Việt Nam gồm chính xác 10 chữ số (bắt đầu bằng 03, 05, 07, 08 hoặc 09).');
        return;
      }
    }

    // 1. Kiểm tra trùng lặp email ở phía Client
    const duplicateEmail = users.some(
      u => (!editingUser || u.userId !== editingUser.userId) && (u.email || '').trim().toLowerCase() === cleanEmail
    );
    if (duplicateEmail) {
      const msg = `Email "${formData.email.trim()}" đã tồn tại trong hệ thống! Không được phép thêm trùng lặp.`;
      setFormError(msg);
      toast?.error?.(msg);
      return; // DỪNG LẠI, CHẶN TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP THÊM
    }

    // 2. Kiểm tra trùng lặp số điện thoại ở phía Client (nếu có nhập)
    if (cleanPhone) {
      const duplicatePhone = users.some(
        u => (!editingUser || u.userId !== editingUser.userId) && (u.phone || '').trim() === cleanPhone
      );
      if (duplicatePhone) {
        const msg = `Số điện thoại "${cleanPhone}" đã tồn tại trong hệ thống! Không được phép thêm trùng lặp.`;
        setFormError(msg);
        toast?.error?.(msg);
        return; // DỪNG LẠI, CHẶN TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP THÊM
      }
    }

    const payload = {
      fullName: cleanFullName,
      email: cleanEmail,
      phone: cleanPhone || null,
      role: 'customer',
      status: formData.status || 'active'
    };

    setSubmitting(true);
    if (editingUser) {
      // Cập nhật người dùng hiện có
      try {
        await updateUser(editingUser.userId, payload);
        toast?.success?.(`Cập nhật thông tin khách hàng #${editingUser.userId} thành công!`);
        handleCloseModal();
        loadUsers();
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Lỗi khi cập nhật khách hàng.';
        setFormError(msg);
        toast?.error?.(msg);
        // KHÔNG cập nhật vào danh sách khi có lỗi, KHÔNG đóng modal
      } finally {
        setSubmitting(false);
      }
    } else {
      // Tạo mới người dùng
      try {
        await createUser(payload);
        toast?.success?.(`Thêm khách hàng mới "${cleanFullName}" thành công!`);
        handleCloseModal();
        loadUsers();
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Lỗi khi tạo khách hàng.';
        setFormError(msg);
        toast?.error?.(msg);
        // KHÔNG thêm vào danh sách khi có lỗi, KHÔNG đóng modal
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <main>
      <Header 
        title="Quản Lý Tài Khoản Khách Hàng" 
        subtitle="Xem danh sách, tìm kiếm, thêm mới, sửa thông tin và Khóa / Mở khóa tài khoản khách hàng"
        isLive={isLive}
        onRefresh={loadUsers}
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={26} />
          </div>
          <div>
            <div className="stat-val">{users.length}</div>
            <div className="stat-label">Tổng Khách Hàng</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={26} />
          </div>
          <div>
            <div className="stat-val">{users.filter(u => u.status === 'active').length}</div>
            <div className="stat-label">Tài Khoản Active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={26} />
          </div>
          <div>
            <div className="stat-val">{users.filter(u => u.status === 'locked').length}</div>
            <div className="stat-label">Đang Bị Khóa</div>
          </div>
        </div>
      </div>

      <div className="toolbar-card">
        <div className="filter-group">
          <div className="search-input-wrapper">
            <input 
              type="text" 
              className="input-control" 
              placeholder="Tìm theo tên, email hoặc SĐT..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <select className="select-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả Trạng Thái</option>
            <option value="active">Active (Hoạt động)</option>
            <option value="locked">Locked (Khóa)</option>
          </select>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Thêm Khách Hàng Mới
        </button>
      </div>

      <div className="panel-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Mã KH</th>
                <th>Tên KH / Email</th>
                <th>Số Điện Thoại</th>
                <th>Trạng Thái</th>
                <th>Đã Đặt</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Đang tải danh sách khách hàng...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Không tìm thấy khách hàng nào phù hợp
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.userId}>
                    <td><strong>#CUST-{u.userId}</strong></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td>{u.phone || 'Chưa có'}</td>
                    <td>
                      <span className={`badge ${u.status === 'locked' ? 'badge-locked' : 'badge-active'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {u.status === 'locked' ? <><Lock size={12} /> Locked</> : <><CheckCircle2 size={12} /> Active</>}
                      </span>
                    </td>
                    <td><strong style={{ color: 'var(--primary)' }}>{u.totalOrders || 0}</strong> đơn</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action" onClick={() => handleOpenEdit(u)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Edit size={13} /> Sửa
                        </button>
                        <button className={`btn-action ${u.status === 'locked' ? 'btn-unlock' : 'btn-lock'}`} onClick={() => handleToggleLock(u)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {u.status === 'locked' ? <><Unlock size={13} /> Mở Khóa</> : <><Lock size={13} /> Khóa TK</>}
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

      {/* Modal Thêm & Sửa Khách Hàng (Đã gộp làm 1) */}
      <Modal 
        isOpen={isModalOpen} 
        title={editingUser ? `Chỉnh Sửa Hồ Sơ Khách Hàng (#CUST-${editingUser.userId})` : "Thêm Khách Hàng Mới"} 
        onClose={handleCloseModal}
      >
        <form onSubmit={handleSubmitUser}>
          {formError && (
            <div style={{
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label>Email <span style={{ color: '#ef4444' }}>*</span></label>
            <input 
              type="email" 
              className="input-control" 
              value={formData.email} 
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (formError) setFormError('');
              }} 
              required 
              readOnly={!!editingUser}
              style={editingUser ? { opacity: 0.7, cursor: 'not-allowed', backgroundColor: '#f1f5f9' } : {}}
              placeholder="ví dụ: customer@gmail.com"
            />
            {editingUser && (
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Email định danh tài khoản không thể chỉnh sửa</small>
            )}
          </div>

          <div className="form-group">
            <label>Họ và Tên <span style={{ color: '#ef4444' }}>*</span></label>
            <input 
              type="text" 
              className="input-control" 
              value={formData.fullName} 
              onChange={(e) => {
                setFormData({ ...formData, fullName: e.target.value });
                if (formError) setFormError('');
              }} 
              required 
              placeholder="ví dụ: Nguyễn Văn A..."
            />
          </div>

          <div className="form-group">
            <label>Số Điện Thoại</label>
            <input 
              type="tel" 
              className="input-control" 
              value={formData.phone} 
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value });
                if (formError) setFormError('');
              }} 
              placeholder="ví dụ: 0912345678 (10 chữ số)"
              maxLength={10}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
              Số điện thoại di động Việt Nam gồm đúng 10 chữ số (bắt đầu bằng 03, 05, 07, 08 hoặc 09).
            </small>
          </div>

          <div className="form-group">
            <label>Trạng Thái Tài Khoản</label>
            <select 
              className="select-control" 
              value={formData.status} 
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Active (Hoạt động)</option>
              <option value="locked">Locked (Khóa tài khoản)</option>
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleCloseModal} disabled={submitting}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Đang xử lý...' : (editingUser ? "Lưu Thay Đổi" : "Tạo Khách Hàng")}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}

