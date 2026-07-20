# Todo VPS Phase 2

File này theo dõi các việc riêng cho VPS/production trong Phase 2. Roadmap chính vẫn là [phase-2-roadmap.md](phase-2-roadmap.md), còn file này dùng để nhắc các việc vận hành phải xử lý trước hoặc ngay sau deploy Phase 2.

## Nguyên tắc

- Không deploy Phase 2 lên production nếu chưa backup database production.
- Không chốt public batch thật nếu chủ dự án chưa xem preview.
- Nếu gặp việc cần thao tác thủ công trên VPS, dừng lại và yêu cầu chủ dự án làm/xác nhận.
- Nếu chủ dự án chỉ nhắn `Tiếp tục` trong khi đang vướng cổng thủ công, chỉ nhắc đúng việc cần làm, không tự vượt bước.

## Việc chặn deploy Phase 2

| Trạng thái | Việc cần làm | Ghi chú |
| --- | --- | --- |
| [ ] | Backup PostgreSQL production trước migration Phase 2 | Dùng script backup hiện có hoặc export bằng DBeaver/pg_dump. |
| [ ] | Kiểm tra lệch timezone production | VPS đã đổi đồng hồ sang GMT+7 nhưng dữ liệu thời gian trong app/DB đang sinh theo GMT+0; cần xác định nguồn lệch là Node runtime, PostgreSQL session timezone, cột timestamp, hoặc cách format hiển thị. |
| [ ] | Chốt cách lưu thời gian chuẩn | Đề xuất: DB lưu timestamp chuẩn, hiển thị theo `Asia/Ho_Chi_Minh`; không cộng tay giờ trong code. |
| [x] | Chuẩn hóa format thời gian trên UI admin theo giờ Việt Nam | Đã thêm helper `formatVietnamDateTime`/`formatVietnamDate`, dùng `Asia/Ho_Chi_Minh` cố định cho các trang admin chính. |
| [ ] | Cập nhật `.env.production` nếu cần timezone runtime | Có thể cần `TZ=Asia/Ho_Chi_Minh` cho process Node/NSSM, nhưng phải kiểm tra trên Windows Server trước. |
| [ ] | Kiểm tra PostgreSQL timezone trên VPS | Chạy `SHOW timezone; SELECT now();` để biết DB đang ở UTC hay Asia/Ho_Chi_Minh. |
| [ ] | Kiểm tra lại thời gian trên các bảng có log | Ưu tiên `lo_nhap_du_lieu`, `giao_dich_ngan_hang`, `nhat_ky_dang_nhap_quan_tri`, `batch_trang_thai_phi_public`. |
| [ ] | Deploy migration Phase 2 | Chỉ làm sau backup và sau khi xác nhận timezone. |
| [ ] | Restart service production | Restart NSSM service app và Caddy nếu cần. |

## Việc sau deploy Phase 2

| Trạng thái | Việc cần làm | Ghi chú |
| --- | --- | --- |
| [ ] | Kiểm tra public lookup `https://noxhandong.vn` | Không được lỗi trang chủ, background, parser mã căn. |
| [ ] | Kiểm tra `/admin/login` | Đăng nhập Super Admin bằng tài khoản production. |
| [ ] | Kiểm tra session dài hạn | Đăng nhập lại sau refresh/trình duyệt mới nếu phù hợp. |
| [ ] | Upload sao kê ở chế độ kiểm tra | Không ghi DB nếu chỉ kiểm tra. |
| [ ] | Import staging sao kê T6 thật | Chỉ sau khi chủ dự án xác nhận dùng dữ liệu T6. |
| [ ] | Duyệt vài giao dịch mẫu | Kiểm tra giao dịch một căn, nhiều căn, thiếu mã căn. |
| [ ] | Tạo preview public batch | Chưa chốt ngay. |
| [ ] | Chủ dự án duyệt preview public batch | Cổng thủ công bắt buộc trước lần chốt đầu tiên. |
| [ ] | Chốt public batch đầu tiên từ sao kê thật | Chỉ sau duyệt preview. |

## Ghi chú timezone cần kiểm tra

Triệu chứng được chủ dự án ghi nhận ngày 2026-05-28:

- VPS Windows Server đã chuyển đồng hồ sang GMT+7.
- Thời gian dữ liệu do app sinh ra vẫn có biểu hiện như GMT+0.
- Rủi ro: log import, batch public, lịch sử giao dịch, thời điểm đăng nhập và thời điểm chốt public có thể lệch 7 giờ khi hiển thị hoặc khi audit.

Hướng xử lý đề xuất:

1. Xác minh thời gian hệ điều hành VPS.
2. Xác minh timezone PostgreSQL production.
3. Xác minh timezone process Node/NSSM.
4. Kiểm tra code format thời gian ở UI.
5. Chọn một quy ước duy nhất:
   - lưu DB nhất quán;
   - hiển thị UI theo `Asia/Ho_Chi_Minh`;
   - export Excel cũng theo giờ Việt Nam.

Cập nhật 2026-05-28:

- Code UI admin đã được chuẩn hóa để hiển thị thời gian theo `Asia/Ho_Chi_Minh`, không phụ thuộc timezone mặc định của Windows/Node.
- Kiểm tra local sau thay đổi: `npm test` pass, `npm run build` pass, `npm run test:mobile-ui` pass 40/40 sau khi restart dev server.
- Việc còn cần chủ dự án/VPS xác nhận: PostgreSQL và process Node trên VPS đang trả thời gian gì. Chưa được coi là xong cho production nếu chưa chạy các lệnh kiểm tra bên dưới trên VPS.

## Lệnh kiểm tra thủ công trên VPS

PowerShell:

```powershell
Get-TimeZone
Get-Date
```

PostgreSQL:

```sql
SHOW timezone;
SELECT now();
SELECT current_timestamp;
```

Node:

```powershell
node -e "console.log(new Date().toString()); console.log(new Date().toISOString()); console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)"
```

## Deploy migration Phase 2 ngay 2026-06-10

- [ ] Backup PostgreSQL production truoc migration.
- [ ] Deploy code moi len VPS.
- [ ] Chay `npm run prisma:migrate:deploy`.
- [ ] Xac nhan migration `20260610150000_phase2_integrity_and_reserve` da thanh cong.
- [ ] Chay `npm run prisma:generate`.
- [ ] Chay `npm run build`.
- [ ] Restart service Node/NSSM.
- [ ] Kiem tra role Super Admin/Manager/Technician.
- [ ] Kiem tra giao dich `BAO_LUU` khong tao lich su phi.
- [ ] Kiem tra phan bo nhieu can doc muc phi tu `quy_tac_phi`.
- [ ] Kiem tra so du dong le duoc chuyen sang batch sau.
