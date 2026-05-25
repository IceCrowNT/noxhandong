# Deploy VPS step by step

## Vai trò

File này là runbook thao tác khi deploy MVP lên VPS. Không lưu mật khẩu, token, private key hoặc secret thật trong file này.

## Khuyến nghị nền tảng

Khuyến nghị dùng **Ubuntu 22.04/24.04 LTS** cho production vì Node.js, PostgreSQL, Caddy/Nginx, PM2 và backup tự động chạy ổn định, ít thao tác GUI.

Tuy nhiên, giai đoạn MVP có thể chạy trên **Windows Server** trước. Khi ổn định vận hành, có thể chuyển sang Ubuntu sau.

## Cảnh báo bảo mật ngay

- Mật khẩu VPS đã xuất hiện trong ảnh/chat thì phải đổi sau khi server cài xong.
- Không gửi password production, `.env`, private key, database dump lên Git.
- PostgreSQL chỉ nghe `localhost`, không mở port `5432` ra internet.
- Public chỉ mở `80`, `443`; SSH nên giới hạn IP nếu nhà cung cấp hỗ trợ firewall.

## Thông tin cần chốt trước khi thao tác

- Domain production: `noxhandong.com`
- IP VPS: lấy trong dashboard Vultr
- OS production: ưu tiên Ubuntu LTS
- Cách chạy app: PM2
- Reverse proxy/HTTPS: Caddy
- Database: PostgreSQL local trên VPS
- App path: `/var/www/noxh-an-dong`

## 1. Trỏ DNS

Tạo bản ghi ở nơi quản lý domain:

```text
A     @      <IP_VPS>
A     www    <IP_VPS>
```

Chờ DNS propagate. Kiểm tra:

```bash
nslookup noxhandong.com
nslookup www.noxhandong.com
```

## 2. Cài package nền trên Ubuntu

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl git ufw postgresql postgresql-contrib
```

Cài Node.js LTS bằng NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Cài PM2:

```bash
sudo npm install -g pm2
```

Cài Caddy:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

## 3. Tạo database production

Đổi `CHANGE_STRONG_DB_PASSWORD` thành mật khẩu mạnh thật.

```bash
sudo -u postgres psql
```

Trong `psql`:

```sql
CREATE USER apartment_app WITH PASSWORD 'CHANGE_STRONG_DB_PASSWORD';
CREATE DATABASE apartment_fee_reviewer OWNER apartment_app;
GRANT ALL PRIVILEGES ON DATABASE apartment_fee_reviewer TO apartment_app;
\q
```

## 4. Đưa source code lên VPS

Cách khuyến nghị là dùng Git private repo:

```bash
sudo mkdir -p /var/www/noxh-an-dong
sudo chown -R $USER:$USER /var/www/noxh-an-dong
git clone <REPO_URL> /var/www/noxh-an-dong
cd /var/www/noxh-an-dong
```

Nếu chưa dùng Git remote, có thể nén project và upload bằng `scp`, nhưng không upload `node_modules`, `.next`, `.env`, `.local`, DB dump nhạy cảm.

## 5. Tạo `.env` production

```bash
cd /var/www/noxh-an-dong
cp .env.production.example .env
nano .env
```

Nội dung bắt buộc:

```bash
DATABASE_URL="postgresql://apartment_app:CHANGE_STRONG_DB_PASSWORD@localhost:5432/apartment_fee_reviewer?schema=public"
ADMIN_SESSION_SECRET="CHANGE_LONG_RANDOM_SECRET"
ADMIN_INITIAL_PASSWORD="CHANGE_TEMP_ADMIN_PASSWORD"
ADMIN_INITIAL_PHONE="0904802553"
EXPORT_DIR="/var/backups/noxh-an-dong/exports"
BACKUP_DIR="/var/backups/noxh-an-dong/postgres"
```

Sinh secret:

```bash
openssl rand -base64 48
```

## 6. Install, migrate, seed, build

```bash
cd /var/www/noxh-an-dong
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run seed:v2
npm run build
```

Sau seed, đăng nhập bằng SĐT/tài khoản admin production và đổi mật khẩu tạm.

## 7. Import dữ liệu ban đầu

Nếu deploy từ source có kèm file Excel vận hành trong `docs`:

```bash
npm run import:management:raw
npm run sync:management:master
npm run sync:apartment:master
npm run sync:master:contacts
npm run import:fee-tracking:v2
npm run prepare:fee-public-batch:v2
```

Nếu cần public batch bằng script cũ:

```bash
npm run publish:fee-public-batch:v2
```

Nếu dùng web UI, đăng nhập Super Admin tại `/admin/login`, vào `/admin/import`, upload file `Theo dõi thu phí T5.xlsx`, chọn `Nhập và công khai cho cư dân`.

## 8. Chạy app bằng PM2

Sửa `deploy/pm2/ecosystem.config.cjs` nếu app path khác `/var/www/noxh-an-dong`.

```bash
cd /var/www/noxh-an-dong
pm2 start deploy/pm2/ecosystem.config.cjs
pm2 save
pm2 startup
```

Kiểm tra app local trên VPS:

```bash
curl -I http://127.0.0.1:3000
pm2 status
pm2 logs noxh-an-dong
```

## 9. Cấu hình Caddy HTTPS

Copy cấu hình mẫu:

```bash
sudo cp deploy/caddy/Caddyfile.example /etc/caddy/Caddyfile
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo systemctl status caddy
```

Kiểm tra:

```bash
curl -I https://noxhandong.com
```

## 10. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Không mở `5432/tcp`.

## 11. Backup

Tạo thư mục backup:

```bash
sudo mkdir -p /var/backups/noxh-an-dong/postgres /var/backups/noxh-an-dong/exports
sudo chown -R $USER:$USER /var/backups/noxh-an-dong
```

Chạy backup DB:

```bash
npm run prod:backup:postgres
```

Chạy export Excel vận hành:

```bash
npm run export:operations:xlsx
```

Cron mẫu mỗi ngày 02:00:

```bash
crontab -e
```

Thêm:

```cron
0 2 * * * cd /var/www/noxh-an-dong && /usr/bin/npm run prod:backup:postgres >> /var/log/noxh-an-dong-backup.log 2>&1
```

## 12. Checklist nghiệm thu sau deploy

- `https://noxhandong.com` mở trang cư dân.
- Mobile 360px-430px không vỡ layout, không horizontal scroll.
- Tra cứu `L1.115`, `can 124 lo 4b`, căn đóng lẻ, căn ngoài năm 2026.
- Public không lộ số điện thoại, tên cư dân, ghi chú nội bộ, raw Excel.
- `/admin/login` đăng nhập được bằng SĐT Super Admin production.
- Manager/kỹ thuật không vào được `/admin/import` và `/admin/accounts`.
- Super Admin import/chốt phí từ UI được.
- `npm run prod:backup:postgres` tạo file dump.
- Restore thử một bản dump trên database test trước khi bàn giao chính thức.

## Deploy MVP trên Windows Server

Phần này là hướng deploy tạm thời nếu VPS đang là Windows Server.

### W1. Vào VPS và đổi mật khẩu

- Đăng nhập bằng Remote Desktop/RDP với user `Administrator`.
- Đổi mật khẩu Administrator ngay sau lần đăng nhập đầu tiên nếu mật khẩu đã từng xuất hiện trong ảnh/chat.
- Bật Windows Update và restart nếu hệ thống yêu cầu.

### W2. Cài phần mềm nền

Cài các phần mềm bản Windows:

- Node.js LTS.
- Git for Windows.
- PostgreSQL 17.
- Caddy Windows binary.

Kiểm tra trong PowerShell mới:

```powershell
node -v
npm -v
git --version
psql --version
pg_dump --version
```

Nếu `psql`/`pg_dump` chưa nhận, thêm PostgreSQL bin vào PATH:

```powershell
[Environment]::SetEnvironmentVariable(
  "Path",
  $env:Path + ";C:\Program Files\PostgreSQL\17\bin",
  "Machine"
)
```

Đóng PowerShell rồi mở lại.

### W3. Tạo database production

Mở SQL Shell hoặc PowerShell:

```powershell
psql -U postgres
```

Trong `psql`, thay mật khẩu thật:

```sql
CREATE USER apartment_app WITH PASSWORD 'CHANGE_STRONG_DB_PASSWORD';
CREATE DATABASE apartment_fee_reviewer OWNER apartment_app;
GRANT ALL PRIVILEGES ON DATABASE apartment_fee_reviewer TO apartment_app;
\q
```

### W4. Đưa source code lên server

Khuyến nghị clone từ Git private repo:

```powershell
New-Item -ItemType Directory -Force C:\apps | Out-Null
git clone <REPO_URL> C:\apps\noxh-an-dong
cd C:\apps\noxh-an-dong
```

Nếu chưa có Git remote, có thể upload zip/source qua RDP, nhưng không upload:

- `node_modules`
- `.next`
- `.env`
- `.local`
- file backup/dump DB nhạy cảm

### W5. Tạo `.env` production

```powershell
cd C:\apps\noxh-an-dong
Copy-Item .env.production.example .env
notepad .env
```

Nội dung mẫu:

```powershell
DATABASE_URL="postgresql://apartment_app:CHANGE_STRONG_DB_PASSWORD@localhost:5432/apartment_fee_reviewer?schema=public"
ADMIN_SESSION_SECRET="CHANGE_LONG_RANDOM_SECRET"
ADMIN_INITIAL_PASSWORD="CHANGE_TEMP_ADMIN_PASSWORD"
ADMIN_INITIAL_PHONE="0904802553"
EXPORT_DIR="C:\backups\noxh-an-dong\exports"
BACKUP_DIR="C:\backups\noxh-an-dong\postgres"
```

Sinh secret bằng PowerShell:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

### W6. Install, migrate, seed, build

```powershell
cd C:\apps\noxh-an-dong
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run seed:v2
npm run build
```

Sau seed, tài khoản Super Admin production dùng SĐT từ `ADMIN_INITIAL_PHONE` và mật khẩu từ `ADMIN_INITIAL_PASSWORD`. Đăng nhập xong phải đổi mật khẩu tạm.

### W7. Import dữ liệu ban đầu

Cách an toàn nhất cho MVP:

1. Chạy app.
2. Vào `/admin/login`.
3. Vào `/admin/import`.
4. Upload file `Theo dõi thu phí T5.xlsx`.
5. Chọn `Nhập và công khai cho cư dân`.

Nếu muốn import bằng script:

```powershell
npm run import:management:raw
npm run sync:management:master
npm run sync:apartment:master
npm run sync:master:contacts
npm run import:fee-tracking:v2
npm run prepare:fee-public-batch:v2
```

### W8. Chạy app bằng PM2

```powershell
npm install -g pm2
cd C:\apps\noxh-an-dong
pm2 start npm --name noxh-an-dong -- run prod:start
pm2 save
pm2 status
pm2 logs noxh-an-dong
```

Lưu ý: PM2 trên Windows không tự thành Windows Service ổn định như Linux. Nếu muốn tự chạy lại sau reboot, có hai cách:

- dùng `pm2-windows-startup`;
- hoặc tạo Task Scheduler chạy lệnh `pm2 resurrect` khi Windows start.

Cài `pm2-windows-startup`:

```powershell
npm install -g pm2-windows-startup
pm2-startup install
pm2 save
```

### W9. Caddy HTTPS trên Windows

Tạo thư mục:

```powershell
New-Item -ItemType Directory -Force C:\caddy | Out-Null
Copy-Item deploy\caddy\Caddyfile.example C:\caddy\Caddyfile
notepad C:\caddy\Caddyfile
```

Nội dung cần giữ:

```caddyfile
noxhandong.com {
  encode zstd gzip
  reverse_proxy 127.0.0.1:3000
}

www.noxhandong.com {
  redir https://noxhandong.com{uri} permanent
}
```

Chạy thử:

```powershell
caddy run --config C:\caddy\Caddyfile
```

Nếu chạy ổn, cài Caddy thành Windows Service. Cách đơn giản là dùng NSSM hoặc `sc.exe`; nếu chưa quen service Windows, có thể để bước này tôi làm trực tiếp qua remote/terminal sau khi anh cung cấp phương thức truy cập an toàn.

### W10. Mở firewall Windows

```powershell
New-NetFirewallRule -DisplayName "HTTP 80" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "HTTPS 443" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

Không mở port `5432` ra internet.

### W11. Backup trên Windows

Tạo thư mục backup:

```powershell
New-Item -ItemType Directory -Force C:\backups\noxh-an-dong\postgres | Out-Null
New-Item -ItemType Directory -Force C:\backups\noxh-an-dong\exports | Out-Null
```

Chạy backup DB:

```powershell
npm run prod:backup:postgres:windows
```

Chạy export Excel vận hành:

```powershell
npm run export:operations:xlsx
```

Tạo Task Scheduler chạy backup mỗi ngày 02:00:

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -NoProfile -Command `"cd C:\apps\noxh-an-dong; npm run prod:backup:postgres:windows`""
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "NOXH An Dong PostgreSQL Backup" -Action $action -Trigger $trigger -RunLevel Highest
```

### W12. Checklist nghiệm thu Windows sau deploy

- `https://noxhandong.com` mở được trang cư dân.
- App vẫn chạy sau khi restart Windows.
- Caddy tự chạy lại sau restart.
- PM2/app tự chạy lại sau restart.
- `npm run prod:backup:postgres:windows` tạo file `.dump`.
- PostgreSQL port `5432` không mở public.
- Public lookup không lộ dữ liệu cá nhân.

## Nếu sau này chuyển sang Ubuntu

Khi chuyển OS, dùng lại phần Ubuntu ở đầu file này. Dữ liệu cần chuyển bằng `pg_dump`/`pg_restore`, không copy thư mục data PostgreSQL thủ công.
