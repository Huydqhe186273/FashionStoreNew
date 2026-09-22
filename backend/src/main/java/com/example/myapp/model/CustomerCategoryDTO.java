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
public class CustomerCategoryDTO {
    private Integer categoryId;
    private String name;
    private String gender;
    private String season;
    private Integer parentId;
    private String parentName;
    private Long productCount;
    private List<CustomerCategoryDTO> children;
}
