<!--
Các dòng backlog của Lab 03. Cách dùng: thêm các dòng dưới đây vào bảng trong docs/security-backlog.md
(giữ nguyên SEC-001 và SEC-002 từ Lab 02). Không ghi đè file của lab khác.
-->

| ID | Mô tả | Mức độ | Người phụ trách | Hạn | Trạng thái |
|---|---|---|---|---|---|
| SEC-003 | Đăng nhập: ứng dụng chưa xác thực ai. Mọi route trừ `/healthz` phải yêu cầu quyền (REQ-01, `v5.0.0-8.2.1`); đăng nhập phải chống nhồi mật khẩu (REQ-03, `v5.0.0-6.3.1`, tài liệu `6.1.1`). Threat T-01, T-02, T-11 | Cao | Kỹ sư DevOps phụ trách bảo mật cùng đội `rexcorp-app` | Trước khi merge tính năng đăng nhập | Mở. `scripts/verify-requirements.sh` báo GAP cho REQ-01 |
| SEC-004 | Không giới hạn tốc độ và số ghi chú; `compose.yaml` không đặt giới hạn bộ nhớ (T-06). ASVS `2.4.1` là L2 nên chưa là requirement | Trung bình | Kỹ sư DevOps phụ trách bảo mật | Trước khi expose ra mạng | Mở |
| SEC-005 | Ghi chú lưu và phát lại HTML nguyên văn (T-04). REQ-10 (`v5.0.0-1.2.1`): mã hóa đầu ra khi có route trả HTML; module 04 (SAST) là gate | Trung bình | Đội `rexcorp-app` | Khi có frontend | Mở |
| SEC-006 | Không có log về ai ghi gì (T-05); ASVS `16.3.1` là L2. Làm cùng đăng nhập | Thấp | Đội `rexcorp-app` | Cùng SEC-003 | Mở |
| SEC-007 | Điều kiện merge tính năng tải file: test tích hợp cho REQ-02, REQ-05, REQ-06; thêm requirement `5.2.2` và `5.3.1` (T-15); cập nhật DFD-2 theo thiết kế thật | Cao | Kỹ sư DevOps phụ trách bảo mật cùng Product | Trước khi merge tính năng tải file | Mở |
| SEC-008 | Chưa quét dependency và chưa có bảng thời hạn được gate hóa (REQ-07, `v5.0.0-15.2.1`, T-10) | Trung bình | Kỹ sư DevOps phụ trách bảo mật | Module 05 | Mở |
