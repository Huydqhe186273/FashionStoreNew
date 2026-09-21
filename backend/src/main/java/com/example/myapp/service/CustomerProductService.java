package com.example.myapp.service;

import com.example.myapp.entity.Category;
import com.example.myapp.entity.Product;
import com.example.myapp.entity.ProductImage;
import com.example.myapp.entity.ProductVariant;
import com.example.myapp.model.CustomerCategoryDTO;
import com.example.myapp.model.CustomerProductDTO;
import com.example.myapp.model.PageResponseDTO;
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
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public PageResponseDTO<CustomerProductDTO> getProducts(
            String keyword,
            Integer categoryId,
            String gender,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String color,
            String variantSize,
            String sortBy,
            String sortDir,
            int page,
            int pageSize) {

        List<Product> all = productRepository.findAll();

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
                    return productVariantRepository.findByProduct_ProductId(p.getProductId()).stream()
                            .anyMatch(v -> color.equalsIgnoreCase(v.getColor()));
                })
                .filter(p -> {
                    if (variantSize == null || variantSize.isBlank()) return true;
                    return productVariantRepository.findByProduct_ProductId(p.getProductId()).stream()
                            .anyMatch(v -> variantSize.equalsIgnoreCase(v.getSize()));
                })
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
    public PageResponseDTO<CustomerProductDTO> searchProducts(String keyword, int page, int size) {
        return getProducts(keyword, null, null, null, null, null, null, "newest", "desc", page, size);
    }

    @Transactional(readOnly = true)
    public PageResponseDTO<CustomerProductDTO> getProductsByCategory(Integer categoryId, int page, int size) {
        return getProducts(null, categoryId, null, null, null, null, null, "newest", "desc", page, size);
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

    @Transactional(readOnly = true)
    public List<VariantInfoDTO> getProductVariants(Integer productId) {
        return productVariantRepository.findByProduct_ProductId(productId).stream()
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
        List<ProductVariant> variants = includeVariants
                ? productVariantRepository.findByProduct_ProductId(p.getProductId())
                : List.of();

        List<String> images = new ArrayList<>();
        String primary = null;
        List<ProductImage> imgs = productImageRepository.findByProduct_ProductId(p.getProductId());
        for (ProductImage img : imgs) {
            if (img.getImageUrl() != null) images.add(img.getImageUrl());
            if (Boolean.TRUE.equals(img.getIsPrimary()) && img.getImageUrl() != null) {
                primary = img.getImageUrl();
            }
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
        boolean descending = sortDir != null && sortDir.equalsIgnoreCase("desc");
        Comparator<Product> cmp;
        switch (sortBy == null ? "" : sortBy.toLowerCase()) {
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
}
