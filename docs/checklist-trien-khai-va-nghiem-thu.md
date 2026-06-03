# Checklist triá»ƒn khai vÃ  nghiá»‡m thu há»‡ thá»‘ng

## LiÃªn káº¿t xÆ°Æ¡ng sá»‘ng

- Má»¥c lá»¥c tÃ i liá»‡u: [README.md](README.md)
- Handoff hiá»‡n táº¡i: [handoff.md](handoff.md)
- Roadmap control: [roadmap.md](roadmap.md)
- Roadmap Phase 2: [phase-2-roadmap.md](phase-2-roadmap.md)
- Database: [database.md](database.md)
- Parser mÃ£ cÄƒn: [parser-ma-can-ho.md](parser-ma-can-ho.md)
- Design system: [design-system.md](design-system.md)
- Production VPS: [production-deploy-vps.md](production-deploy-vps.md)
- Project README: [../README.md](../README.md)

## Má»¥c Ä‘Ã­ch

File nÃ y lÃ  checklist Ä‘iá»u phá»‘i triá»ƒn khai vÃ  nghiá»‡m thu. Má»—i task pháº£i tráº£ lá»i rÃµ:

- lÃ m gÃ¬
- dá»¯ liá»‡u/file nÃ o liÃªn quan
- review á»Ÿ Ä‘Ã¢u
- check/test báº±ng gÃ¬
- confirm Ä‘iá»u gÃ¬ trÆ°á»›c khi sang bÆ°á»›c tiáº¿p theo

File control tiáº¿n trÃ¬nh cáº¥p cao váº«n lÃ :

- `docs/roadmap.md`

File nÃ y control Ä‘iá»u kiá»‡n nghiá»‡m thu chi tiáº¿t.

TrÆ°á»›c khi sang Task O deploy public, pháº£i dÃ¹ng thÃªm cá»•ng duyá»‡t thá»§ cÃ´ng:

- [checklist-duyet-truoc-deploy.md](checklist-duyet-truoc-deploy.md)

## Quy táº¯c cáº­p nháº­t

Má»—i khi báº¯t Ä‘áº§u hoáº·c hoÃ n táº¥t task:

- cáº­p nháº­t tráº¡ng thÃ¡i task trong file nÃ y
- cáº­p nháº­t `docs/roadmap.md` náº¿u tráº¡ng thÃ¡i cáº¥p cao thay Ä‘á»•i
- cáº­p nháº­t `docs/handoff.md` náº¿u lÃ  má»‘c bÃ n giao lá»›n

Má»—i khi Ä‘á»•i schema:

- cáº­p nháº­t `prisma/schema.prisma`
- cáº­p nháº­t `docs/database.md`
- cháº¡y validate schema
- ghi rÃµ chÆ°a/cháº¡y migration trong `docs/handoff.md`

Má»—i khi Ä‘á»•i parser mÃ£ cÄƒn:

- cáº­p nháº­t `docs/parser-ma-can-ho.md`
- thÃªm hoáº·c cáº­p nháº­t golden test trong `lib/parser/apartment-parser.test.ts`
- náº¿u áº£nh hÆ°á»Ÿng public lookup, cáº­p nháº­t `lib/billing/fee-status.test.ts`
- náº¿u áº£nh hÆ°á»Ÿng lá»c giao dá»‹ch, cáº­p nháº­t `docs/filter-rules.vi.md`
- cháº¡y `npm test`

## Quy táº¯c qua cá»•ng nghiá»‡m thu

KhÃ´ng sang task tiáº¿p theo náº¿u task hiá»‡n táº¡i chÆ°a cÃ³ Ä‘á»§:

1. Review: tÃ i liá»‡u/code/schema Ä‘Ã£ Ä‘Æ°á»£c Ä‘á»c láº¡i, khÃ´ng mÃ¢u thuáº«n vá»›i roadmap.
2. Check: cÃ³ lá»‡nh hoáº·c bÃ¡o cÃ¡o kiá»ƒm chá»©ng dá»¯ liá»‡u.
3. Test: cÃ³ test/build/validate phÃ¹ há»£p vá»›i pháº¡m vi thay Ä‘á»•i.
4. Confirm: ghi rÃµ káº¿t quáº£ vÃ o checklist hoáº·c handoff.

Vá»›i cÃ¡c bÆ°á»›c cÃ³ reset DB, migrate hoáº·c import dá»¯ liá»‡u tháº­t, pháº£i cÃ³ backup/snapshot hoáº·c xÃ¡c nháº­n rÃµ mÃ´i trÆ°á»ng Ä‘ang lÃ  dev.

## Checklist Phase 2 sau MVP

Phase 2 Ä‘ang Ä‘i theo quyáº¿t Ä‘á»‹nh má»›i ngÃ y 2026-05-27:

- KhÃ´ng nháº­p láº¡i toÃ n bá»™ sao kÃª quÃ¡ khá»© T1-T5/2026 vÃ o DB chÃ­nh thá»©c.
- Chá»‘t dá»¯ liá»‡u T5/2026 lÃ m opening balance.
- Tá»« T6/2026 trá»Ÿ Ä‘i má»›i váº­n hÃ nh sao kÃª ngÃ¢n hÃ ng báº±ng luá»“ng import, parser, duyá»‡t, lÆ°u báº±ng chá»©ng vÃ  chá»‘t public.

Cá»•ng nghiá»‡m thu tá»‘i thiá»ƒu cho Phase 2:

- [ ] Chá»§ dá»± Ã¡n duyá»‡t file T5 cuá»‘i cÃ¹ng lÃ m opening balance.
- [ ] Backup DB trÆ°á»›c má»i migration production.
- [ ] Schema sao kÃª T6 Ä‘Ã£ validate trÃªn dev.
- [ ] Parser khÃ´ng tá»± suy luáº­n case thiáº¿u lÃ´ nhÆ° `L 111B`.
- [ ] MÃ n hÃ¬nh import sao kÃª cÃ³ preview trÆ°á»›c khi ghi staging.
- [ ] MÃ n hÃ¬nh duyá»‡t sao kÃª xá»­ lÃ½ Ä‘Æ°á»£c má»™t cÄƒn, nhiá»u cÄƒn, khÃ´ng nháº­n diá»‡n, Zalo/báº±ng chá»©ng.
- [ ] MÃ n hÃ¬nh duyá»‡t sao kÃª desktop 24 inch khÃ´ng cÃ³ kÃ©o ngang toÃ n trang vÃ  xem Ä‘Æ°á»£c giao dá»‹ch, parser result, gá»£i Ã½ cÄƒn, action duyá»‡t trong má»™t mÃ n hÃ¬nh.
- [ ] MÃ n hÃ¬nh duyá»‡t sao kÃª cÃ³ Ä‘Ã¡nh giÃ¡ cháº¥t lÆ°á»£ng thÃ´ng tin: cháº¯c, khÃ¡ cháº¯c, cáº§n kiá»ƒm tra, khÃ´ng Ä‘á»§ dá»¯ liá»‡u.
- [ ] Giao dá»‹ch Ä‘Ã£ duyá»‡t má»›i Ä‘Æ°á»£c ghi vÃ o lá»‹ch sá»­ phÃ­.
- [ ] Super Admin má»›i Ä‘Æ°á»£c chá»‘t batch public.
- [ ] Public lookup khÃ´ng Ä‘á»c dá»¯ liá»‡u sao kÃª chÆ°a duyá»‡t.
- [ ] `npm test` vÃ  `npm run build` pass trÆ°á»›c deploy.

## Tráº¡ng thÃ¡i ná»n Ä‘Ã£ hoÃ n thÃ nh

CÃ¡c pháº§n dÆ°á»›i Ä‘Ã¢y Ä‘Ã£ hoÃ n thÃ nh trÆ°á»›c roadmap public web:

- [x] Cáº¥u trÃºc code má»›i Æ°u tiÃªn `src/modules/`
- [x] Database V1 Ä‘Ã£ thiáº¿t káº¿ vÃ  migrate
- [x] PostgreSQL local Ä‘Ã£ cháº¡y Ä‘Æ°á»£c
- [x] Prisma validate/generate Ä‘Ã£ cháº¡y Ä‘Æ°á»£c
- [x] Import workbook quáº£n lÃ½ cÅ© vÃ o raw V1
- [x] Transform V1 ra `Apartment`, `Resident`, `Occupancy`
- [x] Audit dá»¯ liá»‡u contact tá»« file quáº£n lÃ½ cÅ©
- [x] Preview contact tá»« file quáº£n lÃ½ cÅ©
- [x] ÄÃ¡nh giÃ¡ file `Danh_Sach_Can_Ho_Master.xlsx`
- [x] Preview contact tá»« file master má»›i
- [x] Má»Ÿ rá»™ng `schema.prisma` cho auth, public fee snapshot vÃ  contact review

Má»‘c dá»¯ liá»‡u Ä‘Ã£ chá»‘t:

- `934` cÄƒn há»£p lá»‡
- `884` cÄƒn `CHUNG_CU`
- `50` cÄƒn `LIEN_KE`
- `LKV.45`, `LKV.47`, `LKV.58` giá»¯ nguyÃªn mÃ£, tÃ­nh phÃ­ nhÆ° `LIEN_KE`
- file master má»›i khá»›p `934/934` mÃ£ cÄƒn
- preview contact file master má»›i:
  - `402` cÄƒn `NHAP_THANG`
  - `532` cÄƒn `CAN_RA_SOAT`
  - `1977` dÃ²ng contact preview

---

# Task list hiá»‡n táº¡i

## Task A. Chuáº©n hÃ³a tÃ i liá»‡u cáº¥p cao

### Má»¥c tiÃªu

`docs/` lÃ  nÆ¡i lÆ°u tÃ i liá»‡u xÆ°Æ¡ng sá»‘ng. NgÆ°á»i má»›i vÃ o dá»± Ã¡n pháº£i biáº¿t Ä‘á»c file nÃ o trÆ°á»›c vÃ  file nÃ o control tiáº¿n trÃ¬nh.

### File liÃªn quan

- `docs/README.md`
- `docs/roadmap.md`
- `docs/handoff.md`
- `docs/checklist-trien-khai-va-nghiem-thu.md`

### Viá»‡c cáº§n lÃ m

- táº¡o má»¥c lá»¥c tÃ i liá»‡u
- táº¡o roadmap public web
- cáº­p nháº­t handoff trá» tá»›i roadmap
- gá»™p checklist triá»ƒn khai/nghiá»‡m thu thÃ nh file hiá»‡n táº¡i

### Review

- Ä‘á»c láº¡i `docs/README.md`
- Ä‘á»c láº¡i `docs/roadmap.md`
- kiá»ƒm tra thá»© tá»± Ä‘á»c trong `docs/handoff.md`

### Check/Test

- kiá»ƒm tra Ä‘á»§ 4 file tÃ i liá»‡u xÆ°Æ¡ng sá»‘ng
- kiá»ƒm tra khÃ´ng cÃ²n mÃ¢u thuáº«n: file control cáº¥p cao lÃ  `docs/roadmap.md`, file nghiá»‡m thu lÃ  checklist nÃ y

### Confirm Ä‘á»ƒ qua bÆ°á»›c

- [x] `docs/README.md` tá»“n táº¡i
- [x] `docs/roadmap.md` tá»“n táº¡i
- [x] `docs/handoff.md` Ä‘Ã£ trá» tá»›i README/roadmap
- [x] checklist nÃ y Ä‘Ã£ gá»™p roadmap + nghiá»‡m thu

### Tráº¡ng thÃ¡i

- [x] HoÃ n thÃ nh

---

## Task B. Chá»‘t schema hiện hành má»Ÿ rá»™ng

### Má»¥c tiÃªu

Chá»‘t schema má»¥c tiÃªu Ä‘á»ƒ phá»¥c vá»¥:

- cÄƒn há»™ master
- contact staging/review
- tÃ i khoáº£n quáº£n trá»‹
- phÃ¢n quyá»n `SUPER_ADMIN` / `MANAGER` / `TECHNICIAN`
- import file theo dÃµi thu phÃ­
- batch public tráº¡ng thÃ¡i phÃ­
- public snapshot cho cÆ° dÃ¢n tra cá»©u

### File liÃªn quan

- `prisma/schema.prisma`
- `docs/database.md`
- `docs/roadmap.md`

### Viá»‡c cáº§n lÃ m

- bá»• sung field gá»‘c tá»« file master cho `can_ho`
- bá»• sung vai trÃ²/tráº¡ng thÃ¡i contact
- bá»• sung metadata review cho `ung_vien_lien_he_can_ho`
- thÃªm `tai_khoan_quan_tri`
- thÃªm staging `dong_theo_doi_thu_phi_tho`
- thÃªm `batch_trang_thai_phi_public`
- thÃªm `trang_thai_phi_can_ho_public`

### Review

- Ä‘á»c láº¡i schema hiện hành
- Ä‘á»‘i chiáº¿u vá»›i `docs/database.md`
- Ä‘á»‘i chiáº¿u vá»›i roadmap: public khÃ´ng Ä‘á»c raw/contact

### Check/Test

```bash
npx prisma validate --schema prisma/schema.prisma
```

Káº¿t quáº£ hiá»‡n táº¡i:

- schema hiện hành Ä‘Ã£ validate thÃ nh cÃ´ng

### Confirm Ä‘á»ƒ qua bÆ°á»›c

- [x] CÃ³ role `SUPER_ADMIN`
- [x] CÃ³ role `MANAGER`
- [x] CÃ³ role `TECHNICIAN`
- [x] CÃ³ báº£ng tÃ i khoáº£n quáº£n trá»‹
- [x] CÃ³ báº£ng staging file theo dÃµi thu phÃ­
- [x] CÃ³ batch public tráº¡ng thÃ¡i phÃ­
- [x] CÃ³ snapshot phÃ­ public theo cÄƒn
- [x] Contact cÃ³ vai trÃ²/tráº¡ng thÃ¡i/nguá»“n dá»¯ liá»‡u
- [x] Prisma validate pass
- [x] ÄÃ£ táº¡o migration/reset DB dev

### Tráº¡ng thÃ¡i

- [x] HoÃ n thÃ nh pháº§n schema
- [x] ÄÃ£ Ã¡p dá»¥ng vÃ o DB dev

---

## Task C. Migrate/reset DB dev sang V2

### Má»¥c tiÃªu

ÄÆ°a DB dev sang schema hiện hành má»Ÿ rá»™ng Ä‘á»ƒ báº¯t Ä‘áº§u import dá»¯ liá»‡u theo pipeline má»›i.

### File liÃªn quan

- `prisma/schema.prisma`
- `prisma/migrations/`
- `.env`
- `db-sync/`
- `docs/handoff.md`

### Viá»‡c cáº§n lÃ m

- backup/snapshot DB dev hiá»‡n táº¡i náº¿u cáº§n giá»¯
- chuyá»ƒn Prisma config hoáº·c lá»‡nh migration sang `schema.prisma`
- táº¡o migration V2
- reset DB dev
- generate Prisma Client V2
- seed rule phÃ­
- chuáº©n bá»‹ tÃ i khoáº£n `SUPER_ADMIN` Ä‘áº§u tiÃªn

### Review

- Ä‘á»c láº¡i `schema.prisma`
- xÃ¡c nháº­n DB hiá»‡n táº¡i lÃ  dev
- xÃ¡c nháº­n snapshot cÅ© cÃ³ thá»ƒ restore náº¿u cáº§n

### Check/Test

CÃ¡c lá»‡nh kiá»ƒm tra tá»‘i thiá»ƒu:

```bash
npx prisma validate --schema prisma/schema.prisma
npx prisma generate --schema prisma/schema.prisma
```

Sau migration/reset, kiá»ƒm tra báº±ng SQL:

```sql
select count(*) from can_ho;
select count(*) from tai_khoan_quan_tri;
select count(*) from quy_tac_phi;
```

### Confirm Ä‘á»ƒ qua bÆ°á»›c

- [x] CÃ³ migration V2
- [x] DB dev Ä‘Ã£ reset/migrate thÃ nh cÃ´ng
- [x] Prisma Client V2 generate Ä‘Æ°á»£c
- [x] CÃ³ seed rule phÃ­ `CHUNG_CU = 250000`, `LIEN_KE = 200000`
- [x] CÃ³ tÃ i khoáº£n `SUPER_ADMIN` Ä‘áº§u tiÃªn
- [x] `docs/handoff.md` ghi rÃµ DB Ä‘Ã£ sang V2

Káº¿t quáº£ thá»±c táº¿:

- migration: `20260515000100_v2_public_web`
- backup trÆ°á»›c migration: `.local/db-backups/apartment_fee_reviewer-before-v2-20260515-163208.sql`
- `npx prisma validate`, `npx prisma generate`, `npm test`, `npm run build` Ä‘Ã£ pass

### Tráº¡ng thÃ¡i

- [x] HoÃ n thÃ nh

---

## Task D. Import master cÄƒn há»™

### Má»¥c tiÃªu

Import `Danh_Sach_Can_Ho_Master.xlsx` lÃ m nguá»“n chÃ­nh cho `can_ho`.

### File liÃªn quan

- `docs/Danh_Sach_Can_Ho_Master.xlsx`
- `docs/reports/danh-gia-danh-sach-can-ho-master.md`
- báº£ng `lo_nhap_du_lieu`
- báº£ng `dong_du_lieu_quan_ly_tho`
- báº£ng `can_ho`

### Viá»‡c cáº§n lÃ m

- import raw sheet `MASTER DATA`
- lÆ°u `header_values_json`, `values_json`, `mapped_row_json`
- sync `934` cÄƒn vÃ o `can_ho`
- lÆ°u:
  - `ma_can`
  - `ma_lo`
  - `ma_so`
  - `dien_tich_m2`
  - `loai_can`
  - `toa_lo_goc`
  - `loai_hinh_goc`
  - `chu_ho_ten_goc`
  - `trang_thai_su_dung_goc`
  - `tinh_trang_goc`
- giá»¯ `LKV.*` nguyÃªn mÃ£, tÃ­nh phÃ­ nhÆ° `LIEN_KE`

### Review

- review mapping cá»™t Excel sang DB
- Ä‘á»‘i chiáº¿u vá»›i bÃ¡o cÃ¡o file master
- kiá»ƒm tra cÃ¡c case `LKV.45`, `LKV.47`, `LKV.58`

### Check/Test

Kiá»ƒm tra sau import:

```sql
select count(*) from can_ho;
select loai_can, count(*) from can_ho group by loai_can order by loai_can;
select ma_can from can_ho where ma_can in ('LKV.45', 'LKV.47', 'LKV.58');
```

Ká»³ vá»ng:

- `can_ho = 934`
- `CHUNG_CU = 884`
- `LIEN_KE = 50`
- Ä‘á»§ 3 cÄƒn `LKV.*`

### Confirm Ä‘á»ƒ qua bÆ°á»›c

- [x] Import raw master cÃ³ batch
- [x] `can_ho` cÃ³ Ä‘á»§ `934` cÄƒn
- [x] KhÃ´ng cÃ³ `ma_can` trÃ¹ng
- [x] KhÃ´ng cÃ³ `ma_can` rá»—ng
- [x] Loáº¡i cÄƒn Ä‘Ãºng
- [x] CÃ³ bÃ¡o cÃ¡o/check output sau import

Káº¿t quáº£ thá»±c táº¿:

- batch master V2: `1`
- `dong_du_lieu_quan_ly_tho`: `934` dÃ²ng
- `can_ho`: `934` cÄƒn
- `CHUNG_CU`: `884`
- `LIEN_KE`: `50`
- Ä‘á»§ `LKV.45`, `LKV.47`, `LKV.58`

### Tráº¡ng thÃ¡i

- [x] HoÃ n thÃ nh trong DB V2

---

## Task E. Sinh staging contact tá»« file master

### Má»¥c tiÃªu

Sinh `ung_vien_lien_he_can_ho` tá»« file master, khÃ´ng Ä‘á»• tháº³ng contact báº©n vÃ o `lien_he_can_ho`.

### File liÃªn quan

- `docs/Danh_Sach_Can_Ho_Master.xlsx`
- `docs/preview-master-lien-he-can-ho/README.md`
- `docs/preview-master-lien-he-can-ho/preview-tong-hop.csv`
- báº£ng `ung_vien_lien_he_can_ho`

### Viá»‡c cáº§n lÃ m

- Ä‘á»c `Chá»§ Há»™ (TÃªn)`
- Ä‘á»c `NgÆ°á»i sá»­ dá»¥ng 1..5`
- Ä‘á»c `SÄT 1..5`
- Ä‘á»c `ThÃ´ng tin phá»¥`
- Ä‘á»c `Tráº¡ng ThÃ¡i Sá»­ Dá»¥ng (Auto)`
- Ä‘á»c `TÃŒNH TRáº NG`
- sinh candidate contact
- phÃ¢n loáº¡i `NHAP_THANG` / `CAN_RA_SOAT`
- lÆ°u `ly_do_ra_soat`
- lÆ°u payload gá»‘c Ä‘á»ƒ manager xem láº¡i

### Review

- má»Ÿ `preview-tong-hop.csv`
- má»Ÿ `can-ra-soat.csv`
- kiá»ƒm tra cÃ¡c case cÃ³:
  - chá»§ má»›i
  - khÃ¡ch thuÃª
  - tÃªn láº«n sá»‘
  - sá»‘ khÃ´ng tÃªn
  - nhiá»u cÄƒn dÃ¹ng chung sá»‘

### Check/Test

Query tá»‘i thiá»ƒu:

```sql
select count(*) from ung_vien_lien_he_can_ho;
select co_can_ra_soat, count(*) from ung_vien_lien_he_can_ho group by co_can_ra_soat;
select ma_can, count(*) from ung_vien_lien_he_can_ho group by ma_can order by count(*) desc limit 20;
```

Ká»³ vá»ng tham chiáº¿u tá»« preview:

- khoáº£ng `1977` dÃ²ng contact candidate
- `402` cÄƒn nháº­p tÆ°Æ¡ng Ä‘á»‘i tháº³ng
- `532` cÄƒn cáº§n rÃ  soÃ¡t

### Confirm Ä‘á»ƒ qua bÆ°á»›c

- [x] Candidate Ä‘Æ°á»£c sinh vÃ o DB
- [x] CÃ³ phÃ¢n loáº¡i cáº§n rÃ  soÃ¡t
- [x] CÃ³ lÃ½ do rÃ  soÃ¡t
- [x] CÃ³ payload gá»‘c Ä‘á»ƒ review
- [x] ChÆ°a tá»± nháº­p toÃ n bá»™ vÃ o `lien_he_can_ho`

Káº¿t quáº£ thá»±c táº¿:

- `ung_vien_lien_he_can_ho`: `1977` dÃ²ng
- candidate khÃ´ng cáº§n rÃ  soÃ¡t: `484` dÃ²ng, thuá»™c `402` cÄƒn
- candidate cáº§n rÃ  soÃ¡t: `1493` dÃ²ng, thuá»™c `532` cÄƒn

### Tráº¡ng thÃ¡i

- [x] HoÃ n thÃ nh trong DB V2

---

## Task F. Seed dá»¯ liá»‡u ná»n vÃ  tÃ i khoáº£n Super Admin

### Má»¥c tiÃªu

Chuáº©n bá»‹ dá»¯ liá»‡u tá»‘i thiá»ƒu Ä‘á»ƒ vÃ¹ng quáº£n trá»‹ hoáº¡t Ä‘á»™ng.

### File liÃªn quan

- `prisma/schema.prisma`
- script seed sáº½ táº¡o má»›i
- báº£ng `quy_tac_phi`
- báº£ng `tai_khoan_quan_tri`

### Viá»‡c cáº§n lÃ m

- seed `quy_tac_phi`
- táº¡o tÃ i khoáº£n `SUPER_ADMIN` Ä‘áº§u tiÃªn
- lÆ°u password dáº¡ng hash, khÃ´ng lÆ°u plain text
- ghi cÃ¡ch Ä‘á»•i máº­t kháº©u ban Ä‘áº§u vÃ o tÃ i liá»‡u váº­n hÃ nh

### Review

- xÃ¡c nháº­n khÃ´ng hardcode password tháº­t trong repo
- xÃ¡c nháº­n role admin Ä‘Ãºng `SUPER_ADMIN`

### Check/Test

```sql
select loai_can, ma_phi, so_tien from quy_tac_phi;
select ten_dang_nhap, vai_tro, trang_thai from tai_khoan_quan_tri;
```

### Confirm Ä‘á»ƒ qua bÆ°á»›c

- [x] CÃ³ rule phÃ­ chung cÆ°/liá»n ká»
- [x] CÃ³ Super Admin Ä‘áº§u tiÃªn
- [x] KhÃ´ng commit máº­t kháº©u tháº­t

Káº¿t quáº£ thá»±c táº¿:

- `quy_tac_phi`: cÃ³ rule `CHUNG_CU`, `LIEN_KE`
- `tai_khoan_quan_tri`: cÃ³ user `admin`, role `SUPER_ADMIN`, tráº¡ng thÃ¡i `DANG_HOAT_DONG`
- password dev Ä‘Æ°á»£c truyá»n qua biáº¿n mÃ´i trÆ°á»ng khi seed, khÃ´ng ghi vÃ o repo

### Tráº¡ng thÃ¡i

- [x] HoÃ n thÃ nh trÃªn DB dev V2

---

## Task G. Auth vÃ  phÃ¢n quyá»n quáº£n trá»‹

### Má»¥c tiÃªu

Táº¡o vÃ¹ng ná»™i bá»™ báº¯t buá»™c Ä‘Äƒng nháº­p, phÃ¢n quyá»n rÃµ `SUPER_ADMIN`, `MANAGER` vÃ  `TECHNICIAN`.

### File liÃªn quan

- app/admin hoáº·c route quáº£n trá»‹ sáº½ táº¡o
- báº£ng `tai_khoan_quan_tri`

### Viá»‡c cáº§n lÃ m

- login quáº£n trá»‹
- Ä‘Äƒng nháº­p quáº£n trá»‹ báº±ng `ten_dang_nhap` hoáº·c sá»‘ Ä‘iá»‡n thoáº¡i
- session/cookie báº£o máº­t
- middleware báº£o vá»‡ route quáº£n trá»‹
- role `SUPER_ADMIN`
- role `MANAGER`
- role `TECHNICIAN`
- Super Admin quáº£n lÃ½ tÃ i khoáº£n `SUPER_ADMIN`, `MANAGER`, `TECHNICIAN`

### Review

- xÃ¡c nháº­n route admin khÃ´ng truy cáº­p Ä‘Æ°á»£c khi chÆ°a login
- xÃ¡c nháº­n manager khÃ´ng vÃ o Ä‘Æ°á»£c chá»©c nÄƒng Super Admin

### Check/Test

Test thá»§ cÃ´ng tá»‘i thiá»ƒu:

- chÆ°a login vÃ o admin bá»‹ redirect/login
- Super Admin vÃ o Ä‘Æ°á»£c trang quáº£n trá»‹
- Manager khÃ´ng vÃ o Ä‘Æ°á»£c trang import/chá»‘t public

Test tá»± Ä‘á»™ng náº¿u cÃ³:

- unit/integration cho guard phÃ¢n quyá»n

### Confirm Ä‘á»ƒ qua bÆ°á»›c

- [x] Login hoáº¡t Ä‘á»™ng
- [x] Login báº±ng sá»‘ Ä‘iá»‡n thoáº¡i Ä‘Ã£ cÃ³ ná»n schema/code
- [x] Logout hoáº¡t Ä‘á»™ng
- [x] Route admin Ä‘Æ°á»£c báº£o vá»‡
- [x] Role Super Admin Ä‘Ãºng quyá»n
- [x] Role Manager bá»‹ cháº·n quyá»n nháº¡y cáº£m

Káº¿t quáº£ thá»±c táº¿:

- cÃ³ route `/admin/login`
- cÃ³ route `/admin`
- cÃ³ route `/admin/accounts` chá»‰ cho `SUPER_ADMIN`
- cÃ³ route `/admin/import` chá»‰ cho `SUPER_ADMIN`
- cÃ³ migration `20260517000100_add_admin_phone_login`
- cÃ³ migration `20260525000100_add_technician_role`
- cÃ³ trÆ°á»ng `tai_khoan_quan_tri.so_dien_thoai`
- form táº¡o manager/ká»¹ thuáº­t báº¯t buá»™c nháº­p sá»‘ Ä‘iá»‡n thoáº¡i Ä‘Äƒng nháº­p
- session lÆ°u báº±ng cookie HTTP-only cÃ³ chá»¯ kÃ½
- production báº¯t buá»™c cÃ³ `ADMIN_SESSION_SECRET`
- middleware cháº·n vÃ¹ng `/admin`
- Super Admin táº¡o/khÃ³a/má»Ÿ khÃ³a tÃ i khoáº£n `SUPER_ADMIN`, `MANAGER` hoáº·c `TECHNICIAN` Ä‘Æ°á»£c á»Ÿ `/admin/accounts`
- Super Admin Ä‘á»•i role tÃ i khoáº£n ná»™i bá»™ khÃ¡c mÃ¬nh giá»¯a `SUPER_ADMIN`, `MANAGER` vÃ  `TECHNICIAN` Ä‘Æ°á»£c á»Ÿ `/admin/accounts`
- `/admin/accounts` cÃ³ báº£ng quyá»n theo role Ä‘á»ƒ Ä‘á»‘i chiáº¿u chá»©c nÄƒng Ä‘Æ°á»£c sá»­ dá»¥ng
- tÃ i khoáº£n ná»™i bá»™ cÃ³ trang `/admin/profile` Ä‘á»ƒ Ä‘á»•i tÃªn hiá»ƒn thá»‹, email vÃ  máº­t kháº©u
- role `MANAGER` vÃ  `TECHNICIAN` ngang quyá»n: tra cá»©u ná»™i bá»™, xem liÃªn há»‡ cÆ° dÃ¢n/dá»¯ liá»‡u gá»‘c, gá»i nhanh cÆ° dÃ¢n vÃ  tÃ i khoáº£n cÃ¡ nhÃ¢n
- role `MANAGER` vÃ  `TECHNICIAN` bá»‹ cháº·n khá»i `/admin/import` vÃ  `/admin/accounts`, khÃ´ng cÃ³ form duyá»‡t/tá»« chá»‘i liÃªn há»‡
- `npm test`: `265` tests pass
- `npm run build`: pass
- `npm run test:mobile-ui`: `40` tests pass

### Tráº¡ng thÃ¡i

- [x] HoÃ n thÃ nh pháº§n ná»n auth/phÃ¢n quyá»n

---

## Task H. Import file theo dÃµi thu phÃ­

### Má»¥c tiÃªu

Import file Excel theo dÃµi thu phÃ­ thá»§ cÃ´ng Ä‘á»ƒ láº¥y dá»¯ liá»‡u public cho cÆ° dÃ¢n.

### File liÃªn quan

- file máº«u hiá»‡n táº¡i: `docs/Theo dÃµi thu phÃ­ T4.xlsx`
- file thÃ¡ng má»›i sau nÃ y: `Theo dÃµi thu phÃ­ T*.xlsx`
- báº£ng `lo_nhap_du_lieu`
- báº£ng `dong_theo_doi_thu_phi_tho`

### Viá»‡c cáº§n lÃ m

- import raw workbook thu phÃ­
- nháº­n diá»‡n sheet/báº£ng lá»‹ch sá»­ Ä‘Ã³ng phÃ­
- map mÃ£ cÄƒn
- map cá»™t `ThÃ¡ng Ä‘Ã£ Ä‘Ã³ng Ä‘áº¿n hiá»‡n táº¡i`
- sinh preview import
- phÃ¡t hiá»‡n mÃ£ cÄƒn thiáº¿u/sai
- phÃ¡t hiá»‡n thÃ¡ng báº¥t thÆ°á»ng

### Review

- review mapping cá»™t trong file Excel tháº­t
- review danh sÃ¡ch cÄƒn khÃ´ng map Ä‘Æ°á»£c
- review cÄƒn cÃ³ thÃ¡ng Ä‘Ã³ng báº¥t thÆ°á»ng

### Check/Test

Kiá»ƒm tra file T4 hiá»‡n táº¡i:

- `Danh sÃ¡ch khÃ¡ch hÃ ng`: khoáº£ng `937` dÃ²ng cÃ³ dá»¯ liá»‡u
- `Lá»‹ch sá»­ Ä‘Ã³ng phÃ­`: khoáº£ng `937` dÃ²ng cÃ³ dá»¯ liá»‡u
- ká»³ vá»ng map vá» khoáº£ng `934` cÄƒn há»£p lá»‡

Query sau import:

```sql
select count(*) from dong_theo_doi_thu_phi_tho where lo_nhap_du_lieu_id = 3;
select count(*) from dong_theo_doi_thu_phi_tho where lo_nhap_du_lieu_id = 3 and ma_can is null;
select count(*) from dong_theo_doi_thu_phi_tho where lo_nhap_du_lieu_id = 3 and thang_da_dong_den_hien_tai is null;
```

### Confirm Ä‘á»ƒ qua bÆ°á»›c

- [x] Raw workbook thu phÃ­ Ä‘Ã£ Ä‘Æ°á»£c lÆ°u
- [x] MÃ£ cÄƒn Ä‘Æ°á»£c map
- [x] Cá»™t `ThÃ¡ng Ä‘Ã£ Ä‘Ã³ng Ä‘áº¿n hiá»‡n táº¡i` Ä‘Æ°á»£c Ä‘á»c
- [x] CÃ³ preview lá»—i
- [x] ChÆ°a public dá»¯ liá»‡u nhÃ¡p

Káº¿t quáº£ thá»±c táº¿:

- script: `npm run import:fee-tracking:v2`
- file: `docs/Theo dÃµi thu phÃ­ T4.xlsx`
- sheet: `Lá»‹ch sá»­ Ä‘Ã³ng phÃ­`
- header row: `3`
- batch import: `lo_nhap_du_lieu.id = 3`
- `dong_theo_doi_thu_phi_tho`: `934` dÃ²ng
- mÃ£ cÄƒn khÃ´ng map Ä‘Æ°á»£c: `0`
- thiáº¿u `ThÃ¡ng Ä‘Ã£ Ä‘Ã³ng Ä‘áº¿n hiá»‡n táº¡i`: `0`
- mÃ£ cÄƒn distinct: `934`
- khÃ´ng parse Ä‘Æ°á»£c thÃ¡ng Ä‘Ã£ Ä‘Ã³ng: `0`
- Ä‘Ã³ng láº» tiá»n: `3`
- thÃ¡ng ngoÃ i nÄƒm gá»‘c 2026: `31`
- preview: `docs/preview-theo-doi-thu-phi/`
- `npm test`: `43` tests pass
- `npm run build`: pass

### Tráº¡ng thÃ¡i

- [x] HoÃ n thÃ nh staging import, chÆ°a public

---

## Task I. Chá»‘t batch tráº¡ng thÃ¡i phÃ­ public

### Má»¥c tiÃªu

Chá»‰ dá»¯ liá»‡u Ä‘Ã£ Ä‘Æ°á»£c Super Admin chá»‘t má»›i hiá»ƒn thá»‹ cho cÆ° dÃ¢n.

### File liÃªn quan

- báº£ng `batch_trang_thai_phi_public`
- báº£ng `trang_thai_phi_can_ho_public`
- báº£ng `dong_theo_doi_thu_phi_tho`

### Viá»‡c cáº§n lÃ m

- táº¡o batch tráº¡ng thÃ¡i phÃ­ tá»« dá»¯ liá»‡u thu phÃ­ Ä‘Ã£ import
- tráº¡ng thÃ¡i: `NHAP`, `DA_KIEM_TRA`, `DA_PUBLIC`, `HUY`
- chá»‰ má»™t batch Ä‘Æ°á»£c Ä‘Ã¡nh dáº¥u public hiá»‡n hÃ nh
- lÆ°u ngÆ°á»i public vÃ  thá»i Ä‘iá»ƒm public

### Review

- Super Admin xem preview trÆ°á»›c khi chá»‘t
- kiá»ƒm tra sá»‘ cÄƒn trong batch
- kiá»ƒm tra cÄƒn thiáº¿u dá»¯ liá»‡u thÃ¡ng Ä‘Ã³ng

### Check/Test

```sql
select trang_thai, la_batch_public_hien_hanh, count(*)
from batch_trang_thai_phi_public
group by trang_thai, la_batch_public_hien_hanh;

select count(*) from trang_thai_phi_can_ho_public where batch_id = <batch_id>;
```

Ká»³ vá»ng:

- batch public hiá»‡n hÃ nh cÃ³ khoáº£ng `934` dÃ²ng tráº¡ng thÃ¡i cÄƒn
- khÃ´ng cÃ³ nhiá»u hÆ¡n má»™t batch `la_batch_public_hien_hanh = true`

### Confirm Ä‘á»ƒ qua bÆ°á»›c

- [x] CÃ³ batch tráº¡ng thÃ¡i phÃ­
- [x] CÃ³ snapshot phÃ­ theo cÄƒn
- [x] Chá»‰ má»™t batch public hiá»‡n hÃ nh
- [x] CÃ³ ngÆ°á»i chá»‘t vÃ  thá»i Ä‘iá»ƒm chá»‘t

Káº¿t quáº£ hiá»‡n táº¡i:

- script táº¡o batch nhÃ¡p: `npm run prepare:fee-public-batch:v2`
- import batch nguá»“n: `lo_nhap_du_lieu.id = 3`
- batch tráº¡ng thÃ¡i phÃ­: `batch_trang_thai_phi_public.id = 2`
- tráº¡ng thÃ¡i batch: `DA_PUBLIC`
- `la_batch_public_hien_hanh = true`
- snapshot phÃ­: `934` dÃ²ng
- batch public hiá»‡n hÃ nh: `1`
- ngÆ°á»i public: `admin`
- script chá»‘t public: `npm run publish:fee-public-batch:v2 -- --batch-id=2 --admin=admin`
- batch nhÃ¡p cÅ© `id = 1` Ä‘Ã£ chuyá»ƒn `HUY` vÃ¬ dÃ¹ng rule cÅ©
- khÃ´ng cÃ²n dÃ²ng lá»—i parse thÃ¡ng
- cÃ³ `3` dÃ²ng Ä‘Ã³ng láº» tiá»n
- cÃ³ `31` dÃ²ng náº±m ngoÃ i nÄƒm gá»‘c 2026, Ä‘Ã£ quy Ä‘á»•i Ä‘Æ°á»£c thÃ¡ng/nÄƒm hiá»ƒn thá»‹

### Tráº¡ng thÃ¡i

- [x] HoÃ n thÃ nh

---

## Task J. Trang public cÆ° dÃ¢n tra cá»©u phÃ­

### Má»¥c tiÃªu

CÆ° dÃ¢n khÃ´ng cáº§n login cÃ³ thá»ƒ tra cá»©u tiáº¿n trÃ¬nh Ä‘Ã³ng phÃ­ cÄƒn há»™.

### File/báº£ng liÃªn quan

- báº£ng `trang_thai_phi_can_ho_public`
- báº£ng `batch_trang_thai_phi_public`
- public route/page sáº½ táº¡o

### Viá»‡c cáº§n lÃ m

- form nháº­p mÃ£ cÄƒn
- normalize mÃ£ cÄƒn
- chá»‰ Ä‘á»c batch public hiá»‡n hÃ nh
- hiá»ƒn thá»‹:
  - mÃ£ cÄƒn
  - thÃ¡ng Ä‘Ã£ Ä‘Ã³ng Ä‘áº¿n hiá»‡n táº¡i
  - ká»³ dá»¯ liá»‡u
  - thá»i Ä‘iá»ƒm cáº­p nháº­t
  - ghi chÃº public náº¿u cÃ³
- khÃ´ng hiá»ƒn thá»‹ dá»¯ liá»‡u cÃ¡ nhÃ¢n

### Review

- kiá»ƒm tra UI trÃªn desktop/mobile
- kiá»ƒm tra ná»™i dung khÃ´ng lá»™ phone/CCCD/ghi chÃº ná»™i bá»™

### Check/Test

Test thá»§ cÃ´ng:

- nháº­p mÃ£ cÄƒn há»£p lá»‡ cÃ³ dá»¯ liá»‡u
- nháº­p mÃ£ cÄƒn há»£p lá»‡ chÆ°a cÃ³ dá»¯ liá»‡u
- nháº­p mÃ£ cÄƒn sai format
- nháº­p mÃ£ cÄƒn thÆ°á»ng/hoa/khoáº£ng tráº¯ng
- khÃ´ng cÃ³ batch public hiá»‡n hÃ nh

Test ká»¹ thuáº­t:

```bash
npm test
npm run build
```

### Confirm Ä‘á»ƒ qua bÆ°á»›c

- [x] Public page hoáº¡t Ä‘á»™ng khÃ´ng login
- [x] Chá»‰ Ä‘á»c batch Ä‘Ã£ public
- [x] KhÃ´ng lá»™ dá»¯ liá»‡u nháº¡y cáº£m
- [x] Build pass

Káº¿t quáº£ thá»±c táº¿:

- route public: `/tra-cuu-phi`
- route trang chá»§ cÆ° dÃ¢n: `/`
- trang chá»§ `/` lÃ  mÃ n hÃ¬nh Ä‘áº§u tiÃªn khi cháº¡y project, Æ°u tiÃªn mobile-first/search-bar landing page
- trang chá»§ Ä‘Ã£ tá»‘i giáº£n: brand, link quáº£n trá»‹ nhá», tiÃªu Ä‘á», Ã´ nháº­p mÃ£ cÄƒn vÃ  nÃºt tra cá»©u
- áº£nh ná»n desktop local Ä‘ang dÃ¹ng: `public/images/resident-home-desktop.webp`
- áº£nh ná»n mobile local Ä‘ang dÃ¹ng: `public/images/resident-home-mobile.webp`
- logo header local Ä‘ang dÃ¹ng: `public/images/logo-hoanghuy.webp`
- background tá»± chá»n áº£nh 16:9 trÃªn desktop vÃ  9:16 trÃªn mobile
- prompt thiáº¿t káº¿ mobile-first trÃªn Stitch: `docs/stitch-mobile-ui-prompt.md`
- vÃ­ dá»¥ kiá»ƒm tra: `/tra-cuu-phi?ma_can=L4A.311A`
- `L4A.311A` hiá»ƒn thá»‹ `Ä‘Ã£ Ä‘Ã³ng háº¿t thÃ¡ng 2 nÄƒm 2027`
- `L2.207` hiá»ƒn thá»‹ tráº¡ng thÃ¡i Ä‘Ã³ng láº» tiá»n
- khÃ´ng hiá»ƒn thá»‹ phone/contact/ghi chÃº ná»™i bá»™
- search box dÃ¹ng parser mÃ£ cÄƒn hiá»‡n cÃ³ Ä‘á»ƒ nháº­n nhiá»u kiá»ƒu input:
  - `L1.115`
  - `L1 115`
  - `L1115`
  - `can 311A toa L4A`
  - `can 124 lo 4b`
  - `lo 4b can 124`
  - `124lo4b`
  - `LK2-24`
- giá»›i háº¡n input public tá»‘i Ä‘a `80` kÃ½ tá»±
- whitelist kÃ½ tá»± cho input tra cá»©u, cháº·n chuá»—i cÃ³ kÃ½ tá»± nguy hiá»ƒm nhÆ° `'`, `=`, `<`, `>`
- query DB qua Prisma vá»›i candidate list, khÃ´ng ná»‘i SQL thá»§ cÃ´ng
- cÃ³ rate-limit nháº¹ theo IP: tá»‘i Ä‘a `40` lÆ°á»£t/phÃºt
- `npm test`: `95` tests pass
- `npm run build`: pass
- tÃ i liá»‡u quáº£n trá»‹ parser: `docs/parser-ma-can-ho.md`
- dá»¯ liá»‡u parser hiá»‡n cÃ³ Ä‘Ã£ Ä‘Æ°á»£c gá»™p vÃ o tÃ i liá»‡u trung tÃ¢m:
  - nguá»“n code/test hiá»‡n táº¡i
  - 100 case backlog
  - 6 case tháº­t parser tá»«ng bá» sÃ³t tá»« bÃ¡o cÃ¡o giao dá»‹ch 1.500.000 thÃ¡ng 5/2026
  - quy trÃ¬nh version hÃ³a, golden test, chá»‘ng false-positive
- kiá»ƒm tra giao diá»‡n/ká»¹ thuáº­t sau khi Ä‘á»•i trang chá»§:
  - `npm test`: `82` tests pass
  - `npm run build`: pass
  - `/` tráº£ `200`
  - `/tra-cuu-phi?ma_can=L1.115` tráº£ `200`
  - `/admin/login` tráº£ `200`

### Tráº¡ng thÃ¡i

- [x] HoÃ n thÃ nh pháº§n ná»n public lookup
- [x] HoÃ n thÃ nh chuyá»ƒn trang chá»§ sang public resident mobile-first

---

## Task K. Dashboard quáº£n lÃ½

### Má»¥c tiÃªu

Manager xem Ä‘Æ°á»£c dá»¯ liá»‡u cÄƒn há»™/contact/phÃ­ trong vÃ¹ng ná»™i bá»™.

### Viá»‡c cáº§n lÃ m

- [x] tÃ¬m cÄƒn theo mÃ£
- [x] xem thÃ´ng tin cÄƒn
- [x] xem contact Ä‘Ã£ duyá»‡t
- [x] xem contact candidate chÆ°a duyá»‡t
- [x] xem ghi chÃº gá»‘c Excel khi dá»¯ liá»‡u chÆ°a sáº¡ch
- [x] xem tráº¡ng thÃ¡i phÃ­ public hiá»‡n táº¡i
- [x] xem lá»‹ch sá»­ import/chá»‘t batch

### Review

- [x] xÃ¡c nháº­n dashboard náº±m trong vÃ¹ng `/admin`, báº¯t buá»™c login
- [x] xÃ¡c nháº­n manager khÃ´ng Ä‘Æ°á»£c cáº¥p chá»©c nÄƒng import/chá»‘t batch
- [x] xÃ¡c nháº­n dá»¯ liá»‡u contact chá»‰ hiá»ƒn thá»‹ trong vÃ¹ng admin, khÃ´ng public

### Check/Test

- route dashboard: `/admin/dashboard`
- chÆ°a login vÃ o `/admin/dashboard?ma_can=L1.115` tráº£ redirect `307` vá» login
- `/admin/login` tráº£ `200`
- `/tra-cuu-phi?ma_can=L1.115` váº«n tráº£ `200`
- `npm test`: `82` tests pass
- `npm run build`: pass

### Confirm Ä‘á»ƒ qua bÆ°á»›c

- [x] Dashboard quáº£n lÃ½ hoáº¡t Ä‘á»™ng
- [x] TÃ¬m cÄƒn Ä‘Ãºng qua parser/search
- [x] Xem Ä‘Æ°á»£c contact/ghi chÃº gá»‘c khi cáº§n
- [x] Quyá»n manager bá»‹ giá»›i háº¡n Ä‘Ãºng á»Ÿ má»©c ná»n: xem dashboard, khÃ´ng vÃ o route import/accounts Super Admin

### Tráº¡ng thÃ¡i

- [x] HoÃ n thÃ nh pháº§n ná»n dashboard quáº£n lÃ½

---

## Task L. MÃ n hÃ¬nh review contact ná»™i bá»™

### Má»¥c tiÃªu

Duyá»‡t contact candidate trÆ°á»›c khi chuyá»ƒn sang `lien_he_can_ho`.

### Viá»‡c cáº§n lÃ m

- [x] danh sÃ¡ch candidate
- [x] filter theo cÄƒn/tráº¡ng thÃ¡i/cháº¥t lÆ°á»£ng dá»¯ liá»‡u
- [x] xem Ã´ gá»‘c Excel
- [x] sá»­a tÃªn/sá»‘ Ä‘iá»‡n thoáº¡i
- [x] chá»n vai trÃ²
- [x] chá»n liÃªn há»‡ chÃ­nh
- [x] chá»n nháº­n thÃ´ng bÃ¡o
- [x] duyá»‡t/tá»« chá»‘i
- [x] ghi log ngÆ°á»i duyá»‡t/thá»i Ä‘iá»ƒm duyá»‡t vÃ o `payload_duyet_json`

### Review

- [x] route `/admin/contacts/review` náº±m trong vÃ¹ng admin, cáº§n login
- [x] dá»¯ liá»‡u gá»‘c Excel váº«n giá»¯ trong `ung_vien_lien_he_can_ho`
- [x] duyá»‡t khÃ´ng xÃ³a candidate staging
- [x] tá»« chá»‘i chá»‰ Ä‘á»•i tráº¡ng thÃ¡i candidate, khÃ´ng xÃ³a raw payload

### Check/Test

- route `/admin/contacts/review` khi chÆ°a login tráº£ redirect `307`
- `/admin/login` tráº£ `200`
- `/tra-cuu-phi?ma_can=L1.115` váº«n tráº£ `200`
- smoke test DB dev:
  - candidate `1` Ä‘Æ°á»£c chuyá»ƒn `DA_DUYET`
  - táº¡o Ä‘Æ°á»£c contact master tá»« candidate `1`
  - candidate `2` Ä‘Æ°á»£c chuyá»ƒn `TU_CHOI`
- `npm test`: `82` tests pass
- `npm run build`: pass

### Confirm Ä‘á»ƒ qua bÆ°á»›c

- [x] Duyá»‡t contact táº¡o Ä‘Æ°á»£c master contact
- [x] Tá»« chá»‘i khÃ´ng táº¡o master contact
- [x] CÃ³ log duyá»‡t
- [x] Raw payload váº«n cÃ²n

### Tráº¡ng thÃ¡i

- [x] HoÃ n thÃ nh pháº§n ná»n review contact ná»™i bá»™

---

## Task M. Import sao kÃª vÃ  Ä‘á»‘i soÃ¡t DB

### Má»¥c tiÃªu

ÄÆ°a pipeline sao kÃª tá»« memory/app cÅ© vÃ o DB.

### File liÃªn quan

- `docs/lich-su-giao-dich(15-04-2026 09_33_29).xls`
- `docs/filter-rules.vi.md`
- báº£ng `dong_sao_ke_tho`
- báº£ng `giao_dich_ngan_hang`
- báº£ng `ket_qua_parse_giao_dich`
- báº£ng `ung_vien_khop_giao_dich`
- báº£ng `duyet_giao_dich`
- báº£ng `phan_bo_giao_dich`

### Viá»‡c cáº§n lÃ m

- [x] import raw sao kÃª
- [x] táº¡o fingerprint chá»‘ng trÃ¹ng
- [x] chuáº©n hÃ³a giao dá»‹ch
- [x] parse mÃ£ cÄƒn
- [x] lÆ°u candidate
- [x] táº¡o review row máº·c Ä‘á»‹nh
- [x] táº¡o allocation má»™t-cÄƒn cho giao dá»‹ch khá»›p rÃµ

### Review

- [x] kiá»ƒm tra parser Ä‘ang lÆ°u `phien_ban_parser`
- [x] kiá»ƒm tra tráº¡ng thÃ¡i parse Ä‘Æ°á»£c lÆ°u vÃ o `ket_qua_parse_giao_dich`
- [x] kiá»ƒm tra candidate Ä‘Æ°á»£c lÆ°u vÃ o `ung_vien_khop_giao_dich`
- [x] kiá»ƒm tra review/allocation Ä‘Æ°á»£c sinh vÃ o DB
- [ ] kiá»ƒm tra sÃ¢u 6 case parser bá» sÃ³t trong bÃ¡o cÃ¡o giao dá»‹ch 1.500.000 thÃ¡ng 5/2026 á»Ÿ vÃ²ng cáº£i tiáº¿n parser tiáº¿p theo:
  - `L3p509`
  - `L4B426...` dÃ­nh sá»‘ Ä‘iá»‡n thoáº¡i
  - `L3 phong 305`
  - `L4C phong515`
  - `107 lo 2`
  - `L4B p321`
- kiá»ƒm tra case ná»™i bá»™/khÃ´ng liÃªn quan
- kiá»ƒm tra case multi-allocation

### Check/Test

```bash
npm test
```

Query kiá»ƒm tra:

```sql
select count(*) from dong_sao_ke_tho;
select count(*) from giao_dich_ngan_hang;
select trang_thai_khop, count(*) from ket_qua_parse_giao_dich group by trang_thai_khop;
```

Káº¿t quáº£ thá»±c táº¿:

- script: `npm run import:bank-statement:v2`
- file: `docs/lich-su-giao-dich(15-04-2026 09_33_29).xls`
- batch import má»›i nháº¥t: `lo_nhap_du_lieu.id = 7`
- `dong_sao_ke_tho`: `125`
- `giao_dich_ngan_hang`: `125`
- `ket_qua_parse_giao_dich`: `125`
- `duyet_giao_dich`: `125`
- `phan_bo_giao_dich`: `101`
- tráº¡ng thÃ¡i parse:
  - `KHOP_TRUC_TIEP`: `42`
  - `KHOP_SAU_CHUAN_HOA`: `59`
  - `NHIEU_CAN`: `4`
  - `CHUA_NHAN_DIEN_DUOC_CAN`: `2`
  - `KHONG_LIEN_QUAN_CAN_HO`: `18`
- `npm test`: `82` tests pass
- `npm run build`: pass

### Confirm Ä‘á»ƒ qua bÆ°á»›c

- [x] Sao kÃª import khÃ´ng trÃ¹ng theo fingerprint/tham chiáº¿u ngÃ¢n hÃ ng
- [x] Transaction Ä‘Æ°á»£c chuáº©n hÃ³a
- [x] Parse result Ä‘Æ°á»£c lÆ°u
- [x] Candidate Ä‘Æ°á»£c lÆ°u
- [x] Review/allocation Ä‘Æ°á»£c lÆ°u

### Tráº¡ng thÃ¡i

- [x] HoÃ n thÃ nh pháº§n ná»n import sao kÃª vÃ  Ä‘á»‘i soÃ¡t DB

---

## Task N. HoÃ n thiá»‡n project Ä‘á»ƒ khá»Ÿi cháº¡y á»•n Ä‘á»‹nh

### Má»¥c tiÃªu

HoÃ n thiá»‡n project á»Ÿ má»©c cÃ³ thá»ƒ khá»Ÿi cháº¡y á»•n Ä‘á»‹nh trÃªn local/staging trÆ°á»›c khi deploy tháº­t.

### Viá»‡c cáº§n lÃ m

- kiá»ƒm tra trang chá»§ cÆ° dÃ¢n mobile-first/search-bar landing page
- Ã¡p dá»¥ng design system tá»« [design-system.md](design-system.md)
- kiá»ƒm tra public lookup khÃ´ng login
- kiá»ƒm tra login admin báº±ng username vÃ  sá»‘ Ä‘iá»‡n thoáº¡i
- kiá»ƒm tra dashboard quáº£n lÃ½
- kiá»ƒm tra review contact
- kiá»ƒm tra import sao kÃª/Ä‘á»‘i soÃ¡t DB
- kiá»ƒm tra export Excel váº­n hÃ nh
- chuáº©n hÃ³a runbook khá»Ÿi cháº¡y project
- Ä‘áº£m báº£o test/build pass

### Review

- review route public/admin trÃªn mÃ¡y dev
- review tÃ i khoáº£n `admin`, SÄT `0904802553`, role `SUPER_ADMIN`
- review dá»¯ liá»‡u public khÃ´ng lá»™ SÄT/tÃªn cÆ° dÃ¢n/ghi chÃº ná»™i bá»™
- review file export Excel chá»‰ dÃ¹ng ná»™i bá»™

### Check/Test

- build production pass
- public page hoáº¡t Ä‘á»™ng
- admin login hoáº¡t Ä‘á»™ng
- export Excel cháº¡y thá»­ vÃ  Ä‘á»c Ä‘Æ°á»£c trÃªn mÃ¡y local
- route admin nháº¡y cáº£m redirect khi chÆ°a login
- `npm test` pass

### Confirm Ä‘á»ƒ qua bÆ°á»›c

- [x] Public page hoáº¡t Ä‘á»™ng trÃªn dev
- [x] Design system Stitch Ä‘Ã£ chuyá»ƒn thÃ nh pattern ná»™i bá»™, khÃ´ng copy HTML prototype
- [x] Trang chá»§ Ä‘Ã£ tá»‘i giáº£n theo hÆ°á»›ng search-bar landing page
- [x] áº¢nh ná»n chung cÆ° xanh Ä‘Ã£ lÆ°u local vÃ  Ã¡p dá»¥ng cho public pages
- [x] Admin login cÃ³ ná»n sá»‘ Ä‘iá»‡n thoáº¡i
- [x] SÄT `0904802553` Ä‘Ã£ gáº¯n vá»›i `admin` role `SUPER_ADMIN`
- [x] Export Excel hoáº¡t Ä‘á»™ng nhÆ° báº£n lÆ°u váº­n hÃ nh trÃªn mÃ¡y dev
- [x] `npm test` pass
- [x] `npm run build` pass
- [ ] Chá»§ dá»± Ã¡n duyá»‡t giao diá»‡n mobile thá»±c táº¿
- [ ] Chá»§ dá»± Ã¡n duyá»‡t dá»¯ liá»‡u public khÃ´ng lá»™ thÃ´ng tin nháº¡y cáº£m

### Tráº¡ng thÃ¡i

- [ ] Äang lÃ m

---

## Task O. Deploy public web lÃªn VPS

### Má»¥c tiÃªu

ÄÆ°a web lÃªn mÃ´i trÆ°á»ng public an toÃ n. ÄÃ¢y lÃ  bÆ°á»›c cuá»‘i cá»§a roadmap version hiá»‡n táº¡i, chá»‰ lÃ m sau khi Task N Ä‘áº¡t.

Quyáº¿t Ä‘á»‹nh production chi tiáº¿t: [production-deploy-vps.md](production-deploy-vps.md).

### Viá»‡c cáº§n lÃ m

- chá»§ dá»± Ã¡n duyá»‡t [checklist-duyet-truoc-deploy.md](checklist-duyet-truoc-deploy.md)
- deploy trÃªn VPS
- cÃ i PostgreSQL trÃªn cÃ¹ng VPS
- cáº¥u hÃ¬nh domain `noxhandong.com` sau khi mua vÃ  trá» DNS
- cáº¥u hÃ¬nh HTTPS
- cáº¥u hÃ¬nh env production
- cáº¥u hÃ¬nh backup DB báº±ng VPS snapshot vÃ  `pg_dump`
- táº¡o admin production
- kiá»ƒm tra public page khÃ´ng lá»™ dá»¯ liá»‡u nháº¡y cáº£m

### Review

- review biáº¿n mÃ´i trÆ°á»ng production
- review quyá»n DB
- review route public/admin
- review Super Admin production vÃ  danh sÃ¡ch ngÆ°á»i giá»¯ quyá»n

### Check/Test

- build production pass
- public page hoáº¡t Ä‘á»™ng
- admin login hoáº¡t Ä‘á»™ng
- backup DB cháº¡y thá»­
- restore thá»­ má»™t báº£n `pg_dump`
- export Excel cháº¡y thá»­ vÃ  Ä‘á»c Ä‘Æ°á»£c trÃªn mÃ¡y local

### Confirm Ä‘á»ƒ qua bÆ°á»›c

- [ ] Domain/HTTPS hoáº¡t Ä‘á»™ng
- [ ] Public page hoáº¡t Ä‘á»™ng
- [ ] Admin login hoáº¡t Ä‘á»™ng
- [ ] Backup DB cÃ³ quy trÃ¬nh rÃµ vÃ  cÃ³ `pg_dump`
- [ ] Super Admin production Ä‘Ã£ Ä‘Æ°á»£c bÃ n giao Ä‘Ãºng ngÆ°á»i, khÃ´ng dÃ¹ng máº­t kháº©u dev
- [ ] KhÃ´ng lá»™ dá»¯ liá»‡u nháº¡y cáº£m

### Tráº¡ng thÃ¡i

- [ ] ChÆ°a lÃ m

---

# Thá»© tá»± triá»ƒn khai báº¯t buá»™c

1. Task C: Migrate/reset DB dev sang V2
2. Task D: Import master cÄƒn há»™
3. Task E: Sinh staging contact tá»« file master
4. Task F: Seed dá»¯ liá»‡u ná»n vÃ  tÃ i khoáº£n Super Admin
5. Task G: Auth vÃ  phÃ¢n quyá»n quáº£n trá»‹
6. Task H: Import file theo dÃµi thu phÃ­
7. Task I: Chá»‘t batch tráº¡ng thÃ¡i phÃ­ public
8. Task J: Trang public cÆ° dÃ¢n tra cá»©u phÃ­
9. Task K: Dashboard quáº£n lÃ½
10. Task L: MÃ n hÃ¬nh review contact ná»™i bá»™
11. Task M: Import sao kÃª vÃ  Ä‘á»‘i soÃ¡t DB
12. Task N: HoÃ n thiá»‡n project Ä‘á»ƒ khá»Ÿi cháº¡y á»•n Ä‘á»‹nh
13. Task O: Deploy public web lÃªn VPS

Task A-M Ä‘Ã£ hoÃ n thÃ nh theo checklist hiá»‡n táº¡i. Hiá»‡n táº¡i Ä‘ang á»Ÿ Task N. Task O lÃ  bÆ°á»›c cuá»‘i vÃ  chÆ°a lÃ m.

# Quy trÃ¬nh sau má»—i task

Sau má»—i task pháº£i lÃ m 4 viá»‡c:

1. Cháº¡y check/test tÆ°Æ¡ng á»©ng trong task.
2. Ghi káº¿t quáº£ vÃ o task Ä‘Ã³.
3. Cáº­p nháº­t `docs/roadmap.md`.
4. Náº¿u lÃ  má»‘c lá»›n, cáº­p nháº­t `docs/handoff.md`.

Náº¿u task tháº¥t báº¡i:

- khÃ´ng sang task tiáº¿p theo
- ghi rÃµ lá»—i
- ghi rÃµ dá»¯ liá»‡u/file bá»‹ áº£nh hÆ°á»Ÿng
- sá»­a hoáº·c rollback trÆ°á»›c khi tiáº¿p tá»¥c
## Cáº­p nháº­t nhanh 2026-05-20

- [x] Trang login quáº£n trá»‹ cÃ³ nÃºt quay vá» trang chá»§.
- [x] CÃ¡c trang quáº£n trá»‹ chÃ­nh Ä‘Ã£ dá»‹ch nhÃ£n hiá»ƒn thá»‹ sang tiáº¿ng Viá»‡t.
- [x] UI dÃ¹ng label tiáº¿ng Viá»‡t cho quyá»n, tráº¡ng thÃ¡i tÃ i khoáº£n, tráº¡ng thÃ¡i import, tráº¡ng thÃ¡i batch phÃ­, vai trÃ² liÃªn há»‡.
- [x] Import file `docs/Theo dÃµi thu phÃ­ T5.xlsx`.
- [x] Táº¡o batch phÃ­ `T5-2026`.
- [x] Public batch phÃ­ `T5-2026` lÃ m dá»¯ liá»‡u hiá»‡n hÃ nh cho cÆ° dÃ¢n tra cá»©u.
- [x] Táº¡o report parser sao kÃª cÃ³ cá»™t `CÄƒn parser` cáº¡nh cá»™t ná»™i dung giao dá»‹ch.
- [x] Import sao kÃª má»›i ngÃ y 2026-05-20 vÃ o DB batch `9`.
- [x] Trang `/admin/import` cÃ³ form upload file thu phÃ­ Excel.
- [ ] Chá»§ dá»± Ã¡n test upload file thu phÃ­ báº±ng nÃºt `Chá»‰ nháº­p staging`.
- [ ] Chá»§ dá»± Ã¡n chá»‰ dÃ¹ng nÃºt `Nháº­p vÃ  chá»‘t cÃ´ng khai` sau khi Ä‘Ã£ xÃ¡c nháº­n file Ä‘Ãºng.
- [ ] Chá»§ dá»± Ã¡n má»Ÿ file `docs/reports/lich-su-giao-dich-20-05-2026-08_51_50--parser-doi-chieu.xlsx` vÃ  kiá»ƒm tra sheet `Can kiem tra`.
- [ ] Chá»§ dá»± Ã¡n kiá»ƒm tra thá»§ cÃ´ng giao diá»‡n `/admin`, `/admin/login`, `/admin/dashboard`, `/admin/import`, `/admin/contacts/review` trÃªn desktop/mobile.
- [x] Admin mobile Ä‘Ã£ dÃ¹ng topbar + Sheet thay sidebar dÃ i; kiá»ƒm tra 390px/430px khÃ´ng overflow ngang toÃ n trang.
- [x] Trang `/admin` mobile dÃ¹ng list compact; desktop váº«n giá»¯ card grid.
- [x] Báº£ng dÃ i admin cÃ³ vÃ¹ng cuá»™n riÃªng, khÃ´ng Ã©p háº¿t cá»™t trÃªn mobile.



