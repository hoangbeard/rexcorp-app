# Bản đồ gate của `rexcorp-app`

Đáp án tham khảo của Bước 6, Lab 08. Mở sau khi bạn đã tự lập bản của mình. Mỗi hàng là một **check** (một job có thể làm đỏ pull request); sáu **control** quét (secret, SAST, SCA, SBOM, container và cấu hình, DAST) tạo ra 10 trong 12 check, hai check còn lại là test/build và sổ ngoại lệ. Cột "Điểm mù" lấy từ giới hạn mà chính các lab 02 đến 07 đã quan sát được; hàng nào là suy luận tổng hợp thì không có ví dụ riêng trong lab.

| Check (tên job) | Rủi ro nó bắt | Chồng lấn với | Điểm mù | Tất định theo repo? | Chặn |
|---|---|---|---|---|---|
| Secret scan (Gitleaks) | Secret nằm trong lịch sử Git của nhánh (Lab 02: key giả trong `src/config.js`) | Push protection của GitHub (chỉ biết pattern của GitHub); secret scanning của GitHub | Secret không khớp pattern của Gitleaks; secret ngoài Git (biến môi trường, log, image) | Có (cùng commit, cùng cấu hình) | Merge |
| Test (Node.js) | Hồi quy chức năng | Verify security requirements (một phần) | Mọi lỗi mà test không mô tả | Có | Merge |
| Build container image | Dockerfile không dựng được | Image scan (cùng dựng image) | Image dựng được nhưng không an toàn | Có | Merge |
| SAST (Semgrep CE) | Mẫu mã nguy hiểm: XSS phản xạ, `eval`, nối chuỗi SQL (Lab 04) | Verify requirements (REQ-04 kiểm XSS); DAST thấy XSS phản xạ từ ngoài vào | Taint chỉ trong một file, không qua file; lỗi logic nghiệp vụ; rule `p/default` tải mỗi lần chạy nên bộ rule trôi | Phần lớn (rule của repo: có; `p/default`: trôi) | Merge (ERROR) |
| SCA (OSV-Scanner) | Lỗ hổng đã biết trong dependency của `package-lock.json` (Lab 05a) | Dependency review (cùng nguồn advisory, khác phạm vi); Image scan (gói trong image) | Thư viện chép tay (jQuery trong `vendor/` mà OSV-Scanner không thấy, Retire.js thấy); binary nhúng; lỗ hổng chưa có advisory | **Trôi** (cơ sở dữ liệu advisory đổi hằng ngày) | Merge; lần chạy theo lịch bắt trôi trước |
| Dependency review | Thay đổi **của pull request này** đưa vào lỗ hổng từ high hoặc giấy phép ngoài danh sách | SCA (lỗ hổng); chỉ nó kiểm giấy phép | Chỉ xét phần thay đổi: nợ đã có không thấy; phụ thuộc vào đồ thị dependency của GitHub | Gần như (chỉ phần thay đổi), nhưng advisory vẫn trôi | Merge |
| SBOM (Syft) | SBOM thiếu trường SCVS L1 hoặc SBOM chứa lỗ hổng chưa trong baseline | SCA (cùng quét lỗ hổng, nhưng trên SBOM) | SBOM quét thư mục mã nguồn (`scan dir:`), không quét image, nên không có gói hệ điều hành; chỉ mô tả cái Syft thấy; không chứng minh nội dung image đúng | Phần SCVS: có; phần lỗ hổng: trôi | Merge |
| Dockerfile and compose (hadolint, Trivy config, KICS) | Cấu hình sai: chạy root, `latest`, cổng, quyền (Lab 06) | Image scan (một số lỗi cấu hình image); KICS và Trivy config chồng nhau trên compose | Không có luật ép ghim digest (KICS MEDIUM, DL3066 mức info); không thấy cấu hình runtime ngoài file | Có (tool ghim; bộ rule đi theo phiên bản) | Merge |
| Image scan (Trivy) | CVE của gói trong image đã có bản vá, secret trong image | SCA (gói npm); Grype chỉ để đối chiếu | Binary Node.js (Bước 2 của lab, trên image `node:12-alpine` của `rexcorp-legacy`: Trivy không thấy, Grype thấy); finding chưa có bản vá bị `--ignore-unfixed` bỏ qua | **Trôi** (cơ sở dữ liệu Trivy) | Merge; lần chạy theo lịch bắt trôi |
| DAST (ZAP baseline và API scan) | Header thiếu, cookie, lỗi phản hồi nhìn từ ngoài vào (Lab 07) | SAST (XSS, redirect: cùng lỗi, hai góc nhìn) | Phần cần đăng nhập, SPA, điều chỉ có ở production (HSTS); kết quả có lúc không ổn định giữa các lần chạy | **Trôi nhẹ** (rule ZAP, spider) | Merge (rule `FAIL`) |
| Verify security requirements | Requirement ASVS kiểm được bằng máy không còn đạt | SAST, DAST (một số requirement trùng) | Requirement chỉ kiểm bằng tay (`MANUAL`, `GAP`) | Có | Merge |
| Exceptions register | Ngoại lệ thiếu trường, tự duyệt, quá hạn, vượt trần | Không có (chỉ check này kiểm sổ) | Kiểm hình thức, không kiểm lý do có hợp lý | Có, trừ yếu tố **ngày** (ngoại lệ hết hạn làm job đỏ dù code không đổi) | Merge; chạy cả theo lịch |

## Điểm mù cộng gộp

Ngay cả khi cả 12 check xanh, các loại lỗi sau không check nào bắt (suy luận tổng hợp từ các lab 02 đến 07):

1. **Lỗi logic nghiệp vụ và phân quyền** (ví dụ người dùng A đọc dữ liệu của B): không có mẫu mã để SAST khớp, ZAP baseline không hiểu ngữ nghĩa. Đây là việc của threat model (Lab 03) và review.
2. **Phần của ứng dụng chỉ chạy sau đăng nhập**: DAST ẩn danh không thấy.
3. **Lỗ hổng chưa có advisory** (zero-day) và thư viện chép tay hay binary nhúng mà công cụ chọn không nhận ra.
4. **Rủi ro của chính pipeline** (action bị chiếm, token quá quyền): các check trên không quét workflow; đó là nội dung module 09.

## Bỏ một check: mất gì?

| Nếu bỏ | Lọt vào `main` mà **không check nào khác** bắt | Check khác bắt được một phần |
|---|---|---|
| Dependency review | Giấy phép ngoài danh sách (MIT, ISC, BSD, Apache-2.0) | Lỗ hổng vẫn bị SCA bắt, nhưng ở lần quét toàn lockfile |
| Verify security requirements | Requirement ASVS kiểm bằng máy mà không rule SAST/DAST nào trùng | SAST và DAST bắt một phần |
| Image scan (Trivy) | CVE của gói hệ điều hành trong base image (SCA chỉ đọc `package-lock.json`) | Không có |
| Exceptions register | Ngoại lệ tự duyệt, quá hạn, vượt trần: gate vẫn xanh vì file bỏ qua của công cụ đã che finding | Không có; chỉ người duyệt qua CODEOWNERS |
| DAST | Lỗi chỉ thấy khi ứng dụng chạy (header, cookie) | SAST bắt một phần mã dẫn tới lỗi |

Hàng "Image scan" và "Exceptions register" là hai check **không thể thay**. Hàng "Dependency review" nhắc rằng một check chồng lấn vẫn có phần riêng (giấy phép).

## Tất định hay trôi: chặn merge hay giữ release

- **Tất định theo repo** (Gitleaks, test, build, hadolint, KICS, rule Semgrep của repo, requirements, exceptions): chặn merge.
- **Trôi theo dữ liệu bên ngoài** (SCA, Dependency review phần advisory, Image scan, SBOM phần lỗ hổng, rule ZAP, `p/default` của Semgrep): vẫn chặn merge vì CVE mới trong thứ sắp phát hành đúng là thứ cần chặn, nhưng cái giá là một pull request không liên quan có thể đỏ. Giảm tác hại: ghim phiên bản công cụ, `--ignore-unfixed`, chạy theo lịch để bắt sớm, xử lý theo hạng (sửa hoặc ngoại lệ có người duyệt).
- **KEV, EPSS**: không chặn merge; quyết định hạng và hạn; có thể **giữ release** khi còn P1 chưa xử lý.
