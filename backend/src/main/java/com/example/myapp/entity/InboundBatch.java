package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "InboundBatches")
@Getter
@Setter
public class InboundBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer batchId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "InboundOrderId", nullable = false, foreignKey = @ForeignKey(name = "FK_InboundBatches_Orders"))
    private InboundOrder inboundOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "VariantId", nullable = false, foreignKey = @ForeignKey(name = "FK_InboundBatches_Variants"))
    private ProductVariant variant;

    @Column(name = "InitialQuantity", nullable = false)
    private Integer initialQuantity;

    @Column(name = "RemainingQuantity", nullable = false)
    private Integer remainingQuantity;

    @Column(name = "ImportPrice", nullable = false, precision = 18, scale = 2)
    private BigDecimal importPrice = BigDecimal.ZERO;

    @Column(name = "Status", nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE or DEPLETED

    @Column(name = "ImportDate", nullable = false)
    private LocalDateTime importDate = LocalDateTime.now();

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public InboundBatch() {
    }
}
