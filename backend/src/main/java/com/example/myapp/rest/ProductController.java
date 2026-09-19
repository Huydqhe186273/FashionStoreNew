package com.example.myapp.rest;

import com.example.myapp.model.CreateProductRequestDTO;
import com.example.myapp.model.ProductDTO;
import com.example.myapp.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductDTO>> getProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(productService.getProducts(keyword, categoryId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PostMapping
    public ResponseEntity<ProductDTO> createProduct(@RequestBody CreateProductRequestDTO dto) {
        return ResponseEntity.ok(productService.createProduct(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDTO> updateProduct(
            @PathVariable("id") Integer id,
            @RequestBody CreateProductRequestDTO dto) {
        return ResponseEntity.ok(productService.updateProduct(id, dto));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ProductDTO> toggleProductStatus(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(productService.toggleProductStatus(id));
    }
}
