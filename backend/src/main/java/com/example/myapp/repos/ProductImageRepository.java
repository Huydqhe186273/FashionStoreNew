package com.example.myapp.repos;

import com.example.myapp.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Integer> {

    // Use explicit JPQL — Spring Data can't derive `Product.ProductId` because
    // the Product entity field is named `ProductId`, not `id`.
    @Query("SELECT img FROM ProductImage img WHERE img.Product.ProductId = :productId")
    List<ProductImage> findByProductId(@Param("productId") Integer productId);
}
