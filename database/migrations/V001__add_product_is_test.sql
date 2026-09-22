/* ============================================================
   FASHION STORE — DDL migration 001
   ------------------------------------------------------------
   Adds IsTest flag to Products so seed/demo rows can be hidden
   from the customer-facing APIs without dropping data.

   Apply with:
     sqlcmd -S <server> -d FashionStoreDB -i V001__add_product_is_test.sql

   IMPORTANT: this is a soft-delete flag, not a hard delete.
   To actually scrub test rows from production:
     DELETE FROM Products WHERE IsTest = 1;
   ============================================================ */

IF COL_LENGTH('dbo.Products', 'IsTest') IS NULL
BEGIN
    ALTER TABLE dbo.Products
        ADD IsTest BIT NOT NULL CONSTRAINT DF_Products_IsTest DEFAULT 0;
END
GO

-- Mark the seed placeholder from database/DB ("Áo phông nam …") as test
-- so it stops showing up to customers. Lower-case collation-safe.
IF EXISTS (
    SELECT 1 FROM dbo.Products
    WHERE LOWER(Name) LIKE N'%siêu cấp vip pro%'
       OR LOWER(Name) LIKE N'%sie%' COLLATE SQL_Latin1_General_CP1_CI_AS
)
BEGIN
    UPDATE p
       SET IsTest = 1
      FROM dbo.Products p
     WHERE LOWER(p.Name) LIKE N'%siêu cấp vip pro%';
END
GO

-- Sanity safety net: any leftover "Karen"/"Bum"/Hanji placeholder words
-- from the old DB stub are also flagged as test.
IF EXISTS (SELECT 1 FROM dbo.Products WHERE LOWER(Name) LIKE N'%karen%')
    UPDATE Products SET IsTest = 1 WHERE LOWER(Name) LIKE N'%karen%';
GO

-- Quick verification query (run manually, expected = 0 customer-visible test rows)
-- SELECT COUNT(*) FROM Products WHERE IsTest = 0 AND Status = 'active';
GO

/* ============================================================
   V001 (cont.) — Categories.Name uniqueness
   ------------------------------------------------------------
   Two seed sources (database/DB stub + database/SeedData.sql)
   both insert 'Áo', 'Quần', 'Váy', 'Áo khoác', 'Giày', 'Phụ
   kiện' with different IDs. Result: customers see "Tất cả" tabs
   labelled both 'Áo' and 'Áo thun'. The fix is a unique index on
   the canonical name so duplicates can't be inserted twice.
   ============================================================ */
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_Categories_Name' AND object_id = OBJECT_ID('dbo.Categories')
)
BEGIN
    CREATE UNIQUE INDEX UX_Categories_Name ON dbo.Categories(Name);
END
GO

