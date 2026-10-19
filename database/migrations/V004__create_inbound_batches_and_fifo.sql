IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InboundOrders')
BEGIN
    CREATE TABLE InboundOrders (
        InboundOrderId INT IDENTITY(1,1) PRIMARY KEY,
        BatchCode NVARCHAR(50) NOT NULL UNIQUE,
        CategoryId INT NULL,
        SupplierName NVARCHAR(150) NULL,
        ImportDate DATETIME2 NOT NULL DEFAULT GETDATE(),
        TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        Note NVARCHAR(500) NULL,
        CreatedBy INT NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_InboundOrders_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId) ON DELETE SET NULL,
        CONSTRAINT FK_InboundOrders_Users FOREIGN KEY (CreatedBy) REFERENCES Users(UserId) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InboundBatches')
BEGIN
    CREATE TABLE InboundBatches (
        BatchId INT IDENTITY(1,1) PRIMARY KEY,
        InboundOrderId INT NOT NULL,
        VariantId INT NOT NULL,
        InitialQuantity INT NOT NULL,
        RemainingQuantity INT NOT NULL,
        ImportPrice DECIMAL(18,2) NOT NULL DEFAULT 0,
        Status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        ImportDate DATETIME2 NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_InboundBatches_Orders FOREIGN KEY (InboundOrderId) REFERENCES InboundOrders(InboundOrderId) ON DELETE CASCADE,
        CONSTRAINT FK_InboundBatches_Variants FOREIGN KEY (VariantId) REFERENCES ProductVariants(VariantId) ON DELETE CASCADE
    );
END;

-- Tự động khởi tạo tồn kho hiện có thành 'Lô tồn ban đầu' nếu chưa có lô nào
IF NOT EXISTS (SELECT 1 FROM InboundOrders WHERE BatchCode = 'INIT-STOCK-2026')
BEGIN
    IF EXISTS (SELECT 1 FROM ProductVariants WHERE StockQuantity > 0)
    BEGIN
        INSERT INTO InboundOrders (BatchCode, CategoryId, SupplierName, ImportDate, TotalAmount, Note, Status)
        VALUES ('INIT-STOCK-2026', NULL, N'Tồn kho ban đầu hệ thống', '2026-01-01 00:00:00', 0, N'Tự động khởi tạo từ tồn kho sẵn có để vận hành FIFO', 'COMPLETED');

        DECLARE @InitialInboundId INT = SCOPE_IDENTITY();

        INSERT INTO InboundBatches (InboundOrderId, VariantId, InitialQuantity, RemainingQuantity, ImportPrice, Status, ImportDate)
        SELECT 
            @InitialInboundId,
            pv.VariantId,
            pv.StockQuantity,
            pv.StockQuantity,
            ISNULL(p.BasePrice * 0.7, 0),
            'ACTIVE',
            '2026-01-01 00:00:00'
        FROM ProductVariants pv
        INNER JOIN Products p ON pv.ProductId = p.ProductId
        WHERE pv.StockQuantity > 0;
    END;
END;
