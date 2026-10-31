package com.example.myapp.service;

import com.example.myapp.entity.*;
import com.example.myapp.model.*;
import com.example.myapp.repos.OrderRepository;
import com.example.myapp.repos.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AdminReportService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public AdminReportService(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Khoảng thời gian không hợp lệ: Ngày bắt đầu không được sau ngày kết thúc!");
        }
    }

    public RevenueReportDTO getRevenueReport(LocalDate startDate, LocalDate endDate) {
        validateDateRange(startDate, endDate);
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(23, 59, 59, 999999999) : null;

        List<Order> deliveredOrders = orderRepository.findDeliveredOrdersBetweenDates(startDateTime, endDateTime);

        BigDecimal totalRevenue = BigDecimal.ZERO;
        Map<LocalDate, DailyAccumulator> dailyMap = new TreeMap<>();

        List<RecentOrderDTO> orderDTOs = new ArrayList<>();

        for (Order o : deliveredOrders) {
            BigDecimal amount = o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO;
            totalRevenue = totalRevenue.add(amount);

            LocalDate orderDate = o.getCreatedAt() != null ? o.getCreatedAt().toLocalDate() : LocalDate.now();
            dailyMap.computeIfAbsent(orderDate, k -> new DailyAccumulator()).add(amount);

            String customerName = o.getUser() != null && o.getUser().getFullName() != null
                    ? o.getUser().getFullName() : "Khách hàng #" + o.getOrderId();
            String customerEmail = o.getUser() != null ? o.getUser().getEmail() : "N/A";

            orderDTOs.add(RecentOrderDTO.builder()
                    .orderId(o.getOrderId())
                    .customerName(customerName)
                    .customerEmail(customerEmail)
                    .totalAmount(amount)
                    .orderStatus(StaffOrderService.normalizeStatus(o.getOrderStatus()))
                    .paymentStatus(o.getPaymentStatus() != null ? o.getPaymentStatus() : "paid")
                    .createdAt(o.getCreatedAt())
                    .build());
        }

        long totalDeliveredCount = deliveredOrders.size();
        BigDecimal aov = totalDeliveredCount > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalDeliveredCount), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        List<DailyRevenueDTO> dailyBreakdown = dailyMap.entrySet().stream()
                .map(entry -> DailyRevenueDTO.builder()
                        .date(entry.getKey())
                        .formattedDate(entry.getKey().format(dtf))
                        .revenue(entry.getValue().revenue)
                        .orderCount(entry.getValue().count)
                        .build())
                .collect(Collectors.toList());

        return RevenueReportDTO.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalRevenue(totalRevenue)
                .totalDeliveredOrders(totalDeliveredCount)
                .averageOrderValue(aov)
                .dailyBreakdown(dailyBreakdown)
                .deliveredOrders(orderDTOs)
                .build();
    }

    public OrderReportDTO getOrderReport(LocalDate startDate, LocalDate endDate) {
        validateDateRange(startDate, endDate);
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(23, 59, 59, 999999999) : null;

        List<Order> orders = orderRepository.findOrdersBetweenDates(startDateTime, endDateTime);
        long totalOrders = orders.size();

        // 5 standard statuses
        Map<String, StatusAccumulator> statusMap = new LinkedHashMap<>();
        statusMap.put("PENDING", new StatusAccumulator("PENDING", "Chờ xác nhận", "#f59e0b"));
        statusMap.put("PROCESSING", new StatusAccumulator("PROCESSING", "Đang xử lý", "#3b82f6"));
        statusMap.put("SHIPPED", new StatusAccumulator("SHIPPED", "Đang giao hàng", "#8b5cf6"));
        statusMap.put("DELIVERED", new StatusAccumulator("DELIVERED", "Đã giao hàng", "#10b981"));
        statusMap.put("CANCELLED", new StatusAccumulator("CANCELLED", "Đã hủy", "#ef4444"));

        List<RecentOrderDTO> orderDTOs = new ArrayList<>();

        for (Order o : orders) {
            String norm = StaffOrderService.normalizeStatus(o.getOrderStatus());
            StatusAccumulator acc = statusMap.get(norm);
            BigDecimal amount = o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO;
            if (acc != null) {
                acc.add(amount);
            } else {
                statusMap.computeIfAbsent(norm, k -> new StatusAccumulator(norm, norm, "#6b7280")).add(amount);
            }

            String customerName = o.getUser() != null && o.getUser().getFullName() != null
                    ? o.getUser().getFullName() : "Khách hàng #" + o.getOrderId();
            String customerEmail = o.getUser() != null ? o.getUser().getEmail() : "N/A";

            orderDTOs.add(RecentOrderDTO.builder()
                    .orderId(o.getOrderId())
                    .customerName(customerName)
                    .customerEmail(customerEmail)
                    .totalAmount(amount)
                    .orderStatus(norm)
                    .paymentStatus(o.getPaymentStatus() != null ? o.getPaymentStatus() : "unpaid")
                    .createdAt(o.getCreatedAt())
                    .build());
        }

        List<OrderStatusCountDTO> statusBreakdown = statusMap.values().stream()
                .map(acc -> {
                    double pct = totalOrders > 0
                            ? Math.round((acc.count * 100.0 / totalOrders) * 10.0) / 10.0
                            : 0.0;
                    return OrderStatusCountDTO.builder()
                            .status(acc.status)
                            .label(acc.label)
                            .color(acc.color)
                            .count(acc.count)
                            .percentage(pct)
                            .totalAmount(acc.totalAmount)
                            .build();
                })
                .collect(Collectors.toList());

        return OrderReportDTO.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalOrders(totalOrders)
                .statusBreakdown(statusBreakdown)
                .orders(orderDTOs)
                .build();
    }

    public BestSellerReportDTO getBestSellerReport(LocalDate startDate, LocalDate endDate, Integer limit) {
        validateDateRange(startDate, endDate);
        if (limit != null && (limit < 1 || limit > 100)) {
            throw new IllegalArgumentException("Số lượng giới hạn (limit) phải từ 1 đến 100!");
        }
        int maxResults = (limit != null && limit > 0) ? limit : 10;
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(23, 59, 59, 999999999) : null;

        List<Order> validOrders = orderRepository.findValidOrdersWithItemsBetweenDates(startDateTime, endDateTime);

        Map<Integer, ProductSaleAccumulator> salesMap = new HashMap<>();

        for (Order o : validOrders) {
            if (o.getOrderItems() != null) {
                for (OrderItem oi : o.getOrderItems()) {
                    ProductVariant v = oi.getVariant();
                    if (v != null && v.getProduct() != null) {
                        Product p = v.getProduct();
                        int qty = oi.getQuantity() != null ? oi.getQuantity() : 0;
                        BigDecimal price = oi.getPriceAtPurchase() != null ? oi.getPriceAtPurchase() : (p.getBasePrice() != null ? p.getBasePrice() : BigDecimal.ZERO);
                        BigDecimal itemRevenue = price.multiply(BigDecimal.valueOf(qty));

                        salesMap.computeIfAbsent(p.getProductId(), k -> new ProductSaleAccumulator(p))
                                .add(qty, itemRevenue);
                    }
                }
            }
        }

        List<BestSellerProductDTO> list;

        if (!salesMap.isEmpty()) {
            list = salesMap.values().stream()
                    .sorted((a, b) -> Long.compare(b.quantitySold, a.quantitySold))
                    .limit(maxResults)
                    .map(this::toBestSellerDTO)
                    .collect(Collectors.toList());
        } else {
            // Fallback to top products by soldCount in catalog
            List<Product> topCatalogProducts = productRepository.findTop10ByOrderBySoldCountDesc();
            list = topCatalogProducts.stream()
                    .limit(maxResults)
                    .<BestSellerProductDTO>map(p -> {
                        long sold = p.getSoldCount() != null ? p.getSoldCount() : 0L;
                        BigDecimal price = p.getDiscountPrice() != null ? p.getDiscountPrice() : (p.getBasePrice() != null ? p.getBasePrice() : BigDecimal.ZERO);
                        BigDecimal rev = price.multiply(BigDecimal.valueOf(sold));

                        return BestSellerProductDTO.builder()
                                .productId(p.getProductId())
                                .productName(p.getName())
                                .categoryName(p.getCategory() != null ? p.getCategory().getName() : "Khác")
                                .primaryImageUrl(resolvePrimaryImage(p))
                                .basePrice(p.getBasePrice())
                                .discountPrice(p.getDiscountPrice())
                                .totalQuantitySold(sold)
                                .totalRevenue(rev)
                                .currentStock(calculateProductStock(p))
                                .build();
                    })
                    .collect(Collectors.toList());
        }

        long totalQuantity = list.stream().mapToLong(BestSellerProductDTO::getTotalQuantitySold).sum();

        return BestSellerReportDTO.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalProductsSold(totalQuantity)
                .topProducts(list)
                .build();
    }

    public AdminReportsSummaryDTO getReportsSummary(LocalDate startDate, LocalDate endDate) {
        RevenueReportDTO rev = getRevenueReport(startDate, endDate);
        OrderReportDTO ord = getOrderReport(startDate, endDate);
        BestSellerReportDTO best = getBestSellerReport(startDate, endDate, 10);

        return AdminReportsSummaryDTO.builder()
                .startDate(startDate)
                .endDate(endDate)
                .revenueReport(rev)
                .orderReport(ord)
                .bestSellerReport(best)
                .build();
    }

    private BestSellerProductDTO toBestSellerDTO(ProductSaleAccumulator acc) {
        Product p = acc.product;
        return BestSellerProductDTO.builder()
                .productId(p.getProductId())
                .productName(p.getName())
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : "Khác")
                .primaryImageUrl(resolvePrimaryImage(p))
                .basePrice(p.getBasePrice())
                .discountPrice(p.getDiscountPrice())
                .totalQuantitySold(acc.quantitySold)
                .totalRevenue(acc.totalRevenue)
                .currentStock(calculateProductStock(p))
                .build();
    }

    private int calculateProductStock(Product p) {
        if (p == null || p.getProductVariants() == null) return 0;
        return p.getProductVariants().stream()
                .mapToInt(v -> v.getStockQuantity() != null ? v.getStockQuantity() : 0)
                .sum();
    }

    private String resolvePrimaryImage(Product p) {
        if (p.getProductImages() != null && !p.getProductImages().isEmpty()) {
            return p.getProductImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                    .map(ProductImage::getImageUrl)
                    .findFirst()
                    .orElse(p.getProductImages().get(0).getImageUrl());
        }
        return null;
    }

    private static class DailyAccumulator {
        BigDecimal revenue = BigDecimal.ZERO;
        long count = 0;

        void add(BigDecimal amount) {
            revenue = revenue.add(amount != null ? amount : BigDecimal.ZERO);
            count++;
        }
    }

    private static class StatusAccumulator {
        String status;
        String label;
        String color;
        long count = 0;
        BigDecimal totalAmount = BigDecimal.ZERO;

        StatusAccumulator(String status, String label, String color) {
            this.status = status;
            this.label = label;
            this.color = color;
        }

        void add(BigDecimal amount) {
            count++;
            totalAmount = totalAmount.add(amount != null ? amount : BigDecimal.ZERO);
        }
    }

    private static class ProductSaleAccumulator {
        Product product;
        long quantitySold = 0;
        BigDecimal totalRevenue = BigDecimal.ZERO;

        ProductSaleAccumulator(Product product) {
            this.product = product;
        }

        void add(int qty, BigDecimal rev) {
            quantitySold += qty;
            totalRevenue = totalRevenue.add(rev != null ? rev : BigDecimal.ZERO);
        }
    }
}
