# Archive của project

Thư mục này lưu các file đã ngừng sử dụng nhưng chưa được phép xóa vĩnh viễn.

## Quy tắc

- Không import, chạy hoặc tham chiếu runtime tới file trong `archive/`.
- File code được đổi sang đuôi `.archive` để TypeScript, Next.js và test runner không biên dịch.
- Mỗi nhóm archive phải có README ghi:
  - ngày chuyển;
  - lý do chuyển;
  - file thay thế;
  - bằng chứng file cũ không còn được sử dụng.
- Trước khi chuyển file phải kiểm tra:
  - import trong source code;
  - script trong `package.json`;
  - route/action/API;
  - test;
  - tài liệu vận hành.
- Chỉ xóa vĩnh viễn file trong archive khi chủ dự án duyệt rõ ràng.

