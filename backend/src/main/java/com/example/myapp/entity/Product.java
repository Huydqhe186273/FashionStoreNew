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
@Table(name = "Products")
@Getter
@Setter
@NoArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer ProductId;
    private String Name;
    private String Description;
    private BigDecimal BasePrice;
    private BigDecimal DiscountPrice;
    private String Status = "active";
    private Integer ViewCount = 0;
    private Integer SoldCount = 0;
    private LocalDateTime CreatedAt;
    /**
     * Test/seed-only flag. Customers should never see rows where this is true.
     * Default false so existing rows stay visible until the migration marks
     * them (or the dev deletes them).
     */
    private Boolean IsTest = false;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "CategoryId", nullable = false, foreignKey = @ForeignKey(name = "FK_Products_Categories"))
    private Category Category;
    @OneToMany(mappedBy = "Product")
    private List<ProductVariant> ProductVariants = new ArrayList<>();
    @OneToMany(mappedBy = "Product")
    private List<ProductImage> ProductImages = new ArrayList<>();
}