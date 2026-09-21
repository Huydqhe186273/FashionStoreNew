package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProductDTO {
    private Integer productId;
    private String name;
    private String description;
    private BigDecimal basePrice;
    private BigDecimal discountPrice;
    private BigDecimal finalPrice;
    private Integer discountPercent;
    private Integer viewCount;
    private Integer soldCount;
    private Integer totalStock;
    private String status;
    private Integer categoryId;
    private String categoryName;
    private String categoryGender;
    private String categorySeason;
    private List<String> images;
    private String primaryImage;
    private List<VariantInfoDTO> variants;
    private List<String> availableSizes;
    private List<String> availableColors;
}
