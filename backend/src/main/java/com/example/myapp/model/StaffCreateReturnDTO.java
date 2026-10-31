package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffCreateReturnDTO {
    private String reason;
    private BigDecimal refundAmount;
    private String bankName;
    private String bankAccount;
    private String accountHolder;
    private String adminNote;
    private Boolean restock;
}
