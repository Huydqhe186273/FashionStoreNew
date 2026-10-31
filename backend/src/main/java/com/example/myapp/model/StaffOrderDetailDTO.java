package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffOrderDetailDTO {
    private Integer orderId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String recipientName;
    private String recipientPhone;
    private String shippingAddress;
    private String orderStatus;
    private String paymentStatus;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private List<StaffOrderItemDTO> items;
    private ReturnRequestDTO returnRequest;
}
