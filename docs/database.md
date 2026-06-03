# Database

## Nguon su that duy nhat

- Schema Prisma hien hanh duy nhat: [../prisma/schema.prisma](../prisma/schema.prisma).
- `prisma.config.ts` tro truc tiep den `prisma/schema.prisma`.
- Khong con schema V1 nam trong thu muc `prisma/` de tranh chay nham migration/generate.
- Ban V1 chi con la archive lich su tai [archive/legacy-v1/schema-v1.archive.prisma](archive/legacy-v1/schema-v1.archive.prisma) va khong duoc dung de generate/migrate.
- Tai lieu database hien hanh duy nhat la file nay. Cac tai lieu V1 chi de tham khao lich su.

## Mo hinh sao ke ngan hang Phase 2 hien hanh

Tu migration `20260603033929_phase2_lean_statement_schema`, luong sao ke duoc chia thanh 2 lop:

1. Raw/canonical: `giao_dich_sao_ke_tho_chuan` luu toan bo dong sao ke da import, bao gom ca dong thu va dong chi, chong trung theo `tham_chieu_ngan_hang` neu co, fallback `van_tay_giao_dich` neu khong co ma tham chieu.
2. Operational/review: `giao_dich_ngan_hang` chi luu giao dich thu can van hanh sau moc chot. Bang nay da gop cac field parse va review hien tai de giam phu thuoc bang phu.

Bang chinh trong luong sao ke Phase 2:

| Bang | Vai tro | Ghi chu |
| --- | --- | --- |
| `lo_nhap_du_lieu` | Lo import | Moi lan upload file Excel/sao ke tao mot lo. Voi sao ke, `loai_nguon = SAO_KE_NGAN_HANG`. |
| `giao_dich_sao_ke_tho_chuan` | Sao ke raw canonical | Nguon thuc te de luu tat ca sao ke, phuc vu doi soat lich su va hoc parser. |
| `dong_sao_ke_tho` | Dong sao ke raw theo lan upload | Bang legacy/audit theo batch upload. Co the lap lai khi import lai cung file. |
| `giao_dich_ngan_hang` | Giao dich ngan hang operational | Co unique `tham_chieu_ngan_hang` va `van_tay_giao_dich`. La bang trung tam de duyet giao dich sau cutoff. Da chua field parser/review hien tai. |
| `phan_bo_giao_dich` | Phan bo tien vao can ho | Mot giao dich co the phan bo mot can ho hoac nhieu can. |
| `chung_tu_doi_soat` | Bang chung doi soat | Anh Zalo, anh sao ke cu dan, ghi chu xac minh thu cong. |
| `lich_su_dong_phi_can_ho` | Lich su phi da ghi nhan | Giao dich da duyet sinh lich su phi, sau do co the dung de tao batch public moi. |

Bang legacy chua drop trong giai doan chuyen tiep:

| Bang | Trang thai | Ghi chu |
| --- | --- | --- |
| `ket_qua_parse_giao_dich` | Legacy | Da backfill sang `giao_dich_ngan_hang.phien_ban_parser`, `ma_can_parse`, `trang_thai_khop`, `ly_do_khop`, `do_tin_cay`. |
| `ung_vien_khop_giao_dich` | Legacy | Da backfill sang `giao_dich_ngan_hang.ung_vien_khop_json`. |
| `duyet_giao_dich` | Legacy | Da backfill sang `giao_dich_ngan_hang.trang_thai_duyet`, `ma_can_duoc_chon`, `ghi_chu_duyet`, `nguoi_duyet`, `ngay_duyet`. |
| `ngoai_le_giao_dich` | Chua dung | Dang de tam, co the drop/postpone neu khong can exception table rieng. |

Bang lien quan den moc chot:

| Bang | Vai tro |
| --- | --- |
| `so_chot_thang` | So chot thang, vi du Excel T5 da xac nhan den `31/05/2026 23:59`. Metadata `chotDenThoiDiem` la cutoff cho import sao ke moi. |
| `so_chot_can_ho` | Snapshot tung can tai moc chot. |
| `batch_trang_thai_phi_public` va `trang_thai_phi_can_ho_public` | Snapshot public cho cu dan tra cuu. |

Nguyen tac Phase 2:

- Excel chot T5 la du lieu chuan den moc chot.
- Sao ke truoc/den moc chot chi nen luu raw/canonical tham khao, khong day vao man duyet van hanh.
- Sao ke sau moc chot moi tao giao dich can duyet.
- Re-import cung sao ke khong duoc tao trung `giao_dich_sao_ke_tho_chuan` va `giao_dich_ngan_hang`.
- Re-import khong duoc reset `giao_dich_ngan_hang.trang_thai_duyet` neu giao dich da duyet/tu choi/da ra soat.

## Field parse/review da gop vao `giao_dich_ngan_hang`

`giao_dich_ngan_hang` hien la bang trung tam cua man duyet sao ke. Cac cot parse/review quan trong:

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

---
## LiÃªn káº¿t xÆ°Æ¡ng sá»‘ng

- Má»¥c lá»¥c tÃ i liá»‡u: [README.md](README.md)
- Handoff hiá»‡n táº¡i: [handoff.md](handoff.md)
- Roadmap control: [roadmap.md](roadmap.md)
- Checklist nghiá»‡m thu: [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md)
- Schema tÆ°Æ¡ng á»©ng: [../prisma/schema.prisma](../prisma/schema.prisma)

## Má»¥c tiÃªu

Database V2 sá»­a láº¡i trá»ng tÃ¢m cá»§a V1 theo Ä‘Ãºng nghiá»‡p vá»¥ thá»±c táº¿:

- láº¥y **cÄƒn há»™** lÃ m trung tÃ¢m
- quáº£n lÃ½ **Ä‘áº§u má»‘i liÃªn há»‡ cá»§a cÄƒn há»™**
- khÃ´ng cá»‘ Ã©p dá»¯ liá»‡u báº©n thÃ nh mÃ´ hÃ¬nh dÃ¢n cÆ° quÃ¡ sÃ¢u
- parse vÃ  review dá»¯ liá»‡u liÃªn há»‡ trÆ°á»›c khi Ä‘á»• vÃ o báº£ng chuáº©n
- dÃ¹ng tÃªn báº£ng/cá»™t tiáº¿ng Viá»‡t khÃ´ng dáº¥u Ä‘á»ƒ dá»… review
- dÃ¹ng `id` sá»‘ tá»± tÄƒng Ä‘á»ƒ dá»… Ä‘á»‘i chiáº¿u trong DB

V2 phÃ¹ há»£p hÆ¡n vá»›i má»¥c tiÃªu tháº­t cá»§a há»‡ thá»‘ng hiá»‡n táº¡i:

- tÃ¬m ai Ä‘á»ƒ gá»i Ä‘iá»‡n
- tÃ¬m sá»‘ nÃ o Ä‘á»ƒ nháº¯n tin / gá»­i thÃ´ng tin Ä‘Ã³ng phÃ­
- biáº¿t ai lÃ  Ä‘áº§u má»‘i chÃ­nh cá»§a cÄƒn

## TÆ° tÆ°á»Ÿng thiáº¿t káº¿

### 1. KhÃ´ng láº¥y `cu_dan` lÃ m trung tÃ¢m quÃ¡ sá»›m

Dá»¯ liá»‡u Excel hiá»‡n táº¡i khÃ´ng Ä‘á»§ sáº¡ch Ä‘á»ƒ xÃ¡c Ä‘á»‹nh chuáº©n:

- ai lÃ  chá»§ há»™ phÃ¡p lÃ½
- ai lÃ  vá»£/chá»“ng/con
- ai lÃ  khÃ¡ch thuÃª
- ai lÃ  Ä‘á»“ng sá»Ÿ há»¯u

Náº¿u cá»‘ Ä‘i theo mÃ´ hÃ¬nh dÃ¢n cÆ° â€œÄ‘áº¹pâ€ quÃ¡ sá»›m, há»‡ thá»‘ng sáº½:

- phá»©c táº¡p
- khÃ³ import
- dá»… sai

VÃ¬ váº­y V2 chuyá»ƒn sang:

- `can_ho`
- `lien_he_can_ho`
- `ung_vien_lien_he_can_ho`

### 2. Má»™t cÄƒn cÃ³ nhiá»u Ä‘áº§u má»‘i liÃªn há»‡

VÃ­ dá»¥:

- chá»§ há»™ chÃ­nh
- ngÆ°á»i liÃªn quan 1
- ngÆ°á»i liÃªn quan 2
- nhÃ³m tÃªn dÃ¹ng chung má»™t sá»‘ Ä‘iá»‡n thoáº¡i

ÄÃ¢y lÃ  cÃ¡ch phÃ¹ há»£p vá»›i má»¥c tiÃªu thu phÃ­ hÆ¡n lÃ  phÃ¢n loáº¡i quan há»‡ há»™ gia Ä‘Ã¬nh.

### 3. KhÃ´ng xÃ³a dá»¯ liá»‡u gá»‘c

V2 váº«n giá»¯:

- raw gá»‘c
- parsed staging
- review

Chá»‰ sau khi review xong má»›i Ä‘á»• vÃ o báº£ng master.

## Giáº£i thÃ­ch vá» ID hiá»‡n táº¡i

Trong V1, `id` cÃ³ dáº¡ng:

- `cmo42x...`

ÄÃ¢y lÃ  `cuid()` do Prisma táº¡o, khÃ´ng pháº£i mÃ£ hÃ³a.

Vá»›i cÃ¡ch review dá»¯ liá»‡u thá»§ cÃ´ng, loáº¡i ID nÃ y báº¥t tiá»‡n vÃ¬:

- khÃ³ nhÃ¬n
- khÃ³ Ä‘á»‘i chiáº¿u giá»¯a cÃ¡c báº£ng

VÃ¬ váº­y V2 dÃ¹ng:

- `id integer generated always as identity`

## CÃ¡c báº£ng chÃ­nh

## 1. `can_ho`

Báº£ng master cÄƒn há»™.

CÃ¡c cá»™t chÃ­nh:

- `id`
- `ma_can`
- `loai_can`
- `ma_lo`
- `ma_so`
- `dien_tich_m2`
- `toa_lo_goc`
- `loai_hinh_goc`
- `chu_ho_ten_goc`
- `trang_thai_su_dung_goc`
- `tinh_trang_goc`
- `trang_thai`
- `ghi_chu`
- `ngay_tao`
- `ngay_cap_nhat`

Ghi chÃº:

- MÃ£ liá»n ká» trong dá»¯ liá»‡u tháº­t hiá»‡n gá»“m `LK1.*`, `LK2.*`, `LKV.*`
- CÃ¡c mÃ£ nÃ y váº«n giá»¯ nguyÃªn `ma_can`
- nhÆ°ng `loai_can = LIEN_KE`

## 2. `lien_he_can_ho`

Báº£ng contact master theo cÄƒn há»™.

Má»—i record lÃ  má»™t Ä‘áº§u má»‘i liÃªn há»‡ cÃ³ thá»ƒ dÃ¹ng Ä‘á»ƒ:

- gá»i Ä‘iá»‡n
- nháº¯n tin
- gá»­i thÃ´ng tin Ä‘Ã³ng phÃ­

CÃ¡c cá»™t chÃ­nh:

- `id`
- `can_ho_id`
- `ten_hien_thi`
- `so_dien_thoai`
- `la_lien_he_chinh`
- `nhan_thong_bao`
- `zalo_link`
- `vai_tro_lien_he`
- `trang_thai_lien_he`
- `thu_tu_uu_tien`
- `nguon_du_lieu`
- `nguon_dong_du_lieu_tho_id`
- `co_can_ra_soat`
- `ghi_chu`
- `ngay_tao`
- `ngay_cap_nhat`

Giáº£i thÃ­ch:

- `ten_hien_thi` cÃ³ thá»ƒ lÃ  má»™t ngÆ°á»i:
  - `Chá»‹ BÃ­ch`
- hoáº·c má»™t nhÃ³m tÃªn dÃ¹ng chung má»™t sá»‘:
  - `Hiáº¿u/ Má»¹ Linh`

## 3. `quy_tac_phi`

Thay cho `FeeRule`.

CÃ¡c cá»™t chÃ­nh:

- `id`
- `loai_can`
- `ma_phi`
- `so_tien`
- `hieu_luc_tu_ngay`
- `hieu_luc_den_ngay`
- `dang_ap_dung`
- `ghi_chu`

Seed ban Ä‘áº§u:

- `CHUNG_CU` + `QLVH` = `250000`
- `LIEN_KE` + `QLVH` = `200000`

## 4. `lo_nhap_du_lieu`

Thay cho `ImportBatch`.

CÃ¡c cá»™t chÃ­nh:

- `id`
- `loai_nguon`
  - `WORKBOOK_QUAN_LY`
  - `SAO_KE_NGAN_HANG`
  - `CHUNG_TU`
- `ten_file`
- `ma_bam_file`
- `so_dong`
- `trang_thai`
- `tong_quan_loi`
- `metadata_json`
- `thoi_diem_nhap`

## 5. `dong_du_lieu_quan_ly_tho`

Thay cho `RawManagementRow`.

CÃ¡c cá»™t chÃ­nh:

- `id`
- `lo_nhap_du_lieu_id`
- `ten_sheet`
- `so_dong_nguon`
- `loai_dong`
- `header_values_json`
- `values_json`
- `mapped_row_json`
- `payload_json`
- `ngay_tao`

Äiá»ƒm má»›i:

- giá»¯ raw gá»‘c
- Ä‘á»“ng thá»i lÆ°u `mapped_row_json` Ä‘á»ƒ dá»… audit

## 6. `ung_vien_lien_he_can_ho`

ÄÃ¢y lÃ  báº£ng staging quan trá»ng nháº¥t cá»§a V2.

Má»—i record lÃ  má»™t candidate Ä‘áº§u má»‘i liÃªn há»‡ parse ra tá»« dá»¯ liá»‡u Excel.

CÃ¡c cá»™t chÃ­nh:

- `id`
- `lo_nhap_du_lieu_id`
- `dong_du_lieu_tho_id`
- `ma_can`
- `ten_chu_ho_goc`
- `thong_tin_cu_dan_goc`
- `ten_hien_thi_parse`
- `so_dien_thoai_parse`
- `la_lien_he_chinh_du_doan`
- `co_can_ra_soat`
- `flags_json`
- `ghi_chu_nghiep_vu`
- `payload_parse_json`
- `payload_duyet_json`
- `trang_thai_duyet`
- `ghi_chu_duyet`
- `ngay_tao`
- `ngay_cap_nhat`

VÃ­ dá»¥:

Tá»« Ã´:

- `TrÆ°Æ¡ng ThÃ nh Trung/(0933.456.655/0932.223.638-Chá»‹ BÃ­ch.)`
- `Hiáº¿u / Má»¹ Linh 0794115765`
- `Thanh toÃ¡n theo thÃ¡ng: cá»© cuá»‘i thÃ¡ng sáº½ ná»™p`

cÃ³ thá»ƒ sinh ra:

- `TrÆ°Æ¡ng ThÃ nh Trung` / `0933456655` / `la_lien_he_chinh_du_doan = true`
- `Chá»‹ BÃ­ch` / `0932223638`
- `Hiáº¿u/ Má»¹ Linh` / `0794115765`

vÃ  ghi chÃº nghiá»‡p vá»¥:

- `Thanh toÃ¡n theo thÃ¡ng: cá»© cuá»‘i thÃ¡ng sáº½ ná»™p`

## 7. `dong_sao_ke_tho`

Thay cho `RawBankStatementRow`.

CÃ¡c cá»™t chÃ­nh:

- `id`
- `lo_nhap_du_lieu_id`
- `so_dong_nguon`
- `header_values_json`
- `values_json`
- `mapped_row_json`
- `payload_json`
- `ngay_tao`

## 7B. `tai_khoan_quan_tri`

Báº£ng tÃ i khoáº£n quáº£n trá»‹ ná»™i bá»™.

Vai trÃ² ban Ä‘áº§u:

- `SUPER_ADMIN`
- `MANAGER`
- `TECHNICIAN`

CÃ¡c cá»™t chÃ­nh:

- `id`
- `ten_dang_nhap`
- `so_dien_thoai`
- `email`
- `mat_khau_hash`
- `vai_tro`
- `trang_thai`
- `ten_hien_thi`
- `lan_dang_nhap_cuoi`
- `ngay_tao`
- `ngay_cap_nhat`

Quy táº¯c:

- `SUPER_ADMIN` cÃ³ toÃ n quyá»n: import/chá»‘t batch dá»¯ liá»‡u public, duyá»‡t/tá»« chá»‘i liÃªn há»‡, táº¡o/khÃ³a/má»Ÿ khÃ³a/Ä‘á»•i vai trÃ² tÃ i khoáº£n quáº£n trá»‹.
- `SUPER_ADMIN` cÃ³ thá»ƒ táº¡o thÃªm tÃ i khoáº£n `SUPER_ADMIN`, `MANAGER`, hoáº·c `TECHNICIAN` tá»« UI `/admin/accounts`; khÃ´ng cáº§n táº¡o admin trá»±c tiáº¿p trong DB á»Ÿ váº­n hÃ nh bÃ¬nh thÆ°á»ng.
- `MANAGER` chá»‰ Ä‘Æ°á»£c tra cá»©u ná»™i bá»™, xem liÃªn há»‡ cÆ° dÃ¢n/dá»¯ liá»‡u gá»‘c, gá»i nhanh cÆ° dÃ¢n vÃ  quáº£n lÃ½ tÃ i khoáº£n cÃ¡ nhÃ¢n.
- `TECHNICIAN` dÃ¹ng cho Ä‘á»™i ká»¹ thuáº­t, quyá»n hiá»‡n táº¡i ngang `MANAGER`: tra cá»©u ná»™i bá»™, xem liÃªn há»‡ cÆ° dÃ¢n/dá»¯ liá»‡u gá»‘c, gá»i nhanh cÆ° dÃ¢n vÃ  quáº£n lÃ½ tÃ i khoáº£n cÃ¡ nhÃ¢n.
- `MANAGER` vÃ  `TECHNICIAN` khÃ´ng Ä‘Æ°á»£c import/chá»‘t phÃ­, duyá»‡t/tá»« chá»‘i liÃªn há»‡, táº¡o tÃ i khoáº£n hoáº·c Ä‘á»•i phÃ¢n quyá»n.
- `so_dien_thoai` lÃ  sá»‘ Ä‘Ã£ chuáº©n hÃ³a, dÃ¹ng Ä‘Æ°á»£c Ä‘á»ƒ Ä‘Äƒng nháº­p admin/manager.
- Má»—i tÃ i khoáº£n quáº£n trá»‹ cÃ³ trang há»“ sÆ¡ riÃªng Ä‘á»ƒ tá»± Ä‘á»•i `ten_hien_thi`, `email`, vÃ  `mat_khau_hash` thÃ´ng qua Ä‘á»•i máº­t kháº©u.
- KhÃ´ng export hoáº·c hiá»ƒn thá»‹ `mat_khau_hash` trong file Excel váº­n hÃ nh.

## 7C. `dong_theo_doi_thu_phi_tho`

Báº£ng staging cho file Excel theo dÃµi thu phÃ­ thá»§ cÃ´ng.

Má»¥c tiÃªu:

- giá»¯ raw/mapped row tá»« workbook thu phÃ­
- Ä‘á»c cá»™t `ThÃ¡ng Ä‘Ã£ Ä‘Ã³ng Ä‘áº¿n hiá»‡n táº¡i`
- khÃ´ng public trá»±c tiáº¿p dá»¯ liá»‡u nhÃ¡p

CÃ¡c cá»™t chÃ­nh:

- `id`
- `lo_nhap_du_lieu_id`
- `ten_sheet`
- `so_dong_nguon`
- `header_values_json`
- `values_json`
- `mapped_row_json`
- `ma_can`
- `thang_da_dong_den_hien_tai`
- `payload_json`
- `ngay_tao`

## 7D. `batch_trang_thai_phi_public`

Báº£ng batch dá»¯ liá»‡u phÃ­ Ä‘Ã£ import/chá»‘t Ä‘á»ƒ public cho cÆ° dÃ¢n.

CÃ¡c tráº¡ng thÃ¡i:

- `NHAP`
- `DA_KIEM_TRA`
- `DA_PUBLIC`
- `HUY`

CÃ¡c cá»™t chÃ­nh:

- `id`
- `lo_nhap_du_lieu_id`
- `ky_du_lieu`
- `ten_file_nguon`
- `trang_thai`
- `la_batch_public_hien_hanh`
- `tong_so_can`
- `tong_quan_loi`
- `metadata_json`
- `nguoi_public_id`
- `public_luc`
- `ngay_tao`
- `ngay_cap_nhat`

Quy táº¯c:

- Chá»‰ batch `DA_PUBLIC` vÃ  `la_batch_public_hien_hanh = true` Ä‘Æ°á»£c trang public Ä‘á»c.
- Batch nhÃ¡p khÃ´ng Ä‘Æ°á»£c hiá»ƒn thá»‹ cho cÆ° dÃ¢n.

## 7E. `trang_thai_phi_can_ho_public`

Báº£ng snapshot tráº¡ng thÃ¡i phÃ­ public theo cÄƒn há»™.

ÄÃ¢y lÃ  báº£ng duy nháº¥t trang public cÆ° dÃ¢n nÃªn Ä‘á»c.

CÃ¡c cá»™t chÃ­nh:

- `id`
- `batch_id`
- `can_ho_id`
- `ma_can`
- `thang_da_dong_den_hien_tai`
- `ky_du_lieu`
- `ghi_chu_public`
- `payload_public_json`
- `ngay_tao`

KhÃ´ng lÆ°u á»Ÿ Ä‘Ã¢y:

- sá»‘ Ä‘iá»‡n thoáº¡i
- CCCD
- thÆ°á»ng trÃº
- ghi chÃº ná»™i bá»™
- ghi chÃº gá»‘c Excel chÆ°a duyá»‡t

## 8. `giao_dich_ngan_hang`

Thay cho `BankTransaction`.

CÃ¡c cá»™t chÃ­nh:

- `id`
- `lo_nhap_du_lieu_id`
- `van_tay_giao_dich`
- `tham_chieu_ngan_hang`
- `ngay_giao_dich`
- `so_tien`
- `noi_dung_goc`
- `noi_dung_chuan_hoa`
- `ten_nguoi_chuyen`
- `tai_khoan_nguoi_chuyen`
- `ma_giao_dich_text`
- `payload_goc_json`
- `ngay_tao`
- `ngay_cap_nhat`

## 9. `ket_qua_parse_giao_dich`

Thay cho `TransactionParseResult`.

Rule parser mÃ£ cÄƒn, nguá»“n case vÃ  quy trÃ¬nh báº£o trÃ¬ náº±m táº¡i [parser-ma-can-ho.md](parser-ma-can-ho.md). Báº£ng nÃ y pháº£i lÆ°u Ä‘á»§ dáº¥u váº¿t Ä‘á»ƒ biáº¿t má»™t káº¿t quáº£ parse Ä‘Æ°á»£c sinh bá»Ÿi version/rule nÃ o.

CÃ¡c cá»™t chÃ­nh:

- `id`
- `giao_dich_ngan_hang_id`
- `phien_ban_parser`
- `ma_can_parse`
- `trang_thai_khop`
- `ly_do_khop`
- `do_tin_cay`
- `la_giao_dich_noi_bo`
- `ngay_tao`
- `ngay_cap_nhat`

## 10. `ung_vien_khop_giao_dich`

Thay cho `TransactionCandidate`.

CÃ¡c cá»™t chÃ­nh:

- `id`
- `ket_qua_parse_giao_dich_id`
- `ma_can`
- `diem`
- `ly_do`
- `thu_hang`
- `ngay_tao`

## 11. `duyet_giao_dich`

Thay cho `TransactionReview`.

CÃ¡c cá»™t chÃ­nh:

- `id`
- `giao_dich_ngan_hang_id`
- `trang_thai_duyet`
- `ma_can_duoc_chon`
- `ghi_chu_duyet`
- `nguoi_duyet`
- `ngay_duyet`

## 12. `phan_bo_giao_dich`

Thay cho `TransactionAllocation`.

CÃ¡c cá»™t chÃ­nh:

- `id`
- `giao_dich_ngan_hang_id`
- `can_ho_id`
- `so_tien_phan_bo`
- `cach_phan_bo`
- `ghi_chu`
- `ngay_tao`

## 13. `ngoai_le_giao_dich`

Thay cho `ExceptionCase`.

CÃ¡c cá»™t chÃ­nh:

- `id`
- `giao_dich_ngan_hang_id`
- `can_ho_id`
- `loai_ngoai_le`
- `trang_thai`
- `ghi_chu`
- `nguoi_xu_ly`
- `ngay_tao`
- `ngay_cap_nhat`

## 14. `chung_tu_doi_soat`

Báº£ng lÆ°u báº±ng chá»©ng thá»§ cÃ´ng cho giao dá»‹ch sao kÃª mÆ¡ há»“.

CÃ¡c cá»™t chÃ­nh:

- `id`
- `giao_dich_ngan_hang_id`
- `can_ho_id`
- `loai_chung_tu`
- `duong_dan_file`
- `ten_file_goc`
- `mime_type`
- `kich_thuoc_byte`
- `ngay_giao_dich`
- `so_tien`
- `ma_tham_chieu_ngan_hang`
- `ghi_chu`
- `nguoi_tao_id`
- `ngay_tao`

NguyÃªn táº¯c:

- DÃ¹ng cho áº£nh Zalo, sao kÃª cÆ° dÃ¢n gá»­i, ghi chÃº xÃ¡c minh thá»§ cÃ´ng.
- DB chá»‰ lÆ°u metadata/path, khÃ´ng lÆ°u binary file trá»±c tiáº¿p.
- Public khÃ´ng Ä‘á»c báº£ng nÃ y.

## 15. `lich_su_dong_phi_can_ho`

Báº£ng lá»‹ch sá»­ phÃ­ sáº¡ch sinh ra sau khi giao dá»‹ch Ä‘Æ°á»£c admin duyá»‡t.

CÃ¡c cá»™t chÃ­nh:

- `id`
- `can_ho_id`
- `ky_du_lieu`
- `thang_ap_dung`
- `so_tien`
- `loai_nguon`
- `giao_dich_ngan_hang_id`
- `phan_bo_giao_dich_id`
- `batch_phi_public_id`
- `ghi_chu`
- `nguoi_tao_id`
- `ngay_tao`

## 15A. `so_chot_thang`

Vai trÃ²:

- LÃ  lá»›p dá»¯ liá»‡u chuáº©n vÄ©nh viá»…n theo tá»«ng ká»³/thÃ¡ng sau khi Ä‘Ã£ Ä‘á»‘i soÃ¡t.
- Pháº£n Ã¡nh nghiá»‡p vá»¥ thá»±c táº¿: cuá»‘i thÃ¡ng Ä‘á»‘i chiáº¿u sao kÃª, Zalo/xÃ¡c minh thá»§ cÃ´ng vÃ  file Excel chá»‘t thÃ¡ng; náº¿u tá»•ng tiá»n khá»›p thÃ¬ khÃ³a thÃ nh sá»• chá»‘t.
- ÄÃ¢y lÃ  nguá»“n nghiá»‡p vá»¥ cao hÆ¡n staging/import; file import khÃ´ng Ä‘Æ°á»£c ghi Ä‘Ã¨ sá»• Ä‘Ã£ chá»‘t náº¿u khÃ´ng cÃ³ thao tÃ¡c Ä‘iá»u chá»‰nh thá»§ cÃ´ng.

TrÆ°á»ng chÃ­nh:

- `ky_du_lieu`: vÃ­ dá»¥ `T6-2026`.
- `tu_ngay`, `den_ngay`: khoáº£ng thá»i gian Ä‘á»‘i soÃ¡t.
- `lo_excel_chot_id`: lÃ´ Excel chá»‘t thÃ¡ng náº¿u cÃ³.
- `lo_sao_ke_id`: lÃ´ sao kÃª chÃ­nh náº¿u cÃ³.
- `ten_file_excel_chot`
- `tong_tien_excel`, `tong_tien_sao_ke`, `chenhlech_tien`
- `tong_so_can`, `so_can_khop`, `so_can_can_ra_soat`
- `trang_thai`: `NHAP`, `DOI_SOAT`, `DA_CHOT`, `HUY`.
- `nguoi_chot_id`, `ngay_chot`
- `metadata_json`

Quy táº¯c:

- T1-T4/2026 chá»‰ lÃ  dá»¯ liá»‡u tham kháº£o/há»c parser, khÃ´ng báº¯t buá»™c táº¡o sá»• chá»‘t.
- T5/2026 lÃ  opening balance/dá»¯ liá»‡u ná»n Ä‘Ã£ chá»‘t.
- Tá»« T6/2026 trá»Ÿ Ä‘i, sá»• chá»‘t thÃ¡ng lÃ  káº¿t quáº£ cuá»‘i cá»§a luá»“ng sao kÃª + duyá»‡t + Ä‘á»‘i soÃ¡t Excel.

## 15B. `so_chot_can_ho`

Vai trÃ²:

- Chi tiáº¿t 934 cÄƒn trong má»™t `so_chot_thang`.
- LÃ  dá»¯ liá»‡u chuáº©n theo cÄƒn sau khi thÃ¡ng Ä‘Ã£ chá»‘t.

TrÆ°á»ng chÃ­nh:

- `so_chot_thang_id`
- `can_ho_id`, `ma_can`
- `thang_da_dong_den_hien_tai`
- `so_tien_thang`
- `nguon`: `EXCEL_CHOT`, `SAO_KE_DA_DUYET`, `DIEU_CHINH_THU_CONG`
- `co_can_ra_soat`
- `ghi_chu`
- `payload_json`

Quy táº¯c:

- Má»™t sá»• chá»‘t chá»‰ cÃ³ má»™t dÃ²ng cho má»—i cÄƒn há»™.
- Sau khi sá»• Ä‘Ã£ `DA_CHOT`, dá»¯ liá»‡u chá»‰ nÃªn thay Ä‘á»•i báº±ng luá»“ng Ä‘iá»u chá»‰nh cÃ³ ghi chÃº/báº±ng chá»©ng, khÃ´ng ghi Ä‘Ã¨ báº±ng import file má»›i.
- Public batch sinh ra tá»« dá»¯ liá»‡u Ä‘Ã£ chá»‘t pháº£i liÃªn káº¿t ngÆ°á»£c vá» `so_chot_thang_id`.

NguyÃªn táº¯c:

- Opening balance T5/2026 lÃ  má»‘c ná»n.
- Giao dá»‹ch tá»« T6/2026 trá»Ÿ Ä‘i, sau khi duyá»‡t, má»›i Ä‘Æ°á»£c ghi vÃ o báº£ng nÃ y.
- Báº£ng nÃ y lÃ  nguá»“n sáº¡ch Ä‘á»ƒ tÃ­nh batch public trong cÃ¡c bÆ°á»›c sau.
- Khi má»™t dÃ²ng lá»‹ch sá»­ Ä‘Ã£ Ä‘Æ°á»£c Ä‘Æ°a vÃ o batch public, `batch_phi_public_id` Ä‘Æ°á»£c gáº¯n vá»›i batch Ä‘Ã³.
- CÃ¡c láº§n chá»‘t public sau chá»‰ láº¥y nhá»¯ng dÃ²ng `batch_phi_public_id = null`, trÃ¡nh cá»™ng láº·p má»™t giao dá»‹ch Ä‘Ã£ cÃ´ng khai.
- TÃ­nh sá»‘ thÃ¡ng cá»™ng thÃªm dá»±a trÃªn `quy_tac_phi` Ä‘ang Ã¡p dá»¥ng:
  - `CHUNG_CU`: 250.000/thÃ¡ng.
  - `LIEN_KE`: 200.000/thÃ¡ng.
  - pháº§n tiá»n láº» khÃ´ng Ä‘á»§ má»™t thÃ¡ng Ä‘Æ°á»£c lÆ°u trong payload batch public Ä‘á»ƒ audit, khÃ´ng tá»± lÃ m trÃ²n lÃªn.

## 16. `nhat_ky_dang_nhap_quan_tri`

Báº£ng nháº­t kÃ½ Ä‘Äƒng nháº­p tÃ i khoáº£n ná»™i bá»™.

CÃ¡c cá»™t chÃ­nh:

- `id`
- `tai_khoan_id`
- `dinh_danh_dang_nhap`
- `thanh_cong`
- `ip`
- `user_agent`
- `ghi_chu`
- `thoi_diem`

## 17. `thong_bao_cong_khai`

Báº£ng thÃ´ng bÃ¡o/PDF public cho cÆ° dÃ¢n xem á»Ÿ trang chá»§.

CÃ¡c cá»™t chÃ­nh:

- `id`
- `tieu_de`
- `mo_ta_ngan`
- `ten_file_goc`
- `duong_dan_file`
- `mime_type`
- `kich_thuoc_byte`
- `trang_thai`
- `ngay_cong_khai`
- `nguoi_tao_id`
- `ngay_tao`
- `ngay_cap_nhat`

Tráº¡ng thÃ¡i Ä‘ang dÃ¹ng:

- `NHAP`
- `CONG_KHAI`
- `AN`

## Luá»“ng dá»¯ liá»‡u V2

### 1. Import workbook quáº£n lÃ½

Nguá»“n:

- `Danh sÃ¡ch khÃ¡ch hÃ ng`
- `Lá»‹ch sá»­ Ä‘Ã³ng phÃ­`

ÄÃ­ch:

- `lo_nhap_du_lieu`
- `dong_du_lieu_quan_ly_tho`

### 2. Parse contact theo cÄƒn

ÄÃ­ch:

- `ung_vien_lien_he_can_ho`

### 3. Review

Sau review má»›i Ä‘á»• vÃ o:

- `can_ho`
- `lien_he_can_ho`

### 4. Import sao kÃª

ÄÃ­ch:

- `dong_sao_ke_tho`
- `giao_dich_ngan_hang`
- `ket_qua_parse_giao_dich`
- `ung_vien_khop_giao_dich`
- `duyet_giao_dich`
- `phan_bo_giao_dich`
- `chung_tu_doi_soat`
- `lich_su_dong_phi_can_ho`

Quy táº¯c duyá»‡t:

- Duyá»‡t má»™t cÄƒn táº¡o má»™t dÃ²ng `phan_bo_giao_dich` vÃ  má»™t dÃ²ng `lich_su_dong_phi_can_ho`.
- Duyá»‡t nhiá»u cÄƒn táº¡o nhiá»u dÃ²ng phÃ¢n bá»•, tá»•ng `so_tien_phan_bo` pháº£i báº±ng Ä‘Ãºng `giao_dich_ngan_hang.so_tien`.
- Náº¿u giao dá»‹ch chÆ°a public vÃ  admin duyá»‡t láº¡i, há»‡ thá»‘ng xÃ³a cÃ¡c dÃ²ng lá»‹ch sá»­ phÃ­ chÆ°a public cá»§a giao dá»‹ch Ä‘Ã³ rá»“i ghi láº¡i.
- Náº¿u giao dá»‹ch Ä‘Ã£ public, khÃ´ng sá»­a trá»±c tiáº¿p á»Ÿ mÃ n duyá»‡t Ä‘á»ƒ trÃ¡nh sai snapshot cÆ° dÃ¢n Ä‘Ã£ xem.

### 5. Import file theo dÃµi thu phÃ­ public

Nguá»“n:

- file Excel theo dÃµi thu phÃ­ Ä‘ang Ä‘Æ°á»£c váº­n hÃ nh thá»§ cÃ´ng
- cá»™t `ThÃ¡ng Ä‘Ã£ Ä‘Ã³ng Ä‘áº¿n hiá»‡n táº¡i`

ÄÃ­ch staging:

- `lo_nhap_du_lieu`
- `dong_theo_doi_thu_phi_tho`

ÄÃ­ch public sau khi Super Admin chá»‘t:

- `batch_trang_thai_phi_public`
- `trang_thai_phi_can_ho_public`

Trang public cÆ° dÃ¢n chá»‰ Ä‘á»c snapshot Ä‘Ã£ chá»‘t, khÃ´ng Ä‘á»c raw workbook.

### 6. Chá»‘t public tá»« lá»‹ch sá»­ phÃ­ Phase 2

Nguá»“n:

- `batch_trang_thai_phi_public` hiá»‡n hÃ nh lÃ m opening balance.
- `lich_su_dong_phi_can_ho` Ä‘Ã£ duyá»‡t nhÆ°ng chÆ°a public.
- `quy_tac_phi` Ä‘á»ƒ quy Ä‘á»•i sá»‘ tiá»n thÃ nh sá»‘ thÃ¡ng cá»™ng thÃªm.

ÄÃ­ch:

- batch má»›i trong `batch_trang_thai_phi_public`.
- 934 snapshot má»›i trong `trang_thai_phi_can_ho_public`.
- cáº­p nháº­t `batch_phi_public_id` cho cÃ¡c dÃ²ng `lich_su_dong_phi_can_ho` Ä‘Ã£ Ä‘Æ°á»£c Ä‘Æ°a vÃ o batch.

NguyÃªn táº¯c:

- Public lookup chá»‰ Ä‘á»c snapshot má»›i sau khi Super Admin chá»‘t.
- KhÃ´ng Ä‘á»c trá»±c tiáº¿p staging sao kÃª.
- KhÃ´ng cá»™ng láº¡i giao dá»‹ch Ä‘Ã£ Ä‘Æ°á»£c gáº¯n `batch_phi_public_id`.
- UI chá»‘t public Ä‘i qua 2 bÆ°á»›c: táº¡o preview batch nhÃ¡p, sau Ä‘Ã³ Super Admin xÃ¡c nháº­n chá»‘t.
- Trang preview `/admin/import/public-preview?batchId=...` so sÃ¡nh snapshot hiá»‡n hÃ nh vá»›i snapshot nhÃ¡p Ä‘á»ƒ kiá»ƒm tra tá»«ng cÄƒn thay Ä‘á»•i trÆ°á»›c khi chá»‘t.
- Batch preview nhÃ¡p cÃ³ thá»ƒ há»§y náº¿u táº¡o nháº§m, vá»›i Ä‘iá»u kiá»‡n batch cÃ²n tráº¡ng thÃ¡i `NHAP` vÃ  chÆ°a pháº£i batch public hiá»‡n hÃ nh.

## Káº¿t luáº­n

V2 theo hÆ°á»›ng contact-centric phÃ¹ há»£p hÆ¡n vá»›i má»¥c tiÃªu tháº­t cá»§a há»‡ thá»‘ng:

- gá»i Ä‘Ãºng ngÆ°á»i
- nháº¯n Ä‘Ãºng sá»‘
- biáº¿t cÄƒn cÃ³ nhá»¯ng Ä‘áº§u má»‘i liÃªn há»‡ nÃ o

NÃ³ thá»±c dá»¥ng hÆ¡n vÃ  bÃ¡m dá»¯ liá»‡u Excel tháº­t hÆ¡n mÃ´ hÃ¬nh dÃ¢n cÆ° quÃ¡ sÃ¢u.


