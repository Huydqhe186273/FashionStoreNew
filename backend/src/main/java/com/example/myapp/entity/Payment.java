package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Payments")
@Getter
@Setter
@NoArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer PaymentId;
    private BigDecimal Amount;
    private String PaymentMethod = "PayOS";
    private String TransactionId;
    private String Status = "pending";
    private LocalDateTime PaidAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "OrderId", nullable = false, foreignKey = @ForeignKey(name = "FK_Payments_Orders"))
    private Order Order;
}