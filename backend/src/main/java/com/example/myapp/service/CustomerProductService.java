package com.example.myapp.service;

import com.example.myapp.entity.Category;
import com.example.myapp.entity.Product;
import com.example.myapp.entity.ProductImage;
import com.example.myapp.entity.ProductVariant;
import com.example.myapp.model.CustomerCategoryDTO;
import com.example.myapp.model.CustomerProductDTO;
import com.example.myapp.model.DiscountBucketDTO;
import com.example.myapp.model.FacetOptionDTO;
import com.example.myapp.model.FilterFacetsDTO;
import com.example.myapp.model.PageResponseDTO;
import com.example.myapp.model.PopularityBucketDTO;
import com.example.myapp.model.PriceBucketDTO;
import com.example.myapp.model.VariantInfoDTO;
import com.example.myapp.repos.CategoryRepository;
import com.example.myapp.repos.ProductImageRepository;
import com.example.myapp.repos.ProductRepository;
import com.example.myapp.repos.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;

    /**
     * Catalog query. Every parameter is optional; null/blank means
     * "do not filter on this field". The pipeline is a stream of
     * small predicates — each new smart filter is one more line
     * here plus a corresponding @RequestParam on the controller.
     *
     * The "quality" filters (hasImage, hasDescription, hasDiscount,
     * minDiscountPercent, minSoldCount, minViewCount, minSizeCount,
     * minColorCount) feed the smart sidebar chips and are computed
     * lazily per product so adding a new flag is cheap.
     */
    @Transactional(readOnly = true)
    public PageResponseDTO<CustomerProductDTO> getProducts(
            String keyword,
            Integer categoryId,
            String gender,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String color,
            String variantSize,
            Boolean inStockOnly,
            Boolean hasImage,
            Boolean hasDescription,
            Boolean hasDiscount,
            Integer minDiscountPercent,
            Integer minSoldCount,
            Integer minViewCount,
            Integer minSizeCount,
            Integer minColorCount,
            String sortBy,
            String sortDir,
            int page,
            int pageSize) {

        List<Product> all = productRepository.findAll().stream()
                .filter(p -> !Boolean.TRUE.equals(p.getIsTest()))
                .collect(Collectors.toList());

        List<Product> filtered = all.stream()
                .filter(p -> "active".equalsIgnoreCase(p.getStatus()))
                .filter(p -> keyword == null || keyword.isBlank()
                        || (p.getName() != null && p.getName().toLowerCase().contains(keyword.toLowerCase()))
                        || (p.getDescription() != null && p.getDescription().toLowerCase().contains(keyword.toLowerCase())))
                .filter(p -> categoryId == null
                        || (p.getCategory() != null && Objects.equals(p.getCategory().getCategoryId(), categoryId)))
                .filter(p -> {
                    if (gender == null || gender.isBlank()) return true;
                    if (p.getCategory() == null) return false;
                    return gender.equalsIgnoreCase(p.getCategory().getGender());
                })
                .filter(p -> {
                    if (minPrice == null && maxPrice == null) return true;
                    BigDecimal price = p.getDiscountPrice() != null ? p.getDiscountPrice() : p.getBasePrice();
                    if (price == null) return false;
                    if (minPrice != null && price.compareTo(minPrice) < 0) return false;
                    if (maxPrice != null && price.compareTo(maxPrice) > 0) return false;
                    return true;
                })
                .filter(p -> {
                    if (color == null || color.isBlank()) return true;
                    return productVariantRepository.findByProductId(p.getProductId()).stream()
                            .anyMatch(v -> color.equalsIgnoreCase(v.getColor()));
                })
                .filter(p -> {
                    if (variantSize == null || variantSize.isBlank()) return true;
                    return productVariantRepository.findByProductId(p.getProductId()).stream()
                            .anyMatch(v -> variantSize.equalsIgnoreCase(v.getSize()));
                })
                .filter(p -> {
                    if (Boolean.TRUE.equals(inStockOnly)) {
                        return productVariantRepository.findByProductId(p.getProductId()).stream()
                                .anyMatch(v -> v.getStockQuantity() != null && v.getStockQuantity() > 0);
                    }
                    return true;
                })
                // ===== Smart quality filters =====
                .filter(p -> !Boolean.TRUE.equals(hasImage)
                        || productImageRepository.findByProductId(p.getProductId()).stream()
                                .anyMatch(img -> img.getImageUrl() != null && !img.getImageUrl().isBlank()))
                .filter(p -> !Boolean.TRUE.equals(hasDescription)
                        || (p.getDescription() != null && !p.getDescription().isBlank()))
                .filter(p -> !Boolean.TRUE.equals(hasDiscount)
                        || (p.getDiscountPrice() != null && p.getBasePrice() != null
                            && p.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0
                            && p.getDiscountPrice().compareTo(p.getBasePrice()) < 0))
                .filter(p -> {
                    if (minDiscountPercent == null) return true;
                    Integer pct = computeDiscountPercent(p);
                    return pct != null && pct >= minDiscountPercent;
                })
                .filter(p -> minSoldCount == null
                        || (p.getSoldCount() != null && p.getSoldCount() >= minSoldCount))
                .filter(p -> minViewCount == null
                        || (p.getViewCount() != null && p.getViewCount() >= minViewCount))
                .filter(p -> minSizeCount == null
                        || distinctVariantValues(p, ProductVariant::getSize).size() >= minSizeCount)
                .filter(p -> minColorCount == null
                        || distinctVariantValues(p, ProductVariant::getColor).size() >= minColorCount)
                .sorted(buildComparator(sortBy, sortDir))
                .collect(Collectors.toList());

        int totalElements = filtered.size();
        int totalPages = (int) Math.ceil((double) totalElements / pageSize);
        int from = Math.min(page * pageSize, totalElements);
        int to = Math.min(from + pageSize, totalElements);

        List<CustomerProductDTO> content = new ArrayList<>();
        if (from < to) {
            for (Product p : filtered.subList(from, to)) {
                content.add(mapToDTO(p, false));
            }
        }

        return PageResponseDTO.<CustomerProductDTO>builder()
                .content(content)
                .page(page)
                .size(pageSize)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .first(page == 0)
                .last(page >= totalPages - 1)
                .build();
    }

    @Transactional(readOnly = true)
    public CustomerProductDTO getProductDetail(Integer productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + productId));
        if (!"active".equalsIgnoreCase(product.getStatus())) {
            throw new RuntimeException("Sản phẩm hiện không khả dụng");
        }
        return mapToDTO(product, true);
    }

    @Transactional(readOnly = true)
    public PageResponseDTO<CustomerProductDTO> searchProducts(
            String keyword,
            Integer categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String color,
            String variantSize,
            String sortBy,
            String sortDir,
            int page,
            int size) {
        // All smart filters default to null = "don't apply"
        return getProducts(keyword, categoryId, null, minPrice, maxPrice, color, variantSize,
                null, null, null, null, null, null, null, null, null,
                sortBy, sortDir, page, size);
    }

    @Transactional(readOnly = true)
    public PageResponseDTO<CustomerProductDTO> getProductsByCategory(
            Integer categoryId,
            String sortBy,
            String sortDir,
            int page,
            int size) {
        return getProducts(null, categoryId, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null,
                sortBy, sortDir, page, size);
    }

    @Transactional(readOnly = true)
    public List<CustomerCategoryDTO> getAllCategories(String gender) {
        List<Category> all = categoryRepository.findAll().stream()
                .filter(c -> gender == null || gender.isBlank()
                        || (c.getGender() != null && gender.equalsIgnoreCase(c.getGender())))
                .sorted(Comparator.comparing(Category::getCategoryId, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        Map<Integer, CustomerCategoryDTO> dtoMap = all.stream().collect(Collectors.toMap(
                Category::getCategoryId,
                this::toCategoryDTO,
                (a, b) -> a
        ));

        List<CustomerCategoryDTO> roots = new ArrayList<>();
        for (Category c : all) {
            CustomerCategoryDTO dto = dtoMap.get(c.getCategoryId());
            if (c.getParent() == null) {
                roots.add(dto);
            } else {
                CustomerCategoryDTO parentDto = dtoMap.get(c.getParent().getCategoryId());
                if (parentDto != null) {
                    if (parentDto.getChildren() == null) parentDto.setChildren(new ArrayList<>());
                    parentDto.getChildren().add(dto);
                } else {
                    roots.add(dto);
                }
            }
        }
        return roots;
    }

    @Transactional(readOnly = true)
    public CustomerCategoryDTO getCategoryById(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục ID: " + id));
        return toCategoryDTO(category);
    }

    /**
     * Compute aggregated facets (sizes, colors, genders, price buckets,
     * discount buckets, popularity buckets, quality counts) for the
     * customer filter sidebar.
     *
     * The quality / "smart" facets are computed against the entire
     * active-product set so the sidebar can show "Sản phẩm có hình
     * ảnh (123)" instead of just blank checkboxes.
     */
    @Transactional(readOnly = true)
    public FilterFacetsDTO getFilterFacets() {
        List<Product> activeProducts = productRepository.findAll().stream()
                .filter(p -> !Boolean.TRUE.equals(p.getIsTest()))
                .filter(p -> "active".equalsIgnoreCase(p.getStatus()))
                .collect(Collectors.toList());

        // --- size / color / gender histograms (unchanged from before)
        Map<String, Long> sizeCounts = new LinkedHashMap<>();
        Map<String, Long> colorCounts = new LinkedHashMap<>();
        Map<String, Long> genderCounts = new LinkedHashMap<>();

        Map<Integer, Set<String>> sizesByProduct = new HashMap<>();
        Map<Integer, Set<String>> colorsByProduct = new HashMap<>();

        for (Product p : activeProducts) {
            Integer pid = p.getProductId();
            List<ProductVariant> variants = productVariantRepository.findByProductId(pid);
            for (ProductVariant v : variants) {
                if (v.getSize() != null && !v.getSize().isBlank()) {
                    sizesByProduct.computeIfAbsent(pid, k -> new HashSet<>()).add(v.getSize());
                }
                if (v.getColor() != null && !v.getColor().isBlank()) {
                    colorsByProduct.computeIfAbsent(pid, k -> new HashSet<>()).add(v.getColor());
                }
            }
        }

        sizesByProduct.values().forEach(set ->
                set.forEach(s -> sizeCounts.merge(s, 1L, Long::sum)));
        colorsByProduct.values().forEach(set ->
                set.forEach(c -> colorCounts.merge(c, 1L, Long::sum)));

        for (Product p : activeProducts) {
            if (p.getCategory() != null && p.getCategory().getGender() != null) {
                genderCounts.merge(p.getCategory().getGender(), 1L, Long::sum);
            }
        }

        List<FacetOptionDTO> sizeOptions = sizeCounts.entrySet().stream()
                .map(e -> FacetOptionDTO.builder()
                        .value(e.getKey())
                        .label(e.getKey())
                        .count(e.getValue())
                        .build())
                .sorted(Comparator.comparingInt(this::sizeOrder).thenComparing(FacetOptionDTO::getValue))
                .collect(Collectors.toList());

        List<FacetOptionDTO> colorOptions = colorCounts.entrySet().stream()
                .map(e -> FacetOptionDTO.builder()
                        .value(e.getKey())
                        .label(e.getKey())
                        .count(e.getValue())
                        .hex(guessColorHex(e.getKey()))
                        .build())
                .sorted(Comparator.comparing(FacetOptionDTO::getLabel, Comparator.nullsLast(String::compareToIgnoreCase)))
                .collect(Collectors.toList());

        List<FacetOptionDTO> genderOptions = List.of(
                FacetOptionDTO.builder().value("nam").label("Nam").count(genderCounts.getOrDefault("nam", 0L)).build(),
                FacetOptionDTO.builder().value("nu").label("Nữ").count(genderCounts.getOrDefault("nu", 0L)).build(),
                FacetOptionDTO.builder().value("unisex").label("Unisex").count(genderCounts.getOrDefault("unisex", 0L)).build()
        ).stream().filter(o -> o.getCount() > 0).collect(Collectors.toList());

        // --- price buckets (unchanged)
        BigDecimal minPrice = null, maxPrice = null;
        for (Product p : activeProducts) {
            BigDecimal price = p.getDiscountPrice() != null && p.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0
                    ? p.getDiscountPrice() : p.getBasePrice();
            if (price == null) continue;
            if (minPrice == null || price.compareTo(minPrice) < 0) minPrice = price;
            if (maxPrice == null || price.compareTo(maxPrice) > 0) maxPrice = price;
        }

        BigDecimal[][] bucketDefs = new BigDecimal[][]{
                { new BigDecimal("0"),       new BigDecimal("200000") },
                { new BigDecimal("200000"),  new BigDecimal("500000") },
                { new BigDecimal("500000"),  new BigDecimal("1000000") },
                { new BigDecimal("1000000"), new BigDecimal("2000000") },
                { new BigDecimal("2000000"), null }
        };
        String[] bucketLabels = new String[]{
                "Dưới 200k", "200k – 500k", "500k – 1tr", "1tr – 2tr", "Trên 2tr"
        };

        List<PriceBucketDTO> buckets = new ArrayList<>();
        for (int i = 0; i < bucketDefs.length; i++) {
            BigDecimal lo = bucketDefs[i][0];
            BigDecimal hi = bucketDefs[i][1];
            long count = activeProducts.stream()
                    .map(this::priceOf)
                    .filter(Objects::nonNull)
                    .filter(p -> p.compareTo(lo) >= 0 && (hi == null || p.compareTo(hi) < 0))
                    .count();
            buckets.add(PriceBucketDTO.builder()
                    .label(bucketLabels[i])
                    .minPrice(lo)
                    .maxPrice(hi != null ? hi : maxPrice)
                    .count(count)
                    .build());
        }

        // ===== Smart quality facets =====
        long complete = 0, inStock = 0;
        for (Product p : activeProducts) {
            boolean hasImg = productImageRepository.findByProductId(p.getProductId()).stream()
                    .anyMatch(img -> img.getImageUrl() != null && !img.getImageUrl().isBlank());
            boolean hasDesc = p.getDescription() != null && !p.getDescription().isBlank();
            List<ProductVariant> variants = productVariantRepository.findByProductId(p.getProductId());
            int sizeN = (int) variants.stream()
                    .map(ProductVariant::getSize)
                    .filter(s -> s != null && !s.isBlank())
                    .distinct().count();
            boolean stock = variants.stream()
                    .anyMatch(v -> v.getStockQuantity() != null && v.getStockQuantity() > 0);

            if (hasImg && hasDesc && sizeN >= 1) complete++;
            if (stock) inStock++;
        }

        // --- discount-percent buckets (≥10, ≥30, ≥50, ≥70)
        int[] thresholds = { 10, 30, 50, 70 };
        String[] labels = { "Giảm ≥ 10%", "Giảm ≥ 30%", "Giảm ≥ 50%", "Giảm ≥ 70%" };
        List<DiscountBucketDTO> discountBuckets = new ArrayList<>();
        for (int i = 0; i < thresholds.length; i++) {
            int t = thresholds[i];
            long cnt = activeProducts.stream()
                    .map(this::computeDiscountPercent)
                    .filter(Objects::nonNull)
                    .filter(pct -> pct >= t)
                    .count();
            discountBuckets.add(DiscountBucketDTO.builder()
                    .label(labels[i])
                    .minPercent(t)
                    .maxPercent(100)
                    .count(cnt)
                    .build());
        }

        // --- popularity buckets (sold-count thresholds)
        int[] soldThresholds = { 50, 100, 300 };
        String[] soldLabels = { "Bán chạy (≥50)", "Hot (≥100)", "Top (≥300)" };
        List<PopularityBucketDTO> popularityBuckets = new ArrayList<>();
        for (int i = 0; i < soldThresholds.length; i++) {
            int t = soldThresholds[i];
            long cnt = activeProducts.stream()
                    .filter(p -> p.getSoldCount() != null && p.getSoldCount() >= t)
                    .count();
            popularityBuckets.add(PopularityBucketDTO.builder()
                    .label(soldLabels[i])
                    .metric("sold")
                    .minCount(t)
                    .count(cnt)
                    .build());
        }

        return FilterFacetsDTO.builder()
                .sizes(sizeOptions)
                .colors(colorOptions)
                .genders(genderOptions)
                .minPrice(minPrice == null ? null : minPrice.longValue())
                .maxPrice(maxPrice == null ? null : maxPrice.longValue())
                .priceBuckets(buckets)
                // smart facets (v3 — only the two the sidebar actually uses):
                .productsComplete(complete)
                .productsInStock(inStock)
                .discountBuckets(discountBuckets)
                .popularityBuckets(popularityBuckets)
                .build();
    }

    /**
     * Custom sort key for size values. Clothing sizes follow the well-known
     * ordering XS → 3XL; numeric shoe sizes sort numerically; anything
     * unrecognized (free size, "One Size") sinks to the end alphabetically.
     */
    private int sizeOrder(FacetOptionDTO o) {
        String s = o.getValue();
        if (s == null) return 9999;
        switch (s.trim().toUpperCase()) {
            case "XS":   return 0;
            case "S":    return 1;
            case "M":    return 2;
            case "L":    return 3;
            case "XL":   return 4;
            case "XXL":  return 5;
            case "3XL":  return 6;
            case "FREE":
            case "ONE SIZE":
            case "MINI":  return 100;
        }
        try { return 1000 + Integer.parseInt(s.trim()); }
        catch (NumberFormatException ignored) { return 9000; }
    }

    /**
     * Best-effort hex color guess from the Vietnamese color label.
     */
    private String guessColorHex(String label) {
        if (label == null) return "#9ca3af";
        String key = label.toLowerCase();
        return switch (key) {
            case "đen"          -> "#111111";
            case "trắng"        -> "#f5f5f5";
            case "xám", "xám caro" -> "#9ca3af";
            case "đỏ"           -> "#dc2626";
            case "đỏ rượu vang" -> "#7f1d1d";
            case "xanh dương", "xanh navy", "xanh đậm" -> "#1e40af";
            case "xanh mint", "xanh rêu" -> "#10b981";
            case "xanh nhạt", "xanh hoa" -> "#93c5fd";
            case "xanh olive"   -> "#65a30d";
            case "be", "be hoa", "be sọc", "be caro" -> "#d6c19a";
            case "nâu", "nâu đất" -> "#92400e";
            case "hồng", "hồng hoa", "hồng pastel" -> "#f9a8d4";
            case "vàng"         -> "#fbbf24";
            case "bạc"          -> "#c0c0c0";
            case "caro đỏ"      -> "#b91c1c";
            case "caro xanh"    -> "#1d4ed8";
            case "trắng ngà"    -> "#faf3e7";
            case "nude"         -> "#e7c8a3";
            default -> "#9ca3af";
        };
    }

    @Transactional(readOnly = true)
    public List<VariantInfoDTO> getProductVariants(Integer productId) {
        return productVariantRepository.findByProductId(productId).stream()
                .map(this::toVariantInfo)
                .collect(Collectors.toList());
    }

    private CustomerCategoryDTO toCategoryDTO(Category c) {
        long productCount = c.getProducts() != null
                ? c.getProducts().stream()
                    .filter(p -> "active".equalsIgnoreCase(p.getStatus()))
                    .count()
                : 0L;
        return CustomerCategoryDTO.builder()
                .categoryId(c.getCategoryId())
                .name(c.getName())
                .gender(c.getGender())
                .season(c.getSeason())
                .parentId(c.getParent() != null ? c.getParent().getCategoryId() : null)
                .parentName(c.getParent() != null ? c.getParent().getName() : null)
                .productCount(productCount)
                .children(new ArrayList<>())
                .build();
    }

    private CustomerProductDTO mapToDTO(Product p, boolean includeVariants) {
        /* Always load variants for size/color facets — the list view
         * still wants to render "Size có sẵn" + swatches even when
         * it doesn't include the full variants array. The query is
         * cheap (one indexed lookup per product). */
        List<ProductVariant> variants = productVariantRepository.findByProductId(p.getProductId());

        List<String> images = new ArrayList<>();
        String primary = null;
        List<ProductImage> imgs = productImageRepository.findByProductId(p.getProductId());
        for (ProductImage img : imgs) {
            String url = img.getImageUrl();
            if (url == null) continue;
            // Skip placeholder / random-photo URLs that don't actually
            // match the product name. The frontend will synthesise a
            // name-aware SVG artwork instead — see productArtwork.js.
            // Tested against the demo seed which uses picsum.photos.
            if (isStockPhotoPlaceholder(url)) continue;
            images.add(url);
            if (Boolean.TRUE.equals(img.getIsPrimary())) primary = url;
        }
        if (primary == null && !images.isEmpty()) primary = images.get(0);

        int totalStock = variants.stream().mapToInt(v -> v.getStockQuantity() == null ? 0 : v.getStockQuantity()).sum();

        BigDecimal finalPrice = p.getDiscountPrice() != null && p.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0
                ? p.getDiscountPrice()
                : p.getBasePrice();

        Integer discountPercent = null;
        if (p.getDiscountPrice() != null && p.getBasePrice() != null
                && p.getBasePrice().compareTo(BigDecimal.ZERO) > 0
                && p.getDiscountPrice().compareTo(p.getBasePrice()) < 0) {
            BigDecimal diff = p.getBasePrice().subtract(p.getDiscountPrice());
            discountPercent = diff.multiply(BigDecimal.valueOf(100))
                    .divide(p.getBasePrice(), 0, RoundingMode.HALF_UP)
                    .intValue();
        }

        List<VariantInfoDTO> variantDTOs = includeVariants
                ? variants.stream().map(this::toVariantInfo).collect(Collectors.toList())
                : null;

        List<String> availableSizes = variants.stream()
                .map(ProductVariant::getSize).filter(Objects::nonNull).distinct().sorted().collect(Collectors.toList());
        List<String> availableColors = variants.stream()
                .map(ProductVariant::getColor).filter(Objects::nonNull).distinct().sorted().collect(Collectors.toList());

        return CustomerProductDTO.builder()
                .productId(p.getProductId())
                .name(p.getName())
                .description(p.getDescription())
                .basePrice(p.getBasePrice())
                .discountPrice(p.getDiscountPrice())
                .finalPrice(finalPrice)
                .discountPercent(discountPercent)
                .viewCount(p.getViewCount())
                .soldCount(p.getSoldCount())
                .totalStock(totalStock)
                .status(p.getStatus())
                .categoryId(p.getCategory() != null ? p.getCategory().getCategoryId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .categoryGender(p.getCategory() != null ? p.getCategory().getGender() : null)
                .categorySeason(p.getCategory() != null ? p.getCategory().getSeason() : null)
                .images(images)
                .primaryImage(primary)
                .variants(variantDTOs)
                .availableSizes(availableSizes)
                .availableColors(availableColors)
                .build();
    }

    private VariantInfoDTO toVariantInfo(ProductVariant v) {
        return VariantInfoDTO.builder()
                .variantId(v.getVariantId())
                .size(v.getSize())
                .color(v.getColor())
                .stockQuantity(v.getStockQuantity())
                .sku(v.getSku())
                .build();
    }

    private Comparator<Product> buildComparator(String sortBy, String sortDir) {
        String key = sortBy == null ? "" : sortBy.toLowerCase();
        // price_asc / price_desc encode the direction in their name;
        // newer / bestseller / discount don't — for those we still
        // honour sortDir (default "desc" set by the controller).
        boolean sortByHasDirection = key.equals("price_asc") || key.equals("price_desc");
        boolean descending = !sortByHasDirection
                && sortDir != null && sortDir.equalsIgnoreCase("desc");
        Comparator<Product> cmp;
        switch (key) {
            case "price_asc":
                cmp = Comparator.comparing((Product p) -> priceOf(p), Comparator.nullsLast(BigDecimal::compareTo));
                break;
            case "price_desc":
                cmp = Comparator.comparing((Product p) -> priceOf(p), Comparator.nullsLast(BigDecimal::compareTo)).reversed();
                break;
            case "bestseller":
                cmp = Comparator.comparing(Product::getSoldCount, Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "discount":
                cmp = Comparator.comparing(this::discountValue, Comparator.nullsLast(BigDecimal::compareTo));
                break;
            case "newest":
            default:
                cmp = Comparator.comparing(Product::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()));
                break;
        }
        return descending ? cmp.reversed() : cmp;
    }

    private BigDecimal priceOf(Product p) {
        return p.getDiscountPrice() != null && p.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0
                ? p.getDiscountPrice()
                : p.getBasePrice();
    }

    private BigDecimal discountValue(Product p) {
        if (p.getBasePrice() == null || p.getDiscountPrice() == null) return BigDecimal.ZERO;
        if (p.getBasePrice().compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return p.getBasePrice().subtract(p.getDiscountPrice());
    }

    /**
     * Returns the integer percent discount (rounded half-up) of a
     * product, or null if the product isn't on sale.
     */
    private Integer computeDiscountPercent(Product p) {
        if (p.getBasePrice() == null || p.getDiscountPrice() == null) return null;
        if (p.getBasePrice().compareTo(BigDecimal.ZERO) <= 0) return null;
        if (p.getDiscountPrice().compareTo(p.getBasePrice()) >= 0) return null;
        return p.getBasePrice().subtract(p.getDiscountPrice())
                .multiply(BigDecimal.valueOf(100))
                .divide(p.getBasePrice(), 0, RoundingMode.HALF_UP)
                .intValue();
    }

    /**
     * True when the URL points at a stock-photo service whose image
     * content is independent of the product name. We treat those as
     * placeholders and the frontend synthesises a name-aware SVG
     * artwork instead (see utils/productArtwork.js).
     *
     * Recognised hosts: picsum.photos, source.unsplash.com (deprecated
     * mid-2024), images.unsplash.com, plus /placeholders/ paths.
     */
    private static boolean isStockPhotoPlaceholder(String url) {
        if (url == null) return true;
        String u = url.toLowerCase();
        return u.contains("picsum.photos")
                || u.contains("source.unsplash.com")
                || u.contains("images.unsplash.com")
                || u.contains("/placeholder")
                || u.endsWith("/no-image")
                || u.endsWith("/no-image.png")
                || u.endsWith("/no-image.jpg");
    }

    /** Returns distinct non-blank values of a variant field for the given product. */
    private Set<String> distinctVariantValues(Product p,
            java.util.function.Function<ProductVariant, String> extractor) {
        Set<String> out = new HashSet<>();
        for (ProductVariant v : productVariantRepository.findByProductId(p.getProductId())) {
            String s = extractor.apply(v);
            if (s != null && !s.isBlank()) out.add(s);
        }
        return out;
    }

    // ===== Recommendation lists =====

    @Transactional(readOnly = true)
    public List<CustomerProductDTO> getNewProducts(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        return productRepository.findAll().stream()
                .filter(p -> !Boolean.TRUE.equals(p.getIsTest()))
                .filter(p -> "active".equalsIgnoreCase(p.getStatus()))
                .sorted(Comparator.comparing(Product::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(safeLimit)
                .map(p -> mapToDTO(p, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CustomerProductDTO> getBestsellers(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        return productRepository.findAll().stream()
                .filter(p -> !Boolean.TRUE.equals(p.getIsTest()))
                .filter(p -> "active".equalsIgnoreCase(p.getStatus()))
                .sorted(Comparator.comparing(Product::getSoldCount, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(safeLimit)
                .map(p -> mapToDTO(p, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CustomerProductDTO> getDiscountedProducts(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        return productRepository.findAll().stream()
                .filter(p -> !Boolean.TRUE.equals(p.getIsTest()))
                .filter(p -> "active".equalsIgnoreCase(p.getStatus()))
                .filter(p -> p.getDiscountPrice() != null && p.getBasePrice() != null
                        && p.getDiscountPrice().compareTo(p.getBasePrice()) < 0)
                .sorted(Comparator.comparing(this::discountValue, Comparator.nullsLast(BigDecimal::compareTo)).reversed())
                .limit(safeLimit)
                .map(p -> mapToDTO(p, false))
                .collect(Collectors.toList());
    }
}
