package com.example.myapp.controller;

import com.example.myapp.model.CustomerProductDTO;
import com.example.myapp.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer/favorites")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping
    public ResponseEntity<List<CustomerProductDTO>> listFavorites(@RequestParam("userId") Integer userId) {
        return ResponseEntity.ok(favoriteService.listFavorites(userId));
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkFavorite(
            @RequestParam("userId") Integer userId,
            @RequestParam("productId") Integer productId) {
        boolean favorited = favoriteService.isFavorited(userId, productId);
        return ResponseEntity.ok(Map.of("favorited", favorited));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> addFavorite(
            @RequestParam("userId") Integer userId,
            @RequestParam("productId") Integer productId) {
        favoriteService.addFavorite(userId, productId);
        return ResponseEntity.ok(Map.of("success", true, "favorited", true));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> removeFavorite(
            @RequestParam("userId") Integer userId,
            @RequestParam("productId") Integer productId) {
        favoriteService.removeFavorite(userId, productId);
        return ResponseEntity.ok(Map.of("success", true, "favorited", false));
    }
}
