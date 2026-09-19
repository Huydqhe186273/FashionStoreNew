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
public class RevenueChartDTO {
    private String label; // e.g. "Tháng 1", "Tháng 2", ...
    private BigDecimal revenue;
    private long orderCount;
}
