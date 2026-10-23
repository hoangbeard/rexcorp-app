# rexcorp-app

API danh mục sản phẩm nội bộ của **RexCorp**, một công ty hư cấu. Đây là ứng dụng mẫu (tuyến greenfield) của khóa **DevSecOps Nền tảng** do RexLearn biên soạn.

> [!WARNING]
> **Repo này dùng cho mục đích học tập.** Ở trạng thái ban đầu, ứng dụng không cố ý chứa lỗ hổng. Ở các module sau, khóa học sẽ thêm những thay đổi *cố ý có lỗi* (secret giả, dependency cũ, mã dễ bị tấn công) qua các nhánh pull request để bạn tập phát hiện và chặn chúng bằng pipeline. Không dùng mã này cho môi trường thật, không deploy ra Internet, và chỉ chạy trên máy của bạn hoặc trong GitHub Actions.

## Ứng dụng làm gì

Một API JSON nhỏ viết bằng Node.js và Express. Dữ liệu nằm trong bộ nhớ (không có database), khởi động lại là về dữ liệu mẫu.

| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| `GET` | `/healthz` | Kiểm tra ứng dụng còn chạy |
| `GET` | `/api/products` | Danh sách sản phẩm; lọc bằng `?category=hardware` hoặc `?category=service` |
| `GET` | `/api/products/:id` | Chi tiết một sản phẩm |
| `GET` | `/api/products/:id/notes` | Ghi chú nội bộ của một sản phẩm |
| `POST` | `/api/products/:id/notes` | Thêm ghi chú: `{"author": "an.nguyen", "text": "..."}` |

## Yêu cầu

- Node.js 24 (LTS). Phiên bản ghi trong `.nvmrc` và trường `engines` của `package.json`.
- Docker Engine 28 trở lên hoặc Docker Desktop (nếu chạy bằng container).

## Chạy trên máy

```bash
npm ci        # cài đúng các phiên bản trong package-lock.json
npm test      # chạy test bằng test runner có sẵn của Node.js
npm start     # nghe ở http://127.0.0.1:3000
```

Thử gọi API ở một terminal khác:

```bash
curl http://127.0.0.1:3000/healthz
curl http://127.0.0.1:3000/api/products?category=hardware
```

## Chạy bằng Docker

```bash
docker compose up --build     # build image và chạy, cổng chỉ mở trên 127.0.0.1:3000
docker compose down           # dừng và xóa container
```

Hoặc không dùng Compose:

```bash
docker build -t rexcorp-app:local .
docker run --rm --init -p 127.0.0.1:3000:3000 rexcorp-app:local
```

## Cấu trúc

```text
src/app.js          định nghĩa route và kiểm tra dữ liệu đầu vào
src/store.js        dữ liệu trong bộ nhớ
src/server.js       khởi động HTTP server
test/app.test.js    test (node --test)
docs/adr/           decision record (ADR) của dự án, tạo từ Lab 01 theo mẫu templates/adr.md của repo khóa học
Dockerfile          image chạy bằng user không phải root, base image pin theo digest
compose.yaml        chạy local, chỉ bind 127.0.0.1
```

## Bảo mật

Xem [SECURITY.md](SECURITY.md).

## Giấy phép

MIT, xem [LICENSE](LICENSE). Đây là tài liệu khóa học của RexLearn.
