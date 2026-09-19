package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Categories")
@Getter
@Setter
@NoArgsConstructor
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer CategoryId;
    private String Name;
    private String Gender;
    private String Season;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ParentId", foreignKey = @ForeignKey(name = "FK_Categories_Parent"))
    private Category Parent;

    @OneToMany(mappedBy = "Parent")
    private List<Category> Children = new ArrayList<>();
    @OneToMany(mappedBy = "Category")
    private List<Product> Products = new ArrayList<>();
}