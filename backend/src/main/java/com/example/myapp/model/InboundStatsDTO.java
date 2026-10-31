package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InboundStatsDTO {
    private long totalOrders;
    private long totalBatches;
    private long activeBatches;
    private long depletedBatches;
    private long totalRemainingStock;
}
