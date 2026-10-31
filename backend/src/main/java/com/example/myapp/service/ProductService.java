package com.example.myapp.service;

import com.example.myapp.entity.Category;
import com.example.myapp.entity.Product;
import com.example.myapp.entity.ProductImage;
import com.example.myapp.entity.ProductVariant;
import com.example.myapp.model.CreateProductRequestDTO;
import com.example.myapp.model.ProductDTO;
import com.example.myapp.repos.CategoryRepository;
import com.example.myapp.repos.ProductImageRepository;
import com.example.myapp.repos.ProductRepository;
import com.example.myapp.repos.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductVariantRepository productVariantRepository;

    @Transactional(readOnly = true)
    // Lấy danh sách sản phẩm theo các điều kiện tìm kiếm tùy chọn.
    public List<ProductDTO> getProducts(String keyword, Integer categoryId, String status) {
        List<Product> products = productRepository.searchProducts(keyword, categoryId, status);
        return products.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    // Lấy chi tiết một sản phẩm theo ID; báo lỗi nếu không tìm thấy.
    public ProductDTO getProductById(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + id));
        return mapToDTO(product);
    }

    private void validateProduct(CreateProductRequestDTO dto, boolean isCreate) {
        if (isCreate || dto.getName() != null) {
            if (dto.getName() == null || dto.getName().trim().isEmpty()) {
                throw new IllegalArgumentException("Tên sản phẩm không được để trống!");
            }
            if (dto.getName().trim().length() > 255) {
                throw new IllegalArgumentException("Tên sản phẩm không được vượt quá 255 ký tự!");
            }
        }

        if (isCreate || dto.getBasePrice() != null) {
            if (dto.getBasePrice() == null || dto.getBasePrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Giá bán gốc của sản phẩm phải lớn hơn 0 đ!");
            }
        }

        if (dto.getDiscountPrice() != null) {
            if (dto.getDiscountPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Giá khuyến mãi không được âm!");
            }
            if (dto.getBasePrice() != null && dto.getDiscountPrice().compareTo(dto.getBasePrice()) >= 0) {
                throw new IllegalArgumentException("Giá khuyến mãi (" + dto.getDiscountPrice() 
                        + " đ) phải nhỏ hơn giá gốc (" + dto.getBasePrice() + " đ)!");
            }
        }
    }

    @Transactional
    // Tạo sản phẩm mới, gán danh mục và khởi tạo các chỉ số lượt xem/lượt bán bằng 0.
    public ProductDTO createProduct(CreateProductRequestDTO dto) {
        if (dto.getCategoryId() == null) {
            throw new IllegalArgumentException("Danh mục sản phẩm không được để trống!");
        }

        validateProduct(dto, true);

        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Danh mục không tồn tại với ID: " + dto.getCategoryId()));

        Product product = new Product();
        product.setName(dto.getName().trim());
        product.setDescription(dto.getDescription());
        product.setBasePrice(dto.getBasePrice());
        product.setDiscountPrice(dto.getDiscountPrice());
        product.setStatus(dto.getStatus() != null ? dto.getStatus() : "active");
        product.setCategory(category);
        product.setCreatedAt(LocalDateTime.now());
        product.setViewCount(0);
        product.setSoldCount(0);

        Product saved = productRepository.save(product);
        return mapToDTO(saved);
    }

    @Transactional
    // Cập nhật những thuộc tính có giá trị trong request của sản phẩm hiện có.
    public ProductDTO updateProduct(Integer id, CreateProductRequestDTO dto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm ID: " + id));

        validateProduct(dto, false);

        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Danh mục không tồn tại với ID: " + dto.getCategoryId()));
            product.setCategory(category);
        }

        if (dto.getName() != null && !dto.getName().trim().isEmpty())
            product.setName(dto.getName().trim());
        if (dto.getDescription() != null)
            product.setDescription(dto.getDescription());
        if (dto.getBasePrice() != null)
            product.setBasePrice(dto.getBasePrice());
        if (dto.getDiscountPrice() != null) {
            BigDecimal effectiveBase = product.getBasePrice();
            if (effectiveBase != null && dto.getDiscountPrice().compareTo(effectiveBase) >= 0) {
                throw new IllegalArgumentException("Giá khuyến mãi phải nhỏ hơn giá gốc (" + effectiveBase + " đ)!");
            }
            product.setDiscountPrice(dto.getDiscountPrice());
        }
        if (dto.getStatus() != null)
            product.setStatus(dto.getStatus());

        Product saved = productRepository.save(product);
        return mapToDTO(saved);
    }

    @Transactional
    // Đảo trạng thái hiển thị sản phẩm giữa active và inactive.
    public ProductDTO toggleProductStatus(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + id));

        if ("active".equalsIgnoreCase(product.getStatus())) {
            product.setStatus("inactive");
        } else {
            product.setStatus("active");
        }

        Product saved = productRepository.save(product);
        return mapToDTO(saved);
    }

    // Chuyển entity Product sang ProductDTO, kèm thông tin danh mục và hình ảnh nếu
    // có.
    private ProductDTO mapToDTO(Product p) {
        List<ProductImage> imgs = p.getProductId() != null
                ? productImageRepository.findByProductId(p.getProductId())
                : List.of();

        List<String> imageList = new ArrayList<>();
        String primaryUrl = null;
        for (ProductImage img : imgs) {
            String url = img.getImageUrl();
            if (url != null && !url.trim().isEmpty()) {
                imageList.add(url.trim());
                if (Boolean.TRUE.equals(img.getIsPrimary())) {
                    primaryUrl = url.trim();
                }
            }
        }
        if (primaryUrl == null && !imageList.isEmpty()) {
            primaryUrl = imageList.get(0);
        }

        List<ProductVariant> variants = p.getProductId() != null
                ? productVariantRepository.findByProductId(p.getProductId())
                : List.of();
        int variantCount = variants.size();
        int totalStock = variants.stream()
                .mapToInt(v -> v.getStockQuantity() != null ? v.getStockQuantity() : 0)
                .sum();

        return ProductDTO.builder()
                .productId(p.getProductId())
                .name(p.getName())
                .description(p.getDescription())
                .basePrice(p.getBasePrice())
                .discountPrice(p.getDiscountPrice())
                .status(p.getStatus())
                .viewCount(p.getViewCount())
                .soldCount(p.getSoldCount())
                .categoryId(p.getCategory() != null ? p.getCategory().getCategoryId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : "N/A")
                .primaryImageUrl(primaryUrl)
                .images(imageList)
                .createdAt(p.getCreatedAt())
                .variantCount(variantCount)
                .totalStock(totalStock)
                .build();
    }
}
