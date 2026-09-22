package com.example.myapp.model;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CartItemDTO {
    private Integer cartItemId;
    private Integer variantId;
    private Integer productId;
    private String productName;
    private String size;
    private String color;
    private BigDecimal price;
    private Integer quantity;
    private BigDecimal subTotal;
}
