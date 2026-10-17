package com.example.myapp.controller;

import com.example.myapp.model.CustomerProductDTO;
import com.example.myapp.model.UserPreferenceDTO;
import com.example.myapp.service.ProductSimilarityService;
import com.example.myapp.service.RecommendationService;
import com.example.myapp.service.UserPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final ProductSimilarityService productSimilarityService;
    private final UserPreferenceService userPreferenceService;

    @GetMapping("/personalized")
    public ResponseEntity<List<CustomerProductDTO>> getPersonalizedRecommendations(
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) String sessionId,
            @RequestParam(required = false, defaultValue = "10") int limit) {
        return ResponseEntity.ok(recommendationService.getPersonalizedRecommendations(userId, sessionId, limit));
    }

    @GetMapping("/cold-start")
    public ResponseEntity<List<CustomerProductDTO>> getColdStartRecommendations(
            @RequestParam(required = false, defaultValue = "10") int limit) {
        return ResponseEntity.ok(recommendationService.getColdStartRecommendations(limit));
    }

    @GetMapping("/products/{id}/similar")
    public ResponseEntity<List<CustomerProductDTO>> getSimilarProducts(
            @PathVariable("id") Integer id,
            @RequestParam(required = false, defaultValue = "6") int limit) {
        return ResponseEntity.ok(productSimilarityService.getSimilarProducts(id, limit));
    }

    @GetMapping("/preferences")
    public ResponseEntity<UserPreferenceDTO> getUserPreferences(
            @RequestParam Integer userId) {
        return ResponseEntity.ok(userPreferenceService.getUserPreferenceDTO(userId));
    }

    @PostMapping("/similarity/calculate")
    public ResponseEntity<?> calculateSimilarities() {
        int count = productSimilarityService.computeAndStoreSimilarities();
        return ResponseEntity.ok(Map.of("success", true, "relationsComputed", count));
    }
}
