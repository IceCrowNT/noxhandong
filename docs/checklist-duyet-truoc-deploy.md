# Checklist duyệt trước deploy

## Vai trò

File này là cổng dừng thủ công trước Task N. Không deploy public nếu các mục dưới đây chưa được chủ dự án duyệt.

## 1. Public mobile UI

- [ ] Mở `http://127.0.0.1:3000/` trên điện thoại hoặc responsive mode.
- [ ] Trang đầu tiên là trang cư dân, không phải dashboard nội bộ.
- [ ] Form tra cứu nằm ngay trong màn hình đầu.
- [ ] Input và nút dễ bấm trên màn hình 360px-430px.
- [ ] Không có horizontal scroll trên trang cư dân.
- [ ] Link `Quản trị` có nhưng không lấn át tra cứu cư dân.

## 2. Public lookup

- [ ] Test mã căn chuẩn: `L1.115`.
- [ ] Test input tự nhiên: `can 124 lo 4b`.
- [ ] Test căn có tháng ngoài năm gốc 2026.
- [ ] Test căn đóng lẻ tiền.
- [ ] Xác nhận không hiện SĐT, tên cư dân, ghi chú nội bộ, raw Excel.

## 3. Admin dashboard

- [ ] Đăng nhập `/admin/login`.
- [ ] Vào `/admin/dashboard`.
- [ ] Tìm một số căn thật.
- [ ] Xem được trạng thái phí public.
- [ ] Xem được contact candidate/ghi chú gốc trong vùng admin.
- [ ] Manager không vào được route Super Admin.

## 4. Review contact

- [ ] Vào `/admin/contacts/review`.
- [ ] Lọc theo căn.
- [ ] Duyệt thử candidate chắc chắn.
- [ ] Từ chối candidate sai.
- [ ] Xác nhận contact đã duyệt xuất hiện trong dashboard.
- [ ] Xác nhận dữ liệu gốc staging không bị xóa.

## 5. Import sao kê

- [ ] Kiểm batch `lo_nhap_du_lieu.id = 7`.
- [ ] Review nhóm `NHIEU_CAN`.
- [ ] Review nhóm `CHUA_NHAN_DIEN_DUOC_CAN`.
- [ ] Review nhóm `KHONG_LIEN_QUAN_CAN_HO`.
- [ ] Xác nhận allocation một-căn không sai căn.

## 6. Production readiness

- [x] Chốt hosting: VPS.
- [x] Chốt PostgreSQL production: PostgreSQL cài trên cùng VPS.
- [x] Chốt domain: `noxhandong.com`.
- [x] Mua VPS: Vultr.
- [x] Chốt OS VPS giai đoạn MVP: Windows Server trước, có thể đổi Ubuntu sau.
- [ ] Trỏ DNS domain về VPS.
- [ ] Chốt backup DB thật bằng `pg_dump`, không chỉ dùng export Excel.
- [x] Có script export Excel để lưu local: `npm run export:operations:xlsx`.
- [x] Có runbook deploy VPS: [deploy-vps-step-by-step.md](deploy-vps-step-by-step.md).
- [x] Gắn SĐT `0904802553` cho tài khoản `admin` role `SUPER_ADMIN` trên DB dev/staging.
- [ ] Tạo mật khẩu Super Admin production mới, không dùng mật khẩu dev.
- [ ] Chốt người/tổ chức giữ Super Admin production.
- [x] Có nền đăng nhập bằng số điện thoại cho admin/manager.
- [ ] Kiểm tra app/Caddy/backup tự chạy lại sau khi restart Windows Server.

Chi tiết production: [production-deploy-vps.md](production-deploy-vps.md).

## Kết luận

Chỉ chuyển sang Task N khi toàn bộ mục bắt buộc ở trên đã được duyệt hoặc có ghi chú chấp nhận rủi ro.
