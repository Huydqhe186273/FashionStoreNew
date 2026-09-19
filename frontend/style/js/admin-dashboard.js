let myChart = null;

// Fallback Sample Data if API server is not running directly during preview
const mockDashboardData = {
    totalRevenue: 245800000,
    totalOrders: 148,
    totalProducts: 45,
    totalUsers: 82,
    pendingOrders: 15,
    confirmedOrders: 28,
    shippingOrders: 32,
    deliveredOrders: 65,
    cancelledOrders: 8,
    activeProducts: 40,
    inactiveProducts: 5,
    totalStockQuantity: 1250,
    customerCount: 75,
    staffCount: 5,
    adminCount: 2,
    revenueChart: [
        { label: 'Tháng 1', revenue: 12000000, orderCount: 10 },
        { label: 'Tháng 2', revenue: 18500000, orderCount: 14 },
        { label: 'Tháng 3', revenue: 15000000, orderCount: 12 },
        { label: 'Tháng 4', revenue: 22000000, orderCount: 18 },
        { label: 'Tháng 5', revenue: 28000000, orderCount: 22 },
        { label: 'Tháng 6', revenue: 35000000, orderCount: 25 },
        { label: 'Tháng 7', revenue: 31000000, orderCount: 21 },
        { label: 'Tháng 8', revenue: 42000000, orderCount: 30 },
        { label: 'Tháng 9', revenue: 42300000, orderCount: 28 }
    ],
    recentOrders: [
        { orderId: 108, customerName: 'Nguyễn Văn A', customerEmail: 'customer1@example.com', totalAmount: 1250000, orderStatus: 'pending', paymentStatus: 'unpaid', createdAt: '2026-09-19T22:30:00' },
        { orderId: 107, customerName: 'Trần Thị B', customerEmail: 'thib@example.com', totalAmount: 890000, orderStatus: 'shipping', paymentStatus: 'paid', createdAt: '2026-09-19T21:15:00' },
        { orderId: 106, customerName: 'Lê Hoàng C', customerEmail: 'hoangc@example.com', totalAmount: 2100000, orderStatus: 'delivered', paymentStatus: 'paid', createdAt: '2026-09-19T18:45:00' },
        { orderId: 105, customerName: 'Phạm Minh D', customerEmail: 'minhd@example.com', totalAmount: 450000, orderStatus: 'confirmed', paymentStatus: 'paid', createdAt: '2026-09-19T15:20:00' },
        { orderId: 104, customerName: 'Đỗ Quang E', customerEmail: 'quange@example.com', totalAmount: 1780000, orderStatus: 'cancelled', paymentStatus: 'refunded', createdAt: '2026-09-19T11:10:00' }
    ],
    topProducts: [
        { productId: 1, name: 'Áo Polo Nam Premium Flex', categoryName: 'Áo', basePrice: 350000, discountPrice: 299000, soldCount: 142, primaryImageUrl: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=100' },
        { productId: 2, name: 'Quần Jean Slimfit Co Giãn', categoryName: 'Quần', basePrice: 550000, discountPrice: 480000, soldCount: 98, primaryImageUrl: 'https://images.unsplash.com/photo-1542272604-780c36856842?w=100' },
        { productId: 3, name: 'Váy Dáng Xòe Floral Spring', categoryName: 'Váy', basePrice: 620000, discountPrice: 550000, soldCount: 76, primaryImageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=100' },
        { productId: 4, name: 'Áo Khoác Bomber Minimalist', categoryName: 'Áo khoác', basePrice: 850000, discountPrice: 750000, soldCount: 64, primaryImageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=100' }
    ]
};

function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatStatusBadge(status) {
    const map = {
        'pending': '<span class="badge badge-pending">Chờ xác nhận</span>',
        'confirmed': '<span class="badge badge-confirmed">Đã xác nhận</span>',
        'shipping': '<span class="badge badge-shipping">Đang giao</span>',
        'delivered': '<span class="badge badge-delivered">Đã giao</span>',
        'cancelled': '<span class="badge badge-cancelled">Đã hủy</span>'
    };
    return map[status?.toLowerCase()] || `<span class="badge">${status}</span>`;
}

async function fetchDashboardData() {
    const spinner = document.getElementById('loadingSpinner');
    const statusBadge = document.getElementById('apiStatusBadge');
    if (spinner) spinner.style.display = 'flex';

    try {
        const response = await fetch('http://localhost:8080/api/admin/dashboard/overview', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('API server returned error');
        const data = await response.json();
        
        if (statusBadge) {
            statusBadge.innerHTML = '<span class="status-dot"></span> Backend Live Connected';
            statusBadge.style.color = 'var(--success)';
        }
        renderDashboard(data);

    } catch (err) {
        console.warn('Backend API connection offline/not started yet. Rendering preview mock data.', err);
        if (statusBadge) {
            statusBadge.innerHTML = '<span class="status-dot" style="background: var(--warning); box-shadow: 0 0 8px var(--warning);"></span> Demo Mode (Fallback Data)';
            statusBadge.style.color = 'var(--warning)';
        }
        renderDashboard(mockDashboardData);
    } finally {
        if (spinner) spinner.style.display = 'none';
    }
}

function renderDashboard(data) {
    // Render KPI cards
    const elRev = document.getElementById('kpiRevenue');
    if (elRev) elRev.innerText = formatCurrency(data.totalRevenue);
    
    const elOrd = document.getElementById('kpiOrders');
    if (elOrd) elOrd.innerText = data.totalOrders || 0;
    
    const elProd = document.getElementById('kpiProducts');
    if (elProd) elProd.innerText = data.totalProducts || 0;
    
    const elStock = document.getElementById('kpiStock');
    if (elStock) elStock.innerText = data.totalStockQuantity || 0;

    const elUsers = document.getElementById('kpiUsers');
    if (elUsers) elUsers.innerText = data.totalUsers || 0;

    const elCust = document.getElementById('kpiCustomers');
    if (elCust) elCust.innerText = data.customerCount || 0;

    const elStaff = document.getElementById('kpiStaff');
    if (elStaff) elStaff.innerText = data.staffCount || 0;

    // Render Order Status Breakdown
    const totalOrders = data.totalOrders || 1;
    const cntPending = document.getElementById('cntPending');
    if (cntPending) cntPending.innerText = data.pendingOrders || 0;
    const barPending = document.getElementById('barPending');
    if (barPending) barPending.style.width = ((data.pendingOrders || 0) / totalOrders * 100) + '%';

    const cntConfirmed = document.getElementById('cntConfirmed');
    if (cntConfirmed) cntConfirmed.innerText = data.confirmedOrders || 0;
    const barConfirmed = document.getElementById('barConfirmed');
    if (barConfirmed) barConfirmed.style.width = ((data.confirmedOrders || 0) / totalOrders * 100) + '%';

    const cntShipping = document.getElementById('cntShipping');
    if (cntShipping) cntShipping.innerText = data.shippingOrders || 0;
    const barShipping = document.getElementById('barShipping');
    if (barShipping) barShipping.style.width = ((data.shippingOrders || 0) / totalOrders * 100) + '%';

    const cntDelivered = document.getElementById('cntDelivered');
    if (cntDelivered) cntDelivered.innerText = data.deliveredOrders || 0;
    const barDelivered = document.getElementById('barDelivered');
    if (barDelivered) barDelivered.style.width = ((data.deliveredOrders || 0) / totalOrders * 100) + '%';

    const cntCancelled = document.getElementById('cntCancelled');
    if (cntCancelled) cntCancelled.innerText = data.cancelledOrders || 0;
    const barCancelled = document.getElementById('barCancelled');
    if (barCancelled) barCancelled.style.width = ((data.cancelledOrders || 0) / totalOrders * 100) + '%';

    // Render Chart
    renderChart(data.revenueChart || []);

    // Render Recent Orders Table
    const recentTbody = document.getElementById('recentOrdersTbody');
    if (recentTbody) {
        if (data.recentOrders && data.recentOrders.length > 0) {
            recentTbody.innerHTML = data.recentOrders.map(o => `
                <tr>
                    <td><strong>#ORD-${o.orderId}</strong></td>
                    <td>
                        <div style="font-weight: 600;">${o.customerName || 'Khách Vô Danh'}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${o.customerEmail || ''}</div>
                    </td>
                    <td class="price-text">${formatCurrency(o.totalAmount)}</td>
                    <td>${formatStatusBadge(o.orderStatus)}</td>
                    <td style="font-size: 0.8rem; color: var(--text-muted);">${formatDate(o.createdAt)}</td>
                </tr>
            `).join('');
        } else {
            recentTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Chưa có đơn hàng nào</td></tr>';
        }
    }

    // Render Top Products Table
    const topTbody = document.getElementById('topProductsTbody');
    if (topTbody) {
        if (data.topProducts && data.topProducts.length > 0) {
            topTbody.innerHTML = data.topProducts.map(p => `
                <tr>
                    <td>
                        <div class="product-item">
                            <img class="product-img" src="${p.primaryImageUrl || 'https://via.placeholder.com/40'}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100'">
                            <div class="product-meta">
                                <div class="p-name">${p.name}</div>
                                <div class="p-cat">${p.categoryName || 'Fashion'}</div>
                            </div>
                        </div>
                    </td>
                    <td><strong style="color: var(--success);">${p.soldCount || 0}</strong> sp</td>
                    <td class="price-text">${formatCurrency(p.discountPrice || p.basePrice)}</td>
                </tr>
            `).join('');
        } else {
            topTbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Chưa có dữ liệu sản phẩm</td></tr>';
        }
    }
}

function renderChart(chartData) {
    const canvas = document.getElementById('revenueChartCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const labels = chartData.map(c => c.label);
    const revenues = chartData.map(c => c.revenue);

    if (myChart) {
        myChart.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: revenues,
                borderColor: '#6366f1',
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#ffffff',
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ' Doanh thu: ' + formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#9ca3af',
                        callback: function(value) {
                            return (value / 1000000) + ' Tr ₫';
                        }
                    }
                }
            }
        }
    });
}

// Initialize dashboard on load
window.addEventListener('DOMContentLoaded', fetchDashboardData);
