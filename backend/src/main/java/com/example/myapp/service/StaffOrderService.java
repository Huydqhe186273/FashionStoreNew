package com.example.myapp.service;

import com.example.myapp.entity.*;
import com.example.myapp.model.*;
import com.example.myapp.repos.InboundBatchRepository;
import com.example.myapp.repos.OrderRepository;
import com.example.myapp.repos.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class StaffOrderService {

    private final OrderRepository orderRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InboundBatchRepository inboundBatchRepository;

    public StaffOrderService(
            OrderRepository orderRepository,
            ProductVariantRepository productVariantRepository,
            InboundBatchRepository inboundBatchRepository) {
        this.orderRepository = orderRepository;
        this.productVariantRepository = productVariantRepository;
        this.inboundBatchRepository = inboundBatchRepository;
    }

    public static String normalizeStatus(String status) {
        if (status == null) return "PENDING";
        String s = status.trim().toUpperCase();
        if ("CONFIRMED".equals(s)) return "PROCESSING";
        if ("SHIPPING".equals(s)) return "SHIPPED";
        if ("CANCELED".equals(s)) return "CANCELLED";
        return s;
    }

    @Transactional(readOnly = true)
    public List<StaffOrderListItemDTO> getOrders(String statusFilter, String keyword) {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();

        if (statusFilter != null && !statusFilter.trim().isEmpty()) {
            String normFilter = normalizeStatus(statusFilter);
            orders = orders.stream()
                    .filter(o -> normalizeStatus(o.getOrderStatus()).equalsIgnoreCase(normFilter))
                    .collect(Collectors.toList());
        }

        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim().toLowerCase();
            orders = orders.stream()
                    .filter(o -> {
                        String idStr = String.valueOf(o.getOrderId());
                        String name = o.getUser() != null && o.getUser().getFullName() != null ? o.getUser().getFullName().toLowerCase() : "";
                        String email = o.getUser() != null && o.getUser().getEmail() != null ? o.getUser().getEmail().toLowerCase() : "";
                        String phone = o.getUser() != null && o.getUser().getPhone() != null ? o.getUser().getPhone().toLowerCase() : "";
                        String recipient = o.getAddress() != null && o.getAddress().getRecipientName() != null ? o.getAddress().getRecipientName().toLowerCase() : "";
                        return idStr.contains(kw) || name.contains(kw) || email.contains(kw) || phone.contains(kw) || recipient.contains(kw);
                    })
                    .collect(Collectors.toList());
        }

        return orders.stream().map(this::toListItemDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StaffOrderDetailDTO getOrderDetail(Integer orderId) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + orderId));

        return toDetailDTO(order);
    }

    public StaffOrderDetailDTO updateOrderStatus(Integer orderId, String newStatus) {
        if (newStatus == null || newStatus.trim().isEmpty()) {
            throw new IllegalArgumentException("Trạng thái mới không được để trống!");
        }

        String target = normalizeStatus(newStatus);
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + orderId));

        String current = normalizeStatus(order.getOrderStatus());

        if (current.equalsIgnoreCase(target)) {
            return toDetailDTO(order);
        }

        if ("PROCESSING".equals(target)) {
            // Luồng: PENDING -> PROCESSING
            if (!"PENDING".equals(current)) {
                throw new IllegalArgumentException("Chỉ có thể xác nhận (PROCESSING) từ trạng thái PENDING! Đơn hàng hiện tại đang là: " + current);
            }

            // 1. Kiểm tra đủ tồn kho cho TẤT CẢ các sản phẩm trong đơn theo các Lô hàng (FIFO)
            for (OrderItem item : order.getOrderItems()) {
                ProductVariant variant = item.getVariant();
                if (variant == null) {
                    throw new IllegalArgumentException("Không tìm thấy thông tin biến thể trong đơn hàng #" + orderId);
                }
                int required = item.getQuantity() != null ? item.getQuantity() : 1;
                List<InboundBatch> activeBatches = inboundBatchRepository
                        .findActiveBatchesByVariantFifo(variant.getVariantId(), 0);
                int availableInBatches = activeBatches.stream().mapToInt(InboundBatch::getRemainingQuantity).sum();
                int fallbackStock = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
                int effectiveAvailable = Math.max(availableInBatches, fallbackStock);

                if (effectiveAvailable < required) {
                    String prodName = variant.getProduct() != null ? variant.getProduct().getName() : "Sản phẩm";
                    throw new IllegalArgumentException("Không đủ tồn kho để xác nhận đơn! Sản phẩm: " + prodName +
                            " [SKU: " + variant.getSku() + "] - Tồn kho khả dụng: " + effectiveAvailable + ", Số lượng yêu cầu: " + required);
                }
            }

            // 2. Đủ hàng -> Thực hiện trừ kho theo nguyên tắc FIFO (Lô cũ nhất trừ trước, hết mới sang lô tiếp theo)
            for (OrderItem item : order.getOrderItems()) {
                ProductVariant variant = item.getVariant();
                int required = item.getQuantity() != null ? item.getQuantity() : 1;
                int needed = required;

                List<InboundBatch> activeBatches = inboundBatchRepository
                        .findActiveBatchesByVariantFifo(variant.getVariantId(), 0);

                for (InboundBatch batch : activeBatches) {
                    int take = Math.min(batch.getRemainingQuantity(), needed);
                    int remaining = batch.getRemainingQuantity() - take;
                    batch.setRemainingQuantity(remaining);
                    if (remaining == 0) {
                        batch.setStatus("DEPLETED"); // Lô cũ này đã bán hết sạch
                    }
                    inboundBatchRepository.save(batch);
                    needed -= take;
                    if (needed <= 0) {
                        break;
                    }
                }

                int currentStock = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
                variant.setStockQuantity(Math.max(0, currentStock - required));
                productVariantRepository.save(variant);
            }

            order.setOrderStatus("PROCESSING");
            order = orderRepository.save(order);

        } else if ("SHIPPED".equals(target)) {
            // Luồng: PROCESSING -> SHIPPED
            if (!"PROCESSING".equals(current)) {
                throw new IllegalArgumentException("Chỉ có thể chuyển sang SHIPPED (Đang giao) khi đơn hàng ở trạng thái PROCESSING! Trạng thái hiện tại: " + current);
            }
            order.setOrderStatus("SHIPPED");
            order = orderRepository.save(order);

        } else if ("DELIVERED".equals(target)) {
            // Luồng: SHIPPED -> DELIVERED
            if (!"SHIPPED".equals(current)) {
                throw new IllegalArgumentException("Chỉ có thể chuyển sang DELIVERED (Đã giao) khi đơn hàng ở trạng thái SHIPPED! Trạng thái hiện tại: " + current);
            }
            order.setOrderStatus("DELIVERED");
            if ("unpaid".equalsIgnoreCase(order.getPaymentStatus())) {
                order.setPaymentStatus("PAID");
            }
            order = orderRepository.save(order);

        } else if ("CANCELLED".equals(target)) {
            // Chỉ hủy được từ PENDING hoặc PROCESSING
            if (!"PENDING".equals(current) && !"PROCESSING".equals(current)) {
                throw new IllegalArgumentException("Chỉ có thể hủy đơn hàng khi ở trạng thái PENDING hoặc PROCESSING! Đơn hàng hiện tại đang là " + current + ", không thể hủy.");
            }

            // Hủy đơn đã xác nhận (PROCESSING) thì cộng lại tồn kho cho lô hàng
            if ("PROCESSING".equals(current)) {
                for (OrderItem item : order.getOrderItems()) {
                    ProductVariant variant = item.getVariant();
                    if (variant != null) {
                        int refundQty = item.getQuantity() != null ? item.getQuantity() : 0;
                        List<InboundBatch> batches = inboundBatchRepository
                                .findActiveBatchesByVariantFifo(variant.getVariantId(), 0);
                        if (!batches.isEmpty()) {
                            InboundBatch targetBatch = batches.get(0);
                            targetBatch.setRemainingQuantity(targetBatch.getRemainingQuantity() + refundQty);
                            targetBatch.setStatus("ACTIVE");
                            inboundBatchRepository.save(targetBatch);
                        }
                        int currentStock = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
                        variant.setStockQuantity(currentStock + refundQty);
                        productVariantRepository.save(variant);
                    }
                }
            }

            order.setOrderStatus("CANCELLED");
            order = orderRepository.save(order);

        } else {
            throw new IllegalArgumentException("Trạng thái chuyển đổi không hợp lệ: " + newStatus + 
                    ". Các trạng thái được phép: PROCESSING, SHIPPED, DELIVERED, CANCELLED.");
        }

        return toDetailDTO(order);
    }

    private StaffOrderListItemDTO toListItemDTO(Order o) {
        String customerName = o.getUser() != null ? o.getUser().getFullName() : "N/A";
        String customerEmail = o.getUser() != null ? o.getUser().getEmail() : "N/A";
        String customerPhone = o.getUser() != null ? o.getUser().getPhone() : "N/A";

        String addressStr = "Chưa có địa chỉ";
        if (o.getAddress() != null) {
            String line = o.getAddress().getAddressLine() != null ? o.getAddress().getAddressLine() : "";
            String city = o.getAddress().getCity() != null ? o.getAddress().getCity() : "";
            addressStr = (line + " " + city).trim();
        }

        int count = o.getOrderItems() != null ? o.getOrderItems().size() : 0;

        return StaffOrderListItemDTO.builder()
                .orderId(o.getOrderId())
                .customerName(customerName)
                .customerEmail(customerEmail)
                .customerPhone(customerPhone)
                .orderStatus(normalizeStatus(o.getOrderStatus()))
                .paymentStatus(o.getPaymentStatus() != null ? o.getPaymentStatus() : "unpaid")
                .totalAmount(o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO)
                .itemCount(count)
                .createdAt(o.getCreatedAt())
                .shippingAddress(addressStr)
                .build();
    }

    private StaffOrderDetailDTO toDetailDTO(Order o) {
        String customerName = o.getUser() != null ? o.getUser().getFullName() : "N/A";
        String customerEmail = o.getUser() != null ? o.getUser().getEmail() : "N/A";
        String customerPhone = o.getUser() != null ? o.getUser().getPhone() : "N/A";

        String recipientName = o.getAddress() != null && o.getAddress().getRecipientName() != null ? o.getAddress().getRecipientName() : customerName;
        String recipientPhone = o.getAddress() != null && o.getAddress().getPhone() != null ? o.getAddress().getPhone() : customerPhone;

        String addressStr = "Chưa có địa chỉ";
        if (o.getAddress() != null) {
            String line = o.getAddress().getAddressLine() != null ? o.getAddress().getAddressLine() : "";
            String city = o.getAddress().getCity() != null ? o.getAddress().getCity() : "";
            addressStr = (line + " " + city).trim();
        }

        List<StaffOrderItemDTO> items = new ArrayList<>();
        if (o.getOrderItems() != null) {
            for (OrderItem oi : o.getOrderItems()) {
                ProductVariant v = oi.getVariant();
                String prodName = "N/A";
                Integer prodId = null;
                String size = "N/A";
                String color = "N/A";
                String sku = "N/A";
                Integer currentStock = 0;

                if (v != null) {
                    size = v.getSize() != null ? v.getSize() : "";
                    color = v.getColor() != null ? v.getColor() : "";
                    sku = v.getSku() != null ? v.getSku() : "";
                    currentStock = v.getStockQuantity() != null ? v.getStockQuantity() : 0;
                    if (v.getProduct() != null) {
                        prodName = v.getProduct().getName();
                        prodId = v.getProduct().getProductId();
                    }
                }

                BigDecimal price = oi.getPriceAtPurchase() != null ? oi.getPriceAtPurchase() : BigDecimal.ZERO;
                int qty = oi.getQuantity() != null ? oi.getQuantity() : 0;
                BigDecimal subtotal = price.multiply(BigDecimal.valueOf(qty));

                items.add(StaffOrderItemDTO.builder()
                        .orderItemId(oi.getOrderItemId())
                        .variantId(v != null ? v.getVariantId() : null)
                        .productId(prodId)
                        .productName(prodName)
                        .size(size)
                        .color(color)
                        .sku(sku)
                        .quantity(qty)
                        .priceAtPurchase(price)
                        .subtotal(subtotal)
                        .currentStockQuantity(currentStock)
                        .build());
            }
        }

        return StaffOrderDetailDTO.builder()
                .orderId(o.getOrderId())
                .customerName(customerName)
                .customerEmail(customerEmail)
                .customerPhone(customerPhone)
                .recipientName(recipientName)
                .recipientPhone(recipientPhone)
                .shippingAddress(addressStr)
                .orderStatus(normalizeStatus(o.getOrderStatus()))
                .paymentStatus(o.getPaymentStatus() != null ? o.getPaymentStatus() : "unpaid")
                .totalAmount(o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO)
                .createdAt(o.getCreatedAt())
                .items(items)
                .build();
    }
}
