package com.example.myapp.repos;

import com.example.myapp.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Integer> {
    List<ProductVariant> findByProduct_ProductId(Integer productId);

    // Alias for callers that pass productId directly (Spring Data derives Product.ProductId)
    List<ProductVariant> findByProductId(Integer productId);
}
