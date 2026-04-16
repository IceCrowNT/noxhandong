# Sơ đồ Module Project

## Mục tiêu

Tài liệu này quy định cách đặt file để project mở rộng dần mà không bị phình to, khó đọc hoặc trùng logic.

Nguyên tắc chung:

- `src/modules/` là nơi đặt code nghiệp vụ mới.
- `lib/` và `components/` hiện được giữ lại như lớp tương thích mỏng để không làm vỡ app cũ.
- Code mới nên ưu tiên viết vào `src/modules/`.
- Khi một phần đủ ổn định, có thể chuyển import ở `app/` sang dùng trực tiếp `src/modules/`.

## Cấu trúc hiện tại

```text
src/
  modules/
    shared/
      constants.ts
      filter-rules.ts
      types.ts
      utils/
        text.ts

    imports/
      statement-reader.ts
      excel/
        exporter.ts
        management-reader.ts
        statement-reader.ts
      pdf/
        statement-pdf-reader.ts

    transactions/
      matcher.ts
      parser/
        apartment-parser.ts
      review/
        allocations.ts
        presentation.ts
        summary.ts
      ui/
        review-dashboard.tsx
```

## Ý nghĩa từng module

### `shared`

Chứa phần dùng chung toàn app:

- `types.ts`: kiểu dữ liệu nghiệp vụ dùng xuyên suốt
- `constants.ts`: hằng số và alias mặc định
- `filter-rules.ts`: bộ rule lọc dùng cho matcher
- `utils/text.ts`: normalize text, chuẩn hóa mã căn, helper chuỗi

### `imports`

Chứa luồng nhập liệu từ file:

- `excel/management-reader.ts`: đọc workbook quản lý
- `excel/statement-reader.ts`: đọc sao kê Excel
- `pdf/statement-pdf-reader.ts`: đọc sao kê PDF
- `statement-reader.ts`: entrypoint thống nhất cho sao kê
- `excel/exporter.ts`: xuất workbook kết quả

### `transactions`

Chứa toàn bộ logic xoay quanh giao dịch sao kê:

- `matcher.ts`: ghép giao dịch với danh sách căn hộ
- `parser/apartment-parser.ts`: parser mã căn
- `review/presentation.ts`: phân loại trạng thái, nhãn UI
- `review/summary.ts`: thống kê summary
- `review/allocations.ts`: phân bổ giao dịch nhiều căn
- `ui/review-dashboard.tsx`: màn hình review chính

## Quy tắc đặt file từ bây giờ

### 1. Code liên quan import file

Đặt vào `src/modules/imports/...`

Ví dụ:

- import batch metadata
- ETL từ Excel vào DB
- validate cấu trúc file
- exporter mới

### 2. Code liên quan parse/match/review giao dịch

Đặt vào `src/modules/transactions/...`

Ví dụ:

- parse candidate
- review decision
- approve / post
- multi-allocation
- exception detection

### 3. Code liên quan DB và Prisma

Trong bước tiếp theo, nên thêm:

```text
src/modules/database/
  prisma.ts
  repositories/
```

hoặc tách repository theo từng module:

```text
src/modules/apartments/
src/modules/residents/
src/modules/imports/
src/modules/transactions/
src/modules/billing/
```

Khuyến nghị:

- Prisma client dùng chung đặt ở `src/modules/database/prisma.ts`
- Repository đặt gần domain của nó

### 4. UI mới

UI thuộc module nào thì đặt trong `ui/` của module đó.

Ví dụ:

- `src/modules/transactions/ui`
- `src/modules/billing/ui`
- `src/modules/apartments/ui`

Không nên thêm component nghiệp vụ mới trực tiếp vào `components/` trừ khi đó là wrapper tương thích.

## Phần sẽ tách tiếp trong các bước sau

Khi bắt đầu làm SQL/backend thật, nên mở rộng thêm các module:

```text
src/modules/
  apartments/
  residents/
  billing/
  exceptions/
  documents/
  database/
```

## Lưu ý chuyển tiếp

- `lib/` hiện vẫn hoạt động, nhưng chỉ nên coi là cầu nối.
- Không nên thêm logic nghiệp vụ mới vào `lib/` nếu có thể đặt trong `src/modules/`.
- Mỗi lần tách module mới cần chạy lại:
  - `npm test`
  - `npm run build`

## Kết luận

Từ thời điểm này:

- `src/modules/` là cấu trúc chuẩn mới
- `lib/` là lớp tương thích cũ
- Mọi phần liên quan SQL/Prisma sắp tới nên bám theo sơ đồ này để tránh project phình sai hướng
