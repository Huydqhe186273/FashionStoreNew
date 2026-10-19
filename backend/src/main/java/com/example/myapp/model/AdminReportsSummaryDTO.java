package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class AdminReportsSummaryDTO {
    private LocalDate startDate;
    private LocalDate endDate;
    private RevenueReportDTO revenueReport;
    private OrderReportDTO orderReport;
    private BestSellerReportDTO bestSellerReport;

    public AdminReportsSummaryDTO() {
    }
}
