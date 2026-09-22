package com.example.myapp.controller;

import com.example.myapp.model.ReviewDTO;
import com.example.myapp.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping
    public ResponseEntity<ReviewDTO> create(@RequestBody Map<String, Object> body) {
        Integer userId = toInt(body.get("userId"));
        Integer productId = toInt(body.get("productId"));
        Integer orderItemId = toInt(body.get("orderItemId"));
        Integer rating = toInt(body.get("rating"));
        String comment = body.get("comment") == null ? null : body.get("comment").toString();
        return ResponseEntity.ok(reviewService.create(userId, productId, orderItemId, rating, comment));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReviewDTO> update(
            @PathVariable("id") Integer id,
            @RequestBody Map<String, Object> body) {
        Integer userId = toInt(body.get("userId"));
        Integer rating = body.get("rating") == null ? null : toInt(body.get("rating"));
        String comment = body.get("comment") == null ? null : body.get("comment").toString();
        return ResponseEntity.ok(reviewService.update(id, userId, rating, comment));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(
            @PathVariable("id") Integer id,
            @RequestParam("userId") Integer userId) {
        reviewService.delete(id, userId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private Integer toInt(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.intValue();
        try { return Integer.parseInt(o.toString()); } catch (NumberFormatException e) { return null; }
    }
}
