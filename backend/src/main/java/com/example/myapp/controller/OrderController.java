package com.example.myapp.controller;

import com.example.myapp.entity.Order;
import com.example.myapp.entity.ReturnRequest;
import com.example.myapp.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/create-from-cart")
    public ResponseEntity<?> createOrderFromCart(
            @RequestParam Integer userId,
            @RequestParam Integer addressId,
            @RequestParam(required = false) String couponCode,
            @RequestParam(required = false, defaultValue = "PayOS") String paymentMethod) {
        try {
            Order order = orderService.createOrderFromCart(userId, addressId, couponCode, paymentMethod);
            return ResponseEntity.ok(Map.of(
                    "orderId", order.getOrderId(),
                    "totalAmount", order.getTotalAmount(),
                    "paymentMethod", paymentMethod,
                    "message", "Order created successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserOrders(@RequestParam Integer userId) {
        try {
            return ResponseEntity.ok(orderService.getUserOrders(userId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<?> getOrderDetail(
            @PathVariable Integer orderId,
            @RequestParam(required = false) Integer userId) {
        try {
            return ResponseEntity.ok(orderService.getOrderDetail(orderId, userId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(
            @PathVariable Integer orderId,
            @RequestParam Integer userId) {
        try {
            orderService.cancelOrder(orderId, userId);
            return ResponseEntity.ok(Map.of("message", "Đã hủy đơn hàng thành công!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Integer orderId,
            @RequestParam String status) {
        try {
            orderService.updateOrderStatus(orderId, status);
            return ResponseEntity.ok(Map.of("message", "Đã cập nhật trạng thái đơn hàng và gửi thông báo thành công!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{orderId}/return-request")
    public ResponseEntity<?> createReturnRequest(
            @PathVariable Integer orderId,
            @RequestParam Integer userId,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String reason = body != null && body.containsKey("reason") ? body.get("reason") : "Yêu cầu trả hàng & hoàn tiền";
            String bankName = body != null ? body.get("bankName") : null;
            String bankAccount = body != null ? body.get("bankAccount") : null;
            String accountHolder = body != null ? body.get("accountHolder") : null;
            String evidenceImages = body != null ? body.get("evidenceImages") : null;
            ReturnRequest request = orderService.createReturnRequest(orderId, userId, reason, bankName, bankAccount, accountHolder, evidenceImages);

            Map<String, Object> result = new HashMap<>();
            result.put("message", "Đã gửi yêu cầu trả hàng & hoàn tiền thành công!");
            result.put("returnId", request != null ? request.getReturnId() : null);
            result.put("status", request != null ? request.getStatus() : "pending");
            result.put("refundAmount", request != null && request.getRefundAmount() != null ? request.getRefundAmount() : BigDecimal.ZERO);
            result.put("bankName", request != null && request.getBankName() != null ? request.getBankName() : "");
            result.put("bankAccount", request != null && request.getBankAccount() != null ? request.getBankAccount() : "");
            result.put("accountHolder", request != null && request.getAccountHolder() != null ? request.getAccountHolder() : "");
            result.put("evidenceImages", request != null && request.getEvidenceImages() != null ? request.getEvidenceImages() : "");

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            String errorMsg = e.getMessage() != null ? e.getMessage() : "Đã xảy ra lỗi khi tạo yêu cầu hoàn tiền";
            return ResponseEntity.badRequest().body(Map.of("error", errorMsg));
        }
    }
}
