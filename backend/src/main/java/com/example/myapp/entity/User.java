package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Users")
@Getter
@Setter
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer UserId;
    private String FullName;
    private String Email;
    private String PasswordHash;
    private String Phone;
    private String Role = "customer";
    private String Status = "active";
    private LocalDateTime CreatedAt;

    @OneToMany(mappedBy = "User")
    private List<Address> Addresses = new ArrayList<>();
    @OneToMany(mappedBy = "User")
    private List<Order> Orders = new ArrayList<>();
    @OneToMany(mappedBy = "User")
    private List<Favorite> Favorites = new ArrayList<>();
    @OneToMany(mappedBy = "User")
    private List<Review> Reviews = new ArrayList<>();
    @OneToOne(mappedBy = "User")
    private Cart Cart;
}