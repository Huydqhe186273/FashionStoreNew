package com.example.myapp.service;

import com.example.myapp.entity.*;
import com.example.myapp.repos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final DiscountCodeService discountCodeService;
    private final PaymentRepository paymentRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final TrackingService trackingService;

    @Transactional
    public Order createOrderFromCart(Integer userId, Integer addressId) {
        return createOrderFromCart(userId, addressId, null);
    }

    @Transactional
    public Order createOrderFromCart(Integer userId, Integer addressId, String couponCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found or empty"));

        if (cart.getCartItems().isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        // 1. Tính tổng tiền trước từ giỏ hàng
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CartItem cartItem : cart.getCartItems()) {
            BigDecimal price = BigDecimal.ZERO;
            if (cartItem.getVariant() != null && cartItem.getVariant().getProduct() != null) {
                price = cartItem.getVariant().getProduct().getDiscountPrice() != null
                        ? cartItem.getVariant().getProduct().getDiscountPrice()
                        : cartItem.getVariant().getProduct().getBasePrice();
            }
            if (price == null) {
                price = BigDecimal.ZERO;
            }
            totalAmount = totalAmount.add(price.multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }

        // 2. Xử lý mã giảm giá (nếu có)
        DiscountCode appliedDiscount = null;
        if (couponCode != null && !couponCode.trim().isEmpty()) {
            appliedDiscount = discountCodeService.getAndValidateCouponEntity(couponCode, totalAmount);
            BigDecimal discountAmount;
            if ("percent".equalsIgnoreCase(appliedDiscount.getDiscountType())) {
                discountAmount = totalAmount.multiply(appliedDiscount.getValue())
                        .divide(BigDecimal.valueOf(100), 0, java.math.RoundingMode.HALF_UP);
            } else {
                discountAmount = appliedDiscount.getValue().min(totalAmount);
            }
            totalAmount = totalAmount.subtract(discountAmount).max(BigDecimal.ZERO);
            discountCodeService.consumeCoupon(appliedDiscount);
        }

        // 3. Tạo order mới với đầy đủ thông tin (kèm totalAmount và discountCode)
        Order order = new Order();
        order.setUser(user);
        order.setAddress(address);
        order.setDiscountCode(appliedDiscount);
        order.setOrderStatus("pending");
        order.setPaymentStatus("unpaid");
        order.setCreatedAt(LocalDateTime.now());
        order.setTotalAmount(totalAmount);

        // Lưu order để sinh OrderId
        order = orderRepository.save(order);

        // 3. Chuyển từ cartItem sang orderItem
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cart.getCartItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setVariant(cartItem.getVariant());
            orderItem.setQuantity(cartItem.getQuantity());

            BigDecimal price = BigDecimal.ZERO;
            if (cartItem.getVariant() != null && cartItem.getVariant().getProduct() != null) {
                price = cartItem.getVariant().getProduct().getDiscountPrice() != null
                        ? cartItem.getVariant().getProduct().getDiscountPrice()
                        : cartItem.getVariant().getProduct().getBasePrice();
            }
            if (price == null) {
                price = BigDecimal.ZERO;
            }
            orderItem.setPriceAtPurchase(price);

            orderItemRepository.save(orderItem);
            orderItems.add(orderItem);
        }

        order.setOrderItems(orderItems);

        // Gửi thông báo trong hệ thống
        try {
            java.text.DecimalFormat df = new java.text.DecimalFormat("#,###₫");
            notificationService.createNotification(
                    userId,
                    "order",
                    "Đơn hàng #" + order.getOrderId() + " đã được tạo thành công với tổng thanh toán " + df.format(order.getTotalAmount()) + ". Vui lòng hoàn tất thanh toán qua PayOS."
            );
        } catch (Exception e) {
            System.err.println("Lỗi tạo thông báo đơn hàng: " + e.getMessage());
        }

        // Gửi email xác nhận đặt hàng
        try {
            emailService.sendOrderConfirmationEmail(order);
        } catch (Exception e) {
            System.err.println("Lỗi gửi email xác nhận đặt hàng: " + e.getMessage());
        }

        // Tự động thu thập hành vi người dùng (Purchase behavior tracking)
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                for (OrderItem item : orderItems) {
                    if (item.getVariant() != null && item.getVariant().getProduct() != null) {
                        com.example.myapp.model.BehaviorLogRequestDTO logReq = com.example.myapp.model.BehaviorLogRequestDTO.builder()
                                .userId(userId)
                                .productId(item.getVariant().getProduct().getProductId())
                                .actionType("purchase")
                                .build();
                        trackingService.logBehavior(logReq);
                    }
                }
            } catch (Exception e) {
                System.err.println("Lỗi ghi nhận hành vi mua hàng: " + e.getMessage());
            }
        });

        return order;
    }

    @Transactional
    public void markOrderAsPaid(Integer orderId) {
        markOrderAsPaid(orderId, null, null);
    }

    @Transactional
    public void markOrderAsPaid(Integer orderId, String transactionId, Long amount) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            order.setPaymentStatus("paid");
            if ("pending".equalsIgnoreCase(order.getOrderStatus())) {
                order.setOrderStatus("confirmed");
            }
            orderRepository.save(order);

            // Xóa giỏ hàng của user sau khi thanh toán thành công
            Cart cart = cartRepository.findByUserId(order.getUser().getUserId()).orElse(null);
            if (cart != null) {
                cartItemRepository.deleteAll(cart.getCartItems());
                cart.getCartItems().clear();
                cartRepository.save(cart);
            }

            BigDecimal paidAmount = amount != null ? BigDecimal.valueOf(amount) : order.getTotalAmount();
            String txId = transactionId != null ? transactionId : ("PAYOS-" + orderId);

            // Lưu lịch sử vào bảng Payments
            try {
                Payment payment = new Payment();
                payment.setOrder(order);
                payment.setAmount(paidAmount);
                payment.setPaymentMethod("PayOS");
                payment.setTransactionId(txId);
                payment.setStatus("success");
                payment.setPaidAt(LocalDateTime.now());
                paymentRepository.save(payment);
            } catch (Exception e) {
                System.err.println("Lỗi lưu lịch sử thanh toán vào bảng Payments: " + e.getMessage());
            }

            // Gửi thông báo thanh toán thành công
            try {
                java.text.DecimalFormat df = new java.text.DecimalFormat("#,###₫");
                notificationService.createNotification(
                        order.getUser().getUserId(),
                        "order",
                        "Đơn hàng #" + order.getOrderId() + " đã được thanh toán thành công qua PayOS (" + df.format(paidAmount) + "). Fashion Store đang tiến hành đóng gói sản phẩm."
                );
            } catch (Exception e) {
                System.err.println("Lỗi tạo thông báo thanh toán: " + e.getMessage());
            }

            // Gửi email biên nhận thanh toán PayOS
            try {
                emailService.sendPaymentConfirmationEmail(order, txId, paidAmount);
            } catch (Exception e) {
                System.err.println("Lỗi gửi email biên nhận thanh toán: " + e.getMessage());
            }
        }
    }

    @Transactional(readOnly = true)
    public List<com.example.myapp.model.OrderResponseDTO> getUserOrders(Integer userId) {
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return orders.stream().map(this::mapToOrderResponseDTO).collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public com.example.myapp.model.OrderResponseDTO getOrderDetail(Integer orderId, Integer userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Đơn hàng #" + orderId + " không tồn tại."));

        if (userId != null && !order.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền truy cập vào đơn hàng này.");
        }

        return mapToOrderResponseDTO(order);
    }

    @Transactional
    public void cancelOrder(Integer orderId, Integer userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Đơn hàng #" + orderId + " không tồn tại."));

        if (userId != null && !order.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền hủy đơn hàng này.");
        }

        if (!"pending".equalsIgnoreCase(order.getOrderStatus())) {
            throw new RuntimeException("Chỉ có thể hủy đơn hàng khi đơn đang ở trạng thái 'Chờ xử lý' (pending).");
        }

        order.setOrderStatus("cancelled");
        orderRepository.save(order);

        // Gửi thông báo hủy đơn
        try {
            notificationService.createNotification(
                    userId,
                    "order",
                    "Đơn hàng #" + order.getOrderId() + " đã được hủy thành công theo yêu cầu của bạn."
            );
        } catch (Exception e) {
            System.err.println("Lỗi tạo thông báo hủy đơn: " + e.getMessage());
        }
    }

    @Transactional
    public void updateOrderStatus(Integer orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Đơn hàng #" + orderId + " không tồn tại."));

        order.setOrderStatus(newStatus);
        orderRepository.save(order);

        String statusDesc = switch (newStatus.toLowerCase()) {
            case "confirmed" -> "Đã được xác nhận";
            case "shipping" -> "Đang trên đường giao đến bạn";
            case "delivered" -> "Đã giao hàng thành công";
            case "cancelled" -> "Đã bị hủy";
            default -> newStatus;
        };

        // Gửi thông báo cập nhật tiến độ đơn hàng
        try {
            notificationService.createNotification(
                    order.getUser().getUserId(),
                    "order",
                    "Đơn hàng #" + order.getOrderId() + " của bạn hiện " + statusDesc + "."
            );
        } catch (Exception e) {
            System.err.println("Lỗi tạo thông báo cập nhật tiến độ đơn: " + e.getMessage());
        }
    }

    private com.example.myapp.model.OrderResponseDTO mapToOrderResponseDTO(Order order) {
        List<com.example.myapp.model.OrderItemDetailDTO> itemDTOs = new ArrayList<>();
        if (order.getOrderItems() != null) {
            for (OrderItem oi : order.getOrderItems()) {
                String imgUrl = "";
                if (oi.getVariant() != null && oi.getVariant().getProduct() != null) {
                    Product prod = oi.getVariant().getProduct();
                    if (prod.getProductImages() != null && !prod.getProductImages().isEmpty()) {
                        imgUrl = prod.getProductImages().stream()
                                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                                .map(ProductImage::getImageUrl)
                                .findFirst()
                                .orElse(prod.getProductImages().get(0).getImageUrl());
                    }
                }

                BigDecimal subTotal = BigDecimal.ZERO;
                if (oi.getPriceAtPurchase() != null && oi.getQuantity() != null) {
                    subTotal = oi.getPriceAtPurchase().multiply(BigDecimal.valueOf(oi.getQuantity()));
                }

                itemDTOs.add(com.example.myapp.model.OrderItemDetailDTO.builder()
                        .orderItemId(oi.getOrderItemId())
                        .productId(oi.getVariant() != null && oi.getVariant().getProduct() != null ? oi.getVariant().getProduct().getProductId() : null)
                        .productName(oi.getVariant() != null && oi.getVariant().getProduct() != null ? oi.getVariant().getProduct().getName() : "Sản phẩm")
                        .size(oi.getVariant() != null ? oi.getVariant().getSize() : "")
                        .color(oi.getVariant() != null ? oi.getVariant().getColor() : "")
                        .quantity(oi.getQuantity())
                        .priceAtPurchase(oi.getPriceAtPurchase())
                        .subTotal(subTotal)
                        .imageUrl(imgUrl)
                        .build());
            }
        }

        int totalCount = itemDTOs.stream().mapToInt(com.example.myapp.model.OrderItemDetailDTO::getQuantity).sum();
        boolean canCancel = "pending".equalsIgnoreCase(order.getOrderStatus());

        return com.example.myapp.model.OrderResponseDTO.builder()
                .orderId(order.getOrderId())
                .orderStatus(order.getOrderStatus())
                .paymentStatus(order.getPaymentStatus())
                .totalAmount(order.getTotalAmount())
                .createdAt(order.getCreatedAt())
                .recipientName(order.getAddress() != null ? order.getAddress().getRecipientName() : "")
                .phone(order.getAddress() != null ? order.getAddress().getPhone() : "")
                .addressLine(order.getAddress() != null ? order.getAddress().getAddressLine() : "")
                .city(order.getAddress() != null ? order.getAddress().getCity() : "")
                .discountCode(order.getDiscountCode() != null ? order.getDiscountCode().getCode() : null)
                .discountType(order.getDiscountCode() != null ? order.getDiscountCode().getDiscountType() : null)
                .discountValue(order.getDiscountCode() != null ? order.getDiscountCode().getValue() : null)
                .itemCount(totalCount)
                .canCancel(canCancel)
                .items(itemDTOs)
                .build();
    }
}
