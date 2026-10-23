# ADR-0001: Pin mọi GitHub Action theo full commit SHA

## Bối cảnh

`ci.yml` của rexcorp-app dùng `actions/checkout` và `actions/setup-node`. Runner tải code của action theo ref trong `uses:` lúc chạy. Ngày 2026-10-23, `git ls-remote --tags https://github.com/actions/setup-node 'v7*'` cho thấy `v7` trỏ `949feb24…` (cùng `v7.1.0`), trong khi ngày 2026-10-05 nó trỏ `82076278…` (theo Bài 2): tag major đã dời. zizmor (Bước 3 Lab 01A) báo `unpinned-uses` x8 trên hai workflow mẫu.

Phương án: (1) tag major `@v7`; (2) tag đầy đủ `@v7.0.1`; (3) full SHA kèm comment phiên bản.

## Quyết định

Chúng tôi sẽ pin mọi `uses:` trong `.github/workflows/` của rexcorp-app theo full commit SHA (40 ký tự) kèm comment tên tag, từ 2026-10-23, và bật "Require actions to be pinned to a full-length commit SHA" ở mức repo.

## Căn cứ (ID điều khoản framework)

| Framework / tài liệu | ID điều khoản | Nội dung liên quan | Link |
|---|---|---|---|
| GitHub Docs, Secure use reference | Using third-party actions | "Pin references to actions to a commit SHA in your workflow files" | https://docs.github.com/en/actions/reference/security/secure-use |
| GitHub Docs, Finding and customizing actions | Using release management | tag "can be moved or deleted by the maintainer"; "SHAs are immutable" | https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/find-and-customize-actions |
| NCCoE DevSecOps live doc | §2.2.2 Develop | "pinned dependencies via immutable identifiers (e.g., cryptographic hashes)". Ánh xạ của tôi: action là một dependency của pipeline | https://pages.nist.gov/nccoe-devsecops/notational-reference-model.html (truy cập 2026-10-23) |
| NIST SSDF 1.1 | PO.3.2, Example 7 (trang 7) | "Regularly verify the integrity and check the provenance of each tool". Ánh xạ của tôi: action là một phần của toolchain | https://doi.org/10.6028/NIST.SP.800-218 |

## Trade-off

| Phương án | Được | Mất |
|---|---|---|
| `@v7` | Dễ đọc, tự nhận bản vá | Chạy code khác mà không ai review; bị tấn công kiểu tj-actions |
| `@v7.0.1` | Dễ đọc hơn SHA | Vẫn dời được nếu release không immutable (`actions/checkout` v7.0.1: `immutable=false` qua `gh api` ngày 2026-10-23) |
| **Full SHA** | Đúng một commit; thiết lập repo kiểm được | Không tự nhận bản vá bảo mật; dòng `uses:` khó đọc; phải có quy trình nâng SHA; SHA không nói commit đó sạch |

## Hậu quả

- Bật Dependabot cho `github-actions` (người phụ trách: tôi, hạn: module 05) và review diff mỗi PR cập nhật.
- Rủi ro còn lại: action gọi action khác theo tag (bắc cầu) chưa được kiểm soát. Xem lại khi workflow dependency lockfile của GitHub ra GA.

## Trạng thái / Ngày

- Trạng thái: accepted
- Ngày: 2026-10-23
- Người quyết định: p1 (kỹ sư phụ trách bảo mật)
