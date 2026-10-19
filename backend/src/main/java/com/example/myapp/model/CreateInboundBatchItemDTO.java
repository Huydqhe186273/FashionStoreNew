package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
public class CreateInboundBatchItemDTO {
    private Integer variantId;
    private Integer quantity;
    private BigDecimal importPrice;

    public CreateInboundBatchItemDTO() {
    }
}
