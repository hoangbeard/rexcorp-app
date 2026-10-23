# Ma trận truy vết: threat, requirement, kiểm tra, gate

Cập nhật lần cuối: 2026-10-06 (Lab 03). Nguồn: [`threat-model/threat-model.md`](threat-model/threat-model.md) và [`SECURITY-REQUIREMENTS.md`](../SECURITY-REQUIREMENTS.md). Đọc theo hai chiều: từ threat đi xuống để kiểm tra không bỏ sót; từ requirement đi lên để kiểm tra không có requirement trang trí.

## 1. Theo threat (threat → requirement → kiểm tra → gate)

| Threat | Mức | Phản hồi | Requirement | Kiểm tra | Module | Gate | Trạng thái |
|---|---|---|---|---|---|---|---|
| T-01 Mạo danh tác giả ghi chú | High | Mitigate | REQ-01 | Test tích hợp (scripts/verify-requirements.sh, REQ-01) | Lab 03; 08 | Cảnh báo (GAP) hôm nay; chặn khi có đăng nhập | Open |
| T-02 Ghi chú nội bộ đọc được không cần xác thực | High | Mitigate | REQ-01 | Test tích hợp (REQ-01) | Lab 03; 08 | Cảnh báo (GAP) hôm nay; chặn khi có đăng nhập | Open |
| T-03 Đầu vào sai kiểu, sai định dạng, quá lớn | Medium | Mitigate | REQ-04 | Test có sẵn trong test/app.test.js; script REQ-04; SAST | Lab 03; 04 | Chặn: test và script chạy trong CI | Mitigated |
| T-04 Ghi chú chứa HTML hoặc script được lưu và phát lại nguyên văn | Medium | Mitigate | không có | Review khi có giao diện; SAST/DAST hạn chế | chưa có | Chưa áp dụng (SEC-005) | Open |
| T-05 Không có nhật ký về ai ghi gì, lúc nào | Medium | Accept | không có | Không có | chưa có | Chưa áp dụng (SEC-006) | Accepted |
| T-06 Số ghi chú không giới hạn làm đầy bộ nhớ | Medium | Mitigate | không có | Không có (L2: ASVS 2.4.1) | chưa có | Chưa áp dụng (SEC-004) | Open |
| T-07 Siêu dữ liệu nguồn (.git, .env) lọt vào image hoặc được phục vụ | Medium | Mitigate | REQ-08 | curl và ls trong image (REQ-08); DAST | Lab 03; 06; 07 | Chặn: script chạy trong CI | Mitigated |
| T-08 Lưu lượng HTTP không mã hóa nếu triển khai ra ngoài máy dev | Medium | Accept | không có | Không có (hạ tầng triển khai) | khóa 2 | Chấp nhận có ghi lý do | Accepted |
| T-09 Secret nằm trong mã nguồn hoặc lịch sử git | High | Mitigate | REQ-09 | Gitleaks (pre-commit, CI); push protection | 02 | Chặn (job secret-scan, chưa phải required check: SEC-002) | Mitigated |
| T-10 Thư viện bên thứ ba có lỗ hổng hoặc mã độc đi vào image | High | Mitigate | REQ-07 | SCA theo bảng thời hạn | 05; 08 | Chưa áp dụng (SEC-008); chặn từ module 08 | Open |
| T-11 Nhồi thông tin đăng nhập hoặc dò mật khẩu | High | Mitigate | REQ-03 | Test tích hợp giới hạn số lần thử; review tài liệu 6.1.1 | 08 | Chưa áp dụng: điều kiện merge đăng nhập (SEC-003) | Open |
| T-12 Người dùng B truy cập file của người dùng A bằng cách đổi mã file | High | Mitigate | REQ-02 | Test tích hợp hai người dùng | 08 | Chưa áp dụng: điều kiện merge tải file (SEC-007) | Open |
| T-13 Tên file do người dùng gửi dẫn tới ghi ra ngoài thư mục lưu trữ | High | Mitigate | REQ-06 | Test tích hợp tên file xấu; SAST | 04 | Chưa áp dụng: điều kiện merge tải file (SEC-007) | Open |
| T-14 Tải lên file rất lớn làm cạn đĩa hoặc bộ nhớ | Medium | Mitigate | REQ-05 | Test tích hợp file vượt giới hạn | 08 | Chưa áp dụng: điều kiện merge tải file (SEC-007) | Open |
| T-15 File độc hại được lưu rồi phục vụ lại như nội dung tin cậy | High | Mitigate | không có | Test tích hợp loại file; DAST header | 07; 08 | Chưa áp dụng: điều kiện merge tải file (SEC-007) | Open |
| T-16 Lộ cơ sở dữ liệu tài khoản, mật khẩu băm yếu bị dò ngược | High | Mitigate | không có | Không có (chưa chọn requirement) | chưa có | Chưa áp dụng (SEC-003) | Open |
| T-17 Dùng thông tin đăng nhập GitHub bị lộ của nhà phát triển để đẩy mã độc | High | Mitigate | không có | Bảo vệ nhánh, review (ngoài ASVS) | 08; 09 | Chưa áp dụng (SEC-002, module 09) | Open |

## 2. Theo requirement (requirement → threat → module kiểm tra)

| Requirement | ASVS | Level | Threat | Kiểm tra | Module | Gate | Trạng thái |
|---|---|---|---|---|---|---|---|
| REQ-01 | v5.0.0-8.2.1 | L1 | T-01, T-02 | Test tích hợp | Lab 03; 08 | Cảnh báo, rồi chặn | Chưa đạt (SEC-003) |
| REQ-02 | v5.0.0-8.2.2 | L1 | T-12 | Test tích hợp hai người dùng | 08 | Chưa áp dụng, rồi chặn | Chưa áp dụng (SEC-007) |
| REQ-03 | v5.0.0-6.3.1 | L1 | T-11 | Test tích hợp; review tài liệu 6.1.1 | 08 | Chưa áp dụng, rồi chặn | Chưa áp dụng (SEC-003) |
| REQ-04 | v5.0.0-2.2.1 | L1 | T-03 | Test có sẵn; script; SAST | Lab 03; 04 | Chặn | Đạt |
| REQ-05 | v5.0.0-5.2.1 | L1 | T-14 | Test tích hợp | 08 | Chưa áp dụng, rồi chặn | Chưa áp dụng (SEC-007) |
| REQ-06 | v5.0.0-5.3.2 | L1 | T-13 | Test tích hợp; SAST | 04 | Chưa áp dụng, rồi chặn | Chưa áp dụng (SEC-007) |
| REQ-07 | v5.0.0-15.2.1 | L1 | T-10 | SCA theo bảng thời hạn | 05; 08 | Kiểm tay, rồi chặn | Chưa kiểm (SEC-008) |
| REQ-08 | v5.0.0-13.4.1 | L1 | T-07 | curl, kiểm image; DAST | Lab 03; 06; 07 | Chặn | Đạt |
| REQ-09 | v5.0.0-13.3.1 | L2 | T-09 | Gitleaks; kiểm tay phần quản lý secret | 02 | Chặn (phần mã nguồn); kiểm tay (phần còn lại) | Một phần |

## 3. Kiểm tra độ phủ của ma trận

| Câu hỏi | Kết quả |
|---|---|
| Threat chọn Mitigate mà không có requirement | T-04, T-06, T-15, T-16, T-17 (xem ADR-0003: requirement bị bỏ và lý do; T-17 nằm ngoài phạm vi ASVS). T-05 và T-08 là Accept, không cần requirement |
| Requirement không có kiểm tra bằng máy | REQ-07 (chờ module 05), phần quản lý secret của REQ-09 (kiểm tay) |
| Kiểm tra không có gate bắt buộc | Chưa có gate nào là required status check (SEC-002, module 08) |
| Requirement kiểm được bằng tool ở module nào | 04: REQ-04, REQ-06 (SAST); 05: REQ-07 (SCA); 07: REQ-08 (DAST); 08: REQ-01, 02, 03, 05 (test tích hợp bắt buộc) |
