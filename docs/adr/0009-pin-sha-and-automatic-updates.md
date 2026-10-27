# ADR-0009: Pin action theo SHA và cập nhật bằng Dependabot (không auto-merge)

## Bối cảnh

Tin tức tj-actions và Trivy cho thấy tag của action dời được. Đo ở Bước 2a: 24 `uses:` của rexcorp-app đều pin SHA; rexcorp-legacy có 6 tham chiếu theo tag (`@v2`, `@v1`). Scorecard `Pinned-Dependencies` 10 so với 7 (legacy). zizmor persona mặc định không báo `write-all`, nên gate dùng pedantic. Phương án: (1) tag; (2) SHA cập nhật tay; (3) SHA + Dependabot cooldown 7 ngày, review từng PR; (4) SHA + auto-merge.

## Quyết định

Chúng tôi sẽ pin mọi `uses:` theo SHA của commit kèm comment tag, và để Dependabot (`cooldown` 7 ngày) mở PR; một người review so sánh trước khi merge; không auto-merge. Áp cho cả hai repo từ 2026-10-27.

## Căn cứ (ID điều khoản framework)

| Framework / tài liệu | ID điều khoản | Nội dung liên quan | Link |
|---|---|---|---|
| OWASP Top 10 CI/CD | CICD-SEC-8, CICD-SEC-9 | Dịch vụ bên thứ ba chạy với toàn quyền của bước; thiếu kiểm tra toàn vẹn thứ tải về (ánh xạ của khóa học) | https://owasp.org/www-project-top-10-ci-cd-security-risks/ |
| NIST SSDF 1.1 | PO.3.2 | Kiểm tra toàn vẹn công cụ | https://doi.org/10.6028/NIST.SP.800-218 |
| NIST SP 800-204D | §4.1 mục tiêu 2 | "Ensure the integrity of upstream sources and artifacts" | https://csrc.nist.gov/pubs/sp/800/204/d/final |
| GitHub Docs | Secure use | SHA đầy đủ là cách duy nhất dùng action như release bất biến | https://docs.github.com/en/actions/reference/security/secure-use |

## Trade-off

| Phương án | Được | Mất |
|---|---|---|
| Tag | Dễ đọc, ít việc | Tag dời được (tj-actions) |
| SHA cập nhật tay | Bất biến | Quên cập nhật, SHA cũ dần |
| SHA + Dependabot, review (chọn) | Bất biến, có nhịp cập nhật | Mất cảnh báo lỗ hổng riêng cho action pin SHA; thêm việc review mỗi PR |
| SHA + auto-merge | Ít việc | Merge thẳng thứ chưa ai đọc |

## Hậu quả

Người phụ trách bảo mật review PR Dependabot mỗi thứ Hai. Rủi ro còn lại: SHA độc từ đầu, action lồng nhau chưa pin; không có review người thứ hai (làm một mình).
