# Deploy DB cho tính năng Công việc vận hành

Mục tiêu: thêm 2 bảng `cong_viec_van_hanh` và `nhat_ky_cong_viec_van_hanh` vào DB production bằng Prisma migration, không sửa tay trực tiếp trong PostgreSQL.

## 1. Migrate và kiểm tra trước khi deploy ở máy local

Chạy trong thư mục project:

```powershell
npm run prisma:validate
npm run prisma:migrate:dev -- --name add_operation_tasks
npm run prisma:generate
npm test
npm run build
```

Kiểm tra migration local đã lên DB:

```powershell
npx prisma migrate status
```

Kết quả mong muốn: database schema is up to date.

Nếu các lệnh trên lỗi, không deploy lên VPS. Local dùng `prisma migrate dev`; VPS production dùng `prisma migrate deploy`.

## 2. Backup DB trên VPS trước khi migrate

Đăng nhập VPS, mở PowerShell bằng quyền Administrator:

```powershell
cd C:\apps\noxh-an-dong
npm run prod:backup:postgres:windows
```

Kiểm tra thư mục backup có file `.dump` mới:

```powershell
Get-ChildItem C:\backups\noxh-an-dong\postgres | Sort-Object LastWriteTime -Descending | Select-Object -First 3
```

## 3. Dừng app service

```powershell
Stop-Service noxh-an-dong
Get-Service noxh-an-dong
```

Trạng thái nên là `Stopped`.

## 4. Cập nhật source code trên VPS

Nếu deploy bằng git:

```powershell
cd C:\apps\noxh-an-dong
git pull
npm ci
```

Nếu deploy bằng zip theo quy trình hiện tại, giải nén source mới vào `C:\apps\noxh-an-dong`, giữ lại file `.env` production và folder upload production.

## 5. Chạy migration tạo bảng mới

Chạy đúng thứ tự:

```powershell
cd C:\apps\noxh-an-dong
npm run prisma:validate
npm run prisma:migrate:deploy
npm run prisma:generate
```

Migration cần xuất hiện trong log:

```text
20260827090000_add_operation_tasks
```

Kiểm tra trạng thái migration:

```powershell
npx prisma migrate status
```

Kết quả mong muốn: database schema is up to date.

## 6. Kiểm tra bảng đã có trong PostgreSQL

```powershell
$env:PGPASSWORD = "<mat_khau_postgres>"
psql -h localhost -U apartment_app -d apartment_fee_reviewer -c "\dt cong_viec_van_hanh"
psql -h localhost -U apartment_app -d apartment_fee_reviewer -c "\dt nhat_ky_cong_viec_van_hanh"
```

Nếu không dùng `PGPASSWORD`, nhập mật khẩu khi `psql` hỏi.

## 7. Build và bật lại app

```powershell
npm run build
Start-Service noxh-an-dong
Get-Service noxh-an-dong
```

Kiểm tra log nếu service không chạy:

```powershell
Get-Content C:\apps\noxh-an-dong\logs\service-err.log -Tail 80
```

## 8. Kiểm tra trên giao diện

- Đăng nhập bằng Super Admin hoặc Manager.
- Mở `/admin/operation-tasks`.
- Tạo thử 1 công việc cho `Kỹ thuật`.
- Đăng nhập role `TECHNICIAN`, kiểm tra chỉ xem được và báo xong được.
- Quay lại Manager/Admin, đóng công việc bằng trạng thái `Hoàn thành`.
- Kiểm tra card `Log công việc` có ghi đủ thao tác.
