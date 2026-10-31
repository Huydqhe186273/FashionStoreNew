package com.example.myapp.controller;

import com.example.myapp.model.ProductImageDTO;
import com.example.myapp.service.ProductImageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/products/{productId}/images")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class ProductImageController {

    private final ProductImageService productImageService;

    public ProductImageController(ProductImageService productImageService) {
        this.productImageService = productImageService;
    }

    @GetMapping
    public ResponseEntity<List<ProductImageDTO>> getProductImages(@PathVariable("productId") Integer productId) {
        return ResponseEntity.ok(productImageService.getProductImages(productId));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadProductImage(
            @PathVariable("productId") Integer productId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "isPrimary", required = false, defaultValue = "false") Boolean isPrimary) {
        try {
            ProductImageDTO dto = productImageService.uploadProductImage(productId, file, isPrimary);
            return new ResponseEntity<>(dto, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi xử lý tải ảnh: " + e.getMessage()));
        }
    }

    @PostMapping("/url")
    public ResponseEntity<?> addProductImageUrl(
            @PathVariable("productId") Integer productId,
            @RequestBody Map<String, Object> body) {
        try {
            String imageUrl = body.get("imageUrl") != null ? body.get("imageUrl").toString() : null;
            Boolean isPrimary = body.get("isPrimary") != null && Boolean.parseBoolean(body.get("isPrimary").toString());
            ProductImageDTO dto = productImageService.addProductImageUrl(productId, imageUrl, isPrimary);
            return new ResponseEntity<>(dto, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi lưu link ảnh: " + e.getMessage()));
        }
    }

    @PutMapping("/{imageId}/primary")
    public ResponseEntity<ProductImageDTO> setPrimaryImage(
            @PathVariable("productId") Integer productId,
            @PathVariable("imageId") Integer imageId) {
        return ResponseEntity.ok(productImageService.setPrimaryImage(productId, imageId));
    }

    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> deleteProductImage(
            @PathVariable("productId") Integer productId,
            @PathVariable("imageId") Integer imageId) {
        productImageService.deleteProductImage(productId, imageId);
        return ResponseEntity.noContent().build();
    }
}
