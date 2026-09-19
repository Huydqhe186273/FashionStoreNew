import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { getStaff, createStaff, updateStaff, toggleStaffLock } from '../services/staffService';

const mockStaff = [
  { userId: 1, fullName: "Admin Hệ Thống", email: "admin@fashionstore.vn", phone: "0901234567", role: "admin", status: "active" },
  { userId: 2, fullName: "Trần Thị B", email: "staff_thib@fashionstore.vn", phone: "0912345678", role: "staff", status: "active" }
];

export default function ManageStaff() {
  const [staffList, setStaffList] = useState(mockStaff);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const [addForm, setAddForm] = useState({ fullName: '', email: '', password: '', phone: '', role: 'staff' });
  const [editForm, setEditForm] = useState({ fullName: '', role: 'staff', status: 'active' });

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

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await createStaff(addForm);
      setIsAddOpen(false);
      setAddForm({ fullName: '', email: '', password: '', phone: '', role: 'staff' });
      loadStaff();
    } catch (err) {
      setStaffList(prev => [...prev, { ...addForm, userId: prev.length + 1, status: 'active' }]);
      setIsAddOpen(false);
    }
  };

  const handleOpenEdit = (staff) => {
    setSelectedStaff(staff);
    setEditForm({ fullName: staff.fullName || '', role: staff.role || 'staff', status: staff.status || 'active' });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await updateStaff(selectedStaff.userId, editForm);
      setIsEditOpen(false);
      loadStaff();
    } catch (err) {
      setStaffList(prev => prev.map(s => s.userId === selectedStaff.userId ? { ...s, ...editForm } : s));
      setIsEditOpen(false);
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
        <button className="btn-primary" onClick={() => setIsAddOpen(true)}>➕ Thêm Nhân Viên Mới</button>
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

      {/* Modal Add Staff */}
      <Modal isOpen={isAddOpen} title="Thêm Nhân Viên Mới" onClose={() => setIsAddOpen(false)}>
        <form onSubmit={handleCreateStaff}>
          <div className="form-group">
            <label>Họ và Tên</label>
            <input type="text" className="input-control" value={addForm.fullName} onChange={e => setAddForm({ ...addForm, fullName: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Email Đăng Nhập</label>
            <input type="email" className="input-control" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Mật Khẩu Phân Phối</label>
            <input type="password" className="input-control" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Số Điện Thoại</label>
            <input type="text" className="input-control" value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Phân Quyền Vai Trò</label>
            <select className="select-control" value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })}>
              <option value="staff">Staff (Nhân viên)</option>
              <option value="admin">Admin (Quản trị viên)</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={() => setIsAddOpen(false)}>Hủy</button>
            <button type="submit" className="btn-primary">Tạo Nhân Viên</button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Staff */}
      <Modal isOpen={isEditOpen} title="Cập Nhật Vai Trò & Hồ Sơ" onClose={() => setIsEditOpen(false)}>
        <form onSubmit={handleSaveEdit}>
          <div className="form-group">
            <label>Họ và Tên</label>
            <input type="text" className="input-control" value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Phân Quyền Vai Trò</label>
            <select className="select-control" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
              <option value="staff">Staff (Nhân viên)</option>
              <option value="admin">Admin (Quản trị viên)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Trạng Thái</label>
            <select className="select-control" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
              <option value="active">Active (Hoạt động)</option>
              <option value="locked">Locked (Khóa)</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={() => setIsEditOpen(false)}>Hủy</button>
            <button type="submit" className="btn-primary">Lưu Thay Đổi</button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
