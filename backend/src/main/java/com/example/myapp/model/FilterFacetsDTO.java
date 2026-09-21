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
}
