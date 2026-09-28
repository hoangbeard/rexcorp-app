# ADR-0001: Pin mọi GitHub Action theo full commit SHA

## Bối cảnh

`rexcorp-app` vừa có workflow CI đầu tiên (`.github/workflows/ci.yml`), dùng hai action của repo khác: `actions/checkout` và `actions/setup-node`. Runner tải code của action về lúc job chạy, rồi chạy nó trong job, cạnh mã nguồn và `GITHUB_TOKEN`. Cách viết phổ biến trên mạng là `uses: actions/checkout@v7`.

Tag là con trỏ tới commit, và nó dời được. Bằng chứng trong chính lab:

- Ngày 2026-10-05, `git ls-remote` cho thấy `v7` của `actions/setup-node` trỏ `820762786…` (cùng commit với `v7.0.0`). Ngày 2026-10-23, `v7` trỏ `949feb24…`, cùng commit với `v7.1.0` (phát hành 2026-10-08). Ai viết `@v7` đã tự nhận code mới mà không sửa workflow.
- `v7` của `actions/checkout` trỏ cùng commit với `v7.0.1`, không phải `v7.0.0`.

Rủi ro không chỉ là lý thuyết. Tháng 3/2025, kẻ tấn công sửa nhiều tag của `tj-actions/changed-files` để trỏ tới commit độc, làm lộ secret trong log của các repo public. Tháng 3/2026, 76 trong 77 tag của `aquasecurity/trivy-action` bị force-push sang mã độc; bản `0.35.0`, một immutable release, không bị ảnh hưởng.

GitHub có **immutable releases**: khi nhà phát hành bật tính năng này, tag của release bị khóa vào một commit và không dời được. Nhưng đó là thiết lập của **nhà phát hành**, không phải của chúng tôi. Ngày 2026-10-23, API releases của GitHub ghi `immutable=true` cho `actions/setup-node` v7.1.0 nhưng `immutable=false` cho `actions/checkout` v7.0.1. Tag major như `v7` không gắn với một release cố định, nên vẫn dời theo mỗi bản mới.

Các phương án đã cân nhắc:

1. Pin theo tag major (`@v7`).
2. Pin theo tag đầy đủ (`@v7.0.1`), dựa vào immutable releases nếu nhà phát hành bật.
3. Pin theo full commit SHA, kèm comment tên tag (`@3d3c42e… # v7.0.1`).
4. Workflow dependency lockfile (`.github/workflows/actions.lock`) của GitHub: đang ở public preview.

## Quyết định

Chúng tôi sẽ pin mọi action trong `.github/workflows/` của `rexcorp-app` theo full commit SHA (40 ký tự), kèm comment tên phiên bản trên cùng dòng, từ ngày 2026-10-23. Repo bật thiết lập "Require actions to be pinned to a full-length commit SHA" để GitHub từ chối action chưa pin. Workflow được kiểm tra bằng actionlint và zizmor trước khi push.

## Căn cứ (ID điều khoản framework)

| Framework / tài liệu | ID điều khoản | Nội dung liên quan | Link |
|---|---|---|---|
| NIST SSDF 1.1 | PO.3.2, Example 7 | "Regularly verify the integrity and check the provenance of each tool" (trang 7). Ánh xạ của chúng tôi: action là một "tool" của toolchain; SSDF không nhắc SHA | <https://doi.org/10.6028/NIST.SP.800-218> |
| NCCoE DevSecOps, mô hình tham chiếu | §2.2.2 | Phase Develop: "pinned dependencies via immutable identifiers (e.g., cryptographic hashes)" | <https://pages.nist.gov/nccoe-devsecops/notational-reference-model.html> |
| GitHub Docs, Secure use reference | Using third-party actions | "Pin references to actions to a commit SHA in your workflow files"; "a tag can be moved or deleted if a bad actor gains access to the repository storing the action" (truy cập 2026-10-23) | <https://docs.github.com/en/actions/reference/security/secure-use> |
| GitHub Docs, Immutable releases | Git tag | Tag của immutable release "cannot be changed"; chỉ áp dụng khi nhà phát hành bật | <https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases> |
| GHSA-mrrh-fwg8-r2c3 | tj-actions/changed-files | Tag bị sửa để trỏ tới commit độc, lộ secret trong log | <https://github.com/advisories/GHSA-mrrh-fwg8-r2c3> |

## Trade-off

| Phương án | Được | Mất |
|---|---|---|
| Tag major `@v7` | Tự nhận bản vá; dễ đọc | Code chạy trong CI đổi mà không ai review (đã thấy với setup-node ngày 2026-10-08); dính đúng kiểu tấn công sửa tag |
| Tag đầy đủ `@v7.0.1` | Dễ đọc; không dời được **nếu** release là immutable | Phụ thuộc thiết lập của từng nhà phát hành: `actions/checkout` v7.0.1 không immutable; phải kiểm từng action, mỗi lần nâng phiên bản |
| **Full SHA + comment** | Bất biến, không phụ thuộc nhà phát hành; zizmor và thiết lập repo kiểm được | Khó đọc hơn; Dependabot **không** tạo alert bảo mật cho action pin theo SHA, chỉ cho action dùng semantic versioning; phải cập nhật SHA bằng quy trình |
| Lockfile `actions.lock` | Không cần SHA trong workflow; ghi cả dependency bắc cầu và danh tính repo nguồn | Đang public preview, "subject to change"; thêm một công cụ (`gh actions-lock`) cho đội mới bắt đầu |

Bù lại phần mất của phương án được chọn: bật Dependabot version updates cho `github-actions`. Dependabot mở pull request cập nhật action, và từ 10/2022 cập nhật cả comment phiên bản cạnh SHA. Cái giá là mỗi pull request cập nhật cần một người review (ước tính vài phút mỗi tháng với 2 action).

## Hậu quả

- Mọi pull request thêm action mới phải dùng full SHA; actionlint và zizmor chạy trước khi push.
- Việc tiếp theo: bật Dependabot version updates cho `github-actions` (người phụ trách: kỹ sư DevOps, hạn 2026-11-30).
- Rủi ro còn lại được chấp nhận: SHA trỏ tới đúng commit của repo gốc nhưng commit đó đã chứa mã độc từ trước. Giảm bằng cách chỉ dùng action từ nhà phát hành đáng tin và đọc diff của mỗi pull request cập nhật.
- Xem lại quyết định khi lockfile của GitHub ra bản chính thức, hoặc sau 6 tháng (2027-04-30).

## Trạng thái / Ngày

- Trạng thái: accepted
- Ngày: 2026-10-23
- Người quyết định: kỹ sư DevOps phụ trách bảo mật, CTO đồng ý
