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
    private final com.example.myapp.repos.PaymentRepository paymentRepository;

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

            long orderCode = order.getOrderId() * 100000L + (System.currentTimeMillis() % 100000L);

            String returnUrl = "http://localhost:3000/shop/cart?payment=success&orderCode=" + orderCode;
            String cancelUrl = "http://localhost:3000/shop/cart?payment=cancel&orderCode=" + orderCode;

            CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(order.getTotalAmount().longValue())
                    .description("Thanh toan #" + order.getOrderId())
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
            int realOrderId = orderCode > 100000L ? (int)(orderCode / 100000L) : orderCode.intValue();
            PaymentLink paymentData = payOS.paymentRequests().get(orderCode);
            if (paymentData.getStatus() != null && "PAID".equalsIgnoreCase(paymentData.getStatus().toString())) {
                // Đánh dấu đơn hàng là đã thanh toán & lưu vào bảng Payments
                orderService.markOrderAsPaid(
                        realOrderId,
                        "PAYOS-" + orderCode,
                        paymentData.getAmount()
                );
                return ResponseEntity.ok(Map.of("status", "success", "message", "Thanh toán thành công"));
            }
            return ResponseEntity.badRequest().body(Map.of("status", "pending", "message", "Chưa thanh toán hoặc bị hủy"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> handlePayOSWebhook(@RequestBody Object webhookBody) {
        try {
            vn.payos.model.webhooks.WebhookData webhookData = payOS.webhooks().verify(webhookBody);
            if (webhookData != null && webhookData.getOrderCode() != null) {
                long oc = webhookData.getOrderCode();
                int realOrderId = oc > 100000L ? (int)(oc / 100000L) : (int)oc;
                String txId = webhookData.getReference() != null && !webhookData.getReference().isEmpty()
                        ? webhookData.getReference()
                        : ("PAYOS-" + oc);

                orderService.markOrderAsPaid(
                        realOrderId,
                        txId,
                        webhookData.getAmount()
                );
            }
            return ResponseEntity.ok(Map.of("message", "Webhook verified and processed successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> getPaymentStatusByOrderId(@PathVariable Integer orderId) {
        return ResponseEntity.ok(paymentRepository.findByOrderOrderId(orderId));
    }
}

