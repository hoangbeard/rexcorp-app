# Bảng triage SAST của rexcorp-app

Nguồn: lần chạy gate trên pull request "Thêm tính năng tìm kiếm sản phẩm" (Đỗ Quang Huy, `src/search.js`, dòng theo bản vá gốc), Semgrep CE 1.182.0, rule của repo + `p/default`. Báo cáo đầy đủ có 9 finding trên 3 dòng code và 1 dòng regex. Chúng được gom theo **nguyên nhân**, không theo số finding.

| ID | Finding (rule, mức) | Vị trí | Phân tích | Kết luận | Quyết định | Trạng thái |
|---|---|---|---|---|---|---|
| SAST-001 | `rexcorp-express-reflected-xss` (ERROR); cùng dòng: `direct-response-write`, `raw-html-format` (WARNING) | `src/search.js:26` | `q` lấy từ `req.query.q` rồi in thẳng vào `<h1>`. Chứng minh: `curl '/search?q=<script>alert(1)</script>'` trả `<script>` nguyên vẹn với `Content-Type: text/html` | **Đúng (true positive)**, cao: XSS phản xạ (CWE-79) | Sửa code: `escapeHtml(q)` (`src/lib/html.js`); thêm test chặn hồi quy | Đã sửa |
| SAST-002 | `detect-non-literal-regexp` (WARNING) | `src/search.js:11` | `new RegExp(q, 'i')` với `q` của người dùng. Chứng minh: `/api/search?q=(` trả HTTP 500. ReDoS (CWE-1333) khó khai thác vì chỉ so khớp trên tên sản phẩm ngắn, nhưng mẫu này nguy hiểm khi regex chạy trên chuỗi dài | **Đúng**, thấp đến trung bình | Sửa code: tìm theo chuỗi con (`includes`). Đổi hành vi: bỏ tìm kiếm bằng regex; đã báo Product | Đã sửa |
| SAST-003 | `rexcorp-express-reflected-xss` (ERROR) | `src/search.js:27` (`category`) và `:28` (`items`) | Dòng 27: `category` đã qua `CATEGORIES.has(category)` ngay phía trên; taint không hiểu điều kiện. Dòng 28: `items` lấy từ `store.listProducts(...)` (dữ liệu của hệ thống) nhưng dữ liệu bẩn lan qua lời gọi hàm vì tham số lọc là `category` | **Sai (false positive)** ở cả hai dòng | Dòng 28: **sửa rule**: thêm sanitizer `store.listProducts(...)`, kèm ca test `ok` (ca `/g`) và ca đối trọng `ruleid` cho `store.listNotes(...)` (ca `/h`). Dòng 27: **ngoại lệ có hạn** bằng `nosemgrep: rexcorp-express-reflected-xss -- SAST-003 ...` | Đã xử lý |

## Số liệu từ lần chạy này

- Rule `rexcorp-express-reflected-xss`: 3 finding, 1 đúng, 2 sai, tỷ lệ false positive 67% trước khi tinh chỉnh. Mẫu quá nhỏ để rút kết luận; con số này chỉ có ý nghĩa khi theo dõi nhiều tuần. Sau tinh chỉnh: 0 finding trên bản đã sửa, 1 finding bị `nosemgrep` (dòng 27).
- Sau khi sửa, báo cáo đầy đủ còn **5 finding WARNING** của rule registry (`direct-response-write`, `raw-html-format`) tại các dòng đã mã hóa hoặc đã kiểm tra allowlist, vì các rule này không biết `escapeHtml` là sanitizer của RexCorp. Quyết định: giữ ở WARNING (không chặn), không tắt rule vì còn hữu ích ở chỗ khác; xem lại trong báo cáo hằng tuần.

## Ngoại lệ đang mở

| ID | Rule | Vị trí | Lý do | Người chịu trách nhiệm | Hết hạn |
|---|---|---|---|---|---|
| SAST-003 | `rexcorp-express-reflected-xss` | `src/search.js` (dòng `Danh mục: ${category}`) | `category` đã được kiểm tra với allowlist `CATEGORIES` ở ngay phía trên; chỉ nhận `hardware` hoặc `service` | Kỹ sư DevOps phụ trách bảo mật | 2027-04-06 |
