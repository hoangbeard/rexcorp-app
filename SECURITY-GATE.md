# SECURITY-GATE: `rexcorp-app`

<!--
Cách dùng mẫu:
1. Chép file này vào GỐC repo, đặt tên SECURITY-GATE.md. Một repo một file.
2. Mỗi module của khóa học điền MỘT mục control, đúng lúc bạn triển khai control đó.
   Mục chưa áp dụng thì để nguyên dòng "Chưa áp dụng", đừng xóa: người đọc cần thấy cả những gì CHƯA có.
3. Viết quy định đủ cụ thể để hai người đọc ra cùng một quyết định: chặn khi nào, ai duyệt ngoại lệ, hạn bao lâu.
4. File này là policy: mọi thay đổi đi qua pull request và được người phụ trách bảo mật duyệt
   (module 08 thêm CODEOWNERS cho file này).
5. Xóa các comment hướng dẫn khi đã điền xong một mục.
-->

## Phạm vi và người chịu trách nhiệm

<!--
- Repo / sản phẩm: tên, greenfield hay brownfield.
- Người phụ trách bảo mật (duyệt ngoại lệ, sửa file này).
- Người triage finding hằng ngày, nếu khác người trên.
- Ngày áp dụng bản này.
-->

| Mục | Giá trị |
|---|---|
| Repo | `hoangbeard/rexcorp-app` (public) |
| Người phụ trách bảo mật | Kỹ sư DevOps phụ trách bảo mật |
| Người triage | Kỹ sư DevOps phụ trách bảo mật |
| Áp dụng từ | 2026-10-22 |

## Quy tắc chung

<!--
Điền đầy đủ ở module 08 (security gate, triage, ngoại lệ). Trước đó, ghi tối thiểu:
- Gate là job CI nào, chạy trên sự kiện nào (pull_request, push lên main, theo lịch).
- Gate "chặn" nghĩa là gì trên repo này: job fail, và job đó có phải required status check không.
- Ngoại lệ ghi ở đâu, cần những trường nào (lý do, người chịu trách nhiệm, ngày hết hạn), ai duyệt.
-->

## Control

<!--
Mỗi control dùng cùng một bảng để dễ so sánh. Các hàng:
- Công cụ và phiên bản: tên, phiên bản, cách pin (digest image, SHA action).
- Chạy ở đâu: máy dev (pre-commit), server (GitHub), pull request, nhánh main, theo lịch.
- Điều kiện chặn: finding nào làm gate fail (mức độ, loại, chỉ finding mới hay mọi finding).
- Baseline / ngoại lệ: file nào, định dạng nào, bắt buộc trường nào, hạn tối đa bao lâu, ai duyệt.
- Bằng chứng: artifact nào được lưu (SARIF, JSON, log), giữ bao lâu, ai xem được.
- Triage và thời hạn xử lý: ai xem finding, trong bao lâu; với finding thật thì sửa trong bao lâu.
- Căn cứ framework: ID điều khoản của framework ĐÃ học (ví dụ task NIST SSDF), không chỉ tên framework.
-->

### Quét secret (module 02)

<!-- Điền ở Lab 02. Tham khảo runbook xử lý secret bị lộ: docs/runbooks/leaked-secret.md -->

| Hạng mục | Quy định |
|---|---|
| Công cụ và phiên bản | Gitleaks CLI v8.30.1, image `ghcr.io/gitleaks/gitleaks@sha256:c00b6bd0…` (MIT); push protection của GitHub |
| Chạy ở đâu | Pre-commit hook `.githooks/pre-commit`; push protection (server); job `secret-scan` trong `ci.yml` trên mọi PR và push lên `main`; quét toàn lịch sử định kỳ (chưa làm) |
| Điều kiện chặn | Mọi finding của `gitleaks git` không có trong `.gitleaksignore` làm job `secret-scan` fail (exit 1). Không có ngưỡng mức độ |
| Baseline / ngoại lệ | Fingerprint trong `.gitleaksignore`, comment ngay trên ghi lý do, người chịu trách nhiệm, ngày hết hạn (tối đa 6 tháng). Người xin không tự duyệt; duyệt qua PR bởi người phụ trách bảo mật |
| Bằng chứng | Artifact `gitleaks-sarif` (SARIF 2.1.0, `--redact`), giữ 30 ngày |
| Triage và thời hạn xử lý | Secret thật: thu hồi trong ngày phát hiện, theo `docs/runbooks/leaked-secret.md`. Nghi báo nhầm: triage trong 3 ngày làm việc |
| Căn cứ framework | Tương ứng với (ánh xạ của khóa học) SSDF 1.1 PS.1.1 (tr. 9), PO.3.1/PO.3.2 (tr. 7), PO.3.3 (tr. 7), PO.4.1/PO.4.2 (tr. 8); NCCoE §2.2.2 Secret Scanner ở phase Develop |

### Yêu cầu bảo mật và threat model (module 03)

Chưa áp dụng.

<!-- Không phải gate tự động. Ghi: tài liệu yêu cầu nằm ở đâu, khi nào phải cập nhật threat model, ai duyệt. -->

### SAST: phân tích tĩnh mã nguồn (module 04)

Chưa áp dụng.

### Dependency, SCA và SBOM (module 05)

Chưa áp dụng.

### Container image và cấu hình (module 06)

Chưa áp dụng.

### DAST: kiểm thử động (module 07)

Chưa áp dụng.

### Bảo vệ chính pipeline CI (module 09)

Chưa áp dụng.

<!-- Ví dụ hàng cần có: lint workflow (actionlint, zizmor), action pin theo SHA, quyền GITHUB_TOKEN mặc định. -->

### Toàn vẹn artifact: ký và provenance (module 10)

Chưa áp dụng.

## Lịch sử thay đổi

<!-- Mỗi lần sửa policy: ngày, ai sửa, sửa gì, link pull request. -->

| Ngày | Người sửa | Thay đổi |
|---|---|---|
| 2026-10-22 | p1 | Thêm mục Quét secret |
