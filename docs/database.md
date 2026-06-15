# Database hien hanh

Cap nhat: 2026-06-06

## Nguon su that duy nhat

- Schema Prisma duy nhat: [../prisma/schema.prisma](../prisma/schema.prisma).
- Migration moi nhat: `20260606090000_simplify_transaction_state`.
- File nay la tai lieu thiet ke DB hien hanh. Report va tai lieu cu khong duoc dung thay schema.

## Nguyen tac nghiep vu

1. `can_ho` la master cua 934 can.
2. Excel T5/2026 la opening balance da chot den `31/05/2026 23:59` gio Viet Nam.
3. Sao ke ngan hang luu hai lop:
   - raw/canonical bat bien de chong trung, audit va hoc parser;
   - operational de parser, duyet va ghi nhan phi.
4. Trang thai parser va trang thai duyet hien tai chi co mot nguon: `giao_dich_ngan_hang`.
5. Du lieu cu dan chi public qua snapshot da chot, khong doc truc tiep tu staging/giao dich dang duyet.

## Luong sao ke

`lo_nhap_du_lieu`
-> `dong_sao_ke_tho`
-> `giao_dich_sao_ke_tho_chuan`
-> `giao_dich_ngan_hang`
-> `phan_bo_giao_dich`
-> `lich_su_dong_phi_can_ho`
-> batch public

### Bang va vai tro

| Bang | Vai tro duy nhat |
| --- | --- |
| `lo_nhap_du_lieu` | Mot lan upload/import. |
| `dong_sao_ke_tho` | Dong raw theo tung lan upload, phuc vu truy vet file. |
| `giao_dich_sao_ke_tho_chuan` | Raw canonical chong trung theo ma tham chieu/fingerprint. |
| `giao_dich_ngan_hang` | Ban ghi operational va nguon trang thai parser/duyet duy nhat. |
| `ung_vien_khop_giao_dich` | Danh sach ung vien can ho co thu hang cua mot giao dich. |
| `phan_bo_giao_dich` | Phan bo so tien cua mot giao dich vao mot hoac nhieu can. |
| `chung_tu_doi_soat` | Anh Zalo, file sao ke, ghi chu va bang chung thu cong. |
| `lich_su_dong_phi_can_ho` | Lich su phi sach sinh sau khi giao dich duoc duyet. |

Da loai bo trong migration `20260606090000_simplify_transaction_state`:

- `ket_qua_parse_giao_dich`: trung trang thai parser voi `giao_dich_ngan_hang`.
- `duyet_giao_dich`: trung trang thai duyet voi `giao_dich_ngan_hang`.
- `ngoai_le_giao_dich`: chua co luong nghiep vu su dung.
- `giao_dich_ngan_hang.ung_vien_khop_json`: trung voi bang ung vien co cau truc.

### Cot trang thai trung tam

`giao_dich_ngan_hang` giu:

- Parser: `phien_ban_parser`, `ma_can_parse`, `trang_thai_khop`, `ly_do_khop`, `do_tin_cay`.
- Duyet: `trang_thai_duyet`, `ma_can_duoc_chon`, `ghi_chu_duyet`, `nguoi_duyet`, `ngay_duyet`.
- Dinh danh: `tham_chieu_ngan_hang` la unique chinh khi co; `van_tay_giao_dich` la unique fallback.

Re-import chi cap nhat ket qua parser khi giao dich chua duyet. Khong reset giao dich da duyet, da ra soat hoac tu choi.

Tu migration `20260610150000_phase2_integrity_and_reserve`:

- `trang_thai_duyet` co them `BAO_LUU` cho giao dich can doi chieu sau,
  khong sinh lich su phi.
- `phan_bo_giao_dich` unique theo
  `(giao_dich_ngan_hang_id, can_ho_id)`.
- `so_chot_can_ho.so_du_chua_du_thang` luu so du chua du mot thang tai moc
  chot.

Cong thuc public ky moi:

```text
tien_co_the_phan_bo = so_du_ky_truoc + tien_moi_da_duyet
so_thang_tang = floor(tien_co_the_phan_bo / muc_phi_thang)
so_du_chuyen_ky = tien_co_the_phan_bo - so_thang_tang * muc_phi_thang
```

Vi vay hai lan dong le 100.000 va 150.000 van co the hop thanh mot thang
250.000 o batch sau.

### Quy tac phi

`quy_tac_phi` la nguon duy nhat cho muc phi quan ly van hanh theo:

- `loai_can`;
- `ma_phi = QLVH`;
- khoang hieu luc;
- co `dang_ap_dung`.

Man duyet giao dich va bao cao sao ke khong duoc suy luan muc phi tu tien to
ma can. Neu thieu quy tac phi, he thong chi chia deu de goi y va bat buoc
nguoi dung kiem tra truoc khi duyet.

## Du lieu can ho va lien he

| Bang | Vai tro |
| --- | --- |
| `can_ho` | Master can ho. |
| `dong_du_lieu_quan_ly_tho` | Raw tu file master. |
| `ung_vien_lien_he_can_ho` | Lien he staging/chua duyet. |
| `lien_he_can_ho` | Danh ba noi bo da duyet. |

Tra cuu noi bo hien thi ca:

- trang thai phi public;
- lien he goc/chua duyet va lien he chinh thuc;
- lich su giao dich da duyet;
- giao dich `DA_RA_SOAT` dang can bo sung bang chung, neu parser/ung vien/ma can duoc chon lien quan den can dang xem.

## Mo chot va public

| Bang | Vai tro |
| --- | --- |
| `so_chot_thang` | Moc chot nghiep vu va cutoff import sao ke. |
| `so_chot_can_ho` | Snapshot tung can tai moc chot. |
| `batch_trang_thai_phi_public` | Mot batch public/preview. |
| `trang_thai_phi_can_ho_public` | Trang thai phi public cua tung can trong batch. |

Public lookup chi doc batch co `la_batch_public_hien_hanh = true`.

## Trang thai DB dev sau reset 2026-06-06

- `can_ho`: 934.
- `ung_vien_lien_he_can_ho`: 1.977.
- current public batch: 1 batch `T5-2026`, 934 can.
- `so_chot_thang`: 1, cutoff `31/05/2026 23:59` gio Viet Nam.
- `giao_dich_ngan_hang`: 0, san sang nhap sao ke moi khong bi trung du lieu test.

## Lien ket xuong song

- [nghiep-vu-he-thong.md](nghiep-vu-he-thong.md)
- [phase-2-roadmap.md](phase-2-roadmap.md)
- [handoff.md](handoff.md)
- [module-map.md](module-map.md)
