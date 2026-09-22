package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Pre-computed discount-percent bucket, e.g. "Giảm ≥ 30%" covers
 * every product whose discount is at least 30 percent off base
 * price. minPercent is the threshold (inclusive); maxPercent is
 * exclusive, except for the highest bucket which uses 100 as
 * the inclusive ceiling.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscountBucketDTO {
    private String label;
    private int minPercent;
    private int maxPercent;   // exclusive; 100 = ∞
    private long count;
}
