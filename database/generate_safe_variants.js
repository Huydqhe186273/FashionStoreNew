const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const seedPath = path.join(__dirname, 'SeedData.sql');
const seed = fs.readFileSync(seedPath, 'utf8');

const regex = /INSERT INTO ProductVariants \(ProductId, Size, Color, StockQuantity, Sku\) VALUES\s*([\s\S]*?);/g;
let match;
let chunks = [];

while ((match = regex.exec(seed)) !== null) {
  chunks.push(match[1].trim());
}

console.log(`Found ${chunks.length} batches of variant inserts.`);

let sql = `/* V006 Safe Variant Seeder (Method B) */
USE FashionStoreDB;
GO

SET XACT_ABORT ON;
BEGIN TRAN;

-- 1. Create temporary table
IF OBJECT_ID('tempdb..#TempVariants') IS NOT NULL DROP TABLE #TempVariants;

CREATE TABLE #TempVariants (
    ProductId INT,
    Size NVARCHAR(50),
    Color NVARCHAR(50),
    StockQuantity INT,
    Sku NVARCHAR(100)
);
GO
`;

// Insert into #TempVariants in batches
chunks.forEach((chunk, i) => {
  sql += `\nINSERT INTO #TempVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES\n${chunk};\nGO\n`;
});

sql += `
-- 2. Safely insert only variants for existing products and without duplicate SKUs
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku)
SELECT t.ProductId, t.Size, t.Color, t.StockQuantity, t.Sku
FROM #TempVariants t
INNER JOIN Products p ON p.ProductId = t.ProductId
WHERE NOT EXISTS (
    SELECT 1 FROM ProductVariants pv WHERE pv.Sku = t.Sku
);

PRINT N'Inserted ' + CAST(@@ROWCOUNT AS NVARCHAR(20)) + N' new ProductVariants.';

-- 3. Register batches in InboundOrders and InboundBatches for FIFO support
IF NOT EXISTS (SELECT 1 FROM InboundOrders WHERE BatchCode = 'INIT-STOCK-2026')
BEGIN
    INSERT INTO InboundOrders (BatchCode, CategoryId, SupplierName, ImportDate, TotalAmount, Note, Status)
    VALUES ('INIT-STOCK-2026', NULL, N'Tồn kho ban đầu hệ thống', '2026-01-01 00:00:00', 0, N'Tự động khởi tạo từ tồn kho sẵn có để vận hành FIFO', 'COMPLETED');
END;

DECLARE @InitialInboundId INT = (SELECT TOP 1 InboundOrderId FROM InboundOrders WHERE BatchCode = 'INIT-STOCK-2026');

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
WHERE pv.StockQuantity > 0
  AND NOT EXISTS (
      SELECT 1 FROM InboundBatches ib WHERE ib.VariantId = pv.VariantId
  );

PRINT N'Registered ' + CAST(@@ROWCOUNT AS NVARCHAR(20)) + N' InboundBatches for FIFO tracking.';

DROP TABLE #TempVariants;

COMMIT TRAN;
PRINT N'SUCCESS: Variant seeding and FIFO batch initialization completed.';
GO
`;

const outputPath = path.join(__dirname, 'SafeSeedVariants.sql');
fs.writeFileSync(outputPath, sql, 'utf8');
console.log('SQL script written to:', outputPath);
