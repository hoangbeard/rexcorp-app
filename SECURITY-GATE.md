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

### Gate là gì và chặn như thế nào

- **Gate** là một job CI có điều kiện chặn viết sẵn trong mục control bên dưới. Job fail (exit code khác 0) nghĩa là gate chặn. Tiêu chí chặn của từng control nằm ở hàng "Điều kiện chặn" của mục đó; file này là nơi duy nhất ghi chúng.
- Job đỏ chỉ ngăn được merge khi nó là **required status check** của nhánh `main`. Ruleset `main: security gates` ([`docs/rulesets/main-protection.json`](docs/rulesets/main-protection.json)) đòi: pull request bắt buộc; 1 approval, gồm code owner; commit mới đẩy lên thì hủy approval cũ và người đẩy commit cuối không tự duyệt; thảo luận phải được giải quyết; 12 check bắt buộc ở bảng dưới; nhánh phải cập nhật với `main`; cấm force push và xóa nhánh. Người học làm một mình dùng bản `main-protection-solo.json` (không bắt buộc approval, vì tác giả pull request không tự duyệt được pull request của mình).
- Check bắt buộc có trạng thái `success`, `skipped` hoặc `neutral` đều được tính là đạt. Workflow bị bỏ qua vì bộ lọc `paths` làm check kẹt ở "Pending" và chặn merge; một job bị bỏ qua bởi `if:` lại báo "Success" và im lặng cho qua. Vì vậy mọi workflow gate chạy trên **mọi** `pull_request` (không dùng bộ lọc `paths`), không có `if:` ở mức job làm bỏ qua job, và tên job là duy nhất trong cả repo (hai workflow cùng một tên job làm kết quả check mơ hồ). Job chỉ chạy theo lịch (triage) không đặt làm check bắt buộc.
- **Gate trên pull request phải tất định:** chỉ dựa vào đầu ra của công cụ và file baseline/ngoại lệ nằm trong repo. EPSS và KEV đổi hằng ngày nên **không** nằm trong điều kiện chặn của pull request (ADR-0008); chúng dùng ở triage hằng tuần.

| Check bắt buộc (tên job) | Workflow | Module | Chặn khi |
|---|---|---|---|
| Secret scan (Gitleaks) | `ci.yml` | 02 | Có secret mới trong lịch sử (không nằm trong `.gitleaksignore`) |
| Test (Node.js) | `ci.yml` | 01 | Test fail |
| Build container image | `ci.yml` | 01 | Dựng image fail |
| SAST (Semgrep CE) | `sast.yml` | 04 | Finding mức ERROR |
| SCA (OSV-Scanner) | `dependency-scan.yml` | 05 | Lỗ hổng chưa nằm trong `osv-scanner.toml` |
| Dependency review | `dependency-review.yml` | 05 | Thay đổi đưa vào lỗ hổng từ mức high hoặc giấy phép ngoài danh sách |
| SBOM (Syft) | `sbom.yml` | 05 | SCVS L1 có FAIL, hoặc SBOM có lỗ hổng chưa nằm trong baseline |
| Dockerfile and compose (hadolint, Trivy config, KICS) | `container.yml` | 06 | hadolint từ warning, Trivy config và KICS từ HIGH |
| Image scan (Trivy) | `container.yml` | 06 | HIGH hoặc CRITICAL đã có bản vá, hoặc secret trong image |
| DAST (ZAP baseline và API scan) | `dast.yml` | 07 | Rule `FAIL` trong `.zap/rules.tsv` |
| Verify security requirements | `requirements-check.yml` | 03 | Requirement kiểm được hôm nay mà không đạt |
| Exceptions register | `exceptions-check.yml` | 08 | Ngoại lệ thiếu trường, tự duyệt, quá hạn hoặc vượt trần thời hạn |

### Chỉ chặn finding mới, và chuyển từ cảnh báo sang chặn

- Repo mới (greenfield): mọi finding đều là finding mới, nên gate chặn ngay từ đầu.
- Repo cũ (brownfield): finding đã có nằm trong baseline (nợ đã biết, có mục backlog và hạn), gate chỉ chặn finding **mới**. Baseline chỉ được tạo lại để **bớt** mục, qua pull request do người phụ trách bảo mật duyệt, không bao giờ để "cho qua" một finding mới.
- Một gate mới đi qua ba giai đoạn: (1) **advisory**: chạy, lưu báo cáo, không chặn, đủ lâu để đo số finding và tỷ lệ báo nhầm; (2) **chặn finding mới**: fail với mọi finding ngoài baseline, chưa phải required check; (3) **required check**: ruleset đòi job xanh mới được merge. Sang giai đoạn sau khi giai đoạn trước chạy ổn trên ít nhất hai tuần pull request thật.

### Ai làm gì

- File policy (file này, `docs/security-exceptions.md`, `.gitleaksignore`, `osv-scanner.toml`, `.trivyignore.yaml`, `.zap/`, `.semgrep/`, workflow, ADR) do người phụ trách bảo mật duyệt qua `CODEOWNERS`. Người sửa file không tự duyệt thay đổi của mình.
- Người triage xem finding mỗi thứ Hai sau lần chạy theo lịch, xếp bậc theo mục "Triage và ưu tiên", giao việc và ghi vào backlog.
- Người chịu rủi ro kinh doanh (CTO) duyệt ngoại lệ P1 và P2.

### Đo lường

| Chỉ số | Cách lấy | Nhịp |
|---|---|---|
| Backlog theo bậc (P1 đến P4) và số mục quá hạn | Bảng triage, backlog | Hằng tuần |
| Thời gian xử lý trung vị theo bậc | Ngày mở và ngày đóng mục backlog | Hằng tháng |
| Tỷ lệ báo nhầm theo rule | Bảng triage của từng control (ví dụ `docs/sast-triage.md`) | Hằng tháng |
| Số ngoại lệ đang hiệu lực và tuổi trung bình | `scripts/check-exceptions.sh` | Hằng tuần |
| Tỷ lệ pull request có check bảo mật đỏ, và thời gian từ đỏ về xanh | `labs/scripts/lab-08-run-durations.sh` hoặc `gh run list` | Hằng tháng |
| Năm metric DORA (lead time, tần suất deploy, thời gian khôi phục, tỷ lệ deploy lỗi, tỷ lệ deploy phải làm lại) trước và sau khi bật gate | Công cụ đo của đội hoặc DORA Quick Check | Hằng quý |

Các chỉ số này để cải tiến quy trình, không phải mục tiêu để đạt: đặt chỉ số làm mục tiêu thì người ta sẽ làm đẹp chỉ số.

## Triage và ưu tiên

Mỗi finding còn mở được xếp vào một **bậc** để biết sửa lúc nào. Thang xếp bậc (ADR-0008):

1. **Bối cảnh.** Thành phần có mặt trong sản phẩm chạy thật không (presence)? Đường khai thác có đến được trong cách chạy hiện tại không (reachability)? Hậu quả nếu bị khai thác (consequence)? Không có mặt trong sản phẩm chạy thật (ví dụ chỉ trong `devDependencies`): bậc tối đa P4. Chưa rõ thì coi như đến được và ghi "chưa rõ".
2. **CISA KEV.** Có trong KEV thì tra bảng bên dưới (bốn điểm: KEV, publicly exposed, automatable, technical impact). `Automatable` và `Technical Impact` lấy từ CISA Vulnrichment; `Publicly exposed` là tài sản của mình. Có bằng chứng viết ra và được người duyệt ký rằng đường khai thác không tồn tại ở cấu hình này: hạ một bậc và ghi vào sổ ngoại lệ, không hạ về P4.
3. **EPSS** (CVE không thuộc KEV): ≥ 0.04 và đến được (hoặc chưa rõ), tài sản publicly exposed: **P2**; ≥ 0.04 nhưng chắc chắn không đến được hoặc tài sản không exposed: **P3**; từ 0.008 đến dưới 0.04: **P3**; dưới 0.008: **P4**. Ngưỡng là kết quả của ADR-0008; xem lại mỗi quý.
4. **CVSS.** Ghi kèm phiên bản và nhóm metric (ví dụ "CVSS v4.0 6.9, nhóm BT"; CVSS v3.1 thì ghi "Base"). Dùng để xếp thứ tự **trong cùng bậc** và khi không có EPSS. Không nhân CVSS với EPSS.
5. **Finding không có CVE** (secret, SAST, DAST, cấu hình): secret thật là P1 (runbook `docs/runbooks/leaked-secret.md`); các finding khác dùng cùng bảng bên dưới với `KEV = không`, và `Automatable`, `Technical Impact` do người triage đánh giá, ghi lý do.

Bảng bên dưới tóm tắt Table 1 của BOD 26-04 của CISA (cùng nội dung với cây quyết định "CISA BOD 26-04 Response Model" của CERT/CC SSVC). Khóa học đặt tên bậc: **P1** = 3 ngày, **P2** = 14 ngày, **P3** = 60 ngày (chỉ khi triage hạ bậc và ghi lý do; mặc định theo mức nghiêm trọng là Critical 7, High 14, Medium 30 ngày, Low vào backlog: bảng SLA duy nhất `docs/frameworks/remediation-sla.md` của repo khóa học), **P4** = khi nâng cấp hoặc dựng lại hệ thống; "forensic triage" nghĩa là ngoài việc xử lý còn phải kiểm tra tài sản có bị xâm phạm chưa.

| KEV | Publicly exposed | Automatable | Technical impact: partial | Technical impact: total |
|---|---|---|---|---|
| Không | Không | Không | P4 | P4 |
| Không | Không | Có | P3 | P3 |
| Không | Có | Không | P3 | P2 |
| Không | Có | Có | P2 | P1 |
| Có | Không | Không | P2 | P2 |
| Có | Không | Có | P2 | P1 và forensic triage |
| Có | Có | Không | P2 | P1 và forensic triage |
| Có | Có | Có | P1 | P1 và forensic triage |

BOD 26-04 ràng buộc cơ quan liên bang Mỹ; RexCorp mượn bảng làm điểm xuất phát vì chính FIRST gọi nó là "a model for other organizations to use or adapt". Hạn xử lý này là quy định nội bộ của RexCorp, không phải nghĩa vụ pháp lý.

Triage hằng tuần: sau lần chạy `triage-enrichment.yml`, người triage đọc artifact `kev-epss`, cập nhật bảng triage (`docs/triage/`) và backlog, gom các finding cùng nguyên nhân gốc thành một việc. KEV hoặc EPSS vừa đổi bậc của một mục thì ghi ngày và lý do.

## Ngoại lệ

Quy định đầy đủ và các ngoại lệ đang hiệu lực nằm ở [`docs/security-exceptions.md`](docs/security-exceptions.md). Tóm tắt:

- Ngoại lệ là quyết định chấp nhận rủi ro **có thời hạn, có người chịu trách nhiệm, có người duyệt khác người xin**. Mỗi ngoại lệ có mã `EXC-NNNN`, lý do, biện pháp tạm thời, ngày duyệt, ngày hết hạn và nơi cấu hình công cụ thực thi nó; mã `EXC-NNNN` phải xuất hiện trong chính file cấu hình đó.
- Trần thời hạn từ ngày duyệt: P1 14 ngày, P2 30 ngày, P3 90 ngày, P4 và báo nhầm (FP) 6 tháng. Người duyệt: P1, P2 là CTO; P3 là trưởng nhóm phát triển; P4, FP là người phụ trách bảo mật (trưởng nhóm phát triển nếu chính người phụ trách bảo mật xin).
- Trần này là thời gian tối đa được **chấp nhận rủi ro vượt hạn SLA** của bậc, tính từ ngày duyệt; nó không thay bảng SLA duy nhất (`docs/frameworks/remediation-sla.md` của repo khóa học). Baseline brownfield (ngoại lệ tập thể Critical 30, High 60, còn lại 90 ngày) là một ngoại lệ riêng có ADR và kế hoạch trả nợ, không tính vào trần này.
- Gia hạn là một ngoại lệ mới, không sửa ngày của dòng cũ. Hết hạn mà chưa sửa thì job `Exceptions register` đỏ.
- Cơ chế của từng công cụ (`.gitleaksignore`, `nosemgrep`, `osv-scanner.toml`, `.trivyignore.yaml`, `.zap/rules.tsv`) chỉ là nơi thực thi; thời hạn tối đa và người duyệt theo mục này, không theo mặc định của công cụ.

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

### Triage và ngoại lệ (module 08)

| Hạng mục | Quy định |
|---|---|
| Công cụ và phiên bản | `scripts/kev-epss.sh` (bash, curl, jq; ghép CISA KEV và EPSS của FIRST) và `scripts/check-exceptions.sh` (bash, awk), workflow `triage-enrichment.yml` và `exceptions-check.yml`. KEV lấy từ `cisagov/kev-data` (bản sao chính thức của CISA, giấy phép CC0); EPSS lấy từ file CSV hằng ngày của FIRST (`epss_scores-current.csv.gz`). OSV-Scanner v2.6.0 pin digest như `dependency-scan.yml` (với `--config` rỗng để thấy cả lỗ hổng đã nằm trong baseline) |
| Chạy ở đâu | `Exceptions register`: mọi pull request, push lên `main`, và thứ Hai hằng tuần. `triage-enrichment.yml`: chỉ theo lịch (thứ Hai 04:41 UTC) và chạy tay; không chạy trên pull request. Triage bằng tay mỗi thứ Hai sau đó |
| Điều kiện chặn | `Exceptions register` fail khi có ngoại lệ đang hiệu lực mà thiếu trường, người xin cũng là người duyệt, quá hạn, vượt trần thời hạn của bậc, hoặc trỏ tới file không có thật. `triage-enrichment.yml` (không phải required check) fail khi có CVE trong KEV: tín hiệu để xếp lại bậc ngay |
| Baseline / ngoại lệ | Sổ `docs/security-exceptions.md`; mỗi ngoại lệ có mã `EXC-NNNN`. Người phụ trách bảo mật duyệt qua `CODEOWNERS`; CTO duyệt P1 và P2. Hiện có 3 ngoại lệ (EXC-0001 đến EXC-0003) |
| Bằng chứng | Artifact `kev-epss` (TSV kèm ngày chạy, phiên bản KEV và mô hình EPSS), giữ 30 ngày; bảng triage trong `docs/triage/`; log job `Exceptions register` |
| Triage và thời hạn xử lý | Bậc P1 3 ngày, P2 14 ngày, P3 60 ngày (hạ bậc có lý do ghi trong triage), P4 khi nâng cấp. Mặc định theo mức nghiêm trọng: Critical 7, High 14, Medium 30 ngày, Low vào backlog (bảng SLA duy nhất của khóa học). Người triage xem hằng tuần; ngoại lệ còn dưới 14 ngày là WARN trong job, xử lý trong tuần |
| Căn cứ framework | Ánh xạ của khóa học vào NIST SSDF 1.1: PO.4.1 và PO.4.2 (tiêu chí kiểm tra, tự động ra quyết định, xem lại định kỳ), RV.1.1 (theo dõi lỗ hổng mới), RV.2.1 và RV.2.2 (phân tích rủi ro từng lỗ hổng, quyết định sửa hay chấp nhận). FIRST CVSS v4.0, EPSS và CISA KEV (bảng BOD 26-04) cho thang xếp bậc. OWASP SAMM I-SB-3-A và I-DM-2-A; Microsoft SDL 1.3 và 1.4 (bug bar, ngoại lệ có thời hạn). Bản đồ pipeline NCCoE: control gate; metric đo ở dimension Continuous Improvements, Security, and Monitoring |

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
| 2026-10-26 | Học viên (p1) | Hoàn thiện Quy tắc chung, thêm Triage và ưu tiên, Ngoại lệ (Lab 08, ADR-0008) |
