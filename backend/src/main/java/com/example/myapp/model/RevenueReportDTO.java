package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class RevenueReportDTO {
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalRevenue;
    private long totalDeliveredOrders;
    private BigDecimal averageOrderValue;
    private List<DailyRevenueDTO> dailyBreakdown;
    private List<RecentOrderDTO> deliveredOrders;

    public RevenueReportDTO() {
    }
}
