# Runbook deploy VPS production

## Vai trò

File này là tài liệu xương sống cho việc cài đặt, deploy, vận hành và kiểm tra project trên VPS.

Trạng thái hiện tại của project:

- Domain chính: `noxhandong.vn`
- VPS hiện tại: Windows Server trên Vultr
- App runtime: Next.js chạy bằng Windows Service qua NSSM
- Reverse proxy/HTTPS: Caddy
- Database: PostgreSQL local trên cùng VPS
- Backup: PostgreSQL dump + Excel export bằng Windows Scheduled Task

Không lưu mật khẩu, token, private key, `.env`, database dump hoặc thông tin đăng nhập thật trong file này.

## Kiến trúc production hiện tại

```text
Người dùng
  -> https://noxhandong.vn
  -> Caddy :443/:80
  -> Next.js app 127.0.0.1:3000
  -> PostgreSQL localhost:5432
```

Service trên Windows:

| Service | Vai trò |
| --- | --- |
| `noxh-an-dong` | Chạy Next.js production app |
| `caddy` | Reverse proxy, redirect HTTP sang HTTPS, cấp SSL tự động |
| `postgresql-x64-17` | PostgreSQL database |
| `NoxhAnDongDailyBackup` | Scheduled Task backup DB và export Excel hằng ngày |

Đường dẫn production:

| Đường dẫn | Vai trò |
| --- | --- |
| `C:\apps\noxh-an-dong` | Source code production |
| `C:\apps\noxh-an-dong\.env` | Biến môi trường production, không commit |
| `C:\caddy\Caddyfile` | Cấu hình Caddy |
| `C:\PostgreSQL\pgsql` | PostgreSQL binary package |
| `C:\pgdata` | PostgreSQL data directory |
| `C:\backups\noxh-an-dong\postgres` | File backup PostgreSQL `.dump` |
| `C:\backups\noxh-an-dong\exports` | File Excel export vận hành |

## Checklist bảo mật bắt buộc

- Đổi mật khẩu `Administrator` của VPS sau khi deploy.
- Đổi mật khẩu Super Admin trong app sau khi bàn giao.
- Không mở port PostgreSQL `5432` ra internet.
- Chỉ public `80` và `443`.
- Không commit `.env`, backup DB, file dump, log chứa secret.
- Nếu dùng SSH, nên giới hạn IP đăng nhập nếu nhà cung cấp VPS hỗ trợ firewall.
- Nếu dùng Cloudflare, bật SSL mode `Full strict`.

## 1. DNS

Tại nơi quản lý domain, cấu hình tối thiểu:

```text
@      A       64.176.81.118
www    CNAME   noxhandong.vn
```

Hoặc có thể dùng:

```text
@      A       64.176.81.118
www    A       64.176.81.118
```

Kiểm tra DNS từ máy local:

```powershell
nslookup noxhandong.vn
nslookup www.noxhandong.vn
```

Kết quả mong muốn:

```text
noxhandong.vn -> 64.176.81.118
www.noxhandong.vn -> noxhandong.vn hoặc 64.176.81.118
```

## 2. Cài phần mềm nền trên Windows Server

Cài các phần mềm:

- Node.js LTS
- Git for Windows
- Caddy
- NSSM
- PostgreSQL 17

Kiểm tra:

```powershell
node -v
npm -v
git --version
caddy version
nssm
psql --version
pg_dump --version
```

Nếu cài PostgreSQL bằng bản zip binary, thêm PATH:

```powershell
[Environment]::SetEnvironmentVariable(
  "Path",
  "C:\PostgreSQL\pgsql\bin;C:\Program Files\nodejs;C:\Users\Administrator\AppData\Roaming\npm;" + $env:Path,
  "Machine"
)
```

Đóng PowerShell rồi mở lại sau khi đổi PATH.

## 3. Tạo PostgreSQL local

Nếu dùng PostgreSQL installer chuẩn, chỉ cần tạo user/database.

Nếu dùng PostgreSQL zip binary:

```powershell
New-Item -ItemType Directory -Force C:\pgdata | Out-Null
C:\PostgreSQL\pgsql\bin\initdb.exe -D C:\pgdata -U postgres -A scram-sha-256 -W
C:\PostgreSQL\pgsql\bin\pg_ctl.exe register -N postgresql-x64-17 -D C:\pgdata -S auto
Start-Service postgresql-x64-17
```

Tạo database production:

```powershell
psql -U postgres
```

Trong `psql`:

```sql
CREATE USER apartment_app WITH PASSWORD 'CHANGE_STRONG_DB_PASSWORD';
CREATE DATABASE apartment_fee_reviewer OWNER apartment_app;
GRANT ALL PRIVILEGES ON DATABASE apartment_fee_reviewer TO apartment_app;
\q
```

Nguyên tắc:

- App dùng user `apartment_app`, không dùng user `postgres`.
- PostgreSQL chỉ nghe `localhost`.
- Không mở firewall port `5432`.

## 4. Đưa source code lên VPS

Thư mục production:

```powershell
New-Item -ItemType Directory -Force C:\apps | Out-Null
```

Cách tốt nhất là clone từ Git:

```powershell
git clone <REPO_URL> C:\apps\noxh-an-dong
cd C:\apps\noxh-an-dong
```

Nếu GitHub chưa cấp quyền trên VPS, có thể deploy bằng zip từ máy local:

```powershell
git archive --format=zip -o .local\deploy-source.zip HEAD
```

Upload zip lên VPS rồi giải nén vào:

```text
C:\apps\noxh-an-dong
```

Không upload các thư mục/file:

- `node_modules`
- `.next`
- `.env`
- `.local`
- file backup DB
- file log chứa secret

## 5. Tạo `.env` production

Tạo file:

```text
C:\apps\noxh-an-dong\.env
```

Mẫu nội dung:

```env
DATABASE_URL="postgresql://apartment_app:CHANGE_STRONG_DB_PASSWORD@localhost:5432/apartment_fee_reviewer?schema=public"
ADMIN_SESSION_SECRET="CHANGE_LONG_RANDOM_SECRET"
ADMIN_INITIAL_PASSWORD="CHANGE_TEMP_ADMIN_PASSWORD"
ADMIN_INITIAL_PHONE="0904802553"
EXPORT_DIR="C:/backups/noxh-an-dong/exports"
BACKUP_DIR="C:/backups/noxh-an-dong/postgres"
```

Lưu ý đường dẫn Windows:

- Nên dùng `/` trong `.env`: `C:/backups/...`
- Tránh dùng `C:\backups\...` vì một số thư viện Node có thể hiểu `\n` là xuống dòng.

Sinh secret:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

## 6. Install, migrate, seed, build

Chạy trên VPS:

```powershell
cd C:\apps\noxh-an-dong
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run seed:v2
npm run sync:apartment:master
npm run sync:master:contacts
npm run import:fee-tracking:v2
npm run prepare:fee-public-batch:v2
npm run publish:fee-public-batch:v2
npm run build
```

Kết quả mong muốn:

- Migration Prisma chạy hết.
- Có Super Admin theo `ADMIN_INITIAL_PHONE`.
- Có `934` căn hộ.
- Có contact candidate từ file master.
- Có public fee batch hiện hành.
- `npm run build` pass.

## 7. Chạy Next.js bằng Windows Service

Dùng NSSM thay vì PM2 trên Windows để service ổn định hơn sau reboot.

Tạo file:

```text
C:\apps\noxh-an-dong\start-app.cmd
```

Nội dung:

```cmd
@echo off
cd /d C:\apps\noxh-an-dong
set NODE_ENV=production
set PATH=C:\PostgreSQL\pgsql\bin;C:\Program Files\nodejs;C:\Users\Administrator\AppData\Roaming\npm;%PATH%
node node_modules\next\dist\bin\next start -H 0.0.0.0 -p 3000
```

Cài service:

```powershell
nssm install noxh-an-dong C:\apps\noxh-an-dong\start-app.cmd
nssm set noxh-an-dong AppDirectory C:\apps\noxh-an-dong
nssm set noxh-an-dong Start SERVICE_AUTO_START
nssm set noxh-an-dong AppStdout C:\apps\noxh-an-dong\logs\service-out.log
nssm set noxh-an-dong AppStderr C:\apps\noxh-an-dong\logs\service-err.log
Start-Service noxh-an-dong
```

Kiểm tra:

```powershell
Get-Service noxh-an-dong
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3000/
```

Kết quả mong muốn:

```text
Status: Running
HTTP status: 200
```

## 8. Cấu hình Caddy HTTPS

Tạo file:

```text
C:\caddy\Caddyfile
```

Nội dung hiện tại:

```caddyfile
noxhandong.vn {
  encode zstd gzip
  reverse_proxy 127.0.0.1:3000
  header {
    X-Content-Type-Options nosniff
    Referrer-Policy strict-origin-when-cross-origin
    X-Frame-Options SAMEORIGIN
  }
}

www.noxhandong.vn {
  redir https://noxhandong.vn{uri} permanent
}
```

Validate:

```powershell
caddy validate --config C:\caddy\Caddyfile --adapter caddyfile
```

Cài Caddy thành Windows Service bằng NSSM:

```powershell
nssm install caddy caddy run --config C:\caddy\Caddyfile --adapter caddyfile
nssm set caddy AppDirectory C:\caddy
nssm set caddy Start SERVICE_AUTO_START
Start-Service caddy
```

Nếu service đã tồn tại:

```powershell
Restart-Service caddy
```

Kiểm tra trên VPS:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1/
Invoke-WebRequest -UseBasicParsing https://noxhandong.vn/
```

Kiểm tra từ máy local:

```powershell
Invoke-WebRequest -UseBasicParsing https://noxhandong.vn/
Invoke-WebRequest -UseBasicParsing https://noxhandong.vn/tra-cuu-phi?ma_can=L1.115
Invoke-WebRequest -UseBasicParsing https://noxhandong.vn/admin/login
```

Kết quả mong muốn:

```text
HTTP 200
```

## 9. Firewall

Mở port web:

```powershell
New-NetFirewallRule -DisplayName "HTTP 80" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "HTTPS 443" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

Không mở PostgreSQL:

```text
Không mở 5432/tcp ra internet.
```

Nếu dùng SSH:

```powershell
Get-Service sshd
Get-NetFirewallRule -Name *ssh*
```

## 10. Backup và export Excel

Tạo thư mục:

```powershell
New-Item -ItemType Directory -Force C:\backups\noxh-an-dong\postgres | Out-Null
New-Item -ItemType Directory -Force C:\backups\noxh-an-dong\exports | Out-Null
```

Chạy thủ công:

```powershell
cd C:\apps\noxh-an-dong
npm run prod:backup:postgres:windows
npm run export:operations:xlsx
```

File mong muốn:

```text
C:\backups\noxh-an-dong\postgres\apartment_fee_reviewer-YYYYMMDD-HHMMSS.dump
C:\backups\noxh-an-dong\exports\operations-export-YYYYMMDD-HHMMSS.xlsx
```

Tạo `daily-backup.cmd`:

```cmd
@echo off
cd /d C:\apps\noxh-an-dong
set PATH=C:\PostgreSQL\pgsql\bin;C:\Program Files\nodejs;C:\Users\Administrator\AppData\Roaming\npm;%PATH%
call npm run prod:backup:postgres:windows >> C:\backups\noxh-an-dong\backup-task.log 2>&1
call npm run export:operations:xlsx >> C:\backups\noxh-an-dong\backup-task.log 2>&1
```

Tạo Scheduled Task chạy hằng ngày lúc 02:00 bằng user `SYSTEM`:

```powershell
schtasks /Create /TN "NoxhAnDongDailyBackup" /SC DAILY /ST 02:00 /TR "C:\apps\noxh-an-dong\daily-backup.cmd" /RL HIGHEST /RU SYSTEM /F
```

Test task:

```powershell
schtasks /Run /TN "NoxhAnDongDailyBackup"
schtasks /Query /TN "NoxhAnDongDailyBackup" /FO LIST /V
```

Kết quả mong muốn:

```text
Last Result: 0
Run As User: SYSTEM
```

## 11. Kiểm tra nghiệm thu sau deploy

Các URL bắt buộc:

| URL | Kết quả |
| --- | --- |
| `https://noxhandong.vn/` | Trang chủ cư dân mở được |
| `https://noxhandong.vn/tra-cuu-phi?ma_can=L1.115` | Tra cứu phí mở được |
| `https://noxhandong.vn/admin/login` | Trang login admin mở được |
| `https://www.noxhandong.vn/` | Redirect về `https://noxhandong.vn/` |

Checklist:

- HTTPS hoạt động, trình duyệt không báo lỗi chứng chỉ.
- Caddy redirect HTTP sang HTTPS.
- App service `noxh-an-dong` chạy `Automatic`.
- Caddy service chạy `Automatic`.
- PostgreSQL service chạy.
- Backup task sinh được file `.dump`.
- Export task sinh được file `.xlsx`.
- Public lookup không lộ tên cư dân, số điện thoại, ghi chú nội bộ.
- Admin đăng nhập được bằng tài khoản production.
- Quản lý/kỹ thuật không vào được chức năng import, duyệt, tạo tài khoản.

## 12. Cloudflare nếu dùng sau này

Cloudflare không bắt buộc vì Caddy đã có HTTPS thật.

Nếu dùng Cloudflare:

1. Add site `noxhandong.vn` vào Cloudflare.
2. Đổi nameserver tại TenTen sang nameserver Cloudflare.
3. Tạo DNS:

```text
@      A       64.176.81.118     Proxied
www    CNAME   noxhandong.vn     Proxied
```

4. SSL/TLS mode: `Full strict`.
5. Bật `Always Use HTTPS`.
6. Không bật tối ưu JS/CSS nâng cao trước khi test UI.

Lưu ý:

- Khi bật proxy Cloudflare, server sẽ thấy IP Cloudflare, không phải IP người dùng thật.
- Nếu sau này rate-limit theo IP, cần đọc header `CF-Connecting-IP`.
- Không chọn SSL mode `Flexible`, vì dễ gây vòng lặp redirect HTTPS.

## 13. Quy trình cập nhật phiên bản mới

Trên máy local:

```powershell
npm test
npm run build
git status
git add .
git commit -m "..."
git push origin main
```

Trên VPS nếu dùng Git clone:

```powershell
cd C:\apps\noxh-an-dong
git pull
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run build
Restart-Service noxh-an-dong
```

Nếu deploy bằng zip:

1. Tạo zip bằng `git archive`.
2. Upload lên VPS.
3. Giữ lại `.env`.
4. Giải nén source mới vào `C:\apps\noxh-an-dong`.
5. Chạy lại install/migrate/build.
6. Restart service.

Kiểm tra sau update:

```powershell
Invoke-WebRequest -UseBasicParsing https://noxhandong.vn/
Invoke-WebRequest -UseBasicParsing https://noxhandong.vn/admin/login
```

## 14. Phương án Ubuntu sau này

Windows Server dùng được cho MVP. Khi cần vận hành lâu dài, Ubuntu LTS vẫn là phương án sạch hơn:

- PostgreSQL service chuẩn hơn.
- PM2/systemd ổn định hơn.
- Backup/cron đơn giản hơn.
- Ít vấn đề PATH/service hơn Windows.

Khi chuyển sang Ubuntu:

1. Backup DB bằng `pg_dump`.
2. Export Excel vận hành.
3. Dựng server Ubuntu mới.
4. Cài Node.js LTS, PostgreSQL, Caddy.
5. Restore DB bằng `pg_restore`.
6. Deploy source.
7. Trỏ DNS sang IP mới.

Không copy thủ công thư mục data PostgreSQL giữa Windows và Linux.

## 15. Sự cố thường gặp

### Caddy trả 502

Nguyên nhân thường là app Next chưa chạy trên `127.0.0.1:3000`.

Kiểm tra:

```powershell
Get-Service noxh-an-dong
Get-NetTCPConnection -LocalPort 3000 -State Listen
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3000/
```

Sửa:

```powershell
Restart-Service noxh-an-dong
Get-Content C:\apps\noxh-an-dong\logs\service-err.log -Tail 80
```

### HTTPS chưa hoạt động

Kiểm tra DNS:

```powershell
nslookup noxhandong.vn
```

Kiểm tra Caddy:

```powershell
caddy validate --config C:\caddy\Caddyfile --adapter caddyfile
Restart-Service caddy
```

### Backup DB tạo file rỗng

Nguyên nhân có thể do `pg_dump` không hiểu tham số Prisma `?schema=public`.

Script `scripts/production/backup-postgres.ps1` đã xử lý bỏ tham số `schema` khi gọi `pg_dump`. Nếu lỗi quay lại, kiểm tra version script trên VPS có khớp repo không.

### Export Excel lỗi đường dẫn

Dùng forward slash trong `.env`:

```env
EXPORT_DIR="C:/backups/noxh-an-dong/exports"
BACKUP_DIR="C:/backups/noxh-an-dong/postgres"
```

Không dùng:

```env
EXPORT_DIR="C:\backups\noxh-an-dong\exports"
```

### Scheduled Task chỉ chạy backup, không chạy export

Trong file `.cmd`, phải dùng `call npm ...`:

```cmd
call npm run prod:backup:postgres:windows
call npm run export:operations:xlsx
```

Nếu không có `call`, batch có thể dừng sau lệnh npm đầu tiên.

