package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDTO {
    private Integer reviewId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private Integer userId;
    private String userName;
    private Integer productId;
    private Integer orderItemId;
}
