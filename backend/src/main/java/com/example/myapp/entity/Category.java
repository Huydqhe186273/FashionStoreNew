package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Data
@Entity
@Table(name = "Categories")
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CategoryId")
    private Integer categoryId;

    @Column(name = "Name", nullable = false, length = 100)
    private String name;

    @Column(name = "ParentId")
    private Integer parentId;

    @Column(name = "Gender", length = 20)
    private String gender;

    @Column(name = "Season", length = 20)
    private String season;
    
    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    private List<Product> products;
}
