# BÃ¡o cÃ¡o rÃ  soÃ¡t file vÃ  Ä‘á» xuáº¥t dá»n dáº¹p project

NgÃ y rÃ  soÃ¡t: 2026-05-23

Má»¥c tiÃªu: phÃ¢n loáº¡i file trong project, xÃ¡c Ä‘á»‹nh file Ä‘ang phá»¥c vá»¥ runtime/tÃ i liá»‡u/dá»¯ liá»‡u, vÃ  note cÃ¡c nhÃ³m file cÅ© hoáº·c cÃ³ thá»ƒ khÃ´ng dÃ¹ng ná»¯a Ä‘á»ƒ chá»§ dá»± Ã¡n duyá»‡t trÆ°á»›c khi xoÃ¡.

## 1. TÃ³m táº¯t dung lÆ°á»£ng vÃ  loáº¡i file

CÃ¡c nhÃ³m lá»›n theo dung lÆ°á»£ng thÆ° má»¥c:

| ThÆ° má»¥c | Vai trÃ² | Dung lÆ°á»£ng Æ°á»›c tÃ­nh | Nháº­n xÃ©t |
|---|---:|---:|---|
| `.tools` | Node/PostgreSQL portable cÅ© | ~1.28 GB | ÄÃ£ chuyá»ƒn sang báº£n cÃ i full Windows; chá»‰ cÃ²n lÃ  fallback/backup. |
| `node_modules` | dependency local | ~826 MB | Sinh láº¡i Ä‘Æ°á»£c báº±ng `npm install`; khÃ´ng commit. |
| `.next` | build/dev cache Next.js | ~135 MB | Sinh láº¡i Ä‘Æ°á»£c; cÃ³ thá»ƒ xoÃ¡ khi lá»—i CSS/chunk hoáº·c trÆ°á»›c build sáº¡ch. |
| `.local` | backup, upload táº¡m, screenshot test | ~112 MB | KhÃ´ng commit; nhiá»u file cÃ³ thá»ƒ xoÃ¡ sau khi chá»‘t backup. |
| `docs` | tÃ i liá»‡u + Excel/CSV report | ~7.9 MB | CÃ³ nhiá»u report/preview cÃ³ thá»ƒ archive. |
| `public/images` | áº£nh ná»n/logo | ~6.46 MB | UI chá»‰ dÃ¹ng `.webp`; `.jpg` lÃ  file gá»‘c/source. |
| `db-sync` | dump SQL cÅ© | ~1 MB | CÃ³ thá»ƒ nháº¡y cáº£m, nÃªn move khá»i repo náº¿u khÃ´ng cáº§n. |
| `stitch_markdown_dashboard_viewer` | export design Stitch | ~0.42 MB | Chá»‰ dÃ¹ng tham kháº£o, khÃ´ng cháº¡y runtime. |

CÃ¡c loáº¡i file chÃ­nh:

| ÄuÃ´i file | Ná»™i dung | Tráº¡ng thÃ¡i |
|---|---|---|
| `.tsx`, `.ts` | Next.js app, component UI, module nghiá»‡p vá»¥, test | Giá»¯. |
| `.cjs` | script import/sync/report/export dá»¯ liá»‡u | Giá»¯ pháº§n V2; xem láº¡i script preview cÅ© khi dá»n docs. |
| `.prisma`, `.sql` | schema/migration/dump DB | Giá»¯ V2/migration; schema V1 vÃ  dump SQL cáº§n phÃ¢n loáº¡i archive. |
| `.xlsx`, `.xls`, `.csv` | dá»¯ liá»‡u master, phÃ­, sao kÃª, preview/report | Giá»¯ dá»¯ liá»‡u nguá»“n má»›i nháº¥t; archive report cÅ©. |
| `.md` | tÃ i liá»‡u xÆ°Æ¡ng sá»‘ng vÃ  report | Giá»¯ file xÆ°Æ¡ng sá»‘ng; archive report tham kháº£o. |
| `.jpg`, `.webp`, `.png` | asset UI, áº£nh source, screenshot | UI dÃ¹ng `.webp`; screenshot/test artifact cÃ³ thá»ƒ xoÃ¡. |

## 2. NhÃ³m Ä‘ang dÃ¹ng, khÃ´ng nÃªn xoÃ¡

### Runtime Next.js

- `app/page.tsx`: trang chá»§ public dáº¡ng search-bar landing page.
- `app/tra-cuu-phi/page.tsx`: trang cÆ° dÃ¢n tra cá»©u phÃ­ public.
- `app/admin/**`: login, dashboard, import, account, review contact.
- `middleware.ts`: báº£o vá»‡ route admin.
- `components/ui/**`: component ná»n theo Tailwind/shadcn style.
- `components/admin/**`: layout admin, sidebar desktop, Sheet mobile.
- `app/globals.css`: theme Tailwind/global CSS. KhÃ´ng xoÃ¡ file nÃ y.

### Module nghiá»‡p vá»¥ V2

- `src/modules/auth/**`: login, session, password, current user.
- `src/modules/database/**`: Prisma client.
- `src/modules/billing/**`: parser input public vÃ  hiá»ƒn thá»‹ tráº¡ng thÃ¡i phÃ­.
- `src/modules/apartments/dashboard.ts`: dá»¯ liá»‡u dashboard admin.
- `src/modules/contacts/review.ts`: duyá»‡t contact candidate.
- `src/modules/shared/**`: label, type, utility chung.
- `src/modules/transactions/parser/apartment-parser.ts`: parser mÃ£ cÄƒn lÃµi.

### Database

- `prisma.config.ts`: Ä‘ang trá» schema tháº­t tá»›i `prisma/schema.prisma`.
- `prisma/schema.prisma`: schema má»¥c tiÃªu hiá»‡n táº¡i.
- `prisma/migrations/**`: lá»‹ch sá»­ migration.

### Script váº­n hÃ nh hiá»‡n táº¡i

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

### TÃ i liá»‡u xÆ°Æ¡ng sá»‘ng

- `README.md`
- `docs/README.md`
- `docs/roadmap.md`
- `docs/checklist-trien-khai-va-nghiem-thu.md`
- `docs/handoff.md`
- `docs/module-map.md`
- `docs/database.md`
- `docs/parser-ma-can-ho.md`
- `docs/design-system.md`
- `docs/setup-may-moi-va-database.md`
- `docs/production-deploy-vps.md`
- `docs/checklist-duyet-truoc-deploy.md`

## 3. NhÃ³m cÃ³ thá»ƒ xoÃ¡ ngay náº¿u chá»‰ muá»‘n dá»n mÃ¡y local

CÃ¡c má»¥c nÃ y Ä‘ang trong `.gitignore`, khÃ´ng áº£nh hÆ°á»Ÿng source code vÃ  cÃ³ thá»ƒ sinh láº¡i:

- `.next/`: cache/build output Next.js.
- `node_modules/`: dependency local, sinh láº¡i báº±ng `npm install`.
- `test-results/`: artifact test Playwright.
- `.local/*.png`: screenshot kiá»ƒm thá»­ UI.
- `.local/mobile-ui-audit/`: screenshot audit mobile.
- `.local/dev-server.log`, `.local/dev-server.err.log`, `.local/next-dev.*.log`: log local.

LÆ°u Ã½: khÃ´ng nÃªn xoÃ¡ toÃ n bá»™ `.local` náº¿u cÃ²n cáº§n:

- `.local/db-backups/**`: backup DB.
- `.local/admin-uploads/**`: file ngÆ°á»i dÃ¹ng upload qua UI import, dÃ¹ng Ä‘á»ƒ audit.

## 4. NhÃ³m cÃ³ thá»ƒ xoÃ¡ sau khi xÃ¡c nháº­n khÃ´ng cáº§n fallback

### Portable runtime cÅ©

- `.tools/`

LÃ½ do: mÃ´i trÆ°á»ng Ä‘Ã£ chuyá»ƒn sang báº£n cÃ i full Windows:

- Node.js full: `C:\Program Files\nodejs`
- PostgreSQL full service: `postgresql-x64-17`

Khuyáº¿n nghá»‹: giá»¯ thÃªm vÃ i ngÃ y hoáº·c sau má»™t láº§n restart mÃ¡y + cháº¡y project á»•n Ä‘á»‹nh rá»“i xoÃ¡.

### Upload táº¡m bá»‹ láº·p

- `.local/admin-uploads/fee-tracking/**`

Quan sÃ¡t: cÃ³ nhiá»u báº£n copy file thu phÃ­ T5, má»—i file khoáº£ng 5 MB. DB Ä‘Ã£ import/public batch nÃªn cÃ¡c báº£n upload nÃ y chá»‰ cÃ²n giÃ¡ trá»‹ audit.

Khuyáº¿n nghá»‹:

- Giá»¯ báº£n má»›i nháº¥t hoáº·c báº£n Ä‘Ã£ dÃ¹ng Ä‘á»ƒ publish.
- XoÃ¡ cÃ¡c báº£n upload thá»­ láº·p láº¡i.

## 5. NhÃ³m nÃªn archive hoáº·c xoÃ¡ khá»i repo sau khi duyá»‡t

### Export Stitch

- `stitch_markdown_dashboard_viewer/**`

LÃ½ do: chá»‰ lÃ  export thiáº¿t káº¿ tham kháº£o. UI hiá»‡n táº¡i Ä‘Ã£ Ä‘Æ°á»£c Ä‘Æ°a vÃ o code vÃ  tÃ i liá»‡u:

- `docs/design-system.md`
- `docs/stitch-mobile-ui-prompt.md`

Khuyáº¿n nghá»‹: xoÃ¡ khá»i repo hoáº·c nÃ©n ra ngoÃ i project náº¿u muá»‘n lÆ°u lá»‹ch sá»­ thiáº¿t káº¿.

### áº¢nh source khÃ´ng cÃ²n dÃ¹ng trá»±c tiáº¿p

UI hiá»‡n táº¡i dÃ¹ng `.webp`:

- `public/images/resident-home-desktop.webp`
- `public/images/resident-home-mobile.webp`
- `public/images/logo-hoanghuy.webp`

CÃ¡c file cÃ³ thá»ƒ xoÃ¡ khá»i repo sau khi backup source áº£nh á»Ÿ ngoÃ i:

- `public/images/resident-home-desktop.jpg`
- `public/images/resident-home-mobile.jpg`
- `public/images/logo-hoanghuy.jpg`
- `public/images/green-apartment-courtyard-bg.jpg`

LÆ°u Ã½: náº¿u muá»‘n sau nÃ y xuáº¥t láº¡i áº£nh `.webp` vá»›i cháº¥t lÆ°á»£ng khÃ¡c, giá»¯ `.jpg` á»Ÿ ngoÃ i repo lÃ  há»£p lÃ½ hÆ¡n.

### DB dump sync cÅ©

- `db-sync/apartment_fee_reviewer.latest.sql`
- `db-sync/apartment_fee_reviewer.latest.meta.json`

LÃ½ do: hiá»‡n project Ä‘Ã£ dÃ¹ng Prisma migration + PostgreSQL full service. Dump SQL cÅ© cÃ³ thá»ƒ chá»©a dá»¯ liá»‡u tháº­t/nháº¡y cáº£m.

Khuyáº¿n nghá»‹: move ra á»• backup riÃªng, khÃ´ng Ä‘á»ƒ trong repo náº¿u repo sáº½ push lÃªn GitHub/private remote.

### Schema V1

- `prisma/schema.prisma`
- `docs/archive/legacy-v1/database-v1.archive.md`

LÃ½ do: `prisma.config.ts` Ä‘ang dÃ¹ng `prisma/schema.prisma`. V1 chá»‰ cÃ²n Ã½ nghÄ©a lá»‹ch sá»­.

Khuyáº¿n nghá»‹: khÃ´ng xoÃ¡ ngay; Ä‘á»•i tÃªn hoáº·c chuyá»ƒn vÃ o archive:

- `prisma/archive/schema-v1.prisma`
- `docs/archive/archive/legacy-v1/database-v1.archive.md`

Má»¥c tiÃªu lÃ  trÃ¡nh cháº¡y nháº§m schema V1.

## 6. NhÃ³m legacy V1 cáº§n quyáº¿t Ä‘á»‹nh trÆ°á»›c khi xoÃ¡

NhÃ³m nÃ y phá»¥c vá»¥ luá»“ng cÅ©: upload file quáº£n lÃ½ + sao kÃª, phÃ¢n tÃ­ch trong browser/API, export workbook review. Hiá»‡n roadmap má»›i Ä‘Ã£ chuyá»ƒn sang DB-centric/import báº±ng script vÃ  admin dashboard.

CÃ¡c file liÃªn quan:

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
- test cÅ© liÃªn quan: `lib/review/allocations.test.ts`, `lib/matcher.test.ts`, `lib/excel/statement-reader.test.ts`, `lib/pdf/statement-pdf-reader.test.ts`

KhÃ´ng nÃªn xoÃ¡ tá»«ng file rá»i ráº¡c. Náº¿u bá» luá»“ng V1 thÃ¬ nÃªn lÃ m thÃ nh má»™t task riÃªng:

1. XÃ¡c nháº­n khÃ´ng cÃ²n cáº§n `/api/analyze` vÃ  `/api/export`.
2. XoÃ¡ UI/API V1 cÃ¹ng cÃ¡c module chá»‰ phá»¥c vá»¥ nÃ³.
3. Giá»¯ láº¡i parser mÃ£ cÄƒn lÃµi náº¿u váº«n Ä‘Æ°á»£c billing/dashboard dÃ¹ng:
   - `src/modules/transactions/parser/apartment-parser.ts`
   - test parser tÆ°Æ¡ng á»©ng.
4. Cháº¡y `npm test` vÃ  `npm run build`.

## 7. NhÃ³m CSS legacy nÃªn dá»n trong task riÃªng

`app/globals.css` hiá»‡n cÃ³ hai lá»›p ná»™i dung:

1. Pháº§n cáº§n giá»¯:
   - Tailwind import/source.
   - CSS variables/theme.
   - base body/font.
   - `.admin-auth-shell`, `.admin-shell` náº¿u login/admin cÃ²n dÃ¹ng.
2. Pháº§n cÃ³ dáº¥u hiá»‡u legacy:
   - `.hero-card`, `.upload-grid`, `.upload-field`
   - `.resident-home-shell`, `.resident-home-panel`, `.resident-lookup-form`
   - `.public-fee-shell`, `.public-fee-hero`, `.public-fee-result`
   - `.review-table`, `.reconcile-table`
   - nhiá»u class admin cÅ©: `.admin-card`, `.admin-grid`, `.admin-table`, `.admin-kpi-*`

LÃ½ do: UI hiá»‡n táº¡i chá»§ yáº¿u dÃ¹ng Tailwind class trá»±c tiáº¿p trong TSX vÃ  component shadcn-style. CÃ¡c selector legacy cÃ²n phá»¥c vá»¥ `ReviewDashboard` V1 hoáº·c UI cÅ©.

Khuyáº¿n nghá»‹: dá»n CSS sau khi quyáº¿t Ä‘á»‹nh giá»¯/xoÃ¡ legacy V1. KhÃ´ng xoÃ¡ CSS trÆ°á»›c vÃ¬ cÃ³ thá»ƒ lÃ m há»ng `/admin/login` hoáº·c route V1 náº¿u cÃ²n dÃ¹ng.

## 8. NhÃ³m docs/report nÃªn chuyá»ƒn archive

CÃ¡c file bÃ¡o cÃ¡o tham kháº£o, khÃ´ng pháº£i tÃ i liá»‡u xÆ°Æ¡ng sá»‘ng:

- `docs/reports/danh-gia-project.md`
- `docs/reports/desktop-asng7jb-overview.md`
- `docs/reports/de-xuat-mo-hinh-db-va-tinh-huong-cu-dan.md`
- `docs/reports/danh-gia-danh-sach-can-ho-master.md`
- cÃ¡c bÃ¡o cÃ¡o cÅ© tá»« ngÃ y 2026-05-13 náº¿u Ä‘Ã£ tá»•ng há»£p vÃ o roadmap/handoff.

CÃ¡c folder preview sinh tá»« import/parse:

- `docs/preview-lien-he-can-ho/**`
- `docs/preview-master-lien-he-can-ho/**`
- `docs/preview-theo-doi-thu-phi/**`

Khuyáº¿n nghá»‹:

- Giá»¯ `docs/preview-theo-doi-thu-phi/**` cho Ä‘áº¿n khi batch T5 Ä‘Ã£ Ä‘Æ°á»£c chá»§ dá»± Ã¡n nghiá»‡m thu.
- Sau nghiá»‡m thu, chuyá»ƒn toÃ n bá»™ preview/report cÅ© vÃ o `docs/archive/2026-05-import-audit/` hoáº·c xoÃ¡ náº¿u Ä‘Ã£ backup.

## 9. File Ä‘Ã£ bá»‹ xoÃ¡ trong working tree

Git Ä‘ang ghi nháº­n:

- `docs/Theo dÃµi thu phÃ­ T4.xlsx` Ä‘Ã£ xoÃ¡.
- `docs/lich-su-giao-dich(15-04-2026 09_33_29).xls` Ä‘Ã£ xoÃ¡.

ÄÃ¡nh giÃ¡: há»£p lÃ½ náº¿u T5 vÃ  sao kÃª 20-05-2026 lÃ  dá»¯ liá»‡u má»›i nháº¥t. KhÃ´ng cáº§n restore trá»« khi muá»‘n lÆ°u lá»‹ch sá»­ nguá»“n.

## 10. Äá» xuáº¥t thá»© tá»± dá»n an toÃ n

### Phase 1: Dá»n local khÃ´ng áº£nh hÆ°á»Ÿng code

- XoÃ¡ `.next/`
- XoÃ¡ `test-results/`
- XoÃ¡ screenshot/log trong `.local`
- XoÃ¡ cÃ¡c báº£n upload trÃ¹ng trong `.local/admin-uploads/fee-tracking`, giá»¯ báº£n audit cáº§n thiáº¿t

### Phase 2: Dá»n asset/design tham kháº£o

- Move hoáº·c xoÃ¡ `stitch_markdown_dashboard_viewer/`
- Move `.jpg` source trong `public/images` ra ngoÃ i repo, giá»¯ `.webp`
- XoÃ¡ `green-apartment-courtyard-bg.jpg` náº¿u khÃ´ng dÃ¹ng ná»¯a

### Phase 3: Dá»n tÃ i liá»‡u/report

- Táº¡o `docs/archive/`
- Chuyá»ƒn report/preview cÅ© vÃ o archive hoáº·c xoÃ¡ sau khi backup
- Giá»¯ `docs/reports/README.md` náº¿u váº«n muá»‘n cÃ³ má»¥c lá»¥c report

### Phase 4: Dá»n legacy V1 báº±ng PR/task riÃªng

- XoÃ¡ route `/api/analyze`, `/api/export`
- XoÃ¡ `ReviewDashboard` V1 vÃ  module phá»¥c vá»¥ riÃªng nÃ³
- Dá»n CSS legacy tÆ°Æ¡ng á»©ng
- Cháº¡y `npm test`, `npm run build`, kiá»ƒm tra UI public/admin

## 11. Káº¿t luáº­n

KhÃ´ng nÃªn xoÃ¡ code legacy V1 ngay trong má»™t lÆ°á»£t dá»n rÃ¡c chung, vÃ¬ nÃ³ cÃ²n cÃ³ API/test liÃªn káº¿t. Pháº§n xoÃ¡ an toÃ n nháº¥t hiá»‡n táº¡i lÃ  artifact local, export Stitch, áº£nh source `.jpg` náº¿u Ä‘Ã£ backup, dump SQL cÅ©, vÃ  report/preview Ä‘Ã£ nghiá»‡m thu.



