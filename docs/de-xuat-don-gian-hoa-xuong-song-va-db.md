# De xuat don gian hoa file xuong song va database

Ngay lap: 2026-06-02

Trang thai: da duoc chu du an duyet va thuc thi tren DB dev ngay 2026-06-06.

Ket qua hien hanh xem tai [database.md](database.md). Cac row count va de xuat cu ben duoi chi con gia tri lich su tai thoi diem lap file.

## 1. Nguyen tac

- Moi file xuong song chi lam mot viec.
- `README.md` o root chi la menu dau vao, khong lap chi tiet trong docs.
- `docs/README.md` chi la muc luc tai lieu, khong thay the roadmap/checklist/database.
- Schema hien hanh duy nhat la `prisma/schema.prisma`.
- Tai lieu DB hien hanh duy nhat la `docs/database.md`.
- Cac file report/backlog/todolist khong duoc coi la nguon su that chinh neu mau thuan voi roadmap/database/schema.

## 2. File xuong song de xuat

| File | Vai tro duy nhat | Khong duoc ghi lap |
| --- | --- | --- |
| `README.md` | Menu dau vao cua toan project | Khong mo ta chi tiet module, DB, deploy |
| `docs/README.md` | Muc luc tai lieu | Khong ghi trang thai task chi tiet |
| `docs/nghiep-vu-he-thong.md` | Mo ta nghiep vu de ban giao nguoi moi | Khong lam checklist, khong lam schema |
| `docs/roadmap.md` | Dieu phoi muc tieu/task cap cao | Khong ghi test case chi tiet |
| `docs/phase-2-roadmap.md` | Roadmap rieng Phase 2 | Khong thay `roadmap.md`; chi mo rong phase 2 |
| `docs/checklist-trien-khai-va-nghiem-thu.md` | Dieu kien nghiem thu/check/test/confirm | Khong quyet dinh kien truc |
| `docs/handoff.md` | Trang thai ban giao moi nhat | Khong lam roadmap dai han |
| `docs/database.md` | Thiet ke database hien hanh | Khong ghi tien trinh task |
| `prisma/schema.prisma` | Schema Prisma chay that | Khong co file schema khac trong `prisma/` |
| `docs/parser-ma-can-ho.md` | Rule/parser ma can ho | Khong ghi rule contact/parser khac qua sau |
| `docs/module-map.md` | Ban do module/source code | Khong lap roadmap san pham |
| `docs/design-system.md` | Quy uoc UI/UX | Khong ghi nghiep vu DB |
| `docs/production-deploy-vps.md` | Quyet dinh production | Khong ghi lenh tung buoc |
| `docs/deploy-vps-step-by-step.md` | Runbook deploy/van hanh VPS | Khong quyet dinh san pham |
| `docs/vps-phase-2-todolist.md` | Viec can lam rieng tren VPS phase 2 | Khong thay checklist tong |

## 3. File khong nen la xuong song

Nhom nay van co gia tri, nhung chi la tham khao/bao cao/backlog:

- `docs/reports/*`
- `docs/backlog-doi-soat-sao-ke.md`
- `docs/todolist-dong-thuan-antigravity-codex.md`
- `docs/tham-khao-he-thong-tuong-tu.md`
- `docs/stitch-mobile-ui-prompt.md`
- `docs/setup-may-moi-va-database.md`
- `docs/archive/*`

Neu cac file nay mau thuan voi file xuong song, uu tien theo thu tu:

1. `prisma/schema.prisma`
2. `docs/database.md`
3. `docs/nghiep-vu-he-thong.md`
4. `docs/roadmap.md`
5. `docs/checklist-trien-khai-va-nghiem-thu.md`
6. `docs/handoff.md`

## 4. DB hien tai sau khi doc du lieu

Tong quan row count:

| Bang | So dong | Nhan xet |
| --- | ---: | --- |
| `can_ho` | 934 | Nen giu |
| `lien_he_can_ho` | 1 | Chua duyet contact master, tam giu |
| `quy_tac_phi` | 2 | Nen giu |
| `lo_nhap_du_lieu` | 7 | Co batch test/trung can don |
| `dong_du_lieu_quan_ly_tho` | 934 | Raw master can ho, nen giu tam |
| `ung_vien_lien_he_can_ho` | 1977 | Staging lien he, can giu den khi duyet contact xong |
| `dong_sao_ke_tho` | 436 | Raw theo lan import, co duplicate upload |
| `giao_dich_ngan_hang` | 372 | Dang lan ca sao ke T5 cu va T6 moi |
| `ket_qua_parse_giao_dich` | 372 | Phu thuoc `giao_dich_ngan_hang` |
| `ung_vien_khop_giao_dich` | 351 | Phu thuoc parser giao dich |
| `duyet_giao_dich` | 372 | Phu thuoc `giao_dich_ngan_hang` |
| `phan_bo_giao_dich` | 323 | Phu thuoc `giao_dich_ngan_hang` |
| `ngoai_le_giao_dich` | 0 | Bang du phong, chua dung |
| `chung_tu_doi_soat` | 0 | Bang du phong, se dung cho bang chung Zalo/sao ke |
| `so_chot_thang` | 4 | Co cac moc chot test/trung |
| `so_chot_can_ho` | 3736 | 4 moc x 934 can |
| `lich_su_dong_phi_can_ho` | 5 | La du lieu test T6 tu duyet thu |
| `tai_khoan_quan_tri` | 3 | Nen giu |
| `nhat_ky_dang_nhap_quan_tri` | 84 | Co the giu |
| `dong_theo_doi_thu_phi_tho` | 1868 | 2 lan import Excel T5 x 934 |
| `batch_trang_thai_phi_public` | 5 | Co batch public/draft test |
| `trang_thai_phi_can_ho_public` | 4670 | 5 batch x 934 |
| `thong_bao_cong_khai` | 1 | Nen giu |

## 5. Bat thuong DB can chu du an duyet

### 5.1 Batch public hien hanh dang la T6 test

Hien tai:

- public current: `batch_trang_thai_phi_public.id = 18`
- ky: `T6-2026`
- co `934` can
- co `5` dong `lich_su_dong_phi_can_ho`
- lien ket `so_chot_thang.id = 4`
- `so_chot_thang.id = 4` co `chotDenThoiDiem = null`

Nhan xet:

- Neu day chi la test duyet thu, khong nen de lam current public.
- Theo nghiep vu anh vua chot, Excel T5 final moi la du lieu chuan den `31/05/2026 23:59`.
- De sach DB, nen revert public current ve batch T5 final `id = 17`, xoa batch T6 test `id = 18`, draft `id = 19`, `so_chot_thang.id = 4`, va 5 lich su phi test.

### 5.2 Co 3 moc chot T5

Hien co:

- `so_chot_thang.id = 1`: T5, cutoff 28/05 11:00, test cu
- `so_chot_thang.id = 2`: T5, cutoff 28/05 11:00, test cu
- `so_chot_thang.id = 3`: T5, cutoff 31/05 23:59, dung theo yeu cau moi nhat

De xuat:

- Giu `so_chot_thang.id = 3`.
- Xoa `so_chot_thang.id = 1`, `id = 2` va public batch lien quan `id = 15`, `id = 16`.

### 5.3 Co batch sao ke raw-only trung file

Hien co:

- `lo_nhap_du_lieu.id = 45`: sao ke 02/06, 21 raw, 0 giao dich canonical
- `lo_nhap_du_lieu.id = 47`: sao ke 02/06, 21 raw, 0 giao dich canonical
- `lo_nhap_du_lieu.id = 46`: sao ke 02/06, 21 raw, 16 giao dich canonical sau cutoff

De xuat:

- Xoa batch raw-only `45` va `47` neu khong can audit lan upload test.
- Giu batch `46` vi dang chua 16 giao dich sau cutoff.

### 5.4 Sao ke T5 cu dang nam trong bang operational

`lo_nhap_du_lieu.id = 43`:

- file `lich-su-giao-dich 1.5-29.5.xls`
- 373 raw
- 356 giao dich canonical

Nhan xet:

- Theo nghiep vu moi, T1-T5 la du lieu qua khu da chot bang Excel, khong nen nam trong bang operational can duyet.
- Nen chuyen sao ke T1-T5 vao bang raw canonical rieng de hoc parser/doi soat lich su.

De xuat schema Phase 2:

- Them bang `giao_dich_sao_ke_tho_chuan`.
- Import toan bo sao ke T1-T5 vao bang nay, unique theo `tham_chieu_ngan_hang`, fallback `van_tay_giao_dich`.
- Sau khi da import vao raw canonical, xoa cac giao dich T1-T5 khoi `giao_dich_ngan_hang`, `duyet_giao_dich`, `ket_qua_parse_giao_dich`, `phan_bo_giao_dich` neu chung chi phuc vu test.

### 5.5 Bang rong nhung khong nen xoa ngay

- `ngoai_le_giao_dich`: chua dung, nhung co the dung cho case an dien/chuyen nham/khong ro can.
- `chung_tu_doi_soat`: chua dung, nhung se dung cho anh Zalo/anh sao ke cu dan.

De xuat:

- Khong xoa 2 bang nay.
- Neu muon gon schema, chi doi ten/bo sung enum sau, khong xoa.

## 6. Logic nghiep vu sau khi don DB

### 6.1 Moc qua khu chuan

- Excel T5 final la du lieu chuan vinh vien den `31/05/2026 23:59`.
- Du lieu nay nam o:
  - `so_chot_thang`
  - `so_chot_can_ho`
  - `batch_trang_thai_phi_public`
  - `trang_thai_phi_can_ho_public`

### 6.2 Sao ke qua khu T1-T5

- Chi luu vao bang raw canonical.
- Khong hien trong man duyet van hanh.
- Dung de:
  - hoc parser
  - doi soat tranh chap
  - tra cuu bang chung lich su

### 6.3 Sao ke tu T6 tro di

- Import sao ke.
- Dong nao trung `tham_chieu_ngan_hang` thi bo qua/update so lan gap.
- Dong nao truoc/den cutoff T5 thi chi luu raw, khong dua vao duyet.
- Dong nao sau cutoff thi tao:
  - `giao_dich_ngan_hang`
  - `ket_qua_parse_giao_dich`
  - `ung_vien_khop_giao_dich`
  - `duyet_giao_dich`
  - `phan_bo_giao_dich` neu parser du tin cay

### 6.4 Duyet giao dich

- Admin duyet giao dich moi.
- Case ro can: duyet nhanh.
- Case Zalo/thieu noi dung: nhap ma can + luu bang chung vao `chung_tu_doi_soat`.
- Sau khi duyet, sinh `lich_su_dong_phi_can_ho`.
- Cuoi ky, tu lich su da duyet tao batch public moi.

## 7. De xuat thao tac don DB cho lan tiep theo

Cho duyet tung muc:

1. Revert public current ve T5 final batch `17`.
2. Xoa T6 test batch `18`, draft `19`, so chot `4`, va 5 lich su phi test.
3. Xoa T5 old closing `1`, `2` va public batch `15`, `16`.
4. Xoa batch sao ke raw-only `45`, `47`.
5. Tao bang `giao_dich_sao_ke_tho_chuan`.
6. Import lai sao ke T1-T5 vao bang raw canonical.
7. Xoa sao ke T5 cu batch `43` khoi operational sau khi da co raw canonical.
8. Giu contact staging cho den khi duyet contact xong.

## 8. Phan tich cau truc bang sao ke: co thua khong?

Nhan dinh ngan gon: so luong hon 10 bang lien quan sao ke khong sai neu he thong can audit day du, nhung dang qua nang so voi MVP hien tai. Van de chinh khong nam o du lieu rac, ma nam o viec dang tach qua nhieu lop ky thuat:

- raw import
- canonical transaction
- parse result
- candidate suggestion
- review state
- allocation
- evidence
- fee history
- monthly closing
- public snapshot

Neu van hanh that, cac lop nay co ly do. Neu uu tien he thong gon, de bao tri, co the gop mot so lop vao bang chinh.

### 8.1 Tung bang dang xu ly viec gi

| Bang | Loai bang | Du lieu xu ly | Co can cho MVP khong | Nhan xet |
| --- | --- | --- | --- | --- |
| `lo_nhap_du_lieu` | Audit/import batch | Ten file, hash file, loai nguon, so dong, metadata import | Co | Nen giu. Day la phieu nhap de truy vet file nao sinh ra du lieu nao. |
| `dong_sao_ke_tho` | Raw theo lan upload | Tung dong Excel/PDF sao ke theo batch upload | Tuy chon | Huu ich de audit, nhung neu them bang raw canonical thi co the giam vai tro bang nay. |
| `giao_dich_ngan_hang` | Giao dich operational | Giao dich thu can xu ly: ngay, tien, noi dung, nguoi chuyen, ref, fingerprint | Co | Nen la bang trung tam cua luong sao ke sau T6. |
| `ket_qua_parse_giao_dich` | Ket qua parser | Ma can parse, trang thai khop, do tin cay, ly do, parser version | Co the gop | Neu muon gon, co the dua cac field nay vao `giao_dich_ngan_hang`. |
| `ung_vien_khop_giao_dich` | Goi y parser | Nhieu ma can ung vien khi parser khong chac | Co the gop | Co the luu JSON candidates trong `giao_dich_ngan_hang` thay vi bang rieng, tru khi can query/report rat nhieu theo candidate. |
| `duyet_giao_dich` | Review state | Trang thai duyet, ma can duoc chon, nguoi duyet, ngay duyet, ghi chu | Co the gop | Neu moi giao dich chi co 1 trang thai hien tai, nen gop vao `giao_dich_ngan_hang`. Neu can audit lich su nhieu lan duyet thi moi can bang rieng. |
| `phan_bo_giao_dich` | Allocation | Mot giao dich chia cho 1 hoac nhieu can, moi dong la 1 phan bo | Co | Nen giu neu co giao dich dong cho nhieu can. Neu 100% mot can thi co the gop, nhung thuc te da co case nhieu can. |
| `chung_tu_doi_soat` | Bang chung | Anh Zalo, anh sao ke cu dan, ghi chu xac minh, link file | Co | Nen giu vi nghiep vu Zalo/khong ro can can bang chung. |
| `lich_su_dong_phi_can_ho` | Ledger phi | Dong tien da duyet duoc ghi vao lich su phi tung can | Co | Nen giu. Day la so cai phat sinh sau khi duyet giao dich. |
| `so_chot_thang` | Closing header | Ky chot, cutoff, tong tien, trang thai, nguoi chot | Co | Nen giu. Day la moc bat bien theo thang. |
| `so_chot_can_ho` | Closing detail | Snapshot tung can tai ky chot | Co | Nen giu. Day la opening/closing balance tung can. |
| `batch_trang_thai_phi_public` | Public snapshot header | Batch public cho cu dan tra cuu | Co | Nen giu neu can preview/chot/public an toan. |
| `trang_thai_phi_can_ho_public` | Public snapshot detail | Trang thai phi tung can trong batch public | Co | Nen giu. Public chi doc bang nay, khong doc raw noi bo. |
| `ngoai_le_giao_dich` | Exception case | Chuyen nham, an dien, khong ro can, thieu/thua tien | Chua can | Dang rong. Co the bo khoi MVP hoac gop vao review/evidence. |

### 8.2 Ket luan thua/khong thua

Khong thua neu thiet ke theo he thong ke toan/audit day du.

Nhung voi muc tieu hien tai:

- Admin it nguoi.
- Can thao tac nhanh.
- Excel T5 da la moc chuan.
- Sao ke tu T6 moi la du lieu van hanh.
- Parser va duyet la tinh nang quan trong nhung chua can audit phuc tap.

Thi co 3 cum dang co the gop gon:

1. `ket_qua_parse_giao_dich` + `ung_vien_khop_giao_dich` co the gop vao `giao_dich_ngan_hang` bang cac cot parse + JSON candidates.
2. `duyet_giao_dich` co the gop vao `giao_dich_ngan_hang` neu chi can trang thai duyet hien tai.
3. `ngoai_le_giao_dich` co the bo tam thoi; dung `trang_thai_duyet`, `ghi_chu_duyet`, `chung_tu_doi_soat` de xu ly ngoai le.

### 8.3 Mo hinh DB gon hon de xuat cho Phase 2

Neu chap nhan refactor schema, luong sao ke nen con cac bang chinh:

| Bang de xuat | Vai tro |
| --- | --- |
| `lo_nhap_du_lieu` | Luu batch import file |
| `giao_dich_sao_ke_tho_chuan` | Luu toan bo sao ke raw/canonical, gom T1-T5 va ve sau, unique theo ref/fingerprint |
| `giao_dich_ngan_hang` | Chi luu giao dich sau cutoff can duyet/da duyet trong van hanh |
| `phan_bo_giao_dich` | Chia tien giao dich cho mot/nhieu can |
| `chung_tu_doi_soat` | Bang chung Zalo/sao ke cu dan |
| `lich_su_dong_phi_can_ho` | So cai phi sau khi duyet |
| `so_chot_thang` | Header so chot ky |
| `so_chot_can_ho` | Detail so chot tung can |
| `batch_trang_thai_phi_public` | Header batch public |
| `trang_thai_phi_can_ho_public` | Detail public tung can |

Trong mo hinh nay, `giao_dich_ngan_hang` nen them cac field hien dang nam o bang phu:

- `ma_can_parse`
- `trang_thai_khop`
- `ly_do_khop`
- `do_tin_cay`
- `ung_vien_khop_json`
- `trang_thai_duyet`
- `ma_can_duoc_chon`
- `ghi_chu_duyet`
- `nguoi_duyet`
- `ngay_duyet`

Khi do co the loai bo/giam vai tro:

- `ket_qua_parse_giao_dich`
- `ung_vien_khop_giao_dich`
- `duyet_giao_dich`
- `ngoai_le_giao_dich`

### 8.4 Tradeoff khi gop bang

Loi ich:

- It bang hon.
- Man hinh review query don gian hon.
- De giai thich cho nguoi tiep nhan.
- Giam nguy co lech trang thai giua parse/review/transaction.

Doi lai:

- Mat lich su nhieu lan parse/nhieu lan review neu khong thiet ke audit rieng.
- JSON candidates kho query thong ke hon bang rieng.
- Can migration va sua code import/review/dashboard.

De xuat thuc te: neu anh muon don schema that su, nen lam refactor nay truoc khi import toan bo sao ke T1-T5 vao DB.

## 9. Da thuc thi dot refactor Phase 2

Ngay thuc thi: 2026-06-03.

Da lam:

- Them migration `20260603033929_phase2_lean_statement_schema`.
- Them bang `giao_dich_sao_ke_tho_chuan` de luu sao ke raw/canonical, chong trung theo:
  - `tham_chieu_ngan_hang` neu co.
  - `van_tay_giao_dich` neu khong co ma tham chieu.
- Them cac field parse/review vao `giao_dich_ngan_hang`:
  - `phien_ban_parser`
  - `ma_can_parse`
  - `trang_thai_khop`
  - `ly_do_khop`
  - `do_tin_cay`
  - `la_giao_dich_noi_bo`
  - `ung_vien_khop_json`
  - `trang_thai_duyet`
  - `ma_can_duoc_chon`
  - `ghi_chu_duyet`
  - `nguoi_duyet`
  - `ngay_duyet`
- Backfill 372 giao dich hien co tu cac bang legacy sang field moi tren `giao_dich_ngan_hang`.
- Backfill 372 giao dich hien co vao `giao_dich_sao_ke_tho_chuan`.
- Cap nhat import sao ke:
  - moi dong sao ke duoc upsert vao `giao_dich_sao_ke_tho_chuan`;
  - dong chi chi nam o raw canonical;
  - dong thu sau cutoff moi vao `giao_dich_ngan_hang`;
  - re-import khong tao trung theo ref/fingerprint.
- Cap nhat man duyet/trang dashboard dung field gop tren `giao_dich_ngan_hang` cho thong ke va trang thai chinh.

Chua drop ngay:

- `ket_qua_parse_giao_dich`
- `ung_vien_khop_giao_dich`
- `duyet_giao_dich`
- `ngoai_le_giao_dich`

Ly do: giu lai trong giai doan chuyen tiep de co du lieu doi chieu va tranh gay mat du lieu neu can rollback logic.

De xuat buoc tiep theo:

1. Test import file sao ke T6 va review bang UI.
2. Neu on dinh, chuyen script/page con lai sang 100% field moi.
3. Sau khi chay on dinh it nhat mot dot test, moi tao migration drop/luu archive cac bang legacy.
