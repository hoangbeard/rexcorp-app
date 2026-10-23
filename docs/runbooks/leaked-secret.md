# Runbook: xử lý secret bị lộ

> [!WARNING]
> Bản nháp (pilot), chưa kiểm chứng xong. Nội dung có thể thay đổi.

<!--
Cách dùng mẫu:
1. Chép vào repo, ví dụ docs/runbooks/leaked-secret.md. Điền phần trong <...> cho tổ chức của bạn.
2. Runbook là quy trình, viết TRƯỚC khi có sự cố. Mỗi lần dùng, ghi một dòng vào "Nhật ký áp dụng" ở cuối.
3. Thứ tự các bước là cố ý: thu hồi và xoay vòng TRƯỚC, điều tra SAU, quyết định dọn lịch sử SAU NỮA.
   Ai có secret là có quyền mà secret đó mở ra; mọi phút chờ đều là cơ hội cho kẻ tấn công.
4. Không chép giá trị secret vào runbook, ticket, chat hay log. Chỉ ghi định danh: tên secret, file, commit, fingerprint.
-->

## Khi nào dùng runbook này

<!-- Liệt kê các tín hiệu kích hoạt. Ví dụ: -->

- Gate quét secret (pre-commit, CI) báo finding trên code đã push.
- GitHub secret scanning tạo alert, hoặc push protection bị bypass với lý do "I'll fix it later".
- Ai đó báo đã dán secret vào issue, pull request, log CI hay kênh chat.
- Nhà cung cấp báo secret của bạn xuất hiện ở nơi công khai.

**Mặc định coi mọi secret bị lộ là thật và đã bị lấy**, cho tới khi chứng minh được điều ngược lại.

## Vai trò và liên lạc

<!-- Ai làm gì, liên lạc qua kênh nào. Ghi cả người thay thế khi người chính vắng. -->

| Vai trò | Người | Liên lạc |
|---|---|---|
| Người xử lý sự cố (incident owner) | | |
| Chủ sở hữu secret / hệ thống | | |
| Người phụ trách bảo mật | | |
| Người cần được báo (quản lý, pháp chế, khách hàng…) | | |

## Thời hạn

<!-- Đặt mục tiêu cụ thể, đo được. Ví dụ: thu hồi trong ngày phát hiện; báo cáo điều tra trong 3 ngày làm việc. -->

| Bước | Thời hạn tối đa tính từ lúc phát hiện |
|---|---|
| 1. Thu hồi và xoay vòng | |
| 2. Đánh giá phạm vi lộ | |
| 3. Quyết định về lịch sử git | |
| 5. Rút kinh nghiệm | |

## Các bước

### 1. Thu hồi và xoay vòng (làm ngay)

<!--
Với từng loại secret, ghi: thu hồi ở đâu (trang quản trị nào, lệnh nào), ai có quyền, cách cấp secret mới,
nơi lưu secret mới (secret store, repository/environment secret của GitHub Actions), cách triển khai lại.
-->

1. Xác định secret: loại, hệ thống nó mở, quyền của nó. Không mở giá trị secret ra xem nếu không cần.
2. Thu hồi (revoke) secret ở nhà cung cấp hoặc hệ thống phát hành.
3. Tạo secret mới, lưu vào <nơi lưu secret>, không ghi vào code.
4. Triển khai lại các dịch vụ dùng secret; kiểm tra chúng chạy bằng secret mới.
5. Kiểm tra secret cũ thật sự không còn dùng được.

### 2. Đánh giá phạm vi lộ

<!-- Trả lời được các câu hỏi dưới đây, ghi nguồn bằng chứng (log nào, truy vấn nào). -->

- Secret nằm ở đâu: file, commit, nhánh, pull request, log CI, artifact? Từ khi nào (ngày commit đầu tiên)?
- Ai đã có thể đọc: repo public hay private? Có fork, clone, bản sao, cache nào không?
- Secret đã bị dùng chưa: log truy cập của nhà cung cấp trong khoảng thời gian bị lộ, theo IP và thao tác bất thường.
- Dữ liệu hay hệ thống nào có thể đã bị ảnh hưởng?

### 3. Quyết định về lịch sử git

<!--
Viết lại lịch sử (git filter-repo, force push) KHÔNG phải bước mặc định. Ghi tiêu chí quyết định cho tổ chức bạn.
-->

Mặc định: **không viết lại lịch sử** khi secret đã thu hồi và không còn giá trị. Ghi nhận finding cũ vào ngoại lệ của gate (`.gitleaksignore` hoặc baseline) kèm lý do, người chịu trách nhiệm, ngày hết hạn.

Cân nhắc viết lại lịch sử khi:

- secret không thể thu hồi hoặc xoay vòng (ví dụ dữ liệu cá nhân, khóa của bên thứ ba ngoài tầm kiểm soát); hoặc
- <tiêu chí khác của tổ chức>.

Nếu viết lại: lên kế hoạch phối hợp với mọi người có bản clone, đóng hoặc merge pull request đang mở, tạm gỡ branch protection, và liên hệ hỗ trợ của nền tảng để xóa cache. Ghi rõ người duyệt quyết định.

### 4. Truyền thông

<!-- Ai cần biết, khi nào, qua kênh nào, nói gì. Không gửi giá trị secret trong thông báo. -->

- Nội bộ: <nhóm, kênh>.
- Bên ngoài (khách hàng, đối tác, cơ quan quản lý) nếu có ảnh hưởng: <ai quyết định, theo quy định nào>.

### 5. Rút kinh nghiệm

<!-- Họp ngắn, không đổ lỗi cá nhân. Kết quả là việc cụ thể có người phụ trách và hạn. -->

- Vì sao secret vào được code? Control nào lẽ ra phải chặn mà không chặn?
- Cập nhật: rule quét, pre-commit hook, `SECURITY-GATE.md`, runbook này.
- Ghi việc tiếp theo vào backlog bảo mật.

## Nhật ký áp dụng

<!-- Một dòng cho mỗi lần dùng runbook. Không ghi giá trị secret. -->

| Ngày | ID sự cố | Secret (định danh) | Thu hồi lúc | Quyết định về lịch sử | Người xử lý |
|---|---|---|---|---|---|
| | | | | | |
