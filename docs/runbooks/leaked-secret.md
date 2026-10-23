# Runbook: xử lý secret bị lộ

Quy trình của RexCorp khi một secret (API key, token, mật khẩu, private key) xuất hiện ở nơi không được phép: mã nguồn, lịch sử git, pull request, log CI, artifact, issue, kênh chat. Áp dụng cho `rexcorp-app` và `rexcorp-legacy`. Quy định của gate: `SECURITY-GATE.md`, mục "Quét secret".

Không chép giá trị secret vào runbook, ticket, chat hay log. Chỉ ghi định danh: tên secret, file, commit, fingerprint.

## Khi nào dùng runbook này

- Job `secret-scan` hoặc pre-commit hook báo finding trên code **đã push**.
- GitHub secret scanning tạo alert, hoặc push protection bị bypass với lý do "I'll fix it later".
- Ai đó báo đã dán secret vào issue, pull request, log CI hay kênh chat.
- Nhà cung cấp báo secret của RexCorp xuất hiện ở nơi công khai.

**Mặc định coi mọi secret bị lộ là thật và đã bị lấy**, cho tới khi chứng minh được điều ngược lại.

## Vai trò và liên lạc

| Vai trò | Người | Liên lạc |
|---|---|---|
| Người xử lý sự cố | Kỹ sư DevOps phụ trách bảo mật (thay thế: trưởng nhóm phát triển) | Kênh chat `#sec-incident` |
| Chủ sở hữu secret / hệ thống | Người quản trị dịch vụ phát hành secret (ghi trong danh mục dịch vụ) | Kênh của nhóm sở hữu |
| Người phụ trách bảo mật | Kỹ sư DevOps phụ trách bảo mật | Kênh chat `#sec-incident` |
| Người cần được báo | CTO; pháp chế nếu có dữ liệu khách hàng | Email, gọi điện nếu ngoài giờ |

## Thời hạn

| Bước | Thời hạn tối đa tính từ lúc phát hiện |
|---|---|
| 1. Thu hồi và xoay vòng | Trong ngày làm việc phát hiện (ngoài giờ: trong 4 giờ nếu repo public) |
| 2. Đánh giá phạm vi lộ | 3 ngày làm việc |
| 3. Quyết định về lịch sử git | 3 ngày làm việc |
| 5. Rút kinh nghiệm | 10 ngày làm việc |

## Các bước

### 1. Thu hồi và xoay vòng (làm ngay)

1. Xác định secret: loại, dịch vụ nó mở, quyền của nó (đọc file đã sửa, không mở giá trị secret ra nếu không cần).
2. Thu hồi secret ở dịch vụ phát hành (trang quản trị API key của dịch vụ đó).
3. Tạo secret mới với quyền tối thiểu. Lưu vào repository secret hoặc environment secret của GitHub Actions, hoặc nơi lưu secret của môi trường chạy. Không ghi vào code.
4. Triển khai lại dịch vụ dùng secret; kiểm tra nó chạy bằng secret mới.
5. Gọi thử bằng secret cũ để xác nhận đã bị từ chối. Ghi giờ thu hồi vào nhật ký.

### 2. Đánh giá phạm vi lộ

- Secret nằm ở đâu: file, commit, nhánh, pull request, log CI, artifact? Commit đầu tiên chứa nó là ngày nào? (`gitleaks git` cho biết commit và ngày.)
- Ai đã có thể đọc: repo public hay private, từ ngày nào? Có fork hay bản sao nào đã biết không?
- Secret đã bị dùng chưa: xem log truy cập của dịch vụ trong khoảng thời gian bị lộ, theo IP và thao tác bất thường.
- Dữ liệu hay hệ thống nào có thể đã bị ảnh hưởng?

### 3. Quyết định về lịch sử git

Mặc định: **không viết lại lịch sử** khi secret đã thu hồi và không còn giá trị. Ghi finding cũ vào `.gitleaksignore` (hoặc baseline với repo brownfield) kèm ID sự cố, lý do, người chịu trách nhiệm, ngày hết hạn, qua pull request.

Lý do: repo đã public, có thể đã bị clone hoặc fork; viết lại lịch sử không xóa được các bản đó, lại đổi toàn bộ commit ID phía sau, làm hỏng diff của pull request cũ và buộc mọi người clone lại.

Chỉ viết lại lịch sử khi:

- secret không thể thu hồi hoặc xoay vòng; hoặc
- dữ liệu bị lộ không phải credential (ví dụ dữ liệu cá nhân của khách hàng).

Khi đó: CTO duyệt; đóng hoặc merge mọi pull request đang mở; báo trước cho mọi người có bản clone; dùng `git filter-repo --sensitive-data-removal`; tạm gỡ branch protection để force push; liên hệ GitHub Support để xóa cache và tham chiếu trong pull request; mọi người clone lại.

### 4. Truyền thông

- Nội bộ: báo trong `#sec-incident` ngay khi bắt đầu bước 1; cập nhật khi xong bước 1 và bước 3.
- Bên ngoài: CTO quyết định có báo khách hàng, đối tác hay không, sau bước 2.

### 5. Rút kinh nghiệm

- Vì sao secret vào được code? Control nào lẽ ra phải chặn mà không chặn?
- Cập nhật rule quét, pre-commit hook, `SECURITY-GATE.md`, runbook này.
- Ghi việc tiếp theo vào `docs/security-backlog.md`.

## Nhật ký áp dụng

| Ngày | ID sự cố | Secret (định danh) | Thu hồi lúc | Quyết định về lịch sử | Người xử lý |
|---|---|---|---|---|---|
| 2026-10-05 | SEC-001 | API key dịch vụ thông báo, `src/config.js:3`, commit `4857572`, fingerprint trong `.gitleaksignore` | 2026-10-05 (mô phỏng trong lab: key là giả) | Không viết lại. Repo public từ Lab 01, có thể đã bị clone; key đã thu hồi nên không còn giá trị. Ngoại lệ trong `.gitleaksignore`, hết hạn 2027-04-05 | Kỹ sư DevOps phụ trách bảo mật |
