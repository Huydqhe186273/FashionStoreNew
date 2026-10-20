import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/notificationService';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const { toast } = useToast();
  const navigate = useNavigate();
  const userId = user?.id;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getNotifications(userId);
      setNotifications(data || []);
    } catch (err) {
      console.error('Lỗi tải thông báo:', err);
      toast.error('Không thể tải danh sách thông báo.');
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if (authLoading) return;
    if (userId) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [userId, authLoading, fetchNotifications]);

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Lỗi đánh dấu đã đọc:', err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      await markAllNotificationsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc.');
    } catch (err) {
      console.error('Lỗi đánh dấu tất cả đã đọc:', err);
      toast.error('Không thể thực hiện.');
    }
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') return notifications.filter((n) => !n.isRead);
    if (activeTab === 'read') return notifications.filter((n) => n.isRead);
    return notifications;
  }, [notifications, activeTab]);

  if (authLoading || loading) {
    return (
      <div className="notif-page-wrapper" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#64748b', fontWeight: '500' }}>Đang tải thông báo...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="notif-page-wrapper">
        <div className="notif-empty-box">
          <div className="notif-empty-icon">🔒</div>
          <h2 className="notif-empty-title">Bạn chưa đăng nhập</h2>
          <p className="notif-empty-desc">Vui lòng đăng nhập để xem thông báo cập nhật đơn hàng và các chương trình ưu đãi.</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="notif-page-wrapper">
      {/* Header */}
      <div className="notif-header-bar">
        <div className="notif-title-group">
          <button
            type="button"
            onClick={() => navigate('/shop')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontWeight: '600', fontSize: '0.9rem', marginRight: '8px' }}
          >
            ← Cửa hàng
          </button>
          <h1 className="notif-title">Thông báo của bạn</h1>
          {unreadCount > 0 && (
            <span className="notif-unread-badge">{unreadCount} mới</span>
          )}
        </div>

        <div className="notif-header-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="btn-mark-all-read"
            >
              ✓ Đọc tất cả
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="notif-filter-tabs">
        <button
          type="button"
          className={`notif-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          type="button"
          className={`notif-tab-btn ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveTab('unread')}
        >
          Chưa đọc ({unreadCount})
        </button>
        <button
          type="button"
          className={`notif-tab-btn ${activeTab === 'read' ? 'active' : ''}`}
          onClick={() => setActiveTab('read')}
        >
          Đã đọc ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Danh sách thông báo */}
      {filteredNotifications.length === 0 ? (
        <div className="notif-empty-box">
          <div className="notif-empty-icon">🔔</div>
          <h2 className="notif-empty-title">Không có thông báo nào</h2>
          <p className="notif-empty-desc">
            {activeTab === 'unread'
              ? 'Tuyệt vời! Bạn đã đọc hết tất cả các thông báo.'
              : 'Bạn chưa có thông báo nào mới từ hệ thống.'}
          </p>
        </div>
      ) : (
        <div className="notif-list">
          {filteredNotifications.map((n) => {
            const isOrder = n.type === 'order' || (n.content && n.content.includes('Đơn hàng'));
            const icon = isOrder ? '🛍️' : n.type === 'promotion' ? '🏷️' : '🔔';

            return (
              <div
                key={n.notificationId}
                className={`notif-card ${!n.isRead ? 'unread' : ''}`}
                onClick={() => !n.isRead && handleMarkRead(n.notificationId)}
              >
                <div className="notif-icon-wrap">{icon}</div>

                <div className="notif-content-wrap">
                  <div className="notif-content-text">{n.content}</div>

                  <div className="notif-meta-bar">
                    {!n.isRead && <span className="notif-dot-unread" title="Chưa đọc" />}
                    <span>{n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}</span>

                    {isOrder && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!n.isRead) handleMarkRead(n.notificationId);
                          navigate('/shop/orders');
                        }}
                        className="notif-action-btn"
                      >
                        Xem đơn hàng →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
