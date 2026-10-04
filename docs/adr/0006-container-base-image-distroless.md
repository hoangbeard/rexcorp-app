# ADR-0006: Image chạy của rexcorp-app dùng distroless Node.js 24 trên Debian 13 (nonroot), pin theo digest

## Bối cảnh

Bên vận hành hỏi: image `rexcorp-app` có hàng trăm CVE, nên sửa cái nào? Ngày 2026-10-25, Trivy v0.76.1 quét image dựng từ `node:24.22.1-bookworm-slim` báo 244 finding (1 CRITICAL, 61 HIGH). (Ngày 2026-10-06, lần quét đầu bằng Trivy v0.75.0 báo 257 finding, trong đó 8 HIGH/CRITICAL của `perl-base` và `libpcre2-8-0` đã có bản vá; Debian và base image cập nhật sau đó nên chúng biến mất.) Phân loại theo thứ tự "có làm được gì không":

- 229 finding chưa có bản vá (Trivy ghi `affected`, `fix_deferred`, `will_not_fix`): không có hành động sửa nào; theo dõi.
- 15 finding đã có bản vá, tất cả nằm trong `npm` đi kèm image Node.js (ứng dụng không chạy `npm` lúc vận hành); 4 trong số đó mức HIGH. Không có gói Debian nào mức HIGH hoặc CRITICAL đã có bản vá ở thời điểm quét, nhưng tình trạng này đổi theo ngày: ngày 2026-10-06 có 8 finding như vậy.
- Một finding CRITICAL (CVE-2023-45853, `zlib1g`) là báo nhầm trong thực tế: Debian ghi chú `contrib/minizip` (phần bị ảnh hưởng) không được build trong gói `zlib` của họ, và đánh dấu lỗi này `<ignored>` cho bookworm.

Ràng buộc: tài khoản GitHub Free; nhóm nhỏ; công cụ phải miễn phí; ứng dụng là Express thuần JavaScript, không có native addon, không cần shell hay package manager khi chạy.

Các phương án đã đo (Trivy v0.76.1, ngày 2026-10-25, linux/arm64):

| Base image (đã pin digest) | Gói OS | Finding tổng | HIGH + CRITICAL | Trong đó đã có bản vá |
|---|---|---|---|---|
| `node:24.22.1-bookworm-slim` (Debian 12) | 88 | 244 | 62 | 4 |
| `node:24.22.1-trixie-slim` (Debian 13) | 79 | 177 | 48 | 4 |
| `node:24.22.1-alpine` (Alpine 3.24.3) | 19 | 15 | 5 | 4 |
| `gcr.io/distroless/nodejs24-debian12:nonroot` | 10 | 71 | 7 | 6 |
| `gcr.io/distroless/nodejs24-debian13:nonroot` | 14 | 31 | 0 | 0 |

Số finding của các distro không so sánh thẳng được: mỗi distro công bố dữ liệu lỗ hổng với mức đầy đủ khác nhau, và con số chỉ nói về dữ liệu của ngày quét. Grype v0.121.0 quét cùng image `distroless debian13` báo cùng 31 cặp (CVE, gói) nhưng xếp 11 cặp ở mức High thay vì Medium; cả 11 đều chưa có bản vá (`not-fixed` hoặc `wont-fix`). Vì gate của RexCorp chỉ chặn finding đã có bản vá, hai công cụ cùng cho kết quả "xanh"; nhưng "0 HIGH/CRITICAL" là kết quả theo cách xếp mức độ của Trivy, không phải sự thật khách quan.

## Quyết định

Chúng tôi sẽ build image chạy của `rexcorp-app` theo hai giai đoạn: giai đoạn `deps` dùng `node:24.22.1-bookworm-slim@sha256:55fb5f5a…` để `npm ci --omit=dev`; giai đoạn cuối dùng `gcr.io/distroless/nodejs24-debian13:nonroot@sha256:cb606325…`, chạy bằng uid 65532. Áp dụng từ 2026-10-25. Gate image giữ `--ignore-unfixed --severity HIGH,CRITICAL`; `.trivyignore.yaml` không còn mục nào.

## Căn cứ (ID điều khoản framework)

| Framework / tài liệu | ID điều khoản | Nội dung liên quan | Link |
|---|---|---|---|
| NIST SSDF 1.1 | PW.4.1 | "Acquire and maintain well-secured software components … from commercial, open-source, and other third-party developers for use by the organization's software" (trang 12). Ánh xạ của khóa học: base image và gói OS trong image là thành phần bên thứ ba | <https://doi.org/10.6028/NIST.SP.800-218> |
| NIST SSDF 1.1 | PW.4.4 | Ví dụ 2: "Build into the toolchain automatic detection of known vulnerabilities in software components" (trang 13): job `image-scan` | như trên |
| NIST SSDF 1.1 | PW.9.1 | "Define a secure baseline by determining how to configure each setting that has an effect on security … so that the default settings are secure" (trang 16). Ánh xạ của khóa học: user không phải root, bỏ capability, không shell | như trên |
| NIST SSDF 1.1 | RV.1.1, RV.2.1, RV.2.2 | RV.1.1 Ví dụ 3 (trang 16): tự động rà soát dữ liệu thành phần để tìm lỗ hổng mới, tương ứng lần quét hằng tuần; RV.2.2 Ví dụ 1 (trang 18): quyết định sửa hay xử lý bằng cách khác, theo rủi ro | như trên |
| NCCoE DevSecOps, mô hình tham chiếu | §2.2.3 Build | Container Image Scanner và IaC Scanner là component của phase Build | <https://pages.nist.gov/nccoe-devsecops/notational-reference-model.html> |
| OWASP Docker Security Cheat Sheet | Rule #2, #3, #4, #8, #9 | Đặt user, giới hạn capability, `no-new-privileges`, filesystem chỉ đọc, đưa công cụ quét vào CI/CD | <https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html> |
| README của distroless | Why should I use distroless images? | Image chỉ có ứng dụng và runtime, không package manager, không shell; "improves the signal to noise of scanners (e.g. CVE)" | <https://github.com/GoogleContainerTools/distroless> |

## Trade-off

| Phương án | Được | Mất |
|---|---|---|
| Giữ `bookworm-slim`, bỏ `npm`, ngoại lệ có hạn | Không đổi cách debug; nhóm đã quen `apt` và shell | Mỗi lần Debian vá mà base image chưa dựng lại lại cần một ngoại lệ ngắn hạn (ngày 2026-10-06 là 8 mục); hàng trăm finding chưa vá vẫn nằm trong báo cáo |
| `trixie-slim` | Debian mới hơn, giữ shell | Vẫn 48 HIGH/CRITICAL (4 đã có bản vá); giải quyết ít hơn một nửa vấn đề |
| `alpine` | Ít gói; image nhỏ | musl thay vì glibc (rủi ro tương thích nếu sau này thêm native addon); "0 lỗ hổng gói OS" chỉ là kết quả theo dữ liệu của Alpine ngày quét, không chứng minh gói sạch |
| **distroless debian13 nonroot** | 0 finding HIGH/CRITICAL theo Trivy (Grype: 11 High, đều chưa có bản vá), 31 finding tổng; image nhỏ hơn (56,1 MB so với 82,1 MB); không shell, không `apt`, không `npm` để kẻ tấn công dùng; chữ ký cosign xác minh được | Không `docker exec … sh`: debug bằng biến thể `:debug-nonroot` hoặc công cụ ngoài; Dockerfile hai giai đoạn dài hơn; phụ thuộc một dự án do Google duy trì (GoogleContainerTools) mà nhóm phải theo dõi; tag `nonroot` trượt theo bản mới nên bắt buộc pin digest và có quy trình cập nhật |

## Hậu quả

- Dependabot (`package-ecosystem: docker`; đã cấu hình ở Lab 05a, nếu bạn chưa làm thì lấy từ `labs/solutions/lab-05a`) đề xuất digest mới cho cả hai `FROM`. Người phụ trách bảo mật duyệt, CI chạy lại `image-scan` trước khi merge. Chưa chạy thử trên GitHub.
- Nhịp dựng lại: lần quét theo lịch thứ Hai hằng tuần; finding mới có bản vá mà gate báo thì dựng lại image với digest mới theo bảng SLA của khóa học (`docs/frameworks/remediation-sla.md` trong repo khóa học): Critical 7 ngày, High 14 ngày, Medium 30 ngày; hạng Khẩn (3 ngày) khi triage thấy dấu hiệu khai thác thật.
- Chủ sở hữu base image: kỹ sư DevOps phụ trách bảo mật. Việc cần làm: kiểm tra chữ ký cosign của digest mới mỗi lần đổi (lệnh ở Lab 06, Bước 10).
- Rủi ro còn lại được chấp nhận: "0 finding HIGH/CRITICAL" chỉ đúng theo Trivy và dữ liệu của ngày quét, sẽ đổi khi có CVE mới; 11 phát hiện mà Grype xếp High (thư viện `libc6`, `zlib1g`, `libgcc`…) chưa có bản vá và được theo dõi trong lần quét hằng tuần; KICS báo `Healthcheck Not Set` (MEDIUM) cho compose dù image đã có HEALTHCHECK.
- Xem lại quyết định khi: Node.js 24 hết hỗ trợ (2028-04-30 theo lịch phát hành của Node.js) hoặc distroless công bố hết hỗ trợ cho Debian 13, hoặc khi cần native addon cần shell lúc chạy.

## Trạng thái / Ngày

- Trạng thái: accepted
- Ngày: 2026-10-25
- Người quyết định: kỹ sư DevOps phụ trách bảo mật, CTO đồng ý
