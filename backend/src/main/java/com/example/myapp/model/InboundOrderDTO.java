package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class InboundOrderDTO {
    private Integer inboundOrderId;
    private String batchCode;
    private Integer categoryId;
    private String categoryName;
    private String supplierName;
    private LocalDateTime importDate;
    private BigDecimal totalAmount;
    private String note;
    private String status;
    private Integer totalItems;
    private Integer totalQuantity;
    private String createdByName;
    private LocalDateTime createdAt;
    private List<InboundBatchItemDTO> items;

    public InboundOrderDTO() {
    }
}
