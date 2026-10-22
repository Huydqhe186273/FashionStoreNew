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
public class StaffOrderItemDTO {
    private Integer orderItemId;
    private Integer variantId;
    private Integer productId;
    private String productName;
    private String size;
    private String color;
    private String sku;
    private Integer quantity;
    private BigDecimal priceAtPurchase;
    private BigDecimal subtotal;
    private Integer currentStockQuantity;
}
