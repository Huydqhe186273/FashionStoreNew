import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { getDashboardOverview } from '../services/dashboardService';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const mockOverview = {
  totalRevenue: 245800000,
  totalOrders: 148,
  totalProducts: 45,
  totalUsers: 82,
  pendingOrders: 15,
  confirmedOrders: 28,
  shippingOrders: 32,
  deliveredOrders: 65,
  cancelledOrders: 8,
  totalStockQuantity: 1250,
  customerCount: 75,
  staffCount: 5,
  revenueChart: [
    { label: 'Tháng 1', revenue: 12000000 },
    { label: 'Tháng 2', revenue: 18500000 },
    { label: 'Tháng 3', revenue: 15000000 },
    { label: 'Tháng 4', revenue: 22000000 },
    { label: 'Tháng 5', revenue: 28000000 },
    { label: 'Tháng 6', revenue: 35000000 },
    { label: 'Tháng 7', revenue: 31000000 },
    { label: 'Tháng 8', revenue: 42000000 },
    { label: 'Tháng 9', revenue: 42300000 }
  ],
  recentOrders: [
    { orderId: 108, customerName: 'Nguyễn Văn A', totalAmount: 1250000, orderStatus: 'pending', createdAt: '2026-09-19T22:30:00' },
    { orderId: 107, customerName: 'Trần Thị B', totalAmount: 890000, orderStatus: 'shipping', createdAt: '2026-09-19T21:15:00' },
    { orderId: 106, customerName: 'Lê Hoàng C', totalAmount: 2100000, orderStatus: 'delivered', createdAt: '2026-09-19T18:45:00' }
  ],
  topProducts: [
    { productId: 1, name: 'Áo Polo Nam Premium Flex', categoryName: 'Áo', basePrice: 350000, discountPrice: 299000, soldCount: 142 },
    { productId: 2, name: 'Quần Jean Slimfit Co Giãn', categoryName: 'Quần', basePrice: 550000, discountPrice: 480000, soldCount: 98 }
  ]
};

export default function DashboardOverview() {
  const [data, setData] = useState(mockOverview);
  const [isLive, setIsLive] = useState(false);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const loadData = async () => {
    try {
      const res = await getDashboardOverview();
      setData(res);
      setIsLive(true);
    } catch (err) {
      console.warn('Axios call failed, using mock data:', err);
      setData(mockOverview);
      setIsLive(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const chartData = {
    labels: (data.revenueChart || []).map(item => item.label),
    datasets: [
      {
        fill: true,
        label: 'Doanh thu (VNĐ)',
        data: (data.revenueChart || []).map(item => item.revenue),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        tension: 0.4
      }
    ]
  };

  const totalOrd = data.totalOrders || 1;

  return (
    <main>
      <Header 
        title="Báo cáo Tổng quan Admin (ReactJS)" 
        subtitle="Theo dõi các chỉ số kinh doanh Doanh thu, Đơn hàng, Sản phẩm & Khách hàng realtime qua Axios"
        isLive={isLive}
        onRefresh={loadData}
      />

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#6366f1' }}>💵</div>
          <div>
            <div className="stat-val">{formatCurrency(data.totalRevenue)}</div>
            <div className="stat-label">Tổng Doanh Thu</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#3b82f6' }}>🛍️</div>
          <div>
            <div className="stat-val">{data.totalOrders || 0}</div>
            <div className="stat-label">Tổng Đơn Hàng</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#10b981' }}>📦</div>
          <div>
            <div className="stat-val">{data.totalProducts || 0}</div>
            <div className="stat-label">Sản Phẩm (Tồn kho: {data.totalStockQuantity || 0})</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#f59e0b' }}>👤</div>
          <div>
            <div className="stat-val">{data.totalUsers || 0}</div>
            <div className="stat-label">Khách Hàng (Customer: {data.customerCount || 0})</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="panel-card" style={{ marginBottom: '28px' }}>
        <h3 style={{ marginBottom: '16px' }}>Biểu đồ Biến động Doanh Thu theo Tháng</h3>
        <div style={{ height: '300px' }}>
          <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

      {/* Order Status & Tables */}
      <div className="panel-card">
        <h3 style={{ marginBottom: '16px' }}>Đơn Hàng Gần Đây</h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {(data.recentOrders || []).map(o => (
                <tr key={o.orderId}>
                  <td><strong>#ORD-{o.orderId}</strong></td>
                  <td>{o.customerName || 'N/A'}</td>
                  <td><strong style={{ color: '#ffffff' }}>{formatCurrency(o.totalAmount)}</strong></td>
                  <td><span className="badge badge-active">{o.orderStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
