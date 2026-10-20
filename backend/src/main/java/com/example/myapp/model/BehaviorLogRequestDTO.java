package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BehaviorLogRequestDTO {
    private Integer userId;
    private String sessionId;
    private Integer productId;
    private String actionType; // view, search, click, add_to_cart, favorite, purchase
    private Integer durationSeconds;
}
