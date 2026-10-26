# Backlog bảo mật của rexcorp-app

Danh sách việc bảo mật đã biết nhưng chưa xử lý xong. Mỗi mục có người phụ trách và hạn. Đóng mục nào thì ghi ngày đóng và bằng chứng.

| ID | Mô tả | Mức độ | Người phụ trách | Hạn | Trạng thái |
|---|---|---|---|---|---|
| SEC-001 | Commit "Thêm cấu hình dịch vụ thông báo" ghi thẳng API key của dịch vụ thông báo vào `src/config.js`. Commit sau đã đổi sang biến môi trường `NOTIFY_API_KEY`, nhưng key vẫn nằm trong lịch sử git. CI vẫn xanh: pipeline chưa có control nào phát hiện secret | Cao | Kỹ sư DevOps phụ trách bảo mật | Module 02 | Đóng 2026-10-05. Key đã thu hồi (mô phỏng), không viết lại lịch sử, ngoại lệ trong `.gitleaksignore` hết hạn 2027-04-05. Bằng chứng: nhật ký trong `docs/runbooks/leaked-secret.md`; gate `secret-scan` trong CI (ADR-0002) |
| SEC-002 | Job `secret-scan` chưa phải required status check của `main`: pull request có job đỏ vẫn merge được nếu người merge bỏ qua | Trung bình | Kỹ sư DevOps phụ trách bảo mật | Module 08 | Mở |
| DAST-001 | Chưa kiểm HSTS (ASVS `v5.0.0-3.4.1`, L1) và cờ `Secure` của cookie (`3.3.1`): baseline chạy qua HTTP nên ZAP không thể thấy. Header HSTS đã có trong mã, chỉ gửi khi request đến qua HTTPS (RFC 6797 §7.2). Khi có staging có TLS: quét lại, chuyển rule 10035 sang `FAIL` | Trung bình | Kỹ sư DevOps phụ trách bảo mật | Trước khi lên production | Mở |
| DAST-002 | `.zap/openapi.yaml` viết tay, có thể lệch khỏi code (route `/api/search`, `/api/summary` của lab sau chưa có trong file). Mỗi pull request đổi route phải cập nhật file; xem xét sinh file từ code | Trung bình | Người viết route | Mỗi pull request đổi route | Mở |
| DAST-003 | Chưa quét có xác thực vì ứng dụng chưa có đăng nhập (SEC-003). Khi có đăng nhập: tạo tài khoản thử, quét trên môi trường tạm, thêm `ZAP_AUTH_HEADER*` | Cao | Kỹ sư DevOps phụ trách bảo mật cùng đội `rexcorp-app` | Cùng SEC-003 | Mở |
| DAST-004 | REQ-08 (`v5.0.0-13.4.1`, không phục vụ `.git`): ZAP baseline thụ động không dò `/.git`. Hiện kiểm bằng `curl` (Lab 07, Bước 7) và `ls` trong image; quét chủ động (rule 41) chỉ trên staging | Thấp | Kỹ sư DevOps phụ trách bảo mật | Khi có staging | Mở |
| DAST-005 | CSP `default-src 'none'` chỉ đúng cho API JSON. Khi có giao diện HTML phải viết CSP riêng (nonce hoặc hash, ASVS `3.4.3`) và cho ZAP spider hiểu giao diện (Client spider) | Trung bình | Đội `rexcorp-app` | Khi có frontend | Mở |
| DAST-006 | Bốn dòng `IGNORE` trong `.zap/rules.tsv` hết hạn xem lại 2027-04-06 | Thấp | Kỹ sư DevOps phụ trách bảo mật | 2027-04-06 | Mở |
| DAST-007 | Cập nhật digest image ZAP mỗi tháng (image `stable` được tạo lại hằng tháng) qua pull request; đọc release note trước khi đổi | Thấp | Kỹ sư DevOps phụ trách bảo mật | Hằng tháng | Mở |
