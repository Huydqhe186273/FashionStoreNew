package com.example.myapp.service;

import com.example.myapp.entity.Category;
import com.example.myapp.entity.Product;
import com.example.myapp.entity.ProductVariant;
import com.example.myapp.entity.User;
import com.example.myapp.entity.UserBehaviorLog;
import com.example.myapp.entity.UserPreference;
import com.example.myapp.model.UserPreferenceDTO;
import com.example.myapp.repos.CategoryRepository;
import com.example.myapp.repos.ProductVariantRepository;
import com.example.myapp.repos.UserBehaviorLogRepository;
import com.example.myapp.repos.UserPreferenceRepository;
import com.example.myapp.repos.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserPreferenceService {

    private final UserPreferenceRepository userPreferenceRepository;
    private final UserBehaviorLogRepository userBehaviorLogRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ObjectMapper objectMapper;

    /**
     * Updates or builds the preference profile for the given user by aggregating recent behavior logs.
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public UserPreference updatePreferences(Integer userId) {
        if (userId == null) return null;

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return null;

        List<UserBehaviorLog> logs = userBehaviorLogRepository.findTop100ByUserUserIdOrderByCreatedAtDesc(userId);
        if (logs.isEmpty()) {
            return userPreferenceRepository.findByUserId(userId).orElse(null);
        }

        Map<Integer, Integer> categoryScores = new HashMap<>();
        Map<String, Integer> colorScores = new HashMap<>();
        Map<String, Integer> sizeScores = new HashMap<>();
        List<BigDecimal> prices = new ArrayList<>();

        for (UserBehaviorLog logEntry : logs) {
            Product p = logEntry.getProduct();
            if (p == null) continue;

            int weight = getActionWeight(logEntry.getActionType());

            // Category score
            if (p.getCategory() != null) {
                categoryScores.merge(p.getCategory().getCategoryId(), weight, Integer::sum);
            }

            // Price
            BigDecimal price = p.getDiscountPrice() != null && p.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0
                    ? p.getDiscountPrice()
                    : p.getBasePrice();
            if (price != null && price.compareTo(BigDecimal.ZERO) > 0) {
                prices.add(price);
            }

            // Variants (colors, sizes)
            List<ProductVariant> variants = productVariantRepository.findByProductId(p.getProductId());
            for (ProductVariant v : variants) {
                if (v.getColor() != null && !v.getColor().isBlank()) {
                    colorScores.merge(v.getColor().trim(), 1, Integer::sum);
                }
                if (v.getSize() != null && !v.getSize().isBlank()) {
                    sizeScores.merge(v.getSize().trim(), 1, Integer::sum);
                }
            }
        }

        // Top categories
        List<Integer> topCategories = categoryScores.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // Top colors
        List<String> topColors = colorScores.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // Top sizes
        List<String> topSizes = sizeScores.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        BigDecimal minPrice = prices.stream().min(BigDecimal::compareTo).orElse(BigDecimal.valueOf(100000));
        BigDecimal maxPrice = prices.stream().max(BigDecimal::compareTo).orElse(BigDecimal.valueOf(2000000));

        UserPreference preference = userPreferenceRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserPreference p = new UserPreference();
                    p.setUser(user);
                    return p;
                });

        try {
            preference.setPreferredCategories(objectMapper.writeValueAsString(topCategories));
            preference.setPreferredColors(objectMapper.writeValueAsString(topColors));
            preference.setPreferredSizes(objectMapper.writeValueAsString(topSizes));
        } catch (Exception e) {
            log.warn("Error serializing user preferences to JSON: {}", e.getMessage());
        }

        preference.setPreferredPriceMin(minPrice);
        preference.setPreferredPriceMax(maxPrice);
        preference.setUpdatedAt(LocalDateTime.now());

        return userPreferenceRepository.save(preference);
    }

    @Transactional(readOnly = true)
    public UserPreferenceDTO getUserPreferenceDTO(Integer userId) {
        if (userId == null) return null;
        UserPreference p = userPreferenceRepository.findByUserId(userId).orElse(null);
        if (p == null) return null;

        List<Integer> categoryIds = parseJsonList(p.getPreferredCategories(), Integer.class);
        List<String> colors = parseJsonList(p.getPreferredColors(), String.class);
        List<String> sizes = parseJsonList(p.getPreferredSizes(), String.class);

        List<String> categoryNames = new ArrayList<>();
        if (categoryIds != null && !categoryIds.isEmpty()) {
            for (Integer catId : categoryIds) {
                categoryRepository.findById(catId).ifPresent(c -> categoryNames.add(c.getName()));
            }
        }

        return UserPreferenceDTO.builder()
                .userId(userId)
                .preferredCategoryIds(categoryIds)
                .preferredCategoryNames(categoryNames)
                .preferredPriceMin(p.getPreferredPriceMin())
                .preferredPriceMax(p.getPreferredPriceMax())
                .preferredColors(colors)
                .preferredSizes(sizes)
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    public List<Integer> getPreferredCategoryIds(Integer userId) {
        if (userId == null) return Collections.emptyList();
        UserPreference p = userPreferenceRepository.findByUserId(userId).orElse(null);
        if (p == null || p.getPreferredCategories() == null) return Collections.emptyList();
        return parseJsonList(p.getPreferredCategories(), Integer.class);
    }

    private int getActionWeight(String actionType) {
        if (actionType == null) return 1;
        return switch (actionType.toLowerCase()) {
            case "purchase" -> 6;
            case "favorite" -> 4;
            case "add_to_cart" -> 3;
            case "search" -> 2;
            case "view", "click" -> 1;
            default -> 1;
        };
    }

    private <T> List<T> parseJsonList(String json, Class<T> clazz) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, objectMapper.getTypeFactory().constructCollectionType(List.class, clazz));
        } catch (Exception e) {
            log.warn("Error parsing JSON preferences list: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
