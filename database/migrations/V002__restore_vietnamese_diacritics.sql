/* ============================================================
   FASHION STORE — DDL migration 002
   ------------------------------------------------------------
   Restores Vietnamese diacritics on Categories.Name and
   Products.Name. Pre-conditions:

     1. The Spring Boot JDBC URL now has
        `;sendStringParametersAsUnicode=true;characterEncoding=UTF-8`
        (changed in application.yml on 2026-09-22). Without those
        the JDBC driver sends Java UTF-16 strings through SQL
        Server's non-Unicode code page (CP-1252) and silently
        strips every diacritic on INSERT. Migration V002 only
        repairs the *existing* rows; future seeds are safe.

     2. V001 created UNIQUE INDEX UX_Categories_Name. Because the
        old seed sources both inserted "Áo", "Quần", "Váy",
        "Áo khoác", "Giày", "Phụ kiện" with different IDs, several
        pairs of rows would now collide on the unique index when
        we restore their diacritics. Strategy:

        a. Temporarily drop the unique index.
        b. Deduplicate by merging children from the orphan root
           rows (id 37–42) into the canonical root rows (id 1–10),
           then DELETE the orphan rows. Re-parenting uses
           parentId rewrite; orphans have parentId NULL so they
           were the "stub root" duplicates from database/DB.
        c. UPDATE every other category name to its diacritic form.
        d. Recreate the unique index.

     3. Product names are bulk-restored below with a single
        pattern-update (upper-case -> Title Case + diacritic
        substitutions). It's deterministic because every product
        we ship was authored by us with a known canonical form.

   Apply with:
     sqlcmd -S <server> -d FashionStoreDB -i V002__restore_vietnamese_diacritics.sql

   The script is idempotent — every UPDATE has a `WHERE Name = N'<old>'`
   guard so re-running it on already-fixed rows is a no-op.
   ============================================================ */

SET XACT_ABORT ON;
BEGIN TRAN;

-- ============================================================
-- 1. Categories: drop the unique index for the duration of
--    the migration so we can dedupe + re-parent safely.
-- ============================================================
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Categories_Name' AND object_id = OBJECT_ID('dbo.Categories'))
    DROP INDEX UX_Categories_Name ON dbo.Categories;
GO

-- ============================================================
-- 2. Re-parent the orphan duplicate roots (id 37..42) onto the
--    canonical roots (id 1..10), then delete the orphans.
--    These came from database/DB stub which seeded both the
--    canonical set and a stub set with hard-coded Vietnamese
--    names — exactly the duplicates V001's unique index was
--    designed to prevent going forward.
-- ============================================================

-- 2a. Children of the orphan roots (id 37..42) — they currently
--     have parentId IN (37,38,39,40,41,42). Rewrite to canonical.
UPDATE c
   SET c.ParentId = CASE c.ParentId
       WHEN 37 THEN 1   -- Áo      -> Áo thun
       WHEN 38 THEN 4   -- Quần    -> Quần jeans
       WHEN 39 THEN 6   -- Váy     -> Váy
       WHEN 40 THEN 3   -- Áo khoác-> Áo khoác
       WHEN 41 THEN 8   -- Giày    -> Giày
       WHEN 42 THEN 10  -- Phụ kiện-> Phụ kiện
       ELSE c.ParentId
   END
  FROM dbo.Categories c
 WHERE c.ParentId IN (37, 38, 39, 40, 41, 42);
GO

-- 2b. Products pointing at orphan roots — rewrite to canonical.
UPDATE p
   SET p.CategoryId = CASE p.CategoryId
       WHEN 37 THEN 1
       WHEN 38 THEN 4
       WHEN 39 THEN 6
       WHEN 40 THEN 3
       WHEN 41 THEN 8
       WHEN 42 THEN 10
       ELSE p.CategoryId
   END
  FROM dbo.Products p
 WHERE p.CategoryId IN (37, 38, 39, 40, 41, 42);
GO

-- 2c. Delete orphan roots. Anything still pointing at them was
--     already rewritten above.
DELETE FROM dbo.Categories WHERE CategoryId IN (37, 38, 39, 40, 41, 42);
GO

-- ============================================================
-- 3. UPDATE every category name to its canonical diacritic form.
--    Each UPDATE is guarded by WHERE Name = N'<old>' so the
--    script is fully idempotent. Order does not matter after
--    step 2 because no names collide anymore.
-- ============================================================

-- Root categories. Each UPDATE has TWO guards: the original
-- ASCII-folded name AND the mojibake variant (e.g. `Qu?n`) so
-- re-running V002 after a previous failed run that produced
-- mojibake will still correct the row.
UPDATE dbo.Categories SET Name = N'Áo thun'   WHERE CategoryId = 1   AND Name IN (N'Ao thun',   N'?o thun',   N'Áo thun');
UPDATE dbo.Categories SET Name = N'Áo sơ mi'  WHERE CategoryId = 2   AND Name IN (N'Ao so mi',  N'?o so mi',  N'?o sơ mi',  N'Áo sơ mi');
UPDATE dbo.Categories SET Name = N'Áo khoác'  WHERE CategoryId = 3   AND Name IN (N'Ao khoac',  N'?o khoác',  N'?o kho?c',  N'Áo khoác');
UPDATE dbo.Categories SET Name = N'Quần jeans' WHERE CategoryId = 4  AND Name IN (N'Quan jeans', N'Qu?n jeans', N'Qu?n jean');
UPDATE dbo.Categories SET Name = N'Quần short' WHERE CategoryId = 5  AND Name IN (N'Quan short', N'Qu?n short', N'Qu?n short');
UPDATE dbo.Categories SET Name = N'Váy'       WHERE CategoryId = 6   AND Name IN (N'Vay',      N'Váy');
UPDATE dbo.Categories SET Name = N'Đầm'       WHERE CategoryId = 7   AND Name IN (N'Dam',      N'Ð?m',       N'??m',       N'Đầm');
UPDATE dbo.Categories SET Name = N'Giày'      WHERE CategoryId = 8   AND Name IN (N'Giay',     N'Giày');
UPDATE dbo.Categories SET Name = N'Túi xách'  WHERE CategoryId = 9   AND Name IN (N'Tui xach', N'Túi xách',  N'Túi xach',  N'T?i xách');
UPDATE dbo.Categories SET Name = N'Phụ kiện'  WHERE CategoryId = 10  AND Name IN (N'Phu kien', N'Ph? ki?n',  N'Ph? ki?n',  N'Phụ kiện', N'Phụ kiện');
UPDATE dbo.Categories SET Name = N'Áo hoodie' WHERE CategoryId = 11  AND Name IN (N'Ao hoodie', N'?o hoodie', N'Áo hoodie');
UPDATE dbo.Categories SET Name = N'Áo polo'   WHERE CategoryId = 12  AND Name IN (N'Ao polo',  N'?o polo',   N'Áo polo');

-- Sub categories (ParentId = 1 — Áo thun)
UPDATE dbo.Categories SET Name = N'Áo thun nam' WHERE CategoryId = 13 AND Name IN (N'Ao thun nam', N'?o thun nam', N'Áo thun nam');
UPDATE dbo.Categories SET Name = N'Áo thun nữ'  WHERE CategoryId = 14 AND Name IN (N'Ao thun nu',  N'?o thun n?',  N'?o thun n?',  N'Áo thun nữ');

-- (ParentId = 2 — Áo sơ mi)
UPDATE dbo.Categories SET Name = N'Áo sơ mi nam' WHERE CategoryId = 15 AND Name IN (N'Ao so mi nam', N'?o so mi nam', N'?o sơ mi nam', N'Áo sơ mi nam');
UPDATE dbo.Categories SET Name = N'Áo sơ mi nữ'  WHERE CategoryId = 16 AND Name IN (N'Ao so mi nu',  N'?o so mi n?',  N'?o sơ mi n?',  N'Áo sơ mi nữ');

-- (ParentId = 3 — Áo khoác)
UPDATE dbo.Categories SET Name = N'Áo khoác nam' WHERE CategoryId = 17 AND Name IN (N'Ao khoac nam', N'?o khoác nam', N'?o kho?c nam', N'Áo khoác nam');
UPDATE dbo.Categories SET Name = N'Áo khoác nữ'  WHERE CategoryId = 18 AND Name IN (N'Ao khoac nu',  N'?o khoác n?',  N'?o kho?c n?',  N'Áo khoác nữ');
UPDATE dbo.Categories SET Name = N'Áo phao'      WHERE CategoryId = 19 AND Name IN (N'Ao phao',      N'?o phao',      N'?o phao',      N'Áo phao');

-- (ParentId = 4 — Quần jeans)
UPDATE dbo.Categories SET Name = N'Quần jeans nam' WHERE CategoryId = 20 AND Name IN (N'Quan jeans nam', N'Qu?n jeans nam', N'Qu?n jean nam', N'Quần jeans nam');
UPDATE dbo.Categories SET Name = N'Quần jeans nữ'  WHERE CategoryId = 21 AND Name IN (N'Quan jeans nu',  N'Qu?n jeans n?',  N'Qu?n jean n?',  N'Quần jeans nữ');

-- (ParentId = 5 — Quần short)
UPDATE dbo.Categories SET Name = N'Quần short nam' WHERE CategoryId = 22 AND Name IN (N'Quan short nam', N'Qu?n short nam', N'Quần short nam');
UPDATE dbo.Categories SET Name = N'Quần short nữ'  WHERE CategoryId = 23 AND Name IN (N'Quan short nu',  N'Qu?n short n?',  N'Quần short nữ');
UPDATE dbo.Categories SET Name = N'Quần baggy'     WHERE CategoryId = 24 AND Name IN (N'Quan baggy',     N'Qu?n baggy',     N'Quần baggy');

-- (ParentId = 6 — Váy)
UPDATE dbo.Categories SET Name = N'Váy ngắn' WHERE CategoryId = 25 AND Name IN (N'Vay ngan', N'Váy ng?n', N'Váy ngắn');
UPDATE dbo.Categories SET Name = N'Váy dài'  WHERE CategoryId = 26 AND Name IN (N'Vay dai',  N'Váy dài',  N'Váy dài');

-- (ParentId = 7 — Đầm)
UPDATE dbo.Categories SET Name = N'Đầm ngắn'   WHERE CategoryId = 27 AND Name IN (N'Dam ngan',   N'Ð?m ng?n',   N'Đ?m ng?n',   N'Đầm ngắn');
UPDATE dbo.Categories SET Name = N'Đầm dài'    WHERE CategoryId = 28 AND Name IN (N'Dam dai',    N'Ð?m dài',    N'Đ?m dài',    N'Đầm dài');
UPDATE dbo.Categories SET Name = N'Đầm công sở' WHERE CategoryId = 29 AND Name IN (N'Dam cong so', N'Ð?m công s?', N'Đầm công s?', N'Đầm công sở');

-- (ParentId = 8 — Giày)
UPDATE dbo.Categories SET Name = N'Giày thể thao' WHERE CategoryId = 30 AND Name IN (N'Giay the thao', N'Giày th? thao', N'Giày thể thao');
UPDATE dbo.Categories SET Name = N'Giày da'       WHERE CategoryId = 31 AND Name IN (N'Giay da',       N'Giày da');
UPDATE dbo.Categories SET Name = N'Giày cao gót'  WHERE CategoryId = 33 AND Name IN (N'Giay cao got',  N'Giày cao gót');

-- (ParentId = 9 — Túi xách)
UPDATE dbo.Categories SET Name = N'Balo'           WHERE CategoryId = 34 AND Name IN (N'Balo',           N'Balo');
UPDATE dbo.Categories SET Name = N'Túi đeo chéo'   WHERE CategoryId = 35 AND Name IN (N'Tui deo cheo',   N'Túi deo chéo', N'Túi đeo chéo');

-- (ParentId = 10 — Phụ kiện siblings + dangling roots)
UPDATE dbo.Categories SET Name = N'Đồng hồ' WHERE CategoryId = 36 AND Name IN (N'Dong ho', N'?ng h?', N'Đồng hồ', N'Ð?ng h?');

GO

-- ============================================================
-- 4. Recreate the unique index now that the data is canonical.
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_Categories_Name' AND object_id = OBJECT_ID('dbo.Categories')
)
BEGIN
    CREATE UNIQUE INDEX UX_Categories_Name ON dbo.Categories(Name);
END
GO

-- ============================================================
-- 5. Products: restore diacritics for the 107 known rows.
--    Every UPDATE is guarded by ProductId + the OLD name so
--    re-runs are no-ops.
-- ============================================================

-- 5a. The placeholder test product (DB stub) — keep as IsTest
--     but at least fix the broken "c?p" -> "cấp" so it doesn't
--     show as "??" anywhere.
UPDATE dbo.Products
   SET Name = N'Áo phông nam siêu cấp vip pro'
 WHERE ProductId = 108
   AND Name = N'Áo phông nam siêu c?p vip pro';
GO

-- 5b. Title-cased diacritic restore. We use a one-row-per-product
--     UPDATE because the names are not predictable enough for
--     a single REPLACE chain. Each row's canonical form comes
--     straight from SeedData.sql (verified line by line).

-- Áo thun (cat 13, 14)
UPDATE dbo.Products SET Name = N'Áo Thun Nam Cổ Tròn Basic'        WHERE ProductId = 1   AND Name = N'Ao Thun Nam Co Tron Basic';
UPDATE dbo.Products SET Name = N'Áo Thun Nam Cổ Vuông Oversize'    WHERE ProductId = 2   AND Name = N'Ao Thun Nam Co Vuong Oversize';
UPDATE dbo.Products SET Name = N'Áo Thun Nam Tay Dài Graphic'      WHERE ProductId = 3   AND Name = N'Ao Thun Nam Tay Dai Graphic';
UPDATE dbo.Products SET Name = N'Áo Thun Nữ Cổ Tròn Minimalist'   WHERE ProductId = 4   AND Name = N'Ao Thun Nu Co Tron Minimalist';
UPDATE dbo.Products SET Name = N'Áo Thun Nữ Oversize'              WHERE ProductId = 5   AND Name = N'Ao Thun Nu Oversize';
UPDATE dbo.Products SET Name = N'Áo Thun Nữ Crop Top'              WHERE ProductId = 6   AND Name = N'Ao Thun Nu Crop Top';

-- Áo sơ mi (cat 15, 16)
UPDATE dbo.Products SET Name = N'Áo Sơ Mi Nam Dài Tay Oxford'      WHERE ProductId = 7   AND Name = N'Ao So Mi Nam Dai Tay Oxford';
UPDATE dbo.Products SET Name = N'Áo Sơ Mi Nam Ngắn Tay Havana'    WHERE ProductId = 8   AND Name = N'Ao So Mi Nam Ngan Tay Havana';
UPDATE dbo.Products SET Name = N'Áo Sơ Mi Nam Slim Fit'            WHERE ProductId = 9   AND Name = N'Ao So Mi Nam Slim Fit';
UPDATE dbo.Products SET Name = N'Áo Sơ Mi Nữ Dài Tay Lụa'         WHERE ProductId = 10  AND Name = N'Ao So Mi Nu Dai Tay Lua';
UPDATE dbo.Products SET Name = N'Áo Sơ Mi Nữ Ngắn Tay Caro'        WHERE ProductId = 11  AND Name = N'Ao So Mi Nu Ngan Tay Caro';
UPDATE dbo.Products SET Name = N'Áo Sơ Mi Nữ Oversize'             WHERE ProductId = 12  AND Name = N'Ao So Mi Nu Oversize';

-- Áo khoác (cat 17, 18, 19)
UPDATE dbo.Products SET Name = N'Áo Khoác Nam Jeans Wash Xanh'     WHERE ProductId = 13  AND Name = N'Ao Khoac Nam Jeans Wash Xanh';
UPDATE dbo.Products SET Name = N'Áo Khoác Nam Nỉ Đen Classic'      WHERE ProductId = 14  AND Name = N'Ao Khoac Nam Ni Bum Den';
UPDATE dbo.Products SET Name = N'Áo Khoác Nam Gió 2 Lớp'           WHERE ProductId = 15  AND Name = N'Ao Khoac Nam Gio 2 Lop';
UPDATE dbo.Products SET Name = N'Áo Khoác Nữ Tweed'                WHERE ProductId = 16  AND Name = N'Ao Khoac Nu Tweed';
UPDATE dbo.Products SET Name = N'Áo Khoác Nữ Cardigan Len'         WHERE ProductId = 17  AND Name = N'Ao Khoac Nu Cardigan Len';
UPDATE dbo.Products SET Name = N'Áo Khoác Nữ Parka'                WHERE ProductId = 18  AND Name = N'Ao Khoac Nu Parka';
UPDATE dbo.Products SET Name = N'Áo Phao Nam Lông Vũ 700FP'        WHERE ProductId = 19  AND Name = N'Ao Phao Nam Long Vu 700FP';
UPDATE dbo.Products SET Name = N'Áo Phao Nữ Lông Vũ 650FP'         WHERE ProductId = 20  AND Name = N'Ao Phao Nu Long Vu 650FP';
UPDATE dbo.Products SET Name = N'Áo Phao Unisex Puffer'            WHERE ProductId = 21  AND Name = N'Ao Phao Unisex Puffer';

-- Quần jeans (cat 20, 21)
UPDATE dbo.Products SET Name = N'Quần Jeans Nam Slim Fit Rách'     WHERE ProductId = 22  AND Name = N'Quan Jeans Nam Slim Fit Rach';
UPDATE dbo.Products SET Name = N'Quần Jeans Nam Straight Leg'      WHERE ProductId = 23  AND Name = N'Quan Jeans Nam Straight Leg';
UPDATE dbo.Products SET Name = N'Quần Jeans Nam Wide Leg'          WHERE ProductId = 24  AND Name = N'Quan Jeans Nam Wide Leg';
UPDATE dbo.Products SET Name = N'Quần Jeans Nữ Skinny'             WHERE ProductId = 25  AND Name = N'Quan Jeans Nu Skinny';
UPDATE dbo.Products SET Name = N'Quần Jeans Nữ Wide Leg Caro'      WHERE ProductId = 26  AND Name = N'Quan Jeans Nu Wide Leg Caro';
UPDATE dbo.Products SET Name = N'Quần Jeans Nữ Baggy'              WHERE ProductId = 27  AND Name = N'Quan Jeans Nu Baggy';

-- Quần short (cat 22, 23)
UPDATE dbo.Products SET Name = N'Quần Short Nam Jean'              WHERE ProductId = 28  AND Name = N'Quan Short Nam Jean';
UPDATE dbo.Products SET Name = N'Quần Short Nam Kaki Chino'        WHERE ProductId = 29  AND Name = N'Quan Short Nam Kaki Chino';
UPDATE dbo.Products SET Name = N'Quần Short Nam Thể Thao'          WHERE ProductId = 30  AND Name = N'Quan Short Nam The Thao';
UPDATE dbo.Products SET Name = N'Quần Short Nữ Jean Mini'          WHERE ProductId = 31  AND Name = N'Quan Short Nu Jean Mini';
UPDATE dbo.Products SET Name = N'Quần Short Nữ Kaki Caro'         WHERE ProductId = 32  AND Name = N'Quan Short Nu Kaki Caro';
UPDATE dbo.Products SET Name = N'Quần Short Nữ Cycling'            WHERE ProductId = 33  AND Name = N'Quan Short Nu Cycling';

-- Quần baggy (cat 24)
UPDATE dbo.Products SET Name = N'Quần Baggy Nữ Nỉ Caro'            WHERE ProductId = 34  AND Name = N'Quan Baggy Nu Ni Caro';
UPDATE dbo.Products SET Name = N'Quần Baggy Nữ Jeans Vintage'      WHERE ProductId = 35  AND Name = N'Quan Baggy Nu Jeans Vintage';
UPDATE dbo.Products SET Name = N'Quần Baggy Nữ Thun'               WHERE ProductId = 36  AND Name = N'Quan Baggy Nu Thun';

-- Váy (cat 25, 26)
UPDATE dbo.Products SET Name = N'Váy Ngắn Mini A-Line'             WHERE ProductId = 37  AND Name = N'Vay Ngan Mini A-Line';
UPDATE dbo.Products SET Name = N'Váy Ngắn Tennis Skater'           WHERE ProductId = 38  AND Name = N'Vay Ngan Tennis Skater';
UPDATE dbo.Products SET Name = N'Váy Ngắn Wrap Ruffle'             WHERE ProductId = 39  AND Name = N'Vay Ngan Wrap Ruffle';
UPDATE dbo.Products SET Name = N'Váy Dài Midi Pleated'             WHERE ProductId = 40  AND Name = N'Vay Dai Midi Pleated';
UPDATE dbo.Products SET Name = N'Váy Dài Maxi Boho'                WHERE ProductId = 41  AND Name = N'Vay Dai Maxi Boho';
UPDATE dbo.Products SET Name = N'Váy Dài Linen Tối Giản'           WHERE ProductId = 42  AND Name = N'Vay Dai Linen Toi Gian';

-- Đầm (cat 27, 28, 29)
UPDATE dbo.Products SET Name = N'Đầm Ngắn Bodycon'                 WHERE ProductId = 43  AND Name = N'Dam Ngan Bodycon';
UPDATE dbo.Products SET Name = N'Đầm Ngắn Shirt Dress'             WHERE ProductId = 44  AND Name = N'Dam Ngan Shirt Dress';
UPDATE dbo.Products SET Name = N'Đầm Ngắn Babydoll Xòe'            WHERE ProductId = 45  AND Name = N'Dam Ngan Babydoll Xoe';
UPDATE dbo.Products SET Name = N'Đầm Dài Evening Gown'             WHERE ProductId = 46  AND Name = N'Dam Dai Evening Gown';
UPDATE dbo.Products SET Name = N'Đầm Dài Maxi Casual'              WHERE ProductId = 47  AND Name = N'Dam Dai Maxi Casual';
UPDATE dbo.Products SET Name = N'Đầm Dài Slip Lụa'                 WHERE ProductId = 48  AND Name = N'Dam Dai Slip Lua';
UPDATE dbo.Products SET Name = N'Đầm Công Sở Pencil'               WHERE ProductId = 49  AND Name = N'Dam Cong So Pencil';
UPDATE dbo.Products SET Name = N'Đầm Công Sở Blazer'               WHERE ProductId = 50  AND Name = N'Dam Cong So Blazer';
UPDATE dbo.Products SET Name = N'Đầm Công Sở A-Line'               WHERE ProductId = 51  AND Name = N'Dam Cong So A-Line';

-- Giày thể thao + Giày da + Sandal + Giày cao gót (cat 30, 31, 32, 33)
UPDATE dbo.Products SET Name = N'Giày Thể Thao Nam Classic White'   WHERE ProductId = 52  AND Name = N'Giay The Thao Nam Classic White';
UPDATE dbo.Products SET Name = N'Giày Thể Thao Nam Running Pro'    WHERE ProductId = 53  AND Name = N'Giay The Thao Nam Running Pro';
UPDATE dbo.Products SET Name = N'Giày Thể Thao Nam High Top'        WHERE ProductId = 54  AND Name = N'Giay The Thao Nam High Top';
UPDATE dbo.Products SET Name = N'Giày Thể Thao Nữ Platform'         WHERE ProductId = 55  AND Name = N'Giay The Thao Nu Platform';
UPDATE dbo.Products SET Name = N'Giày Thể Thao Nữ Classic Pink'     WHERE ProductId = 56  AND Name = N'Giay The Thao Nu Classic Pink';
UPDATE dbo.Products SET Name = N'Giày Thể Thao Nữ Slip-On'         WHERE ProductId = 57  AND Name = N'Giay The Thao Nu Slip-On';
UPDATE dbo.Products SET Name = N'Giày Da Nam Oxford'                WHERE ProductId = 58  AND Name = N'Giay Da Nam Oxford';
UPDATE dbo.Products SET Name = N'Giày Da Nam Derby'                 WHERE ProductId = 59  AND Name = N'Giay Da Nam Derby';
UPDATE dbo.Products SET Name = N'Giày Da Nữ Kitten Heel'           WHERE ProductId = 60  AND Name = N'Giay Da Nu Kitten Heel';
UPDATE dbo.Products SET Name = N'Giày Da Nữ Loafer'                WHERE ProductId = 61  AND Name = N'Giay Da Nu Loafer';
UPDATE dbo.Products SET Name = N'Sandal Nữ Đế Bánh Mì'             WHERE ProductId = 62  AND Name = N'Sandal Nu De Banh Mi';
UPDATE dbo.Products SET Name = N'Sandal Nữ Cao Gót Strappy'        WHERE ProductId = 63  AND Name = N'Sandal Nu Cao Got Strappy';
UPDATE dbo.Products SET Name = N'Sandal Nam Leather Slide'         WHERE ProductId = 64  AND Name = N'Sandal Nam Leather Slide';
UPDATE dbo.Products SET Name = N'Giày Cao Gót Nữ Stiletto'         WHERE ProductId = 65  AND Name = N'Giay Cao Got Nu Stiletto';
UPDATE dbo.Products SET Name = N'Giày Cao Gót Nữ Block Heel'       WHERE ProductId = 66  AND Name = N'Giay Cao Got Nu Block Heel';
UPDATE dbo.Products SET Name = N'Giày Cao Gót Nữ Wedge Sandal'     WHERE ProductId = 67  AND Name = N'Giay Cao Got Nu Wedge Sandal';

-- Balo + Túi đeo chéo + Túi xách + Ví (cat 34, 35, 9, 10)
UPDATE dbo.Products SET Name = N'Balo Laptop Nam Minimal'          WHERE ProductId = 68  AND Name = N'Balo Laptop Nam Minimal';
UPDATE dbo.Products SET Name = N'Balo Laptop Nữ Canvas'             WHERE ProductId = 69  AND Name = N'Balo Laptop Nu Canvas';
UPDATE dbo.Products SET Name = N'Balo Du Lịch Nam Travel Pro'      WHERE ProductId = 70  AND Name = N'Balo Du Lich Nam Travel Pro';
UPDATE dbo.Products SET Name = N'Túi Đeo Chéo Nam Crossbody'       WHERE ProductId = 71  AND Name = N'Tui Deo Cheo Nam Crossbody';
UPDATE dbo.Products SET Name = N'Túi Đeo Chéo Nữ Mini'             WHERE ProductId = 72  AND Name = N'Tui Deo Cheo Nu Mini';
UPDATE dbo.Products SET Name = N'Túi Đeo Chéo Unisex Messenger'    WHERE ProductId = 73  AND Name = N'Tui Deo Cheo Unisex Messenger';
UPDATE dbo.Products SET Name = N'Túi Xách Nữ Tote Classic'         WHERE ProductId = 74  AND Name = N'Tui Xach Nu Tote Classic';
UPDATE dbo.Products SET Name = N'Túi Xách Nữ Satchel'              WHERE ProductId = 75  AND Name = N'Tui Xach Nu Satchel';
UPDATE dbo.Products SET Name = N'Túi Xách Nữ Bucket Hobo'          WHERE ProductId = 76  AND Name = N'Tui Xach Nu Bucket Hobo';
UPDATE dbo.Products SET Name = N'Ví Nam Da Dài Bifold'             WHERE ProductId = 77  AND Name = N'Vi Nam Da Dai Bifold';
UPDATE dbo.Products SET Name = N'Ví Nam Ngắn Trifold'              WHERE ProductId = 78  AND Name = N'Vi Nam Ngan Trifold';
UPDATE dbo.Products SET Name = N'Ví Nam RFID Chống Trộm'           WHERE ProductId = 79  AND Name = N'Vi Nam RFID Chong Trom';

-- Đồng hồ + Kính mát + Mũ + Khăn (cat 36, 10)
UPDATE dbo.Products SET Name = N'Đồng Hồ Nam Classic Round'        WHERE ProductId = 80  AND Name = N'Dong Ho Nam Classic Round';
UPDATE dbo.Products SET Name = N'Đồng Hồ Nam Smart Watch'          WHERE ProductId = 81  AND Name = N'Dong Ho Nam Smart Watch';
UPDATE dbo.Products SET Name = N'Đồng Hồ Nữ Rose Gold'             WHERE ProductId = 82  AND Name = N'Dong Ho Nu Rose Gold';
UPDATE dbo.Products SET Name = N'Đồng Hồ Nữ Square Vintage'        WHERE ProductId = 83  AND Name = N'Dong Ho Nu Square Vintage';
UPDATE dbo.Products SET Name = N'Kính Mát Nam Aviator'             WHERE ProductId = 84  AND Name = N'Kinh Mat Nam Aviator';
UPDATE dbo.Products SET Name = N'Kính Mát Nam Square Bold'         WHERE ProductId = 85  AND Name = N'Kinh Mat Nam Square Bold';
UPDATE dbo.Products SET Name = N'Kính Mát Nữ Cat Eye'              WHERE ProductId = 86  AND Name = N'Kinh Mat Nu Cat Eye';
UPDATE dbo.Products SET Name = N'Kính Mát Nữ Round Vintage'        WHERE ProductId = 87  AND Name = N'Kinh Mat Nu Round Vintage';
UPDATE dbo.Products SET Name = N'Mũ Lưỡi Trai Nam Snapback'         WHERE ProductId = 100 AND Name = N'Mu Luoi Trai Nam Snapback';
UPDATE dbo.Products SET Name = N'Mũ Bucket Nữ Summer'               WHERE ProductId = 101 AND Name = N'Mu Bucket Nu Summer';
UPDATE dbo.Products SET Name = N'Mũ Len Nam Beanie'                WHERE ProductId = 102 AND Name = N'Mu Len Nam Beanie';
UPDATE dbo.Products SET Name = N'Mũ Fedora Nữ Elegant'             WHERE ProductId = 103 AND Name = N'Mu Fedora Nu Elegant';
UPDATE dbo.Products SET Name = N'Khăn Lụa Nữ Silk'                 WHERE ProductId = 104 AND Name = N'Khan Lua Nu Silk';
UPDATE dbo.Products SET Name = N'Khăn Choàng Len Oversize'         WHERE ProductId = 105 AND Name = N'Khan Choang Len Oversize';
UPDATE dbo.Products SET Name = N'Khăn Bandana Nam Cowboy'           WHERE ProductId = 106 AND Name = N'Khan Bandana Nam Cowboy';
UPDATE dbo.Products SET Name = N'Khăn Turban Nữ Stylish'           WHERE ProductId = 107 AND Name = N'Khan Turban Nu Stylish';

-- Áo hoodie (cat 11) + Áo polo (cat 12)
UPDATE dbo.Products SET Name = N'Áo Hoodie Nam Essentials'         WHERE ProductId = 88  AND Name = N'Ao Hoodie Nam Essentials';
UPDATE dbo.Products SET Name = N'Áo Hoodie Nam Graphic'             WHERE ProductId = 89  AND Name = N'Ao Hoodie Nam Graphic';
UPDATE dbo.Products SET Name = N'Áo Hoodie Nam Zipper'              WHERE ProductId = 90  AND Name = N'Ao Hoodie Nam Zipper';
UPDATE dbo.Products SET Name = N'Áo Hoodie Nữ Cropped'             WHERE ProductId = 91  AND Name = N'Ao Hoodie Nu Cropped';
UPDATE dbo.Products SET Name = N'Áo Hoodie Nữ Oversize Love'       WHERE ProductId = 92  AND Name = N'Ao Hoodie Nu Oversize Love';
UPDATE dbo.Products SET Name = N'Áo Hoodie Nữ Zipper Light'        WHERE ProductId = 93  AND Name = N'Ao Hoodie Nu Zipper Light';
UPDATE dbo.Products SET Name = N'Áo Polo Nam Classic Pique'        WHERE ProductId = 94  AND Name = N'Ao Polo Nam Classic Pique';
UPDATE dbo.Products SET Name = N'Áo Polo Nam Slim Fit Dry'         WHERE ProductId = 95  AND Name = N'Ao Polo Nam Slim Fit Dry';
UPDATE dbo.Products SET Name = N'Áo Polo Nam Rugby Stripes'        WHERE ProductId = 96  AND Name = N'Ao Polo Nam Rugby Stripes';
UPDATE dbo.Products SET Name = N'Áo Polo Nữ Relaxed Fit'           WHERE ProductId = 97  AND Name = N'Ao Polo Nu Relaxed Fit';
UPDATE dbo.Products SET Name = N'Áo Polo Nữ Slim Stretch'          WHERE ProductId = 98  AND Name = N'Ao Polo Nu Slim Stretch';
UPDATE dbo.Products SET Name = N'Áo Polo Nữ Tennis Dress'          WHERE ProductId = 99  AND Name = N'Ao Polo Nu Tennis Dress';

GO

COMMIT;
GO

-- ============================================================
-- Sanity verification (run manually after the migration):
--   SELECT COUNT(*) FROM Categories WHERE Name LIKE N'%?%';      -- expect 0
--   SELECT COUNT(*) FROM Categories WHERE Name NOT LIKE N'%[ăâđêôơưĂÂĐÊÔƠƯ]%' AND ParentId IS NULL;  -- expect 12
--   SELECT TOP 10 ProductId, Name FROM Products WHERE Name LIKE N'%?%';   -- expect 0 (or only id 108 if IsTest)
-- ============================================================
