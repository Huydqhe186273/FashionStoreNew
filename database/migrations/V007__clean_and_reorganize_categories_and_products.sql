-- V007 Reorganize Categories, Parents, and Products Mapping Cleanly
USE FashionStoreDB;
GO

SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- 1. Tạm thời tắt ràng buộc và drop unique index để sắp xếp lại
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Categories_Name' AND object_id = OBJECT_ID('dbo.Categories'))
    DROP INDEX UX_Categories_Name ON dbo.Categories;
GO

ALTER TABLE Categories NOCHECK CONSTRAINT ALL;
ALTER TABLE Products NOCHECK CONSTRAINT FK_Products_Categories;
GO

-- 2. Tạm thời chuyển các sản phẩm đang trỏ tới Categories sang Category 1 để tránh xung đột
UPDATE Products SET CategoryId = 1;
GO

-- 3. Xóa các danh mục cũ và nạp lại chuẩn 48 danh mục (12 gốc + 36 con)
DELETE FROM Categories;
GO

SET IDENTITY_INSERT Categories ON;
INSERT INTO Categories (CategoryId, Name, ParentId, Gender, Season) VALUES
-- 12 Danh mục cha (Root - Cấp 1)
(1,  N'Áo thun',   NULL, 'unisex', NULL),
(2,  N'Áo sơ mi',  NULL, 'unisex', NULL),
(3,  N'Áo khoác',  NULL, 'unisex', NULL),
(4,  N'Quần jeans',NULL, 'unisex', NULL),
(5,  N'Quần short',NULL, 'unisex', NULL),
(6,  N'Váy',       NULL, 'nu',     NULL),
(7,  N'Đầm',       NULL, 'nu',     NULL),
(8,  N'Giày',      NULL, 'unisex', NULL),
(9,  N'Túi xách',  NULL, 'unisex', NULL),
(10, N'Phụ kiện',  NULL, 'unisex', NULL),
(11, N'Áo hoodie', NULL, 'unisex', NULL),
(12, N'Áo polo',   NULL, 'unisex', NULL),

-- 36 Danh mục con (Child - Cấp 2)
-- Dưới Áo thun (1):
(13, N'Áo thun nam',   1, 'nam',    NULL),
(14, N'Áo thun nữ',    1, 'nu',     NULL),

-- Dưới Áo sơ mi (2):
(15, N'Áo sơ mi nam',  2, 'nam',    NULL),
(16, N'Áo sơ mi nữ',   2, 'nu',     NULL),

-- Dưới Áo khoác (3):
(17, N'Áo khoác nam',  3, 'nam',    NULL),
(18, N'Áo khoác nữ',   3, 'nu',     NULL),
(19, N'Áo phao',       3, 'unisex', 'winter'),
(20, N'Áo vest',       3, 'unisex', NULL),

-- Dưới Quần jeans (4):
(21, N'Quần jeans nam',4, 'nam',    NULL),
(22, N'Quần jeans nữ', 4, 'nu',     NULL),

-- Dưới Quần short (5):
(23, N'Quần short nam',5, 'nam',    NULL),
(24, N'Quần short nữ', 5, 'nu',     NULL),
(25, N'Quần baggy',    5, 'nu',     NULL),

-- Dưới Váy (6):
(26, N'Váy ngắn',      6, 'nu',     NULL),
(27, N'Váy dài',       6, 'nu',     NULL),
(28, N'Chân váy',      6, 'nu',     NULL),

-- Dưới Đầm (7):
(29, N'Đầm ngắn',      7, 'nu',     NULL),
(30, N'Đầm dài',       7, 'nu',     NULL),
(31, N'Đầm công sở',   7, 'nu',     NULL),
(32, N'Đầm dạ hội',    7, 'nu',     NULL),

-- Dưới Giày (8):
(33, N'Giày thể thao', 8, 'unisex', NULL),
(34, N'Giày da',       8, 'unisex', NULL),
(35, N'Sandal',        8, 'unisex', 'summer'),
(36, N'Giày cao gót',  8, 'nu',     NULL),

-- Dưới Túi xách (9):
(37, N'Balo',          9, 'unisex', NULL),
(38, N'Túi đeo chéo',  9, 'unisex', NULL),
(39, N'Túi xách tay',  9, 'nu',     NULL),
(40, N'Ví nam',        9, 'nam',    NULL),

-- Dưới Phụ kiện (10):
(41, N'Đồng hồ',      10, 'unisex', NULL),
(42, N'Kính mát',     10, 'unisex', NULL),
(43, N'Mũ',           10, 'unisex', NULL),
(44, N'Khăn',         10, 'unisex', NULL),

-- Dưới Áo hoodie (11):
(45, N'Áo hoodie nam', 11, 'nam',   NULL),
(46, N'Áo hoodie nữ',  11, 'nu',    NULL),

-- Dưới Áo polo (12):
(47, N'Áo polo nam',   12, 'nam',   NULL),
(48, N'Áo polo nữ',    12, 'nu',    NULL);

SET IDENTITY_INSERT Categories OFF;
GO

-- 4. Bật lại ràng buộc và tạo lại Unique Index
ALTER TABLE Categories CHECK CONSTRAINT ALL;
ALTER TABLE Products CHECK CONSTRAINT FK_Products_Categories;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Categories_Name' AND object_id = OBJECT_ID('dbo.Categories'))
    CREATE UNIQUE NONCLUSTERED INDEX UX_Categories_Name ON dbo.Categories(Name);
GO

-- 5. Cập nhật lại toàn bộ Sản Phẩm về đúng danh mục chính xác
-- Áo thun nam (13)
UPDATE Products SET CategoryId = 13 WHERE ProductId IN (1, 2, 3);
-- Áo thun nữ (14)
UPDATE Products SET CategoryId = 14 WHERE ProductId IN (4, 5, 6);
-- Áo sơ mi nam (15)
UPDATE Products SET CategoryId = 15 WHERE ProductId IN (7, 8, 9);
-- Áo sơ mi nữ (16)
UPDATE Products SET CategoryId = 16 WHERE ProductId IN (10, 11, 12, 107);
-- Áo khoác nam (17)
UPDATE Products SET CategoryId = 17 WHERE ProductId IN (13, 14, 15);
-- Áo khoác nữ (18)
UPDATE Products SET CategoryId = 18 WHERE ProductId IN (16, 17, 18);
-- Áo phao (19)
UPDATE Products SET CategoryId = 19 WHERE ProductId IN (19, 20, 21);
-- Quần jeans nam (21)
UPDATE Products SET CategoryId = 21 WHERE ProductId IN (22, 23, 24);
-- Quần jeans nữ (22)
UPDATE Products SET CategoryId = 22 WHERE ProductId IN (25, 26, 27);
-- Quần short nam (23)
UPDATE Products SET CategoryId = 23 WHERE ProductId IN (28, 29, 30);
-- Quần short nữ (24)
UPDATE Products SET CategoryId = 24 WHERE ProductId IN (31, 32, 33);
-- Quần baggy (25)
UPDATE Products SET CategoryId = 25 WHERE ProductId IN (34, 35, 36);
-- Váy ngắn (26)
UPDATE Products SET CategoryId = 26 WHERE ProductId IN (37, 38, 39);
-- Váy dài (27)
UPDATE Products SET CategoryId = 27 WHERE ProductId IN (40, 41, 42);
-- Đầm ngắn (29)
UPDATE Products SET CategoryId = 29 WHERE ProductId IN (43, 44, 45);
-- Đầm dài (30)
UPDATE Products SET CategoryId = 30 WHERE ProductId IN (46, 47, 48);
-- Đầm công sở (31)
UPDATE Products SET CategoryId = 31 WHERE ProductId IN (49, 50, 51);
-- Giày thể thao (33)
UPDATE Products SET CategoryId = 33 WHERE ProductId IN (52, 53, 54, 55, 56, 57);
-- Giày da (34)
UPDATE Products SET CategoryId = 34 WHERE ProductId IN (58, 59, 60, 61);
-- Sandal (35)
UPDATE Products SET CategoryId = 35 WHERE ProductId IN (62, 63, 64);
-- Giày cao gót (36)
UPDATE Products SET CategoryId = 36 WHERE ProductId IN (65, 66, 67);
-- Balo (37)
UPDATE Products SET CategoryId = 37 WHERE ProductId IN (68, 69, 70);
-- Túi đeo chéo (38)
UPDATE Products SET CategoryId = 38 WHERE ProductId IN (71, 72, 73);
-- Túi xách tay (39)
UPDATE Products SET CategoryId = 39 WHERE ProductId IN (74, 75, 76);
-- Ví nam (40)
UPDATE Products SET CategoryId = 40 WHERE ProductId IN (77, 78, 79);
-- Đồng hồ (41)
UPDATE Products SET CategoryId = 41 WHERE ProductId IN (80, 81, 82, 83);
-- Kính mát (42)
UPDATE Products SET CategoryId = 42 WHERE ProductId IN (84, 85, 86, 87);
-- Mũ (43)
UPDATE Products SET CategoryId = 43 WHERE ProductId IN (88, 89, 90, 91);
-- Khăn (44)
UPDATE Products SET CategoryId = 44 WHERE ProductId IN (92, 93, 94, 95);
-- Áo hoodie nam (45)
UPDATE Products SET CategoryId = 45 WHERE ProductId IN (96, 97, 98);
-- Áo hoodie nữ (46)
UPDATE Products SET CategoryId = 46 WHERE ProductId IN (99, 100, 101);
-- Áo polo nam (47)
UPDATE Products SET CategoryId = 47 WHERE ProductId IN (102, 103, 104, 106);
GO

-- 6. Dọn dẹp tên hoặc sản phẩm test nếu cần
UPDATE Products SET IsTest = 1, Status = 'inactive' WHERE ProductId = 106 AND Name = 'Test';
GO

COMMIT TRANSACTION;
GO
