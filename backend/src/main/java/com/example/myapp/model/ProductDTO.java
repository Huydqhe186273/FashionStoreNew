package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    private Integer productId;
    private String name;
    private String description;
    private BigDecimal basePrice;
    private BigDecimal discountPrice;
    private String status;
    private Integer viewCount;
    private Integer soldCount;
    private Integer categoryId;
    private String categoryName;
    private LocalDateTime createdAt;
}
