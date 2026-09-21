package com.example.myapp.repos;

import com.example.myapp.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {

    List<Review> findByProduct_ProductIdOrderByCreatedAtDesc(Integer productId);

    long countByProduct_ProductId(Integer productId);

    @Query("SELECT AVG(r.Rating) FROM Review r WHERE r.Product.ProductId = :productId")
    Double averageRatingByProductId(@Param("productId") Integer productId);
}
