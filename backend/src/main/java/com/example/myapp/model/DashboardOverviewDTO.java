package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardOverviewDTO {
    // KPI Overview
    private BigDecimal totalRevenue;
    private long totalOrders;
    private long totalProducts;
    private long totalUsers;

    // Order Breakdown by Status
    private long pendingOrders;
    private long confirmedOrders;
    private long shippingOrders;
    private long deliveredOrders;
    private long cancelledOrders;

    // Product Stats
    private long activeProducts;
    private long inactiveProducts;
    private long totalStockQuantity;

    // User Breakdown by Role
    private long customerCount;
    private long staffCount;
    private long adminCount;

    // Lists & Charts
    private List<RevenueChartDTO> revenueChart;
    private List<RecentOrderDTO> recentOrders;
    private List<TopProductDTO> topProducts;
}
