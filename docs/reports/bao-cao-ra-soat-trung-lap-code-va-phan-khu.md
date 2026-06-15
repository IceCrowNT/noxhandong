# Báo cáo rà soát trùng lặp code và phân khu

Ngày rà soát: 2026-06-10

Mục tiêu của báo cáo này là đối chiếu code đang chạy với quy tắc tại
`docs/module-map.md`, phân biệt:

- nguồn chuẩn duy nhất;
- wrapper tương thích, không chứa nghiệp vụ riêng;
- logic đang bị lặp thật;
- code cũ không còn được route hiện hành sử dụng;
- file đang đặt sai khu vực sở hữu.

Không file nào được xóa hoặc chuyển archive trong lần rà soát này.

## 1. Kết luận ngắn

Project chưa có tình trạng nhiều parser mã căn chạy song song. Nguồn chuẩn duy
nhất hiện tại là:

`src/modules/transactions/parser/apartment-parser.ts`

Các vấn đề trùng đáng xử lý nằm ở luồng thu phí/public và luồng import:

1. Quy tắc quy đổi "tháng đã đóng đến" đang tồn tại ở ít nhất bốn nơi.
2. `app/admin/import/actions.ts` đang chứa nghiệp vụ DB và gọi script đồng bộ.
3. Các script import dài đang vừa đọc file, áp dụng rule, vừa ghi DB.
4. Luồng MVP xử lý file trong bộ nhớ không còn được UI hiện hành gọi tới nhưng
   vẫn còn nguyên API, UI và module phụ trợ.
5. Một số tài liệu backlog/todo đã hoàn thành vai trò nhưng vẫn được liệt kê như
   tài liệu xương sống.

## 2. Nguồn chuẩn và wrapper tương thích

### Parser mã căn

Nguồn chuẩn:

- `src/modules/transactions/parser/apartment-parser.ts`

Wrapper:

- `lib/parser/apartment-parser.ts`

Wrapper chỉ `export *`, không chứa regex hoặc thuật toán riêng. Đây không phải
trùng nghiệp vụ, nhưng nên bỏ dần sau khi toàn bộ import và test chuyển sang
đường dẫn module chuẩn.

### Các wrapper `lib` khác

Các file sau chủ yếu chỉ re-export từ `src/modules`:

- `lib/constants.ts`
- `lib/types.ts`
- `lib/statement-reader.ts`
- `lib/excel/exporter.ts`
- `lib/excel/management-reader.ts`
- `lib/excel/statement-reader.ts`
- `lib/pdf/statement-pdf-reader.ts`
- `lib/matcher.ts`
- `lib/review/allocations.ts`
- `lib/review/presentation.ts`
- `lib/review/summary.ts`
- `lib/utils/text.ts`

Đánh giá:

- Không gây sai lệch thuật toán ở thời điểm hiện tại.
- Là nợ tương thích từ cấu trúc cũ.
- Chỉ archive sau khi route/test không còn import qua `lib`.

### Wrapper chạy TypeScript

Hai file `.cjs` sau chỉ khởi chạy file `.ts` bằng `tsx`:

- `scripts/import-bank-statement-v2.cjs`
- `scripts/report-bank-statement-parser-v2.cjs`

Đây là adapter CLI, không phải hai bản thuật toán khác nhau.

## 3. Logic đang bị lặp thật

### 3.1. Quy đổi tháng đã đóng đến

Logic `BASE_YEAR = 2026`, quy đổi tháng tương đối, số âm, số vượt 12 và tiền lẻ
đang xuất hiện tại:

- `scripts/import-fee-tracking-v2.cjs`
- `scripts/prepare-fee-public-batch-v2.cjs`
- `scripts/prepare-public-batch-from-history-v2.cjs`
- `src/modules/apartments/dashboard.ts`

Rủi ro:

- Một nơi sửa cách hiểu `-1`, `14`, `3.5` nhưng nơi khác không đổi.
- Import, preview public và dashboard có thể hiển thị khác nhau.
- Năm gốc đang hardcode ở nhiều file.

Phân khu mục tiêu:

`src/modules/billing/paid-through.ts`

Module này phải sở hữu:

- parse giá trị Excel;
- quy đổi tháng tương đối sang tháng/năm thực;
- làm tròn số lẻ theo rule nghiệp vụ;
- sinh nội dung hiển thị;
- xác định dữ liệu cần rà soát.

### 3.2. Import Excel theo dõi thu phí

File đang trực tiếp xử lý:

- `app/admin/import/page.tsx`: giao diện.
- `app/admin/import/actions.ts`: upload, validate, gọi script, tạo sổ chốt.
- `scripts/import-fee-tracking-v2.cjs`: đọc Excel, tìm cột, parse, ghi staging.
- `scripts/prepare-fee-public-batch-v2.cjs`: tạo snapshot Excel.
- `scripts/publish-fee-public-batch-v2.cjs`: chốt batch public.

Vấn đề:

- `actions.ts` chứa `createMonthlyClosingLedgerFromPublicBatch`, là nghiệp vụ
  billing chứ không phải điều phối route.
- Script import khoảng 400 dòng, không còn là CLI mỏng.
- Web dùng `execFileSync`, block request cho đến khi script kết thúc.
- Rule đọc Excel và rule public khó test độc lập.

Phân khu mục tiêu:

- `src/modules/imports/excel/fee-tracking-reader.ts`: chỉ đọc và map Excel.
- `src/modules/billing/fee-tracking/import-service.ts`: validate và lưu staging.
- `src/modules/billing/public-status/service.ts`: preview/publish snapshot.
- `src/modules/billing/closing-ledger/service.ts`: tạo sổ chốt tháng.
- `app/admin/import/actions.ts`: auth, nhận form, gọi service, redirect.
- `scripts/*.cjs`: CLI mỏng gọi lại cùng service.

### 3.3. Import và báo cáo sao kê

Các file đang chia sẻ nhưng chưa có module sở hữu hoàn chỉnh:

- `scripts/import-bank-statement-v2.ts`
- `scripts/report-bank-statement-parser-v2.ts`
- `scripts/reconcile-fee-tracking-bank-statement.ts`
- `scripts/add-apartment-parser-column-to-statement.ts`
- `scripts/bank-statement-common.ts`
- `src/modules/imports/excel/statement-reader.ts`

`scripts/bank-statement-common.ts` hiện sở hữu đọc dòng sao kê, format và
fingerprint cho nhiều script. Logic dùng chung nằm trong `scripts` là sai ranh
giới module.

Phân khu mục tiêu:

- `src/modules/imports/bank-statement/reader.ts`
- `src/modules/transactions/fingerprint.ts`
- `src/modules/transactions/import-service.ts`
- `src/modules/reports/reconciliation/*`

Các script chỉ nhận tham số và gọi module tương ứng.

### 3.4. Chuẩn hóa mã căn khi sync master

Logic chuẩn hóa riêng đang tồn tại tại:

- `scripts/sync-apartment-master.cjs`
- `scripts/sync-management-master.cjs`
- `scripts/import-fee-tracking-v2.cjs`
- `src/modules/shared/utils/text.ts`

Nguồn chuẩn phải là `normalizeApartmentCode` trong
`src/modules/shared/utils/text.ts`. Các script không nên tự duy trì biến thể
`normalizeApartmentCodeForImport`.

## 4. Luồng cũ không còn được UI hiện hành sử dụng

Không tìm thấy route/page hiện hành import hoặc render `ReviewDashboard`.

Cụm legacy phụ thuộc lẫn nhau:

- `components/review-dashboard.tsx`
- `src/modules/transactions/ui/review-dashboard.tsx`
- `app/api/analyze/route.ts`
- `app/api/export/route.ts`
- `src/modules/transactions/matcher.ts`
- `src/modules/transactions/review/summary.ts`
- `src/modules/transactions/review/presentation.ts`
- `src/modules/imports/statement-reader.ts`
- `src/modules/imports/excel/management-reader.ts`
- `src/modules/imports/excel/exporter.ts`
- các wrapper và test tương ứng trong `lib/`

Lưu ý:

- `app/api/export/monthly-fee-ledger` và
  `app/api/export/fee-notice-list` là chức năng mới đang được dashboard dùng,
  không thuộc cụm legacy.
- Parser mã căn và `transactions/review/allocations.ts` vẫn được luồng DB hiện
  tại sử dụng, không được archive theo cụm.

Đề xuất:

1. Xác nhận không còn cần màn upload hai file trong bộ nhớ.
2. Chuyển UI/API legacy cùng module chỉ phục vụ nó vào
   `archive/code/legacy-memory-review/`.
3. Giữ lại module đang được luồng DB hiện hành import.
4. Chạy test/build sau khi chuyển.

## 5. File đặt sai khu vực hoặc đang quá tải trách nhiệm

| File | Hiện trạng | Khu vực mục tiêu |
| --- | --- | --- |
| `app/admin/import/actions.ts` | Điều phối form + chạy process + nghiệp vụ sổ chốt | `app` chỉ điều phối; nghiệp vụ sang `billing` |
| `app/admin/dashboard/page.tsx` | Khoảng 1.500 dòng UI và nhiều khối chức năng | Tách component theo dashboard section |
| `app/admin/transactions/review/page.tsx` | Khoảng 970 dòng query + trình bày | Query/view-model sang `transactions/review` |
| `src/modules/apartments/dashboard.ts` | Khoảng 690 dòng, chứa cả fee analytics | Tách analytics sang `billing/analytics` |
| `scripts/bank-statement-common.ts` | Logic dùng chung nằm trong CLI area | Chuyển sang `imports`/`transactions` |
| `src/modules/imports/statement-reader.ts` | Import ngược qua wrapper `@/lib/pdf/...` | Import trực tiếp module PDF trong `src` |
| `app/globals.css` | Hơn 1.000 dòng, còn selector legacy | Dọn sau khi archive UI V1 |

## 6. Tài liệu có vai trò chồng lấn

### Giữ làm xương sống

- `docs/roadmap.md`: trạng thái và thứ tự task cấp cao.
- `docs/checklist-trien-khai-va-nghiem-thu.md`: tiêu chí nghiệm thu.
- `docs/handoff.md`: trạng thái bàn giao thực tế.
- `docs/module-map.md`: ranh giới sở hữu code.
- `docs/database.md`: thiết kế DB duy nhất.
- `docs/parser-ma-can-ho.md`: rule parser duy nhất.
- `docs/design-system.md`: chuẩn UI/UX.

### Giữ nhưng phải giới hạn phạm vi

- `docs/phase-2-roadmap.md`: chi tiết execution của Phase 2; không được tự đặt
  trạng thái tổng khác `roadmap.md`.
- `docs/thiet-ke-duyet-sao-ke-phase-2.md`: spec màn hình, không quản lý tiến độ.
- `docs/doi-soat-sao-ke-va-bang-chung.md`: rule nghiệp vụ, không làm backlog.

### Đề xuất archive sau khi đồng bộ task còn mở

- `docs/todolist-dong-thuan-antigravity-codex.md`
- `docs/backlog-doi-soat-sao-ke.md`
- `docs/de-xuat-don-gian-hoa-xuong-song-va-db.md`

Ba file này có giá trị lịch sử/đề xuất. Task chưa hoàn thành cần chuyển vào
`roadmap.md`; quyết định DB đã duyệt cần chuyển vào `database.md`; sau đó mới
chuyển tài liệu gốc vào `docs/archive/`.

## 7. Thứ tự xử lý đề xuất

### P0 - tránh sai lệch dữ liệu

1. Tạo `billing/paid-through.ts`.
2. Chuyển bốn nơi đang tự quy đổi tháng về dùng chung module.
3. Bổ sung test cho `-1`, `0`, `1`, `12`, `14`, số lẻ và năm ngoài 2026.

### P1 - làm rõ luồng import

1. Tách reader Excel và import service khỏi script.
2. Tách preview/publish/closing ledger khỏi `app/admin/import/actions.ts`.
3. Thay `execFileSync` trong request web bằng gọi service trực tiếp.

### P2 - dọn legacy có kiểm soát

1. Chuyển cụm `ReviewDashboard` memory-flow vào archive.
2. Chuyển test còn cần sang import trực tiếp từ `src/modules`.
3. Archive wrapper `lib` khi không còn reference.

### P3 - giảm file quá lớn

1. Tách dashboard thành section component.
2. Tách query/view-model của màn duyệt sao kê.
3. Dọn CSS legacy.
4. Đồng bộ backlog cũ vào roadmap rồi archive tài liệu lịch sử.

## 8. Các việc cần chủ dự án duyệt trước khi thực hiện

- Archive cụm UI/API memory-flow cũ.
- Archive các wrapper `lib` sau khi đổi import.
- Archive ba tài liệu backlog/đề xuất đã nêu.
- Thay đổi luồng import web từ chạy script sang gọi service trực tiếp.

Việc gom `paid-through` thành một module dùng chung không thay đổi nghiệp vụ và
có thể thực hiện trước, nhưng vẫn cần test dữ liệu thật trước khi deploy.
