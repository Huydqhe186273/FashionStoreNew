package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "Favorites", uniqueConstraints = @UniqueConstraint(columnNames = {"UserId", "ProductId"}))
@Getter
@Setter
@NoArgsConstructor
public class Favorite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer FavoriteId;
    private LocalDateTime CreatedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "UserId", nullable = false, foreignKey = @ForeignKey(name = "FK_Favorites_Users"))
    private User User;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ProductId", nullable = false, foreignKey = @ForeignKey(name = "FK_Favorites_Products"))
    private Product Product;
}