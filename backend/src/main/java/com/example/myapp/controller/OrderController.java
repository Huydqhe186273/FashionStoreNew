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
    public ResponseEntity<?> createOrderFromCart(@RequestParam Integer userId, @RequestParam Integer addressId) {
        try {
            Order order = orderService.createOrderFromCart(userId, addressId);
            return ResponseEntity.ok(Map.of("orderId", order.getOrderId(), "message", "Order created successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
