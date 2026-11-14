# TRƯỜNG ĐẠI HỌC FPT
## SWP391 PROJECT REPORT
### AI Usage Report (Báo Cáo Sử Dụng Trí Tuệ Nhân Tạo)
**Dự án**: Fashion Store E-Commerce System  
**Sinh viên thực hiện**: Nguyễn Bá Cường  
**Mã số sinh viên (MSSV)**: HE186626  
**Nhóm**: GROUP 5 - SWP391  
**Thời gian thực hiện**: Kỳ Fall 2026 – Hà Nội  

---

## I. Mục Đích Của Báo Cáo
Báo cáo này được lập nhằm minh bạch hóa mức độ ứng dụng AI (Antigravity AI / Claude 3.7 Sonnet / ChatGPT) trong quá trình thực hiện đồ án SWP391 phân hệ **Admin & Staff, Quản lý kho FIFO, Xử lý đơn hàng và Quy trình Trả hàng & Hoàn tiền 3 bước**, đồng thời chứng minh:
1. **Ranh giới đóng góp rõ ràng**: AI đóng vai trò trợ lý tăng tốc lập trình (code generator, refactoring, test case scaffolding); sinh viên đóng vai trò kiến trúc sư nghiệp vụ, người phản biện, kiểm soát logic nghiệp vụ và chất lượng sản phẩm.
2. **Năng lực phản biện & phát hiện lỗi của AI**: Sinh viên trực tiếp phát hiện và sửa các lỗi logic nghiệp vụ nghiêm trọng do AI tạo ra (gộp chung trả hàng với hoàn tiền làm thất thoát hàng hóa, fallback mock data gây trùng lặp khách hàng, lỗi lệch phiên bản bytecode Java 25 vs Java 17).
3. **Mức độ làm chủ mã nguồn**: Sinh viên hiểu sâu sắc kiến trúc hệ thống, luồng dữ liệu đa tầng (Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Database) và có khả năng giải thích, bảo vệ độc lập trước hội đồng chấm thi.

---

## II. Cấu Trúc Báo Cáo

### Phần 0 - Thông Tin Chung

| Mục | Nội dung chi tiết |
| :--- | :--- |
| **Nhóm / Sinh viên** | GROUP 5 - Fashion Store / Nguyễn Bá Cường - MSSV: HE186626 |
| **Công cụ AI đã dùng** | - Antigravity Agentic Assistant (Claude 3.7 Sonnet / Google Gemini Pro Workspace)<br>- GitHub Copilot trong VS Code |
| **Phạm vi báo cáo** | Toàn bộ 4 giai đoạn dự án đối với các module phụ trách: Quản lý người dùng, Danh mục & Sản phẩm, Quản lý kho FIFO, Xử lý đơn hàng, Quy trình Trả hàng & Hoàn tiền 3 bước, Tích hợp Cloudinary & Cổng PayOS. *(Lưu ý: Không bao gồm phần Đánh giá/Review do thành viên khác phụ trách)*. |
| **Hình thức lưu log** | File log hội thoại chi tiết lưu trữ tại workspace: `docs/ai-log.md` kèm commit hash tương ứng trên GitHub (`f778e21`, `c6440c5`, `fd7dbf2`, `ed2e6ab`). |
| **Chiến lược tổng thể** | Duy trì một context làm việc xuyên suốt bằng Antigravity Pair-Programming Workspace; cấp quyền đọc/ghi workspace để AI nắm chắc cấu trúc Entity, DTO và Repository; luôn chạy build kiểm thử thực tế (`mvnw compile`, `npm run build`) sau mỗi phản hồi của AI. |

---

### Phần 1 - Báo Cáo Theo Từng Giai Đoạn

```
Phân loại mức độ tham gia (Contribution Level):
- Mức A: AI tạo, SV giữ nguyên (Chỉ format lại, không sửa nội dung).
- Mức B: AI tạo khung, SV chỉnh sửa đáng kể nội dung nghiệp vụ / kỹ thuật.
- Mức C: SV tự lên ý tưởng / bản thảo trước, AI hỗ trợ hoàn thiện cú pháp, format.
- Mức D: SV tự làm hoàn toàn (Không dùng AI).
```

---

### Giai đoạn 1: Phân tích Yêu cầu (Requirement Analysis)

#### 1.1.1 - Bảng phân công AI ↔ Sinh viên (Contribution Map)
| Artifact / Mục | Mức | Tóm tắt phần SV đã sửa/thêm |
| :--- | :---: | :--- |
| **UCS - Quản lý nhập kho & Lô hàng FIFO** | **B** | AI gợi ý trừ kho đơn giản theo tổng số lượng; SV bắt buộc sửa lại thành kiến trúc quản lý theo từng lô hàng (`InboundBatches`) ưu tiên lô nhập trước (`importDate` sớm nhất) theo nguyên tắc FIFO. |
| **UCS - Quy trình Trả hàng & Hoàn tiền (Return & Refund)** | **B** | AI ban đầu gộp chung duyệt hoàn tiền ngay khi khách yêu cầu; SV phản biện tách rời thành **Quy trình 3 bước**: (1) Shop duyệt yêu cầu $\rightarrow$ (2) Nhận hàng & Nhập lại kho $\rightarrow$ (3) Hoàn tiền (PayOS / COD). |
| **Business Rules - Bảng quy tắc nghiệp vụ (GBR & IBR)** | **C** | SV liệt kê các quy tắc nghiệp vụ cốt lõi của hệ thống (chặn trùng email/SĐT, kiểm tra tồn kho FIFO, điều kiện hoàn tiền COD); AI hỗ trợ chuẩn hóa sang cấu trúc bảng SRS tiếng Anh/tiếng Việt. |

#### 1.1.2 - Ví dụ Prompt Tiêu Biểu
* **Prompt đã dùng (Nguyên văn)**:
  > *"Tách việc hoàn hàng và hoàn tiền làm 2 bước khác nhau. Vì khi yêu cầu hoàn hàng, shop phải đồng ý, tiếp đó shop nhận hàng hoàn - kiểm tra hàng thì mới tới hoàn tiền. Ở bước 1 và bước 2 không cần hiển thị thông tin ngân hàng, vì đến bước hoàn tiền mới cần đến nó."*
* **Output AI trả về (Rút gọn)**:
  > *"Đã hiểu nghiệp vụ: Cập nhật quy trình hoàn hàng thành 3 trạng thái phân tách: `return_approved` (Đồng ý trả hàng) -> `goods_received` (Đã nhận hàng và nhập kho) -> `COMPLETED` (Đã hoàn tiền). Điều chỉnh giao diện ẩn khối thông tin ngân hàng ở Bước 1 và Bước 2, chỉ kích hoạt hiển thị ở Bước 3..."*
* **Nhận xét**: AI ban đầu chỉ tư duy theo luồng thanh toán điện tử cơ bản (hoàn tiền là xong). Sau khi được sinh viên chỉnh lại theo thực tế vận hành shop thời trang (phải nhận lại áo quần, kiểm tra tem mác/lỗi rồi mới hoàn tiền), AI đã phân tách chính xác state-machine.

#### 1.1.3 - Thay Đổi So Với Output AI & Lý Do
* **Đã thay đổi**: Loại bỏ luồng "Hoàn tiền ngay khi duyệt yêu cầu"; bổ sung trạng thái trung gian `goods_received` và hành động tự động hoàn kho `stockQuantity += quantity` vào đúng thời điểm nhận hàng vật lý.
* **Lý do**: AI đúng về lý thuyết thanh toán API nhưng **sai lệch thực tế kinh doanh thời trang (domain mismatch)**. Nếu hoàn tiền ngay khi duyệt trên web, shop sẽ chịu rủi ro mất trắng tiền nếu khách không gửi trả hàng hoặc gửi hàng rách/hàng giả.

#### 1.1.4 - Vấn Đề / Sai Sót Của AI Đã Phát Hiện
| Tình huống | AI đã làm/đề xuất gì | Vì sao sai/ko phù hợp | Nhóm đã làm gì |
| :--- | :--- | :--- | :--- |
| **Xác thực hoàn tiền đơn COD** | AI yêu cầu phải có `TransactionId` từ PayOS thì mới cho hoàn tiền. | Đơn COD là thanh toán tiền mặt lúc nhận hàng, không có transaction ID cổng trực tuyến mà hoàn bằng chuyển khoản ngân hàng thủ công. | Bắt buộc nhập thông tin ngân hàng của khách (Số TK, Tên NH, Chủ TK) và hiển thị nút "Sao chép" để nhân viên chuyển tiền. |

#### 1.1.5 - Tự Đánh Giá Hiểu Bài (Self-Check)
* **Câu hỏi: Vì sao thông tin ngân hàng nhận tiền hoàn của khách chỉ được hiển thị ở Bước 3 mà phải ẩn ở Bước 1 và Bước 2?**
  * *Trả lời của sinh viên*: Ở Bước 1 (Duyệt lý do) và Bước 2 (Kiểm tra hàng thực tế tại kho), nhân viên kho chỉ cần tập trung vào ảnh chụp bằng chứng lỗi và tình trạng kiện hàng hoàn về. Hiển thị thông tin tài khoản ngân hàng quá sớm gây rối mắt (cluttered UI), phân tán sự chú ý của nhân viên và tiềm ẩn rủi ro nhân viên chuyển nhầm tiền cho khách trước khi kiện hàng thực sự được nhập kho. Chỉ khi hàng đã vào kho an toàn, bước thanh toán tài chính (Bước 3) mới cần mở ra để thủ quỹ thực hiện lệnh chuyển khoản.

---

### Giai đoạn 2: Thiết Kế (Design - Architecture & Database)

#### 1.2.1 - Bảng phân công AI ↔ Sinh viên (Contribution Map)
| Artifact / Mục | Mức | Tóm tắt phần SV đã sửa/thêm |
| :--- | :---: | :--- |
| **Entity Design - `ReturnRequest.java`** | **B** | SV chỉ định bổ sung các trường: `EvidenceImages` (lưu mảng ảnh Cloudinary), `ReceiptImage`, `TransactionRef` và mở rộng `AdminNote` từ `VARCHAR(255)` lên `NVARCHAR(MAX)` để chứa log PayOS. |
| **Database Migrations - `V013`, `V014`, `V015`** | **B** | AI ban đầu tự ý viết lệnh cập nhật CSDL bằng Hibernate `ddl-auto: update` gây mất an toàn dữ liệu; SV yêu cầu tạo các file SQL Migration chuẩn Flyway kiểm tra `IF COL_LENGTH(...) IS NULL`. |
| **Sequence Diagram - Luồng xử lý hoàn hàng 3 bước** | **C** | SV phác thảo các tương tác giữa Customer, Staff, OrderService, InboundService và PayOS; AI hỗ trợ chuyển đổi sang cú pháp Mermaid / PlantUML. |

#### 1.2.2 - Ví dụ Prompt Tiêu Biểu
* **Prompt đã dùng (Nguyên văn)**:
  > *"Viết script migration SQL Server để mở rộng bảng ReturnRequests: thêm EvidenceImages dạng NVARCHAR(MAX), TransactionRef, và sửa CHECK constraint của Status cho phép các trạng thái: pending, approved, rejected, return_approved, goods_received, COMPLETED."*
* **Output AI trả về (Rút gọn)**:
  > Sinh ra các file `V013__add_evidence_receipt_transaction_to_return_requests.sql` và `V014__update_return_request_status_constraint.sql` kèm logic tìm tên constraint động từ `INFORMATION_SCHEMA.CHECK_CONSTRAINTS`.
* **Nhận xét**: AI đã viết mã SQL chuẩn SQL Server, biết cách xử lý lỗi xung đột tên constraint ngẫu nhiên do hệ điều hành tự sinh (`CK__ReturnReq__Statu__...`).

#### 1.2.3 - Thay Đổi So Với Output AI & Lý Do
* **Đã thay đổi**: Yêu cầu AI không được xóa cột cũ hoặc sửa trực tiếp trong file gốc mà phải chia thành các migration tăng dần (`V013`, `V014`, `V015`).
* **Lý do**: Đảm bảo tính toàn vẹn khi các thành viên khác trong nhóm (Huy, Trung) pull code về máy không bị lỗi xung đột CSDL cục bộ.

#### 1.2.4 - Vấn Đề / Sai Sót Của AI Đã Phát Hiện
| Tình huống | AI đã làm/đề xuất gì | Vì sao sai/ko phù hợp | Nhóm đã làm gì |
| :--- | :--- | :--- | :--- |
| **Cấu hình HikariCP** | AI để mặc định cấu hình kết nối JDBC không có timeout và pool size tối thiểu. | Khi thực hiện các câu truy vấn phức tạp, connection pool bị cạn kiệt (`HikariPool-1 request timed out after 30011ms`). | SV yêu cầu cấu hình rõ `maximum-pool-size: 15`, `minimum-idle: 3`, `connection-test-query: SELECT 1` và thêm `socketTimeout=30000;loginTimeout=15;` vào URL. |

#### 1.2.5 - Tự Đánh Giá Hiểu Bài (Self-Check)
* **Câu hỏi: Vì sao bảng `InboundBatches` phải tách rời khỏi bảng `InboundOrders` và có quan hệ 1-N?**
  * *Trả lời của sinh viên*: Một đơn nhập hàng (`InboundOrders`) từ nhà cung cấp thường chứa nhiều mặt hàng thời trang khác nhau với các biến thể SKU riêng biệt (áo sơ mi trắng size M, áo sơ mi đen size L). Mỗi mặt hàng cần được quản lý thành một lô riêng (`InboundBatches`) với số lượng nhập ban đầu (`initialQuantity`), số lượng còn lại chưa bán hết (`remainingQuantity`), và đơn giá vốn riêng để thuật toán FIFO có thể trừ lùi chính xác từng lô khi khách mua hàng.

---

### Giai đoạn 3: Triển Khai (Implementation / Coding)

#### 1.3.1 - Bảng phân công AI ↔ Sinh viên (Contribution Map)
| Artifact / Mục | Mức | Tóm tắt phần SV đã sửa/thêm |
| :--- | :---: | :--- |
| **`StaffOrderService.java` - Xử lý 3 bước hoàn hàng** | **B** | SV thiết kế logic nghiệp vụ 3 hàm: `acceptReturnRequest`, `receiveReturnedGoods`, `completeReturnRefund`; AI hỗ trợ viết cú pháp Java Stream và gán dữ liệu DTO. |
| **`ManageUsers.jsx` - Form quản lý khách hàng** | **B** | **Phát hiện lỗi AI**: AI viết code giả lập (`mock offline fallback`) tự động sinh ID `#CUST-22` khi API báo trùng; SV đã xóa hoàn toàn đoạn mock, bổ sung validation chặn thêm trùng lặp email/SĐT phía client và server. |
| **`backend/pom.xml` - Khóa phiên bản Java 17** | **B** | **Phát hiện lỗi AI**: Trình biên dịch sinh mã bytecode Java 25 (`class version 69.0`) gây sập hệ thống khi chạy trên Java 17 (`version 61.0`); SV chỉ đạo bổ sung `<release>17</release>` vào `maven-compiler-plugin`. |
| **`application.yml` - Bảo vệ mật khẩu DB nhóm** | **B** | AI tự động đổi mật khẩu dự phòng sang `123456` làm gãy môi trường của bạn khác (`Huy`); SV đã chỉnh lại fallback thành `sa` và sử dụng file `.env` cục bộ an toàn. |

#### 1.3.2 - Ví dụ Prompt Tiêu Biểu
* **Prompt đã dùng (Nguyên văn)**:
  > *"Hiện tại khi thêm khách hàng nếu trùng việc thêm khách hàng đã tồn tại số điện thoại và gmail nó chỉ báo là đã tồn tại chứ vẫn cho phép thêm. tôi không muốn được phép thêm như vậy"*
* **Output AI trả về (Rút gọn)**:
  > Phát hiện trong khối `catch` của hàm `handleSaveUser` trong file `ManageUsers.jsx` có đoạn code fallback tự sinh ID `users.length + 1` và đẩy vào state. AI đã tiến hành gỡ bỏ fallback, giữ nguyên modal mở và hiển thị alert banner báo lỗi màu đỏ.
* **Nhận xét**: Đây là minh chứng rõ nét về việc AI tự ý tạo code giả lập (mocking) để giao diện "chạy được" một cách thiếu thực tế. Sinh viên đã phát hiện và yêu cầu triệt tiêu hành vi này.

#### 1.3.3 - Thay Đổi So Với Output AI & Lý Do
1. **Lỗi Mock Fallback trong `ManageUsers.jsx`**:
   * *Đã thay đổi*: Xóa bỏ đoạn code tự tạo bản ghi giả lập trong `catch (err)`.
   * *Lý do*: Vi phạm quy tắc toàn vẹn dữ liệu (Data Integrity). Người dùng đã bị trùng email/SĐT trong CSDL thì dứt khoát không được xuất hiện trên bảng danh sách.
2. **Khóa cứng version biên dịch trong `pom.xml`**:
   * *Đã thay đổi*: Bổ sung cấu hình `<release>17</release>` vào `maven-compiler-plugin`.
   * *Lý do*: Ngăn ngừa triệt để lỗi xung đột bytecode Java Runtime (`UnsupportedClassVersionError: class file version 69.0 vs 61.0`).

#### 1.3.4 - Vấn Đề / Sai Sót Của AI Đã Phát Hiện
| Tình huống | AI đã làm/đề xuất gì | Vì sao sai/ko phù hợp | Nhóm đã làm gì |
| :--- | :--- | :--- | :--- |
| **Lệch phiên bản Java Runtime (`UnsupportedClassVersionError`)** | AI sử dụng plugin Maven không chỉ định thẻ `<release>`, khiến máy dùng JDK 25 biên dịch file `.class` version 69.0. | Server Spring Boot chạy với Java 17 runtime chỉ đọc được class version tối đa 61.0, gây sập API xem chi tiết đơn hàng `#ORD-1037`. | Bổ sung `<release>17</release>` vào `pom.xml`, xóa sạch `target/classes` và dùng script Node.js kiểm tra 100% file `.class` đạt version 61.0. |
| **Gán nhầm Use Case và Description** | AI làm lệch dòng từ dòng 13 đến dòng 17 trong bảng danh mục chức năng (gắn nhầm mô tả tối ưu web vào chức năng hoàn hàng). | Làm sai lệch bản chất công việc, dẫn đến việc báo cáo không khớp với chức năng thực tế. | SV đối soát lại từng dòng, loại bỏ các mục không phải Use Case và xếp lại đúng 100%. |

#### 1.3.5 - Tự Đánh Giá Hiểu Bài (Self-Check)
* **Câu hỏi: Trace dòng code thực hiện trừ kho FIFO khi đơn hàng chuyển sang trạng thái PROCESSING?**
  * *Trả lời của sinh viên*: Khi nhân viên bấm duyệt đơn trong `StaffOrderService.java`, phương thức `updateOrderStatus` gọi sang `InboundOrderService.deductStockFIFO(variantId, quantity)`. Tại đây, hệ thống chạy câu truy vấn JPA:
    `SELECT b FROM InboundBatch b WHERE b.Variant.VariantId = :vId AND b.Status = 'ACTIVE' ORDER BY b.ImportDate ASC`
    Sau đó duyệt vòng lặp `while (needed > 0)` để trừ dần `remainingQuantity` của từng lô từ cũ nhất đến mới nhất. Khi một lô có `remainingQuantity = 0`, lô đó được cập nhật `status = 'DEPLETED'`. Toàn bộ quá trình nằm trong `@Transactional` để đảm bảo nếu một sản phẩm thiếu hàng thì toàn bộ đơn hàng được rollback, không trừ dở dang.

---

### Giai đoạn 4: Kiểm Thử (Testing - Integration & System Test)

#### 1.4.1 - Bảng phân công AI ↔ Sinh viên (Contribution Map)
| Artifact / Mục | Mức | Tóm tắt phần SV đã sửa/thêm |
| :--- | :---: | :--- |
| **Integration Test Report (`GROUP5_Integration-Test_v1.0`)** | **B** | SV chỉ định toàn bộ kịch bản kiểm thử tích hợp: Trả hàng 3 bước, Nhập kho FIFO, Xử lý đơn hàng và Quản lý người dùng; AI hỗ trợ dựng khung bảng thống kê và ma trận bảo mật. |
| **System Test Report (`FS_STR_v1.0`)** | **B** | **SV phản biện & điều chỉnh**: AI ban đầu đưa các thông số API (`POST /api/...`, HTTP status code) vào báo cáo; SV yêu cầu chuyển hoàn toàn sang kiểm thử thủ công người dùng cuối dạng **Step-by-step (1. 2. 3. 4.)**. |
| **Bộ dữ liệu kiểm thử (Test Data)** | **C** | SV cung cấp các đơn hàng test thực tế (#1033, #1037), số điện thoại trùng (`0966666666`) để thực hiện kiểm thử hộp đen. |

#### 1.4.2 - Ví dụ Prompt Tiêu Biểu
* **Prompt đã dùng (Nguyên văn)**:
  > *"Chỉ cần làm step by step không làm api. Tương tự làm mẫu này theo SYSTEM TEST REPORT DOCUMENT."*
* **Output AI trả về (Rút gọn)**:
  > Chuyển đổi toàn bộ kịch bản sang định dạng thao tác chuột/bàn phím người dùng:  
  > *1. Customer logs in successfully -> 2. Go to Order History -> 3. Click Return Request -> 4. Upload photo -> 5. Confirm.*
* **Nhận xét**: AI có xu hướng mặc định viết test case cho lập trình viên (chú trọng JSON payload và HTTP status). Sau khi sinh viên nhắc nhở về mục tiêu kiểm thử hệ thống (System Testing từ góc nhìn End-User), kết quả đã đạt chuẩn yêu cầu học thuật.

#### 1.4.3 - Thay Đổi So Với Output AI & Lý Do
* **Đã thay đổi**: Loại bỏ toàn bộ các thuật ngữ kỹ thuật như `@RequestBody`, `Bearer Token`, `JSON Response`, thay thế bằng các thông điệp người dùng nhìn thấy trên màn hình: *"Hiển thị thông báo màu đỏ", "Popup giữ nguyên thông tin", "Số lượng tồn kho cộng lại"*.
* **Lý do**: Kiểm thử hệ thống (System Test) là bài test chấp nhận người dùng (User Acceptance / Black-box testing), phải phản ánh đúng trải nghiệm của khách hàng và nhân viên trên trình duyệt.

#### 1.4.4 - Vấn Đề / Sai Sót Của AI Đã Phát Hiện
| Tình huống | AI đã làm/đề xuất gì | Vì sao sai/ko phù hợp | Nhóm đã làm gì |
| :--- | :--- | :--- | :--- |
| **Nhận diện phạm vi cá nhân** | AI tự động đưa module "Đánh giá & Nhận xét sản phẩm" vào danh mục Use Case cá nhân của Cường. | Module này là do thành viên khác trong nhóm phụ trách, không thuộc phạm vi chấm điểm của sinh viên Cường. | SV kịp thời phát hiện và yêu cầu AI loại bỏ hoàn toàn module Review ra khỏi bảng Use Case cá nhân. |

#### 1.4.5 - Tự Đánh Giá Hiểu Bài (Self-Check)
* **Câu hỏi: Giải thích vì sao Test Case `TC-CUST-02` (Thêm khách hàng trùng email/SĐT) được đánh giá là PASSED khi popup vẫn giữ nguyên mở mà không đóng lại?**
  * *Trả lời của sinh viên*: Khi người dùng nhập sai hoặc trùng lặp thông tin, quy tắc UX chuẩn là hệ thống phải giữ nguyên cửa sổ nhập liệu và giữ lại các trường dữ liệu người dùng đã điền (họ tên, mật khẩu, địa chỉ) kèm thông báo lỗi cụ thể để người dùng chỉ việc sửa lại trường bị sai (email hoặc SĐT). Nếu popup đóng lại hoặc reset trắng form, người dùng sẽ phải gõ lại từ đầu, gây ức chế và vi phạm tiêu chuẩn thiết kế trải nghiệm người dùng.

---

### Phần 2 - Số Liệu Tổng Hợp (Quantitative Summary)

#### Bảng tổng hợp mức độ tham gia theo giai đoạn:

| Giai đoạn | Số artifact chính | Mức A (AI tạo, giữ nguyên) | Mức B (AI tạo khung, SV sửa) | Mức C (SV tạo, AI hỗ trợ) | Mức D (SV tự làm) | Số vòng lặp prompt TB / artifact |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Phân tích Yêu cầu** | 3 | 0 | 2 | 1 | 0 | 4 vòng |
| **2. Thiết kế** | 3 | 0 | 2 | 1 | 0 | 5 vòng |
| **3. Triển khai (Code)** | 4 | 0 | 4 | 0 | 0 | 6 vòng |
| **4. Kiểm thử** | 3 | 0 | 2 | 1 | 0 | 3 vòng |
| **Tổng cộng** | **13** | **0 (0%)** | **10 (76.9%)** | **3 (23.1%)** | **0 (0%)** | **~4.5 vòng/artifact** |

> **Nhận xét số liệu**: Tỉ lệ **Mức B chiếm ưu thế (76.9%)** phản ánh rõ ràng sinh viên không phó mặc hoàn toàn cho AI (Mức A = 0%). Mọi dòng code, cấu hình pom, migration SQL và test case sinh ra từ AI đều phải trải qua quá trình phản biện, sửa lỗi và tinh chỉnh theo đặc thù đề tài.

#### Checklist Traceability Đã Hoàn Thành:

| Giai đoạn | Số mục checklist đạt / tổng | Mục chưa đạt (nếu có) + kế hoạch xử lý |
| :---: | :---: | :--- |
| **Giai đoạn 1 (SRS)** | **6 / 6** | Đã hoàn tất 100% UCS, Business Rules, Wireframe mapping. |
| **Giai đoạn 2 (SDS)** | **6 / 6** | Đã hoàn tất ERD, Sequence Diagram, Database Migrations. |
| **Giai đoạn 3 (Code)** | **6 / 6** | Đã compile thành công (`BUILD SUCCESS`), kiểm tra bytecode Java 17, đồng bộ nhánh `main`. |
| **Giai đoạn 4 (Test)** | **6 / 6** | Đã hoàn thành bảng System Test Report và Integration Test Report dạng Step-by-step. |

---

### Phần 3 - Phản Tư (Reflection)

#### 1. Việc nào AI làm tốt hơn nhóm tự làm? Vì sao?
AI thực hiện cực kỳ xuất sắc các công việc mang tính chất khuôn mẫu (boilerplate code), tra cứu cú pháp và sinh các đoạn mã kiểm thử lặp đi lặp lại. Cụ thể:
- Tự động sinh mã tích Descartes cho ma trận biến thể thời trang (Sizes $\times$ Colors $\rightarrow$ SKUs).
- Viết các câu lệnh SQL Migration với cấu trúc kiểm tra điều kiện an toàn (`IF COL_LENGTH(...) IS NULL`).
- Định dạng nhanh chóng các bảng báo cáo học thuật bằng Markdown / HTML theo đúng cấu trúc tiêu chuẩn mà không tốn thời gian căn chỉnh thủ công.

#### 2. Việc nào nhóm làm tốt hơn AI / AI không thể làm tốt? Vì sao?
Sinh viên vượt trội hoàn toàn so với AI ở **khả năng thấu hiểu nghiệp vụ thực tế (Domain Knowledge)** và **tính logic nhất quán của hệ thống**:
- AI không hiểu được rằng trong kinh doanh thời trang thực tế, không bao giờ được phép hoàn tiền trước khi nhận lại kiện hàng từ tay shipper. Sinh viên phải trực tiếp thiết kế luồng 3 bước để bảo vệ tài chính cho cửa hàng.
- AI có xu hướng "chữa cháy" cho code chạy được bằng cách chèn mock data hoặc nuốt lỗi (silent catch), trong khi sinh viên hiểu rằng điều đó phá hủy tính toàn vẹn của cơ sở dữ liệu.

#### 3. Rủi ro lớn nhất nếu KHÔNG review kỹ output của AI trong project này là gì? Cho 1 ví dụ cụ thể đã/suýt xảy ra.
- **Rủi ro lớn nhất**: Hệ thống gặp lỗi sập ngầm (runtime crash) trong môi trường production hoặc tạo ra các lỗ hổng logic nghiệp vụ nghiêm trọng.
- **Ví dụ thực tế đã xảy ra trong dự án**:
  1. *Lỗi Bytecode Java 25*: AI biên dịch file class thành version 69.0 trong khi runtime của server là Java 17 (version 61.0). Nếu sinh viên không soi xét chi tiết lỗi `UnsupportedClassVersionError` mà chỉ khởi động lại máy móc thì tính năng xem đơn hàng hoàn toàn bị tê liệt.
  2. *Lỗi Mock Offline trong Quản lý khách hàng*: Khi thêm khách hàng bị trùng SĐT, AI viết fallback tự tạo bản ghi `#CUST-22` vào giao diện. Nếu không kiểm tra CSDL thực tế, nhóm sẽ mang một phần mềm có dữ liệu "ảo" đi báo cáo trước hội đồng.

#### 4. Nếu làm lại từ đầu, nhóm sẽ thay đổi gì trong cách dùng AI?
- **Khóa chặt ràng buộc kỹ thuật ngay từ prompt đầu tiên**: Quy định rõ phiên bản môi trường (Java 17, React 18, SQL Server), cấm tuyệt đối việc sử dụng code mock/fake data trong khối `catch`.
- **Phân tách phiên làm việc theo từng module độc lập**: Tránh dồn toàn bộ nghiệp vụ vào một phiên chat quá dài để không gặp tình trạng AI bị "ảo giác" (hallucination) hoặc tráo đổi nhầm mô tả giữa các chức năng.
- **Yêu cầu AI giải thích luồng nghiệp vụ trước khi sinh code**: Thay vì yêu cầu AI viết code ngay, sẽ yêu cầu AI tóm tắt các bước nghiệp vụ (state-machine) để sinh viên duyệt trước, tránh việc phải sửa đi sửa lại nhiều lần.

---

### Phụ Lục - AI Conversation Log

* **Kho lưu trữ mã nguồn**: [https://github.com/Huydqhe186273/FashionStoreNew](https://github.com/Huydqhe186273/FashionStoreNew)
* **Các commit hash tiêu biểu ghi nhận quá trình tương tác và sửa lỗi AI**:
  - `f778e21`: *feat: quy trinh tra hang 3 buoc, hoan tien COD, toi uu review & sua form khach hang* (Gỡ bỏ mock fallback, phân tách 3 bước hoàn hàng).
  - `fd7dbf2`: *build: lock maven-compiler-plugin release target to Java 17* (Khắc phục lỗi class version 69 vs 61 do AI biên dịch ngầm).
  - `c6440c5`: *merge: integrate return request migrations V013-V015 and update application.yml* (Gộp các migration SQL an toàn).
* **Trích xuất nhật ký prompt chính theo timeline**: Lưu chi tiết tại file `docs/ai-log.md` trong thư mục dự án.

