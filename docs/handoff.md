# Tài liệu bàn giao

Cập nhật: 2026-07-28. Tài liệu này phản ánh trạng thái source hiện có trong workspace, bao gồm cả thay đổi chưa commit.

## 1. Trạng thái hiện hành

Project đang ở Phase 2, vận hành theo hướng: dữ liệu T5/2026 là mốc opening balance, từ T6/2026 trở đi ưu tiên ghi nhận phát sinh qua sao kê ngân hàng đã duyệt và các giao dịch bổ sung có bằng chứng.

- Domain production: `https://noxhandong.vn`.
- Runtime: Next.js trên Windows VPS, PostgreSQL local, Caddy reverse proxy.
- Local workspace hiện có nhiều thay đổi chưa commit; không dùng `git reset` hoặc rollback hàng loạt nếu chưa được duyệt.
- `next.config.mjs` đang cấu hình `allowedDevOrigins`, `serverActions.bodySizeLimit = 20mb`, `serverExternalPackages`, `typescript.ignoreBuildErrors = true`, webpack alias `canvas = false` và devtool phục vụ `react-pdf/pdfjs`.

## 2. Phân hệ đang có

### Public cư dân

- `/`: trang chủ tra cứu phí, danh sách 3 thông báo public mới nhất, footer cư dân.
- `/tra-cuu-phi`: tra cứu trạng thái đóng phí từ batch public hiện hành, có rate limit in-memory theo IP, xử lý mã căn mơ hồ và gợi ý chọn căn.
- `components/resident/resident-footer.tsx`: đầu mối liên hệ, thông tin chuyển khoản QLVH, nút xem danh bạ và góp ý.
- `components/resident/contact-dialog.tsx`: danh bạ liên hệ dự án tĩnh.
- `components/resident/feedback-dialog.tsx`: điều hướng góp ý sang Zalo theo nhóm vấn đề.
- `app/actions.ts`: action thử nghiệm gửi phản ánh, hiện mới validate/log console, chưa nối webhook thật.

### Thông báo public

- `/admin/announcements`: Super Admin tạo/cập nhật trạng thái thông báo public.
- File đính kèm hiện hỗ trợ PDF và ảnh: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, giới hạn 10 MB.
- `components/resident/announcement-dialog.tsx`: xem ảnh bằng `next/image`, xem PDF bằng `react-pdf` qua `components/resident/pdf-viewer.tsx`.
- `ThongBaoCongKhai.mime_type` được dùng để phân nhánh viewer.
- Có route phục vụ file upload `/uploads/[...path]`, giới hạn trong `public/uploads` và set cache dài hạn.

### Admin vận hành

- `/admin/dashboard`: tra cứu nội bộ, thống kê kỳ phí, cảnh báo, liên hệ, bằng chứng giao dịch.
- `/admin/database`: tra cứu dữ liệu tài chính theo căn hoặc keyword, xuất file tháng, lập danh sách thông báo thu phí. Hồ sơ tài chính căn hộ đang hiển thị dạng bảng với cột thời gian, loại/kỳ phí, nội dung, chứng từ, số tiền; phần trạng thái đóng phí chỉ giữ “Đã đóng đến”.
- `/admin/import`: nhập sao kê, nhập/chốt Excel theo dõi thu phí, bổ sung giao dịch quá khứ. Form import đang dùng `ClientActionForm` và `ImportProgressButton` để giữ trạng thái xử lý sau submit.
- `/admin/import/public-preview`: preview trước khi public batch.
- `/admin/transactions/review`: duyệt sao kê, duyệt một căn, phân bổ nhiều căn, lưu bằng chứng, rollback giao dịch chưa public.
- `/admin/contacts/review`: review danh bạ/liên hệ.
- `/admin/accounts`, `/admin/profile`: quản trị tài khoản và hồ sơ cá nhân.

## 3. Dữ liệu thật và nguyên tắc vận hành

- Master căn hộ: 934 căn, bảng trung tâm `can_ho`.
- Opening balance: dữ liệu phí đến 31/05/2026.
- Từ T6/2026: giao dịch phát sinh nên đi qua sao kê ngân hàng, duyệt web, ghi `lich_su_dong_phi_can_ho`, sau đó preview/public batch.
- Public cư dân chỉ đọc `batch_trang_thai_phi_public` và `trang_thai_phi_can_ho_public` đã public, không đọc raw import.
- Bằng chứng và thông báo public lưu dưới `public/uploads`; cần backup cùng DB trên production.
- Không public tên/SĐT cư dân hoặc ghi chú nội bộ ra route không login.

## 4. Tài khoản dev/local

- Admin local: `http://localhost:3000/admin/login`.
- Username/SĐT: `admin` / `0904802553`.
- Mật khẩu lấy từ `ADMIN_INITIAL_PASSWORD` trong `.env`.
- Role mặc định seed: `SUPER_ADMIN`.

## 5. Cổng kiểm tra bắt buộc

Trước khi bàn giao hoặc deploy:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run prisma:validate
```

Khi thay đổi UI public/admin lớn, chạy thêm:

```bash
npm run test:mobile-ui
```

Khi build production:

```bash
npm run build
```

Không coi `npm run build` là thay thế cho typecheck vì build hiện bỏ qua lỗi TypeScript.

## 6. Điểm cần chú ý ngay

- Worktree hiện có file upload thật trong `public/uploads/announcements`; không xóa nếu chưa xác nhận đó là dữ liệu test hay dữ liệu cần giữ.
- `app/actions.ts` mới là stub feedback, chưa có bảng lưu phản ánh và chưa gọi webhook thật.
- `react-pdf` dùng worker từ CDN `unpkg.com`; nếu production cần chạy offline hoặc hạn chế outbound, nên chuyển sang worker self-hosted.
- Route `/uploads/[...path]` cần tiếp tục giữ kiểm tra path traversal khi mở rộng.
- `next.config.mjs` đang `ignoreBuildErrors`; nên giảm dần nợ type để tắt cấu hình này trong tương lai.
