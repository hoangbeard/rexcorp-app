# ADR-0007: Chạy ZAP bằng docker run (script chung) và đặt mức FAIL/WARN/IGNORE cho từng rule

## Bối cảnh

Khách hàng pentest báo rexcorp-app thiếu security header. Baseline (spider) báo sạch PASS 67, exit 0; API scan -S đọc openapi.yaml thấy 7 URL và FAIL rule 10021 (x 4). Sau khi thêm middleware header: exit 0, PASS 120. Phương án: (a) zaproxy/action-baseline; (b) docker run trong scripts/dast-scan.sh.

## Quyết định

Chúng tôi sẽ chạy ZAP 2.17.0 (pin digest) bằng scripts/dast-scan.sh trong dast.yml, gate theo .zap/rules.tsv: FAIL cho 10021, 10038, 10020, 10037, 90022, 10028, 10010; WARN cho 90004, 10035, 10011, 10054, 10003, 10055; IGNORE cho 10049, 10109, 10111, 10112 (xem lại 2027-04-06).

## Căn cứ (ID điều khoản framework)

| Framework / tài liệu | ID điều khoản | Nội dung liên quan | Link |
|---|---|---|---|
| NIST SSDF 1.1 | PW.8.2 Example 2 | tích hợp dynamic vulnerability testing vào bộ test tự động (ánh xạ của khóa học) | https://doi.org/10.6028/NIST.SP.800-218 |
| NIST SSDF 1.1 | PO.4.1, PO.4.2 | tiêu chí kiểm tra + tự động quyết định | https://doi.org/10.6028/NIST.SP.800-218 |
| OWASP ASVS 5.0.0 | v5.0.0-3.4.4 | nosniff trên mọi phản hồi | https://github.com/OWASP/ASVS |

## Trade-off

| Phương án | Được | Mất |
|---|---|---|
| docker run + script | một script cho máy dev và CI, không thêm action bên thứ ba, quyền contents: read | tự duy trì script, tự cập nhật digest ZAP hằng tháng; CSP của API do test giữ vì 10038/10020 không báo trên JSON |
| zaproxy/action-baseline | gọn một bước | tạo issue (cần quyền), thêm action bên thứ ba, chỉ baseline |

## Hậu quả

DAST-001..005 trong backlog. Xem lại khi có giao diện HTML, có đăng nhập, hoặc ZAP đổi cách tính exit code.

## Trạng thái / Ngày

- Trạng thái: accepted
- Ngày: 2026-10-26
- Người quyết định: học viên p1
