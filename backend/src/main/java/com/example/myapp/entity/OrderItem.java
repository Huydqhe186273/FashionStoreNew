package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "OrderItems")
@Getter
@Setter
@NoArgsConstructor
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer OrderItemId;
    private Integer Quantity;
    private BigDecimal PriceAtPurchase;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "OrderId", nullable = false, foreignKey = @ForeignKey(name = "FK_OrderItems_Orders"))
    private Order Order;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "VariantId", nullable = false, foreignKey = @ForeignKey(name = "FK_OrderItems_Variants"))
    private ProductVariant Variant;
    @OneToMany(mappedBy = "OrderItem")
    private List<Review> Reviews = new ArrayList<>();
}