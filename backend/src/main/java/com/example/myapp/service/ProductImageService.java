package com.example.myapp.service;

import com.example.myapp.entity.Product;
import com.example.myapp.entity.ProductImage;
import com.example.myapp.model.ProductImageDTO;
import com.example.myapp.repos.ProductImageRepository;
import com.example.myapp.repos.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductImageService {

    private final ProductImageRepository productImageRepository;
    private final ProductRepository productRepository;
    private final CloudinaryService cloudinaryService;

    public ProductImageService(ProductImageRepository productImageRepository,
                               ProductRepository productRepository,
                               CloudinaryService cloudinaryService) {
        this.productImageRepository = productImageRepository;
        this.productRepository = productRepository;
        this.cloudinaryService = cloudinaryService;
    }

    @Transactional(readOnly = true)
    public List<ProductImageDTO> getProductImages(Integer productId) {
        return productImageRepository.findByProductId(productId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Tải file ảnh lên Cloudinary và lưu link secure_url vào database
     */
    public ProductImageDTO uploadProductImage(Integer productId, MultipartFile file, Boolean isPrimary) throws IOException {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm #" + productId));

        // 1. Tải ảnh lên Cloudinary
        String secureUrl = cloudinaryService.uploadImage(file, "products");

        // 2. Thêm vào database
        return saveImageRecord(product, secureUrl, isPrimary);
    }

    /**
     * Thêm ảnh bằng URL có sẵn vào database
     */
    public ProductImageDTO addProductImageUrl(Integer productId, String imageUrl, Boolean isPrimary) {
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new IllegalArgumentException("Đường dẫn ảnh không được để trống!");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm #" + productId));

        return saveImageRecord(product, imageUrl.trim(), isPrimary);
    }

    private ProductImageDTO saveImageRecord(Product product, String imageUrl, Boolean isPrimary) {
        Integer productId = product.getProductId();
        List<ProductImage> currentImages = productImageRepository.findByProductId(productId);

        // Nếu là ảnh đầu tiên hoặc được chỉ định là ảnh chính, bỏ chọn các ảnh chính cũ
        boolean makePrimary = Boolean.TRUE.equals(isPrimary) || currentImages.isEmpty();
        if (makePrimary) {
            for (ProductImage img : currentImages) {
                if (Boolean.TRUE.equals(img.getIsPrimary())) {
                    img.setIsPrimary(false);
                    productImageRepository.save(img);
                }
            }
        }

        ProductImage newImage = new ProductImage();
        newImage.setProduct(product);
        newImage.setImageUrl(imageUrl);
        newImage.setIsPrimary(makePrimary);

        ProductImage saved = productImageRepository.save(newImage);
        return mapToDTO(saved);
    }

    public ProductImageDTO setPrimaryImage(Integer productId, Integer imageId) {
        List<ProductImage> images = productImageRepository.findByProductId(productId);
        ProductImage target = null;

        for (ProductImage img : images) {
            if (img.getImageId().equals(imageId)) {
                img.setIsPrimary(true);
                target = img;
            } else {
                img.setIsPrimary(false);
            }
            productImageRepository.save(img);
        }

        if (target == null) {
            throw new IllegalArgumentException("Không tìm thấy ảnh #" + imageId + " của sản phẩm #" + productId);
        }

        return mapToDTO(target);
    }

    public void deleteProductImage(Integer productId, Integer imageId) {
        ProductImage target = productImageRepository.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ảnh #" + imageId));

        if (!target.getProduct().getProductId().equals(productId)) {
            throw new IllegalArgumentException("Ảnh không thuộc sản phẩm này!");
        }

        boolean wasPrimary = Boolean.TRUE.equals(target.getIsPrimary());
        String oldUrl = target.getImageUrl();

        productImageRepository.delete(target);

        // Dọn dẹp ảnh trên Cloudinary nếu đó là ảnh do Cloudinary lưu trữ
        if (oldUrl != null && oldUrl.contains("res.cloudinary.com")) {
            cloudinaryService.deleteByUrl(oldUrl);
        }

        // Nếu ảnh vừa xóa là ảnh chính, đặt ảnh còn lại đầu tiên làm ảnh chính
        if (wasPrimary) {
            List<ProductImage> remaining = productImageRepository.findByProductId(productId);
            if (!remaining.isEmpty()) {
                ProductImage newPrimary = remaining.get(0);
                newPrimary.setIsPrimary(true);
                productImageRepository.save(newPrimary);
            }
        }
    }

    private ProductImageDTO mapToDTO(ProductImage img) {
        return ProductImageDTO.builder()
                .imageId(img.getImageId())
                .productId(img.getProduct() != null ? img.getProduct().getProductId() : null)
                .imageUrl(img.getImageUrl())
                .isPrimary(Boolean.TRUE.equals(img.getIsPrimary()))
                .build();
    }
}
