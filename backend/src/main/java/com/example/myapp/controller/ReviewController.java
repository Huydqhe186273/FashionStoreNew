package com.example.myapp.controller;

import com.example.myapp.model.ReviewDTO;
import com.example.myapp.model.ReviewableProductDTO;
import com.example.myapp.security.CustomUserDetails;
import com.example.myapp.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer/reviews")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<Map<String, Object>> listByProduct(@PathVariable("productId") Integer productId) {
        return ResponseEntity.ok(reviewService.listByProduct(productId));
    }

    @GetMapping("/eligible")
    public ResponseEntity<List<ReviewableProductDTO>> listPaidItems(
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(reviewService.listPaidItems(user.getId()));
    }

    @PostMapping
    public ResponseEntity<ReviewDTO> create(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody Map<String, Object> body) {
        Integer orderItemId = toInt(body.get("orderItemId"));
        Integer rating = toInt(body.get("rating"));
        String comment = body.get("comment") == null ? null : body.get("comment").toString();
        return ResponseEntity.ok(reviewService.create(user.getId(), orderItemId, rating, comment));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReviewDTO> update(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody Map<String, Object> body) {
        Integer rating = body.get("rating") == null ? null : toInt(body.get("rating"));
        String comment = body.get("comment") == null ? null : body.get("comment").toString();
        return ResponseEntity.ok(reviewService.update(id, user.getId(), rating, comment));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal CustomUserDetails user) {
        reviewService.delete(id, user.getId());
        return ResponseEntity.ok(Map.of("success", true));
    }

    private Integer toInt(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.intValue();
        try { return Integer.parseInt(o.toString()); } catch (NumberFormatException e) { return null; }
    }
}
