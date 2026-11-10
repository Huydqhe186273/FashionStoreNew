package com.example.myapp.controller;

import com.example.myapp.entity.Order;
import com.example.myapp.entity.OrderItem;
import com.example.myapp.repos.OrderRepository;
import com.example.myapp.service.OrderService;
import com.example.myapp.util.VietQRBankHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.v2.paymentRequests.Transaction;

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
            String returnUrl = "http://localhost:3000/shop/orders";
            String cancelUrl = "http://localhost:3000/shop/orders";

            CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(order.getTotalAmount().longValue())
                    .description("Thanh toan don " + order.getOrderId())
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
                List<Transaction> transactions = paymentData.getTransactions();
                Transaction payerTransaction = transactions != null && !transactions.isEmpty()
                    ? transactions.get(transactions.size() - 1)
                    : null;

                String pBankId = payerTransaction != null ? payerTransaction.getCounterAccountBankId() : null;
                String pBankName = payerTransaction != null ? payerTransaction.getCounterAccountBankName() : null;
                String pBankAccount = payerTransaction != null ? payerTransaction.getCounterAccountNumber() : null;
                String pAccountHolder = payerTransaction != null ? payerTransaction.getCounterAccountName() : null;

                // Chuẩn hóa tên ngân hàng nếu PayOS chỉ trả về BankId (BIN/CITAD) hoặc để trống
                if (pBankId != null && !pBankId.trim().isEmpty()) {
                    String resolved = VietQRBankHelper.getBankDisplayName(pBankId);
                    if (resolved != null && !resolved.trim().isEmpty()) {
                        pBankName = resolved;
                    }
                } else if (pBankName != null && !pBankName.trim().isEmpty()) {
                    pBankName = VietQRBankHelper.getBankDisplayName(pBankName);
                }
                if (pBankName == null || pBankName.trim().isEmpty()) {
                    pBankName = "TPBank";
                }

                // Nếu PayOS Sandbox không trả về tài khoản ngân hàng thật, fallback dữ liệu hợp lệ để hỗ trợ kiểm thử hoàn tiền
                if (pBankAccount == null || pBankAccount.trim().isEmpty()) {
                    Order ord = orderRepository.findById(realOrderId).orElse(null);
                    pBankName = "TPBank";
                    pBankAccount = "0987654321";
                    pAccountHolder = (ord != null && ord.getAddress() != null && ord.getAddress().getRecipientName() != null && !ord.getAddress().getRecipientName().isEmpty())
                            ? ord.getAddress().getRecipientName().toUpperCase()
                            : (ord != null && ord.getUser() != null && ord.getUser().getFullName() != null ? ord.getUser().getFullName().toUpperCase() : "NGUYEN VAN A");
                }

                // Đánh dấu đơn hàng là đã thanh toán & lưu vào bảng Payments
                orderService.markOrderAsPaid(
                        realOrderId,
                        "PAYOS-" + orderCode,
                        paymentData.getAmount(),
                        pBankName,
                        pBankAccount,
                        pAccountHolder
                );
                return ResponseEntity.ok(Map.of(
                        "status", "success",
                        "message", "Thanh toán thành công và đã ghi nhận thông tin tài khoản chuyển tiền",
                        "payerBankName", pBankName,
                        "payerBankAccount", pBankAccount,
                        "payerAccountHolder", pAccountHolder
                ));
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

                String pBankId = webhookData.getCounterAccountBankId();
                String pBankName = webhookData.getCounterAccountBankName();
                String pBankAccount = webhookData.getCounterAccountNumber();
                String pAccountHolder = webhookData.getCounterAccountName();

                // Chuẩn hóa tên ngân hàng nếu PayOS chỉ trả về BankId (BIN/CITAD) hoặc để trống
                if (pBankId != null && !pBankId.trim().isEmpty()) {
                    String resolved = VietQRBankHelper.getBankDisplayName(pBankId);
                    if (resolved != null && !resolved.trim().isEmpty()) {
                        pBankName = resolved;
                    }
                } else if (pBankName != null && !pBankName.trim().isEmpty()) {
                    pBankName = VietQRBankHelper.getBankDisplayName(pBankName);
                }
                if (pBankName == null || pBankName.trim().isEmpty()) {
                    pBankName = "TPBank";
                }

                if (pBankAccount == null || pBankAccount.trim().isEmpty()) {
                    Order ord = orderRepository.findById(realOrderId).orElse(null);
                    pBankName = "TPBank";
                    pBankAccount = "0987654321";
                    pAccountHolder = (ord != null && ord.getAddress() != null && ord.getAddress().getRecipientName() != null && !ord.getAddress().getRecipientName().isEmpty())
                            ? ord.getAddress().getRecipientName().toUpperCase()
                            : (ord != null && ord.getUser() != null && ord.getUser().getFullName() != null ? ord.getUser().getFullName().toUpperCase() : "NGUYEN VAN A");
                }

                orderService.markOrderAsPaid(
                        realOrderId,
                        txId,
                        webhookData.getAmount(),
                        pBankName,
                        pBankAccount,
                        pAccountHolder
                );
            }
            return ResponseEntity.ok(Map.of("message", "Webhook verified and processed successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * API Giả lập thanh toán thành công (Hỗ trợ phát triển và kiểm thử gửi email thông báo thanh toán)
     */
    @PostMapping("/simulate-success/{orderId}")
    public ResponseEntity<?> simulatePaymentSuccess(@PathVariable Integer orderId) {
        try {
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Không tìm thấy đơn hàng #" + orderId));
            }

            String pBankName = "MBBank (PayOS Sandbox)";
            String pBankAccount = "VQRQANIYS7948";
            String pAccountHolder = (order.getAddress() != null && order.getAddress().getRecipientName() != null && !order.getAddress().getRecipientName().isBlank())
                    ? order.getAddress().getRecipientName().toUpperCase()
                    : (order.getUser() != null && order.getUser().getFullName() != null ? order.getUser().getFullName().toUpperCase() : "DAO QUANG HUY");

            long amount = order.getTotalAmount() != null ? order.getTotalAmount().longValue() : 499000L;
            String txId = "PAYOS-SIM-" + System.currentTimeMillis();

            orderService.markOrderAsPaid(
                    orderId,
                    txId,
                    amount,
                    pBankName,
                    pBankAccount,
                    pAccountHolder
            );

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Đã xác nhận thanh toán thành công và gửi email biên nhận tới " + (order.getUser() != null ? order.getUser().getEmail() : "khách hàng"),
                    "orderId", orderId,
                    "transactionId", txId,
                    "userEmail", order.getUser() != null ? order.getUser().getEmail() : ""
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> getPaymentStatusByOrderId(@PathVariable Integer orderId) {
        return ResponseEntity.ok(paymentRepository.findByOrderOrderId(orderId));
    }
}
