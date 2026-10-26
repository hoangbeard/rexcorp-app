# Sổ ngoại lệ bảo mật: `rexcorp-app`

Sổ ghi mọi quyết định chấp nhận rủi ro có thời hạn của repo này. Quy định đầy đủ nằm trong [`SECURITY-GATE.md`](../SECURITY-GATE.md), mục "Ngoại lệ". Kiểm tra bằng `scripts/check-exceptions.sh` (CI chạy mỗi pull request và mỗi thứ Hai).

## Quy định

| Câu hỏi | Quy định |
|---|---|
| Ngoại lệ dùng khi nào? | Khi một finding mà gate đáng ra chặn chưa sửa kịp trong thời hạn của bậc, hoặc đã xác nhận là báo nhầm, hoặc có bằng chứng viết ra rằng đường khai thác không tồn tại ở cấu hình này. Baseline của repo cũ không phải ngoại lệ |
| Trần thời hạn từ ngày duyệt | P1: 14 ngày. P2: 30 ngày. P3: 90 ngày. P4 và báo nhầm (FP): 6 tháng (tối đa 183 ngày) |
| Ai duyệt | P1 và P2: CTO (người chịu rủi ro kinh doanh). P3: trưởng nhóm phát triển. P4 và FP: người phụ trách bảo mật, hoặc trưởng nhóm phát triển khi chính người phụ trách bảo mật là người xin. Người xin không bao giờ tự duyệt |
| Gia hạn | Mở một dòng mới (mã mới), ghi vì sao lần trước không sửa được; chuyển dòng cũ xuống "Đã đóng". Không sửa ngày của dòng cũ |
| Ai xem lại sổ | Người phụ trách bảo mật, mỗi thứ Hai khi workflow `Exceptions` chạy, và trong buổi triage hằng tuần |

## Đang hiệu lực

| ID | Control | Finding | Bậc | Lý do và biện pháp tạm thời | Người xin | Người duyệt | Ngày duyệt | Hết hạn | Nơi cấu hình | Trạng thái |
|---|---|---|---|---|---|---|---|---|---|---|
| EXC-0001 | Quét secret | SEC-001: API key giả của dịch vụ thông báo trong commit `35eeab4` (Lab 01) | P4 | Key đã thu hồi và cấp key mới (mô phỏng) ngày 2026-10-05, nên không còn rủi ro truy cập. Không viết lại lịch sử vì repo public đã bị clone được (xem `docs/runbooks/leaked-secret.md`). Biện pháp tạm thời: gate Gitleaks vẫn quét mọi commit mới | Kỹ sư DevOps phụ trách bảo mật | CTO | 2026-10-26 | 2027-04-24 | `.gitleaksignore` | Đang hiệu lực |
| EXC-0002 | DAST | Bốn rule ZAP đặt `IGNORE` (10049, 10109, 10111, 10112): thông tin, không phải lỗ hổng | FP | ZAP nhận diện tính năng của ứng dụng (cache của API công khai, request đăng nhập, cơ chế session), không báo lỗi. Đã đọc từng cảnh báo ở Lab 07. Xem lại khi đổi cách xác thực hoặc thêm route cần cache riêng tư | Kỹ sư DevOps phụ trách bảo mật | Trưởng nhóm phát triển | 2026-10-26 | 2027-04-24 | `.zap/rules.tsv` | Đang hiệu lực |
| EXC-0003 | SAST | SAST-003: rule `rexcorp-express-reflected-xss` báo nhầm ở `src/search.js` (dòng `Danh mục: ${category}`) | FP | `category` đã qua kiểm tra với allowlist `CATEGORIES` ngay phía trên (chỉ nhận `hardware` hoặc `service`); taint analysis không hiểu điều kiện đó. Chi tiết ở `docs/sast-triage.md`. Xem lại khi đổi allowlist hoặc đổi cách in `category` | Kỹ sư DevOps phụ trách bảo mật | Trưởng nhóm phát triển | 2026-10-26 | 2027-04-24 | `src/search.js` | Đang hiệu lực |

## Đã đóng

| ID | Control | Finding | Bậc | Lý do và biện pháp tạm thời | Người xin | Người duyệt | Ngày duyệt | Hết hạn | Nơi cấu hình | Trạng thái |
|---|---|---|---|---|---|---|---|---|---|---|
