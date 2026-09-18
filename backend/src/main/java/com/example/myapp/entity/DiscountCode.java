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
@Table(name = "DiscountCodes")
@Getter
@Setter
@NoArgsConstructor
public class DiscountCode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer DiscountCodeId;
    private String Code;
    private String DiscountType;
    private BigDecimal Value;
    private BigDecimal MinOrderValue;
    private LocalDateTime StartDate;
    private LocalDateTime EndDate;
    private Integer UsageLimit;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "CreatedBy", nullable = false, foreignKey = @ForeignKey(name = "FK_Discount_CreatedBy"))
    private User CreatedBy;
    @OneToMany(mappedBy = "DiscountCode")
    private List<Order> Orders = new ArrayList<>();
}