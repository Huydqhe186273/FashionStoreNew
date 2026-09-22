package com.example.myapp.model;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CartDTO {
    private Integer cartId;
    private List<CartItemDTO> items;
    private BigDecimal totalAmount;
}
