package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferenceDTO {
    private Integer userId;
    private List<Integer> preferredCategoryIds;
    private List<String> preferredCategoryNames;
    private BigDecimal preferredPriceMin;
    private BigDecimal preferredPriceMax;
    private List<String> preferredColors;
    private List<String> preferredSizes;
    private LocalDateTime updatedAt;
}
