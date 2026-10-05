# ADR-0007: Gate DAST bằng ZAP chạy qua `docker run`; rule nào FAIL, rule nào chỉ WARN

## Bối cảnh

Báo cáo pentest của khách hàng ghi `rexcorp-app` thiếu các security header. Các control đến Lab 06 đều nhìn vào mã nguồn hoặc artifact; không bước nào chạy ứng dụng lên và đọc phản hồi HTTP thật. Lab 07 cho thấy rõ khoảng trống đó: lượt `zap-baseline.py` (spider) báo sạch, nhưng lượt `zap-api-scan.py -S` (nạp mô tả OpenAPI, gọi từng route) báo `X-Content-Type-Options Header Missing` (`x 4`) ở các route `/api/products/...`.

Ba ràng buộc:

- Repo public trên GitHub Free. Terms của GitHub cấm dùng Actions để "gain unauthorized access to any service, device, data, account, or network", nên chỉ được quét ứng dụng chạy trong job.
- Mặc định ZAP đưa mọi alert về `WARN`, và exit code 2 khi chỉ có `WARN`. Không có file rules thì không có gate.
- Chỉ có một người học làm việc một mình: không có đội vận hành để phối hợp quét môi trường chung.

Các phương án:

1. **ZAP qua `docker run` (image pin digest) trong script `scripts/dast-scan.sh`**, tiêu chí gate trong `.zap/rules.tsv`.
2. **`zaproxy/action-baseline`** (action của đội ZAP), `rules_file_name` trỏ tới cùng file rules.
3. Không đặt gate; chạy ZAP bằng tay trước mỗi bản phát hành.

Về mức của rule, ba cách đặt:

- A. Mọi rule `FAIL`.
- B. Mọi rule `WARN` (mặc định của ZAP): chạy nhưng không chặn.
- C. `FAIL` chọn lọc, phần còn lại `WARN` hoặc `IGNORE` có lý do.

## Quyết định

Chúng tôi sẽ chạy ZAP 2.17.0 qua `docker run` với image pin theo digest, bằng script `scripts/dast-scan.sh` dùng chung cho máy dev và CI (`.github/workflows/dast.yml`, từ 2026-10-07), và dùng phương án C: `.zap/rules.tsv` đặt `FAIL` cho 7 rule có ba tính chất (kiểm được bằng máy, sửa rẻ, ít false positive: thiếu `X-Content-Type-Options`, thiếu CSP, thiếu chống nhúng iframe, lộ `X-Powered-By`, lộ lỗi nội bộ, chuyển hướng ra ngoài, cookie không `HttpOnly`), `WARN` cho rule cần ngữ cảnh, `IGNORE` (có hạn xem lại 2027-04-06) cho 4 rule chỉ mang tính thông tin.

## Căn cứ (ID điều khoản framework)

| Framework / tài liệu | ID điều khoản | Nội dung liên quan | Link |
|---|---|---|---|
| NIST SSDF 1.1 | PW.8.1, Example 1 | Quyết định có kiểm thử mã đang chạy hay không và bằng loại nào; chạy "within a sandboxed environment". Là căn cứ cho mạng `--internal` và chạy ngay trong job | https://doi.org/10.6028/NIST.SP.800-218 |
| NIST SSDF 1.1 | PW.8.2, Example 2 và 3 | "Integrate dynamic vulnerability testing into the project's automated test suite"; "Incorporate tests for previously reported vulnerabilities … to ensure that errors are not reintroduced". Là căn cứ cho job `dast.yml` và cho các rule `FAIL` của lỗi đã sửa | https://doi.org/10.6028/NIST.SP.800-218 |
| NIST SSDF 1.1 | PO.4.1, PO.4.2 | Tiêu chí kiểm tra bảo mật và tự động ra quyết định; `.zap/rules.tsv` là tiêu chí đó, viết thành file | https://doi.org/10.6028/NIST.SP.800-218 |
| Bản đồ pipeline NCCoE | §2.2.4 Test | DAST System là component của phase Test, chạy trong môi trường tạm | https://pages.nist.gov/nccoe-devsecops/notational-reference-model.html |
| OWASP ASVS 5.0.0 | 3.4.3, 3.4.4, 3.4.6, 16.5.1 | Các requirement mà rule `FAIL` kiểm (ánh xạ của nhóm, ZAP không công bố ánh xạ sang ASVS). Phần lớn là L2; chọn vì khách hàng đã nêu và sửa rẻ | https://github.com/OWASP/ASVS |
| Tài liệu ZAP | Baseline scan, exit value | "By default it reports all alerts as WARNings but you can specify a config file which can change any rules to FAIL or IGNORE"; exit 0, 1 (có FAIL), 2 (WARN, không FAIL), 3 | https://www.zaproxy.org/docs/docker/baseline-scan/ |
| Tài liệu `zaproxy/action-baseline` | `allow_issue_writing`, `fail_action` | Mặc định tạo hoặc cập nhật GitHub issue và không làm fail job | https://github.com/zaproxy/action-baseline |

## Trade-off

| Phương án | Được | Mất |
|---|---|---|
| 1. `docker run` + script (chọn) | Không thêm action bên thứ ba; một script chạy giống hệt trên máy và trong CI; điều khiển được mạng `--internal` và chạy được API scan; không cần quyền `issues: write` | Tự duy trì script (khoảng 90 dòng); tự cập nhật digest ZAP mỗi tháng; không có issue tự tạo |
| 2. `zaproxy/action-baseline` | Ít việc viết; có issue tự cập nhật | Thêm một action bên thứ ba (phải pin SHA và theo dõi); mặc định ghi issue nên cần quyền ghi issue (suy ra, README không nêu quyền cụ thể); chỉ là baseline; khó đặt app vào mạng riêng |
| 3. Không gate | Không thêm bước | Lỗi header đã sửa sẽ quay lại mà không ai biết |
| A. Mọi rule FAIL | Đơn giản | Rule thông tin và rule cần TLS làm gate đỏ vô cớ; đội sẽ tắt gate |
| B. Mọi rule WARN | Không bao giờ chặn nhầm | Không chặn gì: exit 2 bị bỏ qua dần |
| C. FAIL chọn lọc (chọn) | Chặn đúng thứ đã sửa và kiểm tin cậy được | Phải duy trì file rules; mỗi rule mới của ZAP mặc định là WARN nên có thể lọt; rule `FAIL` ở mức L2 trong khi chính sách chung chỉ nhắm L1; rule 10038 và 10020 không báo trên phản hồi JSON nên với API, CSP và `frame-ancestors` được giữ bằng test trong `npm test`, không bằng ZAP |

Tác động lên delivery: job thêm khoảng 75 giây trên máy chạy thử (build image, hai lượt quét), chạy song song với các job khác.

## Hậu quả

- Việc tiếp theo: (1) DAST-001: khi có môi trường staging có TLS, quét rule 10035 (HSTS) và nâng lên `FAIL`; hạn: trước khi lên production. (2) DAST-002: cập nhật `.zap/openapi.yaml` mỗi khi đổi route; người phụ trách: người viết route. (3) Xem lại các dòng `IGNORE` vào 2027-04-06.
- Digest của ZAP: kiểm tra mỗi tháng (image `stable` được tạo lại hằng tháng), cập nhật qua pull request có đọc release note.
- Rủi ro còn lại và được chấp nhận: baseline không dò các đường dẫn như `/.git` (cần quét chủ động hoặc test viết tay); ZAP tải thêm add-on lúc chạy nên cùng một digest vẫn có thể cho kết quả khác nhau giữa các lần.
- Xem lại quyết định khi: có giao diện web (cần CSP riêng và spider hiểu JavaScript), có đăng nhập (cần quét có xác thực), hoặc ZAP ra bản mới thay đổi cách tính exit code.

## Trạng thái / Ngày

- Trạng thái: accepted
- Ngày: 2026-10-07
- Người quyết định: Kỹ sư DevOps phụ trách bảo mật
