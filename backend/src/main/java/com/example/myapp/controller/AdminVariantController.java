package com.example.myapp.controller;

import com.example.myapp.model.CreateVariantRequestDTO;
import com.example.myapp.model.MatrixGenerateVariantsRequestDTO;
import com.example.myapp.model.VariantDTO;
import com.example.myapp.service.ProductVariantService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/variants")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class AdminVariantController {

    private final ProductVariantService variantService;

    public AdminVariantController(ProductVariantService variantService) {
        this.variantService = variantService;
    }

    @GetMapping
    public ResponseEntity<List<VariantDTO>> getVariants(
            @RequestParam(required = false) Integer productId,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(variantService.getVariants(productId, keyword));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VariantDTO> getVariantById(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(variantService.getVariantById(id));
    }

    @PostMapping
    public ResponseEntity<VariantDTO> createVariant(@RequestBody CreateVariantRequestDTO dto) {
        return new ResponseEntity<>(variantService.createVariant(dto), HttpStatus.CREATED);
    }

    @PostMapping("/matrix")
    public ResponseEntity<List<VariantDTO>> generateMatrixVariants(@RequestBody MatrixGenerateVariantsRequestDTO dto) {
        return new ResponseEntity<>(variantService.generateMatrixVariants(dto), HttpStatus.CREATED);
    }

    @PostMapping("/batch")
    public ResponseEntity<List<VariantDTO>> createBatchVariants(@RequestBody List<CreateVariantRequestDTO> dtos) {
        return new ResponseEntity<>(variantService.createBatchVariants(dtos), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<VariantDTO> updateVariant(
            @PathVariable("id") Integer id,
            @RequestBody CreateVariantRequestDTO dto) {
        return ResponseEntity.ok(variantService.updateVariant(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVariant(@PathVariable("id") Integer id) {
        variantService.deleteVariant(id);
        return ResponseEntity.noContent().build();
    }
}
