package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class BestSellerProductDTO {
    private Integer productId;
    private String productName;
    private String categoryName;
    private String primaryImageUrl;
    private BigDecimal basePrice;
    private BigDecimal discountPrice;
    private long totalQuantitySold;
    private BigDecimal totalRevenue;
    private Integer currentStock;

    public BestSellerProductDTO() {
    }
}
