# 🤖 AGENTS / AI INSTRUCTIONS & DEVELOPER CHECKPOINT

> **LƯU Ý CHO AI / AGENT:** Đây là hồ sơ cấu hình môi trường máy tính và quy chuẩn riêng của Developer (Đào Quang Huy). Bất kỳ AI nào khi làm việc trong repository này **BẮT BUỘC** phải tuân theo các quy tắc bên dưới để tránh làm gãy môi trường chạy của máy.

---

## 1. THÔNG TIN DEVELOPER & MÁY PHÁT TRIỂN
* **Chủ sở hữu:** Đào Quang Huy (GitHub: `Huydqhe186273`)
* **Nhánh làm việc chính:** `huy`
* **Hệ điều hành:** Windows 11 (`DAOHUY`)

---

## 2. QUY CHUẨN JAVA & BUILD (CỰC KỲ QUAN TRỌNG)
* **JDK chuẩn:** **Java 17 LTS** (`C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot`).
* **Bytecode Class Version:** Luôn là **61.0 (Java 17)**.
* ⚠️ **CẤM:** Tuyệt đối KHÔNG nâng `<java.version>` hay compile sang Java 25 (version 69.0) dưới bất kỳ hình thức nào.
* **Cấu hình compiler của dự án:** 
  * File `backend/.settings/org.eclipse.jdt.core.prefs` đã được ghim cố định:
    ```properties
    org.eclipse.jdt.core.compiler.codegen.targetPlatform=17
    org.eclipse.jdt.core.compiler.compliance=17
    org.eclipse.jdt.core.compiler.source=17
    org.eclipse.jdt.core.compiler.release=enabled
    ```
  * Cấu hình VS Code: `.vscode/settings.json` và User Settings `%APPDATA%\Code\User\settings.json` luôn trỏ `java.jdt.ls.java.home` về JDK 17: `C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot`.
* **Lệnh build chuẩn:** `mvn clean compile` từ thư mục `backend/`.

---

## 3. CẤU HÌNH DATABASE (SQL SERVER)
* **Instance hoạt động:** SQL Server `DAOHUY\MSSQLSERVER01` (dịch vụ `MSSQL$MSSQLSERVER01` đang chạy trên port `1433`).
* **Tên Database:** `FashionStoreDB`
* **Tài khoản đăng nhập:**
  * Username: `sa`
  * Password: `sa` (⚠️ **CẤM:** Không được đổi fallback password về `12345` hay `123456` khi merge code).
* **Connection String chuẩn:**
  ```text
  jdbc:sqlserver://localhost:1433;databaseName=FashionStoreDB;encrypt=true;trustServerCertificate=true;sendStringParametersAsUnicode=true;characterEncoding=UTF-8;stringtype=nvarchar;
  ```
* **Vị trí file cấu hình:**
  * `backend/src/main/resources/application.yml`
  * `backend/src/main/java/com/example/myapp/MyAppApplication.java`
  * `backend/.env` (DB_URL, DB_USERNAME, DB_PASSWORD)

---

## 4. CẤU TRÚC DỰ ÁN & PORT CHẠY
* **Backend:** Spring Boot (Java 17) -> Port `8080`
  * Khởi động: Bấm Run file `MyAppApplication.java` trên VS Code hoặc `mvn spring-boot:run`.
* **Frontend:** React + Vite -> Port `3000` (hoặc `5173`)
  * Khởi động: `npm run dev` trong thư mục `frontend/`.
* **Database & Seed:**
  * `database/migrations/`: Các migration từ `V001` đến `V005` (hỗ trợ Tiếng Việt NVARCHAR Unicode).
  * `database/SeedData.sql`: Dữ liệu mẫu demo.

---

## 5. LỊCH SỬ SỰ CỐ ĐÃ GIẢI QUYẾT TRIỆT ĐỂ (TRÁNH TÁI PHÁT)
1. **Lỗi `UnsupportedClassVersionError` (69.0 vs 61.0):**
   * *Nguyên nhân:* Cache ẩn của VS Code Java Language Server (`workspaceStorage`) từng lưu target = 25 do một commit cũ thử nghiệm.
   * *Giải pháp vĩnh viễn:* Đã tạo `backend/.settings/org.eclipse.jdt.core.prefs` ép cứng Java 17 ngay trong repo và ghim JDK 17 vào User Settings VS Code.
2. **Lỗi Login Failed SQL Server do merge code:**
   * *Nguyên nhân:* Nhánh khác dùng mật khẩu `12345` merge đè lên `sa`.
   * *Giải pháp:* Đã khôi phục mặc định `sa`/`sa` cho [MyAppApplication.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/MyAppApplication.java) và [application.yml](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/resources/application.yml).

---

## 6. DANH SÁCH TÍNH NĂNG ĐƯỢC PHÂN CÔNG (ASSIGNED TASKS - ĐÀO QUANG HUY)

| Mã Task | Epic | Tên Tính Năng (Feature) | Loại | Mô Tả Chi Tiết | Iteration | Trạng Thái Sprint | File Code Chính (Luồng gọi ➔) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **II.5.1** | II.5 | **Cart** | Screen | View shopping cart | Iter1 | `Done` | `Cart.jsx` ➔ `cartService.js` ➔ `CartController.java` ➔ `CartService.java` ➔ `CartRepository.java` |
| **II.5.2** | II.5 | **Add to Cart** | Function | Add product variant to cart | Iter1 | `Done` | `ProductDetailPage.jsx` ➔ `cartService.js` ➔ `CartController.java` ➔ `CartService.java` ➔ `CartItemRepository.java` |
| **II.5.3** | II.5 | **Edit Cart** | Function | Change quantity/size/color | Iter2 | `Done` | `Cart.jsx` ➔ `cartService.js` ➔ `CartController.java` ➔ `CartService.java` ➔ `CartItemRepository.java` |
| **II.5.4** | II.5 | **Remove Cart Item** | Function | Remove item from cart | Iter2 | `Done` | `Cart.jsx` ➔ `cartService.js` ➔ `CartController.java` ➔ `CartService.java` ➔ `CartItemRepository.java` |
| **II.5.5** | II.5 | **Apply Coupon** | Function | Apply/remove discount coupon at checkout | Iter2 | `Done` | `Cart.jsx` ➔ `couponService.js` ➔ `CouponController.java` ➔ `DiscountCodeService.java` ➔ `DiscountCodeRepository.java` |
| **II.5.6** | II.5 | **Checkout** | Screen | Select address, items, coupon and create order | Iter2 | `Done` | `Cart.jsx` ➔ `addressService.js` ➔ `AddressController.java` ➔ `AddressService.java` ➔ `AddressRepository.java` |
| **II.5.7** | II.5 | **Create Order** | Function | Create order and order details | Iter2 | `Done` | `Cart.jsx` ➔ `orderService.js` ➔ `OrderController.java` ➔ `OrderService.java` ➔ `OrderRepository.java` |
| **II.5.8** | II.5 | **Order History** | Screen | View customer order history & filter by status | Iter2 | `Done` | `OrderHistory.jsx` ➔ `orderService.js` ➔ `OrderController.java` ➔ `OrderService.java` ➔ `OrderRepository.java` |
| **II.5.9** | II.5 | **Order Details** | Function | View order detail information & item list | Iter2 | `Done` | `OrderHistory.jsx` ➔ `orderService.js` ➔ `OrderController.java` ➔ `OrderService.java` ➔ `OrderDetailRepository.java` |
| **II.5.10** | II.5 | **Cancel Order** | Function | Cancel pending order | Iter2 | `Done` | `OrderHistory.jsx` ➔ `orderService.js` ➔ `OrderController.java` ➔ `OrderService.java` ➔ `ProductVariantRepository.java` |
| **II.5.11** | II.5 | **Return / Refund Request** | Function | Request return & refund for customer orders | Iter2 | `Done` | `OrderHistory.jsx` ➔ `orderService.js` ➔ `OrderController.java` ➔ `OrderService.java` ➔ `OrderRepository.java` |
| **II.8.1 / 5.2** | II.8 | **Create PayOS Payment** | API | Create PayOS payment link | Iter1 | `Done` | `Cart.jsx` ➔ `paymentService.js` ➔ `PaymentController.java` ➔ `PayOS SDK` |
| **II.8.2 / 5.2** | II.8 | **PayOS Webhook** | API | Receive and verify PayOS webhook | Iter1 | `Done` | `PayOS Server` ➔ `PaymentController.java` ➔ `OrderService.java` ➔ `PaymentRepository.java` |
| **II.8.3** | II.8 | **Payment Status** | API | Query/update payment transaction status | Iter1 | `Done` | `OrderHistory.jsx` ➔ `PaymentController.java` ➔ `PaymentRepository.java` ➔ `OrderRepository.java` |
| **II.9.4** | II.9 | **Order Notification** | API | Send order status notifications | Iter2 | `Done` | `OrderService.java` ➔ `NotificationService.java` ➔ `NotificationRepository.java` |
| **II.9.5** | II.9 | **Notification List** | Screen | View customer notifications | Iter2 | `Done` | `CustomerNavbar.jsx` / `NotificationsPage.jsx` ➔ `notificationService.js` ➔ `NotificationController.java` ➔ `NotificationService.java` |
| **II.9.6** | II.9 | **Mark Notification Read** | Function | Mark notification as read | Iter2 | `Done` | `NotificationsPage.jsx` ➔ `notificationService.js` ➔ `NotificationController.java` ➔ `NotificationService.java` |
