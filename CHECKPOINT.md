# 📌 BẢN GHI CHECKPOINT AI & MÔI TRƯỜNG DỰ ÁN (ĐÀO QUANG HUY)

* **Ngày cập nhật:** 22/10/2026
* **Tác giả:** Đào Quang Huy (`Huydqhe186273`)
* **Branch làm việc:** `huy`
* **📖 Cẩm nang học luồng code review chi tiết:** [README_LUONG_CODE_HUY.md](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/README_LUONG_CODE_HUY.md)

---

## 💻 1. MÔI TRƯỜNG MÁY & CẤU HÌNH LOCAL
| Mục | Cấu hình chuẩn của máy Huy | Ghi chú |
| :--- | :--- | :--- |
| **Hệ điều hành** | Windows 11 (`DAOHUY`) | Terminal PowerShell |
| **Java JDK** | **Java 17 LTS** | `C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot` |
| **Bytecode Class Version** | **61.0** (Java 17) | **CẤM** chuyển sang 69.0 (Java 25) |
| **SQL Server Instance** | `MSSQLSERVER01` | Service `MSSQL$MSSQLSERVER01` đang chạy |
| **Database Name** | `FashionStoreDB` | Port `1433` |
| **DB Account** | User: `sa` / Password: `sa` | Tuyệt đối không dùng `12345` / `123456` |
| **Backend Port** | `8080` | Spring Boot |
| **Frontend Port** | `3000` / `5173` | React + Vite |

---

## 🔒 2. CÁC ĐIỂM CHỐT BẢO VỆ MÔI TRƯỜNG (KHÔNG ĐƯỢC PHÁ)
1. **File `backend/.settings/org.eclipse.jdt.core.prefs`:**
   * Giữ cố định `compliance=17`, `targetPlatform=17`, `source=17` để VS Code Java Extension không bao giờ tự ý nâng class version lên 25.
2. **File `.vscode/settings.json`:**
   * `"java.jdt.ls.java.home": "C:\\Program Files\\Microsoft\\jdk-17.0.19.10-hotspot"`
   * `"java.configuration.updateBuildConfiguration": "automatic"`
3. **File `backend/src/main/resources/application.yml` & `MyAppApplication.java`:**
   * Fallback DB password luôn là `sa`.
   * JDBC URL: `jdbc:sqlserver://localhost:1433;databaseName=FashionStoreDB;encrypt=true;trustServerCertificate=true;sendStringParametersAsUnicode=true;characterEncoding=UTF-8;stringtype=nvarchar;`

---

## 🚀 3. LỆNH CHẠY & KIỂM TRA NHANH
```powershell
# 1. Build backend
cd backend
mvn clean compile

# 2. Run backend
# Bấm nút "Run: MyAppApplication" trên VS Code hoặc:
mvn spring-boot:run

# 3. Run frontend
cd ../frontend
npm run dev
```

---

## 📝 4. TRẠNG THÁI HIỆN TẠI CỦA PROJECT
* Đã sửa triệt để lỗi xung đột version Java (`UnsupportedClassVersionError`).
* Đã đưa DB config về chuẩn `sa`/`sa`.
* Kết nối database và các migration `V001` - `V005` chạy ổn định, hỗ trợ hiển thị Tiếng Việt có dấu Unicode (`NVARCHAR`).

---

## 🎯 5. DANH SÁCH TÍNH NĂNG ĐƯỢC PHÂN CÔNG (ASSIGNED TASKS - HUY)

| Mã Task | Epic | Tên Tính Năng (Feature) | Loại | Mô Tả | Iteration | Trạng Thái Sprint | File Code Chính |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **II.5.1** | II.5 | **Cart** | Screen | View shopping cart | Iter1 | `Done` | [Cart.jsx](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/frontend/src/pages/Cart.jsx), [Cart.css](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/frontend/src/pages/Cart.css) |
| **II.5.2** | II.5 | **Add to Cart** | Function | Add product variant to cart | Iter1 | `Done` | [CartController.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/controller/CartController.java), [CartService.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/service/CartService.java) |
| **II.5.3** | II.5 | **Edit Cart** | Function | Change quantity/size/color | Iter2 | `Done` | [CartService.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/service/CartService.java), [Cart.jsx](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/frontend/src/pages/Cart.jsx) |
| **II.5.4** | II.5 | **Remove Cart Item** | Function | Remove item from cart | Iter2 | `Done` | [CartController.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/controller/CartController.java), [CartService.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/service/CartService.java) |
| **II.5.5** | II.5 | **Apply Coupon** | Function | Apply/remove discount coupon at checkout | Iter2 | `To Do` *(Code sẵn backend)* | [CouponController.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/controller/CouponController.java), [DiscountCodeService.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/service/DiscountCodeService.java) |
| **II.5.6** | II.5 | **Checkout** | Screen | Select address, items, coupon and create order | Iter2 | `To Do` *(Code sẵn Cart.jsx)* | [Cart.jsx](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/frontend/src/pages/Cart.jsx), [addressService.js](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/frontend/src/services/addressService.js) |
| **II.5.7** | II.5 | **Create Order** | Function | Create order and order details | Iter2 | `To Do` *(Code sẵn backend)* | [OrderController.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/controller/OrderController.java), [OrderService.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/service/OrderService.java) |
| **II.5.8** | II.5 | **Order History** | Screen | View customer order history & filter by status | Iter2 | `Done` | [OrderHistory.jsx](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/frontend/src/pages/customer/OrderHistory.jsx), [OrderHistory.css](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/frontend/src/pages/customer/OrderHistory.css) |
| **II.5.9** | II.5 | **Order Details** | Function | View order detail information & item list | Iter2 | `Done` | [OrderHistory.jsx](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/frontend/src/pages/customer/OrderHistory.jsx), [OrderController.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/controller/OrderController.java) |
| **II.5.10** | II.5 | **Cancel Order** | Function | Cancel pending order | Iter2 | `Done` | [OrderController.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/controller/OrderController.java), [OrderService.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/service/OrderService.java) |
| **II.5.11** | II.5 | **Return / Refund Request** | Function | Request return & refund for customer orders | Iter2 | `Done` | [OrderHistory.jsx](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/frontend/src/pages/customer/OrderHistory.jsx), [OrderService.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/service/OrderService.java) |
| **II.8.1 / 5.2** | II.8 | **Create PayOS Payment** | API | Create PayOS payment link | Iter1 | `Done` | [PaymentController.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/controller/PaymentController.java), [Cart.jsx](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/frontend/src/pages/Cart.jsx) |
| **II.8.2 / 5.2** | II.8 | **PayOS Webhook** | API | Receive and verify PayOS webhook | Iter1 | `To Do` | [PaymentController.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/controller/PaymentController.java) |
| **II.8.3** | II.8 | **Payment Status** | API | Query/update payment transaction status | Iter1 | `To Do` | [PaymentController.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/controller/PaymentController.java), [PaymentRepository.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/repos/PaymentRepository.java) |
| **II.9.4** | II.9 | **Order Notification** | API | Send order status notifications | Iter2 | `To Do` *(Code sẵn backend)* | [NotificationService.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/service/NotificationService.java), [NotificationController.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/controller/NotificationController.java) |
| **II.9.5** | II.9 | **Notification List** | Screen | View customer notifications | Iter2 | `To Do` *(Code sẵn frontend)* | [NotificationsPage.jsx](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/frontend/src/pages/customer/NotificationsPage.jsx), [CustomerNavbar.jsx](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/frontend/src/components/CustomerNavbar.jsx) |
| **II.9.6** | II.9 | **Mark Notification Read** | Function | Mark notification as read | Iter2 | `To Do` *(Code sẵn)* | [NotificationController.java](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/backend/src/main/java/com/example/myapp/controller/NotificationController.java), [notificationService.js](file:///e:/KI%20dai%20chien%20cuoi%20cung/FA-2026/game/frontend/src/services/notificationService.js) |


