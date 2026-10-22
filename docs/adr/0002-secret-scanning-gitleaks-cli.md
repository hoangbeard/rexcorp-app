# ADR-0002: Quét secret bằng Gitleaks CLI chạy từ image pin digest

## Bối cảnh

Lab 01 commit một API key giả vào `src/config.js` (commit `e1b1983`), rồi đổi sang biến môi trường. Ngày 2026-10-22: `gitleaks dir` báo `no leaks found`, còn `gitleaks git` báo 1 finding `generic-api-key` trong lịch sử. TruffleHog 3.97.9 (`--no-verification`) báo 0 finding vì key không thuộc nhà cung cấp nào. Bản vá của đồng nghiệp áp bằng `git am` không đi qua pre-commit hook. Push protection của GitHub chỉ chặn pattern nhà cung cấp, nên không bắt key giả dạng `rxpay_…`.

Phương án:

1. Gitleaks CLI v8.30.1 chạy bằng `docker run` với image pin digest trong bước `run:`.
2. `gitleaks/gitleaks-action`.
3. Chỉ dựa vào secret scanning và push protection của GitHub.

## Quyết định

Chúng tôi sẽ dùng Gitleaks CLI v8.30.1 (image `ghcr.io/gitleaks/gitleaks` pin digest `c00b6bd0…`) cho pre-commit hook và job `secret-scan` của `rexcorp-app` và `rexcorp-legacy`, từ 2026-10-22; giữ push protection của GitHub làm lớp thứ hai.

## Căn cứ (ID điều khoản framework)

| Framework / tài liệu | ID điều khoản | Nội dung liên quan | Link |
|---|---|---|---|
| NIST SSDF 1.1 | PS.1.1 (tr. 9) | "Store all forms of code … based on the principle of least privilege". Ánh xạ của chúng tôi: secret trong code làm ai đọc được repo cũng có credential | https://doi.org/10.6028/NIST.SP.800-218 |
| NIST SSDF 1.1 | PO.3.1 Ex. 2, PO.3.2 Ex. 3, PO.3.3 (tr. 7) | đưa công cụ bảo mật vào toolchain; cấu hình dạng code; công cụ tạo artifact làm bằng chứng (SARIF) | như trên |
| NIST SSDF 1.1 | PO.4.1, PO.4.2 Ex. 3 (tr. 8) | tiêu chí kiểm tra và tự động hóa quyết định: job gate + `SECURITY-GATE.md` | như trên |
| NCCoE DevSecOps | §2.2.2 | Secret Scanner là component của phase Develop | https://pages.nist.gov/nccoe-devsecops/ |
| README gitleaks-action | License | từ v2.0.0 dùng EULA, repo của organization cần license key | https://github.com/gitleaks/gitleaks-action |

## Trade-off

| Phương án | Được | Mất |
|---|---|---|
| **Gitleaks CLI + digest** | MIT, offline, quét lịch sử, baseline, SARIF; kiểm soát đúng phiên bản | Dự án "feature complete", chỉ còn vá bảo mật; rule chung có false negative (stopword như `mail`, allowlist `node_modules`); phải tự viết bước upload SARIF |
| `gitleaks-action` | Ít YAML | EULA, cần license key khi chuyển vào organization; thêm một action bên thứ ba phải pin |
| Chỉ GitHub | Không tốn công, đã bật mặc định | Không bắt key giả/token nội bộ không theo pattern nhà cung cấp; có thể bypass; repo private cần trả phí |

## Hậu quả

- SEC-002: đặt `secret-scan` làm required status check (kỹ sư DevOps, module 08).
- Theo dõi Betterleaks làm đường nâng cấp; xem lại ADR này sau 6 tháng (2027-04) hoặc khi Gitleaks ngừng vá bảo mật.
- Rủi ro còn lại: false negative của rule chung; bù bằng quét đối chiếu TruffleHog định kỳ.

## Trạng thái / Ngày

- Trạng thái: accepted
- Ngày: 2026-10-22
- Người quyết định: kỹ sư DevOps (p1)
