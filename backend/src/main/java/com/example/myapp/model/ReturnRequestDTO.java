package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnRequestDTO {
    private Integer returnId;
    private Integer orderId;
    private String reason;
    private String status;
    private BigDecimal refundAmount;
    private LocalDateTime createdAt;
    private String bankName;
    private String bankAccount;
    private String accountHolder;
    private String adminNote;
}
