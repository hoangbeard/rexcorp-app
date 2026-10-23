# Chính sách bảo mật

## Phạm vi

`rexcorp-app` là ứng dụng mẫu của khóa học DevSecOps Nền tảng (RexLearn). RexCorp là công ty hư cấu.

- Trạng thái ban đầu của repo không cố ý chứa lỗ hổng.
- Các nhánh và pull request do khóa học cung cấp ở module sau **cố ý** chứa lỗi (secret giả, dependency cũ, mã dễ bị tấn công) để luyện tập. Những lỗi đó không cần báo cáo.
- Không có phiên bản nào được hỗ trợ cho môi trường production. Không deploy ứng dụng này ra Internet.

## Báo cáo lỗ hổng

Nếu bạn tìm thấy lỗ hổng *ngoài* các bài tập cố ý (ví dụ: lỗi trong trạng thái ban đầu của repo, hoặc một secret thật bị lộ):

1. **Không** mở issue công khai và không đưa chi tiết khai thác vào pull request.
2. Nếu repo đã bật *private vulnerability reporting*, vào tab **Security** của repo rồi chọn **Report a vulnerability**.
3. Nếu chưa bật, mở một issue chỉ để hỏi chủ repo kênh liên lạc riêng, không kèm chi tiết lỗ hổng.

## Secret

Mọi "secret" xuất hiện trong bài tập của khóa học là chuỗi giả, không dùng được với dịch vụ thật. Nếu bạn lỡ commit một secret thật, hãy thu hồi (revoke) nó ngay ở nhà cung cấp; xóa khỏi lịch sử git là chưa đủ.
