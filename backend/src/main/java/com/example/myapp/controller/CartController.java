package com.example.myapp.controller;

import com.example.myapp.model.AddToCartRequestDTO;
import com.example.myapp.model.CartDTO;
import com.example.myapp.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartDTO> getCart(@RequestParam Integer userId) {
        CartDTO cart = cartService.getCartByUserId(userId);
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/add")
    public ResponseEntity<CartDTO> addToCart(
            @RequestParam Integer userId,
            @RequestBody AddToCartRequestDTO request) {
        CartDTO cart = cartService.addToCart(userId, request);
        return ResponseEntity.ok(cart);
    }

    // API Cập nhật số lượng của 1 sản phẩm trong giỏ hàng (Nút + / -)
    // Nhận userId, cartItemId từ URL và quantity mới từ request param
    @PutMapping("/update/{cartItemId}")
    public ResponseEntity<CartDTO> updateQuantity(
            @RequestParam Integer userId,
            @PathVariable Integer cartItemId,
            @RequestParam Integer quantity) {
        // Gọi Service kiểm tra tồn kho, cập nhật số lượng mới và tính lại tổng tiền
        CartDTO cart = cartService.updateCartItemQuantity(userId, cartItemId, quantity);
        return ResponseEntity.ok(cart);
    }

    @PutMapping("/edit/{cartItemId}")
    public ResponseEntity<CartDTO> editCartItem(
            @RequestParam Integer userId,
            @PathVariable Integer cartItemId,
            @RequestParam(required = false) Integer quantity,
            @RequestParam(required = false) Integer newVariantId) {
        CartDTO cart = cartService.updateCartItem(userId, cartItemId, quantity, newVariantId);
        return ResponseEntity.ok(cart);
    }

    // API Xóa 1 sản phẩm khỏi giỏ hàng
    // Nhận userId từ param (?userId=...) và cartItemId từ path variable (/remove/{cartItemId})
    @DeleteMapping("/remove/{cartItemId}")
    public ResponseEntity<CartDTO> removeItem(
            @RequestParam Integer userId,
            @PathVariable Integer cartItemId) {
        // Gọi Service xử lý xóa trong DB, tính lại tổng tiền và nhận về CartDTO mới
        CartDTO cart = cartService.removeCartItem(userId, cartItemId);
        // Trả về dữ liệu CartDTO dạng JSON với mã HTTP 200 OK
        return ResponseEntity.ok(cart);
    }

    @DeleteMapping("/clear")
    public ResponseEntity<CartDTO> clearCart(@RequestParam Integer userId) {
        CartDTO cart = cartService.clearCart(userId);
        return ResponseEntity.ok(cart);
    }
}
