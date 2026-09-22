package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ProductVariants")
@Getter
@Setter
@NoArgsConstructor
public class ProductVariant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer VariantId;
    @Column(columnDefinition = "NVARCHAR(50)")
    private String Size;
    @Column(columnDefinition = "NVARCHAR(50)")
    private String Color;
    private Integer StockQuantity = 0;
    private String Sku;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ProductId", nullable = false, foreignKey = @ForeignKey(name = "FK_Variants_Products"))
    private Product Product;
}