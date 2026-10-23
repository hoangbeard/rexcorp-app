# Backlog bảo mật của rexcorp-app

Danh sách việc bảo mật đã biết nhưng chưa xử lý xong. Mỗi mục có người phụ trách và hạn. Đóng mục nào thì ghi ngày đóng và bằng chứng.

| ID | Mô tả | Mức độ | Người phụ trách | Hạn | Trạng thái |
|---|---|---|---|---|---|
| SEC-001 | Commit "Thêm cấu hình dịch vụ thông báo" ghi thẳng API key của dịch vụ thông báo vào `src/config.js`. Commit sau đã đổi sang biến môi trường `NOTIFY_API_KEY`, nhưng key vẫn nằm trong lịch sử git. CI vẫn xanh: pipeline chưa có control nào phát hiện secret | Cao | Kỹ sư DevOps phụ trách bảo mật | Module 02 | Đóng 2026-10-05. Key đã thu hồi (mô phỏng), không viết lại lịch sử, ngoại lệ trong `.gitleaksignore` hết hạn 2027-04-05. Bằng chứng: nhật ký trong `docs/runbooks/leaked-secret.md`; gate `secret-scan` trong CI (ADR-0002) |
| SEC-002 | Job `secret-scan` chưa phải required status check của `main`: pull request có job đỏ vẫn merge được nếu người merge bỏ qua | Trung bình | Kỹ sư DevOps phụ trách bảo mật | Module 08 | Mở |
| SEC-003 | Đăng nhập: ứng dụng chưa xác thực ai. Mọi route trừ `/healthz` phải yêu cầu quyền (REQ-01, `v5.0.0-8.2.1`); đăng nhập phải chống nhồi mật khẩu (REQ-03, `v5.0.0-6.3.1`, tài liệu `6.1.1`). Threat T-01, T-02, T-11 | Cao | Kỹ sư DevOps phụ trách bảo mật cùng đội `rexcorp-app` | Trước khi merge tính năng đăng nhập | Mở. `scripts/verify-requirements.sh` báo GAP cho REQ-01 |
| SEC-004 | Không giới hạn tốc độ và số ghi chú; `compose.yaml` không đặt giới hạn bộ nhớ (T-06). ASVS `2.4.1` là L2 nên chưa là requirement | Trung bình | Kỹ sư DevOps phụ trách bảo mật | Trước khi expose ra mạng | Mở |
| SEC-005 | Ghi chú lưu và phát lại HTML nguyên văn (T-04). Mã hóa đầu ra khi có frontend (`v5.0.0-1.2.1`) | Trung bình | Đội `rexcorp-app` | Khi có frontend | Mở |
| SEC-006 | Không có log về ai ghi gì (T-05); ASVS `16.3.1` là L2. Làm cùng đăng nhập | Thấp | Đội `rexcorp-app` | Cùng SEC-003 | Mở |
| SEC-007 | Điều kiện merge tính năng tải file: test tích hợp cho REQ-02, REQ-05, REQ-06; thêm requirement `5.2.2` và `5.3.1` (T-15); cập nhật DFD-2 theo thiết kế thật | Cao | Kỹ sư DevOps phụ trách bảo mật cùng Product | Trước khi merge tính năng tải file | Mở |
| SEC-008 | Chưa quét dependency và chưa có bảng thời hạn được gate hóa (REQ-07, `v5.0.0-15.2.1`, T-10) | Trung bình | Kỹ sư DevOps phụ trách bảo mật | Module 05 | Mở |
