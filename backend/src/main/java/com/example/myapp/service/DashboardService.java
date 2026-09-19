package com.example.myapp.service;

import com.example.myapp.entity.Order;
import com.example.myapp.entity.Product;
import com.example.myapp.entity.ProductImage;
import com.example.myapp.model.*;
import com.example.myapp.repos.OrderRepository;
import com.example.myapp.repos.ProductRepository;
import com.example.myapp.repos.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public DashboardOverviewDTO getDashboardOverview() {
        // KPI Metrics
        BigDecimal totalRevenue = orderRepository.sumTotalRevenue();
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        long totalOrders = orderRepository.count();
        long totalProducts = productRepository.count();
        long totalUsers = userRepository.count();

        // Order Status Breakdown
        long pendingOrders = orderRepository.countByOrderStatus("pending");
        long confirmedOrders = orderRepository.countByOrderStatus("confirmed");
        long shippingOrders = orderRepository.countByOrderStatus("shipping");
        long deliveredOrders = orderRepository.countByOrderStatus("delivered");
        long cancelledOrders = orderRepository.countByOrderStatus("cancelled");

        // Product Stats
        long activeProducts = productRepository.countByStatus("active");
        long inactiveProducts = productRepository.countByStatus("inactive");
        long totalStockQuantity = productRepository.sumTotalStockQuantity();

        // User Breakdown
        long customerCount = userRepository.countByRole("customer");
        long staffCount = userRepository.countByRole("staff");
        long adminCount = userRepository.countByRole("admin");

        // Recent Orders
        List<Order> recentOrderEntities = orderRepository.findTop10ByOrderByCreatedAtDesc();
        List<RecentOrderDTO> recentOrders = recentOrderEntities.stream().map(o -> RecentOrderDTO.builder()
                .orderId(o.getOrderId())
                .customerName(o.getUser() != null ? o.getUser().getFullName() : "N/A")
                .customerEmail(o.getUser() != null ? o.getUser().getEmail() : "N/A")
                .totalAmount(o.getTotalAmount())
                .orderStatus(o.getOrderStatus())
                .paymentStatus(o.getPaymentStatus())
                .createdAt(o.getCreatedAt())
                .build()
        ).collect(Collectors.toList());

        // Top Selling Products
        List<Product> topProductEntities = productRepository.findTop5ByOrderBySoldCountDesc();
        List<TopProductDTO> topProducts = topProductEntities.stream().map(p -> {
            String primaryImg = null;
            if (p.getProductImages() != null && !p.getProductImages().isEmpty()) {
                primaryImg = p.getProductImages().stream()
                        .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                        .map(ProductImage::getImageUrl)
                        .findFirst()
                        .orElse(p.getProductImages().get(0).getImageUrl());
            }

            return TopProductDTO.builder()
                    .productId(p.getProductId())
                    .name(p.getName())
                    .categoryName(p.getCategory() != null ? p.getCategory().getName() : "N/A")
                    .basePrice(p.getBasePrice())
                    .discountPrice(p.getDiscountPrice())
                    .soldCount(p.getSoldCount() != null ? p.getSoldCount() : 0)
                    .viewCount(p.getViewCount() != null ? p.getViewCount() : 0)
                    .primaryImageUrl(primaryImg)
                    .status(p.getStatus())
                    .build();
        }).collect(Collectors.toList());

        // Revenue Chart Data
        List<RevenueChartDTO> revenueChart = buildMonthlyRevenueChart();

        return DashboardOverviewDTO.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .totalProducts(totalProducts)
                .totalUsers(totalUsers)
                .pendingOrders(pendingOrders)
                .confirmedOrders(confirmedOrders)
                .shippingOrders(shippingOrders)
                .deliveredOrders(deliveredOrders)
                .cancelledOrders(cancelledOrders)
                .activeProducts(activeProducts)
                .inactiveProducts(inactiveProducts)
                .totalStockQuantity(totalStockQuantity)
                .customerCount(customerCount)
                .staffCount(staffCount)
                .adminCount(adminCount)
                .recentOrders(recentOrders)
                .topProducts(topProducts)
                .revenueChart(revenueChart)
                .build();
    }

    private List<RevenueChartDTO> buildMonthlyRevenueChart() {
        List<RevenueChartDTO> chart = new ArrayList<>();
        List<Object[]> stats = orderRepository.findMonthlyRevenueStats();

        // Standard 12 Months
        for (int month = 1; month <= 12; month++) {
            final int m = month;
            BigDecimal revenue = BigDecimal.ZERO;
            long orderCount = 0;

            for (Object[] row : stats) {
                if (row[0] != null && ((Number) row[0]).intValue() == m) {
                    revenue = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
                    orderCount = row[2] != null ? ((Number) row[2]).longValue() : 0;
                    break;
                }
            }

            chart.add(RevenueChartDTO.builder()
                    .label("Tháng " + m)
                    .revenue(revenue)
                    .orderCount(orderCount)
                    .build());
        }
        return chart;
    }
}
