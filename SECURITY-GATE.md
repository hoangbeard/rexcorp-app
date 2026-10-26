# SECURITY-GATE: `rexcorp-app`

<!--
Cách dùng mẫu:
1. Chép file này vào GỐC repo, đặt tên SECURITY-GATE.md. Một repo một file.
2. Mỗi module của khóa học điền MỘT mục control, đúng lúc bạn triển khai control đó.
   Mục chưa áp dụng thì để nguyên dòng "Chưa áp dụng", đừng xóa: người đọc cần thấy cả những gì CHƯA có.
3. Viết quy định đủ cụ thể để hai người đọc ra cùng một quyết định: chặn khi nào, ai duyệt ngoại lệ, hạn bao lâu.
4. File này là policy: mọi thay đổi đi qua pull request và được người phụ trách bảo mật duyệt
   (module 08 thêm CODEOWNERS cho file này).
5. Xóa các comment hướng dẫn khi đã điền xong một mục.
-->

## Phạm vi và người chịu trách nhiệm

| Mục | Giá trị |
|---|---|
| Repo | `rexcorp-app`: API danh mục sản phẩm, dự án mới (greenfield), repo public |
| Người phụ trách bảo mật | Kỹ sư DevOps phụ trách bảo mật |
| Người triage | Kỹ sư DevOps phụ trách bảo mật |
| Áp dụng từ | 2026-10-05 |

## Quy tắc chung

<!-- Điền đầy đủ ở module 08 (security gate, triage, ngoại lệ). -->

- Gate là các job trong `.github/workflows/ci.yml`, chạy trên mọi `pull_request` và mỗi lần push lên `main`. Một job fail nghĩa là gate chặn: không merge pull request khi còn job đỏ.
- Ngoại lệ ghi trong file của từng control (xem từng mục), luôn có lý do, người chịu trách nhiệm và ngày hết hạn, và được duyệt qua pull request.

## Control

### Quét secret (module 02)

| Hạng mục | Quy định |
|---|---|
| Công cụ và phiên bản | Gitleaks CLI v8.30.1, image `ghcr.io/gitleaks/gitleaks:v8.30.1@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f`, cấu hình mặc định của Gitleaks (repo chưa có `.gitleaks.toml`). Không dùng `gitleaks-action` (xem ADR-0002). Bổ sung: secret scanning và push protection của GitHub (repo public) |
| Chạy ở đâu | (1) Máy dev: pre-commit hook `.githooks/pre-commit`, quét phần đã stage. Mỗi người bật một lần bằng `git config core.hooksPath .githooks`. (2) Server: push protection của GitHub. (3) CI: job `secret-scan` quét **toàn bộ lịch sử mà `HEAD` mang theo** (`--log-opts="--full-history --diff-filter=tuxdb HEAD"`) trên mọi pull request và push lên `main`: lịch sử của `main` cộng các commit của pull request, không quét nhánh khác. (4) Liên tục: secret scanning của GitHub quét mọi nhánh. Quét mọi ref bằng Gitleaks (lệnh `gitleaks git` mặc định) chạy trên máy khi đánh giá định kỳ; chưa có job theo lịch |
| Điều kiện chặn | Mọi finding của Gitleaks không nằm trong `.gitleaksignore` làm job `secret-scan` fail (exit code 1). Không có ngưỡng mức độ: mọi secret đều chặn. Job `docker-build` chỉ chạy khi `secret-scan` xanh |
| Baseline / ngoại lệ | File `.gitleaksignore` ở gốc repo, mỗi ngoại lệ là một Fingerprint của Gitleaks, ngay phía trên có comment ghi: ID (sự cố hoặc ticket), lý do, người chịu trách nhiệm, ngày hết hạn. Hạn tối đa 6 tháng. Người phụ trách bảo mật duyệt qua pull request; người xin ngoại lệ không tự duyệt. Không dùng comment `gitleaks:allow` trong code. Bypass push protection chỉ với lý do "It's used in tests" hoặc "It's a false positive"; lý do "I'll fix it later" được xử lý như một sự cố. Mỗi lần bypass ghi vào bảng "Nhật ký bypass push protection" ngay dưới bảng này |
| Bằng chứng | Artifact `gitleaks-sarif` (SARIF 2.1.0, secret đã được `--redact`) của mỗi lần chạy, giữ 30 ngày; log job trên GitHub Actions. Artifact của repo public ai đăng nhập GitHub cũng tải được, nên báo cáo không bao giờ chứa giá trị secret |
| Triage và thời hạn xử lý | Finding trên code đã push: coi là secret thật, xử lý theo `docs/runbooks/leaked-secret.md`, thu hồi trong ngày phát hiện. Finding nghi báo nhầm: triage trong 3 ngày làm việc. Ngoại lệ hết hạn: xem lại trong tuần hết hạn |
| Giới hạn đã biết (chưa enforce) | (a) Job `secret-scan` **chưa** là required status check của `main`, nên job đỏ chưa tự chặn merge (SEC-002, module 08). (b) Gate đọc workflow, `.gitleaksignore` và hook **từ chính nhánh của pull request**, nên một pull request tự thêm fingerprint hoặc sửa workflow là gate xanh; cho tới khi có `CODEOWNERS` và required review (module 08), người review phải đọc mọi thay đổi ở các file này. (c) Ngày hết hạn trong `.gitleaksignore` chỉ là comment; Gitleaks không đọc nó. Module 08 thêm sổ ngoại lệ và script kiểm hạn |
| Căn cứ trực tiếp | MITRE CWE-798 "Use of Hard-coded Credentials": secret viết cứng trong code là một loại điểm yếu đã được đặt tên. GitHub Docs: push protection chặn secret trước khi vào repo; với secret đã lộ, việc đầu tiên là thu hồi hoặc xoay vòng |
| Căn cứ framework | Ánh xạ của khóa học vào NIST SSDF 1.1: PS.1.1 (lưu mọi dạng code theo least privilege), PO.3.1 và PO.3.2 (đưa công cụ bảo mật vào toolchain, cấu hình dạng code), PO.3.3 (công cụ sinh artifact làm bằng chứng), PO.4.1 và PO.4.2 (tiêu chí kiểm tra và tự động ra quyết định). Bản đồ pipeline NCCoE: Secret Scanner là component của phase Develop |

#### Nhật ký bypass push protection

| Ngày | Repo | Secret (loại, vị trí, không ghi giá trị) | Lý do chọn | Người bypass | Bằng chứng |
|---|---|---|---|---|---|
| — | `rexcorp-app` | Chưa có lần bypass nào | — | — | — |

### Yêu cầu bảo mật và threat model (module 03)

Chưa áp dụng.

### SAST: phân tích tĩnh mã nguồn (module 04)

Chưa áp dụng.

### Dependency, SCA và SBOM (module 05)

Chưa áp dụng.

### Container image và cấu hình (module 06)

| Hạng mục | Quy định |
|---|---|
| Công cụ và phiên bản | Image: Trivy v0.76.1 (`ghcr.io/aquasecurity/trivy:0.76.1@sha256:790fd66d1697395d8693d1acaa1ea702406a20f109b6fc7bac8db623eca6c06c`; release immutable, chữ ký cosign xác minh trước khi pin). Dockerfile: hadolint v2.15.1 (`hadolint/hadolint:v2.15.1@sha256:32dac941…`) và Trivy config. Docker Compose: KICS v2.1.20 (`checkmarx/kics:v2.1.20@sha256:3e5a268e…`; không dùng tag `latest`, không dùng `kics-github-action`). Grype v0.121.0 chỉ để đối chiếu trong báo cáo, không phải gate |
| Chạy ở đâu | Workflow `.github/workflows/container.yml`: mọi `pull_request`, mọi push lên `main`, và lần chạy theo lịch thứ Hai hằng tuần 03:41 UTC (bắt CVE mới công bố sau khi build). Job `config-scan` (hadolint, Trivy config, KICS) và job `image-scan` (dựng image, `docker save`, Trivy quét từ file tar, không mount `docker.sock`) |
| Điều kiện chặn | `image-scan`: mọi finding HIGH hoặc CRITICAL **đã có bản vá** (`--ignore-unfixed`) không nằm trong `.trivyignore.yaml`, hoặc secret trong image. `config-scan`: hadolint từ mức warning; Trivy config từ mức HIGH; KICS từ mức HIGH. Mọi gate fail độc lập, một lần chạy cho thấy hết. Finding chưa có bản vá không chặn nhưng nằm trong `trivy-image-all.json` và được xem trong buổi triage hằng tuần |
| Baseline / ngoại lệ | `.trivyignore.yaml` ở gốc repo (đọc bằng `--ignorefile`). Mỗi mục bắt buộc có `id`, `statement` (lý do, người chịu trách nhiệm, điều kiện gỡ) và `expired_at` tối đa 30 ngày sau ngày thêm. Trivy **không** ép `expired_at`, nên người duyệt pull request kiểm tra từng mục. Người phụ trách bảo mật duyệt; người xin ngoại lệ không tự duyệt. Hiện không có mục nào |
| Bằng chứng | Artifact `config-scan-reports` (SARIF của hadolint, Trivy config, KICS; JSON của KICS) và `image-scan-reports` (`trivy-image-all.json` đủ mọi mức, `trivy-image-gate.sarif`), giữ 30 ngày. Artifact của repo public ai đăng nhập GitHub cũng tải được: báo cáo không chứa secret (Trivy che giá trị) nhưng liệt kê gói và phiên bản |
| Triage và thời hạn xử lý | Người triage: người phụ trách bảo mật, hằng tuần sau lần chạy theo lịch. Có bản vá và gate đỏ: dựng lại image với base mới theo bảng SLA duy nhất của khóa học (`docs/frameworks/remediation-sla.md`): Critical 7 ngày, High 14 ngày, Medium 30 ngày; hạng Khẩn 3 ngày khi triage thấy dấu hiệu khai thác thật. Nghi báo nhầm: triage trong 3 ngày làm việc, ghi lý do vào `statement` |
| Quy tắc cấu hình | Image chạy bằng user số (65532), không shell, không package manager; base image và mọi `FROM` pin theo digest; compose không `privileged`, không mount `docker.sock`, không publish cổng ra mọi interface, có `cap_drop: [ALL]`, `read_only: true`, `no-new-privileges` |
| Căn cứ framework | Ánh xạ của khóa học vào NIST SSDF 1.1: PW.4.1 và PW.4.4 (thành phần bên thứ ba, phát hiện lỗ hổng đã biết trong toolchain), PW.9.1 (secure baseline), RV.1.1 và RV.2.2 (quét lại liên tục; quyết định sửa hay xử lý cách khác), PO.3 và PO.4 (công cụ trong toolchain, tiêu chí kiểm tra). Bản đồ pipeline NCCoE: Container Image Scanner và IaC Scanner là component của phase Build. ADR-0006 |

### DAST: kiểm thử động (module 07)

| Hạng mục | Quy định |
|---|---|
| Công cụ và phiên bản | ZAP 2.17.0 (Apache-2.0), image `ghcr.io/zaproxy/zaproxy:stable@sha256:5ccfff9a411743ab2615136a2edd7416bec9ce41572fa94e935df38c14adb2b6`, chạy bằng `scripts/dast-scan.sh` (hai lượt: `zap-baseline.py` và `zap-api-scan.py -S`). Không dùng `zaproxy/action-baseline` (xem ADR-0007). Tiêu chí gate: `.zap/rules.tsv`. Mô tả route cho API scan: `.zap/openapi.yaml` |
| Chạy ở đâu | Job `zap` trong `.github/workflows/dast.yml`: mọi `pull_request`, push lên `main`, và theo lịch thứ Hai hằng tuần. Ứng dụng chạy ngay trong job, trong một mạng Docker `--internal`, không publish cổng. Chỉ quét ứng dụng này, không quét host nào khác. Quét chủ động (full scan, API scan không có `-S`): chỉ trên môi trường tạm hoặc staging do RexCorp sở hữu, sau khi báo bên vận hành; không nằm trong gate |
| Điều kiện chặn | Rule đặt `FAIL` trong `.zap/rules.tsv` có ít nhất một alert trong lượt quét baseline hoặc API scan: ZAP exit 1, job fail. Rule `WARN` chỉ in ra, không chặn. Rule `IGNORE` không hiện |
| Baseline / ngoại lệ | `.zap/rules.tsv`: mỗi dòng `FAIL` và `IGNORE` có cột ghi chú (căn cứ requirement hoặc lý do); mỗi dòng `IGNORE` có hạn xem lại, tối đa 6 tháng. Thêm, bỏ hay đổi mức một rule: pull request, người phụ trách bảo mật duyệt, người xin không tự duyệt. Không có `progress.json` ở repo này (đây là repo mới) |
| Bằng chứng | Artifact `zap-report` (HTML, JSON, Markdown của cả hai lượt quét), giữ 30 ngày; log job. Artifact của repo public ai đăng nhập GitHub cũng tải được: báo cáo chứa URL và đoạn phản hồi, không được chứa dữ liệu thật |
| Triage và thời hạn xử lý | `FAIL`: sửa trong chính pull request, vì gate chặn. `WARN`: xem lại trong tuần ở lần quét theo lịch; trong 14 ngày quyết định sửa, nâng lên `FAIL`, hay hạ xuống `IGNORE` kèm lý do và hạn. `.zap/openapi.yaml` phải cập nhật trong cùng pull request thêm hoặc đổi route |
| Căn cứ framework | Ánh xạ của khóa học vào NIST SSDF 1.1: PW.8.1 (quyết định cần kiểm thử mã đang chạy và loại kiểm thử nào; Example 1: trong môi trường sandbox), PW.8.2 (Example 2: tích hợp kiểm thử động vào bộ kiểm thử tự động; Example 3: thêm kiểm thử cho lỗ hổng đã báo để không tái diễn; Example 4: kể đến hạ tầng ở production), PO.4.1 và PO.4.2 (tiêu chí kiểm tra, tự động ra quyết định), PO.3.3 (công cụ sinh artifact bằng chứng). Bản đồ pipeline NCCoE: DAST System thuộc phase Test. Requirement: OWASP ASVS 5.0.0 mục 3.4 (`v5.0.0-3.4.3`, `3.4.4`, `3.4.5`, `3.4.6`) và `v5.0.0-16.5.1`, kiểm một phần bằng máy |

### Bảo vệ chính pipeline CI (module 09)

Chưa áp dụng. Đã có từ Lab 01: action pin theo SHA, `permissions: contents: read`, lint workflow bằng actionlint và zizmor trước khi push (ADR-0001).

### Toàn vẹn artifact: ký và provenance (module 10)

Chưa áp dụng.

## Lịch sử thay đổi

| Ngày | Người sửa | Thay đổi |
|---|---|---|
| 2026-10-05 | Kỹ sư DevOps phụ trách bảo mật | Tạo file; thêm mục "Quét secret" (Lab 02) |
| 2026-10-26 | Học viên (p1) | Điền mục "Container image và cấu hình" (Lab 06) |
| 2026-10-26 | Học viên (p1) | Điền mục DAST (Lab 07) |
