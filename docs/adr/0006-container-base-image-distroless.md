# ADR-0006: Dùng distroless Debian 13 (nonroot) làm base image giai đoạn chạy của rexcorp-app

## Bối cảnh

Image rexcorp-app dựng trên node:24.22.1-bookworm-slim cho 244 finding Trivy (229 chưa có bản vá, 15 nằm trong npm của image Node). Tôi quét 5 ứng viên ngày 2026-10-26 bằng Trivy v0.76.1:

| Base | Gói OS | Finding | H+C | Đã vá |
|---|---|---|---|---|
| bookworm-slim | 88 | 244 | 62 | 4 |
| trixie-slim | 79 | 177 | 48 | 4 |
| alpine | 19 | 15 | 5 | 4 |
| distroless-debian12 | 10 | 71 | 7 | 6 |
| distroless-debian13 | 14 | 31 | 0 | 0 |

Grype trên distroless-debian13 báo 11 phát hiện High chưa có bản vá (Trivy xếp Medium).

## Quyết định

Chúng tôi sẽ dùng gcr.io/distroless/nodejs24-debian13:nonroot pin digest cho giai đoạn cuối của rexcorp-app từ 2026-10-26.

## Căn cứ (ID điều khoản framework)

| Framework / tài liệu | ID điều khoản | Nội dung liên quan | Link |
|---|---|---|---|
| NIST SSDF 1.1 | PW.4.1 | "Acquire and maintain well-secured software components" (ánh xạ của khóa học: base image là thành phần bên thứ ba) | https://doi.org/10.6028/NIST.SP.800-218 |
| NIST SSDF 1.1 | PW.4.4 | tự động phát hiện lỗ hổng đã biết trong toolchain | https://doi.org/10.6028/NIST.SP.800-218 |

## Trade-off

| Phương án | Được | Mất |
|---|---|---|
| distroless-debian13 | 14 gói, 0 finding đã vá (theo Trivy), image 56 MB | không shell, Dockerfile 2 giai đoạn, phụ thuộc dự án bên ngoài |
| bookworm-slim | dễ debug | 88 gói, ngoại lệ phải gia hạn |

## Hậu quả

Người phụ trách bảo mật sở hữu digest; Dependabot đề xuất digest mới (chưa chạy thử). "0 HIGH" chỉ theo Trivy. Xem lại khi Node.js 24 hết hỗ trợ (2028-04-30).

## Trạng thái / Ngày

- Trạng thái: accepted
- Ngày: 2026-10-26
- Người quyết định: học viên p1
