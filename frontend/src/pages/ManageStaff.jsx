import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { getStaff, createStaff, updateStaff, toggleStaffLock } from '../services/staffService';
import { useToast } from '../context/ToastContext';

const mockStaff = [
  { userId: 1, fullName: "Admin Hệ Thống", email: "admin@fashionstore.vn", phone: "0901234567", role: "admin", status: "active" },
  { userId: 2, fullName: "Trần Thị B", email: "staff_thib@fashionstore.vn", phone: "0912345678", role: "staff", status: "active" }
];

export default function ManageStaff() {
  const { toast } = useToast();
  const [staffList, setStaffList] = useState(mockStaff);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null); // null: Thêm mới, object: Đang sửa

  const initialForm = { fullName: '', email: '', password: '', phone: '', role: 'staff', status: 'active' };
  const [formData, setFormData] = useState(initialForm);

  const loadStaff = async () => {
    try {
      const data = await getStaff({ keyword: search, role: roleFilter, status: statusFilter });
      setStaffList(data);
      setIsLive(true);
    } catch (err) {
      console.warn('Axios error, fallback mock staff:', err);
      setIsLive(false);
      let filtered = mockStaff.filter(s => {
        const matchSearch = !search || s.fullName.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = !roleFilter || s.role === roleFilter;
        const matchStatus = !statusFilter || s.status === statusFilter;
        return matchSearch && matchRole && matchStatus;
      });
      setStaffList(filtered);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [search, roleFilter, statusFilter]);

  const handleToggleLock = async (id) => {
    try {
      await toggleStaffLock(id);
      loadStaff();
    } catch (err) {
      setStaffList(prev => prev.map(s => s.userId === id ? { ...s, status: s.status === 'locked' ? 'active' : 'locked' } : s));
    }
  };

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      fullName: staff.fullName || '',
      email: staff.email || '',
      password: '',
      phone: staff.phone || '',
      role: staff.role || 'staff',
      status: staff.status || 'active'
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
    setFormData(initialForm);
  };

  const handleSubmitStaff = async (e) => {
    e.preventDefault();
    const cleanEmail = (formData.email || '').trim().toLowerCase();
    if (!cleanEmail) {
      toast?.error?.('Email không được để trống!') || alert('Email không được để trống!');
      return;
    }

    // Kiểm tra xem email có bị trùng với tài khoản khác trong danh sách không
    const isDuplicate = staffList.some(
      s => s.userId !== editingStaff?.userId && (s.email || '').trim().toLowerCase() === cleanEmail
    );
    if (isDuplicate) {
      const errMsg = "Email '" + formData.email.trim() + "' đã được sử dụng bởi tài khoản khác!";
      toast?.error?.(errMsg) || alert(errMsg);
      return;
    }

    if (editingStaff) {
      try {
        const payload = {
          fullName: formData.fullName,
          email: formData.email.trim(),
          phone: formData.phone || '',
          role: formData.role,
          status: formData.status
        };
        if (formData.password && formData.password.trim() !== '') {
          payload.password = formData.password.trim();
        }
        await updateStaff(editingStaff.userId, payload);
        toast?.success?.('Cập nhật nhân viên thành công!') || alert('Cập nhật nhân viên thành công!');
        handleCloseModal();
        loadStaff();
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.error || err.message;
        toast?.error?.('Lỗi khi cập nhật nhân viên: ' + msg) || alert('Lỗi khi cập nhật nhân viên: ' + msg);
        if (!err.response) {
          setStaffList(prev => prev.map(s => s.userId === editingStaff.userId ? { ...s, ...formData } : s));
          handleCloseModal();
        }
      }
    } else {
      try {
        await createStaff({
          ...formData,
          email: formData.email.trim()
        });
        toast?.success?.('Tạo nhân viên mới thành công!') || alert('Tạo nhân viên mới thành công!');
        handleCloseModal();
        loadStaff();
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.error || err.message;
        toast?.error?.('Lỗi khi tạo nhân viên: ' + msg) || alert('Lỗi khi tạo nhân viên: ' + msg);
        if (!err.response) {
          setStaffList(prev => [...prev, { ...formData, userId: prev.length + 1, status: 'active' }]);
          handleCloseModal();
        }
      }
    }
  };

  return (
    <main>
      <Header
        title="Quản Lý Tài Khoản Nhân Viên"
        subtitle="Thêm nhân viên mới, phân quyền vai trò (`staff` / `admin`) và quản lý trạng thái tài khoản"
        isLive={isLive}
        onRefresh={loadStaff}
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#6366f1' }}>👔</div>
          <div>
            <div className="stat-val">{staffList.length}</div>
            <div className="stat-label">Tổng Nhân Sự</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#3b82f6' }}>👤</div>
          <div>
            <div className="stat-val">{staffList.filter(s => s.role === 'staff').length}</div>
            <div className="stat-label">Nhân Viên (Staff)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#a855f7' }}>👑</div>
          <div>
            <div className="stat-val">{staffList.filter(s => s.role === 'admin').length}</div>
            <div className="stat-label">Quản Trị Viên (Admin)</div>
          </div>
        </div>
      </div>

      <div className="toolbar-card">
        <div className="filter-group">
          <input
            type="text"
            className="input-control"
            placeholder="Tìm theo tên hoặc email nhân viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="select-control" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Tất cả Vai Trò</option>
            <option value="staff">Staff (Nhân viên)</option>
            <option value="admin">Admin (Quản trị)</option>
          </select>
          <select className="select-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả Trạng Thái</option>
            <option value="active">Active (Hoạt động)</option>
            <option value="locked">Locked (Khóa)</option>
          </select>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>➕ Thêm Nhân Viên Mới</button>
      </div>

      <div className="panel-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Họ và Tên / Email</th>
                <th>Số Điện Thoại</th>
                <th>Vai Trò</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map(s => (
                <tr key={s.userId}>
                  <td><strong>#STF-{s.userId}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                  </td>
                  <td>{s.phone || 'Chưa có'}</td>
                  <td><span className={`role-tag ${s.role === 'admin' ? 'role-admin' : 'role-staff'}`}>{s.role === 'admin' ? '👑 Admin' : '👔 Staff'}</span></td>
                  <td>
                    <span className={`badge ${s.status === 'locked' ? 'badge-locked' : 'badge-active'}`}>
                      {s.status === 'locked' ? '🔒 Locked' : '✅ Active'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action" onClick={() => handleOpenEdit(s)}>✏️ Sửa Role</button>
                      <button className={`btn-action ${s.status === 'locked' ? 'btn-unlock' : 'btn-lock'}`} onClick={() => handleToggleLock(s.userId)}>
                        {s.status === 'locked' ? '🔓 Mở Khóa' : '🔒 Khóa TK'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Unified Staff (Thêm / Sửa gộp làm 1) */}
      <Modal
        isOpen={isModalOpen}
        title={editingStaff ? `Cập Nhật Hồ Sơ Nhân Viên (#STF-${editingStaff.userId})` : "Thêm Nhân Viên Mới"}
        onClose={handleCloseModal}
      >
        <form onSubmit={handleSubmitStaff}>
          <div className="form-group">
            <label>Họ và Tên</label>
            <input
              type="text"
              className="input-control"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              required
              placeholder="ví dụ: Nguyễn Văn A..."
              minLength={2}
              maxLength={100}
            />
          </div>
          <div className="form-group">
            <label>Email Đăng Nhập</label>
            <input
              type="email"
              className="input-control"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="ví dụ: staff@gmail.com"
            />
            {editingStaff && (
              <small style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                * Có thể sửa email đăng nhập (hệ thống sẽ kiểm tra trùng lặp tự động).
              </small>
            )}
          </div>
          {!editingStaff ? (
            <div className="form-group">
              <label>Mật Khẩu Ban Đầu</label>
              <input
                type="password"
                className="input-control"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                maxLength={32}
                placeholder="Tối thiểu 6 ký tự..."
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Đặt Lại Mật Khẩu (Để trống nếu giữ nguyên)</label>
              <input
                type="password"
                className="input-control"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                minLength={6}
                maxLength={32}
                placeholder="Nhập tối thiểu 6 ký tự nếu muốn đổi mật khẩu..."
              />
            </div>
          )}
          <div className="form-group">
            <label>Số Điện Thoại</label>
            <input
              type="tel"
              className="input-control"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="ví dụ: 0912345678 (10 chữ số)"
              pattern="^0[35789][0-9]{8}$"
              maxLength={10}
              title="Số điện thoại Việt Nam gồm đúng 10 chữ số bắt đầu bằng 03, 05, 07, 08 hoặc 09"
            />
          </div>
          <div className="form-group">
            <label>Phân Quyền Vai Trò</label>
            <select
              className="select-control"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="staff">Staff (Nhân viên)</option>
              <option value="admin">Admin (Quản trị viên)</option>
            </select>
          </div>
          {editingStaff && (
            <div className="form-group">
              <label>Trạng Thái Tài Khoản</label>
              <select
                className="select-control"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active (Hoạt động)</option>
                <option value="locked">Locked (Khóa)</option>
              </select>
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleCloseModal}>Hủy</button>
            <button type="submit" className="btn-primary">
              {editingStaff ? "Lưu Thay Đổi" : "Tạo Nhân Viên"}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
