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

- [x] Hoàn thành

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

- [x] Hoàn thành

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

- [x] Hoàn thành

---

## Task 5. Import file Excel quản lý vào bảng raw

### Mục tiêu

- không nhập thẳng vào bảng business
- lưu staging trước

### File mẫu đang dùng để phát triển

- `docs/Theo dõi thu phí T4.xlsx`

### Ghi chú

- Tôi có thể dùng luôn file trong `docs/`, không cần anh post lại ở bước này.
- Nếu muốn đổi sang file khác, anh chỉ cần:
  - đặt file vào `docs/`, hoặc
  - đưa cho tôi path cụ thể.

### Đã làm

- tạo script import:
  - `scripts/import-management-raw.cjs`
- import file mẫu:
  - `docs/Theo dõi thu phí T4.xlsx`
- tạo `ImportBatch` thật trong DB
- lưu từng dòng vào `RawManagementRow`

### Kết quả import thực tế

- `batchId`: `cmo3svv9t00006tz6edwpu0g4`
- tổng số dòng raw: `1944`
- số dòng theo sheet:
  - `Danh sách khách hàng`: `939`
  - `Lịch sử đóng phí`: `938`
  - `Sheet1`: `46`
  - `Khách ck nhầm vào tk An Điền`: `16`
  - `Khách nộp bổ sung nợ vàoAn Điền`: `5`

### Rà soát chênh lệch trước khi transform sang Apartment

Kết quả kiểm tra sheet `Danh sách khách hàng`:

- tổng số dòng trong sheet: `939`
- trừ `1` dòng header
- còn `938` dòng dữ liệu
- trong đó có `4` dòng cuối không có mã căn
- số dòng có mã căn thực sự: `934`
- số mã căn duy nhất nếu tính cả `LKV.*`: `934`

Các dòng bất thường cần ghi nhớ:

- `LKV.45`
- `LKV.47`
- `LKV.58`

Kết luận hiện tại đã chốt:

- Hệ thống hiện tại chấp nhận ba nhóm mã:
  - `L...`
  - `LK...`
  - `LKV.*`
- `LKV.*` vẫn giữ nguyên mã căn khi lưu vào hệ thống
- nhưng được xếp nhóm tính phí như `LIEN_KE`
- Vì vậy khi transform sang `Apartment`, số lượng chuẩn phải là:
  - `934` căn hợp lệ

Chi tiết loại bỏ:

- `4` dòng rỗng cuối sheet

Khuyến nghị khi sang Task 6:

- transform `934` căn hợp lệ vào `Apartment`
- gán `LKV.*` vào nhóm phí `LIEN_KE`
- vẫn giữ nguyên `code` là:
  - `LKV.45`
  - `LKV.47`
  - `LKV.58`
- ghi log hoặc lưu danh sách `4` dòng rỗng bị loại để có thể audit lại sau

### Cách kiểm tra

- một batch import được tạo trong `import_batches`
- số dòng raw import đúng với file thật
- lưu được `sheet_name`, `row_index`, `payload`

Lệnh kiểm tra:

```bash
$HOME/Applications/Postgres.app/Contents/Versions/17/bin/psql \
  -h localhost -p 5432 -U postgres -d apartment_fee_reviewer \
  -c 'select count(*) from "ImportBatch";' \
  -c 'select count(*) from "RawManagementRow";' \
  -c 'select "sheetName", count(*) from "RawManagementRow" group by "sheetName" order by "sheetName";'
```

### Trạng thái

- [x] Hoàn thành

---

## Task 6. Transform từ raw management sang master data

### Mục tiêu

- sinh dữ liệu chuẩn từ file quản lý

### Đã làm

- tạo file rule phí định kỳ:
  - `config/periodic-fee-rules.json`
- tạo script transform:
  - `scripts/sync-management-master.cjs`
- transform từ `RawManagementRow` sang:
  - `Apartment`
  - `Resident`
  - `Occupancy`

### Rule đã chốt cho bước này

- chấp nhận mã căn:
  - `L...`
  - `LK...`
  - `LKV.*`
- `LKV.*` vẫn giữ nguyên `code`
- nhưng được xếp vào nhóm `LIEN_KE`
- phí định kỳ:
  - `CHUNG_CU`: `250.000 / tháng`
  - `LIEN_KE`: `200.000 / tháng`

### Kết quả transform thực tế

- `Apartment`: `934`
- `Resident`: `918`
- `Occupancy`: `934`

Phân bố loại căn:

- `CHUNG_CU`: `884`
- `LIEN_KE`: `50`
  - trong đó có `3` căn:
    - `LKV.45`
    - `LKV.47`
    - `LKV.58`

Ghi chú:

- `Resident` thấp hơn `Apartment` vì script đang dedupe theo tổ hợp:
  - `fullName`
  - `phoneNumber`
- Đây là hành vi chấp nhận được cho import nền ban đầu.

### Cách kiểm tra

- số căn import được có hợp lý không
- mã căn có chuẩn hóa đúng không
- loại căn `CHUNG_CU` / `LIEN_KE` có đúng không
- cư dân có liên kết đúng với căn không

Lệnh kiểm tra:

```bash
$HOME/Applications/Postgres.app/Contents/Versions/17/bin/psql \
  -h localhost -p 5432 -U postgres -d apartment_fee_reviewer \
  -c 'select count(*) from "Apartment";' \
  -c 'select count(*) from "Resident";' \
  -c 'select count(*) from "Occupancy";' \
  -c 'select "apartmentType", count(*) from "Apartment" group by "apartmentType" order by "apartmentType";'
```

### Trạng thái

- [x] Hoàn thành

---

## Task 6B. Thiết kế lại schema cư dân/import theo V2

### Mục tiêu

- sửa điểm yếu của V1 ở phần dữ liệu cư dân
- cho phép 1 căn có nhiều người liên quan
- tách số điện thoại ra khỏi bảng cư dân
- dùng tên bảng/cột tiếng Việt không dấu
- đổi `id` sang số tự tăng để dễ review DB

### Đã làm

- tạo tài liệu rule parse cư dân:
  - `docs/resident-import-rules.vi.md`
- tạo tài liệu thiết kế:
  - `docs/database-v2.md`
- tạo draft schema:
  - `prisma/schema-v2.prisma`
- chuyển hướng thiết kế sang mô hình contact-centric theo căn hộ
- thêm script audit dữ liệu cư dân:
  - `scripts/audit-resident-contact-notes.cjs`
- chạy audit thật từ file Excel quản lý và sinh báo cáo:
  - `docs/bao-cao-audit-lien-he-can-ho.md`

### Kết quả audit thực tế

- tổng ô `THÔNG TIN CƯ DÂN` cần rà soát: `896`
- có nhiều dòng: `432`
- có nhiều số điện thoại: `553`
- có cờ trạng thái: `262`

Các nhóm dữ liệu bẩn nổi bật:

- nhiều người dùng chung một số
- nhiều số điện thoại nhưng không rõ thứ tự map
- có ghi chú nghiệp vụ như `Thanh toán theo tháng`
- có cờ trạng thái như:
  - `đã bán`
  - `chủ mới`
  - `khách thuê`
  - `cần xin sđt`
  - `sđt sai`
  - `xác minh`

### Cách kiểm tra

Kiểm tra xem V2 đã trả lời được các câu hỏi này chưa:

- 1 note có nhiều người thì lưu ở đâu?
- 1 người có nhiều số điện thoại thì lưu ở đâu?
- 1 căn có nhiều người liên quan thì lưu ở đâu?
- dữ liệu parse cư dân trước khi vào master lưu ở đâu?
- tên bảng/cột có dễ review hơn không?
- `id` đã chuyển từ chuỗi khó đọc sang số tự tăng chưa?
- báo cáo audit có chỉ ra được các ô bẩn và nhóm pattern chính không?

### Kết luận

- hướng `can_ho -> lien_he_can_ho` phù hợp hơn `Resident/Occupancy` ở giai đoạn này
- chưa nên migrate/reset DB cho đến khi chốt rule lọc bẩn cuối cùng
- bước kế tiếp nên là chốt rule staging contact theo căn, rồi mới reset DB v2

### Preview parse đã sinh

Đã tạo bộ file preview để review trước khi đổ vào DB V2:

- `docs/preview-lien-he-can-ho/preview-tong-hop.csv`
- `docs/preview-lien-he-can-ho/auto-map.csv`
- `docs/preview-lien-he-can-ho/auto-map-group.csv`
- `docs/preview-lien-he-can-ho/can-ra-soat.csv`
- `docs/preview-lien-he-can-ho/chi-luu-co-trang-thai.csv`
- `docs/preview-lien-he-can-ho/README.md`

Số lượng hiện tại:

- `AUTO_MAP`: `440` căn nguồn / `639` dòng contact preview
- `AUTO_MAP_GROUP`: `0`
- `CAN_RA_SOAT`: `491` căn nguồn / `1264` dòng contact preview
- `CHI_LUU_CO_TRANG_THAI`: `3` căn nguồn / `3` dòng preview

Ghi chú:

- bước này dùng để anh review rule bằng mắt
- chưa phải dữ liệu master cuối cùng

### Trạng thái

- [x] Hoàn thành

---

## Task 7. Import sao kê vào DB

### Mục tiêu

- lưu toàn bộ giao dịch từ Excel/PDF vào DB

### File mẫu đang dùng để phát triển

- `docs/lich-su-giao-dich(15-04-2026 09_33_29).xls`

### Ghi chú

- Tôi có thể dùng luôn file trong `docs/`, không cần anh post lại ở bước này.
- Nếu muốn kiểm thử bằng sao kê khác, anh có thể:
  - đặt file vào `docs/`, hoặc
  - gửi path cụ thể cho tôi.

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

1. Task 5. Import file Excel quản lý vào bảng raw
2. Task 6. Transform từ raw management sang master data
3. Task 7. Import sao kê vào DB
4. Task 8. Parse transaction và lưu candidate

Ghi chú:

- Task 2, Task 3, Task 4 đã hoàn thành.
- Hai file Excel mẫu hiện đã có sẵn trong `docs/`, nên có thể bắt đầu import ngay.
- File `docs/Danh_Sach_Can_Ho_Master.xlsx` đã được đối chiếu:
  - khớp `934/934` mã căn với dữ liệu hiện có
  - báo cáo: `docs/danh-gia-danh-sach-can-ho-master.md`
  - có thể dùng làm nguồn master cho `can_ho`
  - phần contact vẫn phải đi qua staging/review

Chưa nên nhảy sang viết UI mới trước khi xong các bước này.
