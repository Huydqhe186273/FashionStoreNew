package com.example.myapp.model;

import lombok.Data;

@Data
public class AddToCartRequestDTO {
    private Integer variantId;
    private Integer quantity;
}
