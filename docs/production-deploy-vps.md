# Production deploy VPS

## Vai trò

File này ghi quyết định production cho Task N. Đây là nguồn tham chiếu khi triển khai public web lên VPS.

## Quyết định đã chốt

| Hạng mục | Quyết định |
| --- | --- |
| Môi trường deploy | VPS Vultr |
| OS giai đoạn MVP | Windows Server trước, có thể chuyển Ubuntu LTS sau |
| Database production | PostgreSQL cài trên cùng VPS với app |
| Domain | `noxhandong.com` |
| HTTPS | Bắt buộc khi public |
| Backup VPS | Dùng tính năng backup/snapshot của VPS |
| Backup vận hành | Cần có chức năng export Excel để lưu trên máy local |
| Super Admin production | Dev/staging hiện dùng tài khoản `admin`, SĐT `0904802553`, role `SUPER_ADMIN`; production sẽ bàn giao cho ban quản lý |
| Login quản trị sau bàn giao | Dự kiến đăng nhập bằng số điện thoại và phân role tương tự hiện tại |

## Kiến trúc production dự kiến

Một VPS chạy các thành phần:

- Reverse proxy: Nginx hoặc Caddy.
- HTTPS: Let's Encrypt.
- App Next.js: chạy bằng PM2 trên Windows Server trong giai đoạn MVP; nếu chuyển Ubuntu thì tiếp tục dùng PM2 hoặc systemd.
- PostgreSQL: chạy local trên VPS, chỉ mở nội bộ `localhost`, không public port database ra internet.
- Firewall: chỉ mở `80`, `443`, và SSH theo IP/quy định vận hành.
- Backup: kết hợp snapshot VPS, `pg_dump`, và export Excel.

## Biến môi trường production bắt buộc

Production cần tối thiểu:

```bash
DATABASE_URL="postgresql://app_user:strong_password@localhost:5432/apartment_fee_reviewer?schema=public"
ADMIN_SESSION_SECRET="long-random-secret"
ADMIN_INITIAL_PASSWORD="temporary-strong-password"
ADMIN_INITIAL_PHONE="0904802553"
EXPORT_DIR="/var/backups/noxh-an-dong/exports"
BACKUP_DIR="/var/backups/noxh-an-dong/postgres"
```

`ADMIN_SESSION_SECRET` là bắt buộc ở production. Không dùng fallback/dev secret.

## Cảnh báo về backup Excel

Export Excel rất hữu ích để lưu trữ vận hành và bàn giao cho người dùng không rành database, nhưng **không thay thế được backup database**.

Lý do:

- Excel chỉ lưu được dữ liệu đã chọn để xuất, không bảo đảm đủ toàn bộ bảng hệ thống.
- Excel không giữ đầy đủ migration, sequence id, session, audit payload, batch import, fingerprint sao kê.
- Khi cần restore hệ thống sau sự cố, file Excel không thể phục hồi chính xác trạng thái DB.

Phương án đúng:

1. VPS snapshot: dùng để khôi phục nguyên máy khi lỗi lớn.
2. PostgreSQL dump: dùng `pg_dump` định kỳ để backup database thật.
3. Excel export: dùng để lưu bản vận hành dễ đọc trên máy local.

Lệnh đã chuẩn bị trong repo:

```bash
npm run prod:backup:postgres
npm run export:operations:xlsx
```

Trong đó:

- `prod:backup:postgres` dùng `pg_dump --format=custom`, phục hồi bằng `pg_restore`.
- `export:operations:xlsx` xuất bản Excel vận hành gồm căn hộ, liên hệ đã duyệt, tài khoản quản trị không kèm hash mật khẩu, batch phí public hiện hành và lô nhập gần đây.
- File Excel export vẫn là dữ liệu nhạy cảm nội bộ, không public và không gửi cho cư dân.

## Super Admin production

Super Admin production là tài khoản rất quan trọng.

Quyền này có thể:

- tạo/khóa tài khoản quản trị khác
- import dữ liệu thu phí
- chốt batch public cho cư dân
- xem dữ liệu nội bộ nhạy cảm
- thao tác các chức năng có ảnh hưởng trực tiếp đến dữ liệu public

Nguyên tắc đề xuất:

- Không dùng lại mật khẩu dev `Admin@123`.
- Tạo một tài khoản chủ hệ thống ban đầu để triển khai.
- Tài khoản dev/staging hiện tại: `admin`, SĐT đăng nhập `0904802553`, role `SUPER_ADMIN`.
- Sau khi bàn giao, tạo tài khoản Super Admin cho người đại diện ban quản lý.
- Giữ thêm một tài khoản khẩn cấp, mật khẩu niêm phong, chỉ dùng khi mất quyền truy cập.
- Mọi tài khoản quản trị nên đăng nhập bằng số điện thoại hoặc định danh rõ người chịu trách nhiệm.
- Mật khẩu production phải đủ mạnh và thay đổi khi bàn giao.

## Đăng nhập bằng số điện thoại

Schema production đã chuẩn bị trường `tai_khoan_quan_tri.so_dien_thoai`.

Luồng hiện tại:

- Admin/manager có thể đăng nhập bằng `ten_dang_nhap` hoặc `so_dien_thoai`.
- Số điện thoại được chuẩn hóa về dạng `0xxxxxxxxx`.
- Hỗ trợ nhập `0912345678`, `0912 345 678`, `+84912345678`, `84912345678`.
- Super Admin tạo manager phải nhập số điện thoại đăng nhập.

Việc còn lại trước bàn giao:

- chốt danh sách số điện thoại được cấp quyền
- đổi mật khẩu production
- hướng dẫn ban quản lý tự tạo/khóa manager

## Việc cần làm trước deploy

- [x] Chốt nhà cung cấp VPS: Vultr.
- [x] Mua/chốt domain `noxhandong.com`.
- [x] Chốt OS VPS giai đoạn MVP: Windows Server trước, có thể đổi Ubuntu sau.
- [ ] Chốt cấu hình VPS tối thiểu sau khi chạy thử. Gói hiện tại 1 vCPU/2GB RAM/50GB NVMe đủ để chạy MVP nhẹ, nhưng cần theo dõi RAM sau deploy.
- [x] Chốt reverse proxy đề xuất: Caddy.
- [x] Chốt cách chạy app đề xuất: PM2.
- [ ] Chốt lịch `pg_dump` tự động.
- [ ] Chốt nơi lưu file backup DB ngoài VPS.
- [x] Thiết kế chức năng export Excel phục vụ lưu local.
- [x] Thiết kế login bằng số điện thoại cho admin/manager.
- [ ] Chốt danh sách người giữ Super Admin production.

Runbook thao tác: [deploy-vps-step-by-step.md](deploy-vps-step-by-step.md), ưu tiên mục `Deploy MVP trên Windows Server`.

## Quyết định chưa được phép bỏ qua

Trước khi chạy deploy thật, phải chốt tối thiểu:

- domain đã trỏ DNS về VPS
- HTTPS hoạt động
- database không public port ra internet
- có ít nhất một bản `pg_dump` restore thử được
- tài khoản Super Admin production không dùng mật khẩu dev
- public page không lộ số điện thoại, tên cư dân, ghi chú nội bộ, raw Excel
