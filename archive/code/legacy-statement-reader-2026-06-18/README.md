## Legacy statement reader archived 2026-06-18

Các file trong thư mục này là reader sao kê Excel cũ, không còn nằm trên luồng import web hiện hành.

### Lý do archive

- Luồng import sao kê đang chạy thực tế dùng:
  - `app/admin/import/actions.ts`
  - `scripts/import-bank-statement-v2.ts`
  - `src/modules/transactions/import/bank-statement-common.ts`
- Cụm file archive này là một reader cũ theo hướng `readStatementWorkbook(...)`, chỉ còn wrapper/test riêng và không còn được gọi từ luồng import đang vận hành.
- Giữ lại trong `archive/` để tra cứu lịch sử, tránh xóa mất ngữ cảnh cũ.

### Files archived

- `lib-statement-reader.ts.archive`
- `lib-excel-statement-reader.ts.archive`
- `lib-excel-statement-reader.test.ts.archive`
- `src-modules-imports-statement-reader.ts.archive`
- `src-modules-imports-excel-statement-reader.ts.archive`

### Nguồn duy nhất hiện hành cho reader sao kê

- `src/modules/transactions/import/bank-statement-common.ts`
