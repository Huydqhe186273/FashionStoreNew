package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Aggregated facets for the customer product filter sidebar.
 *
 * Returned by GET /api/customer/filters. The frontend renders
 * the size/color/gender pills dynamically based on what the
 * database actually has, so dead options never appear and the
 * shopper sees accurate counts per choice.
 *
 * Buckets are inclusive on the lower bound, exclusive on the
 * upper bound, except for the last bucket which is inclusive
 * on both ends (e.g. 1tr+ covers everything ≥ 1,000,000 VND).
 *
 * The "smart" facets (quality flags + completeness buckets) are
 * computed against the active-product set so the sidebar can
 * highlight only the products that have real photos, real
 * descriptions, real variants, etc. — instead of dead rows.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FilterFacetsDTO {

    /** Each option a shopper can pick; includes a hex swatch for colors. */
    private List<FacetOptionDTO> sizes;
    private List<FacetOptionDTO> colors;
    private List<FacetOptionDTO> genders;

    /** Min/max price across active products; null if empty. */
    private Long minPrice;
    private Long maxPrice;

    /** Pre-computed price buckets the frontend can render as quick chips. */
    private List<PriceBucketDTO> priceBuckets;

    // ===== Smart quality facets =====

    /** True iff every active product has at least one image. */
    private boolean allHaveImages;
    private boolean allHaveDescription;
    private boolean allHaveDiscount;

    /** Number of products that pass each quality flag (for count badges). */
    private long productsWithImages;
    private long productsWithDescription;
    private long productsWithDiscount;
    private long productsComplete;          // has image AND description AND ≥1 variant
    private long productsInStock;
    private long productsWithMultipleSizes;   // ≥3 distinct sizes
    private long productsWithMultipleColors;  // ≥2 distinct colors

    /** Pre-computed discount-percent buckets the sidebar renders as chips. */
    private List<DiscountBucketDTO> discountBuckets;

    /** Pre-computed "popularity" buckets (sold-count thresholds). */
    private List<PopularityBucketDTO> popularityBuckets;
}
