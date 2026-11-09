# ĐẶC TẢ SƠ ĐỒ GÓI HỆ THỐNG (UML PACKAGE DIAGRAM)
## Dự Án: Hệ Thống Bán Hàng Thời Trang Fashion Store (Spring Boot & React)

Tệp sơ đồ Draw.io chuẩn theo mẫu thiết kế đã được tạo sẵn tại:
* 📁 **Tệp riêng độc lập**: [`docs/PACKAGE_DIAGRAM.drawio`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/docs/PACKAGE_DIAGRAM.drawio)
* 📁 **Bản sao tại thư mục gốc**: [`PACKAGE_DIAGRAM.drawio`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/PACKAGE_DIAGRAM.drawio)
* 📁 **Tab 3 trong tệp tổng hợp**: [`docs/fashionstore_swimlane_flows.drawio`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/docs/fashionstore_swimlane_flows.drawio)

---

## 1. HÌNH THỨC TRÌNH BÀY & BỐ CỤC THEO MẪU

Sơ đồ được thiết kế với **khung viền tổng thể bao quanh**, bên trong chia thành **7 khối Package lớn** được nối với nhau qua các mũi tên điều hướng luồng dữ liệu một chiều:

```
+--------------------------------------------------------------------------------------------------------------------+
|                                                                                                                    |
|   +------------------------------------+                         +---------------------------------------------+   |
|   |   Presentation Package (Frontend)  | ----------------------> |              Controller Package             |   |
|   |  [Pages]  [Components]  [Contexts] |                         | [AuthController]   [ProductController] ...  |   |
|   |  [API Services] [Routes] [Layouts] |                         | [InboundOrderController] [StaffOrderCtrl]   |   |
|   +------------------------------------+                         +---------------------------------------------+   |
|                                                                                             |                      |
|                                                                                             |                      |
|                                                                                             v                      |
|   +------------------------------------+                         +---------------------------------------------+   |
|   |         Repository Package         | <---------------------- |               Service Package               |   |
|   | [UserRepo]    [ProductRepo] ...    |                         | [AuthService]      [ProductService] ...     |   |
|   | [InboundBatchRepo] [OrderRepo]     |                         | [InboundOrderService] [StaffOrderService]   |   |
|   +------------------------------------+                         +---------------------------------------------+   |
|                     |                                                                   |                          |
|                     |                                                                   | (gọi API / SDK)          |
|                     v                                                                   v                          |
|   +------------------------------------+       +--------------+  +---------------------------------------------+   |
|   |            Model Package           | ----> |   Database   |  |               External Systems              |   |
|   | [User] [Product] [Variant] [Order] |       |   [MySQL /   |  | [PayOS Payment Gateway] [Gmail SMTP Service]|   |
|   | [InboundBatch] [ReturnRequest] ... |       |  SQL Server] |  | [Cloudinary Storage]   [Google Identity]    |   |
|   +------------------------------------+       +--------------+  +---------------------------------------------+   |
|                                                                                                                    |
+--------------------------------------------------------------------------------------------------------------------+
```

---

## 2. BẢNG MÔ TẢ CHI TIẾT TỪNG PACKAGE (PACKAGE DESCRIPTION TABLE)

Dưới đây là bảng đặc tả chuẩn tiếng Anh theo mẫu báo cáo đồ án, mô tả đầy đủ nhiệm vụ, quy ước đặt tên và các thành phần cốt lõi của từng Package:

| No | Package | Description |
| :---: | :--- | :--- |
| **01** | **Presentation Package (Frontend)** | Contains React frontend modules, including Pages, Components, Contexts, API Services, Routes, and Layouts. These modules provide responsive user interfaces, manage global application states, and handle user interactions for Customers, Staff, and Administrators. Components follow PascalCase naming conventions and communicate with the backend RESTful APIs via Axios asynchronous HTTP client services. |
| **02** | **Controller Package** | Contains Spring Boot REST API controllers responsible for exposing HTTP endpoints, intercepting client requests, validating incoming request payloads, enforcing role-based access control (`@PreAuthorize` for ADMIN and STAFF), and delegating business logic to appropriate services. Examples include `AuthController`, `ProductController`, `AdminVariantController`, `InboundOrderController`, `StaffOrderController`, `OrderController`, `CartController`, `PaymentController`, `AdminUserController`, and `DashboardController`. |
| **03** | **Service Package** | Contains core business logic implementations, algorithmic operations, and service interfaces of the system. Responsibilities include automated FIFO (First-In, First-Out) inventory deduction and restocking, batch generation algorithms for product variants, transactional processing for checkout, payment verification, and revenue reporting. Examples include `StaffOrderService`, `InboundOrderService`, `ProductService`, `ProductVariantService`, `OrderService`, `CartService`, `AuthService`, `DashboardService`, `AdminReportService`, and `CloudinaryService`. |
| **04** | **Repository Package** | Contains Spring Data JPA repository interfaces extending `JpaRepository` for abstracting database operations and data persistence. Provides automated CRUD methods and custom JPQL/SQL queries, such as querying active inbound batches sorted chronologically by `importDate` for FIFO queue management and aggregating total revenue statistics. Examples include `UserRepository`, `ProductRepository`, `ProductVariantRepository`, `InboundBatchRepository`, `InboundOrderRepository`, `OrderRepository`, `CartRepository`, `CategoryRepository`, and `ReturnRequestRepository`. |
| **05** | **Model Package** | Contains JPA Domain Entities representing database tables and Object-Relational Mapping (ORM) relationships, as well as Data Transfer Objects (DTOs) for request/response serialization. Enhances data security by decoupling internal database schemas from client-facing data. Examples of entities include `User`, `Product`, `ProductVariant`, `ProductImage`, `InboundOrder`, `InboundBatch`, `Order`, `OrderItem`, `ReturnRequest`, `Payment`, `Cart`, and `DiscountCode`. |
| **06** | **Database** | Represents the relational database management system (RDBMS) utilizing MySQL / Microsoft SQL Server. Stores persistent application data including user credentials, product catalogs, SKU inventories, batch lifecycles, and transaction histories, ensuring ACID properties, foreign key integrity, and relational constraints managed through Hibernate ORM. |
| **07** | **External Systems** | Represents third-party APIs and infrastructure services integrated with the backend via HTTP/REST and SDKs. Includes `PayOS Payment Gateway` for generating NAPAS 247 VietQR payment links and receiving instant webhook notifications, `Cloudinary CDN` for secure image storage and optimization, `Gmail SMTP Service` for automated transactional emails, and `Google Identity Platform` for OAuth2 authentication. |

---

## 3. CHI TIẾT CÁC PACKAGE TRONG DỰ ÁN (BẢN TIẾNG VIỆT)

### 2.1. Presentation Package (Frontend Client - React Vite)
* **Vị trí**: `frontend/src/`
* **Các thành phần (biểu tượng Folder)**:
  * `Pages`: Các màn hình giao diện chính (`ManageOrders`, `ManageInbound`, `ManageProducts`, `ManageVariants`, `ManageStaff`, `DashboardOverview`, `Cart`, `Profile`).
  * `Components`: Các thành phần tái sử dụng (`Sidebar`, `Header`, `Modal`, `ProductImageModal`, `ProtectedRoute`).
  * `Contexts`: Quản lý trạng thái toàn cục (`AuthContext` quản lý phiên đăng nhập & vai trò, `ToastContext` hiển thị thông báo popup).
  * `API Services`: Tầng gọi API qua Axios (`orderService`, `inboundService`, `productService`, `variantService`, `staffService`).
  * `Routes`: Cấu hình định tuyến và phân quyền đường dẫn React Router trong `App.jsx`.
  * `Layouts`: Khung sườn giao diện chuẩn (`AdminLayout`, `CustomerLayout`).

### 2.2. Controller Package (Tầng tiếp nhận API RESTful)
* **Vị trí**: `backend/src/main/java/com/example/myapp/controller/`
* **Nhiệm vụ**: Đón nhận các HTTP Request (GET, POST, PUT, DELETE), xác thực quyền truy cập (`@PreAuthorize`), validate dữ liệu đầu vào và chuyển tiếp xuống tầng Service.
* **Các Controller tiêu biểu**:
  * `AuthController`: Đăng nhập, đăng ký, refresh token, xác thực OTP.
  * `ProductController`: API danh sách, xem chi tiết, tạo và cập nhật sản phẩm.
  * `AdminVariantController`: Quản lý biến thể và API sinh ma trận biến thể tự động.
  * `OrderController`: Đặt hàng dành cho khách hàng, xem lịch sử đơn.
  * `StaffOrderController`: Xác nhận đơn hàng, trừ kho FIFO, duyệt đổi trả, đánh dấu bom hàng (RTO).
  * `InboundOrderController`: Lập phiếu nhập kho và tra cứu danh sách lô hàng FIFO.
  * `CartController`: Thêm, sửa, xóa giỏ hàng người dùng.
  * `PaymentController`: Gọi cổng thanh toán VietQR PayOS và tiếp nhận Webhook kết quả giao dịch.
  * `AdminUserController`: Quản lý khách hàng, nhân viên và phân quyền vai trò.
  * `DashboardController`: Thống kê KPI, doanh thu và biểu đồ kinh doanh.

### 2.3. Service Package (Tầng xử lý logic nghiệp vụ)
* **Vị trí**: `backend/src/main/java/com/example/myapp/service/`
* **Nhiệm vụ**: Xử lý toàn bộ logic nghiệp vụ cốt lõi, thuật toán trừ kho và hoàn kho FIFO, mã hóa mật khẩu, tính toán báo cáo tài chính.
* **Các Service tiêu biểu**:
  * `AuthService`: Xác thực thông tin tài khoản, cấp phát JWT Token.
  * `ProductService`: Xử lý logic nghiệp vụ sản phẩm, lọc theo danh mục và giá.
  * `ProductVariantService`: Thuật toán nhân ma trận (Size $\times$ Màu sắc) sinh mã SKU chuẩn.
  * `OrderService`: Xử lý tạo đơn hàng, áp dụng coupon giảm giá.
  * `StaffOrderService`: **Thuật toán trừ kho FIFO** từ các lô cũ nhất (`importDate ASC`) và **phục hồi kho tự động** khi có hủy đơn/đổi trả (`restockOrderItems`).
  * `InboundOrderService`: Xử lý lưu phiếu nhập, bóc tách lô hàng `InboundBatches` và cộng dồn tồn kho.
  * `CartService`: Tính toán số lượng và giá trị giỏ hàng.
  * `DashboardService`: Tính tổng doanh thu, tỷ lệ hoàn tất đơn, top 5 sản phẩm bán chạy.
  * `AdminReportService`: Lọc doanh thu thực thu theo mốc thời gian linh hoạt (7 ngày, 30 ngày, năm nay).
  * `CloudinaryService`: Tải ảnh lên máy chủ Cloudinary và nhận URL an toàn.

### 2.4. Repository Package (Tầng truy xuất dữ liệu Spring Data JPA)
* **Vị trí**: `backend/src/main/java/com/example/myapp/repos/`
* **Nhiệm vụ**: Cung cấp các giao diện kế thừa `JpaRepository` để Hibernate tự động sinh mã SQL thao tác với cơ sở dữ liệu.
* **Các Repository tiêu biểu**:
  * `UserRepository`: Tìm user theo email, số điện thoại, kiểm tra trùng lặp.
  * `ProductRepository`: Tìm kiếm sản phẩm kèm phân trang, lọc theo danh mục.
  * `ProductVariantRepository`: Tra cứu biến thể theo mã SKU hoặc Product ID.
  * `CategoryRepository`: Tra cứu danh mục phân cấp cha - con.
  * `InboundBatchRepository`: Truy vấn các lô hàng còn tồn theo SKU sắp xếp tăng dần theo ngày nhập để xuất kho FIFO.
  * `InboundOrderRepository`: Lưu trữ lịch sử các phiếu nhập từ nhà cung cấp.
  * `OrderRepository`: Thống kê doanh thu, truy vấn danh sách đơn theo trạng thái.
  * `ReturnRequestRepository`: Quản lý các yêu cầu đổi trả và hoàn tiền.

### 2.5. Model Package (Thực thể CSDL & DTOs)
* **Vị trí**: `backend/src/main/java/com/example/myapp/entity/` và `model/`
* **Các thực thể Entity chính**:
  * `User`: Lưu thông tin tài khoản, họ tên, email, mật khẩu băm BCrypt, vai trò (`admin`, `staff`, `customer`).
  * `Product`: Thông tin sản phẩm thời trang, giá niêm yết cơ sở, mô tả.
  * `ProductVariant`: Biến thể SKU chi tiết (Size, Màu sắc, Tồn kho khả dụng `stockQuantity`).
  * `ProductImage`: Danh sách ảnh sản phẩm (đánh dấu ảnh đại diện `isPrimary`).
  * `Category`: Danh mục phân loại theo giới tính và mùa thời trang.
  * `Order` & `OrderItem`: Đơn đặt hàng và chi tiết từng dòng mặt hàng trong đơn.
  * `InboundOrder` & `InboundBatch`: Phiếu nhập kho và chi tiết từng lô hàng FIFO gắn liền với đơn giá vốn và ngày nhập.
  * `ReturnRequest`: Phiếu yêu cầu đổi trả, lý do, số tiền hoàn và thông tin tài khoản ngân hàng.
  * `Payment`: Ghi nhận phương thức thanh toán (COD hoặc PayOS) và trạng thái giao dịch (`PAID`, `UNPAID`, `REFUNDED`).
  * `DiscountCode`: Mã giảm giá, điều kiện giá trị đơn tối thiểu và thời hạn áp dụng.

### 2.6. Database (Cơ sở dữ liệu)
* Sử dụng hệ quản trị CSDL quan hệ **MySQL** hoặc **Microsoft SQL Server**, quản lý cấu trúc bảng và khóa ngoại ràng buộc thông qua Hibernate ORM.

### 2.7. External Systems (Hạ tầng dịch vụ tích hợp bên ngoài)
* **PayOS Payment Gateway**: Cổng thanh toán trực tuyến VietQR chuẩn NAPAS 247, tự động gửi Webhook khi khách chuyển khoản thành công.
* **Gmail SMTP Service**: Dịch vụ máy chủ gửi email hóa đơn và thông báo trạng thái đơn hàng.
* **Cloudinary Storage**: Dịch vụ CDN lưu trữ và tối ưu hóa hình ảnh tải lên.
* **Google Identity (OAuth2)**: Dịch vụ xác thực danh tính nhanh bằng tài khoản Google.
