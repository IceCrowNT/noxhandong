# Tài liệu bàn giao (Handoff)

Tài liệu này ghi nhận trạng thái môi trường và dữ liệu hiện hành để bàn giao cho lập trình viên mới. Cập nhật lần cuối vào giữa tháng 7/2026.

## 1. Trạng thái dự án hiện hành

Dự án hiện đang vận hành ổn định ở **Phase 2** trên môi trường Production (VPS).

- **Domain chính:** `https://noxhandong.vn`
- **Môi trường Deploy:** Windows Server (VPS).
- **Service App:** Next.js chạy qua `nssm` (Windows Service).
- **Service HTTPS:** Caddy làm Reverse Proxy và tự cấp SSL.
- **Database:** PostgreSQL (cài đặt trực tiếp trên VPS).
- **Sao lưu (Backup):** Tự động backup dump Database, đồng bộ file Excel vận hành và bằng chứng Zalo lên Google Drive vào 2:00 sáng mỗi ngày qua Rclone.

## 2. Nguồn dữ liệu thật

- **Opening Balance (Mốc số dư ban đầu):** Dữ liệu chốt đến ngày 31/05/2026 (File Excel theo dõi thu phí T5). Toàn bộ 934 căn hộ đã được nạp và đối soát thành công.
- **Vận hành thực tế:** Từ tháng 6/2026 trở đi, mọi dữ liệu được nạp vào hệ thống thông qua việc Import Sao Kê ngân hàng. Admin duyệt sao kê trực tiếp trên web và chốt dữ liệu để tạo Public Snapshot cho cư dân tra cứu.
- **Quy tắc Local & VPS:** Local là môi trường phát triển. VPS là môi trường thật. Dữ liệu trên VPS có thể được export ngược về Local để debug nghiệm thu, tuyệt đối KHÔNG thao tác ngược lại (xóa DB VPS và đè DB Local lên) trừ khi có chỉ thị trực tiếp từ Product Owner.

## 3. Tài khoản thử nghiệm (Môi trường Dev/Local)

Sau khi cài đặt môi trường và seed database ở máy Local, bạn có thể đăng nhập bằng tài khoản nội bộ sau:

- **Đường dẫn Admin:** `http://localhost:3000/admin/login`
- **Tên đăng nhập (hoặc Số điện thoại):** `admin` / `0904802553`
- **Mật khẩu:** (Xem trong biến `ADMIN_INITIAL_PASSWORD` tại file `.env`)
- **Phân quyền:** `SUPER_ADMIN`

## 4. Bắt đầu làm việc (Cho người mới)

Tuyệt đối tránh việc dựa vào lịch sử trò chuyện (Chat Logs) để nắm bắt dự án vì thông tin đã lỗi thời rất nhiều. Hãy làm theo trình tự sau:

1. Clone Repository.
2. Đọc file `docs/setup-may-moi-va-database.md` để tự dựng môi trường Node.js và PostgreSQL trên máy cá nhân.
3. Cấp thông tin cho file `.env` theo mẫu `.env.example`.
4. Chạy `npm install` và các lệnh khởi tạo database (`npm run prisma:migrate:deploy`, `npm run prisma:generate`).
5. Dùng lệnh `npm run dev` để chạy web kiểm thử.
6. Mở `docs/roadmap.md` để xem danh sách các Task hiện tại cần làm (Backlog).
