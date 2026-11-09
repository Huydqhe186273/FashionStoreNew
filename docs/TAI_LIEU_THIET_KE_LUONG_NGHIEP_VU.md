# BÁO CÁO ĐẶC TẢ CHI TIẾT 2 LUỒNG NGHIỆP VỤ CHÍNH
## Hệ Thống Thương Mại Điện Tử Fashion Store (Tích hợp Cổng PayOS & Kho FIFO)

Tài liệu này được biên soạn phục vụ công tác báo cáo đồ án, thiết kế kiến trúc phần mềm (Software Design Document - SDD) và thuyết minh phân hệ **Admin & Staff**. Toàn bộ các bước mô tả bám sát chính xác 100% với tệp lưu đồ phân làn chuẩn Draw.io tại [`docs/fashionstore_swimlane_flows.drawio`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/docs/fashionstore_swimlane_flows.drawio).

---

# PHẦN 1. LUỒNG 1: QUY TRÌNH NHẬP KHO & KHỞI TẠO BIẾN THỂ SẢN PHẨM
*(Pool Title: Nhập kho và tạo biến thể sản phẩm)*

## 1.1. Thông tin chung
* **Mã nghiệp vụ**: `UC_INBOUND_CATALOG`
* **Các bên tham gia (Actors & System)**:
  1. **Người nhập (Warehouse Staff / Admin)**: Nhân viên quản lý kho hoặc quản trị viên có quyền hạn tạo sản phẩm, cấu hình biến thể và lập phiếu nhập kho.
  2. **Hệ thống (Fashion Store System)**: Backend Spring Boot tiếp nhận dữ liệu, thực hiện xác thực (validation), lưu trữ CSDL, ghép ma trận biến thể, tính toán cộng dồn tồn kho và thiết lập chỉ mục xuất kho FIFO.
* **Mục tiêu**: Đảm bảo quy trình nhập hàng hóa thời trang chặt chẽ từ khâu khai báo thông tin danh mục, chia tách biến thể SKU đa chiều (Size x Màu sắc) cho đến khi hàng thực tế vào kho và sẵn sàng phục vụ bán hàng theo nguyên tắc nhập trước xuất trước (FIFO).
* **Tiền điều kiện (Preconditions)**:
  * Người nhập đã đăng nhập với tài khoản có vai trò `STAFF` hoặc `ADMIN`.
  * Danh mục sản phẩm (Categories) đã được tạo sẵn trên hệ thống.
* **Hậu điều kiện (Postconditions)**:
  * Sản phẩm mới được lưu vào bảng `Product` (`status = 'active'`).
  * Các biến thể SKU được tạo trong bảng `ProductVariant`.
  * Phiếu nhập kho được lưu vào bảng `InboundOrders`.
  * Từng lô hàng theo SKU được lưu vào bảng `InboundBatches` (`status = 'ACTIVE'`, `remainingQuantity = initialQuantity`).
  * Tổng tồn kho khả dụng `ProductVariant.stockQuantity` được cập nhật tự động.

---

## 1.2. Bảng đặc tả từng bước thực hiện (Step-by-step Specification)

| Bước | Bên thực hiện | Tên thao tác / Xử lý | Mô tả chi tiết dữ liệu & Nghiệp vụ |
| :---: | :---: | :--- | :--- |
| **1** | Người nhập | **Khởi đầu (Initial Node)** | Truy cập vào trang quản trị hệ thống. |
| **2** | Người nhập | Xem danh mục & Click tạo SP mới | Mở menu *Quản lý sản phẩm* (`/admin/products`), nhấn nút *"Thêm sản phẩm mới"*. |
| **3** | Người nhập | Nhập thông tin sản phẩm | Điền biểu mẫu: Tên sản phẩm, Danh mục (`categoryId`), Giá bán niêm yết cơ sở (`basePrice`), Mô tả chi tiết chất liệu, kiểu dáng. |
| **4** | Người nhập | Tải ảnh sản phẩm | Chọn file hình ảnh từ máy tính để tải trực tiếp lên Cloudinary (nhận URL bảo mật `secure_url`) hoặc dán link ảnh trực tiếp. |
| **5** | Người nhập | Click lưu sản phẩm | Nhấn nút *"Lưu sản phẩm"* để gửi request `POST /api/admin/products` về máy chủ. |
| **6** | Hệ thống | Kiểm tra thông tin sản phẩm | [`ProductService`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/backend/src/main/java/com/example/myapp/service/ProductService.java) kiểm tra: Tên không được để trống, Danh mục tồn tại, Giá cơ sở phải lớn hơn 0. |
| **7** | Hệ thống | **Rẽ nhánh: Hợp lệ?** | - **Nếu No**: Bắn mã lỗi HTTP 400 kèm thông báo chi tiết.<br>- **Nếu Yes**: Tiến hành lưu dữ liệu. |
| **7a** | Người nhập | *[Nhánh lỗi]* Nhận báo lỗi & Sửa | Hệ thống hiển thị popup thông báo lỗi $\rightarrow$ Người nhập chỉnh sửa lại thông tin tại biểu mẫu (Bước 3). |
| **7b** | Hệ thống | *[Nhánh thành công]* Lưu Product | Ghi bản ghi vào bảng `Product` (`status = 'active'`), trả về đối tượng `ProductDTO` kèm `productId` vừa tạo. |
| **8** | Người nhập | Click tạo biến thể | Chuyển sang màn hình *Quản lý biến thể* (`/admin/variants`), chọn sản phẩm vừa tạo và mở cửa sổ *"Sinh ma trận biến thể (Matrix Generator)"*. |
| **9** | Người nhập | **Tách luồng (Fork Bar)** | Chọn song song 2 thuộc tính phân loại thời trang: |
| **9.1** | Người nhập | Chọn danh sách Kích thước | Tích chọn các Size cần bán (ví dụ: S, M, L, XL, XXL hoặc 29, 30, 31, 32). |
| **9.2** | Người nhập | Chọn danh sách Màu sắc | Tích chọn các Màu sắc (ví dụ: Đen, Trắng, Xanh Navy, Be). |
| **10** | Người nhập | **Hội tụ luồng (Join Bar)** | Ghép nối 2 danh sách thuộc tính đã chọn. |
| **11** | Người nhập | Click Sinh ma trận biến thể | Nhấn nút *"Sinh mã SKU"*, gửi request `POST /api/admin/variants/matrix` chứa mảng Sizes và mảng Colors. |
| **12** | Hệ thống | Tự động tạo SKU & Lưu biến thể | [`ProductVariantService`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/backend/src/main/java/com/example/myapp/service/ProductVariantService.java) thực hiện tích Descartes (Size $\times$ Color), sinh mã SKU chuẩn (VD: `POLO-BLK-M`), lưu vào bảng `ProductVariant` với tồn kho khởi điểm `stockQuantity = 0`. |
| **13** | Người nhập | Mở trang Quản lý nhập hàng | Nhận lô hàng thực tế từ Nhà cung cấp $\rightarrow$ Vào `/staff/inbound` $\rightarrow$ Nhấn *"Nhập hàng mới"*. |
| **14** | Người nhập | Nhập thông tin phiếu nhập | Nhập thông tin chung: Mã số lô hàng (`BatchCode` - ví dụ: `BATCH-20261104-01`), Tên Nhà cung cấp, Ngày giờ nhập hàng, Ghi chú đợt nhập. |
| **15** | Người nhập | Add sản phẩm biến thể | Bấm *"Thêm mặt hàng"*: Chọn Sản phẩm $\rightarrow$ Chọn SKU biến thể cụ thể $\rightarrow$ Nhập Số lượng kiện hàng nhập $\rightarrow$ Nhập Đơn giá nhập vốn (VND). |
| **16** | Người nhập | Click Lưu đơn nhập kho | Rà soát tổng tiền thanh toán cho nhà cung cấp $\rightarrow$ Nhấn nút *"Lưu đơn nhập hàng"*. |
| **17** | Hệ thống | Kiểm tra tính toàn vẹn dữ liệu | [`InboundOrderService`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/backend/src/main/java/com/example/myapp/service/InboundOrderService.java) thực hiện validation đa lớp: Kiểm tra trùng lặp `BatchCode`, kiểm tra danh sách items không rỗng, số lượng nhập $> 0$, đơn giá nhập $\ge 0$. |
| **18** | Hệ thống | **Rẽ nhánh: Hợp lệ?** | - **Nếu No**: Trả về lỗi Validation Exception.<br>- **Nếu Yes**: Thực thi Transaction nhập kho. |
| **18a** | Người nhập | *[Nhánh lỗi]* Nhận báo lỗi & Sửa | Màn hình hiển thị thông báo lỗi cụ thể (ví dụ: *"Mã lô BATCH-01 đã tồn tại"* hoặc *"Số lượng phải lớn hơn 0"*) $\rightarrow$ Người nhập điều chỉnh lại thông tin (Bước 15). |
| **18b** | Hệ thống | *[Nhánh thành công]* Lưu Inbound | - Lưu bản ghi cha `InboundOrders` (NCC, tổng giá trị đơn nhập, ngày nhập, Staff ID).<br>- Tự động bóc tách lưu các bản ghi con `InboundBatches` gắn riêng cho từng SKU (`initialQuantity`, `remainingQuantity = initialQuantity`, `importPrice`, `status = 'ACTIVE'`). |
| **19** | Hệ thống | Tự động cộng dồn tồn kho | Cập nhật trực tiếp số dư tồn kho khả dụng tổng: `ProductVariant.stockQuantity += initialQuantity`. |
| **20** | Hệ thống | Thiết lập chỉ mục FIFO | Đánh dấu thời gian `importDate`: Lô hàng này được đưa vào hàng đợi xuất kho FIFO, hệ thống sẽ tự động ưu tiên trừ lô có ngày nhập sớm nhất trước khi phát sinh đơn bán. |
| **21** | Hệ thống | Đồng bộ dữ liệu | Đồng bộ dữ liệu tức thời lên Tab "Lô Kho (Batches)" và các chỉ số tồn kho trên Dashboard quản trị. |
| **22** | Người nhập | Giám sát & Hoàn tất (Final State) | Người nhập theo dõi danh sách lô hàng vừa nhập, kiểm tra số lượng tồn thực tế đã sẵn sàng phục vụ bán hàng. Kết thúc luồng. |

---

# PHẦN 2. LUỒNG 2: XỬ LÝ ĐƠN HÀNG, THANH TOÁN PAYOS & HOÀN TIỀN
*(Pool Title: Xử lý đơn hàng, thanh toán PayOS và hoàn tiền)*

## 2.1. Thông tin chung
* **Mã nghiệp vụ**: `UC_ORDER_FULFILLMENT_REFUND`
* **Các bên tham gia (Actors & System)**:
  1. **Khách hàng (Customer)**: Người duyệt sản phẩm, đặt hàng, thanh toán qua PayOS và gửi yêu cầu đổi trả khi phát sinh sự cố.
  2. **Hệ thống (System)**: Điều phối toàn bộ trạng thái đơn hàng, gọi API cổng thanh toán, thực hiện khấu trừ và hoàn trả kho FIFO tự động.
  3. **Nhân viên (Staff / Admin)**: Kiểm tra đơn hàng, xác nhận trừ kho, đóng gói bàn giao vận chuyển, thẩm định hàng hoàn và đối soát hoàn tiền.
  4. **Cổng thanh toán PayOS (PayOS Payment Gateway)**: Dịch vụ thanh toán trung gian sinh mã VietQR và gửi Webhook thông báo kết quả giao dịch.
* **Mục tiêu**: Vận hành trọn vẹn chu trình một đơn hàng từ khâu thanh toán trực tuyến, trừ kho FIFO tự động, giao vận, cho đến nghiệp vụ đổi trả, thẩm định chất lượng và hoàn tiền về tài khoản khách hàng.

---

## 2.2. Bảng đặc tả từng bước thực hiện (Step-by-step Specification)

### Giai đoạn A: Đặt hàng & Thanh toán qua PayOS

| Bước | Bên thực hiện | Tên thao tác / Xử lý | Mô tả chi tiết dữ liệu & Nghiệp vụ |
| :---: | :---: | :--- | :--- |
| **1** | Khách hàng | **Khởi đầu (Initial Node)** | Khách hàng truy cập website mua sắm. |
| **2** | Khách hàng | Xem sản phẩm | Khách xem thông tin chi tiết sản phẩm (hình ảnh, giá, mô tả, bảng size). |
| **3** | Khách hàng | Click add sản phẩm vào giỏ | Chọn màu sắc, size và số lượng mong muốn $\rightarrow$ Bấm *"Thêm vào giỏ hàng"*. |
| **4** | Hệ thống | Kiểm tra tồn kho | Kiểm tra số lượng tồn kho khả dụng `ProductVariant.stockQuantity` của biến thể được chọn. |
| **5** | Hệ thống | **Rẽ nhánh: Còn hàng?** | - **Nếu No**: Báo hết hàng.<br>- **Nếu Yes**: Cho phép thêm vào giỏ. |
| **5a** | Khách hàng | *[Nhánh hết]* Nhận báo lỗi | Hệ thống hiển thị thông báo *"Sản phẩm biến thể này đã hết hàng"* $\rightarrow$ Khách quay lại chọn sản phẩm hoặc size khác (Bước 2). |
| **5b** | Khách hàng | *[Nhánh còn]* Thêm giỏ thành công | Sản phẩm được lưu vào giỏ hàng của tài khoản người dùng (`CartItem`). |
| **6** | Khách hàng | Click tạo order | Khách hàng mở trang Giỏ hàng $\rightarrow$ Bấm *"Tiến hành thanh toán"*. |
| **7** | Khách hàng | **Tách luồng (Fork Bar)** | Thực hiện song song 2 bước cấu hình đơn hàng: |
| **7.1** | Khách hàng | Chọn địa chỉ giao hàng | Chọn địa chỉ mặc định hoặc nhập địa chỉ nhận hàng mới kèm số điện thoại liên lạc. |
| **7.2** | Khách hàng | Chọn phương thức thanh toán | Lựa chọn phương thức: Trả tiền mặt khi nhận hàng (COD) hoặc Chuyển khoản VietQR (PayOS). |
| **8** | Khách hàng | **Hội tụ luồng (Join Bar)** | Gom dữ liệu địa chỉ và phương thức thanh toán đã chọn. |
| **9** | Khách hàng | Click Xác nhận đặt hàng | Bấm nút *"Tiến hành Đặt Hàng"* gửi request tạo đơn về hệ thống. |
| **10** | Hệ thống | Khởi tạo đơn hàng | Tạo bản ghi `Order` với trạng thái ban đầu: `orderStatus = 'PENDING'`, `paymentStatus = 'unpaid'`. |
| **11** | Hệ thống | **Rẽ nhánh: Thanh toán online?** | - **Nếu No (COD)**: Lưu thông tin thanh toán COD $\rightarrow$ Chuyển đơn sang hàng đợi chờ nhân viên xác nhận.<br>- **Nếu Yes (PayOS)**: Tiến hành gọi cổng thanh toán. |
| **12** | Hệ thống | Gọi PayOS API | Gọi PayOS SDK/API truyền `orderCode`, `amount`, `description` để yêu cầu tạo link thanh toán VietQR. |
| **13** | PayOS | Sinh link & Mã QR VietQR | Cổng PayOS tiếp nhận, tạo link thanh toán chứa mã QR VietQR chuẩn NAPAS 247 và trả về dữ liệu cho hệ thống. |
| **14** | Khách hàng | Quét mã VietQR trên App | Màn hình hiển thị mã QR $\rightarrow$ Khách dùng ứng dụng Ngân hàng trên điện thoại quét mã và hoàn tất chuyển khoản. |
| **15** | PayOS | Gửi Webhook thanh toán | Ngay khi tiền vào tài khoản thụ hưởng, PayOS kích hoạt Webhook gửi thông tin giao dịch về endpoint `/api/payment/webhook` của hệ thống. |
| **16** | Hệ thống | **Rẽ nhánh: Thanh toán thành công?** | Hệ thống xác thực chữ ký Webhook từ PayOS:<br>- **Nếu No**: Báo lỗi giao dịch.<br>- **Nếu Yes**: Xác nhận thanh toán. |
| **16a** | Khách hàng | *[Nhánh lỗi]* Nhận báo lỗi | Màn hình hiển thị giao dịch thất bại hoặc quá hạn $\rightarrow$ Khách chọn quét lại hoặc đổi sang COD. |
| **16b** | Hệ thống | *[Nhánh thành công]* Xác nhận đơn | Cập nhật bản ghi: `paymentStatus = 'PAID'`, `orderStatus = 'CONFIRMED'`. |

---

### Giai đoạn B: Vận hành, Trừ kho FIFO & Giao nhận

| Bước | Bên thực hiện | Tên thao tác / Xử lý | Mô tả chi tiết dữ liệu & Nghiệp vụ |
| :---: | :---: | :--- | :--- |
| **17** | Nhân viên | Mở danh sách đơn hàng | Nhân viên kho mở trang `/staff/orders`, lọc danh sách các đơn hàng mới (`PENDING` hoặc `CONFIRMED`). |
| **18** | Nhân viên | Click "Xác nhận đơn (Trừ kho FIFO)" | Nhân viên kiểm tra thông tin hợp lệ $\rightarrow$ Nhấn nút *"Xác nhận đơn"* để yêu cầu xuất kho. |
| **19** | Hệ thống | **Thực thi trừ kho FIFO tự động** | [`StaffOrderService`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/backend/src/main/java/com/example/myapp/service/StaffOrderService.java) truy vấn các lô hàng `InboundBatches` của từng biến thể có ngày nhập cũ nhất (`importDate ASC`) còn hàng:<br>- Khấu trừ số lượng thực tế từ lô cũ trước.<br>- Nếu lô hết hàng, chuyển `status = 'DEPLETED'`.<br>- Cập nhật tồn kho `ProductVariant.stockQuantity`.<br>- Chuyển trạng thái đơn hàng sang **`PROCESSING`**. |
| **20** | Nhân viên | Đóng gói & Bàn giao Shipper | Nhân viên in phiếu xuất kho, nhặt hàng theo đúng SKU (Size, Màu), đóng gói kiện hàng niêm phong $\rightarrow$ Bàn giao cho đơn vị vận chuyển $\rightarrow$ Bấm *"Giao hàng (SHIPPED)"*. |
| **21** | Hệ thống | Cập nhật trạng thái SHIPPED | Lưu `orderStatus = 'SHIPPED'`, gửi email và thông báo mã vận đơn tra cứu đến khách hàng. |
| **22** | Khách hàng | Nhận kiện hàng thực tế | Đơn vị vận chuyển giao hàng tận tay $\rightarrow$ Khách nhận hàng (và trả tiền COD cho shipper nếu chọn hình thức COD). |
| **23** | Nhân viên | Xác nhận DELIVERED | Nhận thông báo giao thành công từ hãng vận chuyển $\rightarrow$ Nhân viên bấm *"DELIVERED"*. |
| **24** | Hệ thống | Ghi nhận doanh thu | Lưu `orderStatus = 'DELIVERED'`, thanh toán `PAID`, cộng dồn vào doanh thu thực thu trên Dashboard báo cáo. |

---

### Giai đoạn C: Xử lý Đổi trả, Thẩm định & Hoàn tiền (Refund Lifecycle)

| Bước | Bên thực hiện | Tên thao tác / Xử lý | Mô tả chi tiết dữ liệu & Nghiệp vụ |
| :---: | :---: | :--- | :--- |
| **25** | Khách hàng | **Rẽ nhánh: Khách yêu cầu đổi trả?** | Sau khi nhận hàng trong vòng 7 ngày:<br>- **Nếu No**: Khách hài lòng $\rightarrow$ Đơn hàng kết thúc bình thường (Final State).<br>- **Nếu Yes**: Khách phát sinh sự cố (chật size, lỗi vải). |
| **26** | Khách hàng | Gửi yêu cầu đổi trả | Khách vào *Lịch sử đơn hàng* $\rightarrow$ Bấm *"Trả hàng / Hoàn tiền"*, chọn lý do, tải ảnh/video chứng minh và điền thông tin Số tài khoản + Tên ngân hàng nhận hoàn tiền. |
| **27** | Hệ thống | Tạo ReturnRequest | Hệ thống kiểm tra đơn hợp lệ $\rightarrow$ Khởi tạo bản ghi `ReturnRequest` với `status = 'PENDING'` và đồng bộ lên danh sách chờ xử lý của nhân viên. |
| **28** | Nhân viên | Tiếp nhận kiện hàng hoàn về | Bưu tá giao kiện hàng khách hoàn về kho shop $\rightarrow$ Nhân viên mở chi tiết yêu cầu đổi trả trên hệ thống để đối soát. |
| **29** | Nhân viên | Kiểm tra sản phẩm thực tế | Thẩm định tình trạng thực tế: Tem mác, độ nguyên vẹn, tình trạng đã qua sử dụng hay chưa. |
| **30** | Nhân viên | **Rẽ nhánh: Đạt điều kiện đổi trả?** | - **Nếu No**: Sản phẩm mất tem, rách bẩn, đã giặt.<br>- **Nếu Yes**: Hàng còn nguyên tem mác, đủ điều kiện nhập lại kho. |
| **30a** | Nhân viên | *[Nhánh từ chối]* Click Từ chối | Bấm nút *"Từ chối"* $\rightarrow$ Nhập lý do giải trình chi tiết. |
| **30b** | Hệ thống | Lưu lý do từ chối | Cập nhật `ReturnRequest.status = 'REJECTED'`, lưu lý do từ chối vào hệ thống. |
| **30c** | Khách hàng | Nhận thông báo từ chối | Khách hàng nhận được thông báo từ chối đổi trả kèm biên bản giải trình của shop. Kết thúc nhánh từ chối (Final State). |
| **30d** | Nhân viên | *[Nhánh duyệt]* Duyệt hoàn tiền | Bấm nút *"Duyệt hoàn tiền & Hoàn kho"*. |
| **31** | Hệ thống | **Phục hồi kho FIFO tự động** | Hệ thống tự động kích hoạt hàm `restockOrderItems()`:<br>- Dò tìm lại đúng các lô `InboundBatches` đã từng xuất cho đơn này $\rightarrow$ Cộng bù lại số lượng.<br>- Chuyển lại trạng thái lô thành `ACTIVE`.<br>- Cộng lại tồn kho tổng `ProductVariant.stockQuantity`.<br>- Cập nhật trạng thái đơn sang **`RETURNED`** và thanh toán sang **`REFUNDED`**. |
| **32** | Nhân viên | Chuyển khoản hoàn tiền | Nhân viên/Admin đối soát thông tin tài khoản ngân hàng của khách đã cung cấp $\rightarrow$ Thực hiện lệnh chuyển khoản hoàn trả tiền. |
| **33** | Khách hàng | Nhận tiền hoàn & Kết thúc | Khách nhận tiền vào tài khoản ngân hàng và nhận thông báo hoàn tất đổi trả trên hệ thống. Kết thúc luồng giao dịch thành công (Final State). |

---

## 3. BẢNG TỔNG HỢP ÁNH XẠ MÃ NGUỒN (SOURCE CODE MAPPING)

| Thành phần nghiệp vụ | Tệp mã nguồn Backend (Spring Boot) | Tệp giao diện Frontend (React) |
| :--- | :--- | :--- |
| **Quản lý Sản phẩm** | [`ProductController.java`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/backend/src/main/java/com/example/myapp/controller/ProductController.java)<br>[`ProductService.java`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/backend/src/main/java/com/example/myapp/service/ProductService.java) | [`ManageProducts.jsx`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/frontend/src/pages/ManageProducts.jsx) |
| **Ma trận Biến thể SKU** | [`AdminVariantController.java`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/backend/src/main/java/com/example/myapp/controller/AdminVariantController.java)<br>[`ProductVariantService.java`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/backend/src/main/java/com/example/myapp/service/ProductVariantService.java) | [`ManageVariants.jsx`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/frontend/src/pages/ManageVariants.jsx) |
| **Nhập kho & Lô hàng FIFO** | [`InboundOrderController.java`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/backend/src/main/java/com/example/myapp/controller/InboundOrderController.java)<br>[`InboundOrderService.java`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/backend/src/main/java/com/example/myapp/service/InboundOrderService.java) | [`ManageInbound.jsx`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/frontend/src/pages/ManageInbound.jsx) |
| **Cổng thanh toán PayOS** | [`PaymentController.java`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/backend/src/main/java/com/example/myapp/controller/PaymentController.java) | [`Cart.jsx`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/frontend/src/pages/Cart.jsx) |
| **Xử lý Đơn & Đổi trả / Hoàn tiền** | [`StaffOrderController.java`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/backend/src/main/java/com/example/myapp/controller/StaffOrderController.java)<br>[`StaffOrderService.java`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/backend/src/main/java/com/example/myapp/service/StaffOrderService.java) | [`ManageOrders.jsx`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/frontend/src/pages/ManageOrders.jsx) |

