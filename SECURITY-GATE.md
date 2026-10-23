# SECURITY-GATE: `rexcorp-app`

## Phạm vi và người chịu trách nhiệm

| Mục | Giá trị |
|---|---|
| Repo | rexcorp-app (greenfield) |
| Người phụ trách bảo mật | p1 |
| Người triage | p1 |
| Áp dụng từ | 2026-10-23 |

## Control

### Quét secret (module 02)

| Hạng mục | Quy định |
|---|---|
| Công cụ và phiên bản | Gitleaks CLI v8.30.1, image `ghcr.io/gitleaks/gitleaks@sha256:c00b6bd0…` |
| Chạy ở đâu | pre-commit hook (`.githooks/`), push protection của GitHub, job `secret-scan` trên pull_request và push lên main, quét mọi ref định kỳ (chưa tự động) |
| Phạm vi quét của gate | `--log-opts="--full-history --diff-filter=tuxdb HEAD"`; nhánh khác do secret scanning của GitHub bù |
| Điều kiện chặn | Mọi finding không có trong `.gitleaksignore` làm job fail |
| Baseline / ngoại lệ | `.gitleaksignore`: fingerprint + comment lý do, người chịu trách nhiệm, hạn (tối đa 6 tháng); người xin không tự duyệt |
| Bypass push protection | Chỉ sau khi xác minh; lý do "used in tests" hoặc "false positive" đúng sự thật; ghi nhật ký |
| Bằng chứng | Artifact `gitleaks-sarif`, `--redact`, giữ 30 ngày |
| Triage và thời hạn xử lý | Secret thật: thu hồi trong ngày; nghi báo nhầm: 3 ngày làm việc |
| Giới hạn đã biết | Chưa là required check; PR tự nới được gate (sửa `.gitleaksignore`); hạn ngoại lệ chưa được kiểm tự động |
| Căn cứ framework | Trực tiếp: CWE-798; GitHub Docs "Removing sensitive data". Ánh xạ của tôi: SSDF 1.1 PS.1.1, PO.3.2, PO.4.1 |
