package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Pre-computed "popularity" bucket keyed off SoldCount or ViewCount
 * of an active product. The UI renders these as quick-pick chips
 * so shoppers can jump to "best-seller" or "trending now" without
 * picking exact thresholds.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PopularityBucketDTO {
    private String label;
    /** "sold" or "view" — which counter the threshold applies to. */
    private String metric;
    /** Inclusive minimum (the chip matches products whose count >= min). */
    private int minCount;
    private long count;
}
