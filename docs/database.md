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

## Luong 4 bang nghiep vu trung tam

Day la 4 bang can hieu dung khi debug sao ke, duyet giao dich, bo sung qua khu
va tao public moi:

```text
giao_dich_ngan_hang
  -> phan_bo_giao_dich
    -> lich_su_dong_phi_can_ho
      -> trang_thai_phi_can_ho_public
```

### 1. `giao_dich_ngan_hang`

- La giao dich operational sinh ra tu import sao ke.
- Giu ket qua parser hien tai, trang thai duyet hien tai va thong tin dinh danh
  giao dich.
- Mot giao dich co the:
  - chua duyet;
  - duoc duyet cho 1 can;
  - duoc phan bo cho nhieu can;
  - bi bao luu / tu choi.

Khong nen chen tay cac giao dich qua khu vao bang nay neu chung khong di truc
tiep tu file sao ke ngan hang.

### 2. `phan_bo_giao_dich`

- La bang noi "mot giao dich duoc tinh cho can nao va bao nhieu tien".
- Mot giao dich duoc duyet nhanh cho 1 can se sinh 1 dong phan bo.
- Mot giao dich nhieu can se sinh nhieu dong phan bo.
- Bang nay khong phai ket qua public cuoi; no chi la buoc trung gian de chuan
  hoa y nghia nghiep vu cua mot giao dich.

### 3. `lich_su_dong_phi_can_ho`

- La bang "khoan phi da duoc ghi nhan vao lich su cua can ho".
- Moi dong o day da qua quyet dinh nghiep vu, khac voi giao dich thuan parser.
- Hien tai bang nay chu yeu duoc sinh tu man Duyet sao ke.
- Sau khi mot dong lich su duoc dua vao batch public, no se duoc gan
  `batch_phi_public_id`.

Bang nay hien dong vai tro:

- hang doi lich su phi da duyet nhung chua public;
- va sau khi public, la dau vet cho biet dong lich su da di vao batch nao.

### 4. `trang_thai_phi_can_ho_public`

- La snapshot ket qua cuoi cung de cu dan va admin tra cuu.
- Ve ly thuyet moi batch public co toi da 934 dong, ung voi 934 can.
- Bang nay khong luu logic duyet giao dich chi tiet; no chi luu trang thai sau
  cung cua moi can tai mot ky public.

## Cach `lich_su_dong_phi_can_ho` dang van hanh hien tai

`lich_su_dong_phi_can_ho` hien khong phai "so cai lich su toan bo tu truoc den
nay". No dang duoc dung theo huong:

1. Sao ke moi sau moc chot di vao `giao_dich_ngan_hang`.
2. Admin duyet giao dich va sinh `phan_bo_giao_dich`.
3. Tu phan bo do, he thong tao `lich_su_dong_phi_can_ho`.
4. Khi tao preview/public, he thong chi lay cac dong lich su:
   - da duoc duyet;
   - chua gan `batch_phi_public_id`.
5. He thong cong vao opening balance/public batch hien hanh de tao batch moi.

Vi vay:

- bang nay rat quan trong voi luong preview/public;
- nhung chua phai kho lich su chuan hoa day du cua giai doan truoc T6/2026.

## Nguyen tac cho tinh nang bo sung giao dich qua khu

Case nghiep vu mau:

- thang 3 co giao dich 1.500.000;
- sao ke co that nhung khong ghi ma can;
- den thang 6 cu dan moi xac nhan do la can `L2.511A`.

Huong dung:

- khong sua tay truc tiep `thang_da_dong_den_hien_tai` trong batch public;
- khong chen gia 1 dong vao `giao_dich_ngan_hang` nhu mot sao ke moi;
- tao mot nguon bo sung rieng, sau do sinh 1 dong vao
  `lich_su_dong_phi_can_ho`.

Luot du lieu de xay dung:

```text
bo_sung_giao_dich_qua_khu
  -> lich_su_dong_phi_can_ho
    -> preview/public moi
```

Y nghia:

- `bo_sung_giao_dich_qua_khu`: luu bang chung va xac minh nghiep vu.
- `lich_su_dong_phi_can_ho`: luu ket qua nghiep vu co hieu luc tinh phi.
- preview/public batch tiep theo se tu dong phan anh thay doi.

Nguyen tac bat buoc cho luong bo sung:

1. Chi `SUPER_ADMIN` duoc thao tac.
2. Bat buoc co ghi chu xac minh.
3. Nen co it nhat 1 bang chung:
   - anh;
   - text xac nhan;
   - ghi chu Zalo/dien thoai.
4. Khong gia mao la sao ke ngan hang neu do la bo sung muon.
5. Moi thay doi phai di theo thu tu:
   - luu chung cu;
   - sinh lich su phi;
   - tinh lai snapshot o lan preview/public tiep theo.

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

## Nguyên tắc dữ liệu hiện hành 2026-07-14

Nguồn dữ liệu chính:

- `can_ho`: danh sách 934 căn.
- `lien_he_can_ho`: danh bạ/liên hệ cư dân đang dùng cho tra cứu nội bộ.
- `lo_nhap_du_lieu`, `dong_sao_ke_tho`, `giao_dich_ngan_hang`: lưu lô import, raw sao kê và giao dịch ngân hàng đã chuẩn hóa/chống trùng.
- `ket_qua_parse_giao_dich`, `ung_vien_khop_giao_dich`: kết quả parser và gợi ý căn hộ.
- `duyet_giao_dich`, `phan_bo_giao_dich`, `chung_tu_doi_soat`: quyết định duyệt, phân bổ nhiều căn và bằng chứng.
- `lich_su_dong_phi_can_ho`: lịch sử phí đã được ghi nhận theo căn.
- `batch_trang_thai_phi_public`, `trang_thai_phi_can_ho_public`: snapshot public cuối cùng cho cư dân tra cứu.
- `bo_sung_giao_dich_qua_khu`: bổ sung/điều chỉnh giao dịch quá khứ, không giả lập giao dịch ngân hàng.

Mốc nghiệp vụ:

- Excel T5 final là mốc quá khứ chuẩn, chốt đến 23:59:00 31/05/2026.
- Từ T6/2026, sao kê ngân hàng là nguồn phát sinh chính.
- Batch public mới chỉ trở thành dữ liệu cư dân thấy sau khi tạo preview và xác nhận public.
- Giao dịch đã public không xóa/gỡ trực tiếp; nếu sai thì dùng giao dịch điều chỉnh hoặc bổ sung có dấu vết.

Nguyên tắc thay đổi DB:

- Chỉ một schema Prisma hoạt động: `prisma/schema.prisma`.
- File schema cũ hoặc thử nghiệm phải chuyển archive, không để song song gây hiểu nhầm.
- Không xóa bảng/cột production nếu chưa chứng minh không còn query và đã có backup.
