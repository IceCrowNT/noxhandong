# Checklist triển khai và nghiệm thu hệ thống

## Mục đích

File này dùng để:

- chốt thứ tự làm việc cho dự án
- biết mỗi giai đoạn cần làm gì
- biết xong đến đâu thì kiểm tra đến đó
- tránh làm UI trước khi chưa chắc backend
- dùng như checklist nghiệm thu nội bộ

File này viết theo hướng thực dụng:

- làm từng lớp
- kiểm từng lớp
- chỉ sang bước tiếp theo khi bước trước đã có bằng chứng chạy đúng

---

## Có cần tạo folder riêng không?

Không cần tạo một folder riêng chỉ để quản lý checklist này.

Hiện tại nên để trong thư mục:

- `docs/`

Lý do:

- đây là tài liệu dự án, không phải source code chạy
- dễ tìm cùng với các file:
  - `filter-rules.vi.md`
  - `database-v1.md`
  - `desktop-asng7jb-overview.md`
- giảm nguy cơ tạo thêm nhiều folder rời rạc

Nếu sau này tài liệu nhiều lên, có thể tách thành:

- `docs/architecture/`
- `docs/operations/`
- `docs/checklists/`

Nhưng ở giai đoạn hiện tại thì chưa cần.

---

## Nguyên tắc triển khai

Thứ tự ưu tiên đúng của dự án này là:

1. Chốt dữ liệu và luồng nghiệp vụ
2. Làm database
3. Làm backend import + parse + review + allocation
4. Kiểm backend bằng dữ liệu thật
5. Sau đó mới hoàn thiện frontend

Không nên làm theo thứ tự:

- vẽ UI trước
- rồi mới nghĩ dữ liệu lưu ở đâu

Vì hệ thống này phụ thuộc rất mạnh vào:

- import batch
- raw data
- parse candidate
- multi-match
- phân bổ nhiều căn
- ngoại lệ
- rule phí

Nếu schema và backend sai, UI làm sớm sẽ phải đập lại.

---

## Tổng quan các giai đoạn

### Giai đoạn 1. Chốt mô hình dữ liệu

Mục tiêu:

- xác định đúng các bảng và quan hệ
- biết dữ liệu nào là raw
- biết dữ liệu nào là business data

Kết quả cần có:

- tài liệu schema v1
- file Prisma schema

### Giai đoạn 2. Dựng database và ORM

Mục tiêu:

- có PostgreSQL chạy được
- có Prisma kết nối được
- có migration đầu tiên

Kết quả cần có:

- database thật
- migration tạo bảng
- Prisma Client hoạt động

### Giai đoạn 3. Import dữ liệu quản lý từ Excel

Mục tiêu:

- đọc file Excel quản lý
- đưa dữ liệu thô vào DB
- transform ra bảng master

Kết quả cần có:

- import được căn hộ
- import được cư dân
- import được occupancy cơ bản
- có staging raw rows

### Giai đoạn 4. Import sao kê ngân hàng

Mục tiêu:

- nhập transaction vào DB
- lưu raw statement rows
- chuẩn hóa transaction

Kết quả cần có:

- import batch sao kê
- transaction fingerprint
- không import trùng

### Giai đoạn 5. Parse + Match + Review

Mục tiêu:

- parse mã căn
- lưu candidate
- phân loại đúng trạng thái

Kết quả cần có:

- exact match
- normalized match
- invalid
- unparsed
- ignored internal
- multi-match

### Giai đoạn 6. Allocation nhiều căn

Mục tiêu:

- xử lý 1 giao dịch cho nhiều căn
- chia tiền đúng hoặc cảnh báo lệch

Kết quả cần có:

- allocation records
- exact allocation
- prorated allocation
- manual allocation

### Giai đoạn 7. Post vào công nợ

Mục tiêu:

- chỉ sau khi review/allocation xong mới post vào hóa đơn

Kết quả cần có:

- invoice
- invoice line
- payment application

### Giai đoạn 8. Frontend vận hành

Mục tiêu:

- UI không chỉ để đẹp, mà để xử lý được nghiệp vụ thật

Kết quả cần có:

- import hub
- review table
- allocation drawer/editor
- apartment management

---

# Task list chi tiết

## Task 0. Chuẩn hóa cấu trúc folder trước khi vào SQL

### Mục tiêu

- giảm nguy cơ project phình to sai hướng
- có chỗ đặt code mới theo module
- giữ app cũ chạy được trong lúc tách dần

### Đã làm

- tạo cấu trúc mới dưới `src/modules/`
- tách các phần đã có thành các module:
  - `shared`
  - `imports`
  - `transactions`
- thêm khung `database`
- thêm các module sẵn chỗ để phát triển tiếp:
  - `apartments`
  - `residents`
  - `billing`
  - `exceptions`
  - `documents`
- giữ `lib/` và `components/` làm lớp tương thích mỏng để không phá app hiện tại
- thêm file hướng dẫn:
  - `docs/module-map.md`

### Cách kiểm tra

- `src/modules/` đã là nơi đặt code mới
- app cũ vẫn chạy
- test và build vẫn pass

### Trạng thái

- [x] Hoàn thành

---

## Task 1. Chốt schema v1

### Đã làm gì

- xác định các bảng chính:
  - `apartments`
  - `residents`
  - `occupancies`
  - `fee_rules`
  - `import_batches`
  - `raw_management_rows`
  - `raw_bank_statement_rows`
  - `bank_transactions`
  - `transaction_parse_results`
  - `transaction_candidates`
  - `transaction_reviews`
  - `transaction_allocations`
  - `exception_cases`
  - `billing_periods`
  - `invoices`
  - `invoice_lines`
  - `payment_applications`
  - `documents`

- tách rõ:
  - dữ liệu thô
  - dữ liệu đã chuẩn hóa
  - dữ liệu review
  - dữ liệu phân bổ

### File liên quan

- `docs/database-v1.md`
- `prisma/schema.prisma`

### Cách kiểm tra

Kiểm tra xem schema đã trả lời được các câu hỏi này chưa:

- 1 file Excel quản lý sẽ vào bảng nào?
- 1 file sao kê sẽ vào bảng nào?
- 1 giao dịch nhiều căn lưu ở đâu?
- rule phí 250k / 200k lưu ở đâu?
- review tay lưu ở đâu?
- ngoại lệ lưu ở đâu?

### Trạng thái

- [x] Hoàn thành

---

## Task 2. Cài PostgreSQL

### Mục tiêu

- có một database thật để chạy migration

### Chưa làm

- cài PostgreSQL trên máy / server
- tạo database cho project

### Cách kiểm tra

Phải trả lời được:

- có kết nối được DB không?
- có tạo được database riêng cho project không?

### Dấu hiệu hoàn thành

- có chuỗi `DATABASE_URL`
- có thể chạy query đơn giản vào DB

### Trạng thái

- [ ] Chưa làm

---

## Task 3. Cài Prisma và generate client

### Mục tiêu

- đưa Prisma vào project
- kết nối schema với database thật

### Đã làm một phần

- đã cài package:
  - `prisma`
  - `@prisma/client`
  - `pg`
  - `@prisma/adapter-pg`
- đã tạo:
  - `prisma.config.ts`
  - `.env.example`
- đã tạo `.env` local cho môi trường phát triển
- đã generate Prisma client
- đã validate schema thành công

### Chưa làm

- nối Prisma với PostgreSQL thật
- chạy query thật qua DB

### Cách kiểm tra

- chạy được `prisma validate`
- chạy được `prisma generate`
- có thể import `prisma` từ `src/modules/database/prisma.ts`

### Trạng thái

- [ ] Chưa hoàn thành
- Ghi chú: đã làm xong phần cài package + generate, còn thiếu DB thật

---

## Task 4. Chạy migration đầu tiên

### Mục tiêu

- tạo toàn bộ bảng theo schema v1

### Chưa làm

- chạy migration đầu tiên vào PostgreSQL

### Cách kiểm tra

- mở Prisma Studio hoặc query SQL
- xác nhận các bảng đã có mặt

### Dấu hiệu hoàn thành

- schema trong DB khớp với `schema.prisma`

### Trạng thái

- [ ] Chưa làm

---

## Task 5. Import file Excel quản lý vào bảng raw

### Mục tiêu

- không nhập thẳng vào bảng business
- lưu staging trước

### Chưa làm

- import sheet `Danh sách khách hàng`
- import sheet `Lịch sử đóng phí`
- lưu từng dòng vào `raw_management_rows`

### Cách kiểm tra

- một batch import được tạo trong `import_batches`
- số dòng raw import đúng với file thật
- lưu được `sheet_name`, `row_index`, `payload`

### Trạng thái

- [ ] Chưa làm

---

## Task 6. Transform từ raw management sang master data

### Mục tiêu

- sinh dữ liệu chuẩn từ file quản lý

### Chưa làm

- tạo / update:
  - `apartments`
  - `residents`
  - `occupancies`

### Cách kiểm tra

- số căn import được có hợp lý không
- mã căn có chuẩn hóa đúng không
- loại căn `CHUNG_CU` / `LIEN_KE` có đúng không
- cư dân có liên kết đúng với căn không

### Trạng thái

- [ ] Chưa làm

---

## Task 7. Import sao kê vào DB

### Mục tiêu

- lưu toàn bộ giao dịch từ Excel/PDF vào DB

### Chưa làm

- lưu `raw_bank_statement_rows`
- tạo `bank_transactions`
- tạo `transaction_fingerprint`

### Cách kiểm tra

- số dòng transaction trong DB bằng số dòng đọc được từ sao kê
- import lại cùng file không bị nhân đôi

### Trạng thái

- [ ] Chưa làm

---

## Task 8. Parse transaction và lưu candidate

### Mục tiêu

- mỗi giao dịch có kết quả parse bền vững trong DB

### Chưa làm

- lưu:
  - `transaction_parse_results`
  - `transaction_candidates`

### Cách kiểm tra

Lấy vài case thực tế:

- `L4B.519`
- `L4C.406A`
- `LK2.24`
- case `multi-match`
- case `ignored`

Kiểm tra:

- parsed code đúng chưa
- candidate list đúng chưa
- không sinh candidate ảo

### Trạng thái

- [ ] Chưa làm

---

## Task 9. Lưu review tay

### Mục tiêu

- mọi thao tác sửa tay phải lưu lại

### Chưa làm

- lưu:
  - selected apartment
  - note
  - reviewed by
  - reviewed at

### Cách kiểm tra

- sửa tay một dòng
- đọc lại DB
- xác nhận quyết định review vẫn còn

### Trạng thái

- [ ] Chưa làm

---

## Task 10. Lưu allocation nhiều căn

### Mục tiêu

- 1 giao dịch có thể map nhiều căn

### Chưa làm trong DB

- lưu `transaction_allocations`

### Đã làm một phần ở app hiện tại

- logic phân bổ đã có trong code export/UI
- nhưng chưa đưa vào DB

### Cách kiểm tra

Kiểm tra các case:

- 4 căn chung cư, tổng `1.000.000`
  - mỗi căn `250.000`
- 1 căn chung cư + 1 căn liền kề
  - chuẩn `250.000 + 200.000`
- số tiền lệch chuẩn
  - phải ghi rõ allocation method và note

### Trạng thái

- [ ] Chưa làm trong DB

---

## Task 11. Tạo hóa đơn và dòng phí

### Mục tiêu

- có cấu trúc công nợ đúng

### Chưa làm

- tạo `billing_periods`
- tạo `invoices`
- tạo `invoice_lines`

### Cách kiểm tra

- 1 căn ở 1 kỳ thu chỉ có 1 invoice
- invoice line phản ánh đúng rule phí

### Trạng thái

- [ ] Chưa làm

---

## Task 12. Post payment application

### Mục tiêu

- chỉ sau review/allocation mới gạch nợ

### Chưa làm

- tạo `payment_applications`
- update `invoices.total_paid`

### Cách kiểm tra

- 1 allocation sau khi post phải hiện ở invoice
- số tiền đã nộp và số dư cập nhật đúng

### Trạng thái

- [ ] Chưa làm

---

## Task 13. Exception workflow

### Mục tiêu

- các case `An Điền`, `ck nhầm`, `nộp hộ`, `không rõ căn` phải có nơi lưu

### Chưa làm

- tạo và vận hành `exception_cases`

### Cách kiểm tra

- 1 giao dịch bị phân loại ngoại lệ phải vào đúng bucket
- có thể theo dõi trạng thái xử lý

### Trạng thái

- [ ] Chưa làm

---

## Task 14. API debug / kiểm backend không cần frontend

### Mục tiêu

- backend phải kiểm được trước khi làm UI hoàn chỉnh

### Chưa làm

- API debug
- script import/check
- Prisma Studio workflow

### Cách kiểm tra

Phải có ít nhất:

- cách xem dữ liệu trong DB
- cách chạy import thử
- cách xem parse/review/allocation bằng JSON

### Trạng thái

- [ ] Chưa làm

---

## Task 15. Frontend vận hành chính

### Mục tiêu

- làm UI sau khi dữ liệu và backend đã chắc

### Phần đã có trong app hiện tại

- bảng review
- filter
- trạng thái
- multi-allocation UI cơ bản
- export Excel

### Chưa làm theo mô hình DB

- nối frontend với DB thật
- dùng dữ liệu persistence thay vì chỉ giữ trong memory

### Cách kiểm tra

- reload trang không mất state review
- allocation vẫn còn sau khi mở lại
- import batch có lịch sử

### Trạng thái

- [ ] Chưa làm theo DB

---

# Quy trình nghiệm thu theo từng chặng

## Chặng A. Nghiệm thu dữ liệu

Khi hoàn thành Task 1 -> 4:

- schema đã đúng
- database đã chạy
- migration thành công

Nếu chưa đạt, không làm tiếp import.

## Chặng B. Nghiệm thu import dữ liệu quản lý

Khi hoàn thành Task 5 -> 6:

- import Excel quản lý thành công
- căn hộ và cư dân ra đúng
- không cần nhập tay

Nếu chưa đạt, không làm tiếp billing.

## Chặng C. Nghiệm thu sao kê

Khi hoàn thành Task 7 -> 10:

- sao kê vào DB
- parse đúng
- candidate đúng
- review đúng
- allocation đúng

Đây là chặng quan trọng nhất.

## Chặng D. Nghiệm thu công nợ

Khi hoàn thành Task 11 -> 12:

- post vào invoice đúng
- không cộng tiền nhầm
- không gạch nợ trước khi review xong

## Chặng E. Nghiệm thu frontend

Khi hoàn thành Task 15:

- UI chỉ là lớp thao tác trên dữ liệu đã đúng
- không phải nơi “đoán nghiệp vụ”

---

# Việc tiếp theo ngay bây giờ

Thứ tự làm tiếp tôi khuyên là:

1. Task 2. Cài PostgreSQL
2. Task 3. Cài Prisma
3. Task 4. Chạy migration đầu tiên
4. Task 5. Import file Excel quản lý vào bảng raw

Chưa nên nhảy sang viết UI mới trước khi xong các bước này.
