package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffOrderListItemDTO {
    private Integer orderId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String orderStatus;
    private String paymentStatus;
    private BigDecimal totalAmount;
    private Integer itemCount;
    private LocalDateTime createdAt;
    private String shippingAddress;
    private String returnStatus;
    private String returnReason;
    private BigDecimal refundAmount;
}
