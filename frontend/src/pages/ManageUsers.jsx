import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { getUsers, createUser, updateUser, toggleUserLock } from '../services/userService';

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

  // Modal State (Gộp Thêm & Sửa làm 1)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null: Thêm mới, object: Đang sửa

  const initialForm = {
    fullName: '',
    email: '',
    phone: '',
    status: 'active'
  };
  const [formData, setFormData] = useState(initialForm);

  const loadUsers = async () => {
    try {
      const data = await getUsers({ keyword: search, status: statusFilter });
      setUsers(data);
      setIsLive(true);
    } catch (err) {
      console.warn('Axios error, fallback mock users:', err);
      setIsLive(false);
      let filtered = mockUsers.filter(u => {
        const matchSearch = !search || 
          u.fullName.toLowerCase().includes(search.toLowerCase()) || 
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          (u.phone && u.phone.includes(search));
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

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData(initialForm);
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
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData(initialForm);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();

    if (editingUser) {
      // Cập nhật người dùng hiện có
      try {
        await updateUser(editingUser.userId, formData);
        handleCloseModal();
        loadUsers();
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.error || err.message;
        alert("Lỗi khi cập nhật khách hàng: " + msg);
        // Fallback offline mock update
        setUsers(prev => prev.map(u => u.userId === editingUser.userId ? { ...u, ...formData } : u));
        handleCloseModal();
      }
    } else {
      // Tạo mới người dùng
      try {
        await createUser(formData);
        handleCloseModal();
        loadUsers();
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.error || err.message;
        alert("Lỗi khi tạo khách hàng: " + msg);
        // Fallback offline mock add
        setUsers(prev => [
          {
            ...formData,
            userId: prev.length > 0 ? Math.max(...prev.map(u => u.userId)) + 1 : 1,
            role: 'customer',
            totalOrders: 0
          },
          ...prev
        ]);
        handleCloseModal();
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
        <button className="btn-primary" onClick={handleOpenAdd}>➕ Thêm Khách Hàng Mới</button>
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
              {users.length === 0 ? (
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
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              className="input-control" 
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              required 
              readOnly={!!editingUser}
              style={editingUser ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
              placeholder="ví dụ: customer@example.com"
            />
            {editingUser && (
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Email định danh tài khoản không thể chỉnh sửa</small>
            )}
          </div>

          <div className="form-group">
            <label>Họ và Tên</label>
            <input 
              type="text" 
              className="input-control" 
              value={formData.fullName} 
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} 
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
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
              placeholder="ví dụ: 0912345678 (10 chữ số)"
              pattern="^0[35789][0-9]{8}$"
              maxLength={10}
              title="Số điện thoại Việt Nam gồm đúng 10 chữ số bắt đầu bằng 03, 05, 07, 08 hoặc 09"
            />
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
            <button type="button" className="btn-cancel" onClick={handleCloseModal}>Hủy</button>
            <button type="submit" className="btn-primary">
              {editingUser ? "Lưu Thay Đổi" : "Tạo Khách Hàng"}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}

