# SBOM của rexcorp-app

SBOM (software bill of materials: danh sách thành phần của phần mềm) của `rexcorp-app` do workflow `.github/workflows/sbom.yml` tạo ở mỗi lần merge vào `main` và mỗi pull request.

## Lấy SBOM ở đâu

- Artifact `sbom-rexcorp-app` của lần chạy workflow **SBOM** trên `main` (giữ 90 ngày; đây cũng là mức tối đa nếu không đổi thiết lập của repo). Gồm hai file: `rexcorp-app.cdx.json` (CycloneDX 1.7) và `rexcorp-app.spdx.json` (SPDX 2.3).
- Với bản phát hành (khi có tag), tải artifact của lần chạy trên commit được gắn tag rồi đính kèm vào release. Việc tự động hóa bước này và ký SBOM thuộc module 10.

## SBOM này nói gì và không nói gì

| Có | Không có |
|---|---|
| Mọi package npm trong `package-lock.json` (production), kèm phiên bản, purl, giấy phép khai báo, quan hệ phụ thuộc | `devDependencies` (không giao cho khách; công cụ build và test) |
| Dấu thời gian và mã định danh duy nhất của chính SBOM | Image container: base image Debian và Node.js. SBOM của image làm ở module 06 và 10 |
| Công cụ tạo SBOM (Syft 1.55.0) | Tên nhà cung cấp (supplier) của từng package: Syft ghi `NOASSERTION` cho package npm |
| | Hash của từng component (SCVS 2.18, mức L3) |
| | Chữ ký của SBOM (SCVS 2.4, 2.5, mức L2) |

## Khi khách hàng hỏi

1. Gửi file CycloneDX hoặc SPDX theo định dạng họ yêu cầu (cả hai đều do cùng một lần chạy tạo ra, nên nhất quán).
2. Nói rõ phạm vi bằng bảng trên: SBOM mô tả dependency production của ứng dụng, chưa gồm lớp hệ điều hành của image.
3. Ghi rõ ngày tạo (`metadata.timestamp`). Lỗ hổng mới công bố sau ngày đó sẽ không có trong bất kỳ báo cáo nào đi kèm; khách hàng nên quét lại SBOM bằng công cụ của họ.
4. Không gửi artifact của lần chạy pull request chưa merge.
