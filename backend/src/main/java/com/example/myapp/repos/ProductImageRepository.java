package com.example.myapp.repos;

import com.example.myapp.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Integer> {
    List<ProductImage> findByProduct_ProductId(Integer productId);

    // Alias for callers that pass productId directly
    List<ProductImage> findByProductId(Integer productId);
}
