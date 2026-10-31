package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatrixGenerateVariantsRequestDTO {
    private Integer productId;
    private List<String> colors;
    private List<String> sizes;
    private Integer initialStock;
    private String customSkuPrefix;
}
