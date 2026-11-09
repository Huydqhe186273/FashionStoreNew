package com.example.myapp.service;

import com.example.myapp.entity.*;
import com.example.myapp.repos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
    private final ProductRepository productRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final TrackingService trackingService;
    private final ReturnRequestRepository returnRequestRepository;

    @Transactional
    public Order createOrderFromCart(Integer userId, Integer addressId) {
        return createOrderFromCart(userId, addressId, null);
    }

    @Transactional
    public Order createOrderFromCart(Integer userId, Integer addressId, String couponCode) {
        return createOrderFromCart(userId, addressId, couponCode, "PayOS");
    }

    @Transactional
    public Order createOrderFromCart(Integer userId, Integer addressId, String couponCode, String paymentMethod) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found or empty"));

        if (cart.getCartItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giỏ hàng đang trống");
        }

        // 0. Kiểm tra số lượng tồn kho từng sản phẩm trong giỏ hàng trước khi cho phép
        // tạo đơn
        for (CartItem cartItem : cart.getCartItems()) {
            ProductVariant variant = cartItem.getVariant();
            if (variant == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Biến thể sản phẩm không tồn tại trong hệ thống");
            }
            int availableStock = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
            int requestedQty = cartItem.getQuantity() != null ? cartItem.getQuantity() : 1;
            if (availableStock < requestedQty) {
                String prodName = variant.getProduct() != null ? variant.getProduct().getName() : "Sản phẩm";
                String variantInfo = (variant.getColor() != null ? variant.getColor() : "") + " "
                        + (variant.getSize() != null ? variant.getSize() : "");
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Sản phẩm '" + prodName + " (" + variantInfo.trim()
                                + ")' không đủ tồn kho để đặt hàng! Hiện chỉ còn " + availableStock
                                + " chiếc (Bạn đặt: " + requestedQty + " chiếc). Vui lòng cập nhật lại giỏ hàng.");
            }
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

        // Xử lý theo phương thức thanh toán (COD vs PayOS)
        String finalPaymentMethod = (paymentMethod != null && !paymentMethod.trim().isEmpty())
                ? paymentMethod.trim().toUpperCase()
                : "PAYOS";

        if ("COD".equalsIgnoreCase(finalPaymentMethod)) {
            // 1. Lưu bản ghi thanh toán COD vào database
            try {
                Payment payment = new Payment();
                payment.setOrder(order);
                payment.setAmount(totalAmount);
                payment.setPaymentMethod("COD");
                payment.setTransactionId("COD-" + order.getOrderId());
                payment.setStatus("pending");
                Payment savedP = paymentRepository.save(payment);
                if (order.getPayments() == null) {
                    order.setPayments(new ArrayList<>());
                }
                order.getPayments().add(savedP);
            } catch (Exception e) {
                System.err.println("Lỗi lưu Payment COD: " + e.getMessage());
            }

            // 2. Xóa giỏ hàng của user sau khi đặt đơn COD thành công
            try {
                cartItemRepository.deleteAll(cart.getCartItems());
                cart.getCartItems().clear();
                cartRepository.save(cart);
            } catch (Exception e) {
                System.err.println("Lỗi làm trống giỏ hàng sau khi đặt COD: " + e.getMessage());
            }

            // 3. Gửi thông báo đơn hàng COD
            try {
                java.text.DecimalFormat df = new java.text.DecimalFormat("#,###₫");
                notificationService.createNotification(
                        userId,
                        "order",
                        "Đơn hàng #" + order.getOrderId()
                                + " đã được đặt thành công với hình thức Thanh toán khi nhận hàng (COD). Tổng thanh toán: "
                                + df.format(order.getTotalAmount()) + ". Fashion Store sẽ sớm liên hệ xác nhận và giao hàng.");
            } catch (Exception e) {
                System.err.println("Lỗi tạo thông báo đơn hàng COD: " + e.getMessage());
            }
        } else {
            // 1. Lưu bản ghi thanh toán PayOS khởi tạo
            try {
                Payment payment = new Payment();
                payment.setOrder(order);
                payment.setAmount(totalAmount);
                payment.setPaymentMethod("PayOS");
                payment.setTransactionId("PAYOS-" + order.getOrderId());
                payment.setStatus("pending");
                Payment savedP = paymentRepository.save(payment);
                if (order.getPayments() == null) {
                    order.setPayments(new ArrayList<>());
                }
                order.getPayments().add(savedP);
            } catch (Exception e) {
                System.err.println("Lỗi lưu Payment PayOS: " + e.getMessage());
            }

            // 2. Gửi thông báo đơn hàng PayOS
            try {
                java.text.DecimalFormat df = new java.text.DecimalFormat("#,###₫");
                notificationService.createNotification(
                        userId,
                        "order",
                        "Đơn hàng #" + order.getOrderId() + " đã được tạo thành công với tổng thanh toán "
                            + df.format(order.getTotalAmount()) + ". Vui lòng hoàn tất thanh toán qua PayOS.");
            } catch (Exception e) {
                System.err.println("Lỗi tạo thông báo đơn hàng PayOS: " + e.getMessage());
            }
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
                        com.example.myapp.model.BehaviorLogRequestDTO logReq = com.example.myapp.model.BehaviorLogRequestDTO
                                .builder()
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
        markOrderAsPaid(orderId, transactionId, amount, null, null, null);
        }

        @Transactional
        public void markOrderAsPaid(Integer orderId, String transactionId, Long amount,
            String payerBankName, String payerBankAccount, String payerAccountHolder) {
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseGet(() -> orderRepository.findById(orderId).orElse(null));
        if (order != null && "paid".equalsIgnoreCase(order.getPaymentStatus())) {
            System.out.println("ℹ️ Đơn hàng #" + orderId + " đã ở trạng thái đã thanh toán (paid), bỏ qua xử lý lặp.");
            return;
        }
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

            // Tăng số lượng đã bán (soldCount) cho sản phẩm
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
                payment.setPayerBankName(payerBankName);
                payment.setPayerBankAccount(payerBankAccount);
                payment.setPayerAccountHolder(payerAccountHolder);
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
                        "Đơn hàng #" + order.getOrderId() + " đã được thanh toán thành công qua PayOS ("
                                + df.format(paidAmount) + "). Fashion Store đang tiến hành đóng gói sản phẩm.");
            } catch (Exception e) {
                System.err.println("Lỗi tạo thông báo thanh toán: " + e.getMessage());
            }

            // Gửi email biên nhận thanh toán PayOS
            try {
                emailService.sendPaymentConfirmationEmail(order, txId, paidAmount, payerBankName, payerBankAccount, payerAccountHolder);
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

        boolean wasPaid = "paid".equalsIgnoreCase(order.getPaymentStatus());
        order.setOrderStatus("cancelled");
        if (wasPaid) {
            order.setPaymentStatus("refunded");
            ReturnRequest rr = new ReturnRequest();
            rr.setOrder(order);
            rr.setReason("Khách hủy đơn hàng đã thanh toán online - Hoàn tiền về tài khoản");
            rr.setStatus("pending");
            rr.setRefundAmount(order.getTotalAmount());
            rr.setCreatedAt(LocalDateTime.now());
            paymentRepository.findSuccessfulPaymentsWithPayerAccount(orderId).stream().findFirst().ifPresent(payment -> {
                rr.setBankName(payment.getPayerBankName());
                rr.setBankAccount(payment.getPayerBankAccount());
                rr.setAccountHolder(payment.getPayerAccountHolder());
            });
            returnRequestRepository.save(rr);
        }
        orderRepository.save(order);

        // Gửi thông báo hủy đơn
        try {
            String msg = wasPaid
                    ? "Đơn hàng #" + order.getOrderId() + " đã được hủy. Số tiền đã thanh toán sẽ được hoàn về tài khoản chuyển tiền của bạn."
                    : "Đơn hàng #" + order.getOrderId() + " đã được hủy thành công theo yêu cầu của bạn.";
            notificationService.createNotification(
                    userId,
                    "order",
                    msg);
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
                    "Đơn hàng #" + order.getOrderId() + " của bạn hiện " + statusDesc + ".");
        } catch (Exception e) {
            System.err.println("Lỗi tạo thông báo cập nhật tiến độ đơn: " + e.getMessage());
        }
    }

    @Transactional
    public ReturnRequest createReturnRequest(Integer orderId, Integer userId, String reason) {
        return createReturnRequest(orderId, userId, reason, null, null, null);
    }

    @Transactional
    public ReturnRequest createReturnRequest(Integer orderId, Integer userId, String reason,
                                             String bankName, String bankAccount, String accountHolder) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Đơn hàng #" + orderId + " không tồn tại."));

        if (userId != null && !order.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền gửi yêu cầu trả hàng cho đơn này.");
        }

        if (!"paid".equalsIgnoreCase(order.getPaymentStatus())) {
            throw new RuntimeException("Chỉ có thể yêu cầu trả hàng / hoàn tiền cho đơn đã thanh toán.");
        }

        if ("cancelled".equalsIgnoreCase(order.getOrderStatus()) || "returned".equalsIgnoreCase(order.getOrderStatus())) {
            throw new RuntimeException("Đơn hàng này không thể gửi yêu cầu hoàn tiền.");
        }

        java.util.Optional<ReturnRequest> latestOpt = returnRequestRepository.findLatestByOrderId(orderId);
        if (latestOpt.isPresent()) {
            String currStatus = latestOpt.get().getStatus();
            if ("pending".equalsIgnoreCase(currStatus)) {
                throw new RuntimeException("Đơn hàng này đã có yêu cầu hoàn tiền đang chờ duyệt.");
            } else if ("approved".equalsIgnoreCase(currStatus) || "refunded".equalsIgnoreCase(currStatus)) {
                throw new RuntimeException("Đơn hàng này đã được duyệt hoàn tiền.");
            }
        }

        Payment payerPayment = paymentRepository.findSuccessfulPaymentsWithPayerAccount(orderId).stream().findFirst().orElse(null);

        ReturnRequest request = new ReturnRequest();
        request.setOrder(order);
        request.setReason(reason != null && !reason.trim().isEmpty() ? reason.trim() : "Khách hàng yêu cầu trả hàng hoàn tiền");
        request.setStatus("pending");
        request.setRefundAmount(order.getTotalAmount());
        request.setCreatedAt(LocalDateTime.now());
        request.setBankName(bankName != null && !bankName.trim().isEmpty()
                ? bankName.trim()
                : (payerPayment != null ? payerPayment.getPayerBankName() : null));
        request.setBankAccount(bankAccount != null && !bankAccount.trim().isEmpty()
                ? bankAccount.trim()
                : (payerPayment != null ? payerPayment.getPayerBankAccount() : null));
        request.setAccountHolder(accountHolder != null && !accountHolder.trim().isEmpty()
                ? accountHolder.trim().toUpperCase()
                : (payerPayment != null ? payerPayment.getPayerAccountHolder() : null));

        ReturnRequest saved = returnRequestRepository.save(request);

        // Gửi thông báo cho khách hàng
        try {
            notificationService.createNotification(
                    order.getUser().getUserId(),
                    "order",
                    "Yêu cầu trả hàng & hoàn tiền cho đơn hàng #" + orderId + " đã được gửi thành công và đang chờ xét duyệt."
            );
        } catch (Exception e) {
            System.err.println("Lỗi tạo thông báo yêu cầu hoàn tiền: " + e.getMessage());
        }

        return saved;
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
                        .productId(oi.getVariant() != null && oi.getVariant().getProduct() != null
                                ? oi.getVariant().getProduct().getProductId()
                                : null)
                        .productName(oi.getVariant() != null && oi.getVariant().getProduct() != null
                                ? oi.getVariant().getProduct().getName()
                                : "Sản phẩm")
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

        String returnStatus = null;
        String returnReason = null;
        BigDecimal refundAmount = null;
        String returnBankName = null;
        String returnBankAccount = null;
        String returnAccountHolder = null;
        java.util.Optional<ReturnRequest> returnOpt = returnRequestRepository.findLatestByOrderId(order.getOrderId());
        if (returnOpt.isPresent()) {
            ReturnRequest rr = returnOpt.get();
            returnStatus = rr.getStatus();
            returnReason = rr.getReason();
            refundAmount = rr.getRefundAmount();
            returnBankName = rr.getBankName();
            returnBankAccount = rr.getBankAccount();
            returnAccountHolder = rr.getAccountHolder();
        }

        Payment payerPayment = paymentRepository.findSuccessfulPaymentsWithPayerAccount(order.getOrderId()).stream().findFirst().orElse(null);
        if (payerPayment == null) {
            payerPayment = paymentRepository.findByOrderOrderIdDesc(order.getOrderId()).stream()
                    .filter(p -> p.getPayerBankAccount() != null && !p.getPayerBankAccount().isEmpty())
                    .findFirst().orElse(null);
        }

        String resolvedPayerBankName = null;
        String resolvedPayerBankAccount = null;
        String resolvedPayerAccountHolder = null;
        if (payerPayment != null) {
            resolvedPayerBankAccount = payerPayment.getPayerBankAccount();
            resolvedPayerAccountHolder = payerPayment.getPayerAccountHolder();
            resolvedPayerBankName = payerPayment.getPayerBankName();
            if ((resolvedPayerBankName == null || resolvedPayerBankName.trim().isEmpty()) && resolvedPayerBankAccount != null && !resolvedPayerBankAccount.trim().isEmpty()) {
                resolvedPayerBankName = "MBBank";
            }
        }

        boolean isPaid = "paid".equalsIgnoreCase(order.getPaymentStatus());
        boolean notClosed = !"cancelled".equalsIgnoreCase(order.getOrderStatus()) && !"returned".equalsIgnoreCase(order.getOrderStatus());
        boolean canReturn = isPaid && notClosed && (returnStatus == null || "rejected".equalsIgnoreCase(returnStatus));

        // Xác định phương thức thanh toán chính xác nhất từ database
        String resolvedMethod = null;
        try {
            List<Payment> payments = paymentRepository.findByOrderOrderId(order.getOrderId());
            if (payments != null && !payments.isEmpty()) {
                resolvedMethod = payments.get(payments.size() - 1).getPaymentMethod();
            }
        } catch (Exception e) {
            // fallback
        }
        if (resolvedMethod == null && order.getPayments() != null && !order.getPayments().isEmpty()) {
            resolvedMethod = order.getPayments().get(order.getPayments().size() - 1).getPaymentMethod();
        }
        if (resolvedMethod == null) {
            resolvedMethod = "paid".equalsIgnoreCase(order.getPaymentStatus()) ? "PayOS" : "COD";
        }

        return com.example.myapp.model.OrderResponseDTO.builder()
                .orderId(order.getOrderId())
                .orderStatus(order.getOrderStatus())
                .paymentStatus(order.getPaymentStatus())
                .paymentMethod(resolvedMethod)
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
                .canReturn(canReturn)
                .returnStatus(returnStatus)
                .returnReason(returnReason)
                .refundAmount(refundAmount)
                .returnBankName(returnBankName)
                .returnBankAccount(returnBankAccount)
                .returnAccountHolder(returnAccountHolder)
                .payerBankName(resolvedPayerBankName)
                .payerBankAccount(resolvedPayerBankAccount)
                .payerAccountHolder(resolvedPayerAccountHolder)
                .items(itemDTOs)
                .build();
    }
}
