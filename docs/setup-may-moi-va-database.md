# Hướng dẫn setup máy mới và database

## Mục tiêu

Tài liệu này dùng để dựng môi trường chạy phần mềm trên một máy Mac mới mà không cần cài thủ công quá nhiều bước nhớ tay.

Phần mềm hiện tại cần tối thiểu:

- Node.js + npm
- PostgreSQL
- Prisma Client

## Có nên đồng bộ luôn database qua Git không?

Có thể, nếu:

- tất cả máy đều là máy cá nhân của anh
- repo đang để private
- dữ liệu hiện tại chỉ là dữ liệu dev / thử nghiệm

Nhưng không nên commit cả thư mục `postgres-data`.

### Cách nên dùng

Dùng **logical snapshot** của database và commit snapshot đó vào repo.

Project đã có sẵn cơ chế này:

- thư mục snapshot: `db-sync/`
- script backup:
  - `scripts/setup/backup-db-to-repo.sh`
- script restore:
  - `scripts/setup/restore-db-from-repo.sh`

### Vì sao cách này tốt hơn commit `postgres-data`

- nhẹ hơn nhiều
- dễ pull / restore trên máy khác
- ít rủi ro hỏng repo
- không phụ thuộc đường dẫn nội bộ của PostgreSQL
- ít gây lỗi push hơn so với commit data directory

### Khi nào nên dùng snapshot DB

- muốn đồng bộ môi trường dev giữa các máy cá nhân
- muốn giữ nguyên dataset thử nghiệm đã import
- muốn máy khác mở lên là có đúng dữ liệu đang test

### Khi nào không nên dùng snapshot DB

- dữ liệu production
- dữ liệu nhạy cảm
- database quá lớn

Trong các trường hợp đó nên:

- chỉ commit schema + migrations
- rồi import lại từ file nguồn

## Có cần cài đầy đủ trên máy mới không?

Có.

Nếu máy mới muốn:

- chạy backend
- chạy migration
- import dữ liệu Excel/PDF
- lưu dữ liệu vào database thật

thì bắt buộc phải có:

1. Node.js
2. PostgreSQL
3. biến môi trường `.env`

Không cần cài thêm một tool riêng để import Excel. App sẽ tự làm phần đó khi backend hoàn thiện.

## Tại sao không đưa bộ cài binary vào repo?

Không nên commit các file dạng:

- `.dmg`
- `.zip`
- binary nặng

vào GitHub vì:

- repo sẽ phình to rất nhanh
- dễ gây lỗi push
- khó quản lý version

Thay vào đó, project chỉ giữ:

- script tải installer từ nguồn chính thức
- script khởi động database local
- tài liệu setup

## Cấu trúc script setup

Các script nằm ở:

- `scripts/setup/install-postgres-app-local.sh`
- `scripts/setup/start-postgres-local.sh`
- `scripts/setup/stop-postgres-local.sh`
- `scripts/setup/create-dev-db.sh`
- `scripts/setup/backup-db-to-repo.sh`
- `scripts/setup/restore-db-from-repo.sh`

Các script này:

- không tạo file nặng trong repo
- cài `Postgres.app` vào `~/Applications`
- tạo data directory ở `~/.local/share/apartment-fee-reviewer`
- không ảnh hưởng commit Git

## Quy trình setup trên máy mới

### Bước 1. Cài Node.js

Khuyến nghị dùng `nvm`.

Sau khi cài xong, kiểm tra:

```bash
node -v
npm -v
```

### Bước 2. Cài Postgres.app bằng script

Trong thư mục project:

```bash
bash scripts/setup/install-postgres-app-local.sh
```

Mặc định script sẽ cài:

- `Postgres.app` version `v2.9.4`
- PostgreSQL major `17`

### Bước 3. Khởi động PostgreSQL local

```bash
bash scripts/setup/start-postgres-local.sh
```

### Bước 4. Tạo database dev

```bash
bash scripts/setup/create-dev-db.sh
```

Database mặc định:

- `apartment_fee_reviewer`

### Bước 5. Tạo file `.env`

Nếu chưa có:

```bash
cp .env.example .env
```

Giá trị hiện tại:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/apartment_fee_reviewer?schema=public"
```

### Bước 6. Generate Prisma client

```bash
npm run prisma:generate
```

### Bước 7. Chạy migration

```bash
npx prisma migrate dev --name init
```

## Đồng bộ database giữa các máy qua Git

### Backup DB hiện tại vào repo

```bash
npm run db:backup:repo
```

Sau đó commit:

```bash
git add db-sync
git commit -m "Cap nhat snapshot database dev"
git push
```

### Restore DB từ repo trên máy khác

Sau khi pull code mới nhất:

```bash
npm run db:restore:repo
```

### File snapshot hiện tại

Thư mục:

- `db-sync/`

File chính:

- `apartment_fee_reviewer.latest.sql`
- `apartment_fee_reviewer.latest.meta.json`

### Lưu ý

- chỉ nên giữ **1 snapshot mới nhất**
- không commit `.env`
- không commit `postgres-data`
- nếu snapshot quá lớn, quay lại phương án:
  - migrations + import lại từ file mẫu

## Các lệnh kiểm tra nhanh

### Kiểm tra postgres đang chạy chưa

```bash
lsof -nP -iTCP:5432 -sTCP:LISTEN
```

### Kiểm tra database đã có chưa

```bash
$HOME/Applications/Postgres.app/Contents/Versions/17/bin/psql -h localhost -p 5432 -U postgres -lqt
```

### Kiểm tra bảng sau migration

```bash
$HOME/Applications/Postgres.app/Contents/Versions/17/bin/psql -h localhost -p 5432 -U postgres -d apartment_fee_reviewer -c "\\dt"
```

## Dừng database local

```bash
bash scripts/setup/stop-postgres-local.sh
```

## Trạng thái hiện tại của project

Đến thời điểm tài liệu này được tạo:

- schema Prisma đã validate
- Prisma client đã generate
- migration đầu tiên đã chạy thành công
- PostgreSQL local đang được dựng bằng `Postgres.app` user-local, không phụ thuộc Homebrew

## Kết luận

Máy mới cần setup database thật nếu muốn chạy backend đúng nghĩa.

Nhưng không cần tạo tool import riêng hoặc nhập tay dữ liệu master, vì hướng triển khai của project là:

- nhập Excel vào bảng raw
- transform sang bảng business
- review trên app

Toàn bộ bước này sẽ nằm trong chính phần mềm.

Nếu muốn nhiều máy cá nhân cùng phát triển trên cùng dataset dev, phương án hiện tại được khuyến nghị là:

- commit `schema + migrations + scripts`
- và khi thật sự cần thì commit thêm `db-sync/apartment_fee_reviewer.latest.sql`

Không dùng Git để sync trực tiếp thư mục data của PostgreSQL.
