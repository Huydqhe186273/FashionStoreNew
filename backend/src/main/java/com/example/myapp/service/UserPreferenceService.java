package com.example.myapp.service;

import com.example.myapp.entity.Category;
import com.example.myapp.entity.Product;
import com.example.myapp.entity.ProductVariant;
import com.example.myapp.entity.UserBehaviorLog;
import com.example.myapp.model.UserPreferenceDTO;
import com.example.myapp.repos.CategoryRepository;
import com.example.myapp.repos.ProductVariantRepository;
import com.example.myapp.repos.UserBehaviorLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Xây "hồ sơ sở thích" của người dùng trực tiếp từ hành vi gần đây (không lưu trữ lại).
 * Dùng chung một luồng cho cả user đã đăng nhập và khách vãng lai (theo sessionId).
 */
@Service
@RequiredArgsConstructor
public class UserPreferenceService {

    /** Chỉ xét hành vi trong 30 ngày gần nhất. */
    static final int LOOKBACK_DAYS = 30;
    /** Số danh mục / màu / size ưa thích tối đa giữ lại. */
    static final int TOP_N = 5;

    private final UserBehaviorLogRepository userBehaviorLogRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository productVariantRepository;

    /**
     * Trả về sở thích của user (ưu tiên) hoặc của phiên khách vãng lai.
     * Trả về {@code null} nếu chưa có hành vi nào đủ ý nghĩa.
     */
    @Transactional(readOnly = true)
    public UserPreferenceDTO getPreferences(Integer userId, String sessionId) {
        String sid = (sessionId == null || sessionId.isBlank()) ? null : sessionId;
        LocalDateTime since = LocalDateTime.now().minusDays(LOOKBACK_DAYS);

        List<UserBehaviorLog> logs;
        if (userId != null) {
            logs = userBehaviorLogRepository.findRecentByUser(userId, sid, since);
        } else if (sid != null) {
            logs = userBehaviorLogRepository.findRecentBySession(sid, since);
        } else {
            return null;
        }

        UserPreferenceDTO dto = aggreagte(logs);
        if (dto != null) {
            dto.setUserId(userId);
        }
        return dto;
    }

    /** Tổng hợp danh sách hành vi thành hồ sơ sở thích. */
    UserPreferenceDTO aggregate(List<UserBehaviorLog> logs) {
        if (logs == null || logs.isEmpty()) return null;

        // Nạp variant của tất cả sản phẩm liên quan bằng 1 truy vấn
        Set<Integer> productIds = logs.stream()
                .map(UserBehaviorLog::getProduct).filter(Objects::nonNull)
                .map(Product::getProductId).collect(Collectors.toSet());
        Map<Integer, List<ProductVariant>> variantsByProduct = productIds.isEmpty()
                ? Map.of()
                : productVariantRepository.findByProductIdIn(productIds).stream()
                        .collect(Collectors.groupingBy(v -> v.getProduct().getProductId()));

        Map<Integer, Integer> categoryScores = new HashMap<>();
        Map<String, Integer> colorScores = new HashMap<>();
        Map<String, Integer> sizeScores = new HashMap<>();
        List<BigDecimal> prices = new ArrayList<>();

        for (UserBehaviorLog logEntry : logs) {
            Product p = logEntry.getProduct();
            if (p == null) continue;

            int weight = interactionWeight(logEntry.getActionType(), logEntry.getDurationSeconds());
            if (weight <= 0) continue;

            if (p.getCategory() != null) {
                categoryScores.merge(p.getCategory().getCategoryId(), weight, Integer::sum);
            }

            BigDecimal price = effectivePrice(p);
            if (price.compareTo(BigDecimal.ZERO) > 0) {
                prices.add(price);
            }

            // Mỗi sản phẩm chỉ cộng 1 lần cho mỗi màu/size (tránh SP nhiều size bị tính nhiều lần)
            List<ProductVariant> variants = variantsByProduct.getOrDefault(p.getProductId(), List.of());
            for (String color : distinct(variants, ProductVariant::getColor)) {
                colorScores.merge(color, weight, Integer::sum);
            }
            for (String size : distinct(variants, ProductVariant::getSize)) {
                sizeScores.merge(size, weight, Integer::sum);
            }
        }

        if (categoryScores.isEmpty()) return null;

        List<Integer> topCategories = topKeys(categoryScores);

        Map<Integer, String> names = categoryRepository.findAllById(topCategories).stream()
                .collect(Collectors.toMap(Category::getCategoryId, Category::getName, (a, b) -> a));
        List<String> categoryNames = topCategories.stream()
                .map(names::get).filter(Objects::nonNull).collect(Collectors.toList());

        return UserPreferenceDTO.builder()
                .preferredCategoryIds(topCategories)
                .preferredCategoryNames(categoryNames)
                .preferredPriceMin(prices.stream().min(BigDecimal::compareTo).orElse(null))
                .preferredPriceMax(prices.stream().max(BigDecimal::compareTo).orElse(null))
                .preferredColors(topKeys(colorScores))
                .preferredSizes(topKeys(sizeScores))
                .updatedAt(LocalDateTime.now())
                .build();
    }

    /**
     * Điểm mức độ quan tâm của một hành vi:
     * <ul>
     *   <li>click: 2</li>
     *   <li>view: &lt;5s = 0, 5–15s = 2, 15–40s = 5, &gt;40s = 8 (không rõ thời gian = 1)</li>
     *   <li>add_to_cart: 6</li>
     *   <li>favorite: 10</li>
     *   <li>purchase: 12</li>
     *   <li>search / khác: 0</li>
     * </ul>
     */
    static int interactionWeight(String actionType, Integer durationSeconds) {
        String action = actionType == null ? "" : actionType.toLowerCase();
        switch (action) {
            case "click":
                return 2;
            case "view":
                if (durationSeconds == null) return 1;
                if (durationSeconds > 40) return 8;
                if (durationSeconds > 15) return 5;
                if (durationSeconds >= 5) return 2;
                return 0;
            case "add_to_cart":
                return 6;
            case "favorite":
                return 10;
            case "purchase":
                return 12;
            default:
                return 0;
        }
    }

    static BigDecimal effectivePrice(Product p) {
        if (p.getDiscountPrice() != null && p.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0) {
            return p.getDiscountPrice();
        }
        return p.getBasePrice() != null ? p.getBasePrice() : BigDecimal.ZERO;
    }

    private static Set<String> distinct(List<ProductVariant> variants, Function<ProductVariant, String> field) {
        Set<String> out = new HashSet<>();
        for (ProductVariant v : variants) {
            String value = field.apply(v);
            if (value != null && !value.isBlank()) out.add(value.trim());
        }
        return out;
    }

    private static <K> List<K> topKeys(Map<K, Integer> scores) {
        return scores.entrySet().stream()
                .sorted(Map.Entry.<K, Integer>comparingByValue().reversed())
                .limit(TOP_N)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }
}
