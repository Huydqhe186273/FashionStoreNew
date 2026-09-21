package com.example.myapp.service;

import com.example.myapp.entity.Category;
import com.example.myapp.entity.Product;
import com.example.myapp.model.CreateProductRequestDTO;
import com.example.myapp.model.ProductDTO;
import com.example.myapp.repos.CategoryRepository;
import com.example.myapp.repos.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

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

    @Transactional
    // Tạo sản phẩm mới, gán danh mục và khởi tạo các chỉ số lượt xem/lượt bán bằng 0.
    public ProductDTO createProduct(CreateProductRequestDTO dto) {
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Danh mục không tồn tại"));

        Product product = new Product();
        product.setName(dto.getName());
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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + id));

        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Danh mục không tồn tại"));
            product.setCategory(category);
        }

        if (dto.getName() != null) product.setName(dto.getName());
        if (dto.getDescription() != null) product.setDescription(dto.getDescription());
        if (dto.getBasePrice() != null) product.setBasePrice(dto.getBasePrice());
        if (dto.getDiscountPrice() != null) product.setDiscountPrice(dto.getDiscountPrice());
        if (dto.getStatus() != null) product.setStatus(dto.getStatus());

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

    // Chuyển entity Product sang ProductDTO, kèm thông tin danh mục nếu có.
    private ProductDTO mapToDTO(Product p) {
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
                .createdAt(p.getCreatedAt())
                .build();
    }
}
