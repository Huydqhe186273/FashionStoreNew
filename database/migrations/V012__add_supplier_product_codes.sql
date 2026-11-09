-- Migration V011: Bổ sung mã phiếu giao hàng / số hóa đơn của Nhà cung cấp và Mã sản phẩm / SKU riêng của Nhà cung cấp
-- Hệ thống: FashionStore E-Commerce

IF COL_LENGTH('dbo.InboundOrders', 'SupplierOrderCode') IS NULL
BEGIN
    ALTER TABLE dbo.InboundOrders ADD SupplierOrderCode NVARCHAR(100) NULL;
END
GO

IF COL_LENGTH('dbo.InboundBatches', 'SupplierSku') IS NULL
BEGIN
    ALTER TABLE dbo.InboundBatches ADD SupplierSku NVARCHAR(100) NULL;
END
GO

-- Tự động sinh mã SupplierSku mẫu cho các lô hàng hiện có để tiện hiển thị đối soát
UPDATE InboundBatches
SET SupplierSku = 'SUP-' + pv.Sku
FROM InboundBatches ib
INNER JOIN ProductVariants pv ON ib.VariantId = pv.VariantId
WHERE ib.SupplierSku IS NULL;
GO
