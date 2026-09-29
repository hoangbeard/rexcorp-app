# ADR-0002: Gate quét secret bằng Gitleaks CLI (image pin digest), không dùng gitleaks-action, không chỉ dựa vào push protection

## Bối cảnh

Sự cố SEC-001: một API key được commit vào `src/config.js` ở Lab 01, CI vẫn xanh. Commit sau chuyển key sang biến môi trường, nên `gitleaks dir` báo sạch nhưng `gitleaks git` vẫn thấy key trong lịch sử. Pipeline chưa có control nào cho secret. Cùng tuần, một pull request "thêm tích hợp thanh toán" ghi thẳng API key vào `src/payments.js`. Pull request đó được tạo bằng `git am`, nên pre-commit hook trên máy không hề chạy.

Ràng buộc: tài khoản GitHub Free, repo public; công cụ phải là open source hoặc miễn phí; RexCorp dự định chuyển repo vào một organization; báo cáo phải lưu được làm bằng chứng.

Các phương án:

1. `gitleaks/gitleaks-action` (action chính thức của Gitleaks).
2. Gitleaks CLI chạy bằng container image pin theo digest trong một bước `run:`.
3. Chỉ dựa vào secret scanning và push protection của GitHub (miễn phí với repo public).

## Quyết định

Chúng tôi sẽ chạy Gitleaks CLI v8.30.1 bằng image `ghcr.io/gitleaks/gitleaks:v8.30.1@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f` trong job `secret-scan` của `.github/workflows/ci.yml`, quét toàn bộ lịch sử mà `HEAD` mang theo (không quét nhánh khác) trên mọi pull request và push lên `main`, lưu SARIF (đã redact) làm artifact. Cùng image đó chạy trong pre-commit hook `.githooks/pre-commit`. Đồng thời bật secret scanning và push protection của GitHub như một lớp bổ sung. Áp dụng cho `rexcorp-app` từ 2026-10-05; `rexcorp-legacy` dùng cùng cách, thêm baseline.

## Căn cứ (ID điều khoản framework)

| Framework / tài liệu | ID điều khoản | Nội dung liên quan | Link |
|---|---|---|---|
| MITRE CWE | CWE-798 | "Use of Hard-coded Credentials": "The product contains hard-coded credentials, such as a password or cryptographic key." Căn cứ trực tiếp: secret trong code là một loại điểm yếu có tên | <https://cwe.mitre.org/data/definitions/798.html> |
| GitHub Docs, Removing sensitive data | Secret | Với secret đã lộ, bước đầu tiên là thu hồi hoặc xoay vòng; viết lại lịch sử có thể không cần | <https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository> |
| NIST SSDF 1.1 | PS.1.1 | "Store all forms of code – including source code, executable code, and configuration-as-code – based on the principle of least privilege" (trang 9). Ánh xạ của khóa học: secret trong code làm ai đọc được repo cũng đọc được credential | <https://doi.org/10.6028/NIST.SP.800-218> |
| NIST SSDF 1.1 | PO.3.1, PO.3.2 | Ex. 2 của PO.3.1 "Identify security tools to integrate into the developer toolchain"; Ex. 3 của PO.3.2 "Use code-based configuration for toolchains" (trang 7) | như trên |
| NIST SSDF 1.1 | PO.3.3 | "Configure tools to generate artifacts of their support of secure software development practices" (trang 7): SARIF lưu làm artifact | như trên |
| NIST SSDF 1.1 | PO.4.1, PO.4.2 | Tiêu chí kiểm tra bảo mật; Ex. 3 của PO.4.2 "Automate decision-making processes utilizing the criteria" (trang 8): job fail là quyết định tự động, tiêu chí ghi trong `SECURITY-GATE.md` | như trên |
| NCCoE DevSecOps, mô hình tham chiếu | §2.2.2 | Secret Scanner là component của phase Develop | <https://pages.nist.gov/nccoe-devsecops/notational-reference-model.html> |
| README và EULA của gitleaks-action | License | Từ v2.0.0 dùng EULA riêng thay cho MIT, cấm sửa đổi; repo của organization cần license key | <https://github.com/gitleaks/gitleaks-action> |
| GitHub Docs, Push protection | Push protection for users | Bật mặc định, chặn push secret lên repo public; chỉ với các loại secret GitHub hỗ trợ | <https://docs.github.com/en/code-security/concepts/secret-security/push-protection> |

## Trade-off

| Phương án | Được | Mất |
|---|---|---|
| gitleaks-action | Ít YAML; comment trên pull request | Giấy phép EULA, không phải open source; cần license key khi repo chuyển vào organization; thêm một action bên thứ ba có quyền đọc code |
| **Gitleaks CLI, image pin digest** | Giấy phép MIT; chạy offline, không gửi secret ra ngoài; cùng một image cho máy dev và CI; baseline và `.gitleaksignore` cho brownfield; SARIF | Tự viết khoảng 10 dòng YAML; tự theo dõi bản vá (Gitleaks đã "feature complete", chỉ còn vá bảo mật); quét toàn bộ lịch sử thêm khoảng 1 giây với `rexcorp-legacy` (353 commit) khi chạy thử trên máy |
| Chỉ push protection của GitHub | Không tốn phút CI; chặn ngay khi push | Rule do GitHub quyết định, chủ yếu là định dạng của nhà cung cấp: hai API key giả trong sự cố của RexCorp không theo định dạng nào nên không có gì bảo đảm sẽ bị chặn; không có baseline do mình quản lý; repo private của organization cần GitHub Secret Protection trả phí |

Ghi chú: TruffleHog (chạy đối chiếu, `--no-verification`) không báo được key giả trong lịch sử `rexcorp-app`, vì nó dựa vào detector theo từng nhà cung cấp. Đây là ví dụ cho việc mỗi công cụ có false negative riêng.

## Hậu quả

- Mọi pull request phải qua job `secret-scan`. Việc tiếp theo: đặt `secret-scan` làm required status check của nhánh `main` (người phụ trách: kỹ sư DevOps, hạn: module 08).
- Mọi developer bật pre-commit hook bằng `git config core.hooksPath .githooks`. Hook cần Docker. Không ép buộc được: `git commit --no-verify` và `git am` bỏ qua hook, nên CI là chốt chặn chính.
- Ngoại lệ chỉ qua `.gitleaksignore` theo quy định trong `SECURITY-GATE.md`.
- Rủi ro còn lại được chấp nhận: rule mặc định có false negative (ví dụ chuỗi chứa từ trong danh sách stopword của rule `generic-api-key` không bị báo). Giảm bằng secret scanning của GitHub và quét đối chiếu bằng TruffleHog khi đánh giá brownfield.
- Xem lại sau 6 tháng (2027-04-05), hoặc khi Gitleaks ngừng phát hành bản vá bảo mật; phương án thay thế đang theo dõi là Betterleaks. Lưu ý khi chuyển: bản v2 (đang RC từ 2026-09-30) dùng `.betterleaksignore` với value fingerprint, bỏ SARIF và bỏ baseline, nên không chỉ là đổi image.

## Trạng thái / Ngày

- Trạng thái: accepted
- Ngày: 2026-10-05
- Người quyết định: kỹ sư DevOps phụ trách bảo mật, CTO đồng ý
