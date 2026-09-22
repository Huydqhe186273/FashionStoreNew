package com.example.myapp.service;

import com.example.myapp.entity.Favorite;
import com.example.myapp.entity.Product;
import com.example.myapp.entity.User;
import com.example.myapp.model.CustomerProductDTO;
import com.example.myapp.repos.FavoriteRepository;
import com.example.myapp.repos.ProductRepository;
import com.example.myapp.repos.ProductVariantRepository;
import com.example.myapp.repos.ProductImageRepository;
import com.example.myapp.repos.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductImageRepository productImageRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CustomerProductDTO> listFavorites(Integer userId) {
        return favoriteRepository.findFavoritesByUserOrderByCreatedAtDesc(userId).stream()
                .map(Favorite::getProduct)
                .filter(Objects::nonNull)
                .filter(p -> "active".equalsIgnoreCase(p.getStatus()))
                .map(p -> toCustomerProductDTO(p, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean isFavorited(Integer userId, Integer productId) {
        if (userId == null || productId == null) return false;
        return favoriteRepository.existsFavoriteByUserAndProduct(userId, productId);
    }

    @Transactional
    public Favorite addFavorite(Integer userId, Integer productId) {
        if (userId == null || productId == null) {
            throw new IllegalArgumentException("userId và productId là bắt buộc");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng ID: " + userId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + productId));

        return favoriteRepository.findFavoriteByUserAndProduct(userId, productId)
                .orElseGet(() -> {
                    Favorite f = new Favorite();
                    f.setUser(user);
                    f.setProduct(product);
                    f.setCreatedAt(LocalDateTime.now());
                    return favoriteRepository.save(f);
                });
    }

    @Transactional
    public void removeFavorite(Integer userId, Integer productId) {
        favoriteRepository.deleteByUserAndProduct(userId, productId);
    }

    // ===== Lightweight mapper (mirror CustomerProductService.mapToDTO without variants) =====

    private CustomerProductDTO toCustomerProductDTO(Product p, boolean includeVariants) {
        var variants = includeVariants
                ? productVariantRepository.findByProductId(p.getProductId())
                : List.<com.example.myapp.entity.ProductVariant>of();

        var imgs = productImageRepository.findByProductId(p.getProductId());
        List<String> images = new ArrayList<>();
        String primary = null;
        for (var img : imgs) {
            if (img.getImageUrl() != null) images.add(img.getImageUrl());
            if (Boolean.TRUE.equals(img.getIsPrimary()) && img.getImageUrl() != null) {
                primary = img.getImageUrl();
            }
        }
        if (primary == null && !images.isEmpty()) primary = images.get(0);

        int totalStock = variants.stream()
                .mapToInt(v -> v.getStockQuantity() == null ? 0 : v.getStockQuantity())
                .sum();

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

        List<String> availableSizes = variants.stream()
                .map(com.example.myapp.entity.ProductVariant::getSize).filter(Objects::nonNull).distinct().sorted()
                .collect(Collectors.toList());
        List<String> availableColors = variants.stream()
                .map(com.example.myapp.entity.ProductVariant::getColor).filter(Objects::nonNull).distinct().sorted()
                .collect(Collectors.toList());

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
                .variants(null)
                .availableSizes(availableSizes)
                .availableColors(availableColors)
                .build();
    }
}
