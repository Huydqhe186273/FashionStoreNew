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
public class ApplyCouponResponseDTO {
    private boolean valid;
    private String code;
    private String discountType; // "percent" or "fixed"
    private BigDecimal value;
    private BigDecimal discountAmount;
    private BigDecimal finalTotal;
    private String message;
}
