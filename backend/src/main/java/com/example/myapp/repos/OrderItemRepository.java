package com.example.myapp.repos;

import com.example.myapp.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

    @Query("SELECT CASE WHEN COUNT(oi) > 0 THEN true ELSE false END FROM OrderItem oi WHERE oi.Variant.VariantId = :variantId")
    boolean existsByVariantId(@Param("variantId") Integer variantId);

    @Query("SELECT DISTINCT oi FROM OrderItem oi " +
        "JOIN FETCH oi.Order o " +
        "JOIN FETCH oi.Variant v " +
        "JOIN FETCH v.Product p " +
        "LEFT JOIN FETCH p.ProductImages " +
        "WHERE o.User.UserId = :userId " +
            "AND LOWER(o.PaymentStatus) = 'paid' " +
            "AND LOWER(o.OrderStatus) = 'confirmed' " +
        "ORDER BY o.CreatedAt DESC")
    List<OrderItem> findPaidItemsByUserId(@Param("userId") Integer userId);

    @Query("SELECT oi FROM OrderItem oi " +
        "JOIN FETCH oi.Order o " +
        "JOIN FETCH oi.Variant v " +
        "JOIN FETCH v.Product p " +
        "WHERE oi.OrderItemId = :orderItemId " +
        "AND o.User.UserId = :userId " +
            "AND LOWER(o.PaymentStatus) = 'paid' " +
            "AND LOWER(o.OrderStatus) = 'confirmed'")
    Optional<OrderItem> findPaidItemByIdAndUserId(
        @Param("orderItemId") Integer orderItemId,
        @Param("userId") Integer userId);
}

