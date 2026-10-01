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

Mục này không phải một gate tự động duy nhất: nó gồm gate tổ chức (review threat model và ma trận trong pull request) và một job kiểm tra requirement bằng máy.

| Hạng mục | Quy định |
|---|---|
| Công cụ và phiên bản | Threat model: OWASP Threat Dragon 2.6.2 (image `owasp/threat-dragon:v2.6.2@sha256:ec26312b472ad364d5b79283d795f946b9aff9639b798e9f76bfdd243810af17`), file `docs/threat-model/rexcorp-app.json`. Requirement: OWASP ASVS 5.0.0 trong `SECURITY-REQUIREMENTS.md`. Kiểm tra bằng máy: `scripts/verify-requirements.sh` (bash, curl, docker), workflow `.github/workflows/requirements-check.yml` |
| Chạy ở đâu | (1) Review: mọi pull request làm đổi DFD phải cập nhật threat model, hoặc ghi lý do không cần, theo `.github/pull_request_template.md`. (2) CI: job `verify-requirements` trên mọi `pull_request` và push lên `main` |
| Điều kiện chặn | Job `verify-requirements` fail khi có dòng `FAIL`: một requirement kiểm được hôm nay mà không đạt (REQ-04, REQ-08, phần mã nguồn của REQ-09). `GAP`, `SKIP`, `MANUAL`, `PARTIAL` không chặn nhưng phải có mã backlog. Pull request thêm đăng nhập hoặc tải file chỉ được merge khi thỏa "Điều kiện merge" trong `SECURITY-REQUIREMENTS.md` |
| Baseline / ngoại lệ | Trạng thái hiện tại của từng requirement nằm trong `SECURITY-REQUIREMENTS.md` (cột Trạng thái) và `docs/security-backlog.md` (SEC-003 đến SEC-008). Bỏ một requirement hoặc chấp nhận một threat: viết ADR mới hoặc sửa ADR-0003 qua pull request, ghi lý do, người chịu trách nhiệm, hạn xem lại. Người xin không tự duyệt |
| Bằng chứng | `docs/threat-model/rexcorp-app.json`, `docs/threat-model/threat-model.md`, `docs/security-traceability.md`; log job `verify-requirements` trên GitHub Actions |
| Triage và thời hạn xử lý | Threat mới: ghi vào threat model trong cùng pull request làm đổi thiết kế. Threat High còn Open: có mã backlog và người phụ trách; không merge tính năng liên quan. Xem lại toàn bộ threat model mỗi 6 tháng hoặc khi Product đổi phạm vi |
| Căn cứ framework | Ánh xạ của khóa học vào NIST SSDF 1.1: PW.1.1 (risk modeling, trang 11), PW.1.2 (theo dõi requirement, rủi ro, quyết định thiết kế, trang 11), PO.1.2 (tài liệu hóa requirement của phần mềm, trang 5), PW.2.1 (review thiết kế, trang 12). Bản đồ pipeline NCCoE: threat modeling thuộc phase Plan. Requirement: OWASP ASVS 5.0.0 L1, trích ID dạng `v5.0.0-x.y.z` |

### SAST: phân tích tĩnh mã nguồn (module 04)

| Hạng mục | Quy định |
|---|---|
| Công cụ và phiên bản | Semgrep CE 1.182.0 (engine LGPL-2.1), image `semgrep/semgrep:1.182.0@sha256:4a34048c04fef049f71665047f074cffb00cc3d89482f965a5cd151d589237af`, chạy bằng `docker run` trong `.github/workflows/sast.yml` (action pin theo SHA). Rule: (1) `.semgrep/rules/` do RexCorp viết, giấy phép MIT, có test; (2) gói `p/default` của registry, dùng nội bộ theo Semgrep Rules License v1.0, tải mỗi lần chạy, không gắn phiên bản. Luôn có `--metrics off`. Ghi lý do chọn trong ADR-0004 |
| Chạy ở đâu | Pull request (gate), push lên `main`, và hằng tuần (thứ Hai 03:17 UTC, quét toàn bộ). IDE: khuyến nghị extension Semgrep, chưa bắt buộc |
| Điều kiện chặn | Mọi finding mức **ERROR** làm job fail (`--severity ERROR --error`). Repo mới, không có nợ cũ nên không dùng baseline. WARNING và INFO không chặn, nằm trong báo cáo đầy đủ. Loại lỗi mà requirement bắt buộc chặn (hiện có: XSS phản xạ) phải có rule của repo ở mức ERROR; không dựa vào mức severity của rule registry |
| Baseline / ngoại lệ | Không baseline. Ngoại lệ theo từng dòng: `// nosemgrep: <rule-id> -- <ID>: <lý do>; xem lại trước <ngày>`. Cấm `nosemgrep` không kèm rule ID. Hạn tối đa 6 tháng. Thêm đường dẫn vào `.semgrepignore` cũng là ngoại lệ: cùng quy trình. Mọi thay đổi qua pull request do người phụ trách bảo mật duyệt; người xin không tự duyệt. Sửa hoặc thêm rule phải kèm test `semgrep --test` trong cùng pull request |
| Bằng chứng | Artifact `semgrep-sarif` (SARIF 2.1.0): `semgrep-gate.sarif` (chỉ ERROR) và `semgrep-all.sarif` (mọi mức, có finding bị `nosemgrep` với `suppressions`), giữ 30 ngày; bảng triage `docs/sast-triage.md` |
| Triage và thời hạn xử lý | Finding ERROR: triage trong 1 ngày làm việc; bản thật phải sửa trước khi merge. WARNING: xem hằng tuần; bản thật sửa trong 30 ngày hoặc ghi lý do vào `docs/sast-triage.md`. False positive: sửa rule (kèm test) hoặc ngoại lệ trong 3 ngày làm việc. Hằng tháng: xem lại tỷ lệ false positive theo rule và các ngoại lệ sắp hết hạn |
| Căn cứ framework | NIST SSDF 1.1: PW.7.1 (quyết định dùng phân tích code), PW.7.2 (thực hiện, ghi lại và triage mọi issue), PW.5.1 (mã hóa output); ánh xạ của khóa học: PO.3.1, PO.3.2, PO.3.3, PO.4.1, PO.4.2. Bản đồ pipeline NCCoE: SAST System, phase Develop, Build, Test (§2.2.2 đến §2.2.4). OWASP ASVS 5.0.0: V1.2.1 (mã hóa output, L1). Giới hạn của công cụ tự động: ASVS, phần Assessment and Certification |

### Dependency, SCA và SBOM (module 05)

Chưa áp dụng.

### Container image và cấu hình (module 06)

Chưa áp dụng.

### DAST: kiểm thử động (module 07)

Chưa áp dụng.

### Bảo vệ chính pipeline CI (module 09)

Chưa áp dụng. Đã có từ Lab 01: action pin theo SHA, `permissions: contents: read`, lint workflow bằng actionlint và zizmor trước khi push (ADR-0001).

### Toàn vẹn artifact: ký và provenance (module 10)

Chưa áp dụng.

## Lịch sử thay đổi

| Ngày | Người sửa | Thay đổi |
|---|---|---|
| 2026-10-05 | Kỹ sư DevOps phụ trách bảo mật | Tạo file; thêm mục "Quét secret" (Lab 02) |
| 2026-10-06 | Kỹ sư DevOps phụ trách bảo mật | Thêm mục "Yêu cầu bảo mật và threat model" (Lab 03) |
| 2026-10-07 | Kỹ sư DevOps phụ trách bảo mật | Thêm mục "SAST" (Lab 04) |
