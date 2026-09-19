import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { getUsers, updateUser, toggleUserLock } from '../services/userService';

const mockUsers = [
  { userId: 1, fullName: "Nguyễn Văn A", email: "customer1@example.com", phone: "0987654321", role: "customer", status: "active", totalOrders: 5 },
  { userId: 2, fullName: "Lê Hoàng C", email: "hoangc@example.com", phone: "0933445566", role: "customer", status: "active", totalOrders: 8 },
  { userId: 3, fullName: "Phạm Minh D", email: "minhd@example.com", phone: "0977889900", role: "customer", status: "locked", totalOrders: 1 }
];

export default function ManageUsers() {
  const [users, setUsers] = useState(mockUsers);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', phone: '', status: 'active' });

  const loadUsers = async () => {
    try {
      const data = await getUsers({ keyword: search, status: statusFilter });
      setUsers(data);
      setIsLive(true);
    } catch (err) {
      console.warn('Axios error, fallback mock users:', err);
      setIsLive(false);
      let filtered = mockUsers.filter(u => {
        const matchSearch = !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || u.status === statusFilter;
        return matchSearch && matchStatus;
      });
      setUsers(filtered);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, statusFilter]);

  const handleToggleLock = async (id) => {
    try {
      await toggleUserLock(id);
      loadUsers();
    } catch (err) {
      setUsers(prev => prev.map(u => u.userId === id ? { ...u, status: u.status === 'locked' ? 'active' : 'locked' } : u));
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormData({ fullName: user.fullName || '', phone: user.phone || '', status: user.status || 'active' });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateUser(selectedUser.userId, formData);
      setIsModalOpen(false);
      loadUsers();
    } catch (err) {
      setUsers(prev => prev.map(u => u.userId === selectedUser.userId ? { ...u, ...formData } : u));
      setIsModalOpen(false);
    }
  };

  return (
    <main>
      <Header 
        title="Quản Lý Tài Khoản Khách Hàng" 
        subtitle="Xem danh sách, tìm kiếm, sửa thông tin và Khóa / Mở khóa tài khoản khách hàng"
        isLive={isLive}
        onRefresh={loadUsers}
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#6366f1' }}>👥</div>
          <div>
            <div className="stat-val">{users.length}</div>
            <div className="stat-label">Tổng Khách Hàng</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#10b981' }}>✅</div>
          <div>
            <div className="stat-val">{users.filter(u => u.status === 'active').length}</div>
            <div className="stat-label">Tài Khoản Active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#ef4444' }}>🔒</div>
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
              placeholder="Tìm theo tên hoặc email..." 
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
              {users.map(u => (
                <tr key={u.userId}>
                  <td><strong>#CUST-{u.userId}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>
                  <td>{u.phone || 'Chưa có'}</td>
                  <td>
                    <span className={`badge ${u.status === 'locked' ? 'badge-locked' : 'badge-active'}`}>
                      {u.status === 'locked' ? '🔒 Locked' : '✅ Active'}
                    </span>
                  </td>
                  <td><strong style={{ color: 'var(--primary)' }}>{u.totalOrders || 0}</strong> đơn</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action" onClick={() => handleOpenEdit(u)}>✏️ Sửa</button>
                      <button className={`btn-action ${u.status === 'locked' ? 'btn-unlock' : 'btn-lock'}`} onClick={() => handleToggleLock(u.userId)}>
                        {u.status === 'locked' ? '🔓 Mở Khóa' : '🔒 Khóa TK'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} title="Sửa Hồ Sơ Khách Hàng" onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Email</label>
            <input type="text" className="input-control" value={selectedUser?.email || ''} readOnly style={{ opacity: 0.6 }} />
          </div>
          <div className="form-group">
            <label>Họ và Tên</label>
            <input type="text" className="input-control" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Số Điện Thoại</label>
            <input type="text" className="input-control" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Trạng Thái</label>
            <select className="select-control" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
              <option value="active">Active (Hoạt động)</option>
              <option value="locked">Locked (Khóa)</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Hủy</button>
            <button type="submit" className="btn-primary">Lưu Thay Đổi</button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
