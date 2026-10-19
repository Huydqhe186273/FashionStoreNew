package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariantDTO {
    private Integer variantId;
    private Integer productId;
    private String productName;
    private String size;
    private String color;
    private String sku;
    private Integer stockQuantity;
}
