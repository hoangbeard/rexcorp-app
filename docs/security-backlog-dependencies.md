# Backlog dependency của rexcorp-app

Danh sách việc dependency đã biết nhưng chưa xử lý xong (module 05). Mỗi mục có người phụ trách và hạn. Đóng mục nào thì ghi ngày đóng và bằng chứng. Các mục SEC-001 và SEC-002 của module 02 nằm trong `docs/security-backlog.md`.

| ID | Mô tả | Mức độ | Người phụ trách | Hạn | Trạng thái |
|---|---|---|---|---|---|
| SEC-003 | Pull request "Thêm báo cáo tổng hợp theo danh mục" thêm `lodash` 4.17.20, bị gate SCA chặn (3 nhóm lỗ hổng, một mức High). Nâng lên 4.17.21 vẫn còn 2 nhóm; chỉ 4.18.1 sạch. Quyết định (ADR-0005): không thêm lodash, dùng `Object.groupBy` có sẵn | Cao | Kỹ sư DevOps phụ trách bảo mật | Module 05 | Đóng 2026-10-06. Bằng chứng: output gate đỏ rồi xanh; `package-lock.json` về đúng 66 package; ADR-0005 |
| SEC-004 | Bật Dependabot alerts và Dependabot security updates trên repo `rexcorp-app` (cài đặt trên giao diện GitHub, không nằm trong `dependabot.yml`) | Trung bình | Kỹ sư DevOps phụ trách bảo mật | Module 05 | Mở: chưa chạy thử (cần repo thật trên GitHub) |
| SEC-005 | Job `osv-scanner` (workflow Dependency scan) và job `dependency-review` chưa phải required status check của `main` | Trung bình | Kỹ sư DevOps phụ trách bảo mật | Module 08 | Mở |
