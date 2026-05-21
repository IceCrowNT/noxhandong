# Đánh giá & Góp ý — Project Apartment Fee Reviewer

> **Tài liệu này gồm 2 phần:**
> - **Phần I** — Đánh giá tổng quan dự án (General Project Review)
> - **Phần II** — Architecture Audit chuyên sâu dưới góc nhìn Senior System Architect & Financial Product Manager

> Đây là nhận xét độc lập, **không sửa bất kỳ file nào**. Mục tiêu là cung cấp góc nhìn khách quan để hỗ trợ phát triển tiếp theo.

---

## 1. Tổng quan

Project là một **web app quản lý và đối soát thu phí căn hộ** được xây dựng cho Ban Quản trị chung cư An Đồng. Stack hiện tại: Next.js 15 + React 19 + PostgreSQL + Prisma, kết hợp Excel làm nguồn vận hành thủ công và scripts CLI để nhập liệu.

**Mức độ trưởng thành:** Khá cao so với quy mô một dự án nội bộ. Project có tư duy kỹ thuật rõ ràng, documentation đầy đủ, và có nhiều lựa chọn thiết kế thể hiện kinh nghiệm thực tế.

---

## 2. Điểm mạnh nổi bật

### 2.1. Tài liệu hóa rất tốt — hiếm gặp ở project nội bộ

Đây là điểm ấn tượng nhất của project. Hệ thống `docs/` được xây dựng bài bản với:

- `roadmap.md` làm control cấp cao, cập nhật theo ngày (granular đến từng task A–O)
- `handoff.md` dùng để bàn giao trạng thái giữa máy/người, không phụ thuộc vào lịch sử chat
- `module-map.md` định nghĩa ranh giới module, luật phụ thuộc, bảng "đặt file mới ở đâu"
- `checklist-trien-khai-va-nghiem-thu.md` và `checklist-duyet-truoc-deploy.md` là **cổng nghiệm thu thủ công** nghiêm túc
- `parser-ma-can-ho.md` là tài liệu trung tâm cho thuật toán lõi
- `design-system.md` với nguyên tắc UI/UX rõ ràng, kể cả copy chuẩn cho từng trạng thái

Rất ít project nội bộ ở quy mô này đạt được mức tài liệu hóa như vậy.

### 2.2. Thiết kế schema database V2 chín muồi

Schema `schema-v2.prisma` có nhiều điểm đáng khen:

- **Tên bảng/cột tiếng Việt không dấu** → dễ đọc, nhất quán với ngôn ngữ nghiệp vụ
- **ID autoincrement** thay vì CUID → phù hợp hơn với quy mô dữ liệu thực tế
- Phân tầng rõ: `LoNhapDuLieu` → `DongSaoKeTho` → `GiaoDichNganHang` → `KetQuaParseGiaoDich` → `UngVienKhopGiaoDich` → `DuyetGiaoDich` → `PhanBoGiaoDich`
- Staging pattern: `UngVienLienHeCanHo` trước khi vào `LienHeCanHo` master → chống lọc dữ liệu bẩn thẳng vào contact master
- `BatchTrangThaiPhiPublic` + `TrangThaiPhiCanHoPublic` phân tách rõ giữa dữ liệu staging và snapshot public

### 2.3. Parser mã căn — thuật toán lõi được đầu tư đúng mức

`apartment-parser.ts` là module được viết kỹ nhất trong codebase:

- Xử lý nhiều dạng biến thể thực tế: `L1.115`, `115 L1`, `can 124 lo 4b`, `124LO4`, `BLOCK 4B can 124`, `LK2 10`...
- Dùng score-based ranking thay vì first-match
- Có bước filter hậu kỳ để loại ứng viên yếu hơn (ROOM_BLOCK bị loại nếu có BLOCK_ROOM cùng room)
- Loại trùng code qua suffix (L1.115 và L1.115A không tính hai căn)
- Có test coverage ở `lib/parser/apartment-parser.test.ts`
- Có tài liệu trung tâm với 100+ backlog case

### 2.4. Bảo mật public page được thiết kế thận trọng

- Rate-limit theo IP (40 req/phút) ở tầng Server Component — đơn giản nhưng hiệu quả với lưu lượng nhỏ
- Whitelist ký tự input, giới hạn độ dài 80 ký tự
- **Không bao giờ trả phone/contact/ghi chú nội bộ** ra public endpoint
- Chỉ đọc snapshot đã chốt (`la_batch_public_hien_hanh = true`), không đọc raw import trực tiếp
- Middleware Next.js tách biệt giữa `SUPER_ADMIN` routes và `MANAGER` routes

### 2.5. Audit trail đầy đủ cho import

Script import giữ lại:
- `header_values_json`: tên cột gốc
- `values_json`: dữ liệu thô từng ô
- `mapped_row_json`: ánh xạ header → giá trị
- Fingerprint SHA-256 của giao dịch để chống insert trùng

### 2.6. Kiến trúc module có phân tầng rõ

Ranh giới `src/modules/` vs `app/` vs `lib/` được document và tuân thủ tốt. Quy tắc "app/ chỉ là route/UI shell, logic nằm trong modules/" được nhất quán trong các file đã xem.

---

## 3. Vấn đề kỹ thuật cần chú ý

### 3.1. Parser bị duplicate giữa TypeScript module và CJS script — rủi ro phân kỳ

**Vấn đề quan trọng nhất về maintainability.**

`src/modules/transactions/parser/apartment-parser.ts` và phần tương ứng trong `scripts/import-bank-statement-v2.cjs` (từ line 127–260) là **hai bản sao của cùng một thuật toán**, không share code. Khi script là CommonJS và không import được TypeScript module, điều này là tất yếu — nhưng rủi ro là hai bản có thể phân kỳ theo thời gian.

Ví dụ đã thấy:
- Script CJS thêm `BLOCK_ROOM_PHONG_ALIAS` (dạng `L4B PHONG 412`) và `PHONG` vào filler list, nhưng TypeScript module **không có** rule này
- Script có `PHONG`, `P` trong filler keywords, TypeScript module không có
- TypeScript module có `BLOCK_SO_NHA_ROOM` pattern, script không có

Hai bộ rule đang lệch nhau. Nếu parser TypeScript (dùng cho public lookup) và parser script (dùng cho import sao kê vào DB) khác nhau, cùng một nội dung sao kê sẽ cho kết quả khác nhau tùy ngữ cảnh gọi.

**Gợi ý hướng xử lý:** Xây dựng một build step để transpile module TypeScript thành file CommonJS dùng được trong script, hoặc viết script bằng TypeScript và dùng `tsx`/`ts-node`.

### 3.2. Rate limiter in-memory không hoạt động trên multi-instance

`rateLimitStore = new Map()` trong `app/tra-cuu-phi/page.tsx` là in-process, sẽ mất trạng thái khi:
- Next.js restart/redeploy
- Chạy nhiều process (multi-core, PM2 cluster)
- Serverless/edge environment

Với quy mô cư dân ~934 căn, tần suất thực tế thấp, đây chưa phải vấn đề khẩn cấp. Nhưng nên nhận thức điều này khi scale.

**Gợi ý:** Khi có Redis hoặc Upstash thì chuyển sang. Hiện tại có thể chấp nhận với note rõ trong code/docs.

### 3.3. Two-schema setup gây rủi ro nhầm lẫn

Có cả `prisma/schema.prisma` (V1, tiếng Anh) và `prisma/schema-v2.prisma` (V2, tiếng Việt). DB thực tế đã dùng V2 qua `prisma.config.ts`. Schema V1 không còn dùng nhưng vẫn tồn tại trong repo.

Nguy cơ: Developer mới có thể dùng sai schema file khi chạy `prisma migrate`, `prisma generate` mà không đọc kỹ `prisma.config.ts`. Cũng gây confusion khi tìm kiếm model trong codebase.

**Gợi ý:** Giữ nguyên V1 làm archive lịch sử nhưng rename thành `schema-v1.archive.prisma` hoặc move vào `docs/` với chú thích rõ.

### 3.4. `allocations.ts` hardcode fee constants ở tầng business logic

Trong `src/modules/transactions/review/allocations.ts`:

```typescript
const STANDARD_MONTHLY_FEE = 250000;
const LK_MONTHLY_FEE = 200000;
```

Đây là hằng số phí được hardcode, không đọc từ bảng `QuyTacPhi` trong database. Điều này có thể dẫn đến phân bổ sai nếu mức phí thay đổi mà không cập nhật code. Bảng `quy_tac_phi` đã có trong schema nhưng không được dùng cho logic allocation này.

### 3.5. Một số script CLI quá dài, chứa toàn bộ nghiệp vụ

`scripts/import-bank-statement-v2.cjs` dài ~589 dòng, chứa toàn bộ: parser mã căn, header detection, date parsing, fingerprint, DB write logic... Điều này đi ngược lại nguyên tắc đã ghi trong `module-map.md` ("script chỉ là entrypoint CLI mỏng, logic dài nên tách về src/modules/").

Script này hiện tại hoạt động tốt nhưng khó test riêng lẻ và khó maintain khi parser cần nâng cấp.

### 3.6. `NgoaiLeGiaoDich` dùng `String` thay vì enum

Trong `schema-v2.prisma`:

```prisma
model NgoaiLeGiaoDich {
  loai_ngoai_le   String  // ← không dùng enum
  trang_thai      String  // ← không dùng enum
```

Trong khi schema V1 có enum `ExceptionType` và `ExceptionStatus`. Đây là regression về type safety so với V1. Dữ liệu có thể nhập giá trị tùy tiện.

### 3.7. `DuyetGiaoDich` không có `updatedAt`

Model `DuyetGiaoDich` không có `ngay_cap_nhat`/`updatedAt`. Khi import lại cùng file sao kê, script xóa và tạo lại `duyet_giao_dich`, mất lịch sử ai đã review gì trước đó.

### 3.8. `components/review-dashboard.tsx` gần như rỗng

File này chỉ có 83 bytes — có thể chỉ là re-export hoặc placeholder. Nếu là dead code, nên ghi rõ trạng thái.

---

## 4. Nhận xét về kiến trúc tổng thể

### 4.1. Sự tồn tại của `lib/` là có kiểm soát, không phải nợ kỹ thuật xấu

`lib/` được document rõ là "lớp tương thích cũ". Các file trong đó đều là wrapper re-export hoặc test cũ. Nguyên tắc "không thêm nghiệp vụ mới vào lib/" được ghi rõ. Đây là debt có nhận thức, không phải debt vô ý.

### 4.2. Trang chủ `/` và `/tra-cuu-phi` có logic hơi trùng nhau

Cả hai trang đều có form tra cứu phí. `/` redirect sang `/tra-cuu-phi` để tra cứu. Đây là UX đúng (trang chủ mobile-first → form → kết quả ở trang riêng), nhưng cần đảm bảo parser logic không bị duplicate giữa hai route.

### 4.3. Server-side rate limiting ở Server Component là lựa chọn thực dụng nhưng có giới hạn

Đã nhận xét ở mục 3.2. Với project nội bộ quy mô nhỏ, đây là đánh đổi hợp lý giữa đơn giản và đủ dùng.

### 4.4. Prisma Adapter PG thay vì Prisma connection pool mặc định

Dùng `@prisma/adapter-pg` với `PrismaPg` trong scripts và `prisma.config.ts` là lựa chọn phù hợp khi muốn kiểm soát connection pool thủ công (đặc biệt trong môi trường serverless hoặc script CLI lâu dài).

---

## 5. Nhận xét về UX và UI

### 5.1. Design system nhất quán và thực dụng

Bộ CSS token (`--accent`, `--bg`, `--panel`...) được dùng nhất quán. Font "Be Vietnam Pro" là lựa chọn tốt cho tiếng Việt. Hướng "civic utility" (công cụ, không phải landing page) được tuân thủ.

### 5.2. Mobile-first được quan tâm

`min-height: 100svh`, `min(920px, calc(100vw - 32px))`, `clamp()` cho heading, form `input` `min-height: 54px` — các chi tiết này cho thấy mobile được ưu tiên thực sự, không chỉ trên giấy.

### 5.3. Thông báo lỗi thân thiện với người dùng

"Chưa nhận diện được mã căn", "Tra cứu quá nhanh", luôn có ví dụ nhập lại — đây là mức UX writing tốt cho người dùng phổ thông.

### 5.4. Một điểm có thể cải thiện về UX

Trang `/tra-cuu-phi` khi tra cứu thành công hiện chỉ hiển thị "tháng đã đóng" dạng text. Nếu hiển thị thêm dạng visual (progress bar, timeline hoặc badge tháng) sẽ giúp cư dân hiểu nhanh hơn mà không cần đọc kỹ.

---

## 6. Nhận xét về test coverage

Có `82 tests pass` (theo handoff), chủ yếu là unit test cho:
- Parser mã căn (`apartment-parser.test.ts`)
- Matcher (`matcher.test.ts`)
- Billing fee status (`fee-status.test.ts`)
- Allocations (`allocations.test.ts`)
- PDF reader (`statement-pdf-reader.test.ts`)

**Điểm mạnh:** Golden test cho parser là pattern tốt, bao phủ được regression khi nâng cấp rule.

**Điểm thiếu:**
- Không có integration test cho DB flow (import → parse → save → read)
- Không có E2E test cho public lookup flow
- Không có test cho scripts CLI (vì logic nằm trong script, không tách module)

Với quy mô project này, không cần E2E phức tạp, nhưng integration test cho một vài happy path quan trọng sẽ giúp tự tin hơn khi deploy.

---

## 7. Nhận xét về quy trình vận hành

### 7.1. Quy trình deploy được thiết kế thận trọng

Có `checklist-duyet-truoc-deploy.md` là "cổng dừng thủ công" — yêu cầu chủ dự án duyệt thủ công trước khi làm Task O (deploy). Đây là quyết định đúng cho dự án có dữ liệu thật của cư dân.

### 7.2. Backup DB được quan tâm

Có `scripts/production/backup-postgres.sh` và script `npm run db:backup:repo`. Cũng có `db-sync/` với file `.sql` dump. Tuy nhiên:

- File `.sql` trong `db-sync/` (1MB) đang commit vào git — đây là dữ liệu thật (có thể có thông tin nhạy cảm). Cần kiểm tra `.gitignore` và xem đây là data mẫu hay production dump.

### 7.3. Tài khoản admin dev chứa SĐT thật

Handoff ghi: `tài khoản admin có SĐT đăng nhập 0904802553, role SUPER_ADMIN`. SĐT này được commit vào `docs/handoff.md` và `docs/roadmap.md`. Đây là thông tin nhạy cảm tối thiểu — không nguy hiểm như mật khẩu, nhưng nên cân nhắc khi repo trở thành public hoặc khi chia sẻ docs với bên thứ ba.

---

## 8. Tóm tắt đánh giá

| Hạng mục | Đánh giá |
|---|---|
| Tài liệu hóa | ⭐⭐⭐⭐⭐ Xuất sắc |
| Thiết kế database | ⭐⭐⭐⭐ Tốt |
| Parser mã căn | ⭐⭐⭐⭐⭐ Xuất sắc |
| Bảo mật public API | ⭐⭐⭐⭐ Tốt |
| Kiến trúc module | ⭐⭐⭐⭐ Tốt |
| Test coverage | ⭐⭐⭐ Đủ dùng, còn thiếu integration |
| Consistency parser TS vs CJS | ⭐⭐ Cần chú ý |
| UX public page | ⭐⭐⭐⭐ Tốt |
| Vận hành / deploy readiness | ⭐⭐⭐⭐ Tốt |

---

## 9. Top 5 ưu tiên góp ý (theo mức độ quan trọng)

1. **[Cao] Đồng bộ parser TypeScript và CJS script** — Rule `BLOCK_ROOM_PHONG_ALIAS` và một số pattern đang lệch nhau. Cần audit và đồng bộ trước khi dùng cho production thật.

2. **[Trung bình] Đưa fee constant vào DB hoặc config** — `STANDARD_MONTHLY_FEE = 250000` hardcode trong business logic. Nếu phí thay đổi, cần sửa code thay vì cập nhật DB.

3. **[Trung bình] Làm rõ trạng thái schema V1** — Rename `schema.prisma` thành `schema-v1.archive.prisma` hoặc thêm comment rõ "không dùng nữa" để tránh nhầm lẫn.

4. **[Thấp] Thêm enum cho `NgoaiLeGiaoDich`** — `loai_ngoai_le` và `trang_thai` là String thay vì enum. Mất type safety, dễ nhập giá trị sai.

5. **[Thấp] Kiểm tra nội dung file `db-sync/*.sql`** — Nếu là data thật của cư dân, cần đảm bảo không có thông tin cá nhân nhạy cảm bị commit vào git.

---

*Phần I đánh giá dựa trên đọc code ngày 2026-05-18. Không có file nào bị sửa đổi.*

---

# PHẦN II — Architecture Audit Chuyên Sâu

> **Vai trò:** Senior System Architect & Financial Product Manager — 10+ năm xây dựng Reconciliation Systems, SaaS ERP, phần mềm kế toán.
> **Phương pháp:** Đọc schema, code logic và scripts để đánh giá theo 4 tiêu chí: Data Integrity, Edge Cases, Scalability, Audit Trail.

---

## A. Nhận định chung về độ trưởng thành kiến trúc

**Phán quyết: Solid MVP — gần Production-ready cho quy mô 1 tòa nhà.**

Kiến trúc này vượt hẳn mức Prototype. Các quyết định thiết kế thể hiện tư duy của người đã va chạm với dữ liệu tài chính thực tế: có staging layer, có fingerprint chống trùng, có snapshot tách biệt cho public. Tuy nhiên, để vận hành ổn định cho dữ liệu tài chính thật, cần giải quyết 4 lỗ hổng cốt lõi dưới đây trước khi deploy.

---

## B. Data Integrity — Toàn vẹn dữ liệu tài chính

### B.1. [CRITICAL] Không có DB-level constraint chống double-allocation

**Vấn đề nghiêm trọng nhất của toàn hệ thống.**

Bảng `phan_bo_giao_dich` không có constraint ngăn một giao dịch bị phân bổ hai lần cho cùng một căn:

```prisma
model PhanBoGiaoDich {
  giao_dich_ngan_hang_id  Int
  can_ho_id               Int
  so_tien_phan_bo         Decimal
  -- KHÔNG CÓ: @@unique([giao_dich_ngan_hang_id, can_ho_id])
  -- KHÔNG CÓ: CHECK constraint tổng phân bổ <= so_tien gốc
}
```

**Kịch bản xảy ra lỗi:**

Script import xóa và tạo lại allocation bằng `deleteMany` + `create` riêng lẻ (không trong transaction):

```javascript
await prisma.phanBoGiaoDich.deleteMany({ where: { giao_dich_ngan_hang_id: dbTransaction.id } });
// ← Nếu crash ở đây: allocation đã bị xóa, không có allocation mới → mất tiền
await prisma.phanBoGiaoDich.create({ data: { ... } });
// ← Nếu crash ở đây: allocation mới chưa vào, script chạy lại → tạo thêm → nhân đôi
```

Hệ quả: Nếu script bị interrupt (mất điện, timeout, lỗi network) trong vòng lặp `for (const record of records)`, dữ liệu sẽ ở trạng thái không nhất quán — một số giao dịch mất allocation, một số có thể bị trùng.

**Fix cụ thể:**

1. Thêm `@@unique([giao_dich_ngan_hang_id, can_ho_id])` vào schema
2. Bọc toàn bộ block xử lý mỗi giao dịch trong `prisma.$transaction([...])`
3. Thêm CHECK tổng `SUM(so_tien_phan_bo) <= so_tien gốc` bằng PostgreSQL trigger hoặc validate ở application layer

### B.2. [HIGH] Tổng phân bổ multi-allocation không được validate ở DB layer

Trong `allocations.ts`, hàm `hasValidAllocationDrafts` kiểm tra tổng = `row.amount` ở application layer:

```typescript
return drafts.reduce((sum, item) => sum + item.amount, 0) === row.amount;
```

Nhưng **không có gì ngăn** việc ghi thẳng vào DB với tổng sai nếu ai đó bypass UI hoặc gọi API trực tiếp. Bảng `phan_bo_giao_dich` thiếu constraint:

- Không có trigger kiểm tra `SUM(so_tien_phan_bo) WHERE giao_dich_ngan_hang_id = X <= so_tien_goc`
- Không có `sequenceNo` hoặc `is_final` flag để phân biệt allocation draft và allocation confirmed

**Fix cụ thể:** Tạo PostgreSQL function validate sau mỗi INSERT/UPDATE vào `phan_bo_giao_dich`, raise exception nếu tổng vượt quá `so_tien` của giao dịch gốc.

### B.3. [MEDIUM] `so_tien` lưu dạng `String` trong code, `Decimal` trong schema

Trong script import:

```javascript
so_tien: String(transaction.amount),  // ← String
so_tien_phan_bo: String(transaction.amount),  // ← String
```

Nhưng schema định nghĩa `@db.Decimal(14, 2)`. Prisma tự convert, nhưng phép so sánh `row.amount === expectedTotal` trong `allocations.ts` so sánh `number` với `number` — không có vấn đề khi cùng nguồn, nhưng khi đọc từ DB về, Prisma trả `Decimal` object, không phải `number`. Nếu code đọc từ DB rồi so sánh bằng `===` với số JavaScript, sẽ luôn `false`.

**Fix cụ thể:** Dùng nhất quán `Decimal` từ `@prisma/client/runtime/library` cho mọi phép tính tiền. Không dùng `===` so sánh số tiền — dùng `decimal.equals(other)`.

---

## C. Edge Cases — 5 kịch bản ngoại lệ khốc liệt

### C.1. Căn hộ chuyển nhượng giữa chừng — khoản nợ treo từ chủ cũ

**Kịch bản:** Căn L2.305 đổi chủ vào ngày 15/3/2026. Chủ cũ nợ phí tháng 1, 2, 3. Chủ mới đóng đủ phí từ tháng 4. Sao kê tháng 3 có một giao dịch "DONG PHI QLVH L2305" = 750.000đ (3 tháng) — không rõ của chủ cũ hay chủ mới.

**Hệ thống hiện tại xử lý thế nào?**
- Parser nhận diện `L2.305` → `KHOP_TRUC_TIEP`
- Allocation ghi 750.000đ vào căn L2.305
- **Không có cơ chế phân biệt khoản nợ của chủ cũ vs chủ mới**
- Bảng `lien_he_can_ho` không có `hieu_luc_tu_ngay`/`hieu_luc_den_ngay` theo period

**Hậu quả:** BQT không biết ai cần được nhắc nợ — chủ cũ (đã chuyển đi) hay chủ mới (vô tình "hưởng" khoản thanh toán nợ cũ).

**Fix cụ thể:** Bổ sung `ngay_hieu_luc` vào `phan_bo_giao_dich` để tag khoản nợ thuộc period nào, kết hợp với `lien_he_can_ho.ngay_hieu_luc` để biết đầu mối tương ứng thời điểm đó.

### C.2. Ngân hàng thay đổi format sao kê — header detection sai im lặng

**Kịch bản:** Vietcombank cập nhật template XLS, đổi tên cột "Mô tả giao dịch" thành "Nội dung" và "Ngày hạch toán" thành "Ngày GD". Script import vẫn chạy không báo lỗi vì `findHeaderRow` chấm điểm theo fuzzy match và vẫn tìm được row đủ điểm:

```javascript
const score =
  normalized.some(cell => cell.includes("ngay hach toan") || cell.includes("accounting date")) +
  normalized.some(cell => cell.includes("mo ta giao dich") || ...) * 3 + ...
if (best.score < 3) throw new Error(...);
```

Nếu format mới đủ điểm (score ≥ 3) nhưng map sai cột, `descriptionIndex` trỏ vào cột sai. Tất cả 125 giao dịch sẽ có `noi_dung_goc` sai → parser không nhận diện được căn → toàn bộ import thành `CHUA_NHAN_DIEN_DUOC_CAN` **mà không có cảnh báo rõ ràng**.

**Hệ thống hiện tại:** Chỉ throw error nếu `descriptionIndex < 0`. Không validate sample của vài dòng đầu.

**Fix cụ thể:** Sau khi detect header, lấy 5 dòng đầu làm sample và check: (1) Cột ngày có parse được Date không? (2) Cột số tiền có > 0 rows với số hợp lệ không? (3) Cột mô tả có trung bình > 10 ký tự không? Nếu fail bất kỳ check nào → throw với message cụ thể.

### C.3. Một cư dân đóng gộp nhiều tháng + nhiều căn trong một chuyển khoản

**Kịch bản:** Ông A sở hữu 3 căn: L1.101, L2.205, LK1.5. Chuyển 1 lần: "DONG PHI QLVH 6 THANG CHO 3 CAN L1101 L2205 LK15" = 4.200.000đ.

Tính đúng: (250.000 × 6) + (250.000 × 6) + (200.000 × 6) = 4.200.000đ.

**Hệ thống hiện tại:**
- Parser trả về 3 candidates: `L1.101`, `L2.205`, `LK1.5` → status `NHIEU_CAN`
- `allocations.ts` `buildMultiAllocationMeta` tính weight theo **1 tháng**: 250k + 250k + 200k = 700k
- `exactMatch = (4.200.000 === 700.000)` → **false** → dùng prorated theo tỷ trọng 1 tháng
- Kết quả: L1.101 nhận 1.500.000, L2.205 nhận 1.500.000, LK1.5 nhận 1.200.000
- **Allocation đúng về tỷ trọng nhưng không biết đây là 6 tháng** — `ghi_chu` chỉ ghi "lệch chuẩn"

**Hậu quả:** Báo cáo phí public không cập nhật được "đã đóng đến tháng nào" cho 3 căn này vì không có logic suy ra số tháng từ tổng tiền chia tỷ trọng.

**Fix cụ thể:** Khi `exactMatch = false`, tính thêm `inferredMonths = round(totalAmount / standardFee)` cho từng loại căn và ghi vào `ghi_chu` allocation để reviewer có thể ra quyết định nhanh hơn.

### C.4. Ngân hàng gửi sao kê trùng lặp do lỗi xuất file

**Kịch bản:** BQT tải file sao kê tháng 4 hai lần (file bị lỗi lần đầu, tải lại). Fingerprint SHA-256 dựa trên `(date, amount, description, senderAccount, transactionId)`. Nếu `transactionId` trống (ngân hàng không export), fingerprint chỉ dựa vào 4 field còn lại.

**Script hiện tại** dùng upsert theo `van_tay_giao_dich` (fingerprint) hoặc `tham_chieu_ngan_hang` → không insert trùng giao dịch.

**Nhưng có edge case:** Nếu cùng ngày có 2 giao dịch khác nhau từ cùng người với cùng số tiền và cùng mô tả (ví dụ: 2 lần chuyển 250.000 cùng nội dung cùng ngày), fingerprint **sẽ trùng nhau**, giao dịch thứ 2 sẽ bị coi là duplicate và bỏ qua — **mất 1 giao dịch hợp lệ**.

**Fix cụ thể:** Thêm `row_index_in_file` vào fingerprint, hoặc dùng `tham_chieu_ngan_hang` làm primary dedup key và chỉ dùng fingerprint như fallback.

### C.5. Thay đổi mức phí giữa năm — allocation tính sai tỷ trọng

**Kịch bản:** BQT tăng phí từ 250.000 lên 300.000/tháng từ ngày 01/07/2026. Một cư dân chuyển 550.000đ vào 15/07/2026 cho 2 tháng (250k tháng 6 + 300k tháng 7).

**Hệ thống hiện tại:**
- `allocations.ts` hardcode `STANDARD_MONTHLY_FEE = 250000`
- `config/periodic-fee-rules.json` có `effectiveFrom: "2026-01-01"` nhưng **không được đọc** trong allocation code
- `quy_tac_phi` trong DB có `hieu_luc_tu_ngay`/`hieu_luc_den_ngay` nhưng **không được query** khi tính weight

**Hậu quả:** `exactMatch = (550.000 === 500.000)` → false → prorated theo tỷ lệ cũ → ghi chú "lệch chuẩn" → BQT phải review thủ công mà không có hint về lý do.

**Fix cụ thể:** Hàm `getApartmentMonthlyFee` cần nhận thêm param `transactionDate` và query `quy_tac_phi` để lấy mức phí đúng theo thời điểm giao dịch.

---

## D. Scalability — Điểm thắt cổ chai khi mở rộng

### D.1. [HIGH] Vòng lặp N+8 queries trong import script

Với 125 giao dịch, script hiện tại thực hiện khoảng **125 × 8 = 1.000 queries** tuần tự:

```javascript
for (const record of records) {
  await prisma.dongSaoKeTho.create(...)      // 1 query
  await prisma.giaoDichNganHang.findUnique(...)  // 1 query
  await prisma.giaoDichNganHang.create/update(...)  // 1 query
  await prisma.ketQuaParseGiaoDich.upsert(...)  // 1 query
  await prisma.ungVienKhopGiaoDich.deleteMany(...)  // 1 query
  await prisma.ungVienKhopGiaoDich.createMany(...)  // 1 query
  await prisma.duyetGiaoDich.deleteMany(...)  // 1 query
  await prisma.duyetGiaoDich.create(...)  // 1 query
  // + thêm phanBo...
}
```

Với 10.000 căn và tháng cao điểm ~5.000 giao dịch → **~45.000 queries tuần tự**. Trên VPS 2 core, thời gian import có thể lên đến 30–60 phút.

**Fix cụ thể:**
1. Batch `dongSaoKeTho` bằng `createMany` sau khi đọc toàn bộ file
2. Pre-load tất cả `giaoDichNganHang` theo fingerprint trong 1 query `findMany`
3. Dùng `prisma.$transaction` với batch upsert thay vì loop tuần tự

### D.2. [MEDIUM] `la_batch_public_hien_hanh` là boolean flag không có partial unique index

Khi có 5 tòa nhà, mỗi tòa có 1 batch hiện hành:

```prisma
la_batch_public_hien_hanh Boolean @default(false)
@@index([trang_thai, la_batch_public_hien_hanh])
```

Không có `@@unique` constraint nào đảm bảo chỉ có **đúng 1 batch** `la_batch_public_hien_hanh = true` tại một thời điểm. Nếu script `publish-fee-public-batch-v2.cjs` chạy concurrent (ví dụ: 2 Super Admin cùng publish), có thể có 2 batch được đánh dấu `true` → public page đọc `findFirst` và hiển thị sai batch.

**Fix cụ thể:** Thêm PostgreSQL partial unique index: `CREATE UNIQUE INDEX ON batch_trang_thai_phi_public (la_batch_public_hien_hanh) WHERE la_batch_public_hien_hanh = true;`

### D.3. [MEDIUM] Khi mở rộng multi-tòa, schema thiếu tenant isolation

Schema hiện tại không có khái niệm `toa_nha_id` hay `du_an_id` ở bất kỳ bảng nào. Nếu sau này quản lý 5 tòa nhà, toàn bộ bảng sẽ trộn lẫn dữ liệu. `BatchTrangThaiPhiPublic` không có field nào để phân biệt batch thuộc tòa nào.

**Fix cụ thể:** Khi có nhu cầu multi-tòa, thêm `du_an_id` vào `can_ho`, `lo_nhap_du_lieu`, `batch_trang_thai_phi_public` và thêm RLS (Row Level Security) trong PostgreSQL.

### D.4. [LOW] `ungVienKhopGiaoDich` xóa toàn bộ rồi insert lại khi re-import

Mỗi lần re-import cùng file, script `deleteMany` toàn bộ candidates cũ của giao dịch rồi `createMany` lại. Với 5.000 giao dịch × trung bình 3 candidates = 15.000 deletes + 15.000 inserts mỗi lần re-import. Thay bằng upsert theo `(ket_qua_parse_giao_dich_id, thu_hang)` sẽ hiệu quả hơn.

---

## E. Security & Audit Trail

### E.1. [HIGH] `DuyetGiaoDich` bị xóa và tạo lại — mất lịch sử review

Mỗi lần import lại cùng file sao kê:

```javascript
await prisma.duyetGiaoDich.deleteMany({ where: { giao_dich_ngan_hang_id: dbTransaction.id } });
await prisma.duyetGiaoDich.create({ data: { trang_thai_duyet: "CHUA_DUYET", ... } });
```

Nếu một Manager đã review và đánh dấu `DA_DUYET` hoặc `TU_CHOI`, re-import sẽ **xóa toàn bộ lịch sử review và reset về CHUA_DUYET**. Thông tin "ai duyệt lúc nào với lý do gì" bị mất hoàn toàn.

**Fix cụ thể:** Thêm `ngay_cap_nhat`/`updatedAt` vào `DuyetGiaoDich`. Chỉ reset review khi giao dịch còn `CHUA_DUYET` — nếu đã `DA_DUYET` hoặc `TU_CHOI`, skip delete và log warning. Hoặc chuyển sang append-only: không xóa review cũ, thêm record mới với `la_hien_tai = true`.

### E.2. [MEDIUM] `nguoi_duyet` lưu dạng String tự do, không FK vào `TaiKhoanQuanTri`

```prisma
model DuyetGiaoDich {
  nguoi_duyet  String?  // ← free text, không FK
}
```

Không có cách verify `nguoi_duyet` có phải tài khoản hợp lệ không. Ai đó có thể ghi bất kỳ tên nào. Trong một hệ thống tài chính, trường này phải là FK hoặc ít nhất là ID có thể truy ngược.

**Fix cụ thể:** Đổi `nguoi_duyet String?` thành `nguoi_duyet_id Int?` với FK vào `tai_khoan_quan_tri.id`. Lưu `ten_hien_thi` ở thời điểm duyệt vào `ghi_chu_duyet` để không bị mất khi account bị rename.

### E.3. [MEDIUM] Không có immutable audit log cho thao tác nhạy cảm

Hệ thống chưa có bảng `audit_log` ghi lại:
- Ai đã publish batch nào lúc mấy giờ
- Ai đã approve/reject contact candidate nào
- Ai đã tạo tài khoản Manager mới
- Ai đã import file sao kê nào

Hiện tại chỉ có `lo_nhap_du_lieu.nguoi_nhap_id` và `batch_trang_thai_phi_public.nguoi_public_id`, nhưng thiếu log cho các thao tác còn lại. `payload_duyet_json` trong `ung_vien_lien_he_can_ho` là cách tiếp cận tốt nhưng không nhất quán.

**Fix cụ thể:** Tạo bảng `nhat_ky_thao_tac (id, tai_khoan_id, hanh_dong, doi_tuong, doi_tuong_id, payload_truoc_json, payload_sau_json, thoi_diem)` và ghi log cho ít nhất 5 hành động: publish batch, approve/reject contact, import file, tạo/khóa tài khoản, sửa phân bổ.

### E.4. [LOW] Session cookie thiếu rotation sau login

Middleware kiểm tra `verifyAdminSessionToken` nhưng không có cơ chế rotate session token sau N giờ hoạt động. Nếu session bị intercepted (MITM trên môi trường không HTTPS đầy đủ), attacker có thể dùng token vô thời hạn cho đến khi logout.

**Fix cụ thể:** Thêm `iat` (issued at) vào JWT payload và kiểm tra không quá 8 tiếng — yêu cầu đăng nhập lại. Hoặc dùng sliding expiry: gia hạn session mỗi request nếu còn dưới 1 tiếng.

---

## F. Tổng hợp rủi ro theo ma trận

| ID | Vấn đề | Mức độ | Khả năng xảy ra | Ưu tiên |
|---|---|---|---|---|
| B.1 | Double-allocation khi script crash | 💀 Critical | Trung bình | **P0** |
| B.2 | Không validate tổng allocation ở DB | 🔴 High | Thấp | P1 |
| C.2 | Bank format đổi → import sai im lặng | 🔴 High | Cao | P1 |
| E.1 | Re-import xóa lịch sử review đã duyệt | 🔴 High | Cao | P1 |
| C.1 | Nợ chủ cũ không tách được với chủ mới | 🟡 Medium | Trung bình | P2 |
| C.5 | Thay đổi mức phí → allocation tính sai | 🟡 Medium | Thấp-trung | P2 |
| D.1 | N+8 queries loop → chậm khi scale | 🟡 Medium | Cao khi scale | P2 |
| E.2 | `nguoi_duyet` không có FK | 🟡 Medium | Cao | P2 |
| D.2 | Không có constraint 1 batch public | 🟡 Medium | Thấp | P2 |
| C.4 | Fingerprint trùng → mất giao dịch hợp lệ | 🟡 Medium | Thấp | P3 |
| E.3 | Thiếu audit log nhất quán | 🟡 Medium | Luôn luôn | P3 |
| C.3 | Gộp nhiều tháng không suy ra số tháng | 🟢 Low | Trung bình | P3 |
| D.3 | Không có tenant isolation | 🟢 Low | Khi mở rộng | P4 |
| E.4 | Session không có rotation | 🟢 Low | Thấp | P4 |

---

## G. Lộ trình sửa đề xuất (Actionable Roadmap)

### Sprint 1 — Trước deploy production (bắt buộc)

1. **Bọc toàn bộ vòng lặp import trong `prisma.$transaction`** để đảm bảo atomicity từng giao dịch
2. **Thêm `@@unique([giao_dich_ngan_hang_id, can_ho_id])`** vào `PhanBoGiaoDich`
3. **Bảo vệ re-import không xóa review đã duyệt**: check `trang_thai_duyet` trước khi `deleteMany`
4. **Sample validation sau header detection**: kiểm tra 5 dòng đầu có parse được date/amount không

### Sprint 2 — Sau deploy, trong vòng 1 tháng đầu vận hành

5. **Đọc `quy_tac_phi` từ DB** thay vì hardcode trong `allocations.ts`
6. **Đổi `nguoi_duyet String` thành FK `nguoi_duyet_id`** trong `DuyetGiaoDich`
7. **Thêm partial unique index** cho `la_batch_public_hien_hanh = true`
8. **Tạo bảng `nhat_ky_thao_tac`** và log 3 hành động quan trọng nhất: publish batch, approve contact, import file

### Sprint 3 — Khi có nhu cầu mở rộng

9. **Batch hoá import queries** bằng `createMany` + pre-load thay vì N+8 loop
10. **Đồng bộ parser TS và CJS** bằng cách build TypeScript → CommonJS
11. **Thêm `du_an_id`** nếu mở rộng sang multi-tòa nhà

---

*Architecture Audit dựa trên phân tích schema, code và scripts ngày 2026-05-18. Không có file nào bị sửa đổi.*
