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

/**
 * =================================================================================
 * SERVICE: OrderService (Xử lý Đơn hàng & Thanh toán)
 * =================================================================================
 * Nhiệm vụ chính:
 * 1. Tạo đơn hàng từ giỏ hàng (Checkout & Create Order) - Epic II.5.7
 * 2. Tính toán tiền đơn hàng & trừ mã giảm giá (Coupon validation) - Epic II.5.5
 * 3. Chuyển trạng thái đơn sang đã thanh toán PayOS & xóa giỏ (Mark As Paid) - Epic II.8.3
 * 4. Tự động lưu lịch sử vào bảng Payments
 * 5. Tự động bắn thông báo (Notifications) & gửi email xác nhận
 * =================================================================================
 */
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

    /**
     * Tạo đơn hàng từ giỏ (không áp mã giảm giá)
     */
    @Transactional
    public Order createOrderFromCart(Integer userId, Integer addressId) {
        return createOrderFromCart(userId, addressId, null);
    }

    @Transactional
    public Order createOrderFromCart(Integer userId, Integer addressId, String couponCode) {
        // 1. Kiểm tra tài khoản người dùng có tồn tại trong DB không
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Kiểm tra địa chỉ nhận hàng có hợp lệ không
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        // 3. Tìm giỏ hàng hiện tại của người dùng
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found or empty"));

        // Chặn nếu giỏ hàng không có sản phẩm nào
        if (cart.getCartItems().isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        // 4. BƯỚC TÍNH TOÁN BẢO MẬT: Backend tự tính tổng tiền từ dữ liệu CSDL (Không tin giá Frontend)
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CartItem cartItem : cart.getCartItems()) {
            BigDecimal price = BigDecimal.ZERO;
            if (cartItem.getVariant() != null && cartItem.getVariant().getProduct() != null) {
                // Ưu tiên lấy giá khuyến mãi nếu có, ngược lại lấy giá gốc của sản phẩm
                price = cartItem.getVariant().getProduct().getDiscountPrice() != null
                        ? cartItem.getVariant().getProduct().getDiscountPrice()
                        : cartItem.getVariant().getProduct().getBasePrice();
            }
            if (price == null) {
                price = BigDecimal.ZERO;
            }
            // Cộng dồn: Tiền món = đơn giá * số lượng mua
            totalAmount = totalAmount.add(price.multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }

        // 5. XỬ LÝ MÃ GIẢM GIÁ (COUPON) NẾU CÓ TRUYỀN LÊN
        DiscountCode appliedDiscount = null;
        if (couponCode != null && !couponCode.trim().isEmpty()) {
            // Kiểm tra mã: Hạn sử dụng, điều kiện giá trị đơn tối thiểu (minOrderValue), số lượt còn lại
            appliedDiscount = discountCodeService.getAndValidateCouponEntity(couponCode, totalAmount);
            BigDecimal discountAmount;

            // Tính số tiền được giảm theo phần trăm (%) hoặc số tiền cố định
            if ("percent".equalsIgnoreCase(appliedDiscount.getDiscountType())) {
                discountAmount = totalAmount.multiply(appliedDiscount.getValue())
                        .divide(BigDecimal.valueOf(100), 0, java.math.RoundingMode.HALF_UP);
            } else {
                discountAmount = appliedDiscount.getValue().min(totalAmount);
            }

            // Trừ tiền giảm giá vào tổng đơn (không để tổng tiền bị âm)
            totalAmount = totalAmount.subtract(discountAmount).max(BigDecimal.ZERO);

            // Ghi nhận trừ 1 lượt sử dụng của voucher này trong DB
            discountCodeService.consumeCoupon(appliedDiscount);
        }

        // 6. KHỞI TẠO BẢN GHI ĐƠN HÀNG (Bảng 'orders')
        Order order = new Order();
        order.setUser(user);
        order.setAddress(address);
        order.setDiscountCode(appliedDiscount);
        order.setOrderStatus("pending");      // Trạng thái đơn: Chờ xử lý
        order.setPaymentStatus("unpaid");     // Trạng thái thanh toán: Chưa thanh toán
        order.setCreatedAt(LocalDateTime.now());
        order.setTotalAmount(totalAmount);    // Tổng tiền thanh toán cuối cùng đã trừ voucher

        // Lưu đơn hàng vào CSDL để tự sinh order_id (khóa chính)
        order = orderRepository.save(order);

        // 7. CHUYỂN TỪNG MÓN TRONG GIỎ THÀNH CHI TIẾT ĐƠN HÀNG (Bảng 'order_items')
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cart.getCartItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setVariant(cartItem.getVariant());
            orderItem.setQuantity(cartItem.getQuantity());

            // Chốt giá mua tại thời điểm đặt hàng (priceAtPurchase)
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

            // Lưu dòng chi tiết món vào bảng order_items
            orderItemRepository.save(orderItem);
            orderItems.add(orderItem);
        }

        order.setOrderItems(orderItems);

        // 8. TỰ ĐỘNG GỬI THÔNG BÁO CHUÔNG HỆ THỐNG CHO NGƯỜI DÙNG (Epic II.9.4)
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

        // 9. GỬI EMAIL XÁC NHẬN ĐẶT HÀNG TỰ ĐỘNG
        try {
            emailService.sendOrderConfirmationEmail(order);
        } catch (Exception e) {
            System.err.println("Lỗi gửi email xác nhận đặt hàng: " + e.getMessage());
        }

        // 10. THU THẬP HÀNH VI MUA HÀNG (Bất đồng bộ - Không làm chậm tốc độ phản hồi API)
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

        // Trả về đối tượng Order hoàn chỉnh cho Controller
        return order;
    }

    /**
     * Đánh dấu đơn hàng đã thanh toán (Rút gọn)
     */
    @Transactional
    public void markOrderAsPaid(Integer orderId) {
        markOrderAsPaid(orderId, null, null);
    }

    /**
     * =============================================================================
     * TÍNH NĂNG [II.8.3]: XÁC NHẬN ĐƠN HÀNG ĐÃ THANH TOÁN PAYOS (MARK ORDER AS PAID)
     * =============================================================================
     * Hàm này được kích hoạt khi:
     * 1. Khách hàng quét mã PayOS xong và redirect về web thành công (/api/payment/verify).
     * 2. Hoặc PayOS tự động bắn Webhook trực tiếp vào máy chủ (/api/payment/webhook).
     * 
     * Các thao tác nghiệp vụ:
     * - Cập nhật trạng thái thanh toán đơn hàng sang 'paid'.
     * - Cập nhật trạng thái xử lý đơn hàng sang 'confirmed' (Đã xác nhận).
     * - Xóa sạch các món đồ trong giỏ hàng của khách hàng.
     * - Lưu bản ghi lịch sử giao dịch vào bảng 'payments'.
     * - Bắn thông báo chuông xác nhận thanh toán thành công.
     * - Gửi email biên nhận thanh toán PayOS.
     * =============================================================================
     */
    @Transactional
    public void markOrderAsPaid(Integer orderId, String transactionId, Long amount) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            // 1. Cập nhật trạng thái đơn hàng trong bảng 'orders'
            order.setPaymentStatus("paid");
            if ("pending".equalsIgnoreCase(order.getOrderStatus())) {
                order.setOrderStatus("confirmed");
            }
            orderRepository.save(order);

            // 2. DỌN SẠCH GIỎ HÀNG: Xóa toàn bộ sản phẩm trong giỏ sau khi đã thanh toán xong
            Cart cart = cartRepository.findByUserId(order.getUser().getUserId()).orElse(null);
            if (cart != null) {
                cartItemRepository.deleteAll(cart.getCartItems());
                cart.getCartItems().clear();
                cartRepository.save(cart);
            }

            BigDecimal paidAmount = amount != null ? BigDecimal.valueOf(amount) : order.getTotalAmount();
            String txId = transactionId != null ? transactionId : ("PAYOS-" + orderId);

            // 3. LƯU LỊCH SỬ GIAO DỊCH VÀO BẢNG 'payments' (SQL Server)
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

            // 4. BẮN THÔNG BÁO CHUÔNG CHO KHÁCH HÀNG
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

            // 5. GỬI EMAIL BIÊN NHẬN THANH TOÁN PAYOS
            try {
                emailService.sendPaymentConfirmationEmail(order, txId, paidAmount);
            } catch (Exception e) {
                System.err.println("Lỗi gửi email biên nhận thanh toán: " + e.getMessage());
            }
        }
    }

    /**
     * Lấy danh sách lịch sử tất cả các đơn hàng của một người dùng
     */
    @Transactional(readOnly = true)
    public List<com.example.myapp.model.OrderResponseDTO> getUserOrders(Integer userId) {
        // Sắp xếp các đơn mới nhất lên đầu danh sách
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return orders.stream().map(this::mapToOrderResponseDTO).collect(java.util.stream.Collectors.toList());
    }

    /**
     * Xem chi tiết 1 đơn hàng cụ thể (Có kiểm tra bảo mật phân quyền IDOR)
     */
    @Transactional(readOnly = true)
    public com.example.myapp.model.OrderResponseDTO getOrderDetail(Integer orderId, Integer userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Đơn hàng #" + orderId + " không tồn tại."));

        // Bảo mật IDOR: Chặn không cho người dùng này xem trộm đơn hàng của người dùng khác
        if (userId != null && !order.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền truy cập vào đơn hàng này.");
        }

        return mapToOrderResponseDTO(order);
    }

    /**
     * Hủy đơn hàng (Chỉ cho phép hủy khi đơn còn đang ở trạng thái 'pending')
     */
    @Transactional
    public void cancelOrder(Integer orderId, Integer userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Đơn hàng #" + orderId + " không tồn tại."));

        // Kiểm tra quyền hủy đơn của chính chủ
        if (userId != null && !order.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền hủy đơn hàng này.");
        }

        // Chặn nếu đơn đã được xác nhận hoặc đang đi giao
        if (!"pending".equalsIgnoreCase(order.getOrderStatus())) {
            throw new RuntimeException("Chỉ có thể hủy đơn hàng khi đơn đang ở trạng thái 'Chờ xử lý' (pending).");
        }

        order.setOrderStatus("cancelled");
        orderRepository.save(order);

        // Gửi thông báo xác nhận hủy đơn cho khách hàng
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

    /**
     * Cập nhật trạng thái đơn hàng (Dành cho Admin duyệt đơn, giao hàng)
     */
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

        // Bắn thông báo cập nhật tiến độ đơn hàng tức thì cho khách
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

    /**
     * Ánh xạ (Map) dữ liệu từ Entity Order sang DTO để trả về cho Frontend
     */
    private com.example.myapp.model.OrderResponseDTO mapToOrderResponseDTO(Order order) {
        List<com.example.myapp.model.OrderItemDetailDTO> itemDTOs = new ArrayList<>();
        if (order.getOrderItems() != null) {
            for (OrderItem oi : order.getOrderItems()) {
                String imgUrl = "";
                // Tìm ảnh đại diện chính của sản phẩm
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

                // Tính thành tiền của từng món trong đơn: giá mua * số lượng
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

        // Đóng gói toàn bộ thông tin đơn hàng vào DTO gửi lên giao diện
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
