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

    @Query("SELECT p FROM Payment p WHERE p.Order.OrderId = :orderId AND LOWER(p.Status) = 'success' "
        + "AND p.PayerBankAccount IS NOT NULL AND p.PayerBankAccount <> '' "
        + "ORDER BY p.PaidAt DESC, p.PaymentId DESC")
    List<Payment> findSuccessfulPaymentsWithPayerAccount(@Param("orderId") Integer orderId);

    @Query("SELECT p FROM Payment p WHERE p.Order.OrderId = :orderId ORDER BY p.PaidAt DESC, p.PaymentId DESC")
    List<Payment> findByOrderOrderIdDesc(@Param("orderId") Integer orderId);

    @Query("SELECT p FROM Payment p WHERE p.TransactionId = :transactionId")
    Optional<Payment> findByTransactionId(@Param("transactionId") String transactionId);
}
