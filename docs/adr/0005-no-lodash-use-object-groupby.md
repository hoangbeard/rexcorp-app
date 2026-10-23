# ADR-0005: Không thêm lodash cho báo cáo tổng hợp theo danh mục; dùng `Object.groupBy` có sẵn

## Bối cảnh

Hà gửi pull request "Thêm báo cáo tổng hợp theo danh mục" (endpoint `GET /api/summary`). Pull request thêm `lodash` 4.17.20 để dùng ba hàm: `groupBy`, `sumBy`, `meanBy`. Test của Hà xanh, nhưng gate SCA (OSV-Scanner) đỏ: ngày 2026-10-06, `lodash` 4.17.20 có 3 nhóm lỗ hổng (một mức High, CVSS 8.1, command injection qua `_.template`; hai mức trung bình). Code của RexCorp không gọi `_.template`.

Dữ liệu đo ngày 2026-10-06 (OSV-Scanner v2.6.0):

| Phiên bản lodash | Số nhóm lỗ hổng |
|---|---|
| 4.17.20 (bản trong pull request) | 3 |
| 4.17.21 | 2 (một High, CVSS 8.1) |
| 4.18.1 (bản mới nhất trên npm) | 0 |

Ràng buộc: `package.json` đã yêu cầu Node.js >= 24.11.0; thời hạn nhỏ; mục tiêu là giữ dependency production ít nhất có thể.

Các phương án:

1. Giữ lodash 4.17.20 và ghi ngoại lệ `ignoreUntil` trong `osv-scanner.toml`.
2. Nâng lên lodash 4.18.1.
3. Không thêm lodash; viết lại bằng `Object.groupBy` và `reduce` có sẵn của Node.js 24.

## Quyết định

Chúng tôi sẽ không thêm `lodash` vào `rexcorp-app`. Hà sửa `src/summary.js` dùng `Object.groupBy` và `Array.prototype.reduce`; `package.json` và `package-lock.json` trở về trạng thái trước pull request (66 package). Áp dụng từ pull request này, 2026-10-06.

## Căn cứ (ID điều khoản framework)

| Framework / tài liệu | ID điều khoản | Nội dung liên quan | Link |
|---|---|---|---|
| NIST SSDF 1.1 | PW.4.1 | "Acquire and maintain well-secured software components" từ bên thứ ba; Ex. 1 "Review and evaluate third-party software components in the context of their expected use" (trang 12) | <https://doi.org/10.6028/NIST.SP.800-218> |
| NIST SSDF 1.1 | PW.4.4 | Ex. 2 "Build into the toolchain automatic detection of known vulnerabilities in software components" (trang 13): gate OSV-Scanner | như trên |
| OpenSSF, Concise Guide for Evaluating Open Source Software | Initial Assessment, "Consider Necessity" | "Evaluate whether the dependency can be avoided by utilizing existing components. Every new dependency increases the attack surface" | <https://best.openssf.org/Concise-Guide-for-Evaluating-Open-Source-Software> |
| OWASP Top 10:2025 | A03 Software Supply Chain Failures | Rủi ro nhóm này gồm cả thành phần có lỗ hổng đã biết lẫn chuỗi cung ứng | <https://owasp.org/Top10/2025/A03_2025-Software_Supply_Chain_Failures/> |
| OWASP ASVS 5.0.0 | V15.1.1, V15.2.1 (L1) | Có khung thời gian vá cho component có lỗ hổng; ứng dụng không chứa component quá hạn đó | <https://github.com/OWASP/ASVS/tree/v5.0.0> |

## Trade-off

| Phương án | Được | Mất |
|---|---|---|
| Giữ 4.17.20 + ngoại lệ | Merge ngay | Đưa vào production một lỗ hổng High đã biết kèm bản vá; ngoại lệ phải xin lại sau tối đa 30 ngày; mọi lần gate chạy đều mang gánh nặng giải thích "vì sao bỏ qua" |
| Nâng lên 4.18.1 | Gate xanh; giữ code của Hà | Thêm 1 dependency production (và bề mặt tấn công của nó); từ 4.17.21 (2021-02-20) lên 4.18.1 (2026-04-01) là bước nhảy lớn sau năm năm, cần đọc ghi chú phát hành và chạy test; phải theo dõi lodash lâu dài |
| **Dùng `Object.groupBy`** | Không thêm dependency; gate xanh; lockfile không đổi; không phải theo dõi advisory của lodash | Hà viết lại khoảng 10 dòng; mất 15 phút; tự duy trì đoạn tính toán nhỏ này (có test) |

## Hậu quả

- `package.json` không còn `lodash`. Gate SCA xanh với 66 package. Thêm thư viện sau này phải qua bảng đánh giá trong Bài 2 (module 05) và ghi ADR nếu là dependency production.
- Nếu về sau dùng nhiều hàm của lodash, xem lại quyết định này và chọn phương án 2.
- Việc cần làm tiếp: đặt job `osv-scanner` và `dependency-review` làm required status check (SEC-005, module 08).
- Xem lại ADR khi Node.js đổi phiên bản tối thiểu của `engines`, hoặc khi có thêm yêu cầu tổng hợp dữ liệu phức tạp.

## Trạng thái / Ngày

- Trạng thái: accepted
- Ngày: 2026-10-06
- Người quyết định: kỹ sư DevOps phụ trách bảo mật, trưởng nhóm phát triển
