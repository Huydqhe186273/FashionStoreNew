package com.example.myapp.controller;

import com.example.myapp.model.CartDTO;
import com.example.myapp.model.CartItemDTO;
import com.example.myapp.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PaymentController {

    private final PayOS payOS;
    private final CartService cartService;

    @PostMapping("/create-payment-link")
    public ResponseEntity<?> createPaymentLink(@RequestParam Integer userId) {
        try {
            // 1. Lấy thông tin giỏ hàng
            CartDTO cart = cartService.getCartByUserId(userId);
            if (cart == null || cart.getItems().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Giỏ hàng trống"));
            }

            // 2. Tạo danh sách Item cho PayOS
            List<PaymentLinkItem> items = new ArrayList<>();
            for (CartItemDTO cartItem : cart.getItems()) {
                PaymentLinkItem item = PaymentLinkItem.builder()
                        .name(cartItem.getProductName() + " - " + cartItem.getColor() + " - " + cartItem.getSize())
                        .price(cartItem.getPrice().longValue())
                        .quantity(cartItem.getQuantity())
                        .build();
                items.add(item);
            }

            // 3. Tạo orderCode duy nhất (Unix timestamp)
            long orderCode = System.currentTimeMillis() / 1000;

            // 4. Khởi tạo PaymentData
            String returnUrl = "http://localhost:3001/store/cart?payment=success";
            String cancelUrl = "http://localhost:3001/store/cart?payment=cancel";

            CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(cart.getTotalAmount().longValue())
                    .description("Thanh toan don hang")
                    .returnUrl(returnUrl)
                    .cancelUrl(cancelUrl)
                    .items(items)
                    .build();

            // 5. Gọi API PayOS để lấy link thanh toán
            CreatePaymentLinkResponse response = payOS.paymentRequests().create(request);
            
            return ResponseEntity.ok(Map.of("checkoutUrl", response.getCheckoutUrl()));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
