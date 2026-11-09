package com.example.myapp.service;

import com.example.myapp.entity.Category;
import com.example.myapp.entity.Product;
import com.example.myapp.entity.ProductSimilarity;
import com.example.myapp.entity.ProductVariant;
import com.example.myapp.model.CustomerProductDTO;
import com.example.myapp.repos.ProductRepository;
import com.example.myapp.repos.ProductSimilarityRepository;
import com.example.myapp.repos.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * "Sản phẩm tương tự" (content-based).
 * Điểm tương đồng giữa 2 sản phẩm (0..1):
 * cùng danh mục 0.40 (hoặc cùng danh mục cha 0.25) + cùng giới tính 0.15
 * + giá gần nhau 0.25 + trùng màu 0.10 + trùng size 0.10.
 * Top 10 sản phẩm tương tự được tính sẵn vào bảng ProductSimilarity (mỗi đêm),
 * nếu thiếu thì tính trực tiếp khi gọi API.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductSimilarityService {

    static final int TOP_SIMILAR_STORED = 10;

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductSimilarityRepository productSimilarityRepository;
    private final CustomerProductService customerProductService;

    @Transactional(readOnly = true)
    public List<CustomerProductDTO> getSimilarProducts(Integer productId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 20));
        if (productId == null) return Collections.emptyList();

        Product current = productRepository.findById(productId).orElse(null);
        if (current == null) return Collections.emptyList();

        List<CustomerProductDTO> result = new ArrayList<>();
        Set<Integer> included = new HashSet<>();
        included.add(productId);

        // 1. Dùng kết quả đã tính sẵn
        for (ProductSimilarity sim : productSimilarityRepository.findTopSimilar(productId)) {
            if (result.size() >= safeLimit) return result;
            Product other = sim.getProductB();
            if (other == null || !isVisible(other) || included.contains(other.getProductId())) continue;
            addIfInStock(result, included, other);
        }
        if (result.size() >= safeLimit) return result;

        // 2. Thiếu thì tính trực tiếp
        Map<Integer, List<ProductVariant>> variantsByProduct = variantsOfActiveProducts();
        List<ProductVariant> currentVariants = variantsByProduct.containsKey(productId)
                ? variantsByProduct.get(productId)
                : productVariantRepository.findByProductId(productId);
        Set<String> currentColors = RecommendationService.colorsOf(currentVariants);
        Set<String> currentSizes = RecommendationService.sizesOf(currentVariants);

        List<Map.Entry<Product, Double>> candidates = new ArrayList<>();
        for (Product p : productRepository.findAllActive()) {
            if (included.contains(p.getProductId())) continue;
            List<ProductVariant> vs = variantsByProduct.getOrDefault(p.getProductId(), List.of());
            if (RecommendationService.totalStock(vs) <= 0) continue;
            double score = computeSimilarityScore(current, p, currentColors, currentSizes,
                    RecommendationService.colorsOf(vs), RecommendationService.sizesOf(vs));
            candidates.add(Map.entry(p, score));
        }
        candidates.sort(Map.Entry.<Product, Double>comparingByValue().reversed());

        for (Map.Entry<Product, Double> e : candidates) {
            if (result.size() >= safeLimit) break;
            addIfInStock(result, included, e.getKey());
        }
        return result;
    }

    /** Tính lại toàn bộ bảng ProductSimilarity (top 10 cho mỗi sản phẩm). */
    @Transactional
    public int computeAndStoreSimilarities() {
        List<Product> products = productRepository.findAllActive();
        productSimilarityRepository.deleteAllInBatch();
        if (products.size() < 2) return 0;

        Map<Integer, List<ProductVariant>> variantsByProduct = variantsOfActiveProducts();
        Map<Integer, Set<String>> colors = new HashMap<>();
        Map<Integer, Set<String>> sizes = new HashMap<>();
        for (Product p : products) {
            List<ProductVariant> vs = variantsByProduct.getOrDefault(p.getProductId(), List.of());
            colors.put(p.getProductId(), RecommendationService.colorsOf(vs));
            sizes.put(p.getProductId(), RecommendationService.sizesOf(vs));
        }

        LocalDateTime now = LocalDateTime.now();
        List<ProductSimilarity> rows = new ArrayList<>();

        for (Product a : products) {
            List<Map.Entry<Product, Double>> scored = new ArrayList<>();
            for (Product b : products) {
                if (a.getProductId().equals(b.getProductId())) continue;
                double score = computeSimilarityScore(a, b,
                        colors.get(a.getProductId()), sizes.get(a.getProductId()),
                        colors.get(b.getProductId()), sizes.get(b.getProductId()));
                scored.add(Map.entry(b, score));
            }
            scored.sort(Map.Entry.<Product, Double>comparingByValue().reversed());

            for (Map.Entry<Product, Double> e : scored.subList(0, Math.min(TOP_SIMILAR_STORED, scored.size()))) {
                ProductSimilarity.ProductSimilarityId id = new ProductSimilarity.ProductSimilarityId();
                id.setProductIdA(a.getProductId());
                id.setProductIdB(e.getKey().getProductId());

                ProductSimilarity row = new ProductSimilarity();
                row.setId(id);
                row.setProductA(a);
                row.setProductB(e.getKey());
                row.setSimilarityScore(BigDecimal.valueOf(e.getValue()).setScale(4, RoundingMode.HALF_UP));
                row.setUpdatedAt(now);
                rows.add(row);
            }
        }

        productSimilarityRepository.saveAll(rows);
        log.info("Computed product similarity: {} relations for {} products", rows.size(), products.size());
        return rows.size();
    }

    @Transactional(readOnly = true)
    public boolean hasPrecomputedData() {
        return productSimilarityRepository.count() > 0;
    }

    static double computeSimilarityScore(Product a, Product b,
                                         Set<String> colorsA, Set<String> sizesA,
                                         Set<String> colorsB, Set<String> sizesB) {
        double score = 0.0;

        Category catA = a.getCategory();
        Category catB = b.getCategory();
        if (catA != null && catB != null) {
            if (Objects.equals(catA.getCategoryId(), catB.getCategoryId())) {
                score += 0.40;
            } else if (catA.getParent() != null && catB.getParent() != null
                    && Objects.equals(catA.getParent().getCategoryId(), catB.getParent().getCategoryId())) {
                score += 0.25;
            }
            if (catA.getGender() != null && catA.getGender().equalsIgnoreCase(catB.getGender())) {
                score += 0.15;
            }
        }

        double pA = UserPreferenceService.effectivePrice(a).doubleValue();
        double pB = UserPreferenceService.effectivePrice(b).doubleValue();
        if (pA > 0 && pB > 0) {
            double diffRatio = Math.abs(pA - pB) / Math.max(pA, pB);
            score += Math.max(0.0, 1.0 - diffRatio) * 0.25;
        }

        score += jaccard(colorsA, colorsB) * 0.10;
        score += jaccard(sizesA, sizesB) * 0.10;

        return Math.min(1.0, Math.max(0.0, score));
    }

    static double jaccard(Set<String> a, Set<String> b) {
        if (a == null || b == null || a.isEmpty() || b.isEmpty()) return 0.0;
        Set<String> intersection = new HashSet<>(a);
        intersection.retainAll(b);
        Set<String> union = new HashSet<>(a);
        union.addAll(b);
        return (double) intersection.size() / union.size();
    }

    private Map<Integer, List<ProductVariant>> variantsOfActiveProducts() {
        return productVariantRepository.findAllOfActiveProducts().stream()
                .collect(Collectors.groupingBy(v -> v.getProduct().getProductId()));
    }

    private static boolean isVisible(Product p) {
        return "active".equalsIgnoreCase(p.getStatus()) && !Boolean.TRUE.equals(p.getIsTest());
    }

    private void addIfInStock(List<CustomerProductDTO> result, Set<Integer> included, Product p) {
        CustomerProductDTO dto = customerProductService.mapToDTO(p, false);
        included.add(p.getProductId());
        if (dto.getTotalStock() != null && dto.getTotalStock() > 0) {
            result.add(dto);
        }
    }
}
