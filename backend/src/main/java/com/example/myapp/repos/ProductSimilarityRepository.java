package com.example.myapp.repos;

import com.example.myapp.entity.ProductSimilarity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductSimilarityRepository extends JpaRepository<ProductSimilarity, ProductSimilarity.ProductSimilarityId> {

    @Query("SELECT s FROM ProductSimilarity s WHERE s.Id.ProductIdA = :productIdA ORDER BY s.SimilarityScore DESC")
    List<ProductSimilarity> findTopSimilar(@Param("productIdA") Integer productIdA);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM ProductSimilarity s WHERE s.Id.ProductIdA = :productIdA")
    void deleteByIdProductIdA(@Param("productIdA") Integer productIdA);
}
