package com.example.myapp.controller;

import com.example.myapp.model.CustomerCategoryDTO;
import com.example.myapp.model.CustomerProductDTO;
import com.example.myapp.model.FilterFacetsDTO;
import com.example.myapp.model.PageResponseDTO;
import com.example.myapp.model.VariantInfoDTO;
import com.example.myapp.service.CustomerProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/customer")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CustomerProductController {

    private final CustomerProductService customerProductService;

    @GetMapping("/products")
    public ResponseEntity<PageResponseDTO<CustomerProductDTO>> getProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String variantSize,
            @RequestParam(required = false) Boolean inStockOnly,
            @RequestParam(required = false, defaultValue = "newest") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "12") int size) {
        return ResponseEntity.ok(customerProductService.getProducts(
                keyword, categoryId, gender, minPrice, maxPrice, color, variantSize, inStockOnly, sortBy, sortDir, page, size));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<CustomerProductDTO> getProductById(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(customerProductService.getProductDetail(id));
    }

    @GetMapping("/products/{id}/variants")
    public ResponseEntity<List<VariantInfoDTO>> getProductVariants(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(customerProductService.getProductVariants(id));
    }

    @GetMapping("/products/search")
    public ResponseEntity<PageResponseDTO<CustomerProductDTO>> searchProducts(
            @RequestParam("keyword") String keyword,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String variantSize,
            @RequestParam(required = false, defaultValue = "newest") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "12") int size) {
        return ResponseEntity.ok(customerProductService.searchProducts(
                keyword, categoryId, minPrice, maxPrice, color, variantSize, sortBy, sortDir, page, size));
    }

    @GetMapping("/products/category/{id}")
    public ResponseEntity<PageResponseDTO<CustomerProductDTO>> getProductsByCategory(
            @PathVariable("id") Integer id,
            @RequestParam(required = false, defaultValue = "newest") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "12") int size) {
        return ResponseEntity.ok(customerProductService.getProductsByCategory(id, sortBy, sortDir, page, size));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CustomerCategoryDTO>> getAllCategories(
            @RequestParam(required = false) String gender) {
        return ResponseEntity.ok(customerProductService.getAllCategories(gender));
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<CustomerCategoryDTO> getCategoryById(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(customerProductService.getCategoryById(id));
    }

    /**
     * Aggregated facets (sizes, colors, genders, price buckets) for the
     * customer filter sidebar. Each option is annotated with a product
     * count so the UI can disable empty choices.
     */
    @GetMapping("/filters")
    public ResponseEntity<FilterFacetsDTO> getFilterFacets() {
        return ResponseEntity.ok(customerProductService.getFilterFacets());
    }

    // ===== Recommendation sections =====

    @GetMapping("/products/new")
    public ResponseEntity<List<CustomerProductDTO>> getNewProducts(
            @RequestParam(required = false, defaultValue = "10") int limit) {
        return ResponseEntity.ok(customerProductService.getNewProducts(limit));
    }

    @GetMapping("/products/bestsellers")
    public ResponseEntity<List<CustomerProductDTO>> getBestsellers(
            @RequestParam(required = false, defaultValue = "10") int limit) {
        return ResponseEntity.ok(customerProductService.getBestsellers(limit));
    }

    @GetMapping("/products/discounts")
    public ResponseEntity<List<CustomerProductDTO>> getDiscountedProducts(
            @RequestParam(required = false, defaultValue = "10") int limit) {
        return ResponseEntity.ok(customerProductService.getDiscountedProducts(limit));
    }
}
