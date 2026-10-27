<!--
Các dòng backlog của Lab 08 cho rexcorp-app. Thêm vào docs/security-backlog.md (hoặc để riêng, không ghi đè file của lab khác).
-->

# Backlog của Lab 08: gate, triage và ngoại lệ (rexcorp-app)

| ID | Mô tả | Mức độ | Người phụ trách | Hạn | Trạng thái |
|---|---|---|---|---|---|
| GATE-001 | Tạo ruleset `main: security gates` từ `docs/rulesets/main-protection.json` (hoặc bản `-solo`): 12 check bắt buộc, pull request bắt buộc, code owner review. Đóng SEC-002 (job `secret-scan` chưa là required status check). Chưa chạy thử trên GitHub | Trung bình | Kỹ sư DevOps phụ trách bảo mật | 2026-10-14 | Mở |
| GATE-002 | Thay `@ten-github-cua-ban` trong `.github/CODEOWNERS` bằng tài khoản thật có quyền ghi; nếu làm một mình, ghi rõ người duyệt thứ hai là vai trò mô phỏng trong sổ ngoại lệ | Thấp | Kỹ sư DevOps phụ trách bảo mật | 2026-10-14 | Mở |
| GATE-003 | Chạy `triage-enrichment.yml` lần đầu trên GitHub (workflow_dispatch) và kiểm tra artifact `kev-epss`. Hiện lockfile không có CVE nên bảng rỗng | Thấp | Kỹ sư DevOps phụ trách bảo mật | 2026-10-14 | Mở |
| GATE-004 | Xem lại ngưỡng EPSS 0.04 và 0.008 (ADR-0008) bằng số finding vượt ngưỡng và số xử lý kịp hạn | Thấp | Kỹ sư DevOps phụ trách bảo mật | 2027-01-07 | Mở |
