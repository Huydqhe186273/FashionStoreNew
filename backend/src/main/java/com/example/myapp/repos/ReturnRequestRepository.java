package com.example.myapp.repos;

import com.example.myapp.entity.ReturnRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Integer> {

    @Query("SELECT r FROM ReturnRequest r WHERE r.Order.OrderId = :orderId ORDER BY r.CreatedAt DESC")
    List<ReturnRequest> findByOrderIdOrderByCreatedAtDesc(@Param("orderId") Integer orderId);

    /**
     * Lấy return request mới nhất của một đơn hàng.
     * Dùng List + lấy phần tử đầu để tránh "LIMIT" không tương thích SQL Server trong JPQL.
     */
    @Query("SELECT r FROM ReturnRequest r WHERE r.Order.OrderId = :orderId ORDER BY r.CreatedAt DESC")
    List<ReturnRequest> findAllByOrderIdOrderByCreatedAtDesc(@Param("orderId") Integer orderId);

    @Query("SELECT r FROM ReturnRequest r WHERE r.Order.User.UserId = :userId ORDER BY r.CreatedAt DESC")
    List<ReturnRequest> findByUserIdOrderByCreatedAtDesc(@Param("userId") Integer userId);

    default Optional<ReturnRequest> findLatestByOrderId(Integer orderId) {
        List<ReturnRequest> list = findAllByOrderIdOrderByCreatedAtDesc(orderId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }
}

