## Thay đổi

<!-- Mô tả ngắn: thay đổi gì và vì sao. Liên kết issue nếu có. -->

## Threat model nhẹ (2 phút)

Đánh dấu nếu thay đổi này làm một trong các việc sau. Nếu có ít nhất một dấu, cập nhật `docs/threat-model/` và `SECURITY-REQUIREMENTS.md` trong cùng pull request, hoặc ghi lý do không cần.

- [ ] Thêm hoặc đổi route (đường dẫn, phương thức HTTP)
- [ ] Thêm tác nhân hoặc hệ thống bên ngoài mới (người dùng mới, dịch vụ gọi tới, dịch vụ ta gọi)
- [ ] Thêm kho dữ liệu hoặc loại dữ liệu mới (database, file, bộ nhớ đệm, log)
- [ ] Thêm hoặc đổi cách xác thực, phân quyền
- [ ] Thêm dependency, đổi image hoặc quyền chạy của container

Lý do nếu đánh dấu nhưng không cập nhật threat model, hoặc nếu không đánh dấu ô nào mà vẫn thấy rủi ro:

<!-- ... -->

## Kiểm tra

- [ ] `npm test` xanh
- [ ] `scripts/verify-requirements.sh` không có FAIL
- [ ] Không có secret (hook và job `secret-scan` xanh)
