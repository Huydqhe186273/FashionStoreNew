package com.example.myapp.repos;

import com.example.myapp.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    @Query("SELECT COALESCE(SUM(o.TotalAmount), 0) FROM Order o WHERE o.OrderStatus <> 'cancelled'")
    BigDecimal sumTotalRevenue();

    @Query("SELECT COALESCE(SUM(o.TotalAmount), 0) FROM Order o WHERE o.OrderStatus = :status")
    BigDecimal sumTotalRevenueByStatus(@Param("status") String status);

    long countByOrderStatus(String orderStatus);

    List<Order> findTop10ByOrderByCreatedAtDesc();

    @Query("SELECT FUNCTION('MONTH', o.CreatedAt) as month, SUM(o.TotalAmount) as total, COUNT(o.OrderId) as orderCount " +
           "FROM Order o WHERE o.OrderStatus <> 'cancelled' " +
           "GROUP BY FUNCTION('MONTH', o.CreatedAt) " +
           "ORDER BY month ASC")
    List<Object[]> findMonthlyRevenueStats();
}
