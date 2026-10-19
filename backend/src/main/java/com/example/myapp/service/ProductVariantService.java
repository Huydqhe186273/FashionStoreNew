package com.example.myapp.service;

import com.example.myapp.entity.Product;
import com.example.myapp.entity.ProductVariant;
import com.example.myapp.model.CreateVariantRequestDTO;
import com.example.myapp.model.VariantDTO;
import com.example.myapp.repos.CartItemRepository;
import com.example.myapp.repos.OrderItemRepository;
import com.example.myapp.repos.ProductRepository;
import com.example.myapp.repos.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductVariantService {

    private final ProductVariantRepository productVariantRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;

    public ProductVariantService(
            ProductVariantRepository productVariantRepository,
            ProductRepository productRepository,
            OrderItemRepository orderItemRepository,
            CartItemRepository cartItemRepository) {
        this.productVariantRepository = productVariantRepository;
        this.productRepository = productRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartItemRepository = cartItemRepository;
    }

    @Transactional(readOnly = true)
    public List<VariantDTO> getVariants(Integer productId, String keyword) {
        List<ProductVariant> list;
        if (productId != null) {
            list = productVariantRepository.findAllByProductIdWithProduct(productId);
        } else {
            list = productVariantRepository.findAllWithProduct();
        }

        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim().toLowerCase();
            list = list.stream().filter(v ->
                (v.getSku() != null && v.getSku().toLowerCase().contains(kw)) ||
                (v.getColor() != null && v.getColor().toLowerCase().contains(kw)) ||
                (v.getSize() != null && v.getSize().toLowerCase().contains(kw)) ||
                (v.getProduct() != null && v.getProduct().getName() != null && v.getProduct().getName().toLowerCase().contains(kw))
            ).collect(Collectors.toList());
        }

        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VariantDTO getVariantById(Integer id) {
        ProductVariant v = productVariantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy biến thể với ID: " + id));
        return toDTO(v);
    }

    public VariantDTO createVariant(CreateVariantRequestDTO dto) {
        if (dto.getProductId() == null) {
            throw new IllegalArgumentException("Mã sản phẩm (productId) không được để trống!");
        }

        Product product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm với ID: " + dto.getProductId()));

        if (dto.getSku() == null || dto.getSku().trim().isEmpty()) {
            throw new IllegalArgumentException("Mã SKU không được để trống!");
        }

        String cleanSku = dto.getSku().trim();
        if (productVariantRepository.existsBySkuIgnoreCase(cleanSku)) {
            throw new IllegalArgumentException("Mã SKU đã tồn tại trong hệ thống: " + cleanSku);
        }

        int stock = dto.getStockQuantity() != null ? dto.getStockQuantity() : 0;
        if (stock < 0) {
            throw new IllegalArgumentException("Số lượng tồn kho (stockQuantity) phải lớn hơn hoặc bằng 0!");
        }

        ProductVariant v = new ProductVariant();
        v.setProduct(product);
        v.setSize(dto.getSize() != null ? dto.getSize().trim() : null);
        v.setColor(dto.getColor() != null ? dto.getColor().trim() : null);
        v.setSku(cleanSku);
        v.setStockQuantity(stock);

        ProductVariant saved = productVariantRepository.save(v);
        return toDTO(saved);
    }

    public VariantDTO updateVariant(Integer id, CreateVariantRequestDTO dto) {
        ProductVariant v = productVariantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy biến thể với ID: " + id));

        if (dto.getSku() == null || dto.getSku().trim().isEmpty()) {
            throw new IllegalArgumentException("Mã SKU không được để trống!");
        }

        String cleanSku = dto.getSku().trim();
        if (productVariantRepository.existsBySkuIgnoreCaseAndVariantIdNot(cleanSku, id)) {
            throw new IllegalArgumentException("Mã SKU đã tồn tại ở một biến thể khác: " + cleanSku);
        }

        int stock = dto.getStockQuantity() != null ? dto.getStockQuantity() : 0;
        if (stock < 0) {
            throw new IllegalArgumentException("Số lượng tồn kho (stockQuantity) phải lớn hơn hoặc bằng 0!");
        }

        if (dto.getProductId() != null && (v.getProduct() == null || !dto.getProductId().equals(v.getProduct().getProductId()))) {
            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm với ID: " + dto.getProductId()));
            v.setProduct(product);
        }

        v.setSize(dto.getSize() != null ? dto.getSize().trim() : null);
        v.setColor(dto.getColor() != null ? dto.getColor().trim() : null);
        v.setSku(cleanSku);
        // Lưu ý: Không ghi đè trực tiếp stockQuantity ở đây để bảo toàn nguyên tắc FIFO theo từng Lô (InboundBatches).
        // Biến động kho chỉ phát sinh qua Phiếu Nhập Kho hoặc Đơn Hàng Xuất Bán.

        ProductVariant updated = productVariantRepository.save(v);
        return toDTO(updated);
    }

    public void deleteVariant(Integer id) {
        ProductVariant v = productVariantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy biến thể với ID: " + id));

        if (orderItemRepository.existsByVariantId(id)) {
            throw new IllegalArgumentException("Không thể xóa biến thể vì đã có trong đơn hàng của khách!");
        }

        // Clean up cart items referencing this variant if any
        cartItemRepository.deleteByVariantId(id);

        productVariantRepository.delete(v);
    }

    private VariantDTO toDTO(ProductVariant v) {
        return VariantDTO.builder()
                .variantId(v.getVariantId())
                .productId(v.getProduct() != null ? v.getProduct().getProductId() : null)
                .productName(v.getProduct() != null ? v.getProduct().getName() : null)
                .size(v.getSize())
                .color(v.getColor())
                .sku(v.getSku())
                .stockQuantity(v.getStockQuantity() != null ? v.getStockQuantity() : 0)
                .build();
    }
}
