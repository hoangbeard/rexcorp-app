# Backlog bảo mật: container và cấu hình của rexcorp-app

Việc phát sinh ở Lab 06. Mỗi mục có người phụ trách và hạn. Đóng mục nào thì ghi ngày đóng và bằng chứng. (Chép các dòng này vào `docs/security-backlog.md` của bạn nếu muốn một danh sách duy nhất; file này tách riêng để không đè lên backlog của lab khác.)

| ID | Mô tả | Mức độ | Người phụ trách | Hạn | Trạng thái |
|---|---|---|---|---|---|
| SEC-C01 | KICS báo `Healthcheck Not Set` (MEDIUM) cho `compose.yaml` dù image đã có `HEALTHCHECK`: KICS chỉ đọc file compose, không đọc metadata của image. Không sửa; ghi nhận để người sau không tưởng là bỏ sót | Thấp | Kỹ sư DevOps phụ trách bảo mật | Xem lại ở module 11 | Chấp nhận, ghi chú |
| SEC-C02 | Dependabot cần đề xuất digest mới cho hai `FROM` trong `Dockerfile` (`node` ở giai đoạn `deps`, `distroless` ở giai đoạn cuối). Cần kiểm tra bằng một pull request thật của Dependabot | Trung bình | Kỹ sư DevOps phụ trách bảo mật | Sau khi đẩy lên GitHub | Mở (chưa chạy thử) |
| SEC-C03 | Hai job của `container.yml` chưa là required status check của `main` | Trung bình | Kỹ sư DevOps phụ trách bảo mật | Module 08 | Mở |
| SEC-C04 | Chưa quét image **đang chạy**: chưa có registry hay môi trường triển khai. Lần quét hằng tuần chỉ dựng lại từ source | Trung bình | Kỹ sư DevOps phụ trách bảo mật | Module 10 (khi có image đẩy lên registry) | Mở |
| SEC-C05 | Nhóm chưa có quy trình nhận cảnh báo khi lần chạy theo lịch thứ Hai fail ngoài việc GitHub gửi email cho người tạo workflow | Thấp | Kỹ sư DevOps phụ trách bảo mật | Module 08 (triage) | Mở |
| SEC-C06 | Job `image-scan` chỉ dựng `Dockerfile` ở gốc repo. Nếu pull request thêm service mới có Dockerfile riêng (như `pdf-worker/Dockerfile` trong bản vá của Lab 06), `config-scan` lint được nó nhưng image của service đó **không** được quét lỗ hổng. Cần vòng lặp dựng và quét cho mọi Dockerfile (hoặc ma trận job) trước khi đưa service mới vào `main` | Trung bình | Kỹ sư DevOps phụ trách bảo mật | Trước khi merge bất kỳ service thứ hai nào | Mở |
