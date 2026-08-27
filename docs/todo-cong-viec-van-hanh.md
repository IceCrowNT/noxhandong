# Todo tinh nang cong viec van hanh


## 1. Muc tieu nghiep vu

- [ ] Admin/quan ly tao cong viec cho 2 bo phan: `KY_THUAT`, `VE_SINH`.
- [ ] Bo phan xem danh sach cong viec trong menu `Van hanh`.
- [ ] Bo phan chi duoc tich `Da bao xong / Cho nghiem thu`.
- [ ] Sau khi bo phan tich xong, checkbox nay bi khoa, khong cho tu bo tich.
- [ ] Admin/quan ly dong cong viec bang dropdown trang thai.
- [ ] Cong viec da dong co the an khoi danh sach mac dinh, nhung van xem/lop lai duoc qua filter.
- [ ] Co log lich su ai lam gi, luc nao.

## 2. Thiet ke trang thai

Khong dung checkbox admin `Hoan thanh` nua. Dung dropdown dong viec.

Trang thai dong viec:

- `DANG_MO`: chua dong.
- `HOAN_THANH`: da hoan thanh va admin/quan ly xac nhan.
- `BO_QUA`: khong lam nua.
- `THAY_DOI`: cong viec da thay doi/thay the bang viec khac.

Trang thai qua han:

- [ ] Khong luu cung thanh enum chinh.
- [ ] Tu tinh bang `deadline < now` va `trang_thai_dong = DANG_MO`.
- [ ] Neu da dong sau deadline thi hien la `Hoan thanh tre` hoac ghi trong log, khong can tao enum rieng.

## 3. Thiet ke DB

De xuat dung 2 bang.

### 3.1. Bang `cong_viec_van_hanh`

- [ ] `id`
- [ ] `stt_hien_thi`
- [ ] `thoi_diem_giao_viec`
- [ ] `ten_cong_viec`
- [ ] `mo_ta`
- [ ] `bo_phan`: `KY_THUAT` | `VE_SINH`
- [ ] `deadline`
- [ ] `da_bao_xong`
- [ ] `bao_xong_luc`
- [ ] `nguoi_bao_xong_id`
- [ ] `trang_thai_dong`: `DANG_MO` | `HOAN_THANH` | `BO_QUA` | `THAY_DOI`
- [ ] `dong_luc`
- [ ] `nguoi_dong_id`
- [ ] `ghi_chu_dong`
- [ ] `da_xoa`
- [ ] `nguoi_tao_id`
- [ ] `nguoi_cap_nhat_id`
- [ ] `ngay_tao`
- [ ] `ngay_cap_nhat`

Index/constraint nen co:

- [ ] Index `bo_phan`.
- [ ] Index `trang_thai_dong`.
- [ ] Index `deadline`.
- [ ] Index `da_xoa`.
- [ ] Foreign key toi `tai_khoan_quan_tri` cho nguoi tao/cap nhat/bao xong/dong.

### 3.2. Bang `nhat_ky_cong_viec_van_hanh`

- [ ] `id`
- [ ] `cong_viec_id`
- [ ] `hanh_dong`: `TAO` | `SUA` | `BAO_XONG` | `DONG_VIEC` | `MO_LAI` | `XOA_MEM`
- [ ] `noi_dung`
- [ ] `nguoi_thuc_hien_id`
- [ ] `thoi_diem`
- [ ] `payload_json`

## 4. Phan quyen

Permission de xuat:

- [ ] Them `VIEW_OPERATION_TASKS`.
- [ ] Them `MANAGE_OPERATION_TASKS`.

Gan quyen:

- [ ] `SUPER_ADMIN`: view + manage.
- [ ] `MANAGER`: view + manage.
- [ ] `TECHNICIAN`: view, bao xong, khong manage.

Can cap nhat:

- [ ] `src/modules/auth/permissions.ts`.
- [ ] `permissionForAdminPath`.
- [ ] `components/admin/admin-navigation.tsx`.
- [ ] `app/admin/accounts/page.tsx` bang mo ta role.

## 5. Route va UI

Route de xuat:

- [ ] `/admin/tasks` hoac `/admin/operation-tasks`.
- [ ] Menu nam trong nhom `Van hanh`, label `Cong viec van hanh`.

### 5.1. UI admin/manager

- [ ] Form tao cong viec:
  - Ten cong viec.
  - Mo ta/ghi chu.
  - Bo phan dropdown: Ky thuat, Ve sinh.
  - Deadline.
- [ ] Bang danh sach:
  - STT.
  - Thoi diem giao viec.
  - Ten cong viec.
  - Bo phan.
  - Deadline.
  - Checkbox `Da bao xong`.
  - Dropdown `Trang thai dong`.
  - Thao tac sua/xoa mem.
- [ ] Admin/manager duoc sua cong viec khi `trang_thai_dong = DANG_MO`.
- [ ] Cong viec da dong chi cho xem, khong sua noi dung tru khi co action `Mo lai`.
- [ ] Xoa la xoa mem bang `da_xoa = true`.

### 5.2. UI technician

- [ ] Chi xem danh sach cong viec.
- [ ] Chi thao tac duoc checkbox `Da bao xong`.
- [ ] Khong thay form tao viec.
- [ ] Khong thay nut sua/xoa.
- [ ] Khong thao tac dropdown dong viec.

### 5.3. Summary card va filter

Card tom tat nen co:

- [ ] Chua bao xong.
- [ ] Cho nghiem thu.
- [ ] Qua han.
- [ ] Da dong.

Tuong tac:

- [ ] Click card `Chua bao xong` -> filter danh sach viec chua bao xong.
- [ ] Click card `Cho nghiem thu` -> filter viec da bao xong nhung chua dong.
- [ ] Click card `Qua han` -> filter viec qua deadline va chua dong.
- [ ] Click card `Da dong` -> filter viec da dong.

Bang danh sach:

- [ ] Sort duoc khi bam title cot `Thoi diem giao`.
- [ ] Sort duoc theo `Bo phan`.
- [ ] Sort duoc theo `Deadline`.
- [ ] Sort duoc theo `Trang thai dong`.
- [ ] Mac dinh: an cong viec da dong, sap xep viec qua han va deadline gan len tren.

## 6. Server actions

- [ ] `createOperationTaskAction`
- [ ] `updateOperationTaskAction`
- [ ] `softDeleteOperationTaskAction`
- [ ] `markOperationTaskDoneAction`
- [ ] `closeOperationTaskAction`
- [ ] `reopenOperationTaskAction` neu can.

Nguyen tac:

- [ ] Moi action phai goi `requirePermission`.
- [ ] Action manage phai yeu cau `MANAGE_OPERATION_TASKS`.
- [ ] Action bao xong cho phep `VIEW_OPERATION_TASKS`, nhung chi khi task chua dong.
- [ ] `markOperationTaskDoneAction` chi cho set tu false -> true.
- [ ] Khong cho bo tich `da_bao_xong` tu UI phong ban.
- [ ] Moi action ghi log vao `nhat_ky_cong_viec_van_hanh`.

## 7. Validation nghiep vu

- [ ] Ten cong viec bat buoc.
- [ ] Bo phan chi nhan `KY_THUAT` hoac `VE_SINH`.
- [ ] Deadline bat buoc hay optional can chot truoc khi code. De xuat: bat buoc.
- [ ] Khong cho bao xong neu task da dong.
- [ ] Khong cho dong viec neu da xoa.
- [ ] Khong cho technician dong viec.
- [ ] Khong xoa cung task da co log.

## 8. Log lich su

Log can ghi:

- [ ] Tao cong viec.
- [ ] Sua ten/mo ta/bo phan/deadline.
- [ ] Bo phan bao xong.
- [ ] Admin/manager dong viec.
- [ ] Mo lai cong viec, neu co.
- [ ] Xoa mem.

UI log:

- [ ] Card log gan day o trang cong viec.
- [ ] Moi dong log hien: thoi diem, nguoi thao tac, hanh dong, noi dung ngan.
- [ ] Neu can, click task de xem log rieng cua task.

## 9. Test can co

Unit/integration test:

- [ ] Permission: Super Admin/Manager manage duoc, Technician khong manage duoc.
- [ ] Technician bao xong duoc viec dang mo.
- [ ] Technician khong bo tich bao xong.
- [ ] Admin dong viec bang `HOAN_THANH`.
- [ ] Admin dong viec bang `BO_QUA`.
- [ ] Admin dong viec bang `THAY_DOI`.
- [ ] Task da dong khong hien trong danh sach mac dinh.
- [ ] Filter card hien dung.
- [ ] Sort theo deadline/trang thai/bo phan dung.
- [ ] Moi action tao log dung.

Manual UI test:

- [ ] Dang nhap Super Admin: tao/sua/xoa/dong task.
- [ ] Dang nhap Manager: tao/sua/xoa/dong task.
- [ ] Dang nhap Technician: xem va bao xong.
- [ ] Kiem tra responsive mobile/tablet.
- [ ] Kiem tra task qua deadline duoc highlight.

Lenh can chay:

- [ ] `npm test`
- [ ] `npm run prisma:validate`
- [ ] `npm run build`

## 10. Deploy VPS

- [ ] Backup DB truoc khi deploy.
- [ ] Tao Prisma migration cho 2 bang moi va enum neu dung enum DB.
- [ ] Chay local migration truoc.
- [ ] Chay `npm run prisma:migrate:deploy` tren VPS.
- [ ] Deploy code.
- [ ] Verify menu va permissions tren production.
- [ ] Tao 1 task test cho Ky thuat, 1 task test cho Ve sinh.
- [ ] Technician bao xong task test.
- [ ] Admin dong task test.
- [ ] Kiem tra log da ghi dung.

## 11. Tieu chi nghiem thu

- [ ] Admin/manager quan ly duoc cong viec.
- [ ] Technician chi xem va bao xong.
- [ ] Dropdown dong viec thay checkbox admin.
- [ ] Cong viec da dong bi an mac dinh nhung loc lai duoc.
- [ ] Summary card click de filter duoc.
- [ ] Bang sort theo cac cot chinh.
- [ ] Log lich su day du.
- [ ] Khong anh huong cac module phi, sao ke, thong bao hien co.
