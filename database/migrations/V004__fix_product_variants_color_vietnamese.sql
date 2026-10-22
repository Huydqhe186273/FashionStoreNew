/* ============================================================
   FASHION STORE — DDL migration 004
   ------------------------------------------------------------
   Fixes Vietnamese font encoding in ProductVariants (Color).
   ============================================================ */

SET XACT_ABORT ON;
BEGIN TRAN;

-- 1. Sửa lỗi Tr?ng thành Trắng
UPDATE ProductVariants
   SET Color = N'Trắng'
 WHERE Color LIKE N'%Tr?ng%' OR Color = 'Tr?ng';

-- 2. Sửa lỗi Trắng Ngà nếu có
UPDATE ProductVariants
   SET Color = N'Trắng Ngà'
 WHERE Color LIKE N'%Tr?ng Ng%';

COMMIT;
GO
