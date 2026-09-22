package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One choice in a facet list (a single size, color, or gender).
 *
 * - value: the string sent back to the filter API
 * - label: the string rendered in the UI
 * - count: how many ACTIVE products in the catalogue match this value
 * - hex: optional hex color for visual swatches (colors only)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacetOptionDTO {
    private String value;
    private String label;
    private long count;
    private String hex;
}
