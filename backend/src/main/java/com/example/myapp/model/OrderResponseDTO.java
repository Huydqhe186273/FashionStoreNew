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
public class OrderResponseDTO {
    private Integer orderId;
    private String orderStatus;
    private String paymentStatus;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;

    // Thông tin người nhận & Địa chỉ
    private String recipientName;
    private String phone;
    private String addressLine;
    private String city;

    // Mã giảm giá (nếu có)
    private String discountCode;
    private String discountType;
    private BigDecimal discountValue;

    // Danh sách món hàng
    private int itemCount;
    private boolean canCancel;
    private boolean canReturn;
    private String returnStatus;
    private String returnReason;
    private List<OrderItemDetailDTO> items;
}
