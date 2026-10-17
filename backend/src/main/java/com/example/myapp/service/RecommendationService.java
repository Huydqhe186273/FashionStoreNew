package com.example.myapp.service;

import com.example.myapp.entity.Product;
import com.example.myapp.entity.ProductVariant;
import com.example.myapp.entity.Recommendation;
import com.example.myapp.entity.User;
import com.example.myapp.model.CustomerProductDTO;
import com.example.myapp.model.UserPreferenceDTO;
import com.example.myapp.repos.ProductRepository;
import com.example.myapp.repos.ProductVariantRepository;
import com.example.myapp.repos.RecommendationRepository;
import com.example.myapp.repos.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final RecommendationRepository recommendationRepository;
    private final UserRepository userRepository;
    private final UserPreferenceService userPreferenceService;
    private final CustomerProductService customerProductService;

    /**
     * Personalized recommendations for user or session.
     * Uses preference profile, behavior logs, and falling back to cold start.
     */
    @Transactional
    public List<CustomerProductDTO> getPersonalizedRecommendations(Integer userId, String sessionId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 30));

        if (userId == null) {
            return getColdStartRecommendations(safeLimit);
        }

        UserPreferenceDTO pref = userPreferenceService.getUserPreferenceDTO(userId);
        if (pref == null || (pref.getPreferredCategoryIds() == null || pref.getPreferredCategoryIds().isEmpty())) {
            // Try updating preference once
            userPreferenceService.updatePreferences(userId);
            pref = userPreferenceService.getUserPreferenceDTO(userId);
        }

        // If still no preference, fallback to cold start
        if (pref == null || pref.getPreferredCategoryIds() == null || pref.getPreferredCategoryIds().isEmpty()) {
            return getColdStartRecommendations(safeLimit);
        }

        List<Product> candidates = productRepository.findAll().stream()
                .filter(p -> "active".equalsIgnoreCase(p.getStatus()))
                .filter(p -> !Boolean.TRUE.equals(p.getIsTest()))
                .collect(Collectors.toList());

        List<ScoredProduct> scored = new ArrayList<>();
        User user = userRepository.findById(userId).orElse(null);

        for (Product p : candidates) {
            double score = scoreProductAgainstPreference(p, pref);
            scored.add(new ScoredProduct(p, score));
        }

        scored.sort((a, b) -> Double.compare(b.score, a.score));

        List<CustomerProductDTO> result = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < Math.min(safeLimit, scored.size()); i++) {
            ScoredProduct sp = scored.get(i);
            result.add(customerProductService.mapToDTO(sp.product, false));

            // Persist recommendation record
            if (user != null) {
                try {
                    Recommendation rec = new Recommendation();
                    rec.setUser(user);
                    rec.setSessionId(sessionId);
                    rec.setProduct(sp.product);
                    rec.setReason("personalized");
                    rec.setScore(BigDecimal.valueOf(sp.score).setScale(4, RoundingMode.HALF_UP));
                    rec.setCreatedAt(now);
                    recommendationRepository.save(rec);
                } catch (Exception e) {
                    log.warn("Failed saving recommendation log: {}", e.getMessage());
                }
            }
        }

        // If candidates were few, top up with cold start
        if (result.size() < safeLimit) {
            Set<Integer> existingIds = result.stream().map(CustomerProductDTO::getProductId).collect(Collectors.toSet());
            List<CustomerProductDTO> coldStart = getColdStartRecommendations(safeLimit);
            for (CustomerProductDTO dto : coldStart) {
                if (!existingIds.contains(dto.getProductId())) {
                    result.add(dto);
                    existingIds.add(dto.getProductId());
                    if (result.size() >= safeLimit) break;
                }
            }
        }

        return result;
    }

    /**
     * Cold start recommendations for guests or new users without behavior history.
     * Curates a blend of top bestsellers and newest items.
     */
    @Transactional(readOnly = true)
    public List<CustomerProductDTO> getColdStartRecommendations(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 30));

        List<CustomerProductDTO> bestsellers = customerProductService.getBestsellers(safeLimit);
        List<CustomerProductDTO> newProducts = customerProductService.getNewProducts(safeLimit);

        Map<Integer, CustomerProductDTO> merged = new LinkedHashMap<>();
        int maxLen = Math.max(bestsellers.size(), newProducts.size());
        for (int i = 0; i < maxLen; i++) {
            if (i < bestsellers.size()) {
                merged.putIfAbsent(bestsellers.get(i).getProductId(), bestsellers.get(i));
            }
            if (i < newProducts.size()) {
                merged.putIfAbsent(newProducts.get(i).getProductId(), newProducts.get(i));
            }
            if (merged.size() >= safeLimit) break;
        }

        return new ArrayList<>(merged.values());
    }

    private double scoreProductAgainstPreference(Product p, UserPreferenceDTO pref) {
        double score = 0.0;

        // 1. Category matching
        if (p.getCategory() != null && pref.getPreferredCategoryIds() != null) {
            int rank = pref.getPreferredCategoryIds().indexOf(p.getCategory().getCategoryId());
            if (rank >= 0) {
                // Top category +50, second +40, third +30, etc.
                score += Math.max(10.0, 50.0 - (rank * 10.0));
            }
        }

        // 2. Price proximity
        BigDecimal price = p.getDiscountPrice() != null && p.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0
                ? p.getDiscountPrice()
                : p.getBasePrice();
        if (price != null && pref.getPreferredPriceMin() != null && pref.getPreferredPriceMax() != null) {
            if (price.compareTo(pref.getPreferredPriceMin()) >= 0 && price.compareTo(pref.getPreferredPriceMax()) <= 0) {
                score += 25.0;
            } else {
                // Within 25% margin
                BigDecimal lower = pref.getPreferredPriceMin().multiply(BigDecimal.valueOf(0.75));
                BigDecimal upper = pref.getPreferredPriceMax().multiply(BigDecimal.valueOf(1.25));
                if (price.compareTo(lower) >= 0 && price.compareTo(upper) <= 0) {
                    score += 15.0;
                }
            }
        }

        // 3. Variant colors & sizes matching
        List<ProductVariant> variants = productVariantRepository.findByProductId(p.getProductId());
        if (pref.getPreferredColors() != null && !pref.getPreferredColors().isEmpty()) {
            boolean colorMatch = variants.stream()
                    .anyMatch(v -> v.getColor() != null && pref.getPreferredColors().contains(v.getColor().trim()));
            if (colorMatch) score += 15.0;
        }

        if (pref.getPreferredSizes() != null && !pref.getPreferredSizes().isEmpty()) {
            boolean sizeMatch = variants.stream()
                    .anyMatch(v -> v.getSize() != null && pref.getPreferredSizes().contains(v.getSize().trim()));
            if (sizeMatch) score += 10.0;
        }

        // 4. Popularity boost (soldCount, viewCount)
        if (p.getSoldCount() != null) {
            score += Math.min(10.0, p.getSoldCount() * 0.1);
        }
        if (p.getViewCount() != null) {
            score += Math.min(5.0, p.getViewCount() * 0.02);
        }

        return score;
    }

    private static class ScoredProduct {
        final Product product;
        final double score;

        ScoredProduct(Product product, double score) {
            this.product = product;
            this.score = score;
        }
    }
}
