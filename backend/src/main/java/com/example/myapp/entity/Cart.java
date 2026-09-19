package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Carts")
@Getter
@Setter
@NoArgsConstructor
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer CartId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "UserId", nullable = false, unique = true, foreignKey = @ForeignKey(name = "FK_Carts_Users"))
    private User User;
    @OneToMany(mappedBy = "Cart")
    private List<CartItem> CartItems = new ArrayList<>();
}