import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { getReportsSummary } from '../services/reportService';

export default function ManageReports() {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'revenue', 'orders', 'bestsellers'
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  // Date range filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Report Data
  const [summaryData, setSummaryData] = useState(null);

  const loadReports = async (start = startDate, end = endDate) => {
    setLoading(true);
    try {
      const params = {};
      if (start) params.startDate = start;
      if (end) params.endDate = end;

      const data = await getReportsSummary(params);
      setSummaryData(data);
      setIsLive(true);
    } catch (err) {
      console.error('Lỗi khi tải báo cáo thống kê:', err);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleApplyFilter = (e) => {
    e?.preventDefault();
    loadReports(startDate, endDate);
  };

  const handleQuickPreset = (preset) => {
    const today = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    let start = '';
    let end = toDateStr(today);

    if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = toDateStr(d);
    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      start = toDateStr(d);
    } else if (preset === 'thisYear') {
      start = `${today.getFullYear()}-01-01`;
      end = `${today.getFullYear()}-12-31`;
    } else if (preset === 'all') {
      start = '';
      end = '';
    }

    setStartDate(start);
    setEndDate(end);
    loadReports(start, end);
  };

  const revenueReport = summaryData?.revenueReport || {
    totalRevenue: 0,
    totalDeliveredOrders: 0,
    averageOrderValue: 0,
    dailyBreakdown: [],
    deliveredOrders: []
  };

  const orderReport = summaryData?.orderReport || {
    totalOrders: 0,
    statusBreakdown: [],
    orders: []
  };

  const bestSellerReport = summaryData?.bestSellerReport || {
    totalProductsSold: 0,
    topProducts: []
  };

  const formatVND = (num) => {
    return Number(num || 0).toLocaleString('vi-VN') + ' đ';
  };

  return (
    <main>
      <Header
        title="Báo Cáo & Phân Tích Dữ Liệu (Reports & Analytics)"
        subtitle="Theo dõi chi tiết 3 báo cáo: Doanh thu theo ngày, Đơn hàng theo trạng thái và Top sản phẩm bán chạy"
        isLive={isLive}
        onRefresh={() => loadReports(startDate, endDate)}
      />

      {/* Date Range Selector Toolbar */}
      <div className="toolbar-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '14px' }}>
        <form onSubmit={handleApplyFilter} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#374151' }}>📅 Từ ngày:</span>
              <input
                type="date"
                className="input-control"
                style={{ width: 'auto' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#374151' }}>Đến ngày:</span>
              <input
                type="date"
                className="input-control"
                style={{ width: 'auto' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Lọc Dữ Liệu
            </button>
          </div>

          {/* Quick presets */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '6px 10px' }}
              onClick={() => handleQuickPreset('7days')}
            >
              7 ngày qua
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '6px 10px' }}
              onClick={() => handleQuickPreset('30days')}
            >
              30 ngày qua
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '6px 10px' }}
              onClick={() => handleQuickPreset('thisYear')}
            >
              Năm nay (2026)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '6px 10px' }}
              onClick={() => handleQuickPreset('all')}
            >
              Tất cả thời gian
            </button>
          </div>
        </form>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '12px', overflowX: 'auto' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '20px', padding: '6px 16px', fontSize: '0.88rem' }}
            onClick={() => setActiveTab('all')}
          >
            📊 Tổng Quan Cả 3 Báo Cáo
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'revenue' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '20px', padding: '6px 16px', fontSize: '0.88rem' }}
            onClick={() => setActiveTab('revenue')}
          >
            💰 1. Báo Cáo Doanh Thu (Revenue)
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '20px', padding: '6px 16px', fontSize: '0.88rem' }}
            onClick={() => setActiveTab('orders')}
          >
            📦 2. Báo Cáo Đơn Hàng (Orders)
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'bestsellers' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '20px', padding: '6px 16px', fontSize: '0.88rem' }}
            onClick={() => setActiveTab('bestsellers')}
          >
            🔥 3. Top Sản Phẩm Bán Chạy (Best Sellers)
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280', fontSize: '1rem' }}>
          ⏳ Đang tính toán và tổng hợp dữ liệu báo cáo...
        </div>
      )}

      {/* ---------------- SECTION 1: REVENUE REPORT ---------------- */}
      {(activeTab === 'all' || activeTab === 'revenue') && !loading && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💰</span> Báo Cáo Doanh Thu (Revenue Report)
              <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.75rem' }}>
                Chỉ tính đơn DELIVERED
              </span>
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Khoảng thời gian: {startDate || 'Từ đầu'} ➔ {endDate || 'Hiện tại'}
            </span>
          </div>

          {/* Revenue KPI Cards */}
          <div className="stats-grid">
            <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="stat-icon" style={{ color: '#10b981' }}>💵</div>
              <div className="stat-info">
                <div className="stat-val" style={{ color: '#10b981' }} title={formatVND(revenueReport.totalRevenue)}>
                  {formatVND(revenueReport.totalRevenue)}
                </div>
                <div className="stat-label">Tổng Doanh Thu Thực Tế (DELIVERED)</div>
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div className="stat-icon" style={{ color: '#3b82f6' }}>✅</div>
              <div className="stat-info">
                <div className="stat-val">{revenueReport.totalDeliveredOrders}</div>
                <div className="stat-label">Đơn Hàng Giao Thành Công</div>
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <div className="stat-icon" style={{ color: '#8b5cf6' }}>📈</div>
              <div className="stat-info">
                <div className="stat-val" title={formatVND(revenueReport.averageOrderValue)}>
                  {formatVND(revenueReport.averageOrderValue)}
                </div>
                <div className="stat-label">Giá Trị Trung Bình / Đơn (AOV)</div>
              </div>
            </div>
          </div>

          {/* Daily Revenue Breakdown Table */}
          <div className="table-card" style={{ marginBottom: '20px' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#1f2937' }}>
                📅 Thống Kê Doanh Thu Theo Từng Ngày
              </h4>
              <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                Tổng {revenueReport.dailyBreakdown?.length || 0} ngày phát sinh đơn giao thành công
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>NGÀY GIAO DỊCH</th>
                    <th>SỐ ĐƠN THÀNH CÔNG</th>
                    <th>DOANH THU TRONG NGÀY</th>
                    <th style={{ width: '40%' }}>TỶ TRỌNG TRÊN TỔNG DOANH THU</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueReport.dailyBreakdown?.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                        Không có doanh thu từ đơn DELIVERED trong khoảng ngày đã chọn.
                      </td>
                    </tr>
                  ) : (
                    revenueReport.dailyBreakdown.map((d, idx) => {
                      const maxDaily = Math.max(...revenueReport.dailyBreakdown.map((x) => Number(x.revenue) || 1));
                      const percentOfMax = Math.min(100, Math.round(((Number(d.revenue) || 0) / maxDaily) * 100));

                      return (
                        <tr key={idx}>
                          <td>
                            <strong>{d.formattedDate}</strong>
                          </td>
                          <td>
                            <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                              {d.orderCount} đơn
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: '#10b981' }}>{formatVND(d.revenue)}</strong>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ flex: 1, height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${percentOfMax}%`, height: '100%', background: '#10b981', borderRadius: '4px' }}></div>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280', minWidth: '40px' }}>{percentOfMax}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION 2: ORDER REPORT ---------------- */}
      {(activeTab === 'all' || activeTab === 'orders') && !loading && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📦</span> Báo Cáo Đơn Hàng (Order Report)
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Tổng cộng: <strong>{orderReport.totalOrders} đơn hàng</strong>
            </span>
          </div>

          {/* Order Status Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            {orderReport.statusBreakdown?.map((st) => (
              <div
                key={st.status}
                className="stat-card"
                style={{ borderTop: `4px solid ${st.color}`, padding: '14px' }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: st.color, textTransform: 'uppercase' }}>
                    {st.label}
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#111827', margin: '4px 0' }}>
                    {st.count} <span style={{ fontSize: '0.85rem', fontWeight: '400', color: '#6b7280' }}>đơn</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                    Chiếm: <strong>{st.percentage}%</strong> ({formatVND(st.totalAmount)})
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Status Breakdown Progress Bar */}
          <div className="toolbar-card" style={{ padding: '16px', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>
              <span>Phân Bổ Tỷ Trọng Trạng Thái Đơn Hàng</span>
              <span>Tổng: {orderReport.totalOrders} đơn</span>
            </div>
            <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', background: '#e5e7eb' }}>
              {orderReport.statusBreakdown?.map((st) => (
                st.percentage > 0 && (
                  <div
                    key={st.status}
                    style={{
                      width: `${st.percentage}%`,
                      background: st.color,
                      title: `${st.label}: ${st.count} đơn (${st.percentage}%)`
                    }}
                  />
                )
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.78rem', marginTop: '4px' }}>
              {orderReport.statusBreakdown?.map((st) => (
                <div key={st.status} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: st.color }}></span>
                  <span>{st.label}: <strong>{st.count}</strong> ({st.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Details Table */}
          <div className="table-card" style={{ marginBottom: '20px' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#1f2937' }}>
                📋 Bảng Chi Tiết Số Liệu Theo Trạng Thái
              </h4>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>TRẠNG THÁI</th>
                    <th>TÊN HIỂN THỊ</th>
                    <th>SỐ LƯỢNG ĐƠN</th>
                    <th>TỶ LỆ PHẦN TRĂM (%)</th>
                    <th>TỔNG GIÁ TRỊ (VNĐ)</th>
                  </tr>
                </thead>
                <tbody>
                  {orderReport.statusBreakdown?.map((st) => (
                    <tr key={st.status}>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: `${st.color}20`,
                            color: st.color,
                            fontWeight: '700'
                          }}
                        >
                          {st.status}
                        </span>
                      </td>
                      <td><strong>{st.label}</strong></td>
                      <td>
                        <strong style={{ fontSize: '1rem' }}>{st.count}</strong> đơn
                      </td>
                      <td>
                        <span style={{ fontWeight: '600' }}>{st.percentage}%</span>
                      </td>
                      <td>
                        <strong style={{ color: '#111827' }}>{formatVND(st.totalAmount)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION 3: BEST SELLER REPORT ---------------- */}
      {(activeTab === 'all' || activeTab === 'bestsellers') && !loading && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔥</span> Báo Cáo Sản Phẩm Bán Chạy (Best Seller Report)
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Tổng sản phẩm đã bán: <strong>{bestSellerReport.totalProductsSold} sản phẩm</strong>
            </span>
          </div>

          {/* Best Sellers Table */}
          <div className="table-card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#1f2937' }}>
                🏆 Bảng Xếp Hạng Top Sản Phẩm Bán Chạy Nhất
              </h4>
              <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                Xếp hạng dựa trên số lượng bán (Pieces Sold)
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px', textAlign: 'center' }}>HẠNG</th>
                    <th>SẢN PHẨM</th>
                    <th>DANH MỤC</th>
                    <th>GIÁ BÁN HIỆN TẠI</th>
                    <th style={{ textAlign: 'center' }}>ĐÃ BÁN (SỐ LƯỢNG)</th>
                    <th>DOANH THU ƯỚC TÍNH</th>
                    <th>TỒN KHO</th>
                    <th>TÌNH TRẠNG</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSellerReport.topProducts?.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                        Chưa có dữ liệu sản phẩm bán chạy trong khoảng thời gian này.
                      </td>
                    </tr>
                  ) : (
                    bestSellerReport.topProducts.map((p, index) => {
                      const rank = index + 1;
                      const badgeColor =
                        rank === 1 ? '#eab308' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : '#6b7280';

                      return (
                        <tr key={p.productId}>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: rank <= 3 ? `${badgeColor}25` : '#f3f4f6',
                                color: badgeColor,
                                fontWeight: '700',
                                fontSize: '0.9rem'
                              }}
                            >
                              {rank <= 3 ? `★${rank}` : rank}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {p.primaryImageUrl ? (
                                <img
                                  src={p.primaryImageUrl}
                                  alt={p.productName}
                                  loading="lazy"
                                  decoding="async"
                                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '6px',
                                    background: '#e0e7ff',
                                    color: '#4338ca',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  SP
                                </div>
                              )}
                              <div>
                                <strong style={{ color: '#111827', fontSize: '0.95rem' }}>{p.productName}</strong>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Mã SP: #{p.productId}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge" style={{ background: '#f3f4f6', color: '#374151' }}>
                              {p.categoryName || 'Chung'}
                            </span>
                          </td>
                          <td>
                            <div>
                              <strong style={{ color: '#111827' }}>
                                {formatVND(p.discountPrice || p.basePrice)}
                              </strong>
                              {p.discountPrice && p.discountPrice < p.basePrice ? (
                                <div style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: '#9ca3af' }}>
                                  {formatVND(p.basePrice)}
                                </div>
                              ) : null}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              style={{
                                background: '#fef3c7',
                                color: '#b45309',
                                fontWeight: '700',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.95rem'
                              }}
                            >
                              {p.totalQuantitySold} cái
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: '#10b981' }}>{formatVND(p.totalRevenue)}</strong>
                          </td>
                          <td>
                            <strong style={{ color: p.currentStock > 10 ? '#111827' : '#ef4444' }}>
                              {p.currentStock !== undefined && p.currentStock !== null ? p.currentStock : 0}
                            </strong>
                          </td>
                          <td>
                            {p.currentStock > 10 ? (
                              <span className="badge badge-success">Còn hàng</span>
                            ) : p.currentStock > 0 ? (
                              <span className="badge" style={{ background: '#fef3c7', color: '#d97706' }}>
                                Sắp hết
                              </span>
                            ) : (
                              <span className="badge" style={{ background: '#fee2e2', color: '#dc2626' }}>
                                Hết hàng
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
