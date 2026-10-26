# ADR-0008: Ngưỡng gate, thang triage và quy tắc ngoại lệ

## Bối cảnh

Sáu control (secret, SAST, SCA, container, DAST, yêu cầu bảo mật) đã có gate, mỗi cái viết điều kiện chặn và cách ngoại lệ riêng. Đội phát triển `rexcorp-legacy` phàn nàn gate chặn release; backlog finding của repo cũ lên hàng trăm mục (một lần quét lockfile cho hơn 300 nhóm lỗ hổng, 176 CVE khác nhau); lãnh đạo hỏi pipeline có chậm đi không. Ba vấn đề cần một quy tắc chung:

1. **Điều kiện chặn một pull request** đang nằm rải rác trong từng mục của `SECURITY-GATE.md`, với sáu cơ chế ngoại lệ khác nhau (`.gitleaksignore`, `nosemgrep`, `osv-scanner.toml`, `.trivyignore.yaml`, `.zap/rules.tsv`, `.zap/progress.json`) và sáu quy định thời hạn khác nhau (30 ngày, 6 tháng).
2. **Thứ tự sửa** của backlog đang theo mức CVSS hoặc theo mức độ mà từng công cụ tự gán, trong khi bảng triage của Lab 08 cho thấy hai thứ đó lệch với xác suất bị khai thác và với bối cảnh của RexCorp.
3. Thiếu **người duyệt** thật sự cho ngoại lệ: ngoại lệ ở Lab 02 do chính người xin tự duyệt.

Dữ liệu của chính RexCorp (ngày 2026-10-07, 282 CVE từ báo cáo OSV-Scanner, Trivy, Grype và Retire.js của `rexcorp-legacy`; EPSS mô hình v2026.06.15):

| Ngưỡng EPSS | Số CVE vượt ngưỡng | Tỷ lệ |
|---|---|---|
| > 0.5 | 8 | 2,8% |
| ≥ 0.1 | 20 | 7,1% |
| ≥ 0.04 | 45 | 16,0% |
| ≥ 0.008 | 163 | 57,8% |

Các phương án cho thứ tự ưu tiên:

- **A. Theo CVSS:** chặn và sửa trước mức Critical/High.
- **B. Công thức "KEV > EPSS > 0.5 > critical đến được"** của OWASP DevSecOps Guideline.
- **C. Thang bối cảnh, KEV, EPSS, CVSS** với ngưỡng EPSS tự chọn từ dữ liệu của mình, và bảng của BOD 26-04 cho phần KEV.

## Quyết định

Chúng tôi sẽ áp dụng phương án **C** cho `rexcorp-app` và `rexcorp-legacy` từ 2026-10-07, với các quy tắc sau:

1. **Chặn merge tách khỏi quyết định hạn xử lý.** Check chặn merge dựa trên đầu ra của công cụ đã ghim và file baseline/ngoại lệ trong repo; các check có dữ liệu trôi (SCA, quét image, rule ZAP) vẫn chặn merge nhưng kèm biện pháp giảm tác hại (ghim phiên bản, `--ignore-unfixed`, chạy theo lịch, ngoại lệ có người duyệt thay vì tắt gate). **Không đưa EPSS và KEV vào điều kiện chặn của pull request**, vì hai nguồn này đổi hằng ngày và hai lần chạy cùng một commit có thể cho hai kết quả. KEV và EPSS dùng ở **triage theo lịch hằng ngày** (workflow `triage-enrichment.yml`, scripts/kev-epss.sh), vì hạn P1 chỉ có 3 ngày: quyết định hạng và hạn xử lý, và làm lần chạy theo lịch đỏ khi có CVE trong KEV chưa nằm trong bản triage nào.
2. **Thang xếp bậc** (chi tiết trong `SECURITY-GATE.md`): bối cảnh (có mặt, đến được, hậu quả) → KEV (tra bảng BOD 26-04) → EPSS với ngưỡng **0.04** (khoảng phân vị 90, tương đương công sức của CVSS Critical theo FIRST) và **0.008** (tương đương CVSS High trở lên) → CVSS chỉ để xếp thứ tự trong cùng bậc. Không nhân EPSS với CVSS.
3. **Hạng và hạn:** mô hình hạn duy nhất của khóa học (trang SLA): hạng mặc định theo mức nghiêm trọng (Critical, High: P2 với hạn 7 và 14 ngày; Medium: P3, 30 ngày; Low: P4, backlog); P1 3 ngày khi bảng BOD 26-04 cho "3 ngày"; KEV là sàn P2 và KEV một mình không là P1; hạ một bậc cần bằng chứng; EPSS chỉ để nâng. Hạn P1 mượn từ Table 1 của BOD 26-04; các hạn còn lại là đề xuất của khóa học khi dùng cho RexCorp.
4. **Ngoại lệ:** một sổ duy nhất `docs/security-exceptions.md`, kiểm bằng `scripts/check-exceptions.sh` trong workflow `Exceptions`. Trần thời hạn từ ngày duyệt: P1 14 ngày, P2 30 ngày, P3 90 ngày, P4 và báo nhầm (FP) 6 tháng. Người duyệt: P1, P2 là CTO; P3 là trưởng nhóm phát triển; P4, FP là người phụ trách bảo mật (trưởng nhóm phát triển nếu chính người phụ trách bảo mật xin). Người xin không tự duyệt. Ngoại lệ là cách duy nhất để vượt hạn của hạng. Baseline của repo cũ là một ngoại lệ tập thể riêng, có thời hạn và kế hoạch trả nợ.
5. **Ngăn merge:** hai ruleset (`docs/rulesets/main-protection.json` cho `rexcorp-app`, và bản brownfield cho `rexcorp-legacy`) đặt các job của gate làm required status check; `CODEOWNERS` đặt người phụ trách bảo mật duyệt các file policy.
6. **Triển khai dần** trên `rexcorp-legacy`: tuần 1 chỉ chạy báo cáo (advisory), tuần 2 chặn finding mới theo baseline, sau đó mới đặt required status check; thu nhỏ baseline theo hạn của bậc.

## Căn cứ (ID điều khoản framework)

| Framework / tài liệu | ID điều khoản | Nội dung liên quan | Link |
|---|---|---|---|
| NIST SSDF 1.1 | PO.4.1, PO.4.2 | PO.4.1 "Define criteria for software security checks and track throughout the SDLC"; PO.4.2 Ex. 3 "Automate decision-making processes utilizing the criteria, and periodically review these processes" (trang 8) | <https://doi.org/10.6028/NIST.SP.800-218> |
| NIST SSDF 1.1 | RV.2.1, RV.2.2 | RV.2.1 Ex. 2 tính rủi ro theo khả năng khai thác và tác động; RV.2.2 Ex. 1 "Make a risk-based decision as to whether each vulnerability will be remediated or if the risk will be addressed through other means (e.g., risk acceptance, risk transference)" (trang 17 đến 18) | như trên |
| FIRST, Using EPSS | Choosing a threshold; Combining EPSS with other signals | "how to set a threshold … is a very localized effort"; ngưỡng CVSS Critical tương đương khoảng phân vị 90 (≥ 0.04), CVSS High trở lên khoảng 0.008; KEV: "treat it as actively exploited and prioritize accordingly, regardless of EPSS score"; không nhân EPSS với CVSS | <https://www.first.org/epss/using-epss> |
| CISA, BOD 26-04 | Appendix A, Table 1 | Bốn điểm quyết định (Asset Exposure, KEV Status, Exploit Automation, Technical Impact) cho các hạn 3 ngày (có hoặc không kèm forensic triage), 14 ngày, 60 ngày, fix on system upgrade | <https://www.cisa.gov/news-events/directives/bod-26-04-prioritizing-security-updates-based-risk> |
| FIRST, CVSS v4.0 Specification | Nomenclature; Assessment | "Consumers of CVSS should enrich the Base metrics with Threat and Environmental metric values"; điểm phải ghi kèm CVSS-B, BT, BE hay BTE | <https://www.first.org/cvss/v4-0/specification-document> |
| OWASP SAMM v2.2.0 | I-SB-3-A; I-DM-2-A | I-SB-3-A: gate fail khi không đạt tiêu chí, ngoại lệ "explicitly approved first" và ghi lại kèm lý do; I-DM-2-A: định nghĩa SLA theo mức độ và quy trình khi không sửa kịp | <https://github.com/owaspsamm/core/tree/v2.2.0/model> |
| Microsoft SDL, Practice 1 | 1.3, 1.4 | Bug bar và quy trình ngoại lệ có thời hạn, có người duyệt theo mức rủi ro, có kế hoạch khắc phục và ngày hết hạn | <https://www.microsoft.com/en-us/securityengineering/sdl/practices/security-program-management> |
| DORA | Năm metric; Common pitfalls | "speed and stability are not tradeoffs"; cảnh báo "Setting metrics as a goal" | <https://dora.dev/guides/dora-metrics/> |

Ánh xạ là của khóa học: SSDF 1.1 không có task nào nói về EPSS, KEV hay hạn xử lý; PO.4 và RV.2 là hai chỗ gần nhất.

## Trade-off

| Phương án | Được | Mất |
|---|---|---|
| A. Theo CVSS | Đơn giản, công cụ nào cũng có điểm | CVSS-B "không phải rủi ro" và không nên dùng một mình để xếp ưu tiên (FAQ của CVSS v4.0); không phân biệt lỗ hổng đang bị khai thác với lỗ hổng chỉ nằm trên giấy; nhiều finding (SAST, secret, DAST) không có điểm |
| B. KEV > EPSS > 0.5 | Có sẵn công thức | Ngưỡng 0.5 không có trích dẫn trong guideline; FIRST nói đặt ngưỡng ở 50% là không hợp lý vì mức khai thác cơ bản chỉ khoảng 2 đến 3% (bỏ qua 98,8% CVE đã công bố); với dữ liệu của RexCorp chỉ 8 trên 282 CVE vượt 0.5 |
| **C. Thang bối cảnh, KEV, EPSS, CVSS** | Dựa vào tài liệu của FIRST và CISA; ngưỡng tự chọn có số liệu của chính mình (45 CVE ở 0.04, đủ làm trong một chu kỳ); phân biệt được "có mặt nhưng không đến được" | Cần người có thời gian đọc bối cảnh (khoảng 5 phút mỗi finding, ước lượng của người viết); EPSS và KEV đổi theo ngày nên bảng triage hết hạn; ngưỡng 0.04 và 0.008 cần xem lại mỗi quý |
| Đưa KEV/EPSS vào gate pull request | Gate "thông minh" hơn | Gate không tái lập được: cùng commit đỏ hôm nay, xanh hôm sau, hoặc ngược lại; một sự cố API EPSS làm kẹt merge |

Tác động lên delivery (số đo thật trên GitHub Actions, 2026-10-26, một pull request mỗi mốc; xem Bước 9 của Lab 08): trước khi có gate một pull request chờ 25 giây (2 job, 2 phút tính phí); sau Lab 07 chờ 90 giây (12 job, 13 phút tính phí), chuỗi dài nhất là job DAST (ZAP), không phải các công cụ quét tĩnh. Thời gian chờ tăng khoảng 3,6 lần và phút tính phí khoảng 6,5 lần; đây chưa phải thống kê nhiều lần chạy và không gồm thời gian xếp hàng. Bản đầu của ADR kết luận "không tăng đường găng" từ số đo laptop bỏ ZAP; kết luận đó sai và đã sửa. Hướng giảm nếu thành vấn đề: cache dữ liệu quét, gộp job nhỏ, ZAP đầy đủ theo lịch thay vì trên mọi pull request.

## Hậu quả

- `SECURITY-GATE.md` có mục "Triage và ưu tiên" và "Ngoại lệ"; mỗi lab sau cập nhật mục riêng của control, không thêm cơ chế ngoại lệ thứ bảy.
- Việc tiếp theo: bật ruleset `main: security gates` cho cả hai repo (kỹ sư DevOps phụ trách bảo mật, hạn 2026-10-14); đặt tên job duy nhất trong mọi workflow (repo cũ có hai job tên `Node.js`, nên chưa là required check).
- Rủi ro còn lại, chấp nhận có hạn: triage là việc thủ công (workflow chỉ báo tín hiệu KEV mới); `triage-enrichment.yml` chỉ đọc lockfile (OSV-Scanner), không thấy jQuery chép tay (Retire.js) hay binary Node.js (Grype), nên hai finding KEV đó phải được ghi tay vào bảng triage cho tới khi có nền tảng quản lý lỗ hổng tập trung (khóa 2).
- Xem lại quyết định này sau một quý (2027-01-07): thay ngưỡng EPSS dựa trên số finding vượt ngưỡng và số đã xử lý kịp hạn; hoặc ngay khi FIRST đổi hướng dẫn về ngưỡng, hay CISA đổi bảng của BOD 26-04 (CISA ghi sẽ đánh giá lại các hạn mỗi năm tài chính).

## Trạng thái / Ngày

- Trạng thái: accepted
- Ngày: 2026-10-07
- Người quyết định: kỹ sư DevOps phụ trách bảo mật; CTO đồng ý (duyệt P1 và P2 theo quy định này)
