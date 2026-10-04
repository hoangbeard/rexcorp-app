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

#### SCA: lỗ hổng trong dependency

| Hạng mục | Quy định |
|---|---|
| Công cụ và phiên bản | OSV-Scanner v2.6.0, image `ghcr.io/google/osv-scanner:v2.6.0@sha256:afd838850ac1a0fcc15ff4a041dc9ba11123c3f0d2666217a5f0fcf9222b55fa`, chạy trong workflow `dependency-scan.yml`. Bổ sung: `actions/dependency-review-action` v5.0.0 (pin SHA `a1d282b36b6f3519aa1f3fc636f609c47dddb294`) trong `dependency-review.yml`; Dependabot alerts, security updates và version updates (`.github/dependabot.yml`) |
| Chạy ở đâu | (1) Pull request và push lên `main`: job `osv-scanner` quét `package-lock.json`. (2) Pull request: job `dependency-review` chỉ xét phần thay đổi. (3) Mỗi sáng thứ Hai: `osv-scanner` chạy theo lịch để bắt advisory mới cho dependency đã có. (4) Liên tục: Dependabot alerts trên GitHub |
| Điều kiện chặn | Mọi lỗ hổng chưa nằm trong `osv-scanner.toml` làm job `osv-scanner` fail (exit code 1), không phân biệt mức độ. Riêng pull request: `dependency-review` fail khi thay đổi đưa vào lỗ hổng mức high trở lên hoặc giấy phép ngoài danh sách MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0 |
| Baseline / ngoại lệ | File `osv-scanner.toml` ở gốc repo, mỗi ngoại lệ là một khối `[[IgnoredVulns]]` có `id`, `ignoreUntil` (tối đa 30 ngày) và `reason` (lý do kỹ thuật, ID trong `docs/security-backlog-dependencies.md`, người chịu trách nhiệm). Hết hạn thì gate lại báo. Người phụ trách bảo mật duyệt qua pull request; người xin không tự duyệt. Trạng thái hiện tại: không có ngoại lệ |
| Bằng chứng | Artifact `osv-scanner-sarif` (SARIF 2.1.0) của mỗi lần chạy, giữ 30 ngày; log job. Artifact của repo public ai đăng nhập cũng tải được: báo cáo SCA không chứa secret nhưng cho biết phiên bản đang dùng |
| Triage và thời hạn xử lý | Lỗ hổng mức Critical trong dependency production: xử lý trong 7 ngày hoặc ghi ngoại lệ có lý do; High: 14 ngày; Medium: 30 ngày; Low: vào backlog (bảng SLA duy nhất của khóa học, `docs/frameworks/remediation-sla.md`). Pull request của Dependabot được xem trong tuần. Thêm thư viện production mới: theo bảng đánh giá ở Bài 2 và ADR |
| Căn cứ framework | NIST SSDF 1.1: PW.4.1 (lấy và duy trì thành phần bên thứ ba có bảo mật), PW.4.4 Ex. 2 (tự động phát hiện lỗ hổng đã biết trong toolchain), RV.1.1 Ex. 3 (tự động rà soát dữ liệu thành phần để tìm lỗ hổng mới), PO.4.1 và PO.4.2 (tiêu chí và quyết định tự động). OWASP ASVS 5.0 V15.1.1 và V15.2.1 (L1). OpenSSF S2C2F: SCA-1, UPD-2, UPD-3 (ánh xạ của khóa học). NCCoE: SCA System là component của phase Develop và Build |

#### SBOM

| Hạng mục | Quy định |
|---|---|
| Công cụ và phiên bản | Syft v1.55.0, image `anchore/syft:v1.55.0@sha256:4cc92b64ca74ffca4c94d4c8fcc01f217731375300be14d0b6eeb2e82eaa110a`, workflow `sbom.yml`. Định dạng: CycloneDX 1.7 (JSON) và SPDX 2.3 (JSON). Công cụ đối chiếu: Trivy v0.76.1 (không chạy trong CI) |
| Chạy ở đâu | Mỗi lần merge vào `main` và mỗi pull request. SBOM sản phẩm gồm package npm production; không gồm `devDependencies`, không gồm action trong workflow |
| Điều kiện chặn | Job `sbom` fail khi: (1) `scripts/scvs-l1-check.sh` báo FAIL cho một trong SCVS 2.1, 2.3, 2.7, 2.9, 2.12, 2.14, hoặc (2) OSV-Scanner tìm thấy lỗ hổng chưa có trong `osv-scanner.toml` khi quét chính file SBOM (SCVS 2.8) |
| Lưu và giao | Artifact `sbom-rexcorp-app` giữ 90 ngày; SBOM đính kèm bản phát hành. Nội dung giao khách theo `docs/sbom/README.md`: phạm vi, ngày tạo |
| Mức SCVS đạt | L1 cho family V2 (SBOM): đạt 2.1, 2.3, 2.7, 2.9, 2.12, 2.14 và 2.8 theo cách kiểm ở trên. Chưa đạt: 2.2 (tạo tự động và tái lập được: mới có "tự động"), 2.4 và 2.5 (ký), 2.18 (hash). Các family V1, V3 đến V6 của SCVS chưa được đánh giá |
| Triage và thời hạn xử lý | SBOM sai hoặc thiếu so với lockfile (2.9 fail): sửa trong 3 ngày làm việc. Khách hàng báo thiếu trường: ghi vào backlog, trả lời trong 5 ngày làm việc |
| Căn cứ framework | NIST SSDF 1.1: PS.3.2 (thu thập, bảo vệ, duy trì và chia sẻ dữ liệu provenance của từng thành phần, ví dụ SBOM; Ex. 1 dùng định dạng chuẩn, Ex. 4 cập nhật mỗi khi thành phần đổi), PW.4.1 Ex. 3 (lấy provenance của thành phần và phân tích rủi ro), RV.1.1 Ex. 3. OWASP SCVS V2 L1. NCCoE: "Provenance Generation and Verification Tool (e.g., SBOM)" ở phase Build, Test, Release |

### Container image và cấu hình (module 06)

| Hạng mục | Quy định |
|---|---|
| Công cụ và phiên bản | Image: Trivy v0.76.1 (`ghcr.io/aquasecurity/trivy:0.76.1@sha256:790fd66d1697395d8693d1acaa1ea702406a20f109b6fc7bac8db623eca6c06c`; release immutable, chữ ký cosign xác minh trước khi pin). Dockerfile: hadolint v2.15.1 (`hadolint/hadolint:v2.15.1@sha256:32dac941…`) và Trivy config. Docker Compose: KICS v2.1.20 (`checkmarx/kics:v2.1.20@sha256:3e5a268e…`; không dùng tag `latest`, không dùng `kics-github-action`). Grype v0.121.0 chỉ để đối chiếu trong báo cáo, không phải gate |
| Chạy ở đâu | Workflow `.github/workflows/container.yml`: mọi `pull_request`, mọi push lên `main`, và lần chạy theo lịch thứ Hai hằng tuần 03:41 UTC (bắt CVE mới công bố sau khi build). Job `config-scan` (hadolint, Trivy config, KICS) và job `image-scan` (dựng image, `docker save`, Trivy quét từ file tar, không mount `docker.sock`) |
| Điều kiện chặn | `image-scan`: mọi finding HIGH hoặc CRITICAL **đã có bản vá** (`--ignore-unfixed`) không nằm trong `.trivyignore.yaml`, hoặc secret trong image. `config-scan`: hadolint từ mức warning; Trivy config từ mức HIGH; KICS từ mức HIGH. Mọi gate fail độc lập, một lần chạy cho thấy hết. Finding chưa có bản vá không chặn nhưng nằm trong `trivy-image-all.json` và được xem trong buổi triage hằng tuần |
| Baseline / ngoại lệ | `.trivyignore.yaml` ở gốc repo (đọc bằng `--ignorefile`). Mỗi mục bắt buộc có `id`, `statement` (lý do, người chịu trách nhiệm, điều kiện gỡ) và `expired_at`. `expired_at` chỉ là nơi Trivy thực thi một ngoại lệ đã duyệt: hạn không vượt trần của hạng (`docs/frameworks/remediation-sla.md`, mục 4) và người duyệt theo hạng (mục 5); người xin ngoại lệ không tự duyệt. Trivy **không** ép `expired_at`, nên người duyệt pull request kiểm tra từng mục. Hiện không có mục nào |
| Bằng chứng | Artifact `config-scan-reports` (SARIF của hadolint, Trivy config, KICS; JSON của KICS) và `image-scan-reports` (`trivy-image-all.json` đủ mọi mức, `trivy-image-gate.sarif`), giữ 30 ngày. Artifact của repo public ai đăng nhập GitHub cũng tải được: báo cáo không chứa secret (Trivy che giá trị) nhưng liệt kê gói và phiên bản |
| Triage và thời hạn xử lý | Người triage: người phụ trách bảo mật, hằng tuần sau lần chạy theo lịch. Có bản vá và gate đỏ: dựng lại image với base mới theo bảng SLA duy nhất của khóa học (`docs/frameworks/remediation-sla.md`): Critical 7 ngày, High 14 ngày, Medium 30 ngày; hạng Khẩn 3 ngày khi triage thấy dấu hiệu khai thác thật. Nghi báo nhầm: triage trong 3 ngày làm việc, ghi lý do vào `statement` |
| Quy tắc cấu hình | **Gate ép** (job `config-scan` đỏ): compose có `privileged`, mount `docker.sock` hoặc mount thư mục nhạy cảm của host (KICS, HIGH); `Dockerfile` kết thúc bằng `USER root` (Trivy config `DS-0002`, hadolint `DL3002`); `FROM` dùng tag `latest` (hadolint `DL3007`). **Luật review bằng mắt** (không công cụ nào ép ở ngưỡng hiện tại; người duyệt pull request phải kiểm): image chạy bằng user số (65532); không shell, không package manager; mọi `FROM` pin theo digest; không publish cổng ra mọi interface; có `cap_drop: [ALL]`, `read_only: true`, `no-new-privileges` (KICS chỉ báo MEDIUM cho ba cái đã đo, không chặn) |
| Căn cứ framework | Ánh xạ của khóa học vào NIST SSDF 1.1: PW.4.1 và PW.4.4 (thành phần bên thứ ba, phát hiện lỗ hổng đã biết trong toolchain), PW.9.1 (secure baseline), RV.1.1 và RV.2.2 (quét lại liên tục; quyết định sửa hay xử lý cách khác), PO.3 và PO.4 (công cụ trong toolchain, tiêu chí kiểm tra). Bản đồ pipeline NCCoE: Container Image Scanner và IaC Scanner là component của phase Build. ADR-0006 |

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
| 2026-10-08 | Kỹ sư DevOps phụ trách bảo mật | Thêm mục "SCA" (Lab 05a) |
| 2026-10-08 | Kỹ sư DevOps phụ trách bảo mật | Thêm mục "SBOM" (Lab 05b) |
| 2026-10-06 | Kỹ sư DevOps phụ trách bảo mật | Thêm mục "Container image và cấu hình" (Lab 06) |
