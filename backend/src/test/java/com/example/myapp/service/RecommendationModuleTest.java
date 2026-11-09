package com.example.myapp.service;

import com.example.myapp.entity.Category;
import com.example.myapp.entity.Product;
import com.example.myapp.entity.ProductVariant;
import com.example.myapp.entity.UserBehaviorLog;
import com.example.myapp.model.CustomerProductDTO;
import com.example.myapp.model.RecommendationResponseDTO;
import com.example.myapp.model.UserPreferenceDTO;
import com.example.myapp.repos.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Unit test cho module gợi ý (không cần database). */
class RecommendationModuleTest {

    // ===== Helpers tạo dữ liệu =====

    static Category category(int id, Category parent, String gender) {
        Category c = new Category();
        c.setCategoryId(id);
        c.setName("Cat " + id);
        c.setParent(parent);
        c.setGender(gender);
        return c;
    }

    static Product product(int id, Category category, long price) {
        Product p = new Product();
        p.setProductId(id);
        p.setName("P" + id);
        p.setCategory(category);
        p.setBasePrice(BigDecimal.valueOf(price));
        p.setStatus("active");
        p.setSoldCount(0);
        p.setViewCount(0);
        return p;
    }

    static ProductVariant variant(Product p, String color, String size, int stock) {
        ProductVariant v = new ProductVariant();
        v.setProduct(p);
        v.setColor(color);
        v.setSize(size);
        v.setStockQuantity(stock);
        return v;
    }

    static UserBehaviorLog log(Product p, String action, Integer duration) {
        UserBehaviorLog l = new UserBehaviorLog();
        l.setProduct(p);
        l.setActionType(action);
        l.setDurationSeconds(duration);
        return l;
    }

    static CustomerProductDTO dto(Product p) {
        return CustomerProductDTO.builder().productId(p.getProductId()).totalStock(10).build();
    }

    // ===== 1. Trọng số hành vi =====

    @Nested
    @DisplayName("Trọng số hành vi")
    class InteractionWeight {
        @Test
        void weights() {
            assertEquals(2, UserPreferenceService.interactionWeight("click", null));
            assertEquals(1, UserPreferenceService.interactionWeight("view", null));
            assertEquals(0, UserPreferenceService.interactionWeight("view", 3));
            assertEquals(2, UserPreferenceService.interactionWeight("view", 10));
            assertEquals(5, UserPreferenceService.interactionWeight("view", 20));
            assertEquals(8, UserPreferenceService.interactionWeight("view", 60));
            assertEquals(6, UserPreferenceService.interactionWeight("add_to_cart", null));
            assertEquals(10, UserPreferenceService.interactionWeight("favorite", null));
            assertEquals(12, UserPreferenceService.interactionWeight("PURCHASE", null));
            assertEquals(0, UserPreferenceService.interactionWeight("search", null));
            assertEquals(0, UserPreferenceService.interactionWeight(null, null));
        }
    }

    // ===== 2. Độ tương đồng sản phẩm =====

    @Nested
    @DisplayName("Độ tương đồng sản phẩm")
    class Similarity {
        @Test
        void identicalAttributesScoreOne() {
            Category shirts = category(1, null, "male");
            Product a = product(1, shirts, 300_000);
            Product b = product(2, shirts, 300_000);
            double s = ProductSimilarityService.computeSimilarityScore(a, b,
                    Set.of("Đen"), Set.of("M"), Set.of("Đen"), Set.of("M"));
            assertEquals(1.0, s, 1e-9);
        }

        @Test
        void siblingCategoryScoresLessThanSameCategory() {
            Category tops = category(10, null, null);
            Category shirts = category(1, tops, "male");
            Category tees = category(2, tops, "male");
            Product a = product(1, shirts, 300_000);
            Product sameCat = product(2, shirts, 300_000);
            Product sibling = product(3, tees, 300_000);

            double same = ProductSimilarityService.computeSimilarityScore(a, sameCat, Set.of(), Set.of(), Set.of(), Set.of());
            double sib = ProductSimilarityService.computeSimilarityScore(a, sibling, Set.of(), Set.of(), Set.of(), Set.of());
            assertEquals(0.40 + 0.15 + 0.25, same, 1e-9);
            assertEquals(0.25 + 0.15 + 0.25, sib, 1e-9);
        }

        @Test
        void unrelatedProductsScoreLow() {
            Product a = product(1, category(1, null, "male"), 100_000);
            Product b = product(2, category(2, null, "female"), 1_000_000);
            double s = ProductSimilarityService.computeSimilarityScore(a, b,
                    Set.of("Đen"), Set.of("M"), Set.of("Trắng"), Set.of("XL"));
            // chỉ còn điểm giá: (1 - 0.9) * 0.25
            assertEquals(0.025, s, 1e-9);
        }

        @Test
        void jaccard() {
            assertEquals(0.5, ProductSimilarityService.jaccard(Set.of("S", "M"), Set.of("M")), 1e-9);
            assertEquals(0.0, ProductSimilarityService.jaccard(Set.of(), Set.of("M")), 1e-9);
        }
    }

    // ===== 3. Điểm phù hợp với sở thích =====

    @Nested
    @DisplayName("Điểm phù hợp với sở thích")
    class PreferenceScore {
        @Test
        void fullMatchOnTopCategory() {
            Category shirts = category(1, null, null);
            Product p = product(1, shirts, 300_000);
            UserPreferenceDTO pref = UserPreferenceDTO.builder()
                    .preferredCategoryIds(List.of(1, 2))
                    .preferredPriceMin(BigDecimal.valueOf(200_000))
                    .preferredPriceMax(BigDecimal.valueOf(400_000))
                    .preferredColors(List.of("Đen"))
                    .preferredSizes(List.of("M"))
                    .build();
            assertEquals(50 + 25 + 15 + 10, RecommendationService.scoreProduct(p, Set.of("Đen"), Set.of("M"), pref), 1e-9);
        }

        @Test
        void secondCategoryAndNearPrice() {
            Product p = product(1, category(2, null, null), 450_000); // vượt max 12.5% -> 15đ
            UserPreferenceDTO pref = UserPreferenceDTO.builder()
                    .preferredCategoryIds(List.of(1, 2))
                    .preferredPriceMin(BigDecimal.valueOf(200_000))
                    .preferredPriceMax(BigDecimal.valueOf(400_000))
                    .build();
            assertEquals(40 + 15, RecommendationService.scoreProduct(p, Set.of(), Set.of(), pref), 1e-9);
        }
    }

    // ===== 4. Tổng hợp sở thích từ hành vi =====

    @Nested
    @ExtendWith(MockitoExtension.class)
    @DisplayName("Tổng hợp sở thích")
    class Aggregate {
        @Mock UserBehaviorLogRepository logRepo;
        @Mock CategoryRepository categoryRepo;
        @Mock ProductVariantRepository variantRepo;
        @InjectMocks UserPreferenceService service;

        @Test
        void ranksCategoriesByWeightAndIgnoresQuickViews() {
            Category shirts = category(1, null, null);
            Category jeans = category(2, null, null);
            Category hats = category(3, null, null);
            Product shirt = product(1, shirts, 300_000);
            Product jean = product(2, jeans, 500_000);
            Product hat = product(3, hats, 100_000);

            when(variantRepo.findByProductIdIn(anyCollection())).thenReturn(List.of(
                    variant(shirt, "Đen", "M", 5), variant(shirt, "Đen", "L", 5),
                    variant(jean, "Xanh", "32", 5)));
            when(categoryRepo.findAllById(anyIterable())).thenReturn(List.of(shirts, jeans));

            UserPreferenceDTO pref = service.aggregate(List.of(
                    log(jean, "click", null),        // 2
                    log(shirt, "favorite", null),    // 10
                    log(hat, "view", 2)));           // 0 -> bỏ qua

            assertEquals(List.of(1, 2), pref.getPreferredCategoryIds());
            assertEquals(List.of("Cat 1", "Cat 2"), pref.getPreferredCategoryNames());
            assertEquals("Đen", pref.getPreferredColors().get(0));
            assertEquals(0, BigDecimal.valueOf(300_000).compareTo(pref.getPreferredPriceMin()));
            assertEquals(0, BigDecimal.valueOf(500_000).compareTo(pref.getPreferredPriceMax()));
        }

        @Test
        void returnsNullWhenNoMeaningfulBehavior() {
            Product hat = product(3, category(3, null, null), 100_000);
            when(variantRepo.findByProductIdIn(anyCollection())).thenReturn(List.of());
            assertNull(service.aggregate(List.of(log(hat, "view", 1))));
            assertNull(service.aggregate(List.of()));
        }
    }

    // ===== 5. Luồng gợi ý "Dành cho bạn" =====

    @Nested
    @ExtendWith(MockitoExtension.class)
    @DisplayName("Gợi ý dành cho bạn")
    class Personalized {
        @Mock ProductRepository productRepo;
        @Mock ProductVariantRepository variantRepo;
        @Mock OrderItemRepository orderItemRepo;
        @Mock UserPreferenceService preferenceService;
        @Mock CustomerProductService customerProductService;
        @Mock UserBehaviorLogRepository logRepo;
        @Mock UserPreferenceRepository preferenceRepo;
        @Mock RecommendationRepository recommendationRepo;
        @InjectMocks RecommendationService service;

        @Test
        void fallsBackToColdStartWithoutBehavior() {
            Product best = product(9, category(1, null, null), 100_000);
            when(preferenceService.getPreferences(null, "sess")).thenReturn(null);
            when(customerProductService.getBestsellers(anyInt())).thenReturn(List.of(dto(best)));
            when(customerProductService.getNewProducts(anyInt())).thenReturn(List.of());

            RecommendationResponseDTO res = service.getPersonalizedRecommendations(null, "sess", 4);

            assertEquals("cold_start", res.getSource());
            assertEquals(List.of(9), ids(res));
        }

        @Test
        void excludesPurchasedAndOutOfStockThenTopsUp() {
            Category shirts = category(1, null, null);
            Product bought = product(1, shirts, 300_000);
            Product soldOut = product(2, shirts, 300_000);
            Product good = product(3, shirts, 300_000);
            Product best = product(9, category(5, null, null), 100_000);

            UserPreferenceDTO pref = UserPreferenceDTO.builder()
                    .preferredCategoryIds(List.of(1))
                    .preferredCategoryNames(List.of("Áo sơ mi"))
                    .build();
            when(preferenceService.getPreferences(7, null)).thenReturn(pref);
            when(orderItemRepo.findPurchasedProductIdsByUserId(7)).thenReturn(List.of(1));
            when(productRepo.findActiveByCategoryIds(List.of(1))).thenReturn(List.of(bought, soldOut, good));
            when(variantRepo.findByCategoryIdIn(List.of(1))).thenReturn(List.of(
                    variant(bought, "Đen", "M", 5), variant(soldOut, "Đen", "M", 0), variant(good, "Đen", "M", 3)));
            when(customerProductService.mapToDTO(good, false)).thenReturn(dto(good));
            when(customerProductService.getBestsellers(anyInt())).thenReturn(List.of(dto(bought), dto(best)));
            when(customerProductService.getNewProducts(anyInt())).thenReturn(List.of(dto(good)));

            RecommendationResponseDTO res = service.getPersonalizedRecommendations(7, null, 3);

            assertEquals("personalized", res.getSource());
            assertEquals(List.of("Áo sơ mi"), res.getBasedOnCategories());
            // good (cá nhân hoá) + best (bù từ cold-start); bought & soldOut bị loại, good không lặp lại
            assertEquals(List.of(3, 9), ids(res));
        }

        private List<Integer> ids(RecommendationResponseDTO res) {
            return res.getProducts().stream().map(CustomerProductDTO::getProductId).collect(Collectors.toList());
        }
    }
}
