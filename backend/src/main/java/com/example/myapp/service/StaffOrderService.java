package com.example.myapp.service;

import com.example.myapp.entity.*;
import com.example.myapp.model.*;
import com.example.myapp.repos.InboundBatchRepository;
import com.example.myapp.repos.OrderRepository;
import com.example.myapp.repos.ProductRepository;
import com.example.myapp.repos.ProductVariantRepository;
import com.example.myapp.repos.ReturnRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class StaffOrderService {

    private final OrderRepository orderRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InboundBatchRepository inboundBatchRepository;
    private final ProductRepository productRepository;
    private final ReturnRequestRepository returnRequestRepository;
    private final com.example.myapp.repos.ReturnRequestRepository returnRequestRepository;
    private final NotificationService notificationService;

    public StaffOrderService(
            OrderRepository orderRepository,
            ProductVariantRepository productVariantRepository,
            InboundBatchRepository inboundBatchRepository,
            NotificationService notificationService,ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productVariantRepository = productVariantRepository;
        this.inboundBatchRepository = inboundBatchRepository;
        this.returnRequestRepository = returnRequestRepository;
        this.productRepository = productRepository;
        this.notificationService = notificationService;
    }

    public static String normalizeStatus(String status) {
        if (status == null)
            return "PENDING";
        String s = status.trim().toUpperCase();
        if ("CONFIRMED".equals(s))
            return "PROCESSING";
        if ("SHIPPING".equals(s))
            return "SHIPPED";
        if ("CANCELED".equals(s))
            return "CANCELLED";
        return s;
    }

    @Transactional(readOnly = true)
    public List<StaffOrderListItemDTO> getOrders(String statusFilter, String keyword) {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();

        if (statusFilter != null && !statusFilter.trim().isEmpty()) {
            if ("RETURN_PENDING".equalsIgnoreCase(statusFilter.trim())) {
                orders = orders.stream()
                        .filter(o -> {
                            java.util.Optional<com.example.myapp.entity.ReturnRequest> rr = returnRequestRepository.findLatestByOrderId(o.getOrderId());
                            return rr.isPresent() && "pending".equalsIgnoreCase(rr.get().getStatus());
                        })
                        .collect(Collectors.toList());
            } else {
                String normFilter = normalizeStatus(statusFilter);
                orders = orders.stream()
                        .filter(o -> normalizeStatus(o.getOrderStatus()).equalsIgnoreCase(normFilter))
                        .collect(Collectors.toList());
            }
        }

        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim().toLowerCase();
            orders = orders.stream()
                    .filter(o -> {
                        String idStr = String.valueOf(o.getOrderId());
                        String name = o.getUser() != null && o.getUser().getFullName() != null
                                ? o.getUser().getFullName().toLowerCase()
                                : "";
                        String email = o.getUser() != null && o.getUser().getEmail() != null
                                ? o.getUser().getEmail().toLowerCase()
                                : "";
                        String phone = o.getUser() != null && o.getUser().getPhone() != null
                                ? o.getUser().getPhone().toLowerCase()
                                : "";
                        String recipient = o.getAddress() != null && o.getAddress().getRecipientName() != null
                                ? o.getAddress().getRecipientName().toLowerCase()
                                : "";
                        return idStr.contains(kw) || name.contains(kw) || email.contains(kw) || phone.contains(kw)
                                || recipient.contains(kw);
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
                throw new IllegalArgumentException(
                        "Chỉ có thể xác nhận (PROCESSING) từ trạng thái PENDING! Đơn hàng hiện tại đang là: "
                                + current);
            }

            // 1. Kiểm tra đủ tồn kho cho TẤT CẢ các sản phẩm trong đơn theo các Lô hàng
            // (FIFO)
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
                            " [SKU: " + variant.getSku() + "] - Tồn kho khả dụng: " + effectiveAvailable
                            + ", Số lượng yêu cầu: " + required);
                }
            }

            // 2. Đủ hàng -> Thực hiện trừ kho theo nguyên tắc FIFO (Lô cũ nhất trừ trước,
            // hết mới sang lô tiếp theo)
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
                throw new IllegalArgumentException(
                        "Chỉ có thể chuyển sang SHIPPED (Đang giao) khi đơn hàng ở trạng thái PROCESSING! Trạng thái hiện tại: "
                                + current);
            }
            order.setOrderStatus("SHIPPED");
            order = orderRepository.save(order);

        } else if ("DELIVERED".equals(target)) {
            // Luồng: SHIPPED -> DELIVERED
            if (!"SHIPPED".equals(current)) {
                throw new IllegalArgumentException(
                        "Chỉ có thể chuyển sang DELIVERED (Đã giao) khi đơn hàng ở trạng thái SHIPPED! Trạng thái hiện tại: "
                                + current);
            }
            order.setOrderStatus("DELIVERED");
            if ("unpaid".equalsIgnoreCase(order.getPaymentStatus())) {
                order.setPaymentStatus("PAID");
                // Đơn COD giao thành công -> Tăng số lượng đã bán (soldCount)
                if (order.getOrderItems() != null) {
                    for (OrderItem oi : order.getOrderItems()) {
                        if (oi.getVariant() != null && oi.getVariant().getProduct() != null) {
                            Product p = oi.getVariant().getProduct();
                            int currentSold = p.getSoldCount() != null ? p.getSoldCount() : 0;
                            int buyQty = oi.getQuantity() != null ? oi.getQuantity() : 1;
                            p.setSoldCount(currentSold + buyQty);
                            productRepository.save(p);
                        }
                    }
                }
            }
            order = orderRepository.save(order);

        } else if ("CANCELLED".equals(target)) {
            // Chỉ hủy được từ PENDING hoặc PROCESSING
            if (!"PENDING".equals(current) && !"PROCESSING".equals(current)) {
                throw new IllegalArgumentException(
                        "Chỉ có thể hủy đơn hàng khi ở trạng thái PENDING hoặc PROCESSING! Đơn hàng hiện tại đang là "
                                + current + ", không thể hủy.");
            }

            // Không được hủy đơn đang có yêu cầu hoàn tiền chờ duyệt
            java.util.Optional<com.example.myapp.entity.ReturnRequest> pendingRR = returnRequestRepository.findLatestByOrderId(orderId);
            if (pendingRR.isPresent() && "pending".equalsIgnoreCase(pendingRR.get().getStatus())) {
                throw new IllegalArgumentException("Không thể hủy đơn hàng này vì đang có yêu cầu trả hàng & hoàn tiền chờ duyệt! Vui lòng xử lý yêu cầu hoàn tiền trước.");
            }

            // Hủy đơn đã xác nhận (PROCESSING) thì cộng lại tồn kho cho lô hàng
            if ("PROCESSING".equals(current)) {
                restockOrderItems(order, false);
            }

            order.setOrderStatus("CANCELLED");
            order = orderRepository.save(order);

        } else if ("RETURNED".equals(target)) {
            if ("SHIPPED".equals(current)) {
                return markOrderRTO(orderId, "Nhân viên xác nhận bưu tá giao thất bại & hoàn về kho.");
            } else if ("DELIVERED".equals(current)) {
                StaffCreateReturnDTO dto = StaffCreateReturnDTO.builder()
                        .reason("Khách hàng gửi trả lại hàng về kho shop")
                        .refundAmount(order.getTotalAmount())
                        .adminNote("Nhân viên xác nhận nhận lại kiện hàng hoàn")
                        .restock(true)
                        .build();
                return createStaffReturn(orderId, dto);
            } else {
                throw new IllegalArgumentException(
                        "Chỉ có thể chuyển sang RETURNED (Đã hoàn hàng) khi đơn hàng ở trạng thái SHIPPED hoặc DELIVERED! Trạng thái hiện tại: "
                                + current);
            }

        } else {
            throw new IllegalArgumentException("Trạng thái chuyển đổi không hợp lệ: " + newStatus +
                    ". Các trạng thái được phép: PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED.");
        }

        return toDetailDTO(order);
    }

    private void restockOrderItems(Order order, boolean decrementSoldCount) {
        if (order.getOrderItems() == null) return;
    public StaffOrderDetailDTO approveReturn(Integer orderId) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + orderId));

        java.util.Optional<com.example.myapp.entity.ReturnRequest> rrOpt = returnRequestRepository.findLatestByOrderId(orderId);
        if (rrOpt.isEmpty() || !"pending".equalsIgnoreCase(rrOpt.get().getStatus())) {
            throw new IllegalArgumentException("Đơn hàng này không có yêu cầu hoàn tiền nào đang chờ duyệt!");
        }

        com.example.myapp.entity.ReturnRequest rr = rrOpt.get();
        rr.setStatus("approved");
        returnRequestRepository.save(rr);

        // Hoàn lại tồn kho cho sản phẩm
        for (OrderItem item : order.getOrderItems()) {
            ProductVariant variant = item.getVariant();
            if (variant != null) {
                int refundQty = item.getQuantity() != null ? item.getQuantity() : 0;
                if (refundQty <= 0) continue;

                List<InboundBatch> batches = inboundBatchRepository
                        .findActiveBatchesByVariantFifo(variant.getVariantId(), 0);
                if (!batches.isEmpty()) {
                    InboundBatch targetBatch = batches.get(0);
                    targetBatch.setRemainingQuantity(targetBatch.getRemainingQuantity() + refundQty);
                    targetBatch.setStatus("ACTIVE");
                    inboundBatchRepository.save(targetBatch);
                } else {
                    List<InboundBatch> allBatches = inboundBatchRepository
                            .findLatestBatchesByVariantId(variant.getVariantId());
                    if (!allBatches.isEmpty()) {
                        InboundBatch targetBatch = allBatches.get(0);
                        targetBatch.setRemainingQuantity(targetBatch.getRemainingQuantity() + refundQty);
                        targetBatch.setStatus("ACTIVE");
                        inboundBatchRepository.save(targetBatch);
                    }
                }

                int currentStock = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
                variant.setStockQuantity(currentStock + refundQty);
                productVariantRepository.save(variant);

                if (decrementSoldCount && variant.getProduct() != null) {
                    Product p = variant.getProduct();
                    int currentSold = p.getSoldCount() != null ? p.getSoldCount() : 0;
                    p.setSoldCount(Math.max(0, currentSold - refundQty));
                    productRepository.save(p);
                }
            }
        }
    }

    public StaffOrderDetailDTO markOrderRTO(Integer orderId, String note) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + orderId));

        String current = normalizeStatus(order.getOrderStatus());
        if (!"SHIPPED".equals(current)) {
            throw new IllegalArgumentException(
                    "Chỉ có thể ghi nhận bưu tá hoàn kho (RTO) khi đơn hàng đang ở trạng thái SHIPPED (Đang giao)! Trạng thái hiện tại: "
                            + current);
        }

        // 1. Hoàn lại kho cho các sản phẩm trong đơn
        restockOrderItems(order, false);

        // 2. Cập nhật trạng thái đơn
        order.setOrderStatus("RETURNED");
        boolean isPaid = "PAID".equalsIgnoreCase(order.getPaymentStatus());
        if (isPaid) {
            order.setPaymentStatus("REFUNDED");
        }
        order = orderRepository.save(order);

        // 3. Tạo bản ghi ReturnRequest ghi nhận bưu tá hoàn hàng
        ReturnRequest rr = new ReturnRequest();
        rr.setOrder(order);
        rr.setReason("Bưu tá hoàn hàng về kho (Giao thất bại / Bom hàng)");
        rr.setStatus("COMPLETED");
        rr.setRefundAmount(isPaid ? (order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO) : BigDecimal.ZERO);
        rr.setCreatedAt(LocalDateTime.now());
        rr.setAdminNote(note != null && !note.trim().isEmpty() ? note.trim() : "Bưu tá đã trả lại kiện hàng nguyên vẹn về kho.");
        returnRequestRepository.save(rr);
                }
                int currentStock = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
                variant.setStockQuantity(currentStock + refundQty);
                productVariantRepository.save(variant);
            }
        }

        order.setOrderStatus("RETURNED");
        order.setPaymentStatus("refunded");
        order = orderRepository.save(order);

        try {
            notificationService.createNotification(
                    order.getUser().getUserId(),
                    "order",
                    "Yêu cầu trả hàng & hoàn tiền cho đơn hàng #" + orderId + " đã được phê duyệt thành công. Tiền sẽ được hoàn lại cho bạn."
            );
        } catch (Exception ignored) {}

        return toDetailDTO(order);
    }

    public StaffOrderDetailDTO createStaffReturn(Integer orderId, StaffCreateReturnDTO dto) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + orderId));

        String current = normalizeStatus(order.getOrderStatus());
        if (!"DELIVERED".equals(current) && !"SHIPPED".equals(current)) {
            throw new IllegalArgumentException(
                    "Chỉ có thể tạo phiếu hoàn hàng khi đơn đã DELIVERED (Đã nhận) hoặc SHIPPED! Trạng thái hiện tại: "
                            + current);
        }

        boolean shouldRestock = dto.getRestock() == null || Boolean.TRUE.equals(dto.getRestock());
        if (shouldRestock) {
            boolean wasDelivered = "DELIVERED".equals(current);
            restockOrderItems(order, wasDelivered);
        }

        order.setOrderStatus("RETURNED");
        order.setPaymentStatus("REFUNDED");
        order = orderRepository.save(order);

        BigDecimal maxRefund = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal refundAmount = dto.getRefundAmount() != null ? dto.getRefundAmount() : maxRefund;
        if (refundAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Số tiền hoàn trả không được âm!");
        }
        if (refundAmount.compareTo(maxRefund) > 0) {
            throw new IllegalArgumentException("Số tiền hoàn trả (" + refundAmount + " đ) không được vượt quá tổng giá trị đơn hàng (" + maxRefund + " đ)!");
        }

        if (dto.getBankAccount() != null && !dto.getBankAccount().trim().isEmpty()) {
            String cleanAcc = dto.getBankAccount().trim();
            if (!cleanAcc.matches("^[0-9]{6,25}$")) {
                throw new IllegalArgumentException("Số tài khoản ngân hàng phải gồm từ 6 đến 25 chữ số!");
            }
        }

        ReturnRequest rr = new ReturnRequest();
        rr.setOrder(order);
        rr.setReason(dto.getReason() != null && !dto.getReason().trim().isEmpty()
                ? dto.getReason().trim()
                : "Khách hàng gửi trả lại hàng về kho shop");
        rr.setStatus("COMPLETED");
        rr.setRefundAmount(refundAmount);
        rr.setBankName(dto.getBankName() != null ? dto.getBankName().trim() : null);
        rr.setBankAccount(dto.getBankAccount() != null ? dto.getBankAccount().trim() : null);
        rr.setAccountHolder(dto.getAccountHolder() != null ? dto.getAccountHolder().trim().toUpperCase() : null);
        rr.setAdminNote(dto.getAdminNote() != null ? dto.getAdminNote().trim() : null);
        rr.setCreatedAt(LocalDateTime.now());
        returnRequestRepository.save(rr);

    public StaffOrderDetailDTO rejectReturn(Integer orderId, String rejectReason) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + orderId));

        java.util.Optional<com.example.myapp.entity.ReturnRequest> rrOpt = returnRequestRepository.findLatestByOrderId(orderId);
        if (rrOpt.isEmpty() || !"pending".equalsIgnoreCase(rrOpt.get().getStatus())) {
            throw new IllegalArgumentException("Đơn hàng này không có yêu cầu hoàn tiền nào đang chờ duyệt!");
        }

        com.example.myapp.entity.ReturnRequest rr = rrOpt.get();
        rr.setStatus("rejected");
        String finalReason = rr.getReason() != null ? rr.getReason() : "";
        if (rejectReason != null && !rejectReason.trim().isEmpty()) {
            finalReason += " (Từ chối: " + rejectReason.trim() + ")";
        }
        rr.setReason(finalReason);
        returnRequestRepository.save(rr);

        try {
            notificationService.createNotification(
                    order.getUser().getUserId(),
                    "order",
                    "Yêu cầu trả hàng & hoàn tiền cho đơn hàng #" + orderId + " đã bị từ chối." + (rejectReason != null && !rejectReason.trim().isEmpty() ? " Lý do: " + rejectReason.trim() : "")
            );
        } catch (Exception ignored) {}

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

        String returnStatus = null;
        String returnReason = null;
        BigDecimal refundAmount = null;
        java.util.Optional<com.example.myapp.entity.ReturnRequest> rr = returnRequestRepository.findLatestByOrderId(o.getOrderId());
        if (rr.isPresent()) {
            returnStatus = rr.get().getStatus();
            returnReason = rr.get().getReason();
            refundAmount = rr.get().getRefundAmount();
        }

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
                .returnStatus(returnStatus)
                .returnReason(returnReason)
                .refundAmount(refundAmount)
                .build();
    }

    private StaffOrderDetailDTO toDetailDTO(Order o) {
        String customerName = o.getUser() != null ? o.getUser().getFullName() : "N/A";
        String customerEmail = o.getUser() != null ? o.getUser().getEmail() : "N/A";
        String customerPhone = o.getUser() != null ? o.getUser().getPhone() : "N/A";

        String recipientName = o.getAddress() != null && o.getAddress().getRecipientName() != null
                ? o.getAddress().getRecipientName()
                : customerName;
        String recipientPhone = o.getAddress() != null && o.getAddress().getPhone() != null ? o.getAddress().getPhone()
                : customerPhone;

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

        ReturnRequestDTO returnRequestDTO = returnRequestRepository.findLatestByOrderId(o.getOrderId())
                .map(rr -> ReturnRequestDTO.builder()
                        .returnId(rr.getReturnId())
                        .orderId(o.getOrderId())
                        .reason(rr.getReason())
                        .status(rr.getStatus())
                        .refundAmount(rr.getRefundAmount())
                        .createdAt(rr.getCreatedAt())
                        .bankName(rr.getBankName())
                        .bankAccount(rr.getBankAccount())
                        .accountHolder(rr.getAccountHolder())
                        .adminNote(rr.getAdminNote())
                        .build())
                .orElse(null);
        String returnStatus = null;
        String returnReason = null;
        BigDecimal refundAmount = null;
        java.util.Optional<com.example.myapp.entity.ReturnRequest> rr = returnRequestRepository.findLatestByOrderId(o.getOrderId());
        if (rr.isPresent()) {
            returnStatus = rr.get().getStatus();
            returnReason = rr.get().getReason();
            refundAmount = rr.get().getRefundAmount();
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
                .returnStatus(returnStatus)
                .returnReason(returnReason)
                .refundAmount(refundAmount)
                .items(items)
                .returnRequest(returnRequestDTO)
                .build();
    }
}
