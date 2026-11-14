import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { Banknote, ShoppingBag, Package, Users } from 'lucide-react';
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

const emptyOverview = {
  totalRevenue: 0,
  totalOrders: 0,
  totalProducts: 0,
  totalUsers: 0,
  pendingOrders: 0,
  confirmedOrders: 0,
  shippingOrders: 0,
  deliveredOrders: 0,
  cancelledOrders: 0,
  totalStockQuantity: 0,
  customerCount: 0,
  staffCount: 0,
  revenueChart: [],
  recentOrders: [],
  topProducts: []
};

export default function DashboardOverview() {
  const [data, setData] = useState(emptyOverview);
  const [isLive, setIsLive] = useState(false);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const loadData = async () => {
    try {
      const res = await getDashboardOverview();
      setData(res || emptyOverview);
      setIsLive(true);
    } catch (err) {
      console.warn('Axios call failed:', err);
      setData(emptyOverview);
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
          <div className="stat-icon" style={{ color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Banknote size={26} />
          </div>
          <div className="stat-info">
            <div className="stat-val" title={formatCurrency(data.totalRevenue)}>{formatCurrency(data.totalRevenue)}</div>
            <div className="stat-label">Tổng Doanh Thu</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={26} />
          </div>
          <div className="stat-info">
            <div className="stat-val">{data.totalOrders || 0}</div>
            <div className="stat-label">Tổng Đơn Hàng</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={26} />
          </div>
          <div className="stat-info">
            <div className="stat-val">{data.totalProducts || 0}</div>
            <div className="stat-label">Sản Phẩm (Tồn kho: {data.totalStockQuantity || 0})</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={26} />
          </div>
          <div className="stat-info">
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
                  <td><strong style={{ color: 'var(--text-main, #111827)' }}>{formatCurrency(o.totalAmount)}</strong></td>
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
