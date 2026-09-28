# Backlog bảo mật của rexcorp-app

Danh sách việc bảo mật đã biết nhưng chưa xử lý xong. Mỗi mục có người phụ trách và hạn. Đóng mục nào thì ghi ngày đóng và bằng chứng.

| ID | Mô tả | Mức độ | Người phụ trách | Hạn | Trạng thái |
|---|---|---|---|---|---|
| SEC-001 | Commit "Thêm cấu hình dịch vụ thông báo" ghi thẳng API key của dịch vụ thông báo vào `src/config.js`. Commit sau đã đổi sang biến môi trường `NOTIFY_API_KEY`, nhưng key vẫn nằm trong lịch sử git. CI vẫn xanh: pipeline chưa có control nào phát hiện secret | Cao | Kỹ sư DevOps phụ trách bảo mật | Module 02 | Mở |
