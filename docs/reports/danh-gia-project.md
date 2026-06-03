# ÄÃ¡nh giÃ¡ & GÃ³p Ã½ â€” Project Apartment Fee Reviewer

> **TÃ i liá»‡u nÃ y gá»“m 2 pháº§n:**
> - **Pháº§n I** â€” ÄÃ¡nh giÃ¡ tá»•ng quan dá»± Ã¡n (General Project Review)
> - **Pháº§n II** â€” Architecture Audit chuyÃªn sÃ¢u dÆ°á»›i gÃ³c nhÃ¬n Senior System Architect & Financial Product Manager

> ÄÃ¢y lÃ  nháº­n xÃ©t Ä‘á»™c láº­p, **khÃ´ng sá»­a báº¥t ká»³ file nÃ o**. Má»¥c tiÃªu lÃ  cung cáº¥p gÃ³c nhÃ¬n khÃ¡ch quan Ä‘á»ƒ há»— trá»£ phÃ¡t triá»ƒn tiáº¿p theo.

---

## 1. Tá»•ng quan

Project lÃ  má»™t **web app quáº£n lÃ½ vÃ  Ä‘á»‘i soÃ¡t thu phÃ­ cÄƒn há»™** Ä‘Æ°á»£c xÃ¢y dá»±ng cho Ban Quáº£n trá»‹ chung cÆ° An Äá»“ng. Stack hiá»‡n táº¡i: Next.js 15 + React 19 + PostgreSQL + Prisma, káº¿t há»£p Excel lÃ m nguá»“n váº­n hÃ nh thá»§ cÃ´ng vÃ  scripts CLI Ä‘á»ƒ nháº­p liá»‡u.

**Má»©c Ä‘á»™ trÆ°á»Ÿng thÃ nh:** KhÃ¡ cao so vá»›i quy mÃ´ má»™t dá»± Ã¡n ná»™i bá»™. Project cÃ³ tÆ° duy ká»¹ thuáº­t rÃµ rÃ ng, documentation Ä‘áº§y Ä‘á»§, vÃ  cÃ³ nhiá»u lá»±a chá»n thiáº¿t káº¿ thá»ƒ hiá»‡n kinh nghiá»‡m thá»±c táº¿.

---

## 2. Äiá»ƒm máº¡nh ná»•i báº­t

### 2.1. TÃ i liá»‡u hÃ³a ráº¥t tá»‘t â€” hiáº¿m gáº·p á»Ÿ project ná»™i bá»™

ÄÃ¢y lÃ  Ä‘iá»ƒm áº¥n tÆ°á»£ng nháº¥t cá»§a project. Há»‡ thá»‘ng `docs/` Ä‘Æ°á»£c xÃ¢y dá»±ng bÃ i báº£n vá»›i:

- `roadmap.md` lÃ m control cáº¥p cao, cáº­p nháº­t theo ngÃ y (granular Ä‘áº¿n tá»«ng task Aâ€“O)
- `handoff.md` dÃ¹ng Ä‘á»ƒ bÃ n giao tráº¡ng thÃ¡i giá»¯a mÃ¡y/ngÆ°á»i, khÃ´ng phá»¥ thuá»™c vÃ o lá»‹ch sá»­ chat
- `module-map.md` Ä‘á»‹nh nghÄ©a ranh giá»›i module, luáº­t phá»¥ thuá»™c, báº£ng "Ä‘áº·t file má»›i á»Ÿ Ä‘Ã¢u"
- `checklist-trien-khai-va-nghiem-thu.md` vÃ  `checklist-duyet-truoc-deploy.md` lÃ  **cá»•ng nghiá»‡m thu thá»§ cÃ´ng** nghiÃªm tÃºc
- `parser-ma-can-ho.md` lÃ  tÃ i liá»‡u trung tÃ¢m cho thuáº­t toÃ¡n lÃµi
- `design-system.md` vá»›i nguyÃªn táº¯c UI/UX rÃµ rÃ ng, ká»ƒ cáº£ copy chuáº©n cho tá»«ng tráº¡ng thÃ¡i

Ráº¥t Ã­t project ná»™i bá»™ á»Ÿ quy mÃ´ nÃ y Ä‘áº¡t Ä‘Æ°á»£c má»©c tÃ i liá»‡u hÃ³a nhÆ° váº­y.

### 2.2. Thiáº¿t káº¿ schema database V2 chÃ­n muá»“i

Schema `schema.prisma` cÃ³ nhiá»u Ä‘iá»ƒm Ä‘Ã¡ng khen:

- **TÃªn báº£ng/cá»™t tiáº¿ng Viá»‡t khÃ´ng dáº¥u** â†’ dá»… Ä‘á»c, nháº¥t quÃ¡n vá»›i ngÃ´n ngá»¯ nghiá»‡p vá»¥
- **ID autoincrement** thay vÃ¬ CUID â†’ phÃ¹ há»£p hÆ¡n vá»›i quy mÃ´ dá»¯ liá»‡u thá»±c táº¿
- PhÃ¢n táº§ng rÃµ: `LoNhapDuLieu` â†’ `DongSaoKeTho` â†’ `GiaoDichNganHang` â†’ `KetQuaParseGiaoDich` â†’ `UngVienKhopGiaoDich` â†’ `DuyetGiaoDich` â†’ `PhanBoGiaoDich`
- Staging pattern: `UngVienLienHeCanHo` trÆ°á»›c khi vÃ o `LienHeCanHo` master â†’ chá»‘ng lá»c dá»¯ liá»‡u báº©n tháº³ng vÃ o contact master
- `BatchTrangThaiPhiPublic` + `TrangThaiPhiCanHoPublic` phÃ¢n tÃ¡ch rÃµ giá»¯a dá»¯ liá»‡u staging vÃ  snapshot public

### 2.3. Parser mÃ£ cÄƒn â€” thuáº­t toÃ¡n lÃµi Ä‘Æ°á»£c Ä‘áº§u tÆ° Ä‘Ãºng má»©c

`apartment-parser.ts` lÃ  module Ä‘Æ°á»£c viáº¿t ká»¹ nháº¥t trong codebase:

- Xá»­ lÃ½ nhiá»u dáº¡ng biáº¿n thá»ƒ thá»±c táº¿: `L1.115`, `115 L1`, `can 124 lo 4b`, `124LO4`, `BLOCK 4B can 124`, `LK2 10`...
- DÃ¹ng score-based ranking thay vÃ¬ first-match
- CÃ³ bÆ°á»›c filter háº­u ká»³ Ä‘á»ƒ loáº¡i á»©ng viÃªn yáº¿u hÆ¡n (ROOM_BLOCK bá»‹ loáº¡i náº¿u cÃ³ BLOCK_ROOM cÃ¹ng room)
- Loáº¡i trÃ¹ng code qua suffix (L1.115 vÃ  L1.115A khÃ´ng tÃ­nh hai cÄƒn)
- CÃ³ test coverage á»Ÿ `lib/parser/apartment-parser.test.ts`
- CÃ³ tÃ i liá»‡u trung tÃ¢m vá»›i 100+ backlog case

### 2.4. Báº£o máº­t public page Ä‘Æ°á»£c thiáº¿t káº¿ tháº­n trá»ng

- Rate-limit theo IP (40 req/phÃºt) á»Ÿ táº§ng Server Component â€” Ä‘Æ¡n giáº£n nhÆ°ng hiá»‡u quáº£ vá»›i lÆ°u lÆ°á»£ng nhá»
- Whitelist kÃ½ tá»± input, giá»›i háº¡n Ä‘á»™ dÃ i 80 kÃ½ tá»±
- **KhÃ´ng bao giá» tráº£ phone/contact/ghi chÃº ná»™i bá»™** ra public endpoint
- Chá»‰ Ä‘á»c snapshot Ä‘Ã£ chá»‘t (`la_batch_public_hien_hanh = true`), khÃ´ng Ä‘á»c raw import trá»±c tiáº¿p
- Middleware Next.js tÃ¡ch biá»‡t giá»¯a `SUPER_ADMIN` routes vÃ  `MANAGER` routes

### 2.5. Audit trail Ä‘áº§y Ä‘á»§ cho import

Script import giá»¯ láº¡i:
- `header_values_json`: tÃªn cá»™t gá»‘c
- `values_json`: dá»¯ liá»‡u thÃ´ tá»«ng Ã´
- `mapped_row_json`: Ã¡nh xáº¡ header â†’ giÃ¡ trá»‹
- Fingerprint SHA-256 cá»§a giao dá»‹ch Ä‘á»ƒ chá»‘ng insert trÃ¹ng

### 2.6. Kiáº¿n trÃºc module cÃ³ phÃ¢n táº§ng rÃµ

Ranh giá»›i `src/modules/` vs `app/` vs `lib/` Ä‘Æ°á»£c document vÃ  tuÃ¢n thá»§ tá»‘t. Quy táº¯c "app/ chá»‰ lÃ  route/UI shell, logic náº±m trong modules/" Ä‘Æ°á»£c nháº¥t quÃ¡n trong cÃ¡c file Ä‘Ã£ xem.

---

## 3. Váº¥n Ä‘á» ká»¹ thuáº­t cáº§n chÃº Ã½

### 3.1. Parser bá»‹ duplicate giá»¯a TypeScript module vÃ  CJS script â€” rá»§i ro phÃ¢n ká»³

**Váº¥n Ä‘á» quan trá»ng nháº¥t vá» maintainability.**

`src/modules/transactions/parser/apartment-parser.ts` vÃ  pháº§n tÆ°Æ¡ng á»©ng trong `scripts/import-bank-statement-v2.cjs` (tá»« line 127â€“260) lÃ  **hai báº£n sao cá»§a cÃ¹ng má»™t thuáº­t toÃ¡n**, khÃ´ng share code. Khi script lÃ  CommonJS vÃ  khÃ´ng import Ä‘Æ°á»£c TypeScript module, Ä‘iá»u nÃ y lÃ  táº¥t yáº¿u â€” nhÆ°ng rá»§i ro lÃ  hai báº£n cÃ³ thá»ƒ phÃ¢n ká»³ theo thá»i gian.

VÃ­ dá»¥ Ä‘Ã£ tháº¥y:
- Script CJS thÃªm `BLOCK_ROOM_PHONG_ALIAS` (dáº¡ng `L4B PHONG 412`) vÃ  `PHONG` vÃ o filler list, nhÆ°ng TypeScript module **khÃ´ng cÃ³** rule nÃ y
- Script cÃ³ `PHONG`, `P` trong filler keywords, TypeScript module khÃ´ng cÃ³
- TypeScript module cÃ³ `BLOCK_SO_NHA_ROOM` pattern, script khÃ´ng cÃ³

Hai bá»™ rule Ä‘ang lá»‡ch nhau. Náº¿u parser TypeScript (dÃ¹ng cho public lookup) vÃ  parser script (dÃ¹ng cho import sao kÃª vÃ o DB) khÃ¡c nhau, cÃ¹ng má»™t ná»™i dung sao kÃª sáº½ cho káº¿t quáº£ khÃ¡c nhau tÃ¹y ngá»¯ cáº£nh gá»i.

**Gá»£i Ã½ hÆ°á»›ng xá»­ lÃ½:** XÃ¢y dá»±ng má»™t build step Ä‘á»ƒ transpile module TypeScript thÃ nh file CommonJS dÃ¹ng Ä‘Æ°á»£c trong script, hoáº·c viáº¿t script báº±ng TypeScript vÃ  dÃ¹ng `tsx`/`ts-node`.

### 3.2. Rate limiter in-memory khÃ´ng hoáº¡t Ä‘á»™ng trÃªn multi-instance

`rateLimitStore = new Map()` trong `app/tra-cuu-phi/page.tsx` lÃ  in-process, sáº½ máº¥t tráº¡ng thÃ¡i khi:
- Next.js restart/redeploy
- Cháº¡y nhiá»u process (multi-core, PM2 cluster)
- Serverless/edge environment

Vá»›i quy mÃ´ cÆ° dÃ¢n ~934 cÄƒn, táº§n suáº¥t thá»±c táº¿ tháº¥p, Ä‘Ã¢y chÆ°a pháº£i váº¥n Ä‘á» kháº©n cáº¥p. NhÆ°ng nÃªn nháº­n thá»©c Ä‘iá»u nÃ y khi scale.

**Gá»£i Ã½:** Khi cÃ³ Redis hoáº·c Upstash thÃ¬ chuyá»ƒn sang. Hiá»‡n táº¡i cÃ³ thá»ƒ cháº¥p nháº­n vá»›i note rÃµ trong code/docs.

### 3.3. Two-schema setup gÃ¢y rá»§i ro nháº§m láº«n

CÃ³ cáº£ `prisma/schema.prisma` (V1, tiáº¿ng Anh) vÃ  `prisma/schema.prisma` (V2, tiáº¿ng Viá»‡t). DB thá»±c táº¿ Ä‘Ã£ dÃ¹ng V2 qua `prisma.config.ts`. Schema V1 khÃ´ng cÃ²n dÃ¹ng nhÆ°ng váº«n tá»“n táº¡i trong repo.

Nguy cÆ¡: Developer má»›i cÃ³ thá»ƒ dÃ¹ng sai schema file khi cháº¡y `prisma migrate`, `prisma generate` mÃ  khÃ´ng Ä‘á»c ká»¹ `prisma.config.ts`. CÅ©ng gÃ¢y confusion khi tÃ¬m kiáº¿m model trong codebase.

**Gá»£i Ã½:** Giá»¯ nguyÃªn V1 lÃ m archive lá»‹ch sá»­ nhÆ°ng rename thÃ nh `schema-v1.archive.prisma` hoáº·c move vÃ o `docs/` vá»›i chÃº thÃ­ch rÃµ.

### 3.4. `allocations.ts` hardcode fee constants á»Ÿ táº§ng business logic

Trong `src/modules/transactions/review/allocations.ts`:

```typescript
const STANDARD_MONTHLY_FEE = 250000;
const LK_MONTHLY_FEE = 200000;
```

ÄÃ¢y lÃ  háº±ng sá»‘ phÃ­ Ä‘Æ°á»£c hardcode, khÃ´ng Ä‘á»c tá»« báº£ng `QuyTacPhi` trong database. Äiá»u nÃ y cÃ³ thá»ƒ dáº«n Ä‘áº¿n phÃ¢n bá»• sai náº¿u má»©c phÃ­ thay Ä‘á»•i mÃ  khÃ´ng cáº­p nháº­t code. Báº£ng `quy_tac_phi` Ä‘Ã£ cÃ³ trong schema nhÆ°ng khÃ´ng Ä‘Æ°á»£c dÃ¹ng cho logic allocation nÃ y.

### 3.5. Má»™t sá»‘ script CLI quÃ¡ dÃ i, chá»©a toÃ n bá»™ nghiá»‡p vá»¥

`scripts/import-bank-statement-v2.cjs` dÃ i ~589 dÃ²ng, chá»©a toÃ n bá»™: parser mÃ£ cÄƒn, header detection, date parsing, fingerprint, DB write logic... Äiá»u nÃ y Ä‘i ngÆ°á»£c láº¡i nguyÃªn táº¯c Ä‘Ã£ ghi trong `module-map.md` ("script chá»‰ lÃ  entrypoint CLI má»ng, logic dÃ i nÃªn tÃ¡ch vá» src/modules/").

Script nÃ y hiá»‡n táº¡i hoáº¡t Ä‘á»™ng tá»‘t nhÆ°ng khÃ³ test riÃªng láº» vÃ  khÃ³ maintain khi parser cáº§n nÃ¢ng cáº¥p.

### 3.6. `NgoaiLeGiaoDich` dÃ¹ng `String` thay vÃ¬ enum

Trong `schema.prisma`:

```prisma
model NgoaiLeGiaoDich {
  loai_ngoai_le   String  // â† khÃ´ng dÃ¹ng enum
  trang_thai      String  // â† khÃ´ng dÃ¹ng enum
```

Trong khi schema V1 cÃ³ enum `ExceptionType` vÃ  `ExceptionStatus`. ÄÃ¢y lÃ  regression vá» type safety so vá»›i V1. Dá»¯ liá»‡u cÃ³ thá»ƒ nháº­p giÃ¡ trá»‹ tÃ¹y tiá»‡n.

### 3.7. `DuyetGiaoDich` khÃ´ng cÃ³ `updatedAt`

Model `DuyetGiaoDich` khÃ´ng cÃ³ `ngay_cap_nhat`/`updatedAt`. Khi import láº¡i cÃ¹ng file sao kÃª, script xÃ³a vÃ  táº¡o láº¡i `duyet_giao_dich`, máº¥t lá»‹ch sá»­ ai Ä‘Ã£ review gÃ¬ trÆ°á»›c Ä‘Ã³.

### 3.8. `components/review-dashboard.tsx` gáº§n nhÆ° rá»—ng

File nÃ y chá»‰ cÃ³ 83 bytes â€” cÃ³ thá»ƒ chá»‰ lÃ  re-export hoáº·c placeholder. Náº¿u lÃ  dead code, nÃªn ghi rÃµ tráº¡ng thÃ¡i.

---

## 4. Nháº­n xÃ©t vá» kiáº¿n trÃºc tá»•ng thá»ƒ

### 4.1. Sá»± tá»“n táº¡i cá»§a `lib/` lÃ  cÃ³ kiá»ƒm soÃ¡t, khÃ´ng pháº£i ná»£ ká»¹ thuáº­t xáº¥u

`lib/` Ä‘Æ°á»£c document rÃµ lÃ  "lá»›p tÆ°Æ¡ng thÃ­ch cÅ©". CÃ¡c file trong Ä‘Ã³ Ä‘á»u lÃ  wrapper re-export hoáº·c test cÅ©. NguyÃªn táº¯c "khÃ´ng thÃªm nghiá»‡p vá»¥ má»›i vÃ o lib/" Ä‘Æ°á»£c ghi rÃµ. ÄÃ¢y lÃ  debt cÃ³ nháº­n thá»©c, khÃ´ng pháº£i debt vÃ´ Ã½.

### 4.2. Trang chá»§ `/` vÃ  `/tra-cuu-phi` cÃ³ logic hÆ¡i trÃ¹ng nhau

Cáº£ hai trang Ä‘á»u cÃ³ form tra cá»©u phÃ­. `/` redirect sang `/tra-cuu-phi` Ä‘á»ƒ tra cá»©u. ÄÃ¢y lÃ  UX Ä‘Ãºng (trang chá»§ mobile-first â†’ form â†’ káº¿t quáº£ á»Ÿ trang riÃªng), nhÆ°ng cáº§n Ä‘áº£m báº£o parser logic khÃ´ng bá»‹ duplicate giá»¯a hai route.

### 4.3. Server-side rate limiting á»Ÿ Server Component lÃ  lá»±a chá»n thá»±c dá»¥ng nhÆ°ng cÃ³ giá»›i háº¡n

ÄÃ£ nháº­n xÃ©t á»Ÿ má»¥c 3.2. Vá»›i project ná»™i bá»™ quy mÃ´ nhá», Ä‘Ã¢y lÃ  Ä‘Ã¡nh Ä‘á»•i há»£p lÃ½ giá»¯a Ä‘Æ¡n giáº£n vÃ  Ä‘á»§ dÃ¹ng.

### 4.4. Prisma Adapter PG thay vÃ¬ Prisma connection pool máº·c Ä‘á»‹nh

DÃ¹ng `@prisma/adapter-pg` vá»›i `PrismaPg` trong scripts vÃ  `prisma.config.ts` lÃ  lá»±a chá»n phÃ¹ há»£p khi muá»‘n kiá»ƒm soÃ¡t connection pool thá»§ cÃ´ng (Ä‘áº·c biá»‡t trong mÃ´i trÆ°á»ng serverless hoáº·c script CLI lÃ¢u dÃ i).

---

## 5. Nháº­n xÃ©t vá» UX vÃ  UI

### 5.1. Design system nháº¥t quÃ¡n vÃ  thá»±c dá»¥ng

Bá»™ CSS token (`--accent`, `--bg`, `--panel`...) Ä‘Æ°á»£c dÃ¹ng nháº¥t quÃ¡n. Font "Be Vietnam Pro" lÃ  lá»±a chá»n tá»‘t cho tiáº¿ng Viá»‡t. HÆ°á»›ng "civic utility" (cÃ´ng cá»¥, khÃ´ng pháº£i landing page) Ä‘Æ°á»£c tuÃ¢n thá»§.

### 5.2. Mobile-first Ä‘Æ°á»£c quan tÃ¢m

`min-height: 100svh`, `min(920px, calc(100vw - 32px))`, `clamp()` cho heading, form `input` `min-height: 54px` â€” cÃ¡c chi tiáº¿t nÃ y cho tháº¥y mobile Ä‘Æ°á»£c Æ°u tiÃªn thá»±c sá»±, khÃ´ng chá»‰ trÃªn giáº¥y.

### 5.3. ThÃ´ng bÃ¡o lá»—i thÃ¢n thiá»‡n vá»›i ngÆ°á»i dÃ¹ng

"ChÆ°a nháº­n diá»‡n Ä‘Æ°á»£c mÃ£ cÄƒn", "Tra cá»©u quÃ¡ nhanh", luÃ´n cÃ³ vÃ­ dá»¥ nháº­p láº¡i â€” Ä‘Ã¢y lÃ  má»©c UX writing tá»‘t cho ngÆ°á»i dÃ¹ng phá»• thÃ´ng.

### 5.4. Má»™t Ä‘iá»ƒm cÃ³ thá»ƒ cáº£i thiá»‡n vá» UX

Trang `/tra-cuu-phi` khi tra cá»©u thÃ nh cÃ´ng hiá»‡n chá»‰ hiá»ƒn thá»‹ "thÃ¡ng Ä‘Ã£ Ä‘Ã³ng" dáº¡ng text. Náº¿u hiá»ƒn thá»‹ thÃªm dáº¡ng visual (progress bar, timeline hoáº·c badge thÃ¡ng) sáº½ giÃºp cÆ° dÃ¢n hiá»ƒu nhanh hÆ¡n mÃ  khÃ´ng cáº§n Ä‘á»c ká»¹.

---

## 6. Nháº­n xÃ©t vá» test coverage

CÃ³ `82 tests pass` (theo handoff), chá»§ yáº¿u lÃ  unit test cho:
- Parser mÃ£ cÄƒn (`apartment-parser.test.ts`)
- Matcher (`matcher.test.ts`)
- Billing fee status (`fee-status.test.ts`)
- Allocations (`allocations.test.ts`)
- PDF reader (`statement-pdf-reader.test.ts`)

**Äiá»ƒm máº¡nh:** Golden test cho parser lÃ  pattern tá»‘t, bao phá»§ Ä‘Æ°á»£c regression khi nÃ¢ng cáº¥p rule.

**Äiá»ƒm thiáº¿u:**
- KhÃ´ng cÃ³ integration test cho DB flow (import â†’ parse â†’ save â†’ read)
- KhÃ´ng cÃ³ E2E test cho public lookup flow
- KhÃ´ng cÃ³ test cho scripts CLI (vÃ¬ logic náº±m trong script, khÃ´ng tÃ¡ch module)

Vá»›i quy mÃ´ project nÃ y, khÃ´ng cáº§n E2E phá»©c táº¡p, nhÆ°ng integration test cho má»™t vÃ i happy path quan trá»ng sáº½ giÃºp tá»± tin hÆ¡n khi deploy.

---

## 7. Nháº­n xÃ©t vá» quy trÃ¬nh váº­n hÃ nh

### 7.1. Quy trÃ¬nh deploy Ä‘Æ°á»£c thiáº¿t káº¿ tháº­n trá»ng

CÃ³ `checklist-duyet-truoc-deploy.md` lÃ  "cá»•ng dá»«ng thá»§ cÃ´ng" â€” yÃªu cáº§u chá»§ dá»± Ã¡n duyá»‡t thá»§ cÃ´ng trÆ°á»›c khi lÃ m Task O (deploy). ÄÃ¢y lÃ  quyáº¿t Ä‘á»‹nh Ä‘Ãºng cho dá»± Ã¡n cÃ³ dá»¯ liá»‡u tháº­t cá»§a cÆ° dÃ¢n.

### 7.2. Backup DB Ä‘Æ°á»£c quan tÃ¢m

CÃ³ `scripts/production/backup-postgres.sh` vÃ  script `npm run db:backup:repo`. CÅ©ng cÃ³ `db-sync/` vá»›i file `.sql` dump. Tuy nhiÃªn:

- File `.sql` trong `db-sync/` (1MB) Ä‘ang commit vÃ o git â€” Ä‘Ã¢y lÃ  dá»¯ liá»‡u tháº­t (cÃ³ thá»ƒ cÃ³ thÃ´ng tin nháº¡y cáº£m). Cáº§n kiá»ƒm tra `.gitignore` vÃ  xem Ä‘Ã¢y lÃ  data máº«u hay production dump.

### 7.3. TÃ i khoáº£n admin dev chá»©a SÄT tháº­t

Handoff ghi: `tÃ i khoáº£n admin cÃ³ SÄT Ä‘Äƒng nháº­p 0904802553, role SUPER_ADMIN`. SÄT nÃ y Ä‘Æ°á»£c commit vÃ o `docs/handoff.md` vÃ  `docs/roadmap.md`. ÄÃ¢y lÃ  thÃ´ng tin nháº¡y cáº£m tá»‘i thiá»ƒu â€” khÃ´ng nguy hiá»ƒm nhÆ° máº­t kháº©u, nhÆ°ng nÃªn cÃ¢n nháº¯c khi repo trá»Ÿ thÃ nh public hoáº·c khi chia sáº» docs vá»›i bÃªn thá»© ba.

---

## 8. TÃ³m táº¯t Ä‘Ã¡nh giÃ¡

| Háº¡ng má»¥c | ÄÃ¡nh giÃ¡ |
|---|---|
| TÃ i liá»‡u hÃ³a | â­â­â­â­â­ Xuáº¥t sáº¯c |
| Thiáº¿t káº¿ database | â­â­â­â­ Tá»‘t |
| Parser mÃ£ cÄƒn | â­â­â­â­â­ Xuáº¥t sáº¯c |
| Báº£o máº­t public API | â­â­â­â­ Tá»‘t |
| Kiáº¿n trÃºc module | â­â­â­â­ Tá»‘t |
| Test coverage | â­â­â­ Äá»§ dÃ¹ng, cÃ²n thiáº¿u integration |
| Consistency parser TS vs CJS | â­â­ Cáº§n chÃº Ã½ |
| UX public page | â­â­â­â­ Tá»‘t |
| Váº­n hÃ nh / deploy readiness | â­â­â­â­ Tá»‘t |

---

## 9. Top 5 Æ°u tiÃªn gÃ³p Ã½ (theo má»©c Ä‘á»™ quan trá»ng)

1. **[Cao] Äá»“ng bá»™ parser TypeScript vÃ  CJS script** â€” Rule `BLOCK_ROOM_PHONG_ALIAS` vÃ  má»™t sá»‘ pattern Ä‘ang lá»‡ch nhau. Cáº§n audit vÃ  Ä‘á»“ng bá»™ trÆ°á»›c khi dÃ¹ng cho production tháº­t.

2. **[Trung bÃ¬nh] ÄÆ°a fee constant vÃ o DB hoáº·c config** â€” `STANDARD_MONTHLY_FEE = 250000` hardcode trong business logic. Náº¿u phÃ­ thay Ä‘á»•i, cáº§n sá»­a code thay vÃ¬ cáº­p nháº­t DB.

3. **[Trung bÃ¬nh] LÃ m rÃµ tráº¡ng thÃ¡i schema V1** â€” Rename `schema.prisma` thÃ nh `schema-v1.archive.prisma` hoáº·c thÃªm comment rÃµ "khÃ´ng dÃ¹ng ná»¯a" Ä‘á»ƒ trÃ¡nh nháº§m láº«n.

4. **[Tháº¥p] ThÃªm enum cho `NgoaiLeGiaoDich`** â€” `loai_ngoai_le` vÃ  `trang_thai` lÃ  String thay vÃ¬ enum. Máº¥t type safety, dá»… nháº­p giÃ¡ trá»‹ sai.

5. **[Tháº¥p] Kiá»ƒm tra ná»™i dung file `db-sync/*.sql`** â€” Náº¿u lÃ  data tháº­t cá»§a cÆ° dÃ¢n, cáº§n Ä‘áº£m báº£o khÃ´ng cÃ³ thÃ´ng tin cÃ¡ nhÃ¢n nháº¡y cáº£m bá»‹ commit vÃ o git.

---

*Pháº§n I Ä‘Ã¡nh giÃ¡ dá»±a trÃªn Ä‘á»c code ngÃ y 2026-05-18. KhÃ´ng cÃ³ file nÃ o bá»‹ sá»­a Ä‘á»•i.*

---

# PHáº¦N II â€” Architecture Audit ChuyÃªn SÃ¢u

> **Vai trÃ²:** Senior System Architect & Financial Product Manager â€” 10+ nÄƒm xÃ¢y dá»±ng Reconciliation Systems, SaaS ERP, pháº§n má»m káº¿ toÃ¡n.
> **PhÆ°Æ¡ng phÃ¡p:** Äá»c schema, code logic vÃ  scripts Ä‘á»ƒ Ä‘Ã¡nh giÃ¡ theo 4 tiÃªu chÃ­: Data Integrity, Edge Cases, Scalability, Audit Trail.

---

## A. Nháº­n Ä‘á»‹nh chung vá» Ä‘á»™ trÆ°á»Ÿng thÃ nh kiáº¿n trÃºc

**PhÃ¡n quyáº¿t: Solid MVP â€” gáº§n Production-ready cho quy mÃ´ 1 tÃ²a nhÃ .**

Kiáº¿n trÃºc nÃ y vÆ°á»£t háº³n má»©c Prototype. CÃ¡c quyáº¿t Ä‘á»‹nh thiáº¿t káº¿ thá»ƒ hiá»‡n tÆ° duy cá»§a ngÆ°á»i Ä‘Ã£ va cháº¡m vá»›i dá»¯ liá»‡u tÃ i chÃ­nh thá»±c táº¿: cÃ³ staging layer, cÃ³ fingerprint chá»‘ng trÃ¹ng, cÃ³ snapshot tÃ¡ch biá»‡t cho public. Tuy nhiÃªn, Ä‘á»ƒ váº­n hÃ nh á»•n Ä‘á»‹nh cho dá»¯ liá»‡u tÃ i chÃ­nh tháº­t, cáº§n giáº£i quyáº¿t 4 lá»— há»•ng cá»‘t lÃµi dÆ°á»›i Ä‘Ã¢y trÆ°á»›c khi deploy.

---

## B. Data Integrity â€” ToÃ n váº¹n dá»¯ liá»‡u tÃ i chÃ­nh

### B.1. [CRITICAL] KhÃ´ng cÃ³ DB-level constraint chá»‘ng double-allocation

**Váº¥n Ä‘á» nghiÃªm trá»ng nháº¥t cá»§a toÃ n há»‡ thá»‘ng.**

Báº£ng `phan_bo_giao_dich` khÃ´ng cÃ³ constraint ngÄƒn má»™t giao dá»‹ch bá»‹ phÃ¢n bá»• hai láº§n cho cÃ¹ng má»™t cÄƒn:

```prisma
model PhanBoGiaoDich {
  giao_dich_ngan_hang_id  Int
  can_ho_id               Int
  so_tien_phan_bo         Decimal
  -- KHÃ”NG CÃ“: @@unique([giao_dich_ngan_hang_id, can_ho_id])
  -- KHÃ”NG CÃ“: CHECK constraint tá»•ng phÃ¢n bá»• <= so_tien gá»‘c
}
```

**Ká»‹ch báº£n xáº£y ra lá»—i:**

Script import xÃ³a vÃ  táº¡o láº¡i allocation báº±ng `deleteMany` + `create` riÃªng láº» (khÃ´ng trong transaction):

```javascript
await prisma.phanBoGiaoDich.deleteMany({ where: { giao_dich_ngan_hang_id: dbTransaction.id } });
// â† Náº¿u crash á»Ÿ Ä‘Ã¢y: allocation Ä‘Ã£ bá»‹ xÃ³a, khÃ´ng cÃ³ allocation má»›i â†’ máº¥t tiá»n
await prisma.phanBoGiaoDich.create({ data: { ... } });
// â† Náº¿u crash á»Ÿ Ä‘Ã¢y: allocation má»›i chÆ°a vÃ o, script cháº¡y láº¡i â†’ táº¡o thÃªm â†’ nhÃ¢n Ä‘Ã´i
```

Há»‡ quáº£: Náº¿u script bá»‹ interrupt (máº¥t Ä‘iá»‡n, timeout, lá»—i network) trong vÃ²ng láº·p `for (const record of records)`, dá»¯ liá»‡u sáº½ á»Ÿ tráº¡ng thÃ¡i khÃ´ng nháº¥t quÃ¡n â€” má»™t sá»‘ giao dá»‹ch máº¥t allocation, má»™t sá»‘ cÃ³ thá»ƒ bá»‹ trÃ¹ng.

**Fix cá»¥ thá»ƒ:**

1. ThÃªm `@@unique([giao_dich_ngan_hang_id, can_ho_id])` vÃ o schema
2. Bá»c toÃ n bá»™ block xá»­ lÃ½ má»—i giao dá»‹ch trong `prisma.$transaction([...])`
3. ThÃªm CHECK tá»•ng `SUM(so_tien_phan_bo) <= so_tien gá»‘c` báº±ng PostgreSQL trigger hoáº·c validate á»Ÿ application layer

### B.2. [HIGH] Tá»•ng phÃ¢n bá»• multi-allocation khÃ´ng Ä‘Æ°á»£c validate á»Ÿ DB layer

Trong `allocations.ts`, hÃ m `hasValidAllocationDrafts` kiá»ƒm tra tá»•ng = `row.amount` á»Ÿ application layer:

```typescript
return drafts.reduce((sum, item) => sum + item.amount, 0) === row.amount;
```

NhÆ°ng **khÃ´ng cÃ³ gÃ¬ ngÄƒn** viá»‡c ghi tháº³ng vÃ o DB vá»›i tá»•ng sai náº¿u ai Ä‘Ã³ bypass UI hoáº·c gá»i API trá»±c tiáº¿p. Báº£ng `phan_bo_giao_dich` thiáº¿u constraint:

- KhÃ´ng cÃ³ trigger kiá»ƒm tra `SUM(so_tien_phan_bo) WHERE giao_dich_ngan_hang_id = X <= so_tien_goc`
- KhÃ´ng cÃ³ `sequenceNo` hoáº·c `is_final` flag Ä‘á»ƒ phÃ¢n biá»‡t allocation draft vÃ  allocation confirmed

**Fix cá»¥ thá»ƒ:** Táº¡o PostgreSQL function validate sau má»—i INSERT/UPDATE vÃ o `phan_bo_giao_dich`, raise exception náº¿u tá»•ng vÆ°á»£t quÃ¡ `so_tien` cá»§a giao dá»‹ch gá»‘c.

### B.3. [MEDIUM] `so_tien` lÆ°u dáº¡ng `String` trong code, `Decimal` trong schema

Trong script import:

```javascript
so_tien: String(transaction.amount),  // â† String
so_tien_phan_bo: String(transaction.amount),  // â† String
```

NhÆ°ng schema Ä‘á»‹nh nghÄ©a `@db.Decimal(14, 2)`. Prisma tá»± convert, nhÆ°ng phÃ©p so sÃ¡nh `row.amount === expectedTotal` trong `allocations.ts` so sÃ¡nh `number` vá»›i `number` â€” khÃ´ng cÃ³ váº¥n Ä‘á» khi cÃ¹ng nguá»“n, nhÆ°ng khi Ä‘á»c tá»« DB vá», Prisma tráº£ `Decimal` object, khÃ´ng pháº£i `number`. Náº¿u code Ä‘á»c tá»« DB rá»“i so sÃ¡nh báº±ng `===` vá»›i sá»‘ JavaScript, sáº½ luÃ´n `false`.

**Fix cá»¥ thá»ƒ:** DÃ¹ng nháº¥t quÃ¡n `Decimal` tá»« `@prisma/client/runtime/library` cho má»i phÃ©p tÃ­nh tiá»n. KhÃ´ng dÃ¹ng `===` so sÃ¡nh sá»‘ tiá»n â€” dÃ¹ng `decimal.equals(other)`.

---

## C. Edge Cases â€” 5 ká»‹ch báº£n ngoáº¡i lá»‡ khá»‘c liá»‡t

### C.1. CÄƒn há»™ chuyá»ƒn nhÆ°á»£ng giá»¯a chá»«ng â€” khoáº£n ná»£ treo tá»« chá»§ cÅ©

**Ká»‹ch báº£n:** CÄƒn L2.305 Ä‘á»•i chá»§ vÃ o ngÃ y 15/3/2026. Chá»§ cÅ© ná»£ phÃ­ thÃ¡ng 1, 2, 3. Chá»§ má»›i Ä‘Ã³ng Ä‘á»§ phÃ­ tá»« thÃ¡ng 4. Sao kÃª thÃ¡ng 3 cÃ³ má»™t giao dá»‹ch "DONG PHI QLVH L2305" = 750.000Ä‘ (3 thÃ¡ng) â€” khÃ´ng rÃµ cá»§a chá»§ cÅ© hay chá»§ má»›i.

**Há»‡ thá»‘ng hiá»‡n táº¡i xá»­ lÃ½ tháº¿ nÃ o?**
- Parser nháº­n diá»‡n `L2.305` â†’ `KHOP_TRUC_TIEP`
- Allocation ghi 750.000Ä‘ vÃ o cÄƒn L2.305
- **KhÃ´ng cÃ³ cÆ¡ cháº¿ phÃ¢n biá»‡t khoáº£n ná»£ cá»§a chá»§ cÅ© vs chá»§ má»›i**
- Báº£ng `lien_he_can_ho` khÃ´ng cÃ³ `hieu_luc_tu_ngay`/`hieu_luc_den_ngay` theo period

**Háº­u quáº£:** BQT khÃ´ng biáº¿t ai cáº§n Ä‘Æ°á»£c nháº¯c ná»£ â€” chá»§ cÅ© (Ä‘Ã£ chuyá»ƒn Ä‘i) hay chá»§ má»›i (vÃ´ tÃ¬nh "hÆ°á»Ÿng" khoáº£n thanh toÃ¡n ná»£ cÅ©).

**Fix cá»¥ thá»ƒ:** Bá»• sung `ngay_hieu_luc` vÃ o `phan_bo_giao_dich` Ä‘á»ƒ tag khoáº£n ná»£ thuá»™c period nÃ o, káº¿t há»£p vá»›i `lien_he_can_ho.ngay_hieu_luc` Ä‘á»ƒ biáº¿t Ä‘áº§u má»‘i tÆ°Æ¡ng á»©ng thá»i Ä‘iá»ƒm Ä‘Ã³.

### C.2. NgÃ¢n hÃ ng thay Ä‘á»•i format sao kÃª â€” header detection sai im láº·ng

**Ká»‹ch báº£n:** Vietcombank cáº­p nháº­t template XLS, Ä‘á»•i tÃªn cá»™t "MÃ´ táº£ giao dá»‹ch" thÃ nh "Ná»™i dung" vÃ  "NgÃ y háº¡ch toÃ¡n" thÃ nh "NgÃ y GD". Script import váº«n cháº¡y khÃ´ng bÃ¡o lá»—i vÃ¬ `findHeaderRow` cháº¥m Ä‘iá»ƒm theo fuzzy match vÃ  váº«n tÃ¬m Ä‘Æ°á»£c row Ä‘á»§ Ä‘iá»ƒm:

```javascript
const score =
  normalized.some(cell => cell.includes("ngay hach toan") || cell.includes("accounting date")) +
  normalized.some(cell => cell.includes("mo ta giao dich") || ...) * 3 + ...
if (best.score < 3) throw new Error(...);
```

Náº¿u format má»›i Ä‘á»§ Ä‘iá»ƒm (score â‰¥ 3) nhÆ°ng map sai cá»™t, `descriptionIndex` trá» vÃ o cá»™t sai. Táº¥t cáº£ 125 giao dá»‹ch sáº½ cÃ³ `noi_dung_goc` sai â†’ parser khÃ´ng nháº­n diá»‡n Ä‘Æ°á»£c cÄƒn â†’ toÃ n bá»™ import thÃ nh `CHUA_NHAN_DIEN_DUOC_CAN` **mÃ  khÃ´ng cÃ³ cáº£nh bÃ¡o rÃµ rÃ ng**.

**Há»‡ thá»‘ng hiá»‡n táº¡i:** Chá»‰ throw error náº¿u `descriptionIndex < 0`. KhÃ´ng validate sample cá»§a vÃ i dÃ²ng Ä‘áº§u.

**Fix cá»¥ thá»ƒ:** Sau khi detect header, láº¥y 5 dÃ²ng Ä‘áº§u lÃ m sample vÃ  check: (1) Cá»™t ngÃ y cÃ³ parse Ä‘Æ°á»£c Date khÃ´ng? (2) Cá»™t sá»‘ tiá»n cÃ³ > 0 rows vá»›i sá»‘ há»£p lá»‡ khÃ´ng? (3) Cá»™t mÃ´ táº£ cÃ³ trung bÃ¬nh > 10 kÃ½ tá»± khÃ´ng? Náº¿u fail báº¥t ká»³ check nÃ o â†’ throw vá»›i message cá»¥ thá»ƒ.

### C.3. Má»™t cÆ° dÃ¢n Ä‘Ã³ng gá»™p nhiá»u thÃ¡ng + nhiá»u cÄƒn trong má»™t chuyá»ƒn khoáº£n

**Ká»‹ch báº£n:** Ã”ng A sá»Ÿ há»¯u 3 cÄƒn: L1.101, L2.205, LK1.5. Chuyá»ƒn 1 láº§n: "DONG PHI QLVH 6 THANG CHO 3 CAN L1101 L2205 LK15" = 4.200.000Ä‘.

TÃ­nh Ä‘Ãºng: (250.000 Ã— 6) + (250.000 Ã— 6) + (200.000 Ã— 6) = 4.200.000Ä‘.

**Há»‡ thá»‘ng hiá»‡n táº¡i:**
- Parser tráº£ vá» 3 candidates: `L1.101`, `L2.205`, `LK1.5` â†’ status `NHIEU_CAN`
- `allocations.ts` `buildMultiAllocationMeta` tÃ­nh weight theo **1 thÃ¡ng**: 250k + 250k + 200k = 700k
- `exactMatch = (4.200.000 === 700.000)` â†’ **false** â†’ dÃ¹ng prorated theo tá»· trá»ng 1 thÃ¡ng
- Káº¿t quáº£: L1.101 nháº­n 1.500.000, L2.205 nháº­n 1.500.000, LK1.5 nháº­n 1.200.000
- **Allocation Ä‘Ãºng vá» tá»· trá»ng nhÆ°ng khÃ´ng biáº¿t Ä‘Ã¢y lÃ  6 thÃ¡ng** â€” `ghi_chu` chá»‰ ghi "lá»‡ch chuáº©n"

**Háº­u quáº£:** BÃ¡o cÃ¡o phÃ­ public khÃ´ng cáº­p nháº­t Ä‘Æ°á»£c "Ä‘Ã£ Ä‘Ã³ng Ä‘áº¿n thÃ¡ng nÃ o" cho 3 cÄƒn nÃ y vÃ¬ khÃ´ng cÃ³ logic suy ra sá»‘ thÃ¡ng tá»« tá»•ng tiá»n chia tá»· trá»ng.

**Fix cá»¥ thá»ƒ:** Khi `exactMatch = false`, tÃ­nh thÃªm `inferredMonths = round(totalAmount / standardFee)` cho tá»«ng loáº¡i cÄƒn vÃ  ghi vÃ o `ghi_chu` allocation Ä‘á»ƒ reviewer cÃ³ thá»ƒ ra quyáº¿t Ä‘á»‹nh nhanh hÆ¡n.

### C.4. NgÃ¢n hÃ ng gá»­i sao kÃª trÃ¹ng láº·p do lá»—i xuáº¥t file

**Ká»‹ch báº£n:** BQT táº£i file sao kÃª thÃ¡ng 4 hai láº§n (file bá»‹ lá»—i láº§n Ä‘áº§u, táº£i láº¡i). Fingerprint SHA-256 dá»±a trÃªn `(date, amount, description, senderAccount, transactionId)`. Náº¿u `transactionId` trá»‘ng (ngÃ¢n hÃ ng khÃ´ng export), fingerprint chá»‰ dá»±a vÃ o 4 field cÃ²n láº¡i.

**Script hiá»‡n táº¡i** dÃ¹ng upsert theo `van_tay_giao_dich` (fingerprint) hoáº·c `tham_chieu_ngan_hang` â†’ khÃ´ng insert trÃ¹ng giao dá»‹ch.

**NhÆ°ng cÃ³ edge case:** Náº¿u cÃ¹ng ngÃ y cÃ³ 2 giao dá»‹ch khÃ¡c nhau tá»« cÃ¹ng ngÆ°á»i vá»›i cÃ¹ng sá»‘ tiá»n vÃ  cÃ¹ng mÃ´ táº£ (vÃ­ dá»¥: 2 láº§n chuyá»ƒn 250.000 cÃ¹ng ná»™i dung cÃ¹ng ngÃ y), fingerprint **sáº½ trÃ¹ng nhau**, giao dá»‹ch thá»© 2 sáº½ bá»‹ coi lÃ  duplicate vÃ  bá» qua â€” **máº¥t 1 giao dá»‹ch há»£p lá»‡**.

**Fix cá»¥ thá»ƒ:** ThÃªm `row_index_in_file` vÃ o fingerprint, hoáº·c dÃ¹ng `tham_chieu_ngan_hang` lÃ m primary dedup key vÃ  chá»‰ dÃ¹ng fingerprint nhÆ° fallback.

### C.5. Thay Ä‘á»•i má»©c phÃ­ giá»¯a nÄƒm â€” allocation tÃ­nh sai tá»· trá»ng

**Ká»‹ch báº£n:** BQT tÄƒng phÃ­ tá»« 250.000 lÃªn 300.000/thÃ¡ng tá»« ngÃ y 01/07/2026. Má»™t cÆ° dÃ¢n chuyá»ƒn 550.000Ä‘ vÃ o 15/07/2026 cho 2 thÃ¡ng (250k thÃ¡ng 6 + 300k thÃ¡ng 7).

**Há»‡ thá»‘ng hiá»‡n táº¡i:**
- `allocations.ts` hardcode `STANDARD_MONTHLY_FEE = 250000`
- `config/periodic-fee-rules.json` cÃ³ `effectiveFrom: "2026-01-01"` nhÆ°ng **khÃ´ng Ä‘Æ°á»£c Ä‘á»c** trong allocation code
- `quy_tac_phi` trong DB cÃ³ `hieu_luc_tu_ngay`/`hieu_luc_den_ngay` nhÆ°ng **khÃ´ng Ä‘Æ°á»£c query** khi tÃ­nh weight

**Háº­u quáº£:** `exactMatch = (550.000 === 500.000)` â†’ false â†’ prorated theo tá»· lá»‡ cÅ© â†’ ghi chÃº "lá»‡ch chuáº©n" â†’ BQT pháº£i review thá»§ cÃ´ng mÃ  khÃ´ng cÃ³ hint vá» lÃ½ do.

**Fix cá»¥ thá»ƒ:** HÃ m `getApartmentMonthlyFee` cáº§n nháº­n thÃªm param `transactionDate` vÃ  query `quy_tac_phi` Ä‘á»ƒ láº¥y má»©c phÃ­ Ä‘Ãºng theo thá»i Ä‘iá»ƒm giao dá»‹ch.

---

## D. Scalability â€” Äiá»ƒm tháº¯t cá»• chai khi má»Ÿ rá»™ng

### D.1. [HIGH] VÃ²ng láº·p N+8 queries trong import script

Vá»›i 125 giao dá»‹ch, script hiá»‡n táº¡i thá»±c hiá»‡n khoáº£ng **125 Ã— 8 = 1.000 queries** tuáº§n tá»±:

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
  // + thÃªm phanBo...
}
```

Vá»›i 10.000 cÄƒn vÃ  thÃ¡ng cao Ä‘iá»ƒm ~5.000 giao dá»‹ch â†’ **~45.000 queries tuáº§n tá»±**. TrÃªn VPS 2 core, thá»i gian import cÃ³ thá»ƒ lÃªn Ä‘áº¿n 30â€“60 phÃºt.

**Fix cá»¥ thá»ƒ:**
1. Batch `dongSaoKeTho` báº±ng `createMany` sau khi Ä‘á»c toÃ n bá»™ file
2. Pre-load táº¥t cáº£ `giaoDichNganHang` theo fingerprint trong 1 query `findMany`
3. DÃ¹ng `prisma.$transaction` vá»›i batch upsert thay vÃ¬ loop tuáº§n tá»±

### D.2. [MEDIUM] `la_batch_public_hien_hanh` lÃ  boolean flag khÃ´ng cÃ³ partial unique index

Khi cÃ³ 5 tÃ²a nhÃ , má»—i tÃ²a cÃ³ 1 batch hiá»‡n hÃ nh:

```prisma
la_batch_public_hien_hanh Boolean @default(false)
@@index([trang_thai, la_batch_public_hien_hanh])
```

KhÃ´ng cÃ³ `@@unique` constraint nÃ o Ä‘áº£m báº£o chá»‰ cÃ³ **Ä‘Ãºng 1 batch** `la_batch_public_hien_hanh = true` táº¡i má»™t thá»i Ä‘iá»ƒm. Náº¿u script `publish-fee-public-batch-v2.cjs` cháº¡y concurrent (vÃ­ dá»¥: 2 Super Admin cÃ¹ng publish), cÃ³ thá»ƒ cÃ³ 2 batch Ä‘Æ°á»£c Ä‘Ã¡nh dáº¥u `true` â†’ public page Ä‘á»c `findFirst` vÃ  hiá»ƒn thá»‹ sai batch.

**Fix cá»¥ thá»ƒ:** ThÃªm PostgreSQL partial unique index: `CREATE UNIQUE INDEX ON batch_trang_thai_phi_public (la_batch_public_hien_hanh) WHERE la_batch_public_hien_hanh = true;`

### D.3. [MEDIUM] Khi má»Ÿ rá»™ng multi-tÃ²a, schema thiáº¿u tenant isolation

Schema hiá»‡n táº¡i khÃ´ng cÃ³ khÃ¡i niá»‡m `toa_nha_id` hay `du_an_id` á»Ÿ báº¥t ká»³ báº£ng nÃ o. Náº¿u sau nÃ y quáº£n lÃ½ 5 tÃ²a nhÃ , toÃ n bá»™ báº£ng sáº½ trá»™n láº«n dá»¯ liá»‡u. `BatchTrangThaiPhiPublic` khÃ´ng cÃ³ field nÃ o Ä‘á»ƒ phÃ¢n biá»‡t batch thuá»™c tÃ²a nÃ o.

**Fix cá»¥ thá»ƒ:** Khi cÃ³ nhu cáº§u multi-tÃ²a, thÃªm `du_an_id` vÃ o `can_ho`, `lo_nhap_du_lieu`, `batch_trang_thai_phi_public` vÃ  thÃªm RLS (Row Level Security) trong PostgreSQL.

### D.4. [LOW] `ungVienKhopGiaoDich` xÃ³a toÃ n bá»™ rá»“i insert láº¡i khi re-import

Má»—i láº§n re-import cÃ¹ng file, script `deleteMany` toÃ n bá»™ candidates cÅ© cá»§a giao dá»‹ch rá»“i `createMany` láº¡i. Vá»›i 5.000 giao dá»‹ch Ã— trung bÃ¬nh 3 candidates = 15.000 deletes + 15.000 inserts má»—i láº§n re-import. Thay báº±ng upsert theo `(ket_qua_parse_giao_dich_id, thu_hang)` sáº½ hiá»‡u quáº£ hÆ¡n.

---

## E. Security & Audit Trail

### E.1. [HIGH] `DuyetGiaoDich` bá»‹ xÃ³a vÃ  táº¡o láº¡i â€” máº¥t lá»‹ch sá»­ review

Má»—i láº§n import láº¡i cÃ¹ng file sao kÃª:

```javascript
await prisma.duyetGiaoDich.deleteMany({ where: { giao_dich_ngan_hang_id: dbTransaction.id } });
await prisma.duyetGiaoDich.create({ data: { trang_thai_duyet: "CHUA_DUYET", ... } });
```

Náº¿u má»™t Manager Ä‘Ã£ review vÃ  Ä‘Ã¡nh dáº¥u `DA_DUYET` hoáº·c `TU_CHOI`, re-import sáº½ **xÃ³a toÃ n bá»™ lá»‹ch sá»­ review vÃ  reset vá» CHUA_DUYET**. ThÃ´ng tin "ai duyá»‡t lÃºc nÃ o vá»›i lÃ½ do gÃ¬" bá»‹ máº¥t hoÃ n toÃ n.

**Fix cá»¥ thá»ƒ:** ThÃªm `ngay_cap_nhat`/`updatedAt` vÃ o `DuyetGiaoDich`. Chá»‰ reset review khi giao dá»‹ch cÃ²n `CHUA_DUYET` â€” náº¿u Ä‘Ã£ `DA_DUYET` hoáº·c `TU_CHOI`, skip delete vÃ  log warning. Hoáº·c chuyá»ƒn sang append-only: khÃ´ng xÃ³a review cÅ©, thÃªm record má»›i vá»›i `la_hien_tai = true`.

### E.2. [MEDIUM] `nguoi_duyet` lÆ°u dáº¡ng String tá»± do, khÃ´ng FK vÃ o `TaiKhoanQuanTri`

```prisma
model DuyetGiaoDich {
  nguoi_duyet  String?  // â† free text, khÃ´ng FK
}
```

KhÃ´ng cÃ³ cÃ¡ch verify `nguoi_duyet` cÃ³ pháº£i tÃ i khoáº£n há»£p lá»‡ khÃ´ng. Ai Ä‘Ã³ cÃ³ thá»ƒ ghi báº¥t ká»³ tÃªn nÃ o. Trong má»™t há»‡ thá»‘ng tÃ i chÃ­nh, trÆ°á»ng nÃ y pháº£i lÃ  FK hoáº·c Ã­t nháº¥t lÃ  ID cÃ³ thá»ƒ truy ngÆ°á»£c.

**Fix cá»¥ thá»ƒ:** Äá»•i `nguoi_duyet String?` thÃ nh `nguoi_duyet_id Int?` vá»›i FK vÃ o `tai_khoan_quan_tri.id`. LÆ°u `ten_hien_thi` á»Ÿ thá»i Ä‘iá»ƒm duyá»‡t vÃ o `ghi_chu_duyet` Ä‘á»ƒ khÃ´ng bá»‹ máº¥t khi account bá»‹ rename.

### E.3. [MEDIUM] KhÃ´ng cÃ³ immutable audit log cho thao tÃ¡c nháº¡y cáº£m

Há»‡ thá»‘ng chÆ°a cÃ³ báº£ng `audit_log` ghi láº¡i:
- Ai Ä‘Ã£ publish batch nÃ o lÃºc máº¥y giá»
- Ai Ä‘Ã£ approve/reject contact candidate nÃ o
- Ai Ä‘Ã£ táº¡o tÃ i khoáº£n Manager má»›i
- Ai Ä‘Ã£ import file sao kÃª nÃ o

Hiá»‡n táº¡i chá»‰ cÃ³ `lo_nhap_du_lieu.nguoi_nhap_id` vÃ  `batch_trang_thai_phi_public.nguoi_public_id`, nhÆ°ng thiáº¿u log cho cÃ¡c thao tÃ¡c cÃ²n láº¡i. `payload_duyet_json` trong `ung_vien_lien_he_can_ho` lÃ  cÃ¡ch tiáº¿p cáº­n tá»‘t nhÆ°ng khÃ´ng nháº¥t quÃ¡n.

**Fix cá»¥ thá»ƒ:** Táº¡o báº£ng `nhat_ky_thao_tac (id, tai_khoan_id, hanh_dong, doi_tuong, doi_tuong_id, payload_truoc_json, payload_sau_json, thoi_diem)` vÃ  ghi log cho Ã­t nháº¥t 5 hÃ nh Ä‘á»™ng: publish batch, approve/reject contact, import file, táº¡o/khÃ³a tÃ i khoáº£n, sá»­a phÃ¢n bá»•.

### E.4. [LOW] Session cookie thiáº¿u rotation sau login

Middleware kiá»ƒm tra `verifyAdminSessionToken` nhÆ°ng khÃ´ng cÃ³ cÆ¡ cháº¿ rotate session token sau N giá» hoáº¡t Ä‘á»™ng. Náº¿u session bá»‹ intercepted (MITM trÃªn mÃ´i trÆ°á»ng khÃ´ng HTTPS Ä‘áº§y Ä‘á»§), attacker cÃ³ thá»ƒ dÃ¹ng token vÃ´ thá»i háº¡n cho Ä‘áº¿n khi logout.

**Fix cá»¥ thá»ƒ:** ThÃªm `iat` (issued at) vÃ o JWT payload vÃ  kiá»ƒm tra khÃ´ng quÃ¡ 8 tiáº¿ng â€” yÃªu cáº§u Ä‘Äƒng nháº­p láº¡i. Hoáº·c dÃ¹ng sliding expiry: gia háº¡n session má»—i request náº¿u cÃ²n dÆ°á»›i 1 tiáº¿ng.

---

## F. Tá»•ng há»£p rá»§i ro theo ma tráº­n

| ID | Váº¥n Ä‘á» | Má»©c Ä‘á»™ | Kháº£ nÄƒng xáº£y ra | Æ¯u tiÃªn |
|---|---|---|---|---|
| B.1 | Double-allocation khi script crash | ðŸ’€ Critical | Trung bÃ¬nh | **P0** |
| B.2 | KhÃ´ng validate tá»•ng allocation á»Ÿ DB | ðŸ”´ High | Tháº¥p | P1 |
| C.2 | Bank format Ä‘á»•i â†’ import sai im láº·ng | ðŸ”´ High | Cao | P1 |
| E.1 | Re-import xÃ³a lá»‹ch sá»­ review Ä‘Ã£ duyá»‡t | ðŸ”´ High | Cao | P1 |
| C.1 | Ná»£ chá»§ cÅ© khÃ´ng tÃ¡ch Ä‘Æ°á»£c vá»›i chá»§ má»›i | ðŸŸ¡ Medium | Trung bÃ¬nh | P2 |
| C.5 | Thay Ä‘á»•i má»©c phÃ­ â†’ allocation tÃ­nh sai | ðŸŸ¡ Medium | Tháº¥p-trung | P2 |
| D.1 | N+8 queries loop â†’ cháº­m khi scale | ðŸŸ¡ Medium | Cao khi scale | P2 |
| E.2 | `nguoi_duyet` khÃ´ng cÃ³ FK | ðŸŸ¡ Medium | Cao | P2 |
| D.2 | KhÃ´ng cÃ³ constraint 1 batch public | ðŸŸ¡ Medium | Tháº¥p | P2 |
| C.4 | Fingerprint trÃ¹ng â†’ máº¥t giao dá»‹ch há»£p lá»‡ | ðŸŸ¡ Medium | Tháº¥p | P3 |
| E.3 | Thiáº¿u audit log nháº¥t quÃ¡n | ðŸŸ¡ Medium | LuÃ´n luÃ´n | P3 |
| C.3 | Gá»™p nhiá»u thÃ¡ng khÃ´ng suy ra sá»‘ thÃ¡ng | ðŸŸ¢ Low | Trung bÃ¬nh | P3 |
| D.3 | KhÃ´ng cÃ³ tenant isolation | ðŸŸ¢ Low | Khi má»Ÿ rá»™ng | P4 |
| E.4 | Session khÃ´ng cÃ³ rotation | ðŸŸ¢ Low | Tháº¥p | P4 |

---

## G. Lá»™ trÃ¬nh sá»­a Ä‘á» xuáº¥t (Actionable Roadmap)

### Sprint 1 â€” TrÆ°á»›c deploy production (báº¯t buá»™c)

1. **Bá»c toÃ n bá»™ vÃ²ng láº·p import trong `prisma.$transaction`** Ä‘á»ƒ Ä‘áº£m báº£o atomicity tá»«ng giao dá»‹ch
2. **ThÃªm `@@unique([giao_dich_ngan_hang_id, can_ho_id])`** vÃ o `PhanBoGiaoDich`
3. **Báº£o vá»‡ re-import khÃ´ng xÃ³a review Ä‘Ã£ duyá»‡t**: check `trang_thai_duyet` trÆ°á»›c khi `deleteMany`
4. **Sample validation sau header detection**: kiá»ƒm tra 5 dÃ²ng Ä‘áº§u cÃ³ parse Ä‘Æ°á»£c date/amount khÃ´ng

### Sprint 2 â€” Sau deploy, trong vÃ²ng 1 thÃ¡ng Ä‘áº§u váº­n hÃ nh

5. **Äá»c `quy_tac_phi` tá»« DB** thay vÃ¬ hardcode trong `allocations.ts`
6. **Äá»•i `nguoi_duyet String` thÃ nh FK `nguoi_duyet_id`** trong `DuyetGiaoDich`
7. **ThÃªm partial unique index** cho `la_batch_public_hien_hanh = true`
8. **Táº¡o báº£ng `nhat_ky_thao_tac`** vÃ  log 3 hÃ nh Ä‘á»™ng quan trá»ng nháº¥t: publish batch, approve contact, import file

### Sprint 3 â€” Khi cÃ³ nhu cáº§u má»Ÿ rá»™ng

9. **Batch hoÃ¡ import queries** báº±ng `createMany` + pre-load thay vÃ¬ N+8 loop
10. **Äá»“ng bá»™ parser TS vÃ  CJS** báº±ng cÃ¡ch build TypeScript â†’ CommonJS
11. **ThÃªm `du_an_id`** náº¿u má»Ÿ rá»™ng sang multi-tÃ²a nhÃ 

---

*Architecture Audit dá»±a trÃªn phÃ¢n tÃ­ch schema, code vÃ  scripts ngÃ y 2026-05-18. KhÃ´ng cÃ³ file nÃ o bá»‹ sá»­a Ä‘á»•i.*

