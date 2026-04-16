# Database V1

## Muc tieu

Database v1 duoc thiet ke de giai quyet 3 bai toan truoc:

1. Nhap du lieu tho tu file Excel/PDF hien co ma khong can tool rieng.
2. Luu duoc toan bo pipeline `import -> parse -> review -> allocation -> post cong no`.
3. Co the mo rong sau nay sang chung tu, thong bao, RBAC, portal cu dan.

V1 khong co gang giai quyet tat ca module van hanh. No tap trung vao nhanh `THU`.

## Nguyen tac thiet ke

- `Sao ke ngan hang` la nguon goc doi soat, khong cong thang vao cong no.
- Phai luu ca `du lieu goc`, `ket qua parse`, `quyet dinh review`, `phan bo so tien`.
- `Can ho` va `Cu dan` la hai thuc the khac nhau.
- Rule phi (`250.000` cho chung cu, `200.000` cho lien ke) phai nam trong DB, khong hardcode duy nhat trong code.
- Cac file Excel hien co duoc import truc tiep vao `raw/staging tables`, sau do moi transform sang bang nghiep vu.

## Pham vi V1

### Bao gom

- Master data:
  - can ho
  - cu dan
  - lich su luu tru / nhan thong bao
- Import batch:
  - workbook quan ly
  - sao ke ngan hang
- Raw staging:
  - dong sheet `Danh sach khach hang`
  - dong sheet `Lich su dong phi`
  - dong sao ke
- Parse / review:
  - transaction
  - candidate
  - ket qua parse
  - review tay
  - allocation nhieu can
- Billing:
  - ky thu
  - hoa don
  - chi tiet hoa don
  - payment application
- Ngoai le / vi tam giu
- Metadata chung tu co ban

### Chua bao gom

- OCR chung tu
- Zalo bot
- RPA
- Toan bo module `CHI`, `THONG BAO`, `HOP DONG`

## Luong du lieu

### 1. Import workbook quan ly

Nguon:
- `Danh sach khach hang`
- `Lich su dong phi`

Dich:
- `import_batches`
- `raw_management_rows`
- sau do transform sang:
  - `apartments`
  - `residents`
  - `occupancies`
  - `billing_periods`
  - `invoices`
  - `invoice_lines`

### 2. Import sao ke ngan hang

Nguon:
- Excel / PDF sao ke

Dich:
- `import_batches`
- `raw_bank_statement_rows`
- `bank_transactions`
- `transaction_parse_results`
- `transaction_candidates`
- `transaction_reviews`
- `transaction_allocations`

### 3. Post vao cong no

Chi sau khi giao dich da duoc review / allocation:
- tao `payment_applications`
- cap nhat `invoices.total_paid`

## Danh sach bang

## 1. apartments

Bang master cua can ho.

Truong chinh:
- `id`
- `code` unique, vi du `L4B.519`, `LK2.24`
- `apartment_type`: `CHUNG_CU`, `LIEN_KE`
- `block_code`: `L4B`, `LK2`
- `room_code`: `519`, `24`
- `area_m2`
- `status`
- `note`

Ly do ton tai:
- `code` la khoa nghiep vu
- van can `id` noi bo de quan he on dinh

## 2. residents

Bang thong tin con nguoi.

Truong chinh:
- `id`
- `full_name`
- `phone_number`
- `zalo_link`
- `note`
- `is_active`

## 3. occupancies

Bang noi cu dan vao can ho theo thoi gian.

Truong chinh:
- `id`
- `apartment_id`
- `resident_id`
- `role`: `CHU_HO`, `THUE_CHINH`, `THANH_VIEN`
- `receive_notifications`
- `effective_from`
- `effective_to`
- `is_current`
- `note`

Ly do ton tai:
- 1 can co the doi chu / doi nguoi thue
- 1 nguoi co the co nhieu can

## 4. fee_rules

Bang luat tinh phi co hieu luc theo thoi gian.

Truong chinh:
- `id`
- `apartment_type`
- `fee_code`: `QLVH`
- `amount`
- `effective_from`
- `effective_to`
- `is_active`
- `note`

V1 seed ban dau:
- `CHUNG_CU` + `QLVH` = `250000`
- `LIEN_KE` + `QLVH` = `200000`

## 5. import_batches

Bang ghi nhan moi lan import file.

Truong chinh:
- `id`
- `source_type`: `MANAGEMENT_WORKBOOK`, `BANK_STATEMENT`, `RECEIPT_IMPORT`
- `file_name`
- `file_hash`
- `mime_type`
- `row_count`
- `status`
- `error_summary`
- `metadata` JSON
- `imported_at`

Ly do ton tai:
- truy vet file nao tao ra du lieu nao
- chong import trung batch

## 6. raw_management_rows

Bang staging cho workbook quan ly.

Truong chinh:
- `id`
- `batch_id`
- `sheet_name`
- `row_index`
- `row_type`: `CUSTOMER`, `FEE_HISTORY`, `OTHER`
- `payload` JSON

Ly do ton tai:
- luu duoc du lieu goc tu Excel
- co the chay lai transform khi doi rule

## 7. raw_bank_statement_rows

Bang staging cho sao ke.

Truong chinh:
- `id`
- `batch_id`
- `row_index`
- `payload` JSON

## 8. bank_transactions

Bang transaction da chuan hoa tu sao ke.

Truong chinh:
- `id`
- `batch_id`
- `transaction_fingerprint` unique
- `bank_reference` nullable unique
- `transaction_date`
- `amount`
- `description_raw`
- `description_normalized`
- `sender_name`
- `sender_account`
- `transaction_id_text`
- `raw_payload` JSON

Ly do ton tai:
- day la don vi nghiep vu trung tam cua he thong

## 9. transaction_parse_results

Ket qua parse tong hop cho moi transaction.

Truong chinh:
- `id`
- `transaction_id` unique
- `parser_version`
- `parsed_apartment_code`
- `match_status`
- `match_reason`
- `match_confidence`
- `is_internal_transaction`

Trang thai ban dau:
- `EXACT_MATCH`
- `NORMALIZED_MATCH`
- `MULTI_MATCH`
- `INVALID_CODE`
- `UNPARSED`
- `IGNORED_INTERNAL`
- `NEED_REVIEW`
- `MANUAL_FIXED`
- `APPROVED`

## 10. transaction_candidates

Danh sach candidate khi parser tim thay nhieu kha nang.

Truong chinh:
- `id`
- `parse_result_id`
- `apartment_code`
- `score`
- `reason`
- `rank_order`

Ly do ton tai:
- giai thich duoc vi sao dong bi `MULTI_MATCH`

## 11. transaction_reviews

Quyet dinh duyet tay cua nguoi dung.

Truong chinh:
- `id`
- `transaction_id`
- `decision_status`
- `selected_apartment_code`
- `review_note`
- `reviewed_by`
- `reviewed_at`
- `payload` JSON

Ly do ton tai:
- luu lai sua tay, khong mat khi import lai

## 12. transaction_allocations

Bang phan bo mot giao dich cho mot hoac nhieu can.

Truong chinh:
- `id`
- `transaction_id`
- `apartment_id`
- `allocated_amount`
- `allocation_method`: `SINGLE`, `MULTI_EXACT`, `MULTI_PRORATED`, `MANUAL`
- `allocation_note`
- `sequence_no`
- `is_confirmed`

Ly do ton tai:
- day la bang bat buoc vi du lieu thuc te co nhieu giao dich nhieu can

## 13. exception_cases

Bang theo doi ngoai le va vi tam giu.

Truong chinh:
- `id`
- `transaction_id`
- `apartment_id` nullable
- `exception_type`
- `amount`
- `status`
- `resolution_note`
- `resolved_at`

Exception type V1:
- `AN_DIEN`
- `CK_NHAM`
- `NOP_HO`
- `GHI_SAI_MA_CAN`
- `THIEU_TIEN`
- `THUA_TIEN`
- `KHONG_RO_CAN`
- `NOI_BO`

## 14. billing_periods

Bang ky thu theo thang.

Truong chinh:
- `id`
- `period_key` unique, vi du `04/2026`
- `month`
- `year`
- `start_date`
- `end_date`
- `status`

## 15. invoices

Hoa don tong hop theo can / ky thu.

Truong chinh:
- `id`
- `apartment_id`
- `billing_period_id`
- `carry_over_amount`
- `total_charge`
- `total_paid`
- `balance_amount`
- `status`
- `note`

## 16. invoice_lines

Chi tiet tung dong phi trong mot hoa don.

Truong chinh:
- `id`
- `invoice_id`
- `fee_code`
- `description`
- `quantity`
- `unit_price`
- `amount`
- `source_rule_id` nullable

Ly do ton tai:
- khong hardcode cot `phi_qlvh`, `phi_gui_xe`, `tien_nuoc`

## 17. payment_applications

Bang gach no tu allocation vao invoice.

Truong chinh:
- `id`
- `allocation_id`
- `invoice_id`
- `applied_amount`
- `applied_at`
- `note`

Ly do ton tai:
- 1 allocation co the ung vao nhieu invoice
- 1 invoice co the nhan tien tu nhieu allocation

## 18. documents

Metadata chung tu / anh / PDF.

Truong chinh:
- `id`
- `apartment_id` nullable
- `transaction_id` nullable
- `document_type`
- `storage_path`
- `original_file_name`
- `document_date`
- `note`

V1 chi luu metadata, chua OCR.

## Quan he chinh

- `apartments` 1-n `occupancies`
- `residents` 1-n `occupancies`
- `import_batches` 1-n `raw_management_rows`
- `import_batches` 1-n `raw_bank_statement_rows`
- `import_batches` 1-n `bank_transactions`
- `bank_transactions` 1-1 `transaction_parse_results`
- `transaction_parse_results` 1-n `transaction_candidates`
- `bank_transactions` 1-n `transaction_reviews`
- `bank_transactions` 1-n `transaction_allocations`
- `bank_transactions` 1-n `exception_cases`
- `apartments` 1-n `transaction_allocations`
- `billing_periods` 1-n `invoices`
- `apartments` 1-n `invoices`
- `invoices` 1-n `invoice_lines`
- `transaction_allocations` 1-n `payment_applications`
- `invoices` 1-n `payment_applications`

## Import du lieu tu Excel hien tai

### Khong can tool rieng trong V1

Co the import truc tiep trong web app:

1. Upload file Excel quan ly
2. App doc workbook
3. Ghi dong goc vao bang raw
4. Chay transform sang bang nghiep vu
5. Hien bao cao loi import neu co

### Mapping de xuat

#### Sheet `Danh sach khach hang`

- tao / update `apartments`
- tao / update `residents`
- tao / update `occupancies`

#### Sheet `Lich su dong phi`

- ghi truoc vao `raw_management_rows`
- transform sang:
  - `billing_periods`
  - `invoices`
  - `invoice_lines`

Luu y:
- sheet nay co the co cong thuc / ghi chu tay / du lieu lich su
- khong nen import thang vao bang final ma khong qua staging

#### File sao ke ngan hang

- ghi vao `raw_bank_statement_rows`
- normalize thanh `bank_transactions`
- parse candidate
- review
- allocation

## Quyet dinh thiet ke quan trong

### 1. Tai sao can bang raw?

Vi du lieu hien tai co nhieu file Excel thu cong va nhieu ngoai le.
Neu bo qua bang raw:
- kho audit
- kho import lai
- kho doi mapping

### 2. Tai sao khong nhap sao ke thang vao cong no?

Vi parser co the sai.
Chi sau khi review / allocation moi duoc post vao `payment_applications`.

### 3. Tai sao `transaction_allocations` la first-class table?

Vi bai toan `1 giao dich -> nhieu can` la luong chinh, khong phai edge case.

## Thu tu trien khai

1. Tao schema DB v1
2. Tao import module cho `Danh sach khach hang`
3. Tao import module cho sao ke
4. Luu parse + candidate + review + allocation
5. Moi bat dau post vao invoice / cong no

