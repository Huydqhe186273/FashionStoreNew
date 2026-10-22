package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "InboundOrders")
@Getter
@Setter
public class InboundOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer inboundOrderId;

    @Column(name = "BatchCode", nullable = false, unique = true, length = 50)
    private String batchCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CategoryId", foreignKey = @ForeignKey(name = "FK_InboundOrders_Categories"))
    private Category category;

    @Column(name = "SupplierName", length = 150)
    private String supplierName;

    @Column(name = "ImportDate", nullable = false)
    private LocalDateTime importDate = LocalDateTime.now();

    @Column(name = "TotalAmount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "Note", length = 500)
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CreatedBy", foreignKey = @ForeignKey(name = "FK_InboundOrders_Users"))
    private User createdBy;

    @Column(name = "Status", nullable = false, length = 20)
    private String status = "COMPLETED";

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "inboundOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InboundBatch> batches = new ArrayList<>();

    public InboundOrder() {
    }
}
