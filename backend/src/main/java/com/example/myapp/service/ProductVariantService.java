package com.example.myapp.service;

import com.example.myapp.entity.Product;
import com.example.myapp.entity.ProductVariant;
import com.example.myapp.model.CreateVariantRequestDTO;
import com.example.myapp.model.MatrixGenerateVariantsRequestDTO;
import com.example.myapp.model.VariantDTO;
import com.example.myapp.repos.CartItemRepository;
import com.example.myapp.repos.InboundBatchRepository;
import com.example.myapp.repos.OrderItemRepository;
import com.example.myapp.repos.ProductRepository;
import com.example.myapp.repos.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductVariantService {

    private final ProductVariantRepository productVariantRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final InboundBatchRepository inboundBatchRepository;

    public ProductVariantService(
            ProductVariantRepository productVariantRepository,
            ProductRepository productRepository,
            OrderItemRepository orderItemRepository,
            CartItemRepository cartItemRepository,
            InboundBatchRepository inboundBatchRepository) {
        this.productVariantRepository = productVariantRepository;
        this.productRepository = productRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartItemRepository = cartItemRepository;
        this.inboundBatchRepository = inboundBatchRepository;
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
        if (cleanSku.length() > 50) {
            throw new IllegalArgumentException("Mã SKU không được vượt quá 50 ký tự!");
        }
        if (!cleanSku.matches("^[a-zA-Z0-9_-]+$")) {
            throw new IllegalArgumentException("Mã SKU chỉ được chứa chữ cái, số, gạch ngang (-) hoặc gạch dưới (_)!");
        }
        if (productVariantRepository.existsBySkuIgnoreCase(cleanSku)) {
            throw new IllegalArgumentException("Mã SKU đã tồn tại trong hệ thống: " + cleanSku);
        }

        String cleanSize = dto.getSize() != null ? dto.getSize().trim() : "";
        if (cleanSize.length() > 50) {
            throw new IllegalArgumentException("Kích thước không được vượt quá 50 ký tự!");
        }
        String cleanColor = dto.getColor() != null ? dto.getColor().trim() : "";
        if (cleanColor.length() > 50) {
            throw new IllegalArgumentException("Màu sắc không được vượt quá 50 ký tự!");
        }
        if (!cleanSize.isEmpty() || !cleanColor.isEmpty()) {
            if (productVariantRepository.existsByProductIdAndColorAndSize(dto.getProductId(), cleanColor, cleanSize)) {
                throw new IllegalArgumentException("Biến thể với Màu sắc '" + (cleanColor.isEmpty() ? "Mặc định" : cleanColor) 
                        + "' và Kích thước '" + (cleanSize.isEmpty() ? "Mặc định" : cleanSize) 
                        + "' đã tồn tại cho sản phẩm này!");
            }
        }

        int stock = dto.getStockQuantity() != null ? dto.getStockQuantity() : 0;
        if (stock < 0 || stock > 1000000) {
            throw new IllegalArgumentException("Số lượng tồn kho (stockQuantity) phải nằm trong khoảng từ 0 đến 1,000,000!");
        }

        ProductVariant v = new ProductVariant();
        v.setProduct(product);
        v.setSize(!cleanSize.isEmpty() ? cleanSize : null);
        v.setColor(!cleanColor.isEmpty() ? cleanColor : null);
        v.setSku(cleanSku);
        v.setStockQuantity(stock);

        ProductVariant saved = productVariantRepository.save(v);
        return toDTO(saved);
    }

    /**
     * Tự động sinh hàng loạt biến thể theo ma trận Màu sắc x Kích thước (Màu x Size).
     * Tự động tạo mã SKU chuẩn, kiểm tra bỏ qua các biến thể đã tồn tại để tránh trùng lặp.
     */
    @Transactional
    public List<VariantDTO> generateMatrixVariants(MatrixGenerateVariantsRequestDTO dto) {
        if (dto.getProductId() == null) {
            throw new IllegalArgumentException("Mã sản phẩm (productId) không được để trống!");
        }

        Product product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm với ID: " + dto.getProductId()));

        List<String> colors = (dto.getColors() == null || dto.getColors().isEmpty())
                ? List.of("Mặc định")
                : dto.getColors().stream().map(String::trim).filter(s -> !s.isEmpty()).distinct().collect(Collectors.toList());

        List<String> sizes = (dto.getSizes() == null || dto.getSizes().isEmpty())
                ? List.of("Freesize")
                : dto.getSizes().stream().map(String::trim).filter(s -> !s.isEmpty()).distinct().collect(Collectors.toList());

        String prefix = (dto.getCustomSkuPrefix() != null && !dto.getCustomSkuPrefix().trim().isEmpty())
                ? dto.getCustomSkuPrefix().trim().toUpperCase()
                : "PRD" + product.getProductId();
        if (prefix.length() > 30) {
            throw new IllegalArgumentException("Tiền tố SKU không được vượt quá 30 ký tự!");
        }

        int initialStock = (dto.getInitialStock() != null && dto.getInitialStock() > 0) ? dto.getInitialStock() : 0;
        if (initialStock > 1000000) {
            throw new IllegalArgumentException("Số lượng tồn kho ban đầu không được vượt quá 1,000,000!");
        }

        List<ProductVariant> createdVariants = new ArrayList<>();

        for (String color : colors) {
            String colorClean = color.trim();
            String colorSlug = slugify(colorClean);
            if (colorSlug.isEmpty()) colorSlug = "DEF";

            for (String size : sizes) {
                String sizeClean = size.trim();
                String sizeSlug = slugify(sizeClean);
                if (sizeSlug.isEmpty()) sizeSlug = "STD";

                // Kiểm tra xem biến thể (Màu, Size) đã tồn tại cho sản phẩm này chưa
                if (productVariantRepository.existsByProductIdAndColorAndSize(product.getProductId(), colorClean, sizeClean)) {
                    // Đã tồn tại -> Bỏ qua để không bị trùng lặp
                    continue;
                }

                // Sinh mã SKU duy nhất
                String baseSku = prefix + "-" + colorSlug + "-" + sizeSlug;
                String sku = baseSku;
                int suffix = 100;
                while (productVariantRepository.existsBySkuIgnoreCase(sku)) {
                    sku = baseSku + "-" + (suffix + (int)(Math.random() * 900));
                    suffix++;
                }

                ProductVariant pv = new ProductVariant();
                pv.setProduct(product);
                pv.setColor(colorClean);
                pv.setSize(sizeClean);
                pv.setSku(sku);
                pv.setStockQuantity(initialStock);

                createdVariants.add(pv);
            }
        }

        if (!createdVariants.isEmpty()) {
            List<ProductVariant> saved = productVariantRepository.saveAll(createdVariants);
            return saved.stream().map(this::toDTO).collect(Collectors.toList());
        }

        return new ArrayList<>();
    }

    /**
     * Tạo nhiều biến thể cùng lúc từ danh sách chi tiết được định nghĩa sẵn.
     */
    @Transactional
    public List<VariantDTO> createBatchVariants(List<CreateVariantRequestDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            return new ArrayList<>();
        }
        List<VariantDTO> results = new ArrayList<>();
        for (CreateVariantRequestDTO dto : dtos) {
            results.add(createVariant(dto));
        }
        return results;
    }

    private String slugify(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text.trim(), Normalizer.Form.NFD);
        String withoutAccents = normalized.replaceAll("\\p{M}", "")
                .replace("đ", "d").replace("Đ", "D");
        return withoutAccents.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
    }

    public VariantDTO updateVariant(Integer id, CreateVariantRequestDTO dto) {
        ProductVariant v = productVariantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy biến thể với ID: " + id));

        if (dto.getSku() == null || dto.getSku().trim().isEmpty()) {
            throw new IllegalArgumentException("Mã SKU không được để trống!");
        }

        String cleanSku = dto.getSku().trim();
        if (cleanSku.length() > 50) {
            throw new IllegalArgumentException("Mã SKU không được vượt quá 50 ký tự!");
        }
        if (!cleanSku.matches("^[a-zA-Z0-9_-]+$")) {
            throw new IllegalArgumentException("Mã SKU chỉ được chứa chữ cái, số, gạch ngang (-) hoặc gạch dưới (_)!");
        }
        if (productVariantRepository.existsBySkuIgnoreCaseAndVariantIdNot(cleanSku, id)) {
            throw new IllegalArgumentException("Mã SKU đã tồn tại ở một biến thể khác: " + cleanSku);
        }

        Integer effectiveProductId = dto.getProductId() != null ? dto.getProductId() : (v.getProduct() != null ? v.getProduct().getProductId() : null);
        String cleanSize = dto.getSize() != null ? dto.getSize().trim() : "";
        if (cleanSize.length() > 50) {
            throw new IllegalArgumentException("Kích thước không được vượt quá 50 ký tự!");
        }
        String cleanColor = dto.getColor() != null ? dto.getColor().trim() : "";
        if (cleanColor.length() > 50) {
            throw new IllegalArgumentException("Màu sắc không được vượt quá 50 ký tự!");
        }
        if (effectiveProductId != null && (!cleanSize.isEmpty() || !cleanColor.isEmpty())) {
            if (productVariantRepository.existsByProductIdAndColorAndSizeAndVariantIdNot(effectiveProductId, cleanColor, cleanSize, id)) {
                throw new IllegalArgumentException("Biến thể với Màu sắc '" + (cleanColor.isEmpty() ? "Mặc định" : cleanColor) 
                        + "' và Kích thước '" + (cleanSize.isEmpty() ? "Mặc định" : cleanSize) 
                        + "' đã tồn tại cho sản phẩm này!");
            }
        }

        int stock = dto.getStockQuantity() != null ? dto.getStockQuantity() : 0;
        if (stock < 0 || stock > 1000000) {
            throw new IllegalArgumentException("Số lượng tồn kho (stockQuantity) phải nằm trong khoảng từ 0 đến 1,000,000!");
        }

        if (dto.getProductId() != null && (v.getProduct() == null || !dto.getProductId().equals(v.getProduct().getProductId()))) {
            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm với ID: " + dto.getProductId()));
            v.setProduct(product);
        }

        v.setSize(!cleanSize.isEmpty() ? cleanSize : null);
        v.setColor(!cleanColor.isEmpty() ? cleanColor : null);
        v.setSku(cleanSku);
        // Lưu ý: Không ghi đè trực tiếp stockQuantity ở đây để bảo toàn nguyên tắc FIFO theo từng Lô (InboundBatches).
        // Biến động kho chỉ phát sinh qua Phiếu Nhập Kho hoặc Đơn Hàng Xuất Bán.

        ProductVariant updated = productVariantRepository.save(v);
        return toDTO(updated);
    }

    public void deleteVariant(Integer id) {
        ProductVariant v = productVariantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy biến thể với ID: " + id));

        // 1. Chặn nếu tồn kho còn hàng
        if (v.getStockQuantity() != null && v.getStockQuantity() > 0) {
            throw new IllegalArgumentException("Không thể xóa biến thể vì vẫn còn " + v.getStockQuantity() 
                    + " sản phẩm trong kho! Vui lòng xuất kho hoặc điều chỉnh tồn kho về 0 trước.");
        }

        // 2. Chặn nếu đã có lịch sử nhập kho theo lô (Inbound Batches)
        if (inboundBatchRepository.existsByVariantId(id)) {
            throw new IllegalArgumentException("Không thể xóa biến thể vì đã có lịch sử nhập kho theo lô FIFO!");
        }

        // 3. Chặn nếu biến thể đã có trong đơn hàng của khách
        if (orderItemRepository.existsByVariantId(id)) {
            throw new IllegalArgumentException("Không thể xóa biến thể vì đã có trong đơn hàng của khách!");
        }

        // Clean up cart items referencing this variant if any
        cartItemRepository.deleteByVariantId(id);

        Product product = v.getProduct();
        productVariantRepository.delete(v);

        // Nếu xóa hết biến thể mà sản phẩm đang Active -> Tự động chuyển về Inactive để bảo vệ sàn
        if (product != null) {
            List<ProductVariant> remaining = productVariantRepository.findByProductId(product.getProductId());
            if (remaining.isEmpty() && "active".equalsIgnoreCase(product.getStatus())) {
                product.setStatus("inactive");
                productRepository.save(product);
            }
        }
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
