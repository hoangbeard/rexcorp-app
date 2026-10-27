<!--
Mục của Lab 08 trong SECURITY-GATE.md của rexcorp-app.
Cách dùng: trong SECURITY-GATE.md,
1. thay toàn bộ mục "## Quy tắc chung" (đang là bản tối thiểu) bằng ba mục "Quy tắc chung", "Triage và ưu tiên", "Ngoại lệ" dưới đây;
2. thêm mục "### Triage và ngoại lệ (module 08)" ngay trước "### Bảo vệ chính pipeline CI (module 09)";
3. thêm một dòng vào bảng "Lịch sử thay đổi":
   | 2026-10-07 | Kỹ sư DevOps phụ trách bảo mật | Hoàn thiện Quy tắc chung, thêm Triage và ưu tiên, Ngoại lệ (Lab 08, ADR-0008) |
Số check bắt buộc và tên job phụ thuộc workflow bạn đã thêm ở các lab 02 đến 07: sửa bảng cho đúng repo của bạn.
-->

## Quy tắc chung

### Gate là gì và chặn như thế nào

- **Gate** là một job CI có điều kiện chặn viết sẵn trong mục control bên dưới. Job fail (exit code khác 0) nghĩa là gate chặn. Tiêu chí chặn của từng control nằm ở hàng "Điều kiện chặn" của mục đó; file này là nơi duy nhất ghi chúng.
- Job đỏ chỉ ngăn được merge khi nó là **required status check** của nhánh `main`. Ruleset `main: security gates` ([`docs/rulesets/main-protection.json`](docs/rulesets/main-protection.json)) đòi: pull request bắt buộc; 1 approval, gồm code owner; commit mới đẩy lên thì hủy approval cũ và người đẩy commit cuối không tự duyệt; thảo luận phải được giải quyết; 12 check bắt buộc ở bảng dưới; nhánh phải cập nhật với `main`; cấm force push và xóa nhánh. Người học làm một mình dùng bản `main-protection-solo.json` (không bắt buộc approval, vì tác giả pull request không tự duyệt được pull request của mình).
- Check bắt buộc có trạng thái `success`, `skipped` hoặc `neutral` đều được tính là đạt. Workflow bị bỏ qua vì bộ lọc `paths` làm check kẹt ở "Pending" và chặn merge; một job bị bỏ qua bởi `if:` lại báo "Success" và im lặng cho qua. Vì vậy mọi workflow gate chạy trên **mọi** `pull_request` (không dùng bộ lọc `paths`), không có `if:` ở mức job làm bỏ qua job, và tên job là duy nhất trong cả repo (hai workflow cùng một tên job làm kết quả check mơ hồ). Job chỉ chạy theo lịch (triage) không đặt làm check bắt buộc.
- **Chặn merge và chặn release là hai việc khác nhau.** Check **chặn merge** có hai loại. (a) *Tất định theo repo*: kết quả chỉ phụ thuộc commit, phiên bản công cụ đã ghim và file baseline/ngoại lệ trong repo (Gitleaks, Semgrep với rule của repo, test, build, hadolint, KICS, kiểm tra requirement, sổ ngoại lệ): chạy lại cùng commit cho cùng kết quả. (b) *Trôi theo dữ liệu bên ngoài* (SCA, quét image, quét lỗ hổng của SBOM, DAST): vẫn chặn merge, vì một CVE mới trong thứ sắp phát hành đúng là thứ cần chặn, nhưng có thể đỏ dù pull request không đổi dòng nào liên quan. Giảm tác hại: ghim phiên bản công cụ, `--ignore-unfixed` cho image, lần chạy theo lịch bắt phần trôi trước khi pull request gặp nó; khi vẫn đỏ vì dữ liệu mới thì xử lý theo hạng (sửa, hoặc ngoại lệ có người duyệt), không tắt gate. EPSS và KEV đổi hằng ngày và quyết định *bao lâu* phải sửa, không quyết định merge, nên **không** nằm trong điều kiện chặn merge (ADR-0008); người triage có thể **giữ release** khi còn finding P1 chưa xử lý.

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
- Người triage xem kết quả `triage-enrichment.yml` mỗi ngày (job đỏ là tín hiệu KEV mới) và rà cả backlog mỗi thứ Hai; xếp hạng theo mục "Triage và ưu tiên", giao việc và ghi vào backlog.
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

1. **Bối cảnh và hạng mặc định.** Hạng mặc định theo mức nghiêm trọng công cụ báo (Critical và High: P2; Medium: P3; Low: P4). Thành phần có mặt trong sản phẩm chạy thật không (presence)? Không có mặt (ví dụ chỉ trong `devDependencies`): P4, ghi bằng chứng. Có mặt nhưng chắc chắn không đến được (reachability) trong cách chạy hiện tại: hạ **một bậc**, ghi bằng chứng. Hậu quả nếu bị khai thác (consequence). Chưa rõ thì coi như đến được và ghi "chưa rõ".
2. **CISA KEV.** Có trong KEV thì tra bảng bên dưới (bốn điểm: KEV, publicly exposed, automatable, technical impact). Kết quả "3 ngày" là P1; **KEV một mình không làm finding thành P1**, và KEV là sàn: không hạ dưới P2. Ô P3, P4 của bảng chỉ là gợi ý hạ, chỉ áp dụng khi bước 1 có bằng chứng. `Automatable` và `Technical Impact` lấy từ CISA Vulnrichment; `Publicly exposed` là tài sản của mình. Có bằng chứng viết ra và được người duyệt ký rằng đường khai thác không tồn tại ở cấu hình này: hạ một bậc (không hạ về P4), nếu vẫn chưa sửa kịp hạn của hạng mới thì ghi vào sổ ngoại lệ.
3. **EPSS** (CVE không thuộc KEV) chỉ dùng để **nâng** hoặc xếp thứ tự, **không bao giờ để hạ** Critical hoặc High. EPSS ≥ 0.04, đến được (hoặc chưa rõ) và tài sản publicly exposed: nâng lên **P2**. EPSS từ 0.008 trở lên: xếp trước trong cùng hạng. Ngưỡng là kết quả của ADR-0008; xem lại mỗi quý.
4. **CVSS.** Ghi kèm phiên bản và nhóm metric (ví dụ "CVSS v4.0 6.9, nhóm BT"; CVSS v3.1 thì ghi "Base"). Dùng để xếp thứ tự **trong cùng bậc** và khi không có EPSS. Không nhân CVSS với EPSS.
5. **Finding không có CVE** (secret, SAST, DAST, cấu hình): secret thật là P1 (runbook `docs/runbooks/leaked-secret.md`); các finding khác dùng cùng bảng bên dưới với `KEV = không`, và `Automatable`, `Technical Impact` do người triage đánh giá, ghi lý do.

Bảng bên dưới tóm tắt Table 1 của BOD 26-04 của CISA (cùng nội dung với cây quyết định "CISA BOD 26-04 Response Model" của CERT/CC SSVC). Hạng và hạn của repo này, theo mô hình hạn của khóa học (trang `docs/frameworks/remediation-sla.md` của repo khóa học; đổi con số thì đổi ở cả hai nơi): **P1** 3 ngày; **P2** 7 ngày nếu mức gốc là Critical, 14 ngày nếu High; **P3** 30 ngày; **P4** vào backlog, rà lại mỗi quý. "Forensic triage" nghĩa là ngoài việc xử lý còn phải kiểm tra tài sản có bị xâm phạm chưa.

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

Triage hằng ngày: khi `triage-enrichment.yml` đỏ, người triage đọc artifact `kev-epss`, xếp hạng CVE mới, cập nhật bảng triage (`docs/triage/`) và backlog, gom các finding cùng nguyên nhân gốc thành một việc. KEV hoặc EPSS vừa đổi hạng của một mục thì ghi ngày và lý do.

## Ngoại lệ

Quy định đầy đủ và các ngoại lệ đang hiệu lực nằm ở [`docs/security-exceptions.md`](docs/security-exceptions.md). Tóm tắt:

- Ngoại lệ là quyết định chấp nhận rủi ro **có thời hạn, có người chịu trách nhiệm, có người duyệt khác người xin**. Mỗi ngoại lệ có mã `EXC-NNNN`, lý do, biện pháp tạm thời, ngày duyệt, ngày hết hạn và nơi cấu hình công cụ thực thi nó; mã `EXC-NNNN` phải xuất hiện trong chính file cấu hình đó.
- Trần thời hạn từ ngày duyệt: P1 14 ngày, P2 30 ngày, P3 90 ngày, P4 và báo nhầm (FP) 6 tháng. Người duyệt: P1, P2 là CTO; P3 là trưởng nhóm phát triển; P4, FP là người phụ trách bảo mật (trưởng nhóm phát triển nếu chính người phụ trách bảo mật xin).
- Trần này là thời gian tối đa được **chấp nhận rủi ro vượt hạn SLA** của bậc, tính từ ngày duyệt; nó không thay bảng SLA duy nhất (`docs/frameworks/remediation-sla.md` của repo khóa học). Baseline brownfield (ngoại lệ tập thể Critical 30, High 60, còn lại 90 ngày) là một ngoại lệ riêng có ADR và kế hoạch trả nợ, không tính vào trần này.
- Gia hạn là một ngoại lệ mới, không sửa ngày của dòng cũ. Hết hạn mà chưa sửa thì job `Exceptions register` đỏ.
- Cơ chế của từng công cụ (`.gitleaksignore`, `nosemgrep`, `osv-scanner.toml`, `.trivyignore.yaml`, `.zap/rules.tsv`) chỉ là nơi thực thi; thời hạn tối đa và người duyệt theo mục này, không theo mặc định của công cụ.

### Triage và ngoại lệ (module 08)

| Hạng mục | Quy định |
|---|---|
| Công cụ và phiên bản | `scripts/kev-epss.sh` (bash, curl, jq; ghép CISA KEV và EPSS của FIRST) và `scripts/check-exceptions.sh` (bash, awk), workflow `triage-enrichment.yml` và `exceptions-check.yml`. KEV lấy từ `cisagov/kev-data` (bản sao chính thức của CISA, giấy phép CC0); EPSS lấy từ file CSV hằng ngày của FIRST (`epss_scores-current.csv.gz`). OSV-Scanner v2.6.0 pin digest như `dependency-scan.yml` (với `--config` rỗng để thấy cả lỗ hổng đã nằm trong baseline) |
| Chạy ở đâu | `Exceptions register`: mọi pull request, push lên `main`, và thứ Hai hằng tuần. `triage-enrichment.yml`: chỉ theo lịch hằng ngày (04:41 UTC) và chạy tay; không chạy trên pull request. Triage KEV mới trong ngày, rà cả backlog mỗi thứ Hai |
| Điều kiện chặn | `Exceptions register` fail khi có ngoại lệ đang hiệu lực mà thiếu trường, người xin cũng là người duyệt, quá hạn, vượt trần thời hạn của bậc, hoặc trỏ tới file không có thật. `triage-enrichment.yml` (không phải required check) fail khi có CVE trong KEV chưa nằm trong bản triage nào ở `docs/triage/`: tín hiệu để xếp hạng ngay |
| Baseline / ngoại lệ | Sổ `docs/security-exceptions.md`; mỗi ngoại lệ có mã `EXC-NNNN`. Người phụ trách bảo mật duyệt qua `CODEOWNERS`; CTO duyệt P1 và P2. Hiện có 3 ngoại lệ (EXC-0001 đến EXC-0003) |
| Bằng chứng | Artifact `kev-epss` (TSV kèm ngày chạy, phiên bản KEV và mô hình EPSS), giữ 30 ngày; bảng triage trong `docs/triage/`; log job `Exceptions register` |
| Triage và thời hạn xử lý | Hạng và hạn như mục "Triage và ưu tiên" (P1 3 ngày; P2 7 ngày với Critical, 14 ngày với High; P3 30 ngày; P4 vào backlog), theo mô hình hạn của khóa học. Người triage xem tín hiệu KEV mỗi ngày và rà backlog mỗi thứ Hai; ngoại lệ còn dưới 14 ngày là WARN trong job, xử lý trong tuần |
| Căn cứ framework | Ánh xạ của khóa học vào NIST SSDF 1.1: PO.4.1 và PO.4.2 (tiêu chí kiểm tra, tự động ra quyết định, xem lại định kỳ), RV.1.1 (theo dõi lỗ hổng mới), RV.2.1 và RV.2.2 (phân tích rủi ro từng lỗ hổng, quyết định sửa hay chấp nhận). FIRST CVSS v4.0, EPSS và CISA KEV (bảng BOD 26-04) cho thang xếp bậc. OWASP SAMM I-SB-3-A và I-DM-2-A; Microsoft SDL 1.3 và 1.4 (bug bar, ngoại lệ có thời hạn). Bản đồ pipeline NCCoE: control gate; metric đo ở dimension Continuous Improvements, Security, and Monitoring |

