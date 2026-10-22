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

        @Query("SELECT r FROM Review r WHERE r.Product.ProductId = :productId " +
            "AND r.OrderItem.Variant.Product.ProductId = :productId " +
            "AND r.User.UserId = r.OrderItem.Order.User.UserId " +
            "AND LOWER(r.OrderItem.Order.PaymentStatus) = 'paid' " +
            "AND LOWER(r.OrderItem.Order.OrderStatus) NOT IN ('cancelled', 'returned') " +
            "ORDER BY r.CreatedAt DESC")
    List<Review> findReviewsByProductOrderByCreatedAtDesc(@Param("productId") Integer productId);

        @Query("SELECT COUNT(r) FROM Review r WHERE r.Product.ProductId = :productId " +
            "AND r.OrderItem.Variant.Product.ProductId = :productId " +
            "AND r.User.UserId = r.OrderItem.Order.User.UserId " +
            "AND LOWER(r.OrderItem.Order.PaymentStatus) = 'paid' " +
            "AND LOWER(r.OrderItem.Order.OrderStatus) NOT IN ('cancelled', 'returned')")
    long countReviewsByProduct(@Param("productId") Integer productId);

        @Query("SELECT AVG(r.Rating) FROM Review r WHERE r.Product.ProductId = :productId " +
            "AND r.OrderItem.Variant.Product.ProductId = :productId " +
            "AND r.User.UserId = r.OrderItem.Order.User.UserId " +
            "AND LOWER(r.OrderItem.Order.PaymentStatus) = 'paid' " +
            "AND LOWER(r.OrderItem.Order.OrderStatus) NOT IN ('cancelled', 'returned')")
    Double averageRatingByProductId(@Param("productId") Integer productId);

        @Query("SELECT r FROM Review r WHERE r.OrderItem.OrderItemId IN :orderItemIds AND r.User.UserId = :userId")
        List<Review> findByOrderItemIdsAndUserId(
            @Param("orderItemIds") List<Integer> orderItemIds,
            @Param("userId") Integer userId);

        @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Review r " +
            "WHERE r.OrderItem.OrderItemId = :orderItemId AND r.User.UserId = :userId")
        boolean existsByOrderItemIdAndUserId(
            @Param("orderItemId") Integer orderItemId,
            @Param("userId") Integer userId);

    @Query("SELECT r.Product.ProductId, AVG(r.Rating), COUNT(r) FROM Review r " +
            "WHERE r.Product.ProductId IN :productIds GROUP BY r.Product.ProductId")
    List<Object[]> findRatingSummariesByProductIds(@Param("productIds") List<Integer> productIds);
}
