# Apartment Fee Reviewer MVP

Web app nội bộ để đọc file Excel quản lý phí chung cư và file sao kê ngân hàng dạng Excel hoặc PDF, parse mã căn hộ, cho người dùng rà soát trên web rồi export ra file Excel mới. Bản này không dùng database, toàn bộ dữ liệu được xử lý trong bộ nhớ.

## Stack

- Next.js App Router
- TypeScript
- `xlsx` để đọc/ghi Excel
- `pdf-parse` để trích text từ PDF sao kê
- Vitest để test parser

## Chức năng MVP

- Upload file Excel quản lý và file sao kê Excel hoặc PDF
- Đọc sheet `Danh sách khách hàng` làm nguồn chuẩn cho mã căn hộ
- Parse nội dung chuyển khoản bằng rule-based parser
- Chuẩn hóa mã căn hộ về format `Lx.xxx`
- Match với danh sách căn hợp lệ
- Review trên web:
  - tick duyệt từng dòng
  - tick hàng loạt cho các dòng đủ điều kiện
  - lọc theo trạng thái
  - tìm kiếm theo mã căn, nội dung, tên chủ hộ
  - sửa tay mã căn bằng input có gợi ý `datalist`
- Export file Excel mới với các sheet:
  - `Lich su dong phi_reviewed`
  - `Need_review`
  - `Original_transactions`
  - `Summary`

## Cấu trúc thư mục

```text
app/
  api/
    analyze/route.ts
    export/route.ts
  globals.css
  layout.tsx
  page.tsx
components/
  review-dashboard.tsx
config/
  workbook-mapping.sample.json
lib/
  excel/
    exporter.ts
    management-reader.ts
    statement-reader.ts
  pdf/
    statement-pdf-reader.ts
    statement-pdf-reader.test.ts
  parser/
    apartment-parser.ts
    apartment-parser.test.ts
  review/
    summary.ts
  statement-reader.ts
  utils/
    text.ts
  constants.ts
  matcher.ts
  types.ts
```

## Cài đặt và chạy local

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## Chạy test parser

```bash
npm test
```

## Luồng xử lý

1. Upload workbook quản lý và workbook sao kê.
2. API `/api/analyze` đọc dữ liệu trong bộ nhớ từ `FormData`.
3. `management-reader` lấy danh sách căn hợp lệ từ sheet `Danh sách khách hàng`.
4. `statement-reader` tự nhận diện file sao kê Excel hoặc PDF rồi gọi reader phù hợp.
5. `apartment-parser` chuẩn hóa text và parse ra ứng viên mã căn.
6. `matcher` gắn trạng thái:
   - `EXACT_MATCH`
   - `NORMALIZED_MATCH`
   - `MULTI_MATCH`
   - `INVALID_CODE`
   - `UNPARSED`
7. Người dùng review trên bảng và có thể sửa tay mã căn.
8. API `/api/export` tạo workbook mới, không ghi đè file gốc.

## Ghi chú thiết kế

- Reader Excel dùng alias cột thay vì hardcode đúng một header.
- Parser ưu tiên rule-based và có sẵn test cho các case thực tế từ mô tả nghiệp vụ.
- MVP chưa cập nhật trực tiếp sheet `Lịch sử đóng phí` để tránh phá cấu trúc workbook gốc.
- Nếu cần mở rộng sau này, có thể:
  - thêm mapping config đọc từ file JSON
  - thêm sheet ghi log thao tác duyệt
  - thêm cơ chế merge an toàn vào workbook gốc sau khi thống nhất nghiệp vụ

## Dữ liệu đầu vào kỳ vọng

### File quản lý

- Có sheet `Danh sách khách hàng`
- Có cột mã căn hộ theo một trong các tên gần đúng:
  - `Mã căn hộ`
  - `Mã căn`
  - `Số căn hộ`
  - `Số căn`

### File sao kê

- Có cột nội dung chuyển khoản và số tiền
- Hỗ trợ tên cột gần đúng:
  - `Ngày giao dịch`
  - `Số tiền`
  - `Nội dung`
  - `Tên người chuyển`
  - `Tài khoản chuyển`
  - `Mã giao dịch`

### File sao kê PDF

- MVP hỗ trợ PDF text-based, không hỗ trợ PDF scan ảnh hoặc OCR.
- Reader PDF dùng heuristic để:
  - tách nhóm giao dịch theo dòng bắt đầu bằng ngày `dd/mm/yyyy` hoặc `dd-mm-yyyy`
  - lấy số tiền giao dịch từ cụm số tiền ở cuối hoặc gần cuối dòng
  - giữ lại mô tả chuyển khoản để parser mã căn tiếp tục xử lý
- Nếu PDF có bố cục quá khác, hệ thống sẽ báo lỗi parse để đổi sang Excel hoặc PDF text rõ hơn.

## Hướng mở rộng

- Bổ sung dropdown search component tốt hơn khi danh sách căn quá lớn
- Thêm upload drag-and-drop
- Thêm mapping gợi ý theo tên chủ hộ và lịch sử đóng phí
- Thêm ghi nhận hành động reviewer và phân quyền nếu cần
