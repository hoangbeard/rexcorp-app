# ADR-0004: SAST bằng Semgrep CE (image pin digest) với rule của RexCorp và gói `p/default`, chặn mức ERROR

## Bối cảnh

Pull request "Thêm tính năng tìm kiếm sản phẩm" (Đỗ Quang Huy) có hai lỗi thật trong 75 dòng diff: XSS phản xạ ở `/search` (`curl` trả `<script>` nguyên vẹn) và `new RegExp(q)` từ tham số người dùng (`q=(` làm route trả HTTP 500). CI xanh: gate quét secret của module 02 không đọc logic code, và test của Huy qua. Hai người review không thấy lỗi.

Khi chạy thử, gói `p/default` chỉ báo các lỗi này ở mức WARNING, nên gate "chặn ERROR" chỉ dựa vào rule registry thoát với exit code 0 trên chính bản vá đó. Cần một control đọc code, ép buộc được trên pull request, và cần phần mức ERROR do RexCorp kiểm soát.

Ràng buộc: tài khoản GitHub Free; công cụ phải mở hoặc miễn phí; dự án sẽ có repo private (`rexcorp-internal`, module 09); không có ngân sách mua công cụ; telemetry mặc định của công cụ không được gửi từ CI; báo cáo phải lưu làm bằng chứng.

Các phương án:

1. Semgrep CE (image pin digest): rule của RexCorp cộng gói `p/default`.
2. Opengrep: bản fork LGPL-2.1 của Semgrep CE.
3. CodeQL (GitHub code scanning).
4. Chỉ dùng gói rule registry, không viết rule riêng.

## Quyết định

Chúng tôi sẽ chạy Semgrep CE 1.182.0 bằng image `semgrep/semgrep:1.182.0@sha256:4a34048c04fef049f71665047f074cffb00cc3d89482f965a5cd151d589237af` trong job `semgrep` của `.github/workflows/sast.yml`, với `--metrics off` và hai nguồn rule: `.semgrep/rules/` (MIT, do RexCorp viết, có test) và `p/default` (dùng nội bộ). Gate chặn mức ERROR bằng `--severity ERROR --error` trên pull request, push lên `main` và quét hằng tuần; một bước thứ hai lưu báo cáo đầy đủ mọi mức. Áp dụng cho `rexcorp-app` từ 2026-10-06; `rexcorp-legacy` dùng cùng image với `--baseline-commit`.

## Căn cứ (ID điều khoản framework)

| Framework / tài liệu | ID điều khoản | Nội dung liên quan | Link |
|---|---|---|---|
| NIST SSDF 1.1 | PW.7.1, PW.7.2 | PW.7.1: quyết định dùng code review và/hoặc code analysis "as defined by the organization". PW.7.2: "record and triage all discovered issues and recommended remediations in the development team's workflow or issue tracking system"; Example 4: "Use a static analysis tool to automatically check code for vulnerabilities … with a human reviewing the issues reported by the tool" (trang 14) | <https://doi.org/10.6028/NIST.SP.800-218> |
| NIST SSDF 1.1 | PO.3.2, PO.3.3, PO.4.1, PO.4.2 | Cấu hình công cụ là code (PO.3.2 Ex. 3), SARIF làm artifact (PO.3.3), tiêu chí và quyết định tự động (PO.4.1, PO.4.2 Ex. 3) (trang 7 và 8). Ánh xạ của khóa học | như trên |
| NCCoE DevSecOps, mô hình tham chiếu | §2.2.2, §2.2.3, §2.2.4 | "SAST System" là component ở các phase Develop, Build, Test; shift-left: chạy analyzer "before committing changes to SCM systems" | <https://pages.nist.gov/nccoe-devsecops/notational-reference-model.html> |
| OWASP ASVS 5.0.0 | V1.2.1 (L1); phần Assessment and Certification | V1.2.1: mã hóa output theo ngữ cảnh HTML. SAST/DAST "without careful configuration and tuning … the level of noise will prevent real security issues from being identified" | <https://github.com/OWASP/ASVS/tree/v5.0.0/5.0/en> |
| Semgrep Docs, Licensing; Semgrep Rules License v1.0 | — | Engine LGPL-2.1; rule của Semgrep "only for your own internal business purposes"; rule bên thứ ba giữ giấy phép nguồn (ví dụ AGPL-3.0) | <https://semgrep.dev/docs/licensing>, <https://semgrep.dev/legal/rules-license> |
| Semgrep Docs, Metrics | `--metrics` | `auto` (mặc định) gửi metrics khi tải rule từ registry; `off` không bao giờ gửi | <https://semgrep.dev/docs/metrics> |
| GitHub CodeQL Terms and Conditions | Use Rights; License Restrictions | Chỉ phân tích codebase giấy phép OSI; CI/CD chỉ khi codebase host trên GitHub.com; cấm codebase không mở (repo private) nếu không có giấy phép trả phí | <https://github.com/github/codeql-cli-binaries/blob/main/LICENSE.md> |

## Trade-off

| Phương án | Được | Mất |
|---|---|---|
| **Semgrep CE, rule của RexCorp + `p/default`** | Engine LGPL-2.1; rule tự viết có test và severity do mình quyết; SARIF; `--baseline-commit` cho brownfield; chạy rule cục bộ khi offline; không cần tài khoản | Chỉ theo dõi dữ liệu trong một hàm (đã thấy: `sendPage` là false negative); gói `p/default` tải mỗi lần và không gắn phiên bản; rule registry chỉ dùng nội bộ; phải viết và bảo trì rule riêng; không theo dõi finding theo thời gian. Thêm khoảng 10 giây mỗi lần chạy trên repo nhỏ; theo dõi nợ brownfield bằng backlog thủ công |
| Opengrep | LGPL-2.1; chạy được rule và file test của chúng tôi (đã thử bản 1.30.0, cần locale UTF-8); có taint trong cùng file theo README | Không giải quyết bài toán giấy phép rule (rule của Semgrep vẫn theo Semgrep Rules License); `opengrep-rules` kèm Commons Clause và README ghi dùng cho "research, testing & benchmarking"; chưa kiểm tra telemetry và cách làm baseline |
| CodeQL | Phân tích sâu | Điều khoản không cho dùng với codebase không mở; code scanning trên repo private cần license GitHub Code Security; không phù hợp ràng buộc "không ngân sách" khi RexCorp có repo private |
| Chỉ rule registry | Không phải viết rule | Bản vá của Huy chỉ bị báo ở WARNING; mức severity do người khác quyết; mất kiểm soát khi rule đổi |

## Hậu quả

- Mọi pull request phải qua job `SAST (Semgrep CE)`. Việc tiếp theo: đặt nó làm required status check của nhánh `main` (người phụ trách: kỹ sư DevOps, hạn: module 08).
- Mọi rule mới hoặc sửa rule phải kèm test `semgrep --test` trong cùng pull request. Ngoại lệ chỉ qua comment `nosemgrep: <rule-id>` có lý do và hạn, theo `SECURITY-GATE.md`.
- Rủi ro còn lại được chấp nhận: false negative vì phân tích một hàm và vì chưa có rule (ví dụ stored XSS, `$where` NoSQL trên `rexcorp-legacy`); gói `p/default` đổi theo thời gian, giảm bằng quét toàn bộ hằng tuần. Giá trị mới của rule registry không được phép ghi đè mức ERROR của rule RexCorp.
- Việc cần làm: đánh giá chép gói rule vào repo nội bộ ở commit cố định (kiểm tra điều khoản với pháp lý), và xem lại khi công ty có hơn 10 contributor (điều kiện miễn phí của bản trả phí). Xem lại quyết định sau 6 tháng (2027-04-06), hoặc khi Semgrep đổi giấy phép engine hay Opengrep thể hiện lợi thế rõ.

## Trạng thái / Ngày

- Trạng thái: accepted
- Ngày: 2026-10-06
- Người quyết định: kỹ sư DevOps phụ trách bảo mật, CTO đồng ý
