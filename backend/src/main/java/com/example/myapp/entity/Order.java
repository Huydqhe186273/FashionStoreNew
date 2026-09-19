package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Orders")
@Getter
@Setter
@NoArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer OrderId;
    private String OrderStatus = "pending";
    private String PaymentStatus = "unpaid";
    private BigDecimal TotalAmount;
    private LocalDateTime CreatedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "UserId", nullable = false, foreignKey = @ForeignKey(name = "FK_Orders_Users"))
    private User User;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "AddressId", nullable = false, foreignKey = @ForeignKey(name = "FK_Orders_Addresses"))
    private Address Address;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DiscountCodeId", foreignKey = @ForeignKey(name = "FK_Orders_Discount"))
    private DiscountCode DiscountCode;
    @OneToMany(mappedBy = "Order")
    private List<OrderItem> OrderItems = new ArrayList<>();
    @OneToMany(mappedBy = "Order")
    private List<Payment> Payments = new ArrayList<>();
    @OneToMany(mappedBy = "Order")
    private List<ReturnRequest> ReturnRequests = new ArrayList<>();
}