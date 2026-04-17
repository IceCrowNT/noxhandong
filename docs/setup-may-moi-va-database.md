# Hướng dẫn setup máy mới và database

## Mục tiêu

Tài liệu này dùng để dựng môi trường chạy phần mềm trên một máy Mac mới mà không cần cài thủ công quá nhiều bước nhớ tay.

Phần mềm hiện tại cần tối thiểu:

- Node.js + npm
- PostgreSQL
- Prisma Client

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
