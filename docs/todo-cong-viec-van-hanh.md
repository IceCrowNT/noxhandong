# Todo tinh nang cong viec van hanh

## Trang thai thuc hien hien tai

- [x] Them Prisma schema cho `cong_viec_van_hanh` va `nhat_ky_cong_viec_van_hanh`.
- [x] Them migration `20260827090000_add_operation_tasks`.
- [x] Da migrate local DB bang `npm run prisma:migrate:dev -- --name add_operation_tasks`.
- [x] Da query duoc 2 bang moi tren local DB, hien deu 0 ban ghi.
- [x] Them tai lieu deploy DB/VPS tai `docs/deploy-cong-viec-van-hanh-vps.md`.
- [x] Them permission `VIEW_OPERATION_TASKS` va `MANAGE_OPERATION_TASKS`.
- [x] Them menu `Cong viec van hanh` trong nhom `Van hanh`.
- [x] Them route `/admin/operation-tasks`.
- [x] Them UI tao/sua/xoa mem/dong cong viec cho Super Admin va Manager.
- [x] Them UI xem va bao xong cho Technician.
- [x] Them summary card filter va sort header tren bang.
- [x] Them card log thao tac gan day.
- [x] Chay `npm run prisma:validate`, `npm run prisma:generate`, `npm test`, `npm run build`, `npx tsc --noEmit`.
- [ ] Test thu tren browser voi tai khoan Super Admin/Manager/Technician.


## 1. Muc tieu nghiep vu

- [x] Admin/quan ly tao cong viec cho cac bo phan: `KY_THUAT`, `VE_SINH`, `HANH_CHINH`, `TONG_HOP`.
- [x] Bo phan xem danh sach cong viec trong menu `Van hanh`.
- [x] Bo phan chi duoc tich `Da bao xong / Cho nghiem thu`.
- [x] Sau khi bo phan tich xong, checkbox nay bi khoa, khong cho tu bo tich.
- [x] Admin/quan ly dong cong viec bang dropdown trang thai.
- [x] Cong viec da dong co the an khoi danh sach mac dinh, nhung van xem/lop lai duoc qua filter.
- [x] Co log lich su ai lam gi, luc nao.

## 2. Thiet ke trang thai

Khong dung checkbox admin `Hoan thanh` nua. Dung dropdown dong viec.

Trang thai dong viec:

- `DANG_MO`: chua dong.
- `HOAN_THANH`: da hoan thanh va admin/quan ly xac nhan.
- `BO_QUA`: khong lam nua.
- `THAY_DOI`: cong viec da thay doi/thay the bang viec khac.

Trang thai qua han:

- [x] Khong luu cung thanh enum chinh.
- [x] Tu tinh bang `deadline < now` va `trang_thai_dong = DANG_MO`.
- [ ] Neu da dong sau deadline thi hien la `Hoan thanh tre` hoac ghi trong log, khong can tao enum rieng.

## 3. Thiet ke DB

De xuat dung 2 bang.

### 3.1. Bang `cong_viec_van_hanh`

- [x] `id`
- [x] `stt_hien_thi`
- [x] `thoi_diem_giao_viec`
- [x] `ten_cong_viec`
- [x] `mo_ta`
- [x] `bo_phan`: `KY_THUAT` | `VE_SINH` | `HANH_CHINH` | `TONG_HOP`
- [x] `deadline`
- [x] `da_bao_xong`
- [x] `bao_xong_luc`
- [x] `nguoi_bao_xong_id`
- [x] `trang_thai_dong`: `DANG_MO` | `HOAN_THANH` | `BO_QUA` | `THAY_DOI`
- [x] `dong_luc`
- [x] `nguoi_dong_id`
- [x] `ghi_chu_dong`
- [x] `da_xoa`
- [x] `nguoi_tao_id`
- [x] `nguoi_cap_nhat_id`
- [x] `ngay_tao`
- [x] `ngay_cap_nhat`

Index/constraint nen co:

- [x] Index `bo_phan`.
- [x] Index `trang_thai_dong`.
- [x] Index `deadline`.
- [x] Index `da_xoa`.
- [x] Foreign key toi `tai_khoan_quan_tri` cho nguoi tao/cap nhat/bao xong/dong.

### 3.2. Bang `nhat_ky_cong_viec_van_hanh`

- [x] `id`
- [x] `cong_viec_id`
- [x] `hanh_dong`: `TAO` | `SUA` | `BAO_XONG` | `DONG_VIEC` | `MO_LAI` | `XOA_MEM`
- [x] `noi_dung`
- [x] `nguoi_thuc_hien_id`
- [x] `thoi_diem`
- [x] `payload_json`

## 4. Phan quyen

Permission de xuat:

- [x] Them `VIEW_OPERATION_TASKS`.
- [x] Them `MANAGE_OPERATION_TASKS`.

Gan quyen:

- [x] `SUPER_ADMIN`: view + manage.
- [x] `MANAGER`: view + manage.
- [x] `TECHNICIAN`: view, bao xong, khong manage.

Can cap nhat:

- [x] `src/modules/auth/permissions.ts`.
- [x] `permissionForAdminPath`.
- [x] `components/admin/admin-navigation.tsx`.
- [x] `app/admin/accounts/page.tsx` bang mo ta role.

## 5. Route va UI

Route de xuat:

- [x] `/admin/tasks` hoac `/admin/operation-tasks`.
- [x] Menu nam trong nhom `Van hanh`, label `Cong viec van hanh`.

### 5.1. UI admin/manager

- [x] Form tao cong viec:
  - Ten cong viec.
  - Mo ta/ghi chu.
  - Bo phan dropdown: Ky thuat, Ve sinh, Hanh chinh, Tong hop.
  - Deadline.
- [x] Bang danh sach:
  - STT.
  - Thoi diem giao viec.
  - Ten cong viec.
  - Bo phan.
  - Deadline.
  - Checkbox `Da bao xong`.
  - Dropdown `Trang thai dong`.
  - Thao tac sua/xoa mem.
- [x] Admin/manager duoc sua cong viec khi `trang_thai_dong = DANG_MO`.
- [x] Cong viec da dong chi cho xem, khong sua noi dung tru khi co action `Mo lai`.
- [x] Xoa la xoa mem bang `da_xoa = true`.

### 5.2. UI technician

- [x] Chi xem danh sach cong viec.
- [x] Chi thao tac duoc checkbox `Da bao xong`.
- [x] Khong thay form tao viec.
- [x] Khong thay nut sua/xoa.
- [x] Khong thao tac dropdown dong viec.

### 5.3. Summary card va filter

Card tom tat nen co:

- [x] Bo qua card rieng `Chua bao xong`; giu card `Dang mo` theo quyet dinh nghiep vu.
- [x] Cho nghiem thu.
- [x] Qua han.
- [x] Da dong.

Tuong tac:

- [x] Bo qua filter rieng `Chua bao xong`; khong can tach khoi `Dang mo`.
- [x] Click card `Cho nghiem thu` -> filter viec da bao xong nhung chua dong.
- [x] Click card `Qua han` -> filter viec qua deadline va chua dong.
- [x] Click card `Da dong` -> filter viec da dong.

Bang danh sach:

- [x] Sort duoc khi bam title cot `Thoi diem giao`.
- [x] Sort duoc theo `Bo phan`.
- [x] Sort duoc theo `Deadline`.
- [x] Sort duoc theo `Trang thai dong`.
- [x] Mac dinh: an cong viec da dong, sap xep viec qua han va deadline gan len tren.

## 6. Server actions

- [x] `createOperationTaskAction`
- [x] `updateOperationTaskAction`
- [x] `softDeleteOperationTaskAction`
- [x] `markOperationTaskDoneAction`
- [x] `closeOperationTaskAction`
- [ ] `reopenOperationTaskAction` neu can.

Nguyen tac:

- [x] Moi action phai goi `requirePermission`.
- [x] Action manage phai yeu cau `MANAGE_OPERATION_TASKS`.
- [x] Action bao xong cho phep `VIEW_OPERATION_TASKS`, nhung chi khi task chua dong.
- [x] `markOperationTaskDoneAction` chi cho set tu false -> true.
- [x] Khong cho bo tich `da_bao_xong` tu UI phong ban.
- [x] Moi action ghi log vao `nhat_ky_cong_viec_van_hanh`.

## 7. Validation nghiep vu

- [x] Ten cong viec bat buoc.
- [x] Bo phan chi nhan `KY_THUAT`, `VE_SINH`, `HANH_CHINH`, `TONG_HOP`.
- [x] Deadline bat buoc hay optional can chot truoc khi code. De xuat: bat buoc.
- [x] Khong cho bao xong neu task da dong.
- [x] Khong cho dong viec neu da xoa.
- [x] Khong cho technician dong viec.
- [x] Khong xoa cung task da co log.

## 8. Log lich su

Log can ghi:

- [x] Tao cong viec.
- [x] Sua ten/mo ta/bo phan/deadline.
- [x] Bo phan bao xong.
- [x] Admin/manager dong viec.
- [ ] Mo lai cong viec, neu co.
- [x] Xoa mem.

UI log:

- [x] Card log gan day o trang cong viec.
- [x] Moi dong log hien: thoi diem, nguoi thao tac, hanh dong, noi dung ngan.
- [ ] Neu can, click task de xem log rieng cua task.

## 9. Test can co

Unit/integration test:

- [x] Permission: Super Admin/Manager manage duoc, Technician khong manage duoc.
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

- [x] `npm test`
- [x] `npm run prisma:validate`
- [x] `npm run build`

## 10. Deploy VPS

- [ ] Backup DB truoc khi deploy.
- [x] Tao Prisma migration cho 2 bang moi va enum neu dung enum DB.
- [x] Chay local migration truoc.
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
