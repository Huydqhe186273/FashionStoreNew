package com.example.myapp.controller;

import com.example.myapp.entity.Order;
import com.example.myapp.entity.OrderItem;
import com.example.myapp.repos.OrderRepository;
import com.example.myapp.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import vn.payos.model.v2.paymentRequests.PaymentLink;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PaymentController {

    private final PayOS payOS;
    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @PostMapping("/create-payment-link")
    public ResponseEntity<?> createPaymentLink(@RequestParam Integer orderId) {
        try {
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Đơn hàng không tồn tại"));
            }

            List<PaymentLinkItem> items = new ArrayList<>();
            for (OrderItem oi : order.getOrderItems()) {
                PaymentLinkItem item = PaymentLinkItem.builder()
                        .name(oi.getVariant().getProduct().getName() + " - " + oi.getVariant().getColor() + " - " + oi.getVariant().getSize())
                        .price(oi.getPriceAtPurchase().longValue())
                        .quantity(oi.getQuantity())
                        .build();
                items.add(item);
            }

            
            long orderCode = order.getOrderId();

            String returnUrl = "http://localhost:3000/shop/cart?payment=success&orderCode=" + orderCode;
            String cancelUrl = "http://localhost:3000/shop/cart?payment=cancel&orderCode=" + orderCode;

            CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(order.getTotalAmount().longValue())
                    .description("Thanh toan don " + orderCode)
                    .returnUrl(returnUrl)
                    .cancelUrl(cancelUrl)
                    .items(items)
                    .build();

            CreatePaymentLinkResponse response = payOS.paymentRequests().create(request);
            
            return ResponseEntity.ok(Map.of("checkoutUrl", response.getCheckoutUrl()));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestParam Long orderCode) {
        try {
            PaymentLink paymentData = payOS.paymentRequests().get(orderCode);
            if ("PAID".equals(paymentData.getStatus())) {
                // Đánh dấu đơn hàng là đã thanh toán
                orderService.markOrderAsPaid(orderCode.intValue());
                return ResponseEntity.ok(Map.of("status", "success", "message", "Thanh toán thành công"));
            }
            return ResponseEntity.badRequest().body(Map.of("status", "pending", "message", "Chưa thanh toán hoặc bị hủy"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}

