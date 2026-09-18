package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "CartItems")
@Getter
@Setter
@NoArgsConstructor
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer CartItemId;
    private Integer Quantity = 1;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "CartId", nullable = false, foreignKey = @ForeignKey(name = "FK_CartItems_Carts"))
    private Cart Cart;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "VariantId", nullable = false, foreignKey = @ForeignKey(name = "FK_CartItems_Variants"))
    private ProductVariant Variant;
}