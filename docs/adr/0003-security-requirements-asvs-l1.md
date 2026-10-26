# ADR-0003: Requirement bảo mật của `rexcorp-app` lấy từ ASVS 5.0.0 L1, chọn 10 requirement theo threat

## Bối cảnh

Product muốn thêm đăng nhập và tải file lên `rexcorp-app`. Threat model (Lab 03) cho ra 17 threat (`docs/threat-model/threat-model.md`). Với các threat chọn Mitigate, đội cần requirement mà người ngoài kiểm lại được; CTO hỏi "làm xong theo chuẩn nào?". Pipeline hiện có control cho secret (module 02) nhưng chưa có gì về quyền truy cập, đầu vào, file, dependency.

Ràng buộc: nhóm 4 người, không ngân sách mua công cụ, mỗi requirement phải có cách kiểm tra dựng được bằng công cụ miễn phí trong khóa này (SAST, SCA, DAST, test tự viết, review).

Các phương án:

1. Viết requirement tự do ("hệ thống phải an toàn").
2. Lấy OWASP Top 10:2025 làm danh sách yêu cầu.
3. Fork OWASP ASVS 5.0.0 L1, chọn requirement theo threat.
4. Áp toàn bộ ASVS 5.0.0 L2 (253 requirement gồm L1 và L2).

## Quyết định

Chúng tôi sẽ dùng phương án 3: bản fork ASVS 5.0.0 trong `SECURITY-REQUIREMENTS.md`, gồm 10 requirement: 9 requirement L1 (`v5.0.0-8.2.1`, `8.2.2`, `6.3.1`, `2.2.1`, `5.2.1`, `5.3.2`, `15.2.1`, `13.4.1`, `1.2.1`) và 1 requirement L2 (`v5.0.0-13.3.1`) chọn có chủ đích vì module 02 đã dựng control cho nửa đầu của nó. Cùng với hai requirement tài liệu hóa đi kèm (`v5.0.0-15.1.1`, `v5.0.0-6.1.1`). Áp dụng cho `rexcorp-app` từ 2026-10-06. Tiêu chí chọn: (1) có threat đi kèm, (2) có cách kiểm tra, (3) requirement của tính năng chưa có mã được viết trước và chặn merge tính năng đó.

## Căn cứ (ID điều khoản framework)

| Framework / tài liệu | ID điều khoản | Nội dung liên quan | Link |
|---|---|---|---|
| OWASP ASVS 5.0.0 | Chương "What is the ASVS?", mục Which level to achieve và Forking | Tổ chức tự chọn level theo rủi ro; "Forking should start with ASVS Level 1 as a baseline" | <https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x03-What-is-the-ASVS.md> |
| OWASP ASVS 5.0.0 | `v5.0.0-8.2.1`, `8.2.2` | "function-level access is restricted to consumers with explicit permissions"; "data-specific access ... IDOR and BOLA" | file CSV chính thức v5.0.0 |
| OWASP ASVS 5.0.0 | `v5.0.0-5.2.1`, `5.3.2` | Giới hạn kích thước file; đường dẫn file do server tự sinh ("internally generated or trusted data") | như trên |
| OWASP ASVS 5.0.0 | `v5.0.0-15.1.1`, `15.2.1` | Thời hạn xử lý dependency phải được ghi tài liệu ("documented update and remediation time frames") | như trên |
| OWASP ASVS 5.0.0 | `v5.0.0-13.3.1` (L2) | Secret không nằm trong mã nguồn hay artifact build; có giải pháp quản lý secret | như trên |
| OWASP Top 10:2025 | Mục "Using the OWASP Top 10 as a standard" | "it is the bare minimum and just a starting point"; ASVS "is designed to be verifiable and tested" | <https://owasp.org/Top10/2025/0x03_2025-Establishing_a_Modern_Application_Security_Program/> |
| NIST SSDF 1.1 | PO.1.2 (trang 5) | "Identify and document all security requirements for organization-developed software to meet, and maintain the requirements over time." Ánh xạ của khóa học: `SECURITY-REQUIREMENTS.md` là tài liệu đó ở mức ứng dụng | <https://doi.org/10.6028/NIST.SP.800-218> |
| NIST SSDF 1.1 | PW.1.1, PW.1.2 (trang 11) | Dùng threat modeling để đánh giá rủi ro; "Track and maintain the software's security requirements, risks, and design decisions" | như trên |

SSDF 1.1 không nói gì về ASVS 5.0 (nó trích ASVS 4.0.3); việc chọn ASVS 5.0 làm nguồn requirement cho PO.1.2 là lựa chọn của khóa học.

## Requirement đã cân nhắc và chưa chọn

| Requirement ASVS 5.0.0 | Level | Threat liên quan | Lý do chưa chọn | Điều kiện xem lại |
|---|---|---|---|---|
| `5.2.2` kiểm tra đuôi và nội dung file ("magic bytes") | L1 | T-15 | Chưa có thiết kế tải file: chưa biết loại file nào được phép | Trước khi merge tính năng tải file (SEC-007) |
| `5.3.1` file tải lên không bị thực thi như mã server | L1 | T-15 | Như trên. Container chạy `read_only` và không có handler file tĩnh giúp giảm rủi ro hôm nay | Như trên |
| `12.2.1` TLS cho mọi kết nối tới dịch vụ HTTP bên ngoài | L1 | T-08 | Thuộc hạ tầng triển khai; compose chỉ publish `127.0.0.1`, `SECURITY.md` cấm deploy ra Internet | Khi có môi trường chạy thật (khóa 2) |
| `2.4.1` chống tự động hóa quá mức | L2 | T-06 | L2; threat Medium. Không thuộc L1 nên chấp nhận có ghi nhận | Trước khi expose ra mạng (SEC-004) |
| `16.3.1` ghi log mọi thao tác xác thực | L2 | T-05 | Chapter V16 không có requirement L1; chưa có đăng nhập thì log chưa gắn được danh tính | Cùng lúc làm đăng nhập (SEC-006) |
| `6.2.1`, `7.2.4` mật khẩu và phiên | L1 | T-11 | Chưa chọn cơ chế đăng nhập; chọn sau khi có thiết kế | Cùng thiết kế đăng nhập (SEC-003) |
| `3.4.1` HSTS | L1 | T-08 | Cần TLS ở lớp triển khai | Cùng `12.2.1` |
| Toàn bộ chapter V10 (OAuth, OIDC), V17 (WebRTC) | L1, L2 | Không có | Ứng dụng không dùng | Khi có OAuth |

## Trade-off

| Phương án | Được | Mất |
|---|---|---|
| Requirement tự do | Nhanh viết | Không kiểm được, không ai tranh luận được bằng ID; không có căn cứ ngoài ý kiến |
| Top 10 làm danh sách | Dễ nhớ, dễ nói với khách hàng | Là tài liệu nhận thức, không phải requirement kiểm chứng được; chính OWASP khuyên không dùng làm chuẩn |
| **Fork ASVS 5.0.0 L1 theo threat (10 requirement)** | Mỗi requirement kiểm được, có ID và phiên bản; gắn trực tiếp với threat; module sau tái sử dụng | Bỏ nhiều requirement L1 và hầu hết L2, kể cả logging; phải bảo trì ma trận và đọc kỹ nguyên văn |
| Toàn bộ ASVS L2 | Phủ rộng | 253 requirement cho nhóm 4 người; phần lớn chưa kiểm được bằng công cụ hiện có; bị bỏ dở |

Ghi chú về giấy phép: ASVS là CC BY-SA 4.0. Repo này chỉ trích ngắn từng requirement kèm ID và link, không chép toàn bộ danh sách.

## Hậu quả

- `SECURITY-REQUIREMENTS.md` và `docs/security-traceability.md` là tài liệu sống; mẫu pull request nhắc cập nhật khi DFD đổi.
- Việc tiếp theo, người phụ trách là kỹ sư DevOps phụ trách bảo mật: SEC-003 (đăng nhập), SEC-004 (rate limit và giới hạn bộ nhớ), SEC-005 (REQ-10: mã hóa đầu ra, kiểm bằng SAST ở module 04 khi có route trả HTML), SEC-006 (log), SEC-007 (điều kiện merge tải file), SEC-008 (SCA và bảng thời hạn xử lý ở module 05). Chi tiết ở `docs/security-backlog.md`.
- Rủi ro còn lại được chấp nhận: threat T-05, T-06, T-08 không có requirement L1 hoặc chưa có control. T-15 và T-16 là threat High còn Open, nên tính năng tải file và đăng nhập bị chặn merge cho tới khi bổ sung requirement tương ứng. T-17 (mạo danh nhà phát triển) nằm ngoài ASVS, xử lý ở module 09.
- Xem lại khi: Product chốt thiết kế đăng nhập hoặc tải file; thêm frontend; ASVS phát hành bản mới (5.0.1 chỉ có thể xóa hoặc nới lỏng requirement; bản 5.1 có thể thêm hoặc bớt và cần đánh giá lại).

## Trạng thái / Ngày

- Trạng thái: accepted
- Ngày: 2026-10-06
- Người quyết định: kỹ sư DevOps phụ trách bảo mật, CTO đồng ý
