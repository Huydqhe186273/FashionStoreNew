package com.example.myapp.model;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ApplyCouponRequestDTO {
    private String code;
    private BigDecimal orderTotal;
}
