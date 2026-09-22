package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariantInfoDTO {
    private Integer variantId;
    private String size;
    private String color;
    private Integer stockQuantity;
    private String sku;
}
