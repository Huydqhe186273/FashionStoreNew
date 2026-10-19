package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class OrderStatusCountDTO {
    private String status;
    private String label;
    private String color;
    private long count;
    private double percentage;
    private BigDecimal totalAmount;

    public OrderStatusCountDTO() {
    }
}
