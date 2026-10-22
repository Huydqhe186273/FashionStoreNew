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

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductSimilarityService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductSimilarityRepository productSimilarityRepository;
    private final CustomerProductService customerProductService;

    /**
     * Retrieves similar products for a given product.
     * Uses the precomputed ProductSimilarity table, with dynamic fallback.
     */
    @Transactional(readOnly = true)
    public List<CustomerProductDTO> getSimilarProducts(Integer productId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 20));
        if (productId == null) return Collections.emptyList();

        Product currentProduct = productRepository.findById(productId).orElse(null);
        if (currentProduct == null) return Collections.emptyList();

        List<ProductSimilarity> precomputed = productSimilarityRepository.findTopSimilar(productId);
        List<CustomerProductDTO> result = new ArrayList<>();
        Set<Integer> includedIds = new HashSet<>();
        includedIds.add(productId);

        for (ProductSimilarity sim : precomputed) {
            Product other = sim.getProductB();
            if (other != null && "active".equalsIgnoreCase(other.getStatus())
                    && !Boolean.TRUE.equals(other.getIsTest())
                    && !includedIds.contains(other.getProductId())) {
                result.add(customerProductService.mapToDTO(other, false));
                includedIds.add(other.getProductId());
                if (result.size() >= safeLimit) {
                    return result;
                }
            }
        }

        // Fallback: If not enough precomputed similarities, calculate dynamically on-the-fly
        if (result.size() < safeLimit) {
            List<Product> candidates = productRepository.findAll().stream()
                    .filter(p -> !p.getProductId().equals(productId))
                    .filter(p -> "active".equalsIgnoreCase(p.getStatus()))
                    .filter(p -> !Boolean.TRUE.equals(p.getIsTest()))
                    .filter(p -> !includedIds.contains(p.getProductId()))
                    .collect(Collectors.toList());

            List<ProductVariant> currentVariants = productVariantRepository.findByProductId(productId);
            Set<String> currentColors = currentVariants.stream().map(ProductVariant::getColor).filter(Objects::nonNull).collect(Collectors.toSet());
            Set<String> currentSizes = currentVariants.stream().map(ProductVariant::getSize).filter(Objects::nonNull).collect(Collectors.toSet());

            List<ScoredProduct> scored = new ArrayList<>();
            for (Product candidate : candidates) {
                List<ProductVariant> candidateVariants = productVariantRepository.findByProductId(candidate.getProductId());
                Set<String> candidateColors = candidateVariants.stream().map(ProductVariant::getColor).filter(Objects::nonNull).collect(Collectors.toSet());
                Set<String> candidateSizes = candidateVariants.stream().map(ProductVariant::getSize).filter(Objects::nonNull).collect(Collectors.toSet());

                double score = computeSimilarityScore(currentProduct, candidate, currentColors, currentSizes, candidateColors, candidateSizes);
                scored.add(new ScoredProduct(candidate, score));
            }

            scored.sort((a, b) -> Double.compare(b.score, a.score));

            for (ScoredProduct sp : scored) {
                result.add(customerProductService.mapToDTO(sp.product, false));
                includedIds.add(sp.product.getProductId());
                if (result.size() >= safeLimit) break;
            }
        }

        return result;
    }

    /**
     * Batch job or trigger to precompute similarities across all active catalog products.
     */
    @Transactional
    public int computeAndStoreSimilarities() {
        List<Product> products = productRepository.findAll().stream()
                .filter(p -> "active".equalsIgnoreCase(p.getStatus()))
                .filter(p -> !Boolean.TRUE.equals(p.getIsTest()))
                .collect(Collectors.toList());

        if (products.size() < 2) return 0;

        // Preload variants for efficiency
        Map<Integer, Set<String>> colorsMap = new HashMap<>();
        Map<Integer, Set<String>> sizesMap = new HashMap<>();
        for (Product p : products) {
            List<ProductVariant> variants = productVariantRepository.findByProductId(p.getProductId());
            colorsMap.put(p.getProductId(), variants.stream().map(ProductVariant::getColor).filter(Objects::nonNull).collect(Collectors.toSet()));
            sizesMap.put(p.getProductId(), variants.stream().map(ProductVariant::getSize).filter(Objects::nonNull).collect(Collectors.toSet()));
        }

        int totalSaved = 0;
        LocalDateTime now = LocalDateTime.now();

        for (Product a : products) {
            List<ScoredProduct> scoredOthers = new ArrayList<>();
            for (Product b : products) {
                if (a.getProductId().equals(b.getProductId())) continue;

                double score = computeSimilarityScore(
                        a, b,
                        colorsMap.get(a.getProductId()), sizesMap.get(a.getProductId()),
                        colorsMap.get(b.getProductId()), sizesMap.get(b.getProductId())
                );
                scoredOthers.add(new ScoredProduct(b, score));
            }

            // Keep top 10 most similar products
            scoredOthers.sort((x, y) -> Double.compare(y.score, x.score));
            List<ScoredProduct> topSimilar = scoredOthers.stream().limit(10).collect(Collectors.toList());

            for (ScoredProduct sp : topSimilar) {
                ProductSimilarity.ProductSimilarityId id = new ProductSimilarity.ProductSimilarityId();
                id.setProductIdA(a.getProductId());
                id.setProductIdB(sp.product.getProductId());

                ProductSimilarity entity = new ProductSimilarity();
                entity.setId(id);
                entity.setProductA(a);
                entity.setProductB(sp.product);
                entity.setSimilarityScore(BigDecimal.valueOf(sp.score).setScale(4, RoundingMode.HALF_UP));
                entity.setUpdatedAt(now);

                productSimilarityRepository.save(entity);
                totalSaved++;
            }
        }

        log.info("Finished computing product similarity. Saved {} similarity relations.", totalSaved);
        return totalSaved;
    }

    private double computeSimilarityScore(Product a, Product b,
                                          Set<String> colorsA, Set<String> sizesA,
                                          Set<String> colorsB, Set<String> sizesB) {
        double score = 0.0;

        // 1. Category match (Weight 0.40)
        Category catA = a.getCategory();
        Category catB = b.getCategory();
        if (catA != null && catB != null) {
            if (Objects.equals(catA.getCategoryId(), catB.getCategoryId())) {
                score += 0.40;
            } else if (catA.getParent() != null && catB.getParent() != null
                    && Objects.equals(catA.getParent().getCategoryId(), catB.getParent().getCategoryId())) {
                score += 0.25;
            }

            // Gender match (Weight 0.15)
            if (catA.getGender() != null && catB.getGender() != null
                    && catA.getGender().equalsIgnoreCase(catB.getGender())) {
                score += 0.15;
            }
        }

        // 2. Price proximity (Weight 0.25)
        BigDecimal priceA = getEffectivePrice(a);
        BigDecimal priceB = getEffectivePrice(b);
        if (priceA.compareTo(BigDecimal.ZERO) > 0 && priceB.compareTo(BigDecimal.ZERO) > 0) {
            double pA = priceA.doubleValue();
            double pB = priceB.doubleValue();
            double maxP = Math.max(pA, pB);
            double diffRatio = Math.abs(pA - pB) / maxP;
            double priceSim = Math.max(0.0, 1.0 - diffRatio);
            score += priceSim * 0.25;
        }

        // 3. Variant Colors Jaccard similarity (Weight 0.10)
        score += jaccardSimilarity(colorsA, colorsB) * 0.10;

        // 4. Variant Sizes Jaccard similarity (Weight 0.10)
        score += jaccardSimilarity(sizesA, sizesB) * 0.10;

        return Math.min(1.0, Math.max(0.0, score));
    }

    private BigDecimal getEffectivePrice(Product p) {
        if (p.getDiscountPrice() != null && p.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0) {
            return p.getDiscountPrice();
        }
        return p.getBasePrice() != null ? p.getBasePrice() : BigDecimal.ZERO;
    }

    private double jaccardSimilarity(Set<String> setA, Set<String> setB) {
        if (setA == null || setB == null || setA.isEmpty() || setB.isEmpty()) return 0.0;
        Set<String> intersection = new HashSet<>(setA);
        intersection.retainAll(setB);
        Set<String> union = new HashSet<>(setA);
        union.addAll(setB);
        return (double) intersection.size() / union.size();
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
