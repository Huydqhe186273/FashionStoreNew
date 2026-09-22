package com.example.myapp.repos;

import com.example.myapp.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {

    // Spring Data can't derive property paths when the entity field is `ProductId`
    // and not `id`. Use explicit JPQL so the binding is unambiguous.

    @Query("SELECT r FROM Review r WHERE r.Product.ProductId = :productId ORDER BY r.CreatedAt DESC")
    List<Review> findReviewsByProductOrderByCreatedAtDesc(@Param("productId") Integer productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.Product.ProductId = :productId")
    long countReviewsByProduct(@Param("productId") Integer productId);

    @Query("SELECT AVG(r.Rating) FROM Review r WHERE r.Product.ProductId = :productId")
    Double averageRatingByProductId(@Param("productId") Integer productId);
}
