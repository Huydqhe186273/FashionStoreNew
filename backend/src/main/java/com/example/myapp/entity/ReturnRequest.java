package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ReturnRequests")
@Getter
@Setter
@NoArgsConstructor
public class ReturnRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer ReturnId;
    private String Reason;
    private String Status = "pending";
    private BigDecimal RefundAmount;
    private LocalDateTime CreatedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "OrderId", nullable = false, foreignKey = @ForeignKey(name = "FK_Return_Orders"))
    private Order Order;
}