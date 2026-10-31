package com.example.myapp.controller;

import com.example.myapp.entity.Order;
import com.example.myapp.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
            @RequestParam(required = false) String couponCode) {
        try {
            Order order = orderService.createOrderFromCart(userId, addressId, couponCode);
            return ResponseEntity.ok(Map.of(
                    "orderId", order.getOrderId(),
                    "totalAmount", order.getTotalAmount(),
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
}
