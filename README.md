# Fashion Store Project (SWP)

Dự án Hệ thống bán quần áo trực tuyến tích hợp AI cá nhân hóa.

## Cấu trúc thư mục
- `/backend`: Mã nguồn Spring Boot (Java).
- `/frontend`: Mã nguồn giao diện (HTML, CSS, JS).
- `/database`: Chứa script tạo Database SQL Server.

## Yêu cầu môi trường cài đặt (Prerequisites)
Để code và chạy được dự án này trên máy, mỗi thành viên cần cài đặt:
1. **Java 17 (JDK 17)**: Dùng để chạy Spring Boot.
2. **Microsoft SQL Server & SSMS**: Để chạy Database nội bộ trên máy cá nhân.
3. **Visual Studio Code (VS Code)**.

### Các Extension bắt buộc phải cài trong VS Code:
- **Extension Pack for Java** (của Microsoft)
- **Spring Boot Extension Pack** (của VMware)

---

## Hướng dẫn Setup môi trường cho Team (VS Code)

### Bước 1: Clone dự án về máy
Mở Terminal / Git Bash và chạy:
```bash
git clone https://github.com/Huydqhe186273/FashionStoreNew.git
```
Sau đó mở thư mục `FashionStoreNew` bằng VS Code. 

**(💡 MẸO QUAN TRỌNG CHO BACKEND)**: Vì project Java nằm trong thư mục `backend`, để extension của VS Code nhận diện được các thư viện Maven mà không bị báo lỗi đỏ, bạn **nên mở riêng thư mục `backend`** thành một Workspace (File -> Open Folder -> Chọn thư mục `backend`).

### Bước 2: Khởi tạo Database trên máy cá nhân
1. Mở **SQL Server Management Studio (SSMS)** và đăng nhập bằng tài khoản (thường là `sa`).
2. Trong dự án, mở file **`database/DB`** (bạn có thể mở bằng Notepad/VS Code, copy toàn bộ nội dung, dán vào New Query trong SSMS).
3. Ấn **Execute** (hoặc F5) để chạy lệnh. Code sẽ tự động tạo Database tên là `FashionStoreDB`, tạo tất cả các bảng và chèn sẵn dữ liệu mẫu.

### Bước 3: Cấu hình kết nối Backend - Database
1. Trong VS Code, mở file: `backend/src/main/resources/application.yml`
2. Kiểm tra dòng `url: jdbc:sqlserver://localhost;instanceName=...`. Nếu tên instance SQL Server trên máy bạn không phải là `MSSQLSERVER01`, hãy sửa lại cho đúng (hoặc xoá đoạn `;instanceName=MSSQLSERVER01` nếu bạn cài đặt mặc định).
3. Sửa `username` và `password` cho đúng với mật khẩu máy bạn:
   ```yaml
   username: sa
   password: <mật_khẩu_của_bạn_ở_đây>
   ```
*(Lưu ý: Không commit file application.yml lên git nếu bạn đã điền mật khẩu thật của mình).*

### Bước 4: Chạy và kiểm tra dự án Backend
- Đảm bảo bạn đang mở thư mục `backend` bằng VS Code. Chờ một lát để VS Code tải các thư viện Maven xong.
- Tìm đến file `backend/src/main/java/com/example/myapp/MyAppApplication.java`.
- Bấm chữ **Run** màu nhỏ xíu hiện ở ngay phía trên hàm `main()`, hoặc nút Play ở góc trên cùng bên phải.
- **✅ KIỂM TRA 1 (Kết nối Database):** Nhìn xuống cửa sổ Terminal/Console ở dưới. Nếu cấu hình đúng, bạn sẽ thấy một khung thông báo nổi bật: 
  **"✅ KẾT NỐI DATABASE THÀNH CÔNG VÀ ỨNG DỤNG ĐÃ CHẠY LÊN!"**
- **✅ KIỂM TRA 2 (Chạy Ứng dụng):** Mở trình duyệt gõ: `http://localhost:8080/api/hello`. Nếu hiện chữ Xin chào là thành công!

---
**Quy trình làm việc nhóm (Git Workflow)**
1. Không code thẳng lên nhánh `main`.
2. Mỗi người khi làm tính năng mới hãy tạo nhánh riêng: `git checkout -b ten_tinh_nang`
3. Code xong thì `git push origin ten_tinh_nang` và tạo Pull Request.