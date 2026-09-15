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
Sau đó mở thư mục `FashionStoreNew` (hoặc thư mục chứa code) bằng VS Code.

### Bước 2: Khởi tạo Database trên máy cá nhân
1. Mở **SQL Server Management Studio (SSMS)** và đăng nhập.
2. Chạy file script SQL của nhóm (nếu có trong thư mục `/database`) để tạo bảng và dữ liệu mẫu.
3. Đảm bảo bạn đã có Database tên là `FashionStoreDB`.
4. **Lưu ý quan trọng**: Đảm bảo tài khoản `sa` của SQL Server đã được cấp quyền và bạn nhớ mật khẩu của nó.

### Bước 3: Cấu hình kết nối Backend - Database
1. Trong VS Code, mở file theo đường dẫn: 
   `backend/src/main/resources/application.yml`
2. Tìm đến phần `datasource`.
3. Sửa lại mật khẩu `sa` cho đúng với mật khẩu SQL Server trên máy của bạn:
   ```yaml
   username: sa
   password: <mật_khẩu_của_bạn_ở_đây>
   ```
*(Lưu ý: Không commit file application.yml lên git nếu bạn đã điền mật khẩu thật của mình. Hãy cẩn thận khi dùng lệnh git add).*

### Bước 4: Chạy dự án Backend
- Mở thư mục `backend` trong VS Code.
- Chờ một lát để VS Code tải các thư viện Maven (nhìn góc dưới cùng bên phải sẽ thấy thanh loading).
- Tìm đến file `backend/src/main/java/com/example/myapp/MyAppApplication.java`.
- Bấm chữ **Run** màu nhỏ xíu hiện ở ngay phía trên hàm `main()`, hoặc bấm nút Play ở góc trên cùng bên phải.
- Mở trình duyệt gõ: `http://localhost:8080/api/hello` để kiểm tra. Nếu hiện chữ Xin chào là thành công!

---
**Quy trình làm việc nhóm (Git Workflow)**
1. Không code thẳng lên nhánh `main`.
2. Mỗi người khi làm tính năng mới hãy tạo nhánh riêng: `git checkout -b ten_tinh_nang`
3. Code xong thì `git push origin ten_tinh_nang` và tạo Pull Request.