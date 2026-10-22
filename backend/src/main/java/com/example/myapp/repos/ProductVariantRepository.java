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

    @Query("SELECT pv FROM ProductVariant pv JOIN FETCH pv.Product p ORDER BY pv.VariantId DESC")
    List<ProductVariant> findAllWithProduct();

    @Query("SELECT pv FROM ProductVariant pv JOIN FETCH pv.Product p WHERE p.ProductId = :productId ORDER BY pv.VariantId DESC")
    List<ProductVariant> findAllByProductIdWithProduct(@Param("productId") Integer productId);

    @Query("SELECT CASE WHEN COUNT(pv) > 0 THEN true ELSE false END FROM ProductVariant pv WHERE LOWER(TRIM(pv.Sku)) = LOWER(TRIM(:sku))")
    boolean existsBySkuIgnoreCase(@Param("sku") String sku);

    @Query("SELECT CASE WHEN COUNT(pv) > 0 THEN true ELSE false END FROM ProductVariant pv WHERE LOWER(TRIM(pv.Sku)) = LOWER(TRIM(:sku)) AND pv.VariantId <> :variantId")
    boolean existsBySkuIgnoreCaseAndVariantIdNot(@Param("sku") String sku, @Param("variantId") Integer variantId);
}

