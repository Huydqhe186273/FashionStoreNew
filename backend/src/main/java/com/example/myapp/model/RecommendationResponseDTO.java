package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Kết quả gợi ý cho trang chủ.
 * <ul>
 *   <li>{@code source = "personalized"}: gợi ý theo hành vi; {@code basedOnCategories} là các danh mục làm lý do.</li>
 *   <li>{@code source = "cold_start"}: chưa đủ dữ liệu hành vi, trả về bán chạy + hàng mới.</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponseDTO {
    private String source;
    private List<String> basedOnCategories;
    private List<CustomerProductDTO> products;
}
