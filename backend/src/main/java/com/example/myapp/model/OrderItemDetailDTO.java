package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDetailDTO {
    private Integer orderItemId;
    private Integer productId;
    private String productName;
    private String size;
    private String color;
    private Integer quantity;
    private BigDecimal priceAtPurchase;
    private BigDecimal subTotal;
    private String imageUrl;
}
