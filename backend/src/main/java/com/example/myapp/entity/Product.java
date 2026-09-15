package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "Products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ProductId")
    private Integer productId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CategoryId", nullable = false)
    private Category category;

    @Column(name = "Name", nullable = false, length = 200)
    private String name;

    @Column(name = "Description")
    private String description;

    @Column(name = "BasePrice", nullable = false)
    private BigDecimal basePrice;

    @Column(name = "DiscountPrice")
    private BigDecimal discountPrice;

    @Column(name = "Status", nullable = false, length = 20)
    private String status;

    @Column(name = "ViewCount", nullable = false)
    private Integer viewCount;

    @Column(name = "SoldCount", nullable = false)
    private Integer soldCount;

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ProductVariant> variants;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ProductImage> images;
}
