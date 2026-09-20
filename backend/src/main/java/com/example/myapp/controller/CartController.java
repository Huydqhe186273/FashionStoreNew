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
}
