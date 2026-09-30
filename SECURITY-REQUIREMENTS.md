# Yêu cầu bảo mật của `rexcorp-app`

Đây là bản fork ASVS của RexCorp cho `rexcorp-app`: danh sách requirement chọn từ OWASP ASVS **5.0.0** (05/2025), mỗi requirement gắn với một threat trong threat model và có cách kiểm tra. Nội dung requirement lấy từ file CSV chính thức của ASVS 5.0.0 (https://github.com/OWASP/ASVS, thẻ `v5.0.0_release`); phần tiếng Việt là **diễn giải** của RexCorp, không phải bản dịch chính thức. Giấy phép ASVS: CC BY-SA 4.0.

| Mục | Giá trị |
|---|---|
| Ứng dụng | `rexcorp-app` v0.1.0 và tính năng đề xuất: đăng nhập, tải file |
| Chuẩn và phiên bản | OWASP ASVS 5.0.0; luôn ghi ID kèm phiên bản: `v5.0.0-x.y.z` |
| Level mục tiêu | L1, cộng một requirement L2 (REQ-09) chọn có chủ đích; REQ-10 thuộc nhóm V1 (mã hóa đầu ra), là chỗ module 04 (SAST) nối vào |
| Người phụ trách | Kỹ sư DevOps phụ trách bảo mật |
| Người duyệt | CTO |
| Cập nhật lần cuối | 2026-10-06 |
| Threat model | [`docs/threat-model/threat-model.md`](docs/threat-model/threat-model.md) |
| Ma trận truy vết | [`docs/security-traceability.md`](docs/security-traceability.md) |
| Quyết định chọn và bỏ | [`docs/adr/0003-security-requirements-asvs-l1.md`](docs/adr/0003-security-requirements-asvs-l1.md) |

## Cách đọc

- **Mức gate:** *Chặn*: job đỏ thì không merge. *Cảnh báo*: job báo nhưng không chặn. *Kiểm tay*: người review theo danh sách. *Chưa áp dụng*: tính năng chưa tồn tại; điều kiện merge tính năng đó ghi ở mục "Điều kiện merge".
- **Trạng thái:** *Đạt* (đã kiểm), *Chưa đạt* (có mã backlog), *Chưa áp dụng* (kèm lý do), *Một phần*.
- Kiểm tra bằng máy: `scripts/verify-requirements.sh` (chạy trong CI bằng workflow `requirements-check.yml`).

## Danh sách requirement

| ID | ASVS | Level | Diễn giải của RexCorp | Threat | Cách kiểm tra | Mức gate | Trạng thái |
|---|---|---|---|---|---|---|---|
| REQ-01 | `v5.0.0-8.2.1` | L1 | Mọi route, trừ `/healthz`, chỉ dùng được khi người gọi có quyền tường minh. ASVS: "function-level access is restricted to consumers with explicit permissions" | T-01, T-02 | Test tích hợp: gọi không xác thực phải nhận 401 hoặc 403 (script, module 08) | Cảnh báo hôm nay; chặn khi có đăng nhập | Chưa đạt (SEC-003) |
| REQ-02 | `v5.0.0-8.2.2` | L1 | Người dùng chỉ truy cập được file và ghi chú của mình, kể cả khi đổi mã trong URL (IDOR). ASVS: "data-specific access is restricted to consumers with explicit permissions to specific data items" | T-12 | Test tích hợp với hai người dùng (viết cùng tính năng; module 08) | Chưa áp dụng; chặn khi có tải file | Chưa áp dụng (SEC-007) |
| REQ-03 | `v5.0.0-6.3.1` (cần `6.1.1`) | L1 | Có giới hạn số lần thử đăng nhập theo tài khoản và theo nguồn, đúng như tài liệu `6.1.1` bên dưới; không để kẻ tấn công khóa tài khoản người khác | T-11 | Test tích hợp: quá số lần thử bị làm chậm hoặc từ chối; review tài liệu (module 08) | Chưa áp dụng; chặn khi có đăng nhập | Chưa áp dụng (SEC-003) |
| REQ-04 | `v5.0.0-2.2.1` | L1 | Dữ liệu đầu vào dùng để ra quyết định nghiệp vụ hoặc bảo mật được kiểm theo allowlist (giá trị, mẫu, phạm vi). Hôm nay: `category`, `author`, `text`, giới hạn body 10 KB | T-03 | `test/app.test.js`; script; SAST (module 04) | Chặn | Đạt |
| REQ-05 | `v5.0.0-5.2.1` | L1 | Chỉ nhận file có kích thước xử lý được mà không làm giảm hiệu năng hay gây từ chối dịch vụ; giới hạn ghi ở mục "Quyết định tài liệu hóa" | T-14 | Test tích hợp: file vượt giới hạn bị từ chối (module 08) | Chưa áp dụng; chặn khi có tải file | Chưa áp dụng (SEC-007) |
| REQ-06 | `v5.0.0-5.3.2` | L1 | Đường dẫn lưu file do server tự sinh; không ghép tên file người dùng gửi vào đường dẫn. ASVS: "uses internally generated or trusted data" | T-13 | Test tích hợp với tên file `../../x`; SAST cho `path.join` (module 04) | Chưa áp dụng; chặn khi có tải file | Chưa áp dụng (SEC-007) |
| REQ-07 | `v5.0.0-15.2.1` (cần `15.1.1`) | L1 | Ứng dụng không chứa dependency vượt thời hạn xử lý đã ghi trong bảng SLA bên dưới (bảng duy nhất của khóa học) | T-10 | SCA theo bảng thời hạn (module 05); gate (module 08) | Kiểm tay hôm nay; chặn từ module 08 | Chưa kiểm (SEC-008) |
| REQ-08 | `v5.0.0-13.4.1` | L1 | Ứng dụng không phục vụ và image không chứa siêu dữ liệu nguồn như `.git`, `.svn` | T-07 | `curl` các đường dẫn và `ls` trong image (script); DAST (module 07) | Chặn | Đạt |
| REQ-09 | `v5.0.0-13.3.1` | **L2** | Secret không nằm trong mã nguồn hay artifact build, và có giải pháp quản lý secret (hôm nay: secret của GitHub Actions). Chọn dù là L2, vì module 02 đã dựng control cho nửa đầu | T-09 | Gitleaks: pre-commit, CI (module 02). Phần "giải pháp quản lý secret" kiểm tay | Chặn (phần mã nguồn); kiểm tay (phần còn lại) | Một phần |
| REQ-10 | `v5.0.0-1.2.1` | L1 | Dữ liệu của người dùng đưa vào HTTP response (HTML, XML) được mã hóa theo đúng ngữ cảnh đầu ra. ASVS: "output encoding for an HTTP response, HTML document, or XML document is relevant for the context required". Hôm nay API chỉ trả JSON; khi có route trả HTML (ví dụ trang tìm kiếm ở Lab 04) thì requirement này có hiệu lực | T-04 | SAST bắt mẫu ghép dữ liệu người dùng vào HTML (module 04); test XSS phản xạ; DAST (module 07) | Chưa áp dụng hôm nay; chặn từ module 04 (SAST, mức ERROR) | Chưa áp dụng (SEC-005) |

Chú ý REQ-09: Gitleaks chỉ kiểm được một nửa requirement, và có thể bỏ sót secret entropy thấp (xem Lab 03, Bước brownfield). Trạng thái "Một phần" là có chủ đích.

## Quyết định tài liệu hóa (requirement tài liệu hóa đi kèm)

### Thời hạn xử lý dependency (ASVS `v5.0.0-15.1.1`, đi cùng REQ-07)

Bảng thời hạn **duy nhất** của khóa học, dùng chung với module 05 và 08: trang "Bảng thời hạn xử lý lỗ hổng (SLA)" của khóa học (`docs/frameworks/remediation-sla.md` trong repo khóa học). Tóm tắt, tính từ lúc phát hiện:

| Mức nghiêm trọng của lỗ hổng (dependency chạy trong image) | Thời hạn xử lý |
|---|---|
| Critical | 7 ngày |
| High | 14 ngày |
| Medium | 30 ngày |
| Low | Vào backlog, rà lại mỗi quý |
| Không có bản vá | Ghi ngoại lệ có hạn, người chịu trách nhiệm và biện pháp giảm nhẹ |

Triage (module 08) có thể kéo hạn ngắn lại (KEV: 3 ngày) hoặc, khi có lý do ghi lại, dài ra. Nợ có sẵn của repo brownfield là *ngoại lệ có thời hạn* do ADR duyệt, không phải vi phạm SLA.

### Chống nhồi mật khẩu (ASVS `v5.0.0-6.1.1`, đi cùng REQ-03)

Quyết định cho tính năng đăng nhập (chưa có mã): giới hạn 5 lần thử sai trong 15 phút cho mỗi tài khoản, và cho mỗi địa chỉ nguồn; sau đó làm chậm tăng dần thay vì khóa vĩnh viễn, để kẻ tấn công không khóa được tài khoản người khác. Cấu hình cụ thể ghi lại trong ADR của tính năng đăng nhập.

### Giới hạn tải file (đi cùng REQ-05)

Quyết định cho tính năng tải file (chưa có mã): mỗi file tối đa 5 MB, tối đa 20 file mỗi người dùng; loại file được phép chốt cùng thiết kế (xem ADR-0003, mục requirement chưa chọn).

## Điều kiện merge cho tính năng đăng nhập và tải file

Pull request thêm đăng nhập chỉ được merge khi: REQ-01 và REQ-03 có test tích hợp trong CI và `scripts/verify-requirements.sh` báo PASS cho REQ-01.

Pull request thêm tải file chỉ được merge khi: REQ-02, REQ-05, REQ-06 có test tích hợp trong CI; đã bổ sung requirement về kiểm tra loại và nội dung file và về cách phục vụ file (xem ADR-0003) vào danh sách này; threat model DFD-2 đã được cập nhật theo thiết kế thật.

## Lịch sử thay đổi

| Ngày | Người sửa | Thay đổi |
|---|---|---|
| 2026-10-06 | Kỹ sư DevOps phụ trách bảo mật | Tạo file: 10 requirement ASVS 5.0.0 (9 L1, 1 L2), Lab 03 |
| 2026-10-25 | Kỹ sư DevOps phụ trách bảo mật | Thêm REQ-10 (`v5.0.0-1.2.1`) cho T-04, để module 04 nối vào; dùng bảng SLA duy nhất |
