package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class CreateInboundOrderRequestDTO {
    private String batchCode;
    private Integer categoryId;
    private String supplierName;
    private LocalDateTime importDate;
    private String note;
    private List<CreateInboundBatchItemDTO> items;

    public CreateInboundOrderRequestDTO() {
    }
}
