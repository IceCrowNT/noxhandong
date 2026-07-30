# Roadmap dự án

Cập nhật: 2026-07-28.

## Vai Trò

File này là bảng điều phối cấp cao. Chi tiết kỹ thuật nằm ở `module-map.md`, schema nằm ở `database.md`, quyết định UI nằm ở `design-system.md`.

## 1. Mục Tiêu Sản Phẩm

Xây dựng web app vận hành thu phí căn hộ cho BQT An Đồng:

1. Cư dân tra cứu trạng thái đóng phí và xem thông báo public không cần đăng nhập.
2. Admin/BQT nhập dữ liệu, duyệt sao kê ngân hàng, lưu bằng chứng, chốt public snapshot, xuất file vận hành.
3. Dữ liệu phí sau mốc T5/2026 được hình thành từ quyết định duyệt sao kê hoặc bổ sung có bằng chứng, không sửa tay trực tiếp trạng thái public.

## 2. Đã Hoàn Thành

### Nền tảng

- Next.js App Router, PostgreSQL, Prisma.
- Auth nội bộ với `SUPER_ADMIN`, `MANAGER`, `TECHNICIAN`.
- 934 căn hộ master trong `can_ho`.
- Public snapshot theo batch: `batch_trang_thai_phi_public`, `trang_thai_phi_can_ho_public`.
- Parser mã căn dùng chung cho public lookup, import và review sao kê.

### Public cư dân

- Trang chủ `/` có tra cứu nhanh, thông báo mới nhất và footer cư dân.
- `/tra-cuu-phi` có parser input tự nhiên, rate limit cơ bản, xử lý trường hợp mơ hồ một mã có nhiều hậu tố.
- Footer cư dân có đầu mối liên hệ, thông tin thanh toán QLVH, dialog danh bạ và nút góp ý/Zalo.
- Thông báo public hỗ trợ nội dung text, ảnh và PDF.
- PDF thông báo xem bằng `react-pdf`; ảnh xem trực tiếp trong dialog.

### Admin

- `/admin/dashboard`: dashboard/tra cứu nội bộ.
- `/admin/database`: tra cứu tài chính căn hộ, xuất báo cáo và danh sách thông báo. Hồ sơ tài chính căn hộ hiện dùng bảng compact, chỉ giữ trạng thái “Đã đóng đến” ở header.
- `/admin/import`: nhập sao kê, nhập/chốt Excel, bổ sung giao dịch quá khứ; form import có trạng thái tiến trình client.
- `/admin/import/public-preview`: preview batch trước public.
- `/admin/transactions/review`: duyệt giao dịch, phân bổ nhiều căn, lưu bằng chứng, rollback giao dịch chưa public.
- `/admin/contacts/review`: review danh bạ cư dân.
- `/admin/announcements`: tạo/công khai/ẩn thông báo public kèm PDF hoặc ảnh.
- `/admin/accounts`, `/admin/profile`: tài khoản nội bộ.

### Xuất file

- Excel báo cáo tiến độ phí.
- Excel sổ tháng FINAL.
- Excel sao kê tháng.
- Excel checklist thông báo/cắt điện.
- Word thông báo phí/cắt điện từ template.

## 3. Ưu Tiên Gần

1. Hoàn thiện phản ánh cư dân: thay `app/actions.ts` stub bằng luồng thật, tối thiểu lưu DB hoặc gọi webhook đã cấu hình qua env.
2. Kiểm tra lại `react-pdf` production: self-host worker nếu không muốn phụ thuộc CDN.
3. Tắt dần `typescript.ignoreBuildErrors`: sửa nợ type còn lại, bắt build fail khi có lỗi TS.
4. Hoàn thiện UI mobile cho `/admin/database` và `/admin/transactions/review`, ưu tiên không overflow ngang và không card lồng card.
5. Chuẩn hóa quyền menu admin: ẩn/hiện mục theo role và theo permission source duy nhất.
6. Hoàn thiện rollback/gỡ duyệt nâng cao cho giao dịch đã public theo quy trình có audit.
7. Dọn dữ liệu/file test trong `public/uploads` sau khi xác nhận với chủ dự án.

## 4. Rủi Ro Chính

- Public file upload phải chặn path traversal và không public dữ liệu cá nhân nhạy cảm.
- Sao kê import trùng ngày/file có thể sinh dữ liệu thô dư; cần dựa vào mã tham chiếu và fingerprint.
- Local và VPS lệch schema hoặc dữ liệu trước deploy/restore.
- `react-pdf` worker CDN là phụ thuộc ngoài runtime.
- Build hiện có thể bỏ qua lỗi TS do `ignoreBuildErrors`; luôn chạy `npx tsc --noEmit`.

## 5. Cổng Dừng Thủ Công

Phải hỏi/xác nhận trước khi:

- Xóa/reset database thật.
- Restore DB local đè lên VPS.
- Deploy production.
- Đổi schema/migration ảnh hưởng dữ liệu thật.
- Xóa file trong `public/uploads`.
- Public batch phí mới hoặc rollback dữ liệu đã public.
