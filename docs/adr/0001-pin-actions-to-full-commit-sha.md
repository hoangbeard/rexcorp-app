# ADR-0001: Pin GitHub Actions theo full commit SHA

## Bối cảnh

`rexcorp-app` vừa có workflow CI đầu tiên (`.github/workflows/ci.yml`) dùng `actions/checkout` và `actions/setup-node`. Tag của action có thể bị dời: ngày 2026-10-22, `git ls-remote` cho thấy `actions/checkout` tag `v7` trỏ cùng commit với `v7.0.1` (`3d3c42e5…`), và `actions/setup-node` tag `v7` đã chuyển sang `v7.1.0` (`949feb24…`), không còn là `v7.0.0`. zizmor 1.30.1 báo 8 finding `unpinned-uses` (high) trên hai workflow mẫu ở Lab 01.

Phương án đã cân nhắc:

1. Pin theo tag major (`@v7`).
2. Pin theo tag đầy đủ (`@v7.0.1`).
3. Pin theo full commit SHA 40 ký tự, kèm comment tên tag.

## Quyết định

Chúng tôi sẽ pin mọi action trong `.github/workflows/` của `rexcorp-app` theo full commit SHA, kèm comment tên tag trên cùng dòng, từ ngày 2026-10-22. Repo bật "Require actions to be pinned to a full-length commit SHA". Workflow được kiểm tra bằng actionlint và zizmor trước khi commit.

## Căn cứ (ID điều khoản framework)

| Framework / tài liệu | ID điều khoản | Nội dung liên quan | Link |
|---|---|---|---|
| NIST SSDF 1.1 | PO.3.2, Example 7 (trang 7) | "Regularly verify the integrity and check the provenance of each tool". Ánh xạ của chúng tôi: action là một "tool" trong toolchain; SSDF không nhắc SHA | https://doi.org/10.6028/NIST.SP.800-218 |
| NCCoE DevSecOps, mô hình tham chiếu | §2.2.2 (Develop) | pin dependency bằng "immutable identifiers (e.g., cryptographic hashes)" | https://pages.nist.gov/nccoe-devsecops/ |
| GitHub Docs, Secure use reference | Using third-party actions | pin full SHA là "currently the only way to use an action as an immutable release" | https://docs.github.com/en/actions/reference/security/secure-use |
| Sự cố tj-actions/changed-files (03/2025) | GHSA-mrrh-fwg8-r2c3 | tag bị sửa trỏ tới commit độc, lộ secret trong log | https://github.com/advisories/GHSA-mrrh-fwg8-r2c3 |

## Trade-off

| Phương án | Được | Mất |
|---|---|---|
| `@v7` | Dễ đọc, tự nhận bản vá | Code chạy trong CI đổi mà không ai review (thấy ngay với setup-node v7 → v7.1.0) |
| `@v7.0.1` | Dễ đọc hơn SHA | Tag vẫn sửa được; zizmor vẫn báo `unpinned-uses` |
| **Full SHA + comment** | Bất biến; zizmor và thiết lập repo kiểm được | Khó đọc; Dependabot không tạo alert bảo mật cho action pin SHA; phải tự cập nhật SHA, mỗi PR cập nhật cần người review |

## Hậu quả

- Thêm Dependabot version updates cho `github-actions` (người phụ trách: kỹ sư DevOps, hạn: module 09).
- Rủi ro còn lại: SHA đã pin có thể chính là bản có lỗ hổng; cần theo dõi advisory.
- Xem lại khi GitHub có cơ chế action bất biến khác.

## Trạng thái / Ngày

- Trạng thái: accepted
- Ngày: 2026-10-22
- Người quyết định: kỹ sư DevOps (p1)
