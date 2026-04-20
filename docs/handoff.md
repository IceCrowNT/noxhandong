# Handoff Dự Án

## Mục đích

File này dùng để:

- bàn giao nhanh trạng thái dự án giữa các máy
- giúp agent hoặc lập trình viên khác nắm được đang ở bước nào
- biết phải đọc gì trước khi tiếp tục làm
- tránh phải dựa vào lịch sử chat làm nguồn chính

## Ngày cập nhật

- 2026-04-19

## Trạng thái hiện tại

Dự án đã đi qua các bước nền tảng:

- chốt `database v1`
- dựng `Prisma schema`
- cài `PostgreSQL` local
- chạy migration đầu tiên
- import raw workbook quản lý vào DB
- transform master data từ workbook quản lý

Hiện tại chưa làm xong:

- cải thiện cấu trúc `raw payload` để dễ đối chiếu với Excel
- import sao kê vào DB
- parse transaction vào DB
- review/allocation trên DB thật

## Mốc dữ liệu quan trọng

### Workbook quản lý

File đang dùng:

- `docs/Theo dõi thu phí T4.xlsx`

Kết quả đã chốt:

- tổng số căn hợp lệ: `934`
- trong đó:
  - `CHUNG_CU`: `884`
  - `LIEN_KE`: `50`
- 3 căn `LKV.*` được chấp nhận:
  - giữ nguyên mã căn
  - nhưng tính phí như `LIEN_KE`

### Master data trong DB

Sau khi sync từ workbook quản lý:

- `Apartment`: `934`
- `Resident`: `918`
- `Occupancy`: `934`

Giải thích:

- `Resident` ít hơn `Apartment` vì đang dedupe theo:
  - `fullName`
  - `phoneNumber`
- Đây là chủ đích thiết kế, không phải lỗi import

### Raw management import

Batch hiện tại:

- `cmo3svv9t00006tz6edwpu0g4`

Số dòng raw:

- tổng: `1944`
- theo sheet:
  - `Danh sách khách hàng`: `939`
  - `Lịch sử đóng phí`: `938`
  - `Sheet1`: `46`
  - `Khách ck nhầm vào tk An Điền`: `16`
  - `Khách nộp bổ sung nợ vàoAn Điền`: `5`

## Vấn đề đang mở

### 1. Raw payload chưa đủ dễ đọc

Raw hiện tại đang lưu kiểu:

- `payload.values = [...]`

Điều này giữ được dữ liệu gốc, nhưng chưa thuận tiện để audit và đối chiếu với Excel.

Hướng sửa đã chốt:

- giữ nguyên `values`
- bổ sung:
  - `headerValues`
  - `mappedRow`
  - `rowType`
  - `sourceRowIndex`

Đây là việc nên làm trước khi đi sâu hơn vào import sao kê.

### 2. Sao kê chưa nhập vào DB

Phần sao kê hiện mới xử lý ở app cũ / memory flow, chưa đưa vào DB pipeline mới.

## File quan trọng cần đọc trước

Máy khác khi vào dự án nên đọc theo thứ tự này:

1. `docs/handoff.md`
2. `docs/checklist-trien-khai-va-nghiem-thu.md`
3. `docs/database-v1.md`
4. `docs/filter-rules.vi.md`
5. `docs/module-map.md`

Nếu làm phần DB/setup:

6. `docs/setup-may-moi-va-database.md`

Nếu kiểm chất lượng dữ liệu master:

7. `docs/bao-cao-cu-dan-bi-double.md`

## Các file và thư mục cần biết

### Schema và migration

- `prisma/schema.prisma`
- `prisma/migrations/`
- `prisma.config.ts`

### Cấu hình

- `.env.example`
- `.env` local, không commit
- `config/periodic-fee-rules.json`

### Scripts hiện có

- `scripts/setup/install-postgres-app-local.sh`
- `scripts/setup/start-postgres-local.sh`
- `scripts/setup/stop-postgres-local.sh`
- `scripts/setup/create-dev-db.sh`
- `scripts/import-management-raw.cjs`
- `scripts/sync-management-master.cjs`
- `scripts/report-resident-duplicates.cjs`

### Cấu trúc code

Code mới nên đặt trong:

- `src/modules/`

Các module đã có khung:

- `shared`
- `imports`
- `transactions`
- `database`
- `apartments`
- `residents`
- `billing`
- `exceptions`
- `documents`

`lib/` và `components/` hiện vẫn tồn tại để tương thích ngược, nhưng không nên đổ code mới vào đó nếu không cần thiết.

## Cách dựng môi trường trên máy khác

Máy khác không cần copy “file DB” từ máy này.

Cách đúng:

1. clone repo
2. cài Node.js
3. đọc `docs/setup-may-moi-va-database.md`
4. cài PostgreSQL local
5. tạo `.env` từ `.env.example`
6. chạy migration
7. import lại file mẫu trong `docs/`

Không nên sync:

- thư mục data PostgreSQL local
- `.env`
- binary cài đặt

## Lệnh thường dùng

### Prisma

```bash
npm run prisma:validate
npm run prisma:generate
npm run prisma:studio
npx prisma migrate dev
```

### Import workbook quản lý

```bash
npm run import:management:raw
npm run sync:management:master
```

### Báo cáo cư dân bị double

```bash
npm run report:resident:duplicates
```

### Chạy app

```bash
npm run dev
```

## Việc cần làm tiếp theo

### Bước 1

Sửa raw importer để payload dễ kiểm tra hơn:

- thêm `headerValues`
- thêm `mappedRow`
- import lại workbook quản lý

### Bước 2

Bắt đầu `Task 7`:

- import file sao kê mẫu vào:
  - `ImportBatch`
  - `RawBankStatementRow`

### Bước 3

Làm `Task 8`:

- chuẩn hóa raw statement rows
- sinh `BankTransaction`
- sinh `TransactionParseResult`
- sinh `TransactionCandidate`

## Quy tắc làm việc khi sang máy khác

Khi bắt đầu ở máy khác, yêu cầu agent hoặc người làm mới:

1. đọc `docs/handoff.md`
2. đọc `docs/checklist-trien-khai-va-nghiem-thu.md`
3. xác nhận trạng thái môi trường:
   - Node
   - PostgreSQL
   - `.env`
   - migration
4. chỉ sau đó mới tiếp tục task tiếp theo

Không nên bắt đầu bằng việc đọc lại toàn bộ lịch sử chat.

## Quy tắc cập nhật file này

Mỗi khi chốt xong một chặng lớn, phải cập nhật:

- `docs/handoff.md`
- `docs/checklist-trien-khai-va-nghiem-thu.md`

Nếu có thay đổi nghiệp vụ:

- cập nhật thêm `docs/filter-rules.vi.md`
- hoặc tài liệu nghiệp vụ tương ứng
