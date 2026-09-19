package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequestDTO {
    private Integer categoryId;
    private String name;
    private String description;
    private BigDecimal basePrice;
    private BigDecimal discountPrice;
    private String status;
}
