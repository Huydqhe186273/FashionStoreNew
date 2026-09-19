package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ProductImages")
@Getter
@Setter
@NoArgsConstructor
public class ProductImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer ImageId;
    private String ImageUrl;
    private Boolean IsPrimary = false;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ProductId", nullable = false, foreignKey = @ForeignKey(name = "FK_Images_Products"))
    private Product Product;
}