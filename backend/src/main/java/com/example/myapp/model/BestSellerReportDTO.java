package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class BestSellerReportDTO {
    private LocalDate startDate;
    private LocalDate endDate;
    private long totalProductsSold;
    private List<BestSellerProductDTO> topProducts;

    public BestSellerReportDTO() {
    }
}
