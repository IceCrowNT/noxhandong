# Báo cáo rà soát file và đề xuất dọn dẹp project

Ngày rà soát: 2026-05-23

Mục tiêu: phân loại file trong project, xác định file đang phục vụ runtime/tài liệu/dữ liệu, và note các nhóm file cũ hoặc có thể không dùng nữa để chủ dự án duyệt trước khi xoá.

## 1. Tóm tắt dung lượng và loại file

Các nhóm lớn theo dung lượng thư mục:

| Thư mục | Vai trò | Dung lượng ước tính | Nhận xét |
|---|---:|---:|---|
| `.tools` | Node/PostgreSQL portable cũ | ~1.28 GB | Đã chuyển sang bản cài full Windows; chỉ còn là fallback/backup. |
| `node_modules` | dependency local | ~826 MB | Sinh lại được bằng `npm install`; không commit. |
| `.next` | build/dev cache Next.js | ~135 MB | Sinh lại được; có thể xoá khi lỗi CSS/chunk hoặc trước build sạch. |
| `.local` | backup, upload tạm, screenshot test | ~112 MB | Không commit; nhiều file có thể xoá sau khi chốt backup. |
| `docs` | tài liệu + Excel/CSV report | ~7.9 MB | Có nhiều report/preview có thể archive. |
| `public/images` | ảnh nền/logo | ~6.46 MB | UI chỉ dùng `.webp`; `.jpg` là file gốc/source. |
| `db-sync` | dump SQL cũ | ~1 MB | Có thể nhạy cảm, nên move khỏi repo nếu không cần. |
| `stitch_markdown_dashboard_viewer` | export design Stitch | ~0.42 MB | Chỉ dùng tham khảo, không chạy runtime. |

Các loại file chính:

| Đuôi file | Nội dung | Trạng thái |
|---|---|---|
| `.tsx`, `.ts` | Next.js app, component UI, module nghiệp vụ, test | Giữ. |
| `.cjs` | script import/sync/report/export dữ liệu | Giữ phần V2; xem lại script preview cũ khi dọn docs. |
| `.prisma`, `.sql` | schema/migration/dump DB | Giữ V2/migration; schema V1 và dump SQL cần phân loại archive. |
| `.xlsx`, `.xls`, `.csv` | dữ liệu master, phí, sao kê, preview/report | Giữ dữ liệu nguồn mới nhất; archive report cũ. |
| `.md` | tài liệu xương sống và report | Giữ file xương sống; archive report tham khảo. |
| `.jpg`, `.webp`, `.png` | asset UI, ảnh source, screenshot | UI dùng `.webp`; screenshot/test artifact có thể xoá. |

## 2. Nhóm đang dùng, không nên xoá

### Runtime Next.js

- `app/page.tsx`: trang chủ public dạng search-bar landing page.
- `app/tra-cuu-phi/page.tsx`: trang cư dân tra cứu phí public.
- `app/admin/**`: login, dashboard, import, account, review contact.
- `middleware.ts`: bảo vệ route admin.
- `components/ui/**`: component nền theo Tailwind/shadcn style.
- `components/admin/**`: layout admin, sidebar desktop, Sheet mobile.
- `app/globals.css`: theme Tailwind/global CSS. Không xoá file này.

### Module nghiệp vụ V2

- `src/modules/auth/**`: login, session, password, current user.
- `src/modules/database/**`: Prisma client.
- `src/modules/billing/**`: parser input public và hiển thị trạng thái phí.
- `src/modules/apartments/dashboard.ts`: dữ liệu dashboard admin.
- `src/modules/contacts/review.ts`: duyệt contact candidate.
- `src/modules/shared/**`: label, type, utility chung.
- `src/modules/transactions/parser/apartment-parser.ts`: parser mã căn lõi.

### Database

- `prisma.config.ts`: đang trỏ schema thật tới `prisma/schema-v2.prisma`.
- `prisma/schema-v2.prisma`: schema mục tiêu hiện tại.
- `prisma/migrations/**`: lịch sử migration.

### Script vận hành hiện tại

- `scripts/seed-v2.cjs`
- `scripts/sync-apartment-master.cjs`
- `scripts/sync-master-contacts-v2.cjs`
- `scripts/import-fee-tracking-v2.cjs`
- `scripts/prepare-fee-public-batch-v2.cjs`
- `scripts/publish-fee-public-batch-v2.cjs`
- `scripts/import-bank-statement-v2.cjs`
- `scripts/report-bank-statement-parser-v2.cjs`
- `scripts/export-operations-excel-v2.cjs`
- `scripts/setup/start-postgres-local.ps1`
- `scripts/setup/stop-postgres-local.ps1`
- `scripts/production/backup-postgres.sh`

### Tài liệu xương sống

- `README.md`
- `docs/README.md`
- `docs/roadmap.md`
- `docs/checklist-trien-khai-va-nghiem-thu.md`
- `docs/handoff.md`
- `docs/module-map.md`
- `docs/database-v2.md`
- `docs/parser-ma-can-ho.md`
- `docs/design-system.md`
- `docs/setup-may-moi-va-database.md`
- `docs/production-deploy-vps.md`
- `docs/checklist-duyet-truoc-deploy.md`

## 3. Nhóm có thể xoá ngay nếu chỉ muốn dọn máy local

Các mục này đang trong `.gitignore`, không ảnh hưởng source code và có thể sinh lại:

- `.next/`: cache/build output Next.js.
- `node_modules/`: dependency local, sinh lại bằng `npm install`.
- `test-results/`: artifact test Playwright.
- `.local/*.png`: screenshot kiểm thử UI.
- `.local/mobile-ui-audit/`: screenshot audit mobile.
- `.local/dev-server.log`, `.local/dev-server.err.log`, `.local/next-dev.*.log`: log local.

Lưu ý: không nên xoá toàn bộ `.local` nếu còn cần:

- `.local/db-backups/**`: backup DB.
- `.local/admin-uploads/**`: file người dùng upload qua UI import, dùng để audit.

## 4. Nhóm có thể xoá sau khi xác nhận không cần fallback

### Portable runtime cũ

- `.tools/`

Lý do: môi trường đã chuyển sang bản cài full Windows:

- Node.js full: `C:\Program Files\nodejs`
- PostgreSQL full service: `postgresql-x64-17`

Khuyến nghị: giữ thêm vài ngày hoặc sau một lần restart máy + chạy project ổn định rồi xoá.

### Upload tạm bị lặp

- `.local/admin-uploads/fee-tracking/**`

Quan sát: có nhiều bản copy file thu phí T5, mỗi file khoảng 5 MB. DB đã import/public batch nên các bản upload này chỉ còn giá trị audit.

Khuyến nghị:

- Giữ bản mới nhất hoặc bản đã dùng để publish.
- Xoá các bản upload thử lặp lại.

## 5. Nhóm nên archive hoặc xoá khỏi repo sau khi duyệt

### Export Stitch

- `stitch_markdown_dashboard_viewer/**`

Lý do: chỉ là export thiết kế tham khảo. UI hiện tại đã được đưa vào code và tài liệu:

- `docs/design-system.md`
- `docs/stitch-mobile-ui-prompt.md`

Khuyến nghị: xoá khỏi repo hoặc nén ra ngoài project nếu muốn lưu lịch sử thiết kế.

### Ảnh source không còn dùng trực tiếp

UI hiện tại dùng `.webp`:

- `public/images/resident-home-desktop.webp`
- `public/images/resident-home-mobile.webp`
- `public/images/logo-hoanghuy.webp`

Các file có thể xoá khỏi repo sau khi backup source ảnh ở ngoài:

- `public/images/resident-home-desktop.jpg`
- `public/images/resident-home-mobile.jpg`
- `public/images/logo-hoanghuy.jpg`
- `public/images/green-apartment-courtyard-bg.jpg`

Lưu ý: nếu muốn sau này xuất lại ảnh `.webp` với chất lượng khác, giữ `.jpg` ở ngoài repo là hợp lý hơn.

### DB dump sync cũ

- `db-sync/apartment_fee_reviewer.latest.sql`
- `db-sync/apartment_fee_reviewer.latest.meta.json`

Lý do: hiện project đã dùng Prisma migration + PostgreSQL full service. Dump SQL cũ có thể chứa dữ liệu thật/nhạy cảm.

Khuyến nghị: move ra ổ backup riêng, không để trong repo nếu repo sẽ push lên GitHub/private remote.

### Schema V1

- `prisma/schema.prisma`
- `docs/database-v1.md`

Lý do: `prisma.config.ts` đang dùng `prisma/schema-v2.prisma`. V1 chỉ còn ý nghĩa lịch sử.

Khuyến nghị: không xoá ngay; đổi tên hoặc chuyển vào archive:

- `prisma/archive/schema-v1.prisma`
- `docs/archive/database-v1.md`

Mục tiêu là tránh chạy nhầm schema V1.

## 6. Nhóm legacy V1 cần quyết định trước khi xoá

Nhóm này phục vụ luồng cũ: upload file quản lý + sao kê, phân tích trong browser/API, export workbook review. Hiện roadmap mới đã chuyển sang DB-centric/import bằng script và admin dashboard.

Các file liên quan:

- `app/api/analyze/route.ts`
- `app/api/export/route.ts`
- `components/review-dashboard.tsx`
- `src/modules/transactions/ui/review-dashboard.tsx`
- `src/modules/transactions/review/allocations.ts`
- `src/modules/transactions/review/presentation.ts`
- `src/modules/transactions/review/summary.ts`
- `src/modules/transactions/matcher.ts`
- `src/modules/imports/statement-reader.ts`
- `src/modules/imports/excel/management-reader.ts`
- `src/modules/imports/excel/statement-reader.ts`
- `src/modules/imports/excel/exporter.ts`
- `src/modules/imports/pdf/statement-pdf-reader.ts`
- wrapper trong `lib/`: `lib/statement-reader.ts`, `lib/excel/**`, `lib/review/**`, `lib/matcher.ts`, `lib/types.ts`, `lib/constants.ts`, `lib/filter-rules.ts`
- test cũ liên quan: `lib/review/allocations.test.ts`, `lib/matcher.test.ts`, `lib/excel/statement-reader.test.ts`, `lib/pdf/statement-pdf-reader.test.ts`

Không nên xoá từng file rời rạc. Nếu bỏ luồng V1 thì nên làm thành một task riêng:

1. Xác nhận không còn cần `/api/analyze` và `/api/export`.
2. Xoá UI/API V1 cùng các module chỉ phục vụ nó.
3. Giữ lại parser mã căn lõi nếu vẫn được billing/dashboard dùng:
   - `src/modules/transactions/parser/apartment-parser.ts`
   - test parser tương ứng.
4. Chạy `npm test` và `npm run build`.

## 7. Nhóm CSS legacy nên dọn trong task riêng

`app/globals.css` hiện có hai lớp nội dung:

1. Phần cần giữ:
   - Tailwind import/source.
   - CSS variables/theme.
   - base body/font.
   - `.admin-auth-shell`, `.admin-shell` nếu login/admin còn dùng.
2. Phần có dấu hiệu legacy:
   - `.hero-card`, `.upload-grid`, `.upload-field`
   - `.resident-home-shell`, `.resident-home-panel`, `.resident-lookup-form`
   - `.public-fee-shell`, `.public-fee-hero`, `.public-fee-result`
   - `.review-table`, `.reconcile-table`
   - nhiều class admin cũ: `.admin-card`, `.admin-grid`, `.admin-table`, `.admin-kpi-*`

Lý do: UI hiện tại chủ yếu dùng Tailwind class trực tiếp trong TSX và component shadcn-style. Các selector legacy còn phục vụ `ReviewDashboard` V1 hoặc UI cũ.

Khuyến nghị: dọn CSS sau khi quyết định giữ/xoá legacy V1. Không xoá CSS trước vì có thể làm hỏng `/admin/login` hoặc route V1 nếu còn dùng.

## 8. Nhóm docs/report nên chuyển archive

Các file báo cáo tham khảo, không phải tài liệu xương sống:

- `docs/reports/danh-gia-project.md`
- `docs/reports/desktop-asng7jb-overview.md`
- `docs/reports/de-xuat-mo-hinh-db-va-tinh-huong-cu-dan.md`
- `docs/reports/danh-gia-danh-sach-can-ho-master.md`
- các báo cáo cũ từ ngày 2026-05-13 nếu đã tổng hợp vào roadmap/handoff.

Các folder preview sinh từ import/parse:

- `docs/preview-lien-he-can-ho/**`
- `docs/preview-master-lien-he-can-ho/**`
- `docs/preview-theo-doi-thu-phi/**`

Khuyến nghị:

- Giữ `docs/preview-theo-doi-thu-phi/**` cho đến khi batch T5 đã được chủ dự án nghiệm thu.
- Sau nghiệm thu, chuyển toàn bộ preview/report cũ vào `docs/archive/2026-05-import-audit/` hoặc xoá nếu đã backup.

## 9. File đã bị xoá trong working tree

Git đang ghi nhận:

- `docs/Theo dõi thu phí T4.xlsx` đã xoá.
- `docs/lich-su-giao-dich(15-04-2026 09_33_29).xls` đã xoá.

Đánh giá: hợp lý nếu T5 và sao kê 20-05-2026 là dữ liệu mới nhất. Không cần restore trừ khi muốn lưu lịch sử nguồn.

## 10. Đề xuất thứ tự dọn an toàn

### Phase 1: Dọn local không ảnh hưởng code

- Xoá `.next/`
- Xoá `test-results/`
- Xoá screenshot/log trong `.local`
- Xoá các bản upload trùng trong `.local/admin-uploads/fee-tracking`, giữ bản audit cần thiết

### Phase 2: Dọn asset/design tham khảo

- Move hoặc xoá `stitch_markdown_dashboard_viewer/`
- Move `.jpg` source trong `public/images` ra ngoài repo, giữ `.webp`
- Xoá `green-apartment-courtyard-bg.jpg` nếu không dùng nữa

### Phase 3: Dọn tài liệu/report

- Tạo `docs/archive/`
- Chuyển report/preview cũ vào archive hoặc xoá sau khi backup
- Giữ `docs/reports/README.md` nếu vẫn muốn có mục lục report

### Phase 4: Dọn legacy V1 bằng PR/task riêng

- Xoá route `/api/analyze`, `/api/export`
- Xoá `ReviewDashboard` V1 và module phục vụ riêng nó
- Dọn CSS legacy tương ứng
- Chạy `npm test`, `npm run build`, kiểm tra UI public/admin

## 11. Kết luận

Không nên xoá code legacy V1 ngay trong một lượt dọn rác chung, vì nó còn có API/test liên kết. Phần xoá an toàn nhất hiện tại là artifact local, export Stitch, ảnh source `.jpg` nếu đã backup, dump SQL cũ, và report/preview đã nghiệm thu.

