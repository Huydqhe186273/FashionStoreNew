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
    public List<CategoryDTO> getCategories(String keyword, String gender) {
        List<Category> categories = categoryRepository.searchCategories(keyword, gender);
        return categories.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục ID: " + id));
        return mapToDTO(category);
    }

    @Transactional
    public CategoryDTO createCategory(CreateCategoryRequestDTO dto) {
        Category category = new Category();
        category.setName(dto.getName());
        category.setGender(dto.getGender());
        category.setSeason(dto.getSeason());

        if (dto.getParentId() != null) {
            Category parent = categoryRepository.findById(dto.getParentId()).orElse(null);
            category.setParent(parent);
        }

        Category saved = categoryRepository.save(category);
        return mapToDTO(saved);
    }

    @Transactional
    public CategoryDTO updateCategory(Integer id, CreateCategoryRequestDTO dto) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục ID: " + id));

        if (dto.getName() != null) category.setName(dto.getName());
        if (dto.getGender() != null) category.setGender(dto.getGender());
        if (dto.getSeason() != null) category.setSeason(dto.getSeason());

        if (dto.getParentId() != null) {
            Category parent = categoryRepository.findById(dto.getParentId()).orElse(null);
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        Category saved = categoryRepository.save(category);
        return mapToDTO(saved);
    }

    @Transactional
    public void deleteCategory(Integer id) {
        categoryRepository.deleteById(id);
    }

    private CategoryDTO mapToDTO(Category c) {
        long prodCount = c.getProducts() != null ? c.getProducts().size() : 0;
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
