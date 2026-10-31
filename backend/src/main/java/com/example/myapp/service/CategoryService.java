package com.example.myapp.service;

import com.example.myapp.entity.Category;
import com.example.myapp.model.CategoryDTO;
import com.example.myapp.model.CreateCategoryRequestDTO;
import com.example.myapp.repos.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    // Lấy danh sách danh mục, hỗ trợ lọc theo tên và giới tính.
    public List<CategoryDTO> getCategories(String keyword, String gender) {
        List<Category> categories = categoryRepository.searchCategories(keyword, gender);
        java.util.Map<Integer, Long> prodCounts = new java.util.HashMap<>();
        try {
            List<Object[]> counts = categoryRepository.countProductsPerCategory();
            for (Object[] r : counts) {
                if (r[0] != null && r[1] != null) {
                    prodCounts.put((Integer) r[0], ((Number) r[1]).longValue());
                }
            }
        } catch (Exception ignored) {}

        return categories.stream().map(c -> mapToDTO(c, prodCounts.getOrDefault(c.getCategoryId(), 0L))).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    // Lấy một danh mục theo ID; báo lỗi nếu không tồn tại.
    public CategoryDTO getCategoryById(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục ID: " + id));
        return mapToDTO(category);
    }

    @Transactional
    // Tạo danh mục mới và liên kết danh mục cha khi parentId được cung cấp.
    public CategoryDTO createCategory(CreateCategoryRequestDTO dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên danh mục không được để trống!");
        }
        String cleanName = dto.getName().trim();
        if (cleanName.length() > 100) {
            throw new IllegalArgumentException("Tên danh mục không được vượt quá 100 ký tự!");
        }

        Category category = new Category();
        category.setName(cleanName);
        category.setGender(dto.getGender() != null ? dto.getGender().trim() : "unisex");
        category.setSeason(dto.getSeason() != null ? dto.getSeason().trim() : null);

        if (dto.getParentId() != null) {
            Category parent = categoryRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục cha với ID: " + dto.getParentId()));
            category.setParent(parent);
        }

        Category saved = categoryRepository.save(category);
        return mapToDTO(saved);
    }

    @Transactional
    // Cập nhật danh mục và thay đổi/xóa liên kết danh mục cha theo parentId.
    public CategoryDTO updateCategory(Integer id, CreateCategoryRequestDTO dto) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục ID: " + id));

        if (dto.getName() != null) {
            String cleanName = dto.getName().trim();
            if (cleanName.isEmpty()) {
                throw new IllegalArgumentException("Tên danh mục không được để trống!");
            }
            if (cleanName.length() > 100) {
                throw new IllegalArgumentException("Tên danh mục không được vượt quá 100 ký tự!");
            }
            category.setName(cleanName);
        }
        if (dto.getGender() != null) category.setGender(dto.getGender().trim());
        if (dto.getSeason() != null) category.setSeason(dto.getSeason().trim());

        if (dto.getParentId() != null) {
            if (dto.getParentId().equals(id)) {
                throw new IllegalArgumentException("Không thể chọn chính danh mục này làm danh mục cha!");
            }
            Category parent = categoryRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục cha với ID: " + dto.getParentId()));
            
            // Chống vòng lặp phân cấp (Circular reference)
            Category checkAncestor = parent;
            while (checkAncestor != null) {
                if (checkAncestor.getCategoryId().equals(id)) {
                    throw new IllegalArgumentException("Không thể chọn danh mục con cháu làm danh mục cha (gây vòng lặp vô tận)!");
                }
                checkAncestor = checkAncestor.getParent();
            }
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        Category saved = categoryRepository.save(category);
        return mapToDTO(saved);
    }

    @Transactional
    // Xóa danh mục theo ID.
    public void deleteCategory(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục với ID: " + id));

        if (category.getChildren() != null && !category.getChildren().isEmpty()) {
            throw new IllegalArgumentException("Không thể xóa danh mục vì vẫn còn " + category.getChildren().size() 
                    + " danh mục con trực thuộc! Vui lòng xóa hoặc di chuyển danh mục con trước.");
        }

        if (category.getProducts() != null && !category.getProducts().isEmpty()) {
            throw new IllegalArgumentException("Không thể xóa danh mục vì vẫn còn " + category.getProducts().size() 
                    + " sản phẩm đang thuộc danh mục này! Vui lòng chuyển danh mục cho các sản phẩm trước.");
        }

        categoryRepository.delete(category);
    }

    // Chuyển entity Category thành DTO, bao gồm danh mục cha và số sản phẩm thuộc danh mục.
    private CategoryDTO mapToDTO(Category c) {
        return mapToDTO(c, c.getProducts() != null ? c.getProducts().size() : 0);
    }

    private CategoryDTO mapToDTO(Category c, long prodCount) {
        return CategoryDTO.builder()
                .categoryId(c.getCategoryId())
                .name(c.getName())
                .gender(c.getGender())
                .season(c.getSeason())
                .parentId(c.getParent() != null ? c.getParent().getCategoryId() : null)
                .parentName(c.getParent() != null ? c.getParent().getName() : null)
                .productCount(prodCount)
                .build();
    }
}
