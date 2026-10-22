package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class DailyRevenueDTO {
    private LocalDate date;
    private String formattedDate;
    private BigDecimal revenue;
    private long orderCount;

    public DailyRevenueDTO() {
    }
}
