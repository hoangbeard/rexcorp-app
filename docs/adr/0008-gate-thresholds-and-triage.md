# ADR-0008: Thang triage bối cảnh > KEV > EPSS > CVSS, ngưỡng EPSS 0.04/0.008, KEV/EPSS không vào gate PR

## Bối cảnh

Dữ liệu 2026-10-26 (KEV 2026.10.23, EPSS v2026.06.15): 288 CVE của rexcorp-legacy, 2 trong KEV; số CVE theo ngưỡng EPSS: >0.5: 8, >=0.1: 20, >=0.04: 45, >=0.008: 164. EPSS cao nhất (y18n 0.69) được xếp P3 vì không đến được (npm ls + grep). Thời gian từng bước gate trên máy (rexcorp-app): Gitleaks 1.0 s, Semgrep 3.9 s, OSV 1.3 s, Trivy 1.0 s; chỉ là mô phỏng, chưa gồm khởi động runner. Phương án: (a) xếp theo CVSS; (b) KEV > EPSS > 0.5 của OWASP DevSecOps Guideline; (c) thang bối cảnh, KEV, EPSS, CVSS.

## Quyết định

Chúng tôi sẽ dùng (c): EPSS >= 0.04 và exposed -> P2, >= 0.008 -> P3; KEV theo bảng BOD 26-04. KEV và EPSS dùng ở triage thứ Hai hằng tuần, không đưa vào điều kiện chặn của pull request. Trần ngoại lệ: P1 14, P2 30, P3 90, P4/FP 6 tháng; người duyệt khác người xin.

## Căn cứ (ID điều khoản framework)

| Framework / tài liệu | ID điều khoản | Nội dung liên quan | Link |
|---|---|---|---|
| NIST SSDF 1.1 | PO.4.1, PO.4.2 | tiêu chí kiểm tra và tự động hóa quyết định (ánh xạ của khóa học) | https://doi.org/10.6028/NIST.SP.800-218 |
| NIST SSDF 1.1 | RV.2.1, RV.2.2 | phân tích rủi ro và quyết định sửa hay chấp nhận | https://doi.org/10.6028/NIST.SP.800-218 |
| FIRST EPSS | hướng dẫn chọn ngưỡng | ngưỡng 50% "is not sane" | https://www.first.org/epss/ |
| CISA BOD 26-04 | Table 1 | hạn theo KEV/exposed/automatable/impact | https://www.cisa.gov |

## Trade-off

| Phương án | Được | Mất |
|---|---|---|
| (c) thang bối cảnh/KEV/EPSS/CVSS | việc có căn cứ, 45 việc ở 0.04 làm được | cần người đọc bối cảnh; ngưỡng xem lại mỗi quý; gate PR không dùng KEV/EPSS nên CVE mới vào KEV chỉ bị bắt ở lần triage tuần |
| (b) EPSS > 0.5 | đơn giản | chỉ 8/288, bỏ qua qs 0.156 |

Tác động delivery: mô phỏng đường găng không đổi, tổng thời gian runner tăng; chưa đo change lead time.

## Hậu quả

Triage thứ Hai do DevOps; Retire.js và Grype chưa nằm trong workflow tự động (điểm mù). Xem lại ngưỡng mỗi quý.

## Trạng thái / Ngày

- Trạng thái: accepted
- Ngày: 2026-10-26
- Người quyết định: học viên p1 (mô phỏng CTO)
