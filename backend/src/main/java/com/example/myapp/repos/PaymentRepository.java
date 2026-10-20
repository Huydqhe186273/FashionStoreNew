package com.example.myapp.repos;

import com.example.myapp.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    @Query("SELECT p FROM Payment p WHERE p.Order.OrderId = :orderId")
    List<Payment> findByOrderOrderId(@Param("orderId") Integer orderId);

    @Query("SELECT p FROM Payment p WHERE p.TransactionId = :transactionId")
    Optional<Payment> findByTransactionId(@Param("transactionId") String transactionId);
}
