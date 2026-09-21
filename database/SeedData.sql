/* ============================================================
   FASHION STORE - SEED DATA
   Dữ liệu mẫu đầy đủ: Users, Categories, Products, Variants, Images, Orders
   ============================================================ */

/* ============================================================
   1. USERS (Users)
   ============================================================ */

INSERT INTO Users (FullName, Email, PasswordHash, Phone, Role, Status) VALUES
(N'Admin Hệ Thống', 'admin@fashionstore.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.5VfFPoGZBPcHCrK1mK', '0909123456', 'admin', 'active'),
(N'Nhân Viên Kho', 'staff@fashionstore.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.5VfFPoGZBPcHCrK1mK', '0909234567', 'staff', 'active'),
(N'Nguyễn Minh Tuấn', 'tuan.nguyen@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.5VfFPoGZBPcHCrK1mK', '0912345678', 'customer', 'active'),
(N'Trần Thu Hà', 'ha.tran@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.5VfFPoGZBPcHCrK1mK', '0923456789', 'customer', 'active'),
(N'Lê Hoàng Nam', 'nam.le@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.5VfFPoGZBPcHCrK1mK', '0934567890', 'customer', 'active'),
(N'Phạm Thị Mai', 'mai.pham@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.5VfFPoGZBPcHCrK1mK', '0945678901', 'customer', 'active'),
(N'Vũ Đình Phong', 'phong.vu@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.5VfFPoGZBPcHCrK1mK', '0956789012', 'customer', 'active'),
(N'Hồ Ngọc Hân', 'han.ho@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.5VfFPoGZBPcHCrK1mK', '0967890123', 'customer', 'active');

/* ============================================================
   2. ADDRESSES
   ============================================================ */

INSERT INTO Addresses (UserId, RecipientName, Phone, AddressLine, City, IsDefault) VALUES
(3, N'Nguyễn Minh Tuấn', '0912345678', N'123 Đường Nguyễn Trãi, Quận 1', N'TP Hồ Chí Minh', 1),
(4, N'Trần Thu Hà', '0923456789', N'456 Đường Lê Lợi, Quận Hoàn Kiếm', N'Hà Nội', 1),
(5, N'Lê Hoàng Nam', '0934567890', N'789 Đường Điện Biên Phủ, Quận 3', N'TP Hồ Chí Minh', 1),
(6, N'Phạm Thị Mai', '0945678901', N'321 Đường Trần Hưng Đạo, Quận 5', N'TP Hồ Chí Minh', 1);

/* ============================================================
   3. CATEGORIES (Danh mục đầy đủ)
   ============================================================ */

-- Parent Categories (Danh mục cha)
INSERT INTO Categories (Name, ParentId, Gender, Season) VALUES
(N'Áo thun', NULL, 'unisex', NULL),
(N'Áo sơ mi', NULL, 'unisex', NULL),
(N'Áo khoác', NULL, 'unisex', NULL),
(N'Quần jeans', NULL, 'unisex', NULL),
(N'Quần short', NULL, 'unisex', NULL),
(N'Váy', NULL, 'nu', NULL),
(N'Đầm', NULL, 'nu', NULL),
(N'Giày', NULL, 'unisex', NULL),
(N'Túi xách', NULL, 'unisex', NULL),
(N'Phụ kiện', NULL, 'unisex', NULL),
(N'Áo hoodie', NULL, 'unisex', NULL),
(N'Áo polo', NULL, 'unisex', NULL);

-- Sub Categories (Danh mục con)
INSERT INTO Categories (Name, ParentId, Gender, Season) VALUES
-- Áo thun (ParentId = 1)
(N'Áo thun nam', 1, 'nam', NULL),
(N'Áo thun nữ', 1, 'nu', NULL),
-- Áo sơ mi (ParentId = 2)
(N'Áo sơ mi nam', 2, 'nam', NULL),
(N'Áo sơ mi nữ', 2, 'nu', NULL),
-- Áo khoác (ParentId = 3)
(N'Áo khoác nam', 3, 'nam', NULL),
(N'Áo khoác nữ', 3, 'nu', NULL),
(N'Áo phao', 3, 'unisex', 'winter'),
(N'Áo vest', 3, 'unisex', NULL),
-- Quần jeans (ParentId = 4)
(N'Quần jeans nam', 4, 'nam', NULL),
(N'Quần jeans nữ', 4, 'nu', NULL),
-- Quần short (ParentId = 5)
(N'Quần short nam', 5, 'nam', NULL),
(N'Quần short nữ', 5, 'nu', NULL),
(N'Quần baggy', 5, 'nu', NULL),
-- Váy (ParentId = 6)
(N'Váy ngắn', 6, 'nu', NULL),
(N'Váy dài', 6, 'nu', NULL),
(N'Chân váy', 6, 'nu', NULL),
-- Đầm (ParentId = 7)
(N'Đầm ngắn', 7, 'nu', NULL),
(N'Đầm dài', 7, 'nu', NULL),
(N'Đầm công sở', 7, 'nu', NULL),
-- Giày (ParentId = 8)
(N'Giày thể thao', 8, 'unisex', NULL),
(N'Giày da', 8, 'unisex', NULL),
(N'Sandal', 8, 'unisex', 'summer'),
(N'Giày cao gót', 8, 'nu', NULL),
-- Túi xách (ParentId = 9)
(N'Balo', 9, 'unisex', NULL),
(N'Túi đeo chéo', 9, 'unisex', NULL),
(N'Túi xách tay', 9, 'nu', NULL),
(N'Ví nam', 9, 'nam', NULL),
-- Phụ kiện (ParentId = 10)
(N'Đồng hồ', 10, 'unisex', NULL),
(N'Kính mát', 10, 'unisex', NULL),
(N'Mũ', 10, 'unisex', NULL),
(N'Khăn', 10, 'unisex', NULL),
-- Áo hoodie (ParentId = 11)
(N'Áo hoodie nam', 11, 'nam', NULL),
(N'Áo hoodie nữ', 11, 'nu', NULL),
-- Áo polo (ParentId = 12)
(N'Áo polo nam', 12, 'nam', NULL),
(N'Áo polo nữ', 12, 'nu', NULL);

/* ============================================================
   4. PRODUCTS (50 sản phẩm mẫu)
   ============================================================ */

-- Áo thun nam
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(13, N'Áo Thun Nam Cổ Tròn Basic', N'Áo thun nam cổ tròn basic, chất cotton 100%, co giãn thoải mái. Phù hợp mặc hàng ngày, đi chơi, đi làm đều OK. Thiết kế đơn giản, dễ phối đồ với quần jeans, quần short.', 299000, 249000, 'active', 1250, 89, DATEADD(day, -30, SYSDATETIME())),
(13, N'Áo Thun Nam Cổ Vuông Oversize', N'Áo thun nam cổ vuông phong cách oversize, chất vải cotton pha spandex mềm mại. Màu sắc trẻ trung, phù hợp giới trẻ năng động.', 399000, NULL, 'active', 890, 45, DATEADD(day, -25, SYSDATETIME())),
(13, N'Áo Thun Nam Tay Dài Graphic', N'Áo thun tay dài nam với họa tiết graphic trẻ trung. Chất cotton 95%, thoáng mát, thấm hút mồ hôi tốt.', 449000, 379000, 'active', 670, 32, DATEADD(day, -20, SYSDATETIME()));

-- Áo thun nữ
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(14, N'Áo Thun Nữ Cổ Tròn Minimalist', N'Áo thun nữ cổ tròn kiểu minimalist, chất cotton Modal mềm mịn như lụa. Ôm nhẹ form body, tôn dáng. Đủ màu sắc trung tính dễ phối.', 349000, 299000, 'active', 1580, 112, DATEADD(day, -28, SYSDATETIME())),
(14, N'Áo Thun Nữ Oversize Phong Cách', N'Áo thun oversize nữ 2024, rộng rãi thoải mái, có thể phối với quần jeans, chân váy. Chất vải cotton 100%', 379000, NULL, 'active', 1340, 78, DATEADD(day, -22, SYSDATETIME())),
(14, N'Áo Thun Nữ Crop Top', N'Áo thun crop top nữ, crop ngang eo, tôn dáng. Phong cách Y2K đang hot. Chất cotton co giãn.', 259000, 199000, 'active', 2100, 156, DATEADD(day, -15, SYSDATETIME()));

-- Áo sơ mi nam
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(15, N'Áo Sơ Mi Nam Dài Tay Oxford', N'Áo sơ mi nam dài tay chất Oxford cao cấp, cổ điển lịch lãm. Phù hợp đi làm, đi chơi, dự tiệc. May đo chuẩn form.', 599000, 499000, 'active', 980, 67, DATEADD(day, -35, SYSDATETIME())),
(15, N'Áo Sơ Mi Nam Ngắn Tay Havana', N'Áo sơ mi nam ngắn tay chất Havana, phong cách casual. Màu sắc tươi sáng, phù hợp mùa hè. Có thể mặc ngoài hoặc tuck vào.', 449000, NULL, 'active', 720, 41, DATEADD(day, -18, SYSDATETIME())),
(15, N'Áo Sơ Mi Nam Slim Fit Karen', N'Áo sơ mi nam slim fit, ôm sát cơ thể, lịch lãm. Chất vải cotton pha poly, ít nhăn, dễ giặt.', 699000, 599000, 'active', 540, 28, DATEADD(day, -12, SYSDATETIME()));

-- Áo sơ mi nữ
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(16, N'Áo Sơ Mi Nữ Dài Tay Lụa', N'Áo sơ mi nữ dài tay chất lụa cao cấp, sang trọng. Thiết kế thanh lịch, phù hợp công sở hoặc dự tiệc.', 749000, 649000, 'active', 860, 52, DATEADD(day, -30, SYSDATETIME())),
(16, N'Áo Sơ Mi Nữ Ngắn Tay Caro', N'Áo sơ mi nữ ngắn tay họa tiết caro, phong cách trẻ trung. Chất vải cotton thoáng mát, phù hợp mùa hè.', 399000, NULL, 'active', 1100, 73, DATEADD(day, -20, SYSDATETIME())),
(16, N'Áo Sơ Mi Nữ Oversize男友风', N'Áo sơ mi nữ oversize phong cách Hàn Quốc, mượt mà. Có thể mặc như áo khoác nhẹ bên ngoài.', 529000, 459000, 'active', 920, 48, DATEADD(day, -25, SYSDATETIME()));

-- Áo khoác nam
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(17, N'Áo Khoác Nam Jeans Wash Xanh', N'Áo khoác jeans nam wash xanh nhạt, phong cách streetwear. Chất denim dày dặn, bền đẹp theo thời gian.', 899000, 799000, 'active', 760, 44, DATEADD(day, -40, SYSDATETIME())),
(17, N'Áo Khoác Nam Nỉ Bum Đen', N'Áo khoác nỉ nam phong cách Bum, màu đen cổ điển. Ấm áp, phù hợp mùa thu đông. Có mũ trùm đầu.', 649000, NULL, 'active', 630, 35, DATEADD(day, -22, SYSDATETIME())),
(17, N'Áo Khoác Nam Gió 2 Lớp', N'Áo khoác gió nam 2 lớp chống nắng, chống gió. Nhẹ nhàng, dễ gấp gọn, tiện lợi mang theo.', 499000, 399000, 'active', 480, 22, DATEADD(day, -10, SYSDATETIME()));

-- Áo khoác nữ
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(18, N'Áo Khoác Nữ Tweed Cao Cấp', N'Áo khoác tweed nữ cao cấp, thiết kế sang trọng. Phù hợp đi làm công sở, dự tiệc. Phom dáng A-line.', 1299000, 1099000, 'active', 580, 31, DATEADD(day, -35, SYSDATETIME())),
(18, N'Áo Khoác Nữ Cardigan Len', N'Áo khoác cardigan len nữ, mềm mại, ấm áp. Phong cách Hàn Quốc, dễ phối đồ.', 549000, 479000, 'active', 890, 56, DATEADD(day, -18, SYSDATETIME())),
(18, N'Áo Khoác Nữ Parka Phong Cách', N'Áo khoác parka nữ phong cách Military, nhiều túi, có đai eo. Chống nước, chống gió tốt.', 899000, NULL, 'active', 720, 42, DATEADD(day, -28, SYSDATETIME()));

-- Áo phao
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(19, N'Áo Phao Nam Lông Vũ 700FP', N'Áo phao nam lông vũ 700FP cao cấp, siêu nhẹ nhưng cực ấm. Chống nước tốt, phù hợp leo núi, du lịch.', 2499000, 1999000, 'active', 450, 18, DATEADD(day, -50, SYSDATETIME())),
(19, N'Áo Phao Nữ Lông Vũ 650FP', N'Áo phao nữ lông vũ 650FP, thiết kế nữ tính với đường cong nhẹ. Màu pastel dịu dàng. Siêu ấm -20 độ C.', 2199000, 1799000, 'active', 620, 27, DATEADD(day, -45, SYSDATETIME())),
(19, N'Áo Phao Unisex Puffer Minimal', N'Áo phao unisex puffer style tối giản, form rộng thoải mái. Hot trend 2024. Có nhiều màu trung tính.', 1299000, NULL, 'active', 980, 53, DATEADD(day, -20, SYSDATETIME()));

-- Quần jeans nam
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(21, N'Quần Jeans Nam Slim Fit Rách Gối', N'Quần jeans nam slim fit wash xanh đậm, có đứt gối trendy. Phong cách streetwear, phù hợp giới trẻ.', 699000, 599000, 'active', 1100, 76, DATEADD(day, -25, SYSDATETIME())),
(21, N'Quần Jeans Nam Straight Leg Classic', N'Quần jeans nam straight leg classic, form thẳng truyền thống. Chất denim 100% cotton, bền đẹp.', 799000, NULL, 'active', 850, 52, DATEADD(day, -30, SYSDATETIME())),
(21, N'Quần Jeans Nam Wide Leg Wash Nhạt', N'Quần jeans nam wide leg (ống rộng), wash nhạt phong cách Y2K. Hot trend mới nhất.', 749000, 649000, 'active', 670, 38, DATEADD(day, -15, SYSDATETIME()));

-- Quần jeans nữ
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(22, N'Quần Jeans Nữ Skinny Co Giãn', N'Quần jeans nữ skinny co giãn, ôm chân tôn dáng. Mềm mại, thoải mái vận động. Đủ size S-XXL.', 599000, 499000, 'active', 1650, 124, DATEADD(day, -20, SYSDATETIME())),
(22, N'Quần Jeans Nữ Wide Leg Caro', N'Quần jeans nữ ống rộng họa tiết caro, phong cách Hàn Quốc. Form dáng thoải mái, trẻ trung.', 649000, NULL, 'active', 980, 61, DATEADD(day, -18, SYSDATETIME())),
(22, N'Quần Jeans Nữ Baggy Cao Cấp', N'Quần jeans nữ baggy cao cấp, ống cực rộng phong cách 90s. Raw edge thời trang. Must-have item!', 799000, 699000, 'active', 1420, 98, DATEADD(day, -12, SYSDATETIME()));

-- Quần short nam
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(23, N'Quần Short Nam Jean Phong Cách', N'Quần short jeans nam phong cách, dáng vừa. Wash xanh nhạt trendy. Phù hợp mùa hè, đi biển.', 449000, 379000, 'active', 780, 45, DATEADD(day, -22, SYSDATETIME())),
(23, N'Quần Short Nam Kaki Chino', N'Quần short nam kaki chino, chất vải kaki mềm mại. Cổ điển, dễ phối. Phù hợp đi làm casual Friday.', 399000, NULL, 'active', 560, 32, DATEADD(day, -28, SYSDATETIME())),
(23, N'Quần Short Nam Thể Thao 2 Chiều', N'Quần short nam thể thao 2 chiều, co giãn 4 chiều. Thấm hút mồ hôi, khô nhanh. Phù hợp gym, chạy bộ.', 349000, 299000, 'active', 890, 67, DATEADD(day, -10, SYSDATETIME()));

-- Quần short nữ
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(24, N'Quần Short Nữ Jean Mini', N'Quần short jeans nữ mini, ngắn trên gối, phong cách sexy. Denim co giãn nhẹ.', 349000, 299000, 'active', 1340, 89, DATEADD(day, -15, SYSDATETIME())),
(24, N'Quần Short Nữ Kaki Caro', N'Quần short nữ kaki họa tiết caro, dáng regular. Cute, trẻ trung, dễ mix.', 329000, NULL, 'active', 920, 54, DATEADD(day, -20, SYSDATETIME())),
(24, N'Quần Short Nữ Cycling Bike', N'Quần short nữ cycling bike short, phong cách Hàn Quốc. Có lớp đệm, phù hợp đạp xe, gym.', 399000, 349000, 'active', 760, 43, DATEADD(day, -8, SYSDATETIME()));

-- Quần baggy
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(25, N'Quần Baggy Nữ Nỉ Caro', N'Quần baggy nữ chất nỉ bông họa tiết caro, siêu mềm. Ống cực rộng, thoải mái tuyệt đối. Trend 2024!', 449000, 379000, 'active', 1680, 112, DATEADD(day, -18, SYSDATETIME())),
(25, N'Quần Baggy Nữ Jeans Vintage', N'Quần baggy nữ jeans vintage wash đẹp. Phong cách retro, cực kỳ trendy. Phải có trong tủ đồ!', 649000, NULL, 'active', 1420, 88, DATEADD(day, -25, SYSDATETIME())),
(25, N'Quần Baggy Nữ Thun Phong Cách', N'Quần baggy nữ chất thun cotton, phong cáchoversize. Siêu thoải mái, mặc ngủ cũng được.', 299000, 249000, 'active', 2100, 156, DATEADD(day, -12, SYSDATETIME()));

-- Váy ngắn
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(26, N'Váy Ngắn Nữ Mini A-Line', N'Váy ngắn nữ mini A-line, kiểu dáng trẻ trung. Chất vải tweed cao cấp, sang trọng. Nhiều màu xinh xắn.', 549000, 479000, 'active', 890, 52, DATEADD(day, -22, SYSDATETIME())),
(26, N'Váy Ngắn Nữ Tennis Skater', N'Váy tennis nữ skater style, chất thun polo co giãn. Phong cách sporty chic, năng động.', 399000, NULL, 'active', 720, 41, DATEADD(day, -15, SYSDATETIME())),
(26, N'Váy Ngắn Nữ Wrap Ruffle', N'Váy ngắn nữ wrap ruffle, có đai buộc eo. Phong cách bohemian, lãng mạn. Đi biển, đi dạo perfect!', 449000, 379000, 'active', 1100, 68, DATEADD(day, -20, SYSDATETIME()));

-- Váy dài
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(27, N'Váy Dài Nữ Midi Pleated', N'Váy dài midi nữ pleated (xếp nếp), sang trọng. Chất vải chiffon nhẹ nhàng, bay bổng. Dự tiệc, đi event cực đỉnh.', 799000, 699000, 'active', 640, 35, DATEADD(day, -28, SYSDATETIME())),
(27, N'Váy Dài Nữ Maxi Boho', N'Váy maxi nữ bohemian style, hoa văn ethnic. Chất vải voan nhẹ. Đi biển, festival là best choice!', 649000, NULL, 'active', 880, 47, DATEADD(day, -18, SYSDATETIME())),
(27, N'Váy Dài Nữ Linen Tối Giản', N'Váy dài nữ linen tối giản, form thẳng. Phong cách minimal, thanh lịch. Đi làm, đi dạo đều phù hợp.', 549000, 479000, 'active', 560, 29, DATEADD(day, -10, SYSDATETIME()));

-- Đầm ngắn
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(29, N'Đầm Ngắn Nữ Bodycon Co Giãn', N'Đầm ngắn bodycon nữ co giãn, ôm sát body. Phong cách sexy, quyến rũ. Đi party, đi bar cực chất!', 599000, 499000, 'active', 1250, 82, DATEADD(day, -15, SYSDATETIME())),
(29, N'Đầm Ngắn Nữ Shirt Dress', N'Đầm shirt dress nữ, phong cách Hàn Quốc. Mặc như áo khoác cũng được. Đa năng, tiện lợi.', 649000, NULL, 'active', 980, 56, DATEADD(day, -20, SYSDATETIME())),
(29, N'Đầm Ngắn Nữ Babydoll Xòe', N'Đầm babydoll nữ xòe nhẹ, dễ thương. Phong cách vintage, cute. Phù hợp đi chơi, cafe với bạn bè.', 529000, 449000, 'active', 1420, 94, DATEADD(day, -12, SYSDATETIME()));

-- Đầm dài
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(30, N'Đầm Dài Nữ Evening Gown', N'Đầm dài evening gown nữ, sang trọng bậc nhất. Chất sequin lấp lánh. Dự tiệc, gala, event quan trọng.', 1999000, 1699000, 'active', 380, 12, DATEADD(day, -45, SYSDATETIME())),
(30, N'Đầm Dài Nữ Maxi Casual', N'Đầm maxi nữ casual, thoải mái. Chất vải cotton lụa, mát mẻ. Đi biển, đi dạo phố đều OK.', 649000, NULL, 'active', 760, 44, DATEADD(day, -25, SYSDATETIME())),
(30, N'Đầm Dài Nữ Slip Quây Lụa', N'Đầm slip nữ chất lụa quây, phong cách minimal. Lịch lãm, sang trọng. Hot trend từ Jennie!', 899000, 799000, 'active', 1120, 67, DATEADD(day, -18, SYSDATETIME()));

-- Đầm công sở
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(31, N'Đầm Công Sở Nữ Pencil Dress', N'Đầm pencil nữ công sở, chuyên nghiệp. Chất vải kre cao cấp, không nhăn. Phải có cho dân văn phòng!', 899000, 799000, 'active', 720, 41, DATEADD(day, -30, SYSDATETIME())),
(31, N'Đầm Công Sở Nữ Blazer Dress', N'Đầm blazer dress nữ, phong cách power dressing. Mạnh mẽ, lịch lãm. Gặp khách hàng, họp quan trọng.', 1299000, 1099000, 'active', 540, 28, DATEADD(day, -35, SYSDATETIME())),
(31, N'Đầm Công Sở Nữ A-Line Office', N'Đầm A-line nữ công sở, dáng vừa phải. Thoải mái mà vẫn chuyên nghiệp. Nhiều màu trung tính.', 749000, 649000, 'active', 680, 39, DATEADD(day, -20, SYSDATETIME()));

-- Giày thể thao
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(33, N'Giày Thể Thao Nam Classic White', N'Giày thể thao nam classic trắng, minimal style. Da tổng hợp cao cấp, êm chân. Phối đồ với mọi thứ!', 899000, 799000, 'active', 1560, 98, DATEADD(day, -25, SYSDATETIME())),
(33, N'Giày Thể Thao Nam Running Pro', N'Giày chạy bộ nam running pro, công nghệ đệm Air. Nhẹ, êm, hỗ trợ跑步 (chạy) tốt. Dành cho runner!', 1499000, 1299000, 'active', 890, 45, DATEADD(day, -30, SYSDATETIME())),
(33, N'Giày Thể Thao Nam High Top Street', N'Giày high top nam phong cách streetwear, chunky design. Hot trend 2024. Cực ngầu!', 1199000, NULL, 'active', 1240, 72, DATEADD(day, -15, SYSDATETIME())),
(33, N'Giày Thể Thao Nữ Sneaker Platform', N'Giày sneaker nữ platform cao, tăng chiều cao. Phong cách Hàn Quốc, cực kỳ xinh. Must-have!', 999000, 899000, 'active', 2100, 145, DATEADD(day, -20, SYSDATETIME())),
(33, N'Giày Thể Thao Nữ Classic Pink', N'Giày thể thao nữ classic màu hồng, ngọt ngào. Da mềm, đế cao su bền. Đi chơi, đi làm đều xinh.', 799000, NULL, 'active', 1680, 112, DATEADD(day, -22, SYSDATETIME())),
(33, N'Giày Thể Thao Nữ Slip-On Canvas', N'Giày slip-on nữ canvas, không cần buộc dây. Tiện lợi, nhanh chóng. Phong cách casual.', 549000, 479000, 'active', 1320, 88, DATEADD(day, -12, SYSDATETIME()));

-- Giày da
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(34, N'Giày Da Nam Oxford Classic', N'Giày da oxford nam cao cấp, giày lịch lãm. Da thật 100%, đế leather. Phù hợp công sở, dự tiệc.', 1899000, 1599000, 'active', 420, 18, DATEADD(day, -40, SYSDATETIME())),
(34, N'Giày Da Nam Derby Casual', N'Giày derby nam da thật, phong cách casual. Thoải mái hơn oxford, vẫn lịch sự. Đi chơi cuối tuần perfect!', 1499000, NULL, 'active', 560, 29, DATEADD(day, -28, SYSDATETIME())),
(34, N'Giày Da Nữ Bít Toe Kitten Heel', N'Giày da nữ bít toe kitten heel, thanh lịch. Màu đen/nude cổ điển. Đi làm, đi tiệc đều OK.', 1199000, 999000, 'active', 780, 42, DATEADD(day, -25, SYSDATETIME())),
(34, N'Giày Da Nữ Loafer Penny', N'Giày loafer nữ penny style, không dây tiện lợi. Phong cách preppy, trẻ trung. Đi học, đi làm đều xinh.', 899000, NULL, 'active', 640, 35, DATEADD(day, -18, SYSDATETIME()));

-- Sandal
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(35, N'Sandal Nữ Đế Ruột Bánh Mì', N'Sandal nữ đế ruột bánh mì, siêu trend 2024. Chất da lộn mềm mại. Đi biển, đi phố đều cool!', 599000, 499000, 'active', 980, 62, DATEADD(day, -15, SYSDATETIME())),
(35, N'Sandal Nữ Cao Gót Strappy', N'Sandal cao gót nữ strappy, gợi cảm. Phong cách sexy, quyến rũ. Đi tiệc, đi bar cực chất!', 799000, NULL, 'active', 720, 38, DATEADD(day, -20, SYSDATETIME())),
(35, N'Sandal Nam Leather Slide', N'Sandal nam slide da, đơn giản nam tính. Đế EVA êm ái. Mặc với quần shorts, rất cool!', 449000, 399000, 'active', 540, 31, DATEADD(day, -10, SYSDATETIME()));

-- Giày cao gót
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(36, N'Giày Cao Gót Nữ Stiletto Classic', N'Giày cao gót stiletto nữ cổ điển, mũi nhọn. Cao 8cm, thanh lịch. Màu đen/nude cơ bản. Đi tiệc must-have!', 799000, 699000, 'active', 1120, 67, DATEADD(day, -22, SYSDATETIME())),
(36, N'Giày Cao Gót Nữ Block Heel Comfort', N'Giày cao gót block nữ, đế vuông vững chắc. Êm chân, không đau. Phù hợp đứng lâu, đi nhiều.', 899000, NULL, 'active', 860, 48, DATEADD(day, -18, SYSDATETIME())),
(36, N'Giày Cao Gót Nữ Wedge Sandal', N'Giày cao gót wedge sandal nữ, đế hình nêm. Kết hợp tiện lợi của sandal và chiều cao của gót. Cực kỳ trendy!', 999000, 849000, 'active', 680, 36, DATEADD(day, -25, SYSDATETIME()));

-- Balo
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(37, N'Balo Laptop Nam Minimal', N'Balo laptop nam minimal, thiết kế tối giản. Chứa laptop 15.6 inch, nhiều ngăn. Đi học, đi làm đều OK.', 699000, 599000, 'active', 920, 54, DATEADD(day, -28, SYSDATETIME())),
(37, N'Balo Laptop Nữ Canvas', N'Balo nữ canvas phong cách Hàn Quốc, xinh xắn. Có túi nước uống, túi laptop. Đi học cực yêu!', 549000, NULL, 'active', 1340, 88, DATEADD(day, -15, SYSDATETIME())),
(37, N'Balo Du Lịch Nam Travel Pro', N'Balo du lịch nam travel pro, 45L siêu to. Có ngăn đựng giày, quần áo riêng. Đi phượt perfect!', 1199000, 999000, 'active', 460, 22, DATEADD(day, -35, SYSDATETIME()));

-- Túi đeo chéo
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(38, N'TúI Đeo Chéo Nam Crossbody', N'Túi đeo chéo nam crossbody, phong cách streetwear. Chất vải canvas bền bỉ. Đi chơi, đi phố cực ngầu!', 449000, 379000, 'active', 780, 45, DATEADD(day, -20, SYSDATETIME())),
(38, N'TúI Đeo Chéo Nữ Mini Bag', N'Túi mini nữ đeo chéo, xinh xắn. Chất da tổng hợp cao cấp. Đi cafe, đi mall perfect!', 349000, NULL, 'active', 1560, 102, DATEADD(day, -12, SYSDATETIME())),
(38, N'TúI Đeo Chéo Unisex Messenger', N'Túi messenger unisex, phong cách vintage. Có nhiều ngăn, đựng được tablet. Đi học, đi làm đều OK.', 649000, 549000, 'active', 620, 34, DATEADD(day, -25, SYSDATETIME()));

-- Túi xách tay
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(39, N'TúI Xách Nữ Tote Bag Classic', N'Túi tote nữ cổ điển, đựng vừa laptop 14 inch. Da PU cao cấp, sang trọng. Đi làm, đi meeting chuyên nghiệp.', 899000, 799000, 'active', 1080, 65, DATEADD(day, -22, SYSDATETIME())),
(39, N'TúI Xách Nữ Satchel Elegant', N'Túi satchel nữ thanh lịch, có khóa kim loại. Đeo chéo hoặc cầm tay đều xinh. Đi tiệc, đi chơi đều OK.', 1199000, NULL, 'active', 840, 47, DATEADD(day, -30, SYSDATETIME())),
(39, N'TúI Xách Nữ Bucket Hobo', N'Túi bucket/hobo nữ, form mềm. Chất vải nỉ cao cấp, nhẹ. Phong cách casual, thoải mái. Trend 2024!', 599000, 499000, 'active', 1260, 82, DATEADD(day, -18, SYSDATETIME()));

-- Ví nam
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(40, N'Ví Nam Da Dài Bifold', N'Ví da nam dài bifold cao cấp, da bò thật. Nhiều ngăn đựng tiền, thẻ. Sang trọng, bền đẹp.', 599000, 499000, 'active', 540, 32, DATEADD(day, -30, SYSDATETIME())),
(40, N'Ví Nam Ngắn Trifold', N'Ví ngắn nam trifold, nhỏ gọn. Đựng vừa trong túi quần. Da tổng hợp cao cấp.', 349000, NULL, 'active', 420, 25, DATEADD(day, -20, SYSDATETIME())),
(40, N'Ví Nam RFID Chống Trộm', N'Ví nam chống trộm RFID, công nghệ bảo mật. Da thật, nhiều ngăn. An tâm khi đi du lịch.', 799000, 699000, 'active', 380, 19, DATEADD(day, -25, SYSDATETIME()));

-- Đồng hồ
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(41, N'Đồng Hồ Nam Classic Round', N'Đồng hồ nam round face, mặt tròn cổ điển. Máy quartz Nhật bền bỉ. Dây da genuine. Lịch lãm!', 1999000, 1699000, 'active', 680, 38, DATEADD(day, -40, SYSDATETIME())),
(41, N'Đồng Hồ Nam Smart Watch Pro', N'Đồng hồ thông minh nam pro, màn AMOLED 1.4 inch. Đo nhịp tim, step, sleep. Phong cách sporty.', 2999000, 2499000, 'active', 920, 45, DATEADD(day, -35, SYSDATETIME())),
(41, N'Đồng Hồ Nữ Rose Gold Minimal', N'Đồng hồ nữ rose gold, mặt tròn nhỏ minimal. Dây mesh inox. Sang trọng, thanh lịch. Quà tặng perfect!', 1499000, 1299000, 'active', 780, 52, DATEADD(day, -30, SYSDATETIME())),
(41, N'Đồng Hồ Nữ Square Lady', N'Đồng hồ nữ mặt vuông, phong cách vintage. Có lịch ngày. Dây da xinh xắn. Cute!', 999000, NULL, 'active', 560, 34, DATEADD(day, -22, SYSDATETIME()));

-- Kính mát
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(42, N'Kính Mát Nam Aviator Classic', N'Kính mát nam aviator huyền thoại, gọng kim loại. Tròng gradient UV400. Mặc là ngầu!', 899000, 799000, 'active', 720, 42, DATEADD(day, -25, SYSDATETIME())),
(42, N'Kính Mát Nam Square Bold', N'Kính mát nam vuông bold, gọng nhựa to. Phong cách Y2K. Hot trend!', 699000, NULL, 'active', 640, 38, DATEADD(day, -18, SYSDATETIME())),
(42, N'Kính Mát Nữ Cat Eye', N'Kính mát nữ cat eye, kiểu mèo cute. Gọng vành nhỏ, nữ tính. Tặng闺蜜 (bạn thân) cực phù hợp!', 549000, 479000, 'active', 1100, 76, DATEADD(day, -15, SYSDATETIME())),
(42, N'Kính Mát Nữ Round Vintage', N'Kính mát nữ round vintage, kiểu John Lennon. Gọng tròn đầy đủ. Phong cách retro cực cool!', 649000, NULL, 'active', 880, 54, DATEADD(day, -20, SYSDATETIME()));

-- Mũ
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(43, N'Mũ Lưỡi Trai Nam Snapback', N'Mũ snapback nam, snapback cổ điển. Chất nỉ bông dày dặn. Phong cách streetwear. Cực ngầu!', 299000, 249000, 'active', 860, 58, DATEADD(day, -15, SYSDATETIME())),
(43, N'Mũ Bucket Nữ Summer Hat', N'Mũ bucket nữ mùa hè, vành rộng chống nắng. Chất vải linen nhẹ. Đi biển must-have!', 349000, NULL, 'active', 720, 44, DATEADD(day, -10, SYSDATETIME())),
(43, N'Mũ Len Nam Beanie Classic', N'Mũ len beanie nam cổ điển, ấm áp mùa đông. Chất len merino mềm, không ngứa. Simple nhưng cool!', 249000, 199000, 'active', 640, 42, DATEADD(day, -20, SYSDATETIME())),
(43, N'Mũ Fedora Nữ Elegant', N'Mũ fedora nữ sang trọng, vành rộng. Chất nhung bông mềm. Đi dạo phố, chụp ảnh cực xinh!', 449000, NULL, 'active', 580, 31, DATEADD(day, -25, SYSDATETIME()));

-- Khăn
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(44, N'Khăn Lụa Nữ Silk Scarf', N'Khăn lụa nữ 90x90cm, lụa tơ tằm 100%. Hoa văn thiết kế độc quyền. Sang trọng, quý phái. Quà tặng cao cấp!', 599000, 499000, 'active', 480, 28, DATEADD(day, -30, SYSDATETIME())),
(44, N'Khăn Choàng Len Oversize', N'Khăn choàng len oversize, siêu to 200x70cm. Ấm áp mùa đông. Phong cách Hàn Quốc. Wrap around là hot!', 449000, NULL, 'active', 620, 39, DATEADD(day, -22, SYSDATETIME())),
(44, N'Khăn Bandana Nam Cowboy', N'Khăn bandana nam cowboy style, 55x55cm. Chất cotton thấm hút tốt. Đeo cổ, đeo đầu đều cool!', 149000, 129000, 'active', 540, 35, DATEADD(day, -12, SYSDATETIME())),
(44, N'Khăn Turban Nữ Stylish', N'Khăn turban nữ stylish, kiểu xếp nếp sang trọng. Chất voan nhẹ. Đội đi chơi, đi tiệc cực xinh!', 349000, 299000, 'active', 380, 22, DATEADD(day, -18, SYSDATETIME()));

-- Áo hoodie nam
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(45, N'Áo Hoodie Nam Essentials Plain', N'Áo hoodie nam essentials plain, đơn giản mà chất. Chất nỉ bông fleece mềm mại, ấm áp. Có mũ trùm, túi kangaroo.', 649000, 549000, 'active', 1420, 89, DATEADD(day, -20, SYSDATETIME())),
(45, N'Áo Hoodie Nam Graphic Print', N'Áo hoodie nam graphic in hoa văn nổi bật. Phong cách streetwear, hypebeast. Cực ngầu!', 799000, NULL, 'active', 980, 56, DATEADD(day, -15, SYSDATETIME())),
(45, N'Áo Hoodie Nam Zipper Full', N'Áo hoodie nam zipper full (có zip), tiện lợi. Mặc mở như áo khoác, đóng như hoodie. 2-in-1!', 899000, 799000, 'active', 760, 44, DATEADD(day, -25, SYSDATETIME()));

-- Áo hoodie nữ
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(46, N'Áo Hoodie Nữ Cropped Essential', N'Áo hoodie cropped nữ, crop ngắn tôn dáng. Phong cách Y2K đang hot. Cute và trendy!', 499000, 399000, 'active', 1680, 112, DATEADD(day, -12, SYSDATETIME())),
(46, N'Áo Hoodie Nữ Oversize Love', N'Áo hoodie oversize nữ hình trái tim, siêu cute. Chất nỉ bông mềm, ấm áp. Gift cho bạn gái perfect!', 549000, NULL, 'active', 1240, 78, DATEADD(day, -18, SYSDATETIME())),
(46, N'Áo Hoodie Nữ Zipper Lightweight', N'Áo hoodie nữ zipper nhẹ, phù hợp mùa thu. Chất french terry thoáng mát. Đi học, đi chơi đều OK.', 599000, 499000, 'active', 890, 52, DATEADD(day, -22, SYSDATETIME()));

-- Áo polo nam
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(47, N'Áo Polo Nam Classic Pique', N'Áo polo nam classic pique, chất vải pique cotton thoáng mát. Phom dáng regular vừa vặn. Đi làm, chơi golf đều OK.', 499000, 399000, 'active', 860, 52, DATEADD(day, -25, SYSDATETIME())),
(47, N'Áo Polo Nam Slim Fit Dry', N'Áo polo nam slim fit, vải dry thấm hút nhanh. Công nghệ moisture-wicking. Dành cho sporty men!', 599000, NULL, 'active', 640, 38, DATEADD(day, -20, SYSDATETIME())),
(47, N'Áo Polo Nam Rugby Stripes', N'Áo polo rugby stripes nam, sọc vintage phong cách. Chất vải cotton twill bền đẹp. Retro cool!', 549000, 479000, 'active', 480, 27, DATEADD(day, -30, SYSDATETIME()));

-- Áo polo nữ
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(48, N'Áo Polo Nữ Relaxed Fit Classic', N'Áo polo nữ relaxed fit cổ điển, thoải mái. Chất pique cotton mềm mại. Phong cách sporty chic.', 449000, 379000, 'active', 720, 44, DATEADD(day, -18, SYSDATETIME())),
(48, N'Áo Polo Nữ Slim Stretch', N'Áo polo nữ slim stretch, ôm nhẹ body. Co giãn 4 chiều. Màu pastel dịu dàng. Cực kỳ xinh!', 499000, NULL, 'active', 580, 33, DATEADD(day, -22, SYSDATETIME())),
(48, N'Áo Polo Nữ Tennis Dress Style', N'Áo polo nữ tennis dress style, dáng đầm ngắn. Phong cách sporty nữ tính. Đi chơi, đi tennis đều xinh.', 599000, 499000, 'active', 420, 24, DATEADD(day, -15, SYSDATETIME()));


/* ============================================================
   4B. BỔ SUNG 40 SẢN PHẨM MỚI (Phong phú danh mục còn thiếu)
   Phạm vi: Áo phao, Vest, Quần short, Baggy, Váy, Đầm,
            Giày, Túi xách, Phụ kiện.
   Mỗi sản phẩm được thêm variants + images ngay bên dưới.
   ============================================================ */

/* ===== Áo phao (CategoryId = 20) — 3 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(20, N'Áo Phao Unisex Down 800FP', N'Áo phao lông vũ 800 fill power, siêu nhẹ, siêu ấm. Vải chống nước nhẹ. Phù hợp trekking, leo núi mùa đông. Unisex.', 2490000, 1990000, 'active', 540, 31, DATEADD(day, -7, SYSDATETIME())),
(20, N'Áo Phao Nữ Dáng Dài Elegant', N'Áo phao nữ dáng dài tới gối, thiết kế thanh lịch. Lớp lông vũ tổng hợp dày ấm. Mũ lông viền có thể tháo rời.', 1790000, NULL, 'active', 410, 22, DATEADD(day, -9, SYSDATETIME())),
(20, N'Áo Phao Nam Hooded Puffer', N'Áo phao nam puffer có mũ, chất liệu polyester chống gió. 3 lớp cách nhiệt. Phong cách thể thao trẻ trung.', 1590000, 1390000, 'active', 320, 18, DATEADD(day, -11, SYSDATETIME()));

/* ===== Áo vest (CategoryId = 21) — 2 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(21, N'Áo Vest Nam Công Sở Classic', N'Áo vest nam công sở phong cách cổ điển, chất wool blend cao cấp. Form slim fit hiện đại. Đi kèm quần âu đồng bộ.', 1890000, 1690000, 'active', 720, 48, DATEADD(day, -14, SYSDATETIME())),
(21, N'Áo Vest Nữ Blazer Kẻ Caro', N'Áo vest nữ blazer họa tiết kẻ caro Hàn Quốc, dáng rộng. Có thể mặc đi làm hoặc đi chơi. Đường may tinh tế.', 1290000, NULL, 'active', 580, 36, DATEADD(day, -16, SYSDATETIME()));

/* ===== Quần short nam (CategoryId = 24) — 3 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(24, N'Quần Short Nam Kaki Chino', N'Quần short nam kaki phong cách Chino, ống suông. Chất cotton twill dày dặn. Có túi sau có nắp.', 449000, 369000, 'active', 880, 64, DATEADD(day, -8, SYSDATETIME())),
(24, N'Quần Short Nam Thể Thao Performance', N'Quần short nam thể thao công nghệ quick-dry, siêu co giãn. Lý tưởng cho gym, chạy bộ. Có dây rút.', 399000, NULL, 'active', 690, 42, DATEADD(day, -10, SYSDATETIME())),
(24, N'Quần Short Nam Denim Vintage', N'Quần short nam denim wash vintage, xanh nhạt. Phong cách streetwear. Form regular vừa vặn.', 499000, 419000, 'active', 510, 27, DATEADD(day, -13, SYSDATETIME()));

/* ===== Quần short nữ (CategoryId = 25) — 2 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(25, N'Quần Short Nữ Cạp Cao Denim', N'Quần short nữ cạp cao denim, ôm dáng. Chất vải jeans co giãn nhẹ. Ống ngắn trên gối.', 399000, 339000, 'active', 760, 51, DATEADD(day, -8, SYSDATETIME())),
(25, N'Quần Short Nữ Vải Linen Mùa Hè', N'Quần short nữ vải linen thoáng mát, lý tưởng mùa hè. Tone pastel nhẹ nhàng. Phối áo thun, áo sơ mi đều đẹp.', 349000, NULL, 'active', 620, 38, DATEADD(day, -12, SYSDATETIME()));

/* ===== Quần baggy nữ (CategoryId = 26) — 2 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(26, N'Quần Baggy Nữ Kaki Cargo', N'Quần baggy nữ kaki cargo phong cách Hàn Quốc, nhiều túi hộp. Form rộng, dài chạm mắt cá. Có dây rút eo.', 599000, 499000, 'active', 920, 73, DATEADD(day, -6, SYSDATETIME())),
(26, N'Quần Baggy Nữ Jeans Oversize', N'Quần baggy nữ jeans oversize, wash xanh nhạt. Phong cách Y2K, phối với áo croptop hoặc áo thun oversized.', 549000, NULL, 'active', 830, 58, DATEADD(day, -9, SYSDATETIME()));

/* ===== Váy ngắn (CategoryId = 27) — 3 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(27, N'Váy Ngắn Tennis Pleated', N'Chân váy tennis ngắn xếp ly, phong cách preppy. Chất vải polyester chống nhăn. Có quần bảo hộ bên trong.', 449000, 379000, 'active', 1080, 92, DATEADD(day, -5, SYSDATETIME())),
(27, N'Váy Ngắn Denim Button Front', N'Váy ngắn denim hàng nút phía trước, wash xanh nhạt. Form A-line, dài trên gối. Phong cách trẻ trung.', 399000, NULL, 'active', 870, 67, DATEADD(day, -7, SYSDATETIME())),
(27, N'Váy Ngắn Xếp Tầng Hoa Nhí', N'Váy ngắn xếp tầng họa tiết hoa nhí vintage. Chất vải chiffon nhẹ, bay. Tone be ấm áp.', 479000, 399000, 'active', 690, 48, DATEADD(day, -11, SYSDATETIME()));

/* ===== Váy dài (CategoryId = 28) — 2 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(28, N'Váy Dài Midi Lụa Sang Trọng', N'Chân váy midi lụa cao cấp, dáng chữ A. Mềm mại, rủ nhẹ tự nhiên. Tone ngà và be. Đi tiệc hoặc công sở đều đẹp.', 699000, 599000, 'active', 540, 36, DATEADD(day, -10, SYSDATETIME())),
(28, N'Váy Dài Xếp Ly Vintage', N'Chân váy dài xếp ly nhỏ phong cách vintage. Chất cotton pha. Tone nâu đất ấm cúng.', 599000, NULL, 'active', 470, 29, DATEADD(day, -14, SYSDATETIME()));

/* ===== Chân váy (CategoryId = 29) — 3 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(29, N'Chân Váy Công Sở Bút Chì', N'Chân váy công sở dáng bút chì ôm dáng, dài qua gối. Chất vải dày dặn không nhăn. Có lớp lót bên trong.', 549000, 459000, 'active', 920, 71, DATEADD(day, -8, SYSDATETIME())),
(29, N'Chân Váy Tennis Trắng Basic', N'Chân váy tennis ngắn trắng basic. Chất vải thể thao co giãn 4 chiều. Phù hợp đi chơi, picnic.', 399000, NULL, 'active', 810, 64, DATEADD(day, -10, SYSDATETIME())),
(29, N'Chân Váy Jean Wash Light', N'Chân váy jean wash nhạt, dáng A. Có xẻ tà sau. Form regular fit, dài ngang gối.', 479000, 399000, 'active', 660, 41, DATEADD(day, -13, SYSDATETIME()));

/* ===== Đầm dài (CategoryId = 31) — 2 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(31, N'Đầm Dài Maxi Hoa Bohemian', N'Đầm maxi dài chấm gót, họa tiết hoa bohemian. Chất vải viscose mềm mại. Tay lửng, eo chiết nhẹ.', 899000, 749000, 'active', 720, 53, DATEADD(day, -7, SYSDATETIME())),
(31, N'Đầm Dài Lụa Đỏ Tiệc Tối', N'Đầm dài lụa đỏ dự tiệc, dáng ôm body. Tone đỏ rượu vang quyến rũ. Đường cut-out lưng tinh tế.', 1490000, NULL, 'active', 540, 32, DATEADD(day, -12, SYSDATETIME()));

/* ===== Đầm công sở (CategoryId = 32) — 3 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(32, N'Đầm Công Sở Đen Basic', N'Đầm công sở đen basic, dáng suông. Chất vải dày dặn không nhăn. Cổ tròn, tay ngắn. Dài qua gối.', 699000, 599000, 'active', 980, 78, DATEADD(day, -6, SYSDATETIME())),
(32, N'Đầm Công Sở Be Kẻ Sọc', N'Đầm công sở be kẻ sọc dọc. Chất vải wool blend. Thiết kế thanh lịch, phù hợp dự họp, thuyết trình.', 799000, NULL, 'active', 720, 49, DATEADD(day, -9, SYSDATETIME())),
(32, N'Đầm Công Sở Xanh Navy Tay Dài', N'Đầm công sở xanh navy tay dài, cổ cao. Dáng ôm nhẹ, dài qua gối. Tone navy sang trọng, dễ phối phụ kiện.', 849000, 729000, 'active', 610, 42, DATEADD(day, -13, SYSDATETIME()));

/* ===== Giày thể thao (CategoryId = 33) — 2 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(33, N'Giày Sneaker Trắng Minimalist', N'Giày sneaker trắng minimalist phong cách Hàn Quốc. Đế cao su êm, chất da tổng hợp dễ vệ sinh. Unisex.', 990000, 799000, 'active', 1240, 105, DATEADD(day, -5, SYSDATETIME())),
(33, N'Giày Running Nam Công Nghệ Cao', N'Giày chạy bộ nam đế foam nhẹ, hỗ trợ vòm. Công nghệ đệm khí. Phù hợp marathon, gym.', 1490000, 1290000, 'active', 880, 64, DATEADD(day, -8, SYSDATETIME()));

/* ===== Giày da (CategoryId = 34) — 2 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(34, N'Giày Tây Nam Da Bò Cao Cấp', N'Giày tây nam da bò thật 100%, đánh bóng tay. Đế da may đôi, bền chắc. Phù hợp vest, sơ mi công sở.', 1890000, 1590000, 'active', 540, 36, DATEADD(day, -10, SYSDATETIME())),
(34, N'Giày Loafer Nữ Da Mềm', N'Giày loafer nữ da bò mềm, đế thấp. Tone nâu và be. Phối với váy công sở, quần jeans đều đẹp.', 1290000, NULL, 'active', 480, 31, DATEADD(day, -13, SYSDATETIME()));

/* ===== Sandal (CategoryId = 35) — 1 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(35, N'Sandal Đế Bệt Quai Vải', N'Sandal đế bệt quai vải canvas bện. Tone nâu đất, basic. Phù hợp mùa hè, đi biển, picnic.', 299000, 239000, 'active', 720, 53, DATEADD(day, -7, SYSDATETIME()));

/* ===== Giày cao gót (CategoryId = 36) — 2 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(36, N'Giày Cao Gót Mũi Nhọn 7cm', N'Giày cao gót nữ mũi nhọn 7cm. Da bò tổng hợp. Tone đen, be, nude. Đi tiệc, công sở.', 799000, 679000, 'active', 870, 68, DATEADD(day, -8, SYSDATETIME())),
(36, N'Giày Cao Gót Quai Mảnh 5cm', N'Giày cao gót nữ quai mảnh 5cm. Form kitten heel. Tone pastel dịu dàng. Dễ đi, êm chân.', 699000, NULL, 'active', 690, 49, DATEADD(day, -11, SYSDATETIME()));

/* ===== Balo (CategoryId = 37) — 2 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(37, N'Balo Laptop Chống Nước', N'Balo laptop 15 inch, chất liệu polyester chống nước. Ngăn laptop riêng, nhiều ngăn phụ. Cổng USB sạc.', 799000, 649000, 'active', 1180, 92, DATEADD(day, -5, SYSDATETIME())),
(37, N'Balo Mini Da Pu Basic', N'Balo mini da PU basic. Form nhỏ gọn, dây đeo điều chỉnh được. Tone đen, be. Phù hợp đi học, đi chơi.', 549000, NULL, 'active', 920, 71, DATEADD(day, -9, SYSDATETIME()));

/* ===== Túi đeo chéo (CategoryId = 38) — 1 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(38, N'Túi Đeo Chéo Canvas Vintage', N'Túi đeo chéo canvas vintage, khóa kéo YKK. Ngăn chính + ngăn phụ. Tone xanh rêu, nâu đất.', 449000, 379000, 'active', 640, 42, DATEADD(day, -10, SYSDATETIME()));

/* ===== Ví nam (CategoryId = 41) — 1 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(41, N'Ví Nam Da Bò Ngang Gấp', N'Ví nam da bò thật, gấp ngang. Nhiều ngăn đựng thẻ, ngăn đựng tiền mặt. Tone đen, nâu. May viền tỉ mỉ.', 549000, NULL, 'active', 580, 38, DATEADD(day, -11, SYSDATETIME()));

/* ===== Đồng hồ (CategoryId = 42) — 1 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(42, N'Đồng Hồ Unisex Mặt Tròn Minimalist', N'Đồng hồ unisex mặt tròn minimalist, dây da. Kính cứng chống xước. Chống nước 30m. Tone vàng, đen.', 899000, 749000, 'active', 920, 67, DATEADD(day, -7, SYSDATETIME()));

/* ===== Kính mát (CategoryId = 43) — 1 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(43, N'Kính Mát Aviator UV400', N'Kính mát aviator UV400, gọng kim loại vàng. Tròng kính polarised chống chói. Unisex. Đi kèm hộp và khăn lau.', 699000, NULL, 'active', 720, 51, DATEADD(day, -10, SYSDATETIME()));

/* ===== Mũ (CategoryId = 44) — 1 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(44, N'Mũ Lưỡi Trai Unisex Basic', N'Mũ lưỡi trai unisex basic, chất cotton canvas dày dặn. Có khóa điều chỉnh phía sau. Tone đen, be, xanh rêu.', 249000, 199000, 'active', 870, 64, DATEADD(day, -8, SYSDATETIME()));

/* ===== Khăn (CategoryId = 45) — 1 sp ===== */
INSERT INTO Products (CategoryId, Name, Description, BasePrice, DiscountPrice, Status, ViewCount, SoldCount, CreatedAt) VALUES
(45, N'Khăn Len Cashmere Mùa Đông', N'Khăn quàng cổ len cashmere pha, mềm mại, giữ ấm tốt. Kích thước lớn 180x30cm. Tone be, xám, đỏ rượu vang.', 399000, NULL, 'active', 540, 38, DATEADD(day, -12, SYSDATETIME()));


/* ============================================================
   4C. VARIANTS + IMAGES CHO 40 SẢN PHẨM MỚI (ID 108 → 147)
   Mỗi sản phẩm có 4–10 variants và 2–4 ảnh.
   ============================================================ */

/* --- 108-110: Áo phao --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(108, 'M', 'Đen', 18, 'AP-DN-800-M-DEN'), (108, 'L', 'Đen', 22, 'AP-DN-800-L-DEN'), (108, 'XL', 'Đen', 15, 'AP-DN-800-XL-DEN'),
(108, 'M', 'Xanh Navy', 16, 'AP-DN-800-M-NAV'), (108, 'L', 'Xanh Navy', 20, 'AP-DN-800-L-NAV'),
(109, 'S', 'Be', 12, 'APNU-EL-S-BE'), (109, 'M', 'Be', 18, 'APNU-EL-M-BE'), (109, 'L', 'Be', 14, 'APNU-EL-L-BE'), (109, 'S', 'Đen', 10, 'APNU-EL-S-DEN'), (109, 'M', 'Đen', 16, 'APNU-EL-M-DEN'),
(110, 'M', 'Đen', 20, 'APN-HD-M-DEN'), (110, 'L', 'Đen', 24, 'APN-HD-L-DEN'), (110, 'XL', 'Đen', 18, 'APN-HD-XL-DEN'), (110, 'M', 'Xám', 16, 'APN-HD-M-GRA'), (110, 'L', 'Xám', 20, 'APN-HD-L-GRA');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(108, 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&q=80&fit=crop', 1), (108, 'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=600&q=80&fit=crop', 0), (108, 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=600&q=80&fit=crop', 0),
(109, 'https://images.unsplash.com/photo-1544022613-e0ca75dff7d5?w=600&q=80&fit=crop', 1), (109, 'https://images.unsplash.com/photo-1578582928712-3b9b3b2c9b5e?w=600&q=80&fit=crop', 0),
(110, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80&fit=crop', 1), (110, 'https://images.unsplash.com/photo-1605908502724-9093a79a1b39?w=600&q=80&fit=crop', 0);

/* --- 111-112: Áo vest --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(111, 'M', 'Đen', 14, 'AVN-CL-M-DEN'), (111, 'L', 'Đen', 18, 'AVN-CL-L-DEN'), (111, 'XL', 'Đen', 12, 'AVN-CL-XL-DEN'),
(111, 'M', 'Xanh Navy', 10, 'AVN-CL-M-NAV'), (111, 'L', 'Xanh Navy', 14, 'AVN-CL-L-NAV'),
(112, 'S', 'Be Caro', 12, 'AVNU-BC-S-BC'), (112, 'M', 'Be Caro', 18, 'AVNU-BC-M-BC'), (112, 'L', 'Be Caro', 14, 'AVNU-BC-L-BC'), (112, 'S', 'Xám Caro', 10, 'AVNU-BC-S-GC');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(111, 'https://images.unsplash.com/photo-1507679799987-c53779524cc8?w=600&q=80&fit=crop', 1), (111, 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80&fit=crop', 0),
(112, 'https://images.unsplash.com/photo-1551489186-cf8726f514f8?w=600&q=80&fit=crop', 1), (112, 'https://images.unsplash.com/photo-1572804013309-a59a8d4f7af4?w=600&q=80&fit=crop', 0);

/* --- 113-115: Quần short nam --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(113, '30', 'Be', 25, 'QSN-CH-30-BE'), (113, '32', 'Be', 32, 'QSN-CH-32-BE'), (113, '34', 'Be', 28, 'QSN-CH-34-BE'), (113, '32', 'Xanh Navy', 22, 'QSN-CH-32-NAV'), (113, '34', 'Xanh Navy', 18, 'QSN-CH-34-NAV'),
(114, 'M', 'Đen', 30, 'QSN-PF-M-DEN'), (114, 'L', 'Đen', 38, 'QSN-PF-L-DEN'), (114, 'XL', 'Đen', 26, 'QSN-PF-XL-DEN'), (114, 'M', 'Xám', 24, 'QSN-PF-M-GRA'),
(115, '30', 'Xanh Nhạt', 20, 'QSN-DV-30-XN'), (115, '32', 'Xanh Nhạt', 28, 'QSN-DV-32-XN'), (115, '34', 'Xanh Nhạt', 22, 'QSN-DV-34-XN'), (115, '30', 'Xanh Đậm', 16, 'QSN-DV-30-XD');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(113, 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80&fit=crop', 1), (113, 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&q=80&fit=crop', 0),
(114, 'https://images.unsplash.com/photo-1565693413579-8a73ce8d8a4f?w=600&q=80&fit=crop', 1), (114, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&fit=crop', 0),
(115, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80&fit=crop', 1), (115, 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&q=80&fit=crop', 0);

/* --- 116-117: Quần short nữ --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(116, 'S', 'Xanh Nhạt', 22, 'QSNU-CH-S-XN'), (116, 'M', 'Xanh Nhạt', 30, 'QSNU-CH-M-XN'), (116, 'L', 'Xanh Nhạt', 24, 'QSNU-CH-L-XN'), (116, 'M', 'Đen', 18, 'QSNU-CH-M-DEN'),
(117, 'S', 'Trắng', 20, 'QSNU-LI-S-TRA'), (117, 'M', 'Trắng', 28, 'QSNU-LI-M-TRA'), (117, 'L', 'Trắng', 22, 'QSNU-LI-L-TRA'), (117, 'M', 'Be', 18, 'QSNU-LI-M-BE');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(116, 'https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=600&q=80&fit=crop', 1), (116, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80&fit=crop', 0),
(117, 'https://images.unsplash.com/photo-1583496661160-fb5886a13d28?w=600&q=80&fit=crop', 1), (117, 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=600&q=80&fit=crop', 0);

/* --- 118-119: Quần baggy nữ --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(118, 'S', 'Be', 22, 'QBNU-CG-S-BE'), (118, 'M', 'Be', 30, 'QBNU-CG-M-BE'), (118, 'L', 'Be', 24, 'QBNU-CG-L-BE'), (118, 'M', 'Xanh Olive', 18, 'QBNU-CG-M-OLV'),
(119, 'S', 'Xanh Nhạt', 20, 'QBNU-OS-S-XN'), (119, 'M', 'Xanh Nhạt', 28, 'QBNU-OS-M-XN'), (119, 'L', 'Xanh Nhạt', 22, 'QBNU-OS-L-XN'), (119, 'M', 'Xanh Đậm', 16, 'QBNU-OS-M-XD');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(118, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80&fit=crop', 1), (118, 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&q=80&fit=crop', 0),
(119, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80&fit=crop', 1), (119, 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&q=80&fit=crop', 0);

/* --- 120-122: Váy ngắn --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(120, 'S', 'Trắng', 22, 'VYN-TP-S-TRA'), (120, 'M', 'Trắng', 32, 'VYN-TP-M-TRA'), (120, 'L', 'Trắng', 26, 'VYN-TP-L-TRA'), (120, 'S', 'Xanh Navy', 16, 'VYN-TP-S-NAV'),
(121, 'S', 'Xanh Nhạt', 18, 'VYN-DN-S-XN'), (121, 'M', 'Xanh Nhạt', 24, 'VYN-DN-M-XN'), (121, 'L', 'Xanh Nhạt', 20, 'VYN-DN-L-XN'), (121, 'M', 'Trắng', 14, 'VYN-DN-M-TRA'),
(122, 'S', 'Be Hoa', 16, 'VYN-HN-S-BH'), (122, 'M', 'Be Hoa', 22, 'VYN-HN-M-BH'), (122, 'L', 'Be Hoa', 18, 'VYN-HN-L-BH'), (122, 'M', 'Hồng Hoa', 12, 'VYN-HN-M-HH');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(120, 'https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=600&q=80&fit=crop', 1), (120, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80&fit=crop', 0),
(121, 'https://images.unsplash.com/photo-1583496661160-fb5886a13d28?w=600&q=80&fit=crop', 1), (121, 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=600&q=80&fit=crop', 0),
(122, 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=600&q=80&fit=crop', 1), (122, 'https://images.unsplash.com/photo-1564257577-2d3ee0f6f8b6?w=600&q=80&fit=crop', 0);

/* --- 123-124: Váy dài --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(123, 'S', 'Be', 16, 'VYD-MI-S-BE'), (123, 'M', 'Be', 22, 'VYD-MI-M-BE'), (123, 'L', 'Be', 18, 'VYD-MI-L-BE'), (123, 'M', 'Trắng Ngà', 14, 'VYD-MI-M-NA'),
(124, 'S', 'Nâu Đất', 14, 'VYD-VT-S-ND'), (124, 'M', 'Nâu Đất', 20, 'VYD-VT-M-ND'), (124, 'L', 'Nâu Đất', 16, 'VYD-VT-L-ND');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(123, 'https://images.unsplash.com/photo-1577900232427-18219b9166a0?w=600&q=80&fit=crop', 1), (123, 'https://images.unsplash.com/photo-1612722432474-b971cdcea546?w=600&q=80&fit=crop', 0),
(124, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80&fit=crop', 1), (124, 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80&fit=crop', 0);

/* --- 125-127: Chân váy --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(125, 'S', 'Đen', 20, 'CVNU-BC-S-DEN'), (125, 'M', 'Đen', 28, 'CVNU-BC-M-DEN'), (125, 'L', 'Đen', 24, 'CVNU-BC-L-DEN'), (125, 'M', 'Xám', 16, 'CVNU-BC-M-GRA'),
(126, 'S', 'Trắng', 18, 'CVNU-TN-S-TRA'), (126, 'M', 'Trắng', 26, 'CVNU-TN-M-TRA'), (126, 'L', 'Trắng', 22, 'CVNU-TN-L-TRA'),
(127, 'S', 'Xanh Nhạt', 14, 'CVNU-DN-S-XN'), (127, 'M', 'Xanh Nhạt', 22, 'CVNU-DN-M-XN'), (127, 'L', 'Xanh Nhạt', 18, 'CVNU-DN-L-XN');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(125, 'https://images.unsplash.com/photo-1583846783214-7229a91b20ed?w=600&q=80&fit=crop', 1), (125, 'https://images.unsplash.com/photo-1572804013309-a59a8d4f7af4?w=600&q=80&fit=crop', 0),
(126, 'https://images.unsplash.com/photo-1583496661160-fb5886a13d28?w=600&q=80&fit=crop', 1), (126, 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=600&q=80&fit=crop', 0),
(127, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80&fit=crop', 1), (127, 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&q=80&fit=crop', 0);

/* --- 128-129: Đầm dài --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(128, 'S', 'Đen Hoa', 16, 'DDNU-MX-S-DH'), (128, 'M', 'Đen Hoa', 22, 'DDNU-MX-M-DH'), (128, 'L', 'Đen Hoa', 18, 'DDNU-MX-L-DH'), (128, 'M', 'Xanh Hoa', 14, 'DDNU-MX-M-XH'),
(129, 'S', 'Đỏ', 12, 'DDNU-LS-S-DO'), (129, 'M', 'Đỏ', 18, 'DDNU-LS-M-DO'), (129, 'L', 'Đỏ', 14, 'DDNU-LS-L-DO');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(128, 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=80&fit=crop', 1), (128, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80&fit=crop', 0),
(129, 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&q=80&fit=crop', 1), (129, 'https://images.unsplash.com/photo-1612722432474-b971cdcea546?w=600&q=80&fit=crop', 0);

/* --- 130-132: Đầm công sở --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(130, 'S', 'Đen', 22, 'DCNU-BS-S-DEN'), (130, 'M', 'Đen', 30, 'DCNU-BS-M-DEN'), (130, 'L', 'Đen', 26, 'DCNU-BS-L-DEN'), (130, 'M', 'Xanh Navy', 18, 'DCNU-BS-M-NAV'),
(131, 'S', 'Be Sọc', 18, 'DCNU-KS-S-BS'), (131, 'M', 'Be Sọc', 24, 'DCNU-KS-M-BS'), (131, 'L', 'Be Sọc', 20, 'DCNU-KS-L-BS'),
(132, 'S', 'Xanh Navy', 14, 'DCNU-TD-S-NAV'), (132, 'M', 'Xanh Navy', 22, 'DCNU-TD-M-NAV'), (132, 'L', 'Xanh Navy', 18, 'DCNU-TD-L-NAV'), (132, 'M', 'Đen', 14, 'DCNU-TD-M-DEN');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(130, 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=600&q=80&fit=crop', 1), (130, 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80&fit=crop', 0),
(131, 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=600&q=80&fit=crop', 1), (131, 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&q=80&fit=crop', 0),
(132, 'https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?w=600&q=80&fit=crop', 1), (132, 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80&fit=crop', 0);

/* --- 133-134: Giày thể thao --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(133, '39', 'Trắng', 24, 'GTNU-SN-39-TRA'), (133, '40', 'Trắng', 32, 'GTNU-SN-40-TRA'), (133, '41', 'Trắng', 36, 'GTNU-SN-41-TRA'), (133, '42', 'Trắng', 28, 'GTNU-SN-42-TRA'), (133, '40', 'Đen', 22, 'GTNU-SN-40-DEN'), (133, '41', 'Đen', 26, 'GTNU-SN-41-DEN'),
(134, '40', 'Đen', 18, 'GTN-RU-40-DEN'), (134, '41', 'Đen', 24, 'GTN-RU-41-DEN'), (134, '42', 'Đen', 20, 'GTN-RU-42-DEN'), (134, '43', 'Đen', 16, 'GTN-RU-43-DEN'), (134, '41', 'Xám', 14, 'GTN-RU-41-GRA');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(133, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&fit=crop', 1), (133, 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&q=80&fit=crop', 0), (133, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80&fit=crop', 0),
(134, 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80&fit=crop', 1), (134, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80&fit=crop', 0);

/* --- 135-136: Giày da --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(135, '40', 'Đen', 14, 'GDN-TN-40-DEN'), (135, '41', 'Đen', 20, 'GDN-TN-41-DEN'), (135, '42', 'Đen', 16, 'GDN-TN-42-DEN'), (135, '41', 'Nâu', 12, 'GDN-TN-41-NAU'),
(136, '37', 'Be', 14, 'GDNU-LF-37-BE'), (136, '38', 'Be', 18, 'GDNU-LF-38-BE'), (136, '39', 'Be', 16, 'GDNU-LF-39-BE'), (136, '38', 'Nâu', 12, 'GDNU-LF-38-NAU');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(135, 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600&q=80&fit=crop', 1), (135, 'https://images.unsplash.com/photo-1531310197839-ccf54634509e?w=600&q=80&fit=crop', 0),
(136, 'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=600&q=80&fit=crop', 1), (136, 'https://images.unsplash.com/photo-1564609060031-6e5c3c8a5b8e?w=600&q=80&fit=crop', 0);

/* --- 137: Sandal --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(137, '37', 'Nâu', 18, 'SDN-DB-37-NAU'), (137, '38', 'Nâu', 24, 'SDN-DB-38-NAU'), (137, '39', 'Nâu', 22, 'SDN-DB-39-NAU'), (137, '38', 'Be', 16, 'SDN-DB-38-BE');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(137, 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&q=80&fit=crop', 1), (137, 'https://images.unsplash.com/photo-1531310197839-ccf54634509e?w=600&q=80&fit=crop', 0);

/* --- 138-139: Giày cao gót --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(138, '37', 'Đen', 18, 'GGNU-MN-37-DEN'), (138, '38', 'Đen', 24, 'GGNU-MN-38-DEN'), (138, '39', 'Đen', 20, 'GGNU-MN-39-DEN'), (138, '38', 'Be', 14, 'GGNU-MN-38-BE'), (138, '38', 'Nude', 14, 'GGNU-MN-38-NUD'),
(139, '37', 'Hồng Pastel', 14, 'GGNU-QM-37-HP'), (139, '38', 'Hồng Pastel', 20, 'GGNU-QM-38-HP'), (139, '39', 'Hồng Pastel', 16, 'GGNU-QM-39-HP'), (139, '38', 'Trắng', 12, 'GGNU-QM-38-TRA');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(138, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80&fit=crop', 1), (138, 'https://images.unsplash.com/photo-1581101767113-d1f1f8d2f8c7?w=600&q=80&fit=crop', 0),
(139, 'https://images.unsplash.com/photo-1535043934128-cf0b28ec52f3?w=600&q=80&fit=crop', 1), (139, 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600&q=80&fit=crop', 0);

/* --- 140-141: Balo --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(140, '15"', 'Đen', 24, 'BLN-LT-15-DEN'), (140, '15"', 'Xám', 22, 'BLN-LT-15-GRA'),
(141, 'Mini', 'Đen', 18, 'BLNU-MN-MNI-DEN'), (141, 'Mini', 'Be', 16, 'BLNU-MN-MNI-BE');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(140, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80&fit=crop', 1), (140, 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600&q=80&fit=crop', 0),
(141, 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&q=80&fit=crop', 1), (141, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80&fit=crop', 0);

/* --- 142: Túi đeo chéo --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(142, 'One Size', 'Xanh Rêu', 16, 'TDN-CV-OS-RX'), (142, 'One Size', 'Nâu', 18, 'TDN-CV-OS-NAU');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(142, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80&fit=crop', 1), (142, 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=600&q=80&fit=crop', 0);

/* --- 143: Ví nam --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(143, 'Ngang', 'Đen', 18, 'VN-DB-NG-DEN'), (143, 'Ngang', 'Nâu', 16, 'VN-DB-NG-NAU');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(143, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80&fit=crop', 1), (143, 'https://images.unsplash.com/photo-1606503825008-909a67e63c3d?w=600&q=80&fit=crop', 0);

/* --- 144: Đồng hồ --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(144, 'One Size', 'Dây Đen', 16, 'DHNU-MN-OS-DD'), (144, 'One Size', 'Dây Nâu', 18, 'DHNU-MN-OS-DN'), (144, 'One Size', 'Mặt Vàng', 12, 'DHNU-MN-OS-MV');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(144, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&fit=crop', 1), (144, 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&q=80&fit=crop', 0);

/* --- 145: Kính mát --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(145, 'One Size', 'Vàng', 16, 'KM-AV-OS-VA'), (145, 'One Size', 'Bạc', 14, 'KM-AV-OS-BAC');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(145, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80&fit=crop', 1), (145, 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&q=80&fit=crop', 0);

/* --- 146: Mũ lưỡi trai --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(146, 'Free', 'Đen', 24, 'MLT-BC-FR-DEN'), (146, 'Free', 'Be', 22, 'MLT-BC-FR-BE'), (146, 'Free', 'Xanh Rêu', 18, 'MLT-BC-FR-RX');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(146, 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&q=80&fit=crop', 1), (146, 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80&fit=crop', 0);

/* --- 147: Khăn len cashmere --- */
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(147, '180x30', 'Be', 18, 'KHLEN-CS-180-BE'), (147, '180x30', 'Xám', 16, 'KHLEN-CS-180-GRA'), (147, '180x30', 'Đỏ', 14, 'KHLEN-CS-180-DO');
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(147, 'https://images.unsplash.com/photo-1601924994987-69e26d4dc8c0?w=600&q=80&fit=crop', 1), (147, 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600&q=80&fit=crop', 0);

/* ============================================================
   5. PRODUCT VARIANTS (Biến thể - Size, Color, Stock)
   ============================================================ */

/* Hàm tạo Variant */
-- Áo Thun Nam Cổ Tròn Basic (ProductId = 1)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(1, 'S', 'Đen', 25, 'ATN-CT-B-S-DEN'),
(1, 'M', 'Đen', 40, 'ATN-CT-B-M-DEN'),
(1, 'L', 'Đen', 35, 'ATN-CT-B-L-DEN'),
(1, 'XL', 'Đen', 20, 'ATN-CT-B-XL-DEN'),
(1, 'S', 'Trắng', 30, 'ATN-CT-B-S-TRA'),
(1, 'M', 'Trắng', 45, 'ATN-CT-B-M-TRA'),
(1, 'L', 'Trắng', 40, 'ATN-CT-B-L-TRA'),
(1, 'XL', 'Trắng', 25, 'ATN-CT-B-XL-TRA'),
(1, 'S', 'Xám', 20, 'ATN-CT-B-S-XAM'),
(1, 'M', 'Xám', 30, 'ATN-CT-B-M-XAM'),
(1, 'L', 'Xám', 25, 'ATN-CT-B-L-XAM'),
(1, 'XL', 'Xám', 15, 'ATN-CT-B-XL-XAM');

-- Áo Thun Nam Cổ Vuông Oversize (ProductId = 2)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(2, 'S', 'Đen', 20, 'ATN-CV-OS-S-DEN'),
(2, 'M', 'Đen', 35, 'ATN-CV-OS-M-DEN'),
(2, 'L', 'Đen', 30, 'ATN-CV-OS-L-DEN'),
(2, 'XL', 'Đen', 25, 'ATN-CV-OS-XL-DEN'),
(2, 'XXL', 'Đen', 15, 'ATN-CV-OS-XXL-DEN'),
(2, 'M', 'Xanh Navy', 30, 'ATN-CV-OS-M-NVY'),
(2, 'L', 'Xanh Navy', 25, 'ATN-CV-OS-L-NVY'),
(2, 'XL', 'Xanh Navy', 20, 'ATN-CV-OS-XL-NVY'),
(2, 'M', 'Be', 25, 'ATN-CV-OS-M-BE'),
(2, 'L', 'Be', 20, 'ATN-CV-OS-L-BE');

-- Áo Thun Nam Tay Dài Graphic (ProductId = 3)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(3, 'S', 'Đen', 15, 'ATN-TD-GR-S-DEN'),
(3, 'M', 'Đen', 25, 'ATN-TD-GR-M-DEN'),
(3, 'L', 'Đen', 20, 'ATN-TD-GR-L-DEN'),
(3, 'XL', 'Đen', 10, 'ATN-TD-GR-XL-DEN'),
(3, 'S', 'Trắng', 10, 'ATN-TD-GR-S-TRA'),
(3, 'M', 'Trắng', 20, 'ATN-TD-GR-M-TRA'),
(3, 'L', 'Trắng', 15, 'ATN-TD-GR-L-TRA');

-- Áo Thun Nữ Cổ Tròn Minimalist (ProductId = 4)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(4, 'S', 'Trắng', 35, 'ATNU-CT-MI-S-TRA'),
(4, 'M', 'Trắng', 50, 'ATNU-CT-MI-M-TRA'),
(4, 'L', 'Trắng', 40, 'ATNU-CT-MI-L-TRA'),
(4, 'XL', 'Trắng', 25, 'ATNU-CT-MI-XL-TRA'),
(4, 'S', 'Đen', 30, 'ATNU-CT-MI-S-DEN'),
(4, 'M', 'Đen', 45, 'ATNU-CT-MI-M-DEN'),
(4, 'L', 'Đen', 35, 'ATNU-CT-MI-L-DEN'),
(4, 'XL', 'Đen', 20, 'ATNU-CT-MI-XL-DEN'),
(4, 'S', 'Hồng', 20, 'ATNU-CT-MI-S-HNG'),
(4, 'M', 'Hồng', 30, 'ATNU-CT-MI-M-HNG'),
(4, 'L', 'Hồng', 25, 'ATNU-CT-MI-L-HNG'),
(4, 'S', 'Xanh Mint', 15, 'ATNU-CT-MI-S-MNT'),
(4, 'M', 'Xanh Mint', 25, 'ATNU-CT-MI-M-MNT'),
(4, 'L', 'Xanh Mint', 20, 'ATNU-CT-MI-L-MNT');

-- Áo Thun Nữ Oversize (ProductId = 5)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(5, 'S', 'Đen', 25, 'ATNU-OS-S-DEN'),
(5, 'M', 'Đen', 40, 'ATNU-OS-M-DEN'),
(5, 'L', 'Đen', 35, 'ATNU-OS-L-DEN'),
(5, 'XL', 'Đen', 20, 'ATNU-OS-XL-DEN'),
(5, 'S', 'Trắng', 30, 'ATNU-OS-S-TRA'),
(5, 'M', 'Trắng', 45, 'ATNU-OS-M-TRA'),
(5, 'L', 'Trắng', 40, 'ATNU-OS-L-TRA'),
(5, 'XL', 'Trắng', 25, 'ATNU-OS-XL-TRA'),
(5, 'M', 'Be', 30, 'ATNU-OS-M-BE'),
(5, 'L', 'Be', 25, 'ATNU-OS-L-BE'),
(5, 'XL', 'Be', 15, 'ATNU-OS-XL-BE'),
(5, 'M', 'Xám', 20, 'ATNU-OS-M-XAM'),
(5, 'L', 'Xám', 15, 'ATNU-OS-L-XAM');

-- Áo Thun Nữ Crop Top (ProductId = 6)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(6, 'S', 'Đen', 40, 'ATNU-CT-S-DEN'),
(6, 'M', 'Đen', 60, 'ATNU-CT-M-DEN'),
(6, 'L', 'Đen', 50, 'ATNU-CT-L-DEN'),
(6, 'S', 'Trắng', 35, 'ATNU-CT-S-TRA'),
(6, 'M', 'Trắng', 55, 'ATNU-CT-M-TRA'),
(6, 'L', 'Trắng', 45, 'ATNU-CT-L-TRA'),
(6, 'S', 'Hồng', 25, 'ATNU-CT-S-HNG'),
(6, 'M', 'Hồng', 40, 'ATNU-CT-M-HNG'),
(6, 'L', 'Hồng', 30, 'ATNU-CT-L-HNG'),
(6, 'M', 'Xanh', 30, 'ATNU-CT-M-XAN'),
(6, 'L', 'Xanh', 25, 'ATNU-CT-L-XAN');

-- Áo Sơ Mi Nam Dài Tay Oxford (ProductId = 7)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(7, 'S', 'Trắng', 20, 'ASM-DT-S-TRANG'),
(7, 'M', 'Trắng', 30, 'ASM-DT-M-TRANG'),
(7, 'L', 'Trắng', 25, 'ASM-DT-L-TRANG'),
(7, 'XL', 'Trắng', 15, 'ASM-DT-XL-TRANG'),
(7, 'S', 'Xanh Nhạt', 15, 'ASM-DT-S-XANHNH'),
(7, 'M', 'Xanh Nhạt', 25, 'ASM-DT-M-XANHNH'),
(7, 'L', 'Xanh Nhạt', 20, 'ASM-DT-L-XANHNH'),
(7, 'XL', 'Xanh Nhạt', 10, 'ASM-DT-XL-XANHNH'),
(7, 'M', 'Hồng', 20, 'ASM-DT-M-HONG'),
(7, 'L', 'Hồng', 15, 'ASM-DT-L-HONG');

-- Áo Sơ Mi Nam Ngắn Tay Havana (ProductId = 8)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(8, 'S', 'Trắng', 25, 'ASM-NT-S-TRANG'),
(8, 'M', 'Trắng', 35, 'ASM-NT-M-TRANG'),
(8, 'L', 'Trắng', 30, 'ASM-NT-L-TRANG'),
(8, 'XL', 'Trắng', 20, 'ASM-NT-XL-TRANG'),
(8, 'S', 'Xanh', 20, 'ASM-NT-S-XANH'),
(8, 'M', 'Xanh', 30, 'ASM-NT-M-XANH'),
(8, 'L', 'Xanh', 25, 'ASM-NT-L-XANH'),
(8, 'M', 'Đỏ', 20, 'ASM-NT-M-DO'),
(8, 'L', 'Đỏ', 15, 'ASM-NT-L-DO');

-- Áo Sơ Mi Nam Slim Fit Karen (ProductId = 9)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(9, 'S', 'Trắng', 15, 'ASM-SF-S-TRANG'),
(9, 'M', 'Trắng', 25, 'ASM-SF-M-TRANG'),
(9, 'L', 'Trắng', 20, 'ASM-SF-L-TRANG'),
(9, 'XL', 'Trắng', 12, 'ASM-SF-XL-TRANG'),
(9, 'S', 'Đen', 10, 'ASM-SF-S-DEN'),
(9, 'M', 'Đen', 20, 'ASM-SF-M-DEN'),
(9, 'L', 'Đen', 15, 'ASM-SF-L-DEN'),
(9, 'M', 'Xanh Navy', 18, 'ASM-SF-M-NVY'),
(9, 'L', 'Xanh Navy', 12, 'ASM-SF-L-NVY');

-- Áo Sơ Mi Nữ Dài Tay Lụa (ProductId = 10)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(10, 'S', 'Trắng', 18, 'ASN-DT-S-TRANG'),
(10, 'M', 'Trắng', 25, 'ASN-DT-M-TRANG'),
(10, 'L', 'Trắng', 20, 'ASN-DT-L-TRANG'),
(10, 'XL', 'Trắng', 12, 'ASN-DT-XL-TRANG'),
(10, 'S', 'Kem', 15, 'ASN-DT-S-KEM'),
(10, 'M', 'Kem', 22, 'ASN-DT-M-KEM'),
(10, 'L', 'Kem', 18, 'ASN-DT-L-KEM'),
(10, 'M', 'Đen', 20, 'ASN-DT-M-DEN'),
(10, 'L', 'Đen', 15, 'ASN-DT-L-DEN');

-- Áo Sơ Mi Nữ Ngắn Tay Caro (ProductId = 11)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(11, 'S', 'Caro Đỏ', 22, 'ASN-NT-S-CAROD'),
(11, 'M', 'Caro Đỏ', 35, 'ASN-NT-M-CAROD'),
(11, 'L', 'Caro Đỏ', 28, 'ASN-NT-L-CAROD'),
(11, 'S', 'Caro Xanh', 18, 'ASN-NT-S-CAROX'),
(11, 'M', 'Caro Xanh', 30, 'ASN-NT-M-CAROX'),
(11, 'L', 'Caro Xanh', 24, 'ASN-NT-L-CAROX'),
(11, 'S', 'Caro Đen', 20, 'ASN-NT-S-CARODEN'),
(11, 'M', 'Caro Đen', 32, 'ASN-NT-M-CARODEN'),
(11, 'L', 'Caro Đen', 25, 'ASN-NT-L-CARODEN');

-- Áo Khoác Nam Jeans Wash Xanh (ProductId = 12)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(12, 'S', 'Xanh Đậm', 15, 'AKN-JEANS-S-XD'),
(12, 'M', 'Xanh Đậm', 25, 'AKN-JEANS-M-XD'),
(12, 'L', 'Xanh Đậm', 20, 'AKN-JEANS-L-XD'),
(12, 'XL', 'Xanh Đậm', 12, 'AKN-JEANS-XL-XD'),
(12, 'S', 'Xanh Nhạt', 12, 'AKN-JEANS-S-XN'),
(12, 'M', 'Xanh Nhạt', 20, 'AKN-JEANS-M-XN'),
(12, 'L', 'Xanh Nhạt', 18, 'AKN-JEANS-L-XN'),
(12, 'XL', 'Xanh Nhạt', 10, 'AKN-JEANS-XL-XN');

-- Quần Jeans Nam Slim Fit (ProductId = 13)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(13, '28', 'Xanh Đậm', 20, 'QJN-SF-28-XD'),
(13, '29', 'Xanh Đậm', 28, 'QJN-SF-29-XD'),
(13, '30', 'Xanh Đậm', 35, 'QJN-SF-30-XD'),
(13, '31', 'Xanh Đậm', 32, 'QJN-SF-31-XD'),
(13, '32', 'Xanh Đậm', 30, 'QJN-SF-32-XD'),
(13, '33', 'Xanh Đậm', 22, 'QJN-SF-33-XD'),
(13, '34', 'Xanh Đậm', 15, 'QJN-SF-34-XD'),
(13, '28', 'Xanh Nhạt', 18, 'QJN-SF-28-XN'),
(13, '29', 'Xanh Nhạt', 25, 'QJN-SF-29-XN'),
(13, '30', 'Xanh Nhạt', 30, 'QJN-SF-30-XN'),
(13, '31', 'Xanh Nhạt', 28, 'QJN-SF-31-XN'),
(13, '32', 'Xanh Nhạt', 25, 'QJN-SF-32-XN'),
(13, '33', 'Xanh Nhạt', 18, 'QJN-SF-33-XN');

-- Quần Jeans Nữ Skinny (ProductId = 14)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(14, '25', 'Xanh Đậm', 25, 'QJNU-SK-25-XD'),
(14, '26', 'Xanh Đậm', 35, 'QJNU-SK-26-XD'),
(14, '27', 'Xanh Đậm', 40, 'QJNU-SK-27-XD'),
(14, '28', 'Xanh Đậm', 38, 'QJNU-SK-28-XD'),
(14, '29', 'Xanh Đậm', 30, 'QJNU-SK-29-XD'),
(14, '30', 'Xanh Đậm', 22, 'QJNU-SK-30-XD'),
(14, '25', 'Đen', 22, 'QJNU-SK-25-DEN'),
(14, '26', 'Đen', 30, 'QJNU-SK-26-DEN'),
(14, '27', 'Đen', 35, 'QJNU-SK-27-DEN'),
(14, '28', 'Đen', 32, 'QJNU-SK-28-DEN'),
(14, '29', 'Đen', 25, 'QJNU-SK-29-DEN'),
(14, '30', 'Đen', 18, 'QJNU-SK-30-DEN'),
(14, '26', 'Xám', 20, 'QJNU-SK-26-XAM'),
(14, '27', 'Xám', 28, 'QJNU-SK-27-XAM'),
(14, '28', 'Xám', 25, 'QJNU-SK-28-XAM');

-- Quần Baggy Nữ Nỉ Caro (ProductId = 15)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(15, 'S', 'Caro Đen', 30, 'QBNU-BG-S-CAROD'),
(15, 'M', 'Caro Đen', 45, 'QBNU-BG-M-CAROD'),
(15, 'L', 'Caro Đen', 40, 'QBNU-BG-L-CAROD'),
(15, 'XL', 'Caro Đen', 25, 'QBNU-BG-XL-CAROD'),
(15, 'S', 'Caro Xanh', 25, 'QBNU-BG-S-CAROX'),
(15, 'M', 'Caro Xanh', 40, 'QBNU-BG-M-CAROX'),
(15, 'L', 'Caro Xanh', 35, 'QBNU-BG-L-CAROX'),
(15, 'XL', 'Caro Xanh', 20, 'QBNU-BG-XL-CAROX'),
(15, 'S', 'Caro Hồng', 20, 'QBNU-BG-S-CAROH'),
(15, 'M', 'Caro Hồng', 32, 'QBNU-BG-M-CAROH'),
(15, 'L', 'Caro Hồng', 28, 'QBNU-BG-L-CAROH');

-- Đầm Ngắn Nữ Bodycon (ProductId = 16)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(16, 'S', 'Đen', 28, 'DNU-BC-S-DEN'),
(16, 'M', 'Đen', 40, 'DNU-BC-M-DEN'),
(16, 'L', 'Đen', 32, 'DNU-BC-L-DEN'),
(16, 'XL', 'Đen', 18, 'DNU-BC-XL-DEN'),
(16, 'S', 'Đỏ', 22, 'DNU-BC-S-DO'),
(16, 'M', 'Đỏ', 35, 'DNU-BC-M-DO'),
(16, 'L', 'Đỏ', 28, 'DNU-BC-L-DO'),
(16, 'XL', 'Đỏ', 15, 'DNU-BC-XL-DO'),
(16, 'S', 'Xanh Navy', 18, 'DNU-BC-S-NVY'),
(16, 'M', 'Xanh Navy', 30, 'DNU-BC-M-NVY'),
(16, 'L', 'Xanh Navy', 24, 'DNU-BC-L-NVY'),
(16, 'S', 'Hồng', 15, 'DNU-BC-S-HNG'),
(16, 'M', 'Hồng', 25, 'DNU-BC-M-HNG'),
(13, 'L', 'Hồng', 20, 'DNU-BC-L-HNG');

-- Giày Thể Thao Nam Classic White (ProductId = 17)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(17, '39', 'Trắng', 15, 'GTN-CW-39-TRA'),
(17, '40', 'Trắng', 25, 'GTN-CW-40-TRA'),
(17, '41', 'Trắng', 30, 'GTN-CW-41-TRA'),
(17, '42', 'Trắng', 35, 'GTN-CW-42-TRA'),
(17, '43', 'Trắng', 28, 'GTN-CW-43-TRA'),
(17, '44', 'Trắng', 20, 'GTN-CW-44-TRA'),
(17, '40', 'Đen', 20, 'GTN-CW-40-DEN'),
(17, '41', 'Đen', 28, 'GTN-CW-41-DEN'),
(17, '42', 'Đen', 32, 'GTN-CW-42-DEN'),
(17, '43', 'Đen', 25, 'GTN-CW-43-DEN'),
(17, '44', 'Đen', 18, 'GTN-CW-44-DEN');

-- Giày Thể Thao Nữ Sneaker Platform (ProductId = 18)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(18, '35', 'Trắng', 18, 'GTNU-PL-35-TRA'),
(18, '36', 'Trắng', 30, 'GTNU-PL-36-TRA'),
(18, '37', 'Trắng', 40, 'GTNU-PL-37-TRA'),
(18, '38', 'Trắng', 38, 'GTNU-PL-38-TRA'),
(18, '39', 'Trắng', 28, 'GTNU-PL-39-TRA'),
(18, '35', 'Đen', 15, 'GTNU-PL-35-DEN'),
(18, '36', 'Đen', 25, 'GTNU-PL-36-DEN'),
(18, '37', 'Đen', 35, 'GTNU-PL-37-DEN'),
(18, '38', 'Đen', 32, 'GTNU-PL-38-DEN'),
(18, '39', 'Đen', 22, 'GTNU-PL-39-DEN'),
(18, '36', 'Hồng', 20, 'GTNU-PL-36-HNG'),
(18, '37', 'Hồng', 30, 'GTNU-PL-37-HNG'),
(18, '38', 'Hồng', 28, 'GTNU-PL-38-HNG');

-- Áo Hoodie Nam Essentials (ProductId = 19)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(19, 'S', 'Đen', 25, 'AHN-ES-S-DEN'),
(19, 'M', 'Đen', 40, 'AHN-ES-M-DEN'),
(19, 'L', 'Đen', 35, 'AHN-ES-L-DEN'),
(19, 'XL', 'Đen', 22, 'AHN-ES-XL-DEN'),
(19, 'XXL', 'Đen', 12, 'AHN-ES-XXL-DEN'),
(19, 'S', 'Xám', 20, 'AHN-ES-S-XAM'),
(19, 'M', 'Xám', 35, 'AHN-ES-M-XAM'),
(19, 'L', 'Xám', 30, 'AHN-ES-L-XAM'),
(19, 'XL', 'Xám', 18, 'AHN-ES-XL-XAM'),
(19, 'S', 'Navy', 18, 'AHN-ES-S-NVY'),
(19, 'M', 'Navy', 30, 'AHN-ES-M-NVY'),
(19, 'L', 'Navy', 25, 'AHN-ES-L-NVY'),
(19, 'XL', 'Navy', 15, 'AHN-ES-XL-NVY'),
(19, 'S', 'Trắng', 15, 'AHN-ES-S-TRA'),
(19, 'M', 'Trắng', 28, 'AHN-ES-M-TRA'),
(19, 'L', 'Trắng', 22, 'AHN-ES-L-TRA');

-- Áo Hoodie Nữ Cropped (ProductId = 20)
INSERT INTO ProductVariants (ProductId, Size, Color, StockQuantity, Sku) VALUES
(20, 'S', 'Đen', 30, 'AHNU-CR-S-DEN'),
(20, 'M', 'Đen', 45, 'AHNU-CR-M-DEN'),
(20, 'L', 'Đen', 38, 'AHNU-CR-L-DEN'),
(20, 'XL', 'Đen', 22, 'AHNU-CR-XL-DEN'),
(20, 'S', 'Trắng', 25, 'AHNU-CR-S-TRA'),
(20, 'M', 'Trắng', 40, 'AHNU-CR-M-TRA'),
(20, 'L', 'Trắng', 32, 'AHNU-CR-L-TRA'),
(20, 'XL', 'Trắng', 18, 'AHNU-CR-XL-TRA'),
(20, 'S', 'Hồng', 20, 'AHNU-CR-S-HNG'),
(20, 'M', 'Hồng', 35, 'AHNU-CR-M-HNG'),
(20, 'L', 'Hồng', 28, 'AHNU-CR-L-HNG'),
(20, 'S', 'Xanh Mint', 18, 'AHNU-CR-S-MNT'),
(20, 'M', 'Xanh Mint', 30, 'AHNU-CR-M-MNT'),
(20, 'L', 'Xanh Mint', 25, 'AHNU-CR-L-MNT'),
(20, 'S', 'Be', 15, 'AHNU-CR-S-BE'),
(20, 'M', 'Be', 28, 'AHNU-CR-M-BE'),
(20, 'L', 'Be', 22, 'AHNU-CR-L-BE');

/* ============================================================
   6. PRODUCT IMAGES (Hình ảnh sản phẩm)
   ============================================================ */

/* Áo Thun Nam */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(1, 'https://picsum.photos/seed/ao-thun-nam-1/400/600', 1),
(1, 'https://picsum.photos/seed/ao-thun-nam-1b/400/600', 0),
(2, 'https://picsum.photos/seed/ao-thun-nam-2/400/600', 1),
(2, 'https://picsum.photos/seed/ao-thun-nam-2b/400/600', 0),
(3, 'https://picsum.photos/seed/ao-thun-nam-3/400/600', 1),
(3, 'https://picsum.photos/seed/ao-thun-nam-3b/400/600', 0),
(3, 'https://picsum.photos/seed/ao-thun-nam-3c/400/600', 0);

/* Áo Thun Nữ */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(4, 'https://picsum.photos/seed/ao-thun-nu-1/400/600', 1),
(4, 'https://picsum.photos/seed/ao-thun-nu-1b/400/600', 0),
(5, 'https://picsum.photos/seed/ao-thun-nu-2/400/600', 1),
(5, 'https://picsum.photos/seed/ao-thun-nu-2b/400/600', 0),
(6, 'https://picsum.photos/seed/ao-thun-nu-3/400/600', 1),
(6, 'https://picsum.photos/seed/ao-thun-nu-3b/400/600', 0),
(6, 'https://picsum.photos/seed/ao-thun-nu-3c/400/600', 0);

/* Áo Sơ Mi Nam */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(7, 'https://picsum.photos/seed/ao-so-mi-nam-1/400/600', 1),
(7, 'https://picsum.photos/seed/ao-so-mi-nam-1b/400/600', 0),
(8, 'https://picsum.photos/seed/ao-so-mi-nam-2/400/600', 1),
(8, 'https://picsum.photos/seed/ao-so-mi-nam-2b/400/600', 0),
(9, 'https://picsum.photos/seed/ao-so-mi-nam-3/400/600', 1),
(9, 'https://picsum.photos/seed/ao-so-mi-nam-3b/400/600', 0);

/* Áo Sơ Mi Nữ */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(10, 'https://picsum.photos/seed/ao-so-mi-nu-1/400/600', 1),
(10, 'https://picsum.photos/seed/ao-so-mi-nu-1b/400/600', 0),
(11, 'https://picsum.photos/seed/ao-so-mi-nu-2/400/600', 1),
(11, 'https://picsum.photos/seed/ao-so-mi-nu-2b/400/600', 0),
(12, 'https://picsum.photos/seed/ao-so-mi-nu-3/400/600', 1),
(12, 'https://picsum.photos/seed/ao-so-mi-nu-3b/400/600', 0);

/* Áo Khoác */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(13, 'https://picsum.photos/seed/ao-khoac-nam-1/400/600', 1),
(13, 'https://picsum.photos/seed/ao-khoac-nam-1b/400/600', 0),
(14, 'https://picsum.photos/seed/ao-khoac-nam-2/400/600', 1),
(14, 'https://picsum.photos/seed/ao-khoac-nam-2b/400/600', 0),
(15, 'https://picsum.photos/seed/ao-khoac-nam-3/400/600', 1),
(15, 'https://picsum.photos/seed/ao-khoac-nam-3b/400/600', 0),
(16, 'https://picsum.photos/seed/ao-khoac-nu-1/400/600', 1),
(16, 'https://picsum.photos/seed/ao-khoac-nu-1b/400/600', 0),
(17, 'https://picsum.photos/seed/ao-khoac-nu-2/400/600', 1),
(17, 'https://picsum.photos/seed/ao-khoac-nu-2b/400/600', 0),
(18, 'https://picsum.photos/seed/ao-khoac-nu-3/400/600', 1),
(18, 'https://picsum.photos/seed/ao-khoac-nu-3b/400/600', 0);

/* Áo Phao */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(19, 'https://picsum.photos/seed/ao-phao-nam-1/400/600', 1),
(19, 'https://picsum.photos/seed/ao-phao-nam-1b/400/600', 0),
(20, 'https://picsum.photos/seed/ao-phao-nu-1/400/600', 1),
(20, 'https://picsum.photos/seed/ao-phao-nu-1b/400/600', 0),
(21, 'https://picsum.photos/seed/ao-phao-unisex-1/400/600', 1),
(21, 'https://picsum.photos/seed/ao-phao-unisex-1b/400/600', 0),
(21, 'https://picsum.photos/seed/ao-phao-unisex-1c/400/600', 0);

/* Quần Jeans Nam */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(22, 'https://picsum.photos/seed/quan-jeans-nam-1/400/600', 1),
(22, 'https://picsum.photos/seed/quan-jeans-nam-1b/400/600', 0),
(23, 'https://picsum.photos/seed/quan-jeans-nam-2/400/600', 1),
(23, 'https://picsum.photos/seed/quan-jeans-nam-2b/400/600', 0),
(24, 'https://picsum.photos/seed/quan-jeans-nam-3/400/600', 1),
(24, 'https://picsum.photos/seed/quan-jeans-nam-3b/400/600', 0);

/* Quần Jeans Nữ */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(25, 'https://picsum.photos/seed/quan-jeans-nu-1/400/600', 1),
(25, 'https://picsum.photos/seed/quan-jeans-nu-1b/400/600', 0),
(26, 'https://picsum.photos/seed/quan-jeans-nu-2/400/600', 1),
(26, 'https://picsum.photos/seed/quan-jeans-nu-2b/400/600', 0),
(27, 'https://picsum.photos/seed/quan-jeans-nu-3/400/600', 1),
(27, 'https://picsum.photos/seed/quan-jeans-nu-3b/400/600', 0);

/* Quần Short */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(28, 'https://picsum.photos/seed/quan-short-nam-1/400/600', 1),
(28, 'https://picsum.photos/seed/quan-short-nam-1b/400/600', 0),
(29, 'https://picsum.photos/seed/quan-short-nam-2/400/600', 1),
(29, 'https://picsum.photos/seed/quan-short-nam-2b/400/600', 0),
(30, 'https://picsum.photos/seed/quan-short-nam-3/400/600', 1),
(30, 'https://picsum.photos/seed/quan-short-nam-3b/400/600', 0),
(31, 'https://picsum.photos/seed/quan-short-nu-1/400/600', 1),
(31, 'https://picsum.photos/seed/quan-short-nu-1b/400/600', 0),
(32, 'https://picsum.photos/seed/quan-short-nu-2/400/600', 1),
(32, 'https://picsum.photos/seed/quan-short-nu-2b/400/600', 0),
(33, 'https://picsum.photos/seed/quan-short-nu-3/400/600', 1),
(33, 'https://picsum.photos/seed/quan-short-nu-3b/400/600', 0);

/* Quần Baggy */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(34, 'https://picsum.photos/seed/quan-baggy-1/400/600', 1),
(34, 'https://picsum.photos/seed/quan-baggy-1b/400/600', 0),
(35, 'https://picsum.photos/seed/quan-baggy-2/400/600', 1),
(35, 'https://picsum.photos/seed/quan-baggy-2b/400/600', 0),
(36, 'https://picsum.photos/seed/quan-baggy-3/400/600', 1),
(36, 'https://picsum.photos/seed/quan-baggy-3b/400/600', 0);

/* Váy */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(37, 'https://picsum.photos/seed/vay-ngan-1/400/600', 1),
(37, 'https://picsum.photos/seed/vay-ngan-1b/400/600', 0),
(38, 'https://picsum.photos/seed/vay-ngan-2/400/600', 1),
(38, 'https://picsum.photos/seed/vay-ngan-2b/400/600', 0),
(39, 'https://picsum.photos/seed/vay-ngan-3/400/600', 1),
(39, 'https://picsum.photos/seed/vay-ngan-3b/400/600', 0),
(40, 'https://picsum.photos/seed/vay-dai-1/400/600', 1),
(40, 'https://picsum.photos/seed/vay-dai-1b/400/600', 0),
(41, 'https://picsum.photos/seed/vay-dai-2/400/600', 1),
(41, 'https://picsum.photos/seed/vay-dai-2b/400/600', 0),
(42, 'https://picsum.photos/seed/vay-dai-3/400/600', 1),
(42, 'https://picsum.photos/seed/vay-dai-3b/400/600', 0);

/* Đầm */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(43, 'https://picsum.photos/seed/dam-ngan-1/400/600', 1),
(43, 'https://picsum.photos/seed/dam-ngan-1b/400/600', 0),
(44, 'https://picsum.photos/seed/dam-ngan-2/400/600', 1),
(44, 'https://picsum.photos/seed/dam-ngan-2b/400/600', 0),
(45, 'https://picsum.photos/seed/dam-ngan-3/400/600', 1),
(45, 'https://picsum.photos/seed/dam-ngan-3b/400/600', 0),
(46, 'https://picsum.photos/seed/dam-dai-1/400/600', 1),
(46, 'https://picsum.photos/seed/dam-dai-1b/400/600', 0),
(47, 'https://picsum.photos/seed/dam-dai-2/400/600', 1),
(47, 'https://picsum.photos/seed/dam-dai-2b/400/600', 0),
(48, 'https://picsum.photos/seed/dam-dai-3/400/600', 1),
(48, 'https://picsum.photos/seed/dam-dai-3b/400/600', 0);

/* Đầm Công Sở */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(49, 'https://picsum.photos/seed/dam-cong-so-1/400/600', 1),
(49, 'https://picsum.photos/seed/dam-cong-so-1b/400/600', 0),
(50, 'https://picsum.photos/seed/dam-cong-so-2/400/600', 1),
(50, 'https://picsum.photos/seed/dam-cong-so-2b/400/600', 0),
(51, 'https://picsum.photos/seed/dam-cong-so-3/400/600', 1),
(51, 'https://picsum.photos/seed/dam-cong-so-3b/400/600', 0);

/* Giày Thể Thao */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(52, 'https://picsum.photos/seed/giay-nam-1/400/600', 1),
(52, 'https://picsum.photos/seed/giay-nam-1b/400/600', 0),
(53, 'https://picsum.photos/seed/giay-nam-2/400/600', 1),
(53, 'https://picsum.photos/seed/giay-nam-2b/400/600', 0),
(54, 'https://picsum.photos/seed/giay-nam-3/400/600', 1),
(54, 'https://picsum.photos/seed/giay-nam-3b/400/600', 0),
(55, 'https://picsum.photos/seed/giay-nu-1/400/600', 1),
(55, 'https://picsum.photos/seed/giay-nu-1b/400/600', 0),
(56, 'https://picsum.photos/seed/giay-nu-2/400/600', 1),
(56, 'https://picsum.photos/seed/giay-nu-2b/400/600', 0),
(57, 'https://picsum.photos/seed/giay-nu-3/400/600', 1),
(57, 'https://picsum.photos/seed/giay-nu-3b/400/600', 0);

/* Giày Da */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(58, 'https://picsum.photos/seed/giay-da-nam-1/400/600', 1),
(58, 'https://picsum.photos/seed/giay-da-nam-1b/400/600', 0),
(59, 'https://picsum.photos/seed/giay-da-nam-2/400/600', 1),
(59, 'https://picsum.photos/seed/giay-da-nam-2b/400/600', 0),
(60, 'https://picsum.photos/seed/giay-da-nu-1/400/600', 1),
(60, 'https://picsum.photos/seed/giay-da-nu-1b/400/600', 0),
(61, 'https://picsum.photos/seed/giay-da-nu-2/400/600', 1),
(61, 'https://picsum.photos/seed/giay-da-nu-2b/400/600', 0);

/* Sandal */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(62, 'https://picsum.photos/seed/sandal-nu-1/400/600', 1),
(62, 'https://picsum.photos/seed/sandal-nu-1b/400/600', 0),
(63, 'https://picsum.photos/seed/sandal-nu-2/400/600', 1),
(63, 'https://picsum.photos/seed/sandal-nu-2b/400/600', 0),
(64, 'https://picsum.photos/seed/sandal-nam-1/400/600', 1),
(64, 'https://picsum.photos/seed/sandal-nam-1b/400/600', 0);

/* Giày Cao Gót */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(65, 'https://picsum.photos/seed/giay-cao-got-1/400/600', 1),
(65, 'https://picsum.photos/seed/giay-cao-got-1b/400/600', 0),
(66, 'https://picsum.photos/seed/giay-cao-got-2/400/600', 1),
(66, 'https://picsum.photos/seed/giay-cao-got-2b/400/600', 0),
(67, 'https://picsum.photos/seed/giay-cao-got-3/400/600', 1),
(67, 'https://picsum.photos/seed/giay-cao-got-3b/400/600', 0);

/* Balo */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(68, 'https://picsum.photos/seed/balo-nam-1/400/600', 1),
(68, 'https://picsum.photos/seed/balo-nam-1b/400/600', 0),
(69, 'https://picsum.photos/seed/balo-nu-1/400/600', 1),
(69, 'https://picsum.photos/seed/balo-nu-1b/400/600', 0),
(70, 'https://picsum.photos/seed/balo-du-lich-1/400/600', 1),
(70, 'https://picsum.photos/seed/balo-du-lich-1b/400/600', 0);

/* Túi Đeo Chéo */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(71, 'https://picsum.photos/seed/tui-nam-1/400/600', 1),
(71, 'https://picsum.photos/seed/tui-nam-1b/400/600', 0),
(72, 'https://picsum.photos/seed/tui-nu-1/400/600', 1),
(72, 'https://picsum.photos/seed/tui-nu-1b/400/600', 0),
(73, 'https://picsum.photos/seed/tui-unisex-1/400/600', 1),
(73, 'https://picsum.photos/seed/tui-unisex-1b/400/600', 0);

/* Túi Xách */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(74, 'https://picsum.photos/seed/tui-xach-1/400/600', 1),
(74, 'https://picsum.photos/seed/tui-xach-1b/400/600', 0),
(75, 'https://picsum.photos/seed/tui-xach-2/400/600', 1),
(75, 'https://picsum.photos/seed/tui-xach-2b/400/600', 0),
(76, 'https://picsum.photos/seed/tui-xach-3/400/600', 1),
(76, 'https://picsum.photos/seed/tui-xach-3b/400/600', 0);

/* Ví Nam */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(77, 'https://picsum.photos/seed/vi-nam-1/400/600', 1),
(77, 'https://picsum.photos/seed/vi-nam-1b/400/600', 0),
(78, 'https://picsum.photos/seed/vi-nam-2/400/600', 1),
(78, 'https://picsum.photos/seed/vi-nam-2b/400/600', 0),
(79, 'https://picsum.photos/seed/vi-nam-3/400/600', 1),
(79, 'https://picsum.photos/seed/vi-nam-3b/400/600', 0);

/* Đồng Hồ */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(80, 'https://picsum.photos/seed/dong-ho-nam-1/400/600', 1),
(80, 'https://picsum.photos/seed/dong-ho-nam-1b/400/600', 0),
(81, 'https://picsum.photos/seed/dong-ho-nam-2/400/600', 1),
(81, 'https://picsum.photos/seed/dong-ho-nam-2b/400/600', 0),
(82, 'https://picsum.photos/seed/dong-ho-nu-1/400/600', 1),
(82, 'https://picsum.photos/seed/dong-ho-nu-1b/400/600', 0),
(83, 'https://picsum.photos/seed/dong-ho-nu-2/400/600', 1),
(83, 'https://picsum.photos/seed/dong-ho-nu-2b/400/600', 0);

/* Kính Mát */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(84, 'https://picsum.photos/seed/kinh-nam-1/400/600', 1),
(84, 'https://picsum.photos/seed/kinh-nam-1b/400/600', 0),
(85, 'https://picsum.photos/seed/kinh-nam-2/400/600', 1),
(85, 'https://picsum.photos/seed/kinh-nam-2b/400/600', 0),
(86, 'https://picsum.photos/seed/kinh-nu-1/400/600', 1),
(86, 'https://picsum.photos/seed/kinh-nu-1b/400/600', 0),
(87, 'https://picsum.photos/seed/kinh-nu-2/400/600', 1),
(87, 'https://picsum.photos/seed/kinh-nu-2b/400/600', 0);

/* Mũ */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(88, 'https://picsum.photos/seed/mu-nam-1/400/600', 1),
(88, 'https://picsum.photos/seed/mu-nam-1b/400/600', 0),
(89, 'https://picsum.photos/seed/mu-nu-1/400/600', 1),
(89, 'https://picsum.photos/seed/mu-nu-1b/400/600', 0),
(90, 'https://picsum.photos/seed/mu-nam-2/400/600', 1),
(90, 'https://picsum.photos/seed/mu-nam-2b/400/600', 0),
(91, 'https://picsum.photos/seed/mu-nu-2/400/600', 1),
(91, 'https://picsum.photos/seed/mu-nu-2b/400/600', 0);

/* Khăn */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(92, 'https://picsum.photos/seed/khan-1/400/600', 1),
(92, 'https://picsum.photos/seed/khan-1b/400/600', 0),
(93, 'https://picsum.photos/seed/khan-2/400/600', 1),
(93, 'https://picsum.photos/seed/khan-2b/400/600', 0),
(94, 'https://picsum.photos/seed/khan-3/400/600', 1),
(94, 'https://picsum.photos/seed/khan-3b/400/600', 0),
(95, 'https://picsum.photos/seed/khan-4/400/600', 1),
(95, 'https://picsum.photos/seed/khan-4b/400/600', 0);

/* Áo Hoodie Nam */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(96, 'https://picsum.photos/seed/hoodie-nam-1/400/600', 1),
(96, 'https://picsum.photos/seed/hoodie-nam-1b/400/600', 0),
(97, 'https://picsum.photos/seed/hoodie-nam-2/400/600', 1),
(97, 'https://picsum.photos/seed/hoodie-nam-2b/400/600', 0),
(98, 'https://picsum.photos/seed/hoodie-nam-3/400/600', 1),
(98, 'https://picsum.photos/seed/hoodie-nam-3b/400/600', 0);

/* Áo Hoodie Nữ */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(99, 'https://picsum.photos/seed/hoodie-nu-1/400/600', 1),
(99, 'https://picsum.photos/seed/hoodie-nu-1b/400/600', 0),
(100, 'https://picsum.photos/seed/hoodie-nu-2/400/600', 1),
(100, 'https://picsum.photos/seed/hoodie-nu-2b/400/600', 0),
(101, 'https://picsum.photos/seed/hoodie-nu-3/400/600', 1),
(101, 'https://picsum.photos/seed/hoodie-nu-3b/400/600', 0);

/* Áo Polo Nam */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(102, 'https://picsum.photos/seed/polo-nam-1/400/600', 1),
(102, 'https://picsum.photos/seed/polo-nam-1b/400/600', 0),
(103, 'https://picsum.photos/seed/polo-nam-2/400/600', 1),
(103, 'https://picsum.photos/seed/polo-nam-2b/400/600', 0),
(104, 'https://picsum.photos/seed/polo-nam-3/400/600', 1),
(104, 'https://picsum.photos/seed/polo-nam-3b/400/600', 0);

/* Áo Polo Nữ */
INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary) VALUES
(105, 'https://picsum.photos/seed/polo-nu-1/400/600', 1),
(105, 'https://picsum.photos/seed/polo-nu-1b/400/600', 0),
(106, 'https://picsum.photos/seed/polo-nu-2/400/600', 1),
(106, 'https://picsum.photos/seed/polo-nu-2b/400/600', 0),
(107, 'https://picsum.photos/seed/polo-nu-3/400/600', 1),
(107, 'https://picsum.photos/seed/polo-nu-3b/400/600', 0);

/* ============================================================
   7. SAMPLE ORDERS (Đơn hàng mẫu)
   ============================================================ */

INSERT INTO Carts (UserId) VALUES (3), (4), (5);

INSERT INTO Orders (UserId, AddressId, OrderStatus, PaymentStatus, TotalAmount, CreatedAt) VALUES
(3, 1, 'delivered', 'paid', 1247000, DATEADD(day, -20, SYSDATETIME())),
(4, 2, 'delivered', 'paid', 899000, DATEADD(day, -15, SYSDATETIME())),
(5, 3, 'delivered', 'paid', 1897000, DATEADD(day, -10, SYSDATETIME())),
(3, 1, 'shipped', 'paid', 549000, DATEADD(day, -5, SYSDATETIME())),
(6, 4, 'confirmed', 'paid', 799000, DATEADD(day, -2, SYSDATETIME()));

INSERT INTO OrderItems (OrderId, VariantId, Quantity, PriceAtPurchase) VALUES
(1, 1, 1, 249000),
(1, 5, 1, 299000),
(1, 20, 1, 399000),
(1, 70, 1, 299000),
(2, 17, 1, 799000),
(2, 25, 1, 499000),
(3, 52, 1, 1599000),
(3, 2, 1, 249000),
(4, 99, 1, 399000),
(4, 20, 1, 149000),
(5, 17, 1, 799000);

/* Update soldCount for products */
UPDATE Products SET SoldCount = SoldCount + 1 WHERE ProductId = 1;
UPDATE Products SET SoldCount = SoldCount + 1 WHERE ProductId = 4;
UPDATE Products SET SoldCount = SoldCount + 2 WHERE ProductId = 6;
UPDATE Products SET SoldCount = SoldCount + 1 WHERE ProductId = 7;
UPDATE Products SET SoldCount = SoldCount + 1 WHERE ProductId = 17;
UPDATE Products SET SoldCount = SoldCount + 1 WHERE ProductId = 19;
UPDATE Products SET SoldCount = SoldCount + 1 WHERE ProductId = 2;

/* ============================================================
   8. DISCOUNT CODES (Mã giảm giá)
   ============================================================ */

INSERT INTO DiscountCodes (Code, DiscountType, Value, MinOrderValue, StartDate, EndDate, UsageLimit, CreatedBy) VALUES
(N'NEWCUSTOMER', 'percent', 10, 200000, DATEADD(day, -30, SYSDATETIME()), DATEADD(day, 60, SYSDATETIME()), 1000, 1),
(N'SUMMER2024', 'percent', 15, 500000, DATEADD(day, -15, SYSDATETIME()), DATEADD(day, 45, SYSDATETIME()), 500, 1),
(N'FASHION500', 'fixed', 50000, 300000, DATEADD(day, -10, SYSDATETIME()), DATEADD(day, 90, SYSDATETIME()), 2000, 1),
(N'VIPMEMBER', 'percent', 20, 1000000, DATEADD(day, -5, SYSDATETIME()), DATEADD(day, 120, SYSDATETIME()), 100, 1);

/* ============================================================
   HOÀN TẤT - Database Seed Data
   Tổng kết:
   - 8 Users
   - 4 Addresses  
   - 12 Parent Categories + 24 Sub Categories = 36 Categories
   - 147 Products (Áo, Quần, Váy, Đầm, Giày, Túi, Phụ kiện)
   - ~400+ Product Variants (Size x Color x Stock)
   - ~250+ Product Images (2-4 ảnh mỗi sản phẩm)
   - 5 Orders + 11 OrderItems
   - 4 Discount Codes
   ============================================================ */
