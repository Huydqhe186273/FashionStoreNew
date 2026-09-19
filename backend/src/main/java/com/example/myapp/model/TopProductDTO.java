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
public class TopProductDTO {
    private Integer productId;
    private String name;
    private String categoryName;
    private BigDecimal basePrice;
    private BigDecimal discountPrice;
    private Integer soldCount;
    private Integer viewCount;
    private String primaryImageUrl;
    private String status;
}
