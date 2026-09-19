package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Recommendations")
@Getter
@Setter
@NoArgsConstructor
public class Recommendation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer RecommendationId;
    private String SessionId;
    private String Reason;
    private BigDecimal Score;
    private LocalDateTime CreatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserId", foreignKey = @ForeignKey(name = "FK_Recommend_Users"))
    private User User;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ProductId", nullable = false, foreignKey = @ForeignKey(name = "FK_Recommend_Products"))
    private Product Product;
}