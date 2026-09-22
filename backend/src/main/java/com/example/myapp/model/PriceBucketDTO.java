package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * One preset price range (e.g. "Từ 200k đến 500k").
 *
 * Buckets are inclusive on the lower bound, exclusive on the
 * upper bound, except for the last bucket which uses maxPrice
 * as both bounds so it captures the tail.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceBucketDTO {
    private String label;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private long count;
}
