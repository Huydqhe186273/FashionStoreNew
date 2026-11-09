package com.example.myapp.controller;

import com.example.myapp.model.CustomerProductDTO;
import com.example.myapp.model.RecommendationResponseDTO;
import com.example.myapp.model.UserPreferenceDTO;
import com.example.myapp.security.CustomUserDetails;
import com.example.myapp.service.ProductSimilarityService;
import com.example.myapp.service.RecommendationService;
import com.example.myapp.service.UserPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API gợi ý sản phẩm.
 * userId luôn lấy từ JWT (nếu có), client chỉ gửi sessionId cho khách vãng lai.
 * "Sản phẩm tương tự" nằm ở GET /api/customer/products/{id}/similar.
 */
@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final ProductSimilarityService productSimilarityService;
    private final UserPreferenceService userPreferenceService;

    @GetMapping("/personalized")
    public ResponseEntity<RecommendationResponseDTO> getPersonalizedRecommendations(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(required = false) String sessionId,
            @RequestParam(required = false, defaultValue = "8") int limit) {
        return ResponseEntity.ok(recommendationService.getPersonalizedRecommendations(userIdOf(user), sessionId, limit));
    }

    @GetMapping("/cold-start")
    public ResponseEntity<List<CustomerProductDTO>> getColdStartRecommendations(
            @RequestParam(required = false, defaultValue = "8") int limit) {
        return ResponseEntity.ok(recommendationService.getColdStartRecommendations(limit));
    }

    /** Hồ sơ sở thích hiện tại của chính người đang xem (user hoặc phiên khách). */
    @GetMapping("/preferences")
    public ResponseEntity<UserPreferenceDTO> getMyPreferences(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(required = false) String sessionId) {
        UserPreferenceDTO pref = userPreferenceService.getPreferences(userIdOf(user), sessionId);
        return pref == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(pref);
    }

    /** Chỉ ADMIN (chặn trong SecurityConfig). */
    @PostMapping("/similarity/calculate")
    public ResponseEntity<?> calculateSimilarities() {
        int count = productSimilarityService.computeAndStoreSimilarities();
        return ResponseEntity.ok(Map.of("success", true, "relationsComputed", count));
    }

    /** Xoá lịch sử hành vi của chính người đang xem (dùng cho nút "Reset AI"). */
    @DeleteMapping("/reset")
    public ResponseEntity<?> resetMyHistory(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(required = false) String sessionId) {
        recommendationService.resetUserAIHistory(userIdOf(user), sessionId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Đã xóa dữ liệu gợi ý thành công!"));
    }

    private static Integer userIdOf(CustomUserDetails user) {
        return user != null ? user.getId() : null;
    }
}
