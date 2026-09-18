package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ProductSimilarity")
@Getter
@Setter
@NoArgsConstructor
public class ProductSimilarity {
    @EmbeddedId
    private ProductSimilarityId Id;
    private BigDecimal SimilarityScore;
    private LocalDateTime UpdatedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("ProductIdA")
    @JoinColumn(name = "ProductIdA", nullable = false, foreignKey = @ForeignKey(name = "FK_Similarity_A"))
    private Product ProductA;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("ProductIdB")
    @JoinColumn(name = "ProductIdB", nullable = false, foreignKey = @ForeignKey(name = "FK_Similarity_B"))
    private Product ProductB;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    public static class ProductSimilarityId implements Serializable {
        @Column(name = "ProductIdA")
        private Integer ProductIdA;
        @Column(name = "ProductIdB")
        private Integer ProductIdB;
    }
}