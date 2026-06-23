# Task: bo sung giao dich qua khu

Cap nhat: 2026-06-22

## Muc tieu

Tao mot luong nghiep vu tren app de bo sung cac khoan thu phi qua khu duoc xac
minh muon, thay vi sua tay DB.

Case mau:

- giao dich T3/2026 co that ngoai ngan hang;
- luc import sao ke khong co ma can;
- den T6/2026 cu dan moi xac nhan do la can `L2.511A`;
- can co cach ghi nhan vao he thong ma khong gia mao thanh sao ke moi.

## Ket qua mong muon

Admin co the tao 1 ban ghi bo sung qua khu, gan cho can ho cu the, luu bang
chung va de he thong sinh lich su phi hop le cho can do.

## Nguyen tac thiet ke

1. Khong chen gia giao dich vao `giao_dich_ngan_hang`.
2. Khong sua text trang thai public truc tiep trong
   `trang_thai_phi_can_ho_public`.
3. Luu chung cu va audit rieng.
4. Ket qua nghiep vu co hieu luc phai di vao `lich_su_dong_phi_can_ho`.
5. Preview/public batch tiep theo se tu tinh lai trang thai can.

## Luong du lieu de xuat

```text
bo_sung_giao_dich_qua_khu
  -> lich_su_dong_phi_can_ho
    -> batch_trang_thai_phi_public / trang_thai_phi_can_ho_public
```

## Schema toi thieu de xuat

Bang moi: `bo_sung_giao_dich_qua_khu`

Cot toi thieu:

- `id`
- `can_ho_id`
- `ma_can_snapshot`
- `so_tien`
- `ngay_giao_dich_goc`
- `ky_du_lieu_muc_tieu` hoac `thang_ap_dung`
- `loai_bang_chung`
- `duong_dan_file`
- `ten_file_goc`
- `ghi_chu_xac_minh`
- `nguoi_tao_id`
- `ngay_tao`
- `trang_thai`
- `lich_su_dong_phi_id` nullable sau khi da sinh ket qua

Khong can them cot parser/phien ban parser vao bang nay, vi day khong phai luong
import sao ke.

## Form admin de xuat

Chi cho `SUPER_ADMIN`.

Nhap:

- ma can
- so tien
- ngay giao dich goc
- loai bang chung: anh / text / xac nhan dien thoai / Zalo
- file bang chung hoac ghi chu
- ghi chu noi bo

Nut:

- `Luu bo sung`
- `Luu va sinh lich su phi`

## Luong xu ly khi luu

1. Validate can ho ton tai.
2. Validate so tien > 0.
3. Validate co ghi chu xac minh hoac file bang chung.
4. Tao `bo_sung_giao_dich_qua_khu`.
5. Tao 1 dong `lich_su_dong_phi_can_ho` voi:
   - `loai_nguon = BO_SUNG_QUA_KHU`
   - `so_tien = so_tien bo sung`
   - `ghi_chu` tham chieu den xac minh
   - `nguoi_tao_id`
6. Gan lai `lich_su_dong_phi_id` vao bang bo sung.
7. Revalidate man tra cuu noi bo va man preview/public.

## Hien thi tren tra cuu noi bo

Can hien mot nhom rieng:

- Giao dich bo sung thu cong
- So tien
- Ngay giao dich goc
- Nguon: Bo sung qua khu
- Bang chung / ghi chu
- Nguoi nhap
- Thoi gian nhap

De sau nay nhin vao la biet day khong phai sao ke parser tu dong.

## Ranh gioi nghiep vu

Luong nay chi dung cho:

- giao dich qua khu xac minh muon;
- giao dich cu dan bao lai bang anh / Zalo / dien thoai;
- cac truong hop ngoai le truoc khi he thong bat dau van hanh sao ke chinh thuc
  tu T6/2026.

Khong dung luong nay de thay the import sao ke thong thuong.

## Trang thai

- Backlog Phase 2.
- Chua code.
- Se lam sau khi on dinh luong sao ke T6+ va deploy Phase 2 an toan.
