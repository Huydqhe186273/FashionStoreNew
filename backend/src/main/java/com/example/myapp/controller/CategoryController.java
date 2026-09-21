package com.example.myapp.controller;

import com.example.myapp.model.CategoryDTO;
import com.example.myapp.model.CreateCategoryRequestDTO;
import com.example.myapp.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/categories")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    // Xử lý GET /api/admin/categories để trả danh sách danh mục.
    public ResponseEntity<List<CategoryDTO>> getCategories(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String gender) {
        return ResponseEntity.ok(categoryService.getCategories(keyword, gender));
    }

    @GetMapping("/{id}")
    // Xử lý GET /api/admin/categories/{id} để trả chi tiết danh mục.
    public ResponseEntity<CategoryDTO> getCategoryById(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    @PostMapping
    // Xử lý POST /api/admin/categories để tạo danh mục.
    public ResponseEntity<CategoryDTO> createCategory(@RequestBody CreateCategoryRequestDTO dto) {
        return ResponseEntity.ok(categoryService.createCategory(dto));
    }

    @PutMapping("/{id}")
    // Xử lý PUT /api/admin/categories/{id} để cập nhật danh mục.
    public ResponseEntity<CategoryDTO> updateCategory(
            @PathVariable("id") Integer id,
            @RequestBody CreateCategoryRequestDTO dto) {
        return ResponseEntity.ok(categoryService.updateCategory(id, dto));
    }

    @DeleteMapping("/{id}")
    // Xử lý DELETE /api/admin/categories/{id} để xóa danh mục.
    public ResponseEntity<Void> deleteCategory(@PathVariable("id") Integer id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
