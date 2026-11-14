import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import {
  Users,
  CheckCircle2,
  Lock,
  Unlock,
  ShieldOff
} from 'lucide-react';
import { getUsers, toggleUserLock } from '../services/userService';
import { useToast } from '../context/ToastContext';

export default function ManageUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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

  return (
    <main>
      <Header
        title="Quản Lý Tài Khoản Khách Hàng"
        subtitle="Xem danh sách, tìm kiếm và Khóa / Mở khóa tài khoản khách hàng"
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
                        <button
                          className={`btn-action ${u.status === 'locked' ? 'btn-unlock' : 'btn-lock'}`}
                          onClick={() => handleToggleLock(u)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          {u.status === 'locked'
                            ? <><Unlock size={13} /> Mở Khóa</>
                            : <><Lock size={13} /> Khóa TK</>
                          }
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
    </main>
  );
}
