package com.example.myapp.model;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReviewableProductDTO {
    private Integer orderId;
    private Integer orderItemId;
    private Integer productId;
    private String productName;
    private String imageUrl;
    private String color;
    private String size;
    private Integer quantity;
    private Integer rating;
    private String comment;
    private LocalDateTime reviewedAt;
}