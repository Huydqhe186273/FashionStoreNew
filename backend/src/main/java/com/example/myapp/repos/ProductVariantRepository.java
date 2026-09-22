package com.example.myapp.repos;

import com.example.myapp.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Integer> {

    // Use explicit JPQL — Spring Data can't derive `Product.ProductId` because
    // the Product entity field is named `ProductId`, not `id`.
    @Query("SELECT pv FROM ProductVariant pv WHERE pv.Product.ProductId = :productId")
    List<ProductVariant> findByProductId(@Param("productId") Integer productId);
}
