package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class InboundBatchItemDTO {
    private Integer batchId;
    private Integer inboundOrderId;
    private String batchCode;
    private String supplierOrderCode;
    private String supplierName;
    private Integer variantId;
    private String sku; // Mã SKU hệ thống nội bộ
    private String supplierSku; // Mã sản phẩm / SKU của Nhà Cung Cấp
    private String size;
    private String color;
    private Integer productId;
    private String productName;
    private Integer categoryId;
    private String categoryName;
    private Integer initialQuantity;
    private Integer remainingQuantity;
    private BigDecimal importPrice;
    private BigDecimal subtotal;
    private String status;
    private LocalDateTime importDate;
    private LocalDateTime createdAt;
    private Boolean isCurrentFifoActive; // True nếu lô này là lô cũ nhất còn hàng của biến thể (ưu tiên xuất bán)

    public InboundBatchItemDTO() {
    }
}
