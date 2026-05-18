# Checklist triển khai và nghiệm thu hệ thống

## Liên kết xương sống

- Mục lục tài liệu: [README.md](README.md)
- Handoff hiện tại: [handoff.md](handoff.md)
- Roadmap control: [roadmap.md](roadmap.md)
- Database V2: [database-v2.md](database-v2.md)
- Parser mã căn: [parser-ma-can-ho.md](parser-ma-can-ho.md)
- Design system: [design-system.md](design-system.md)
- Production VPS: [production-deploy-vps.md](production-deploy-vps.md)
- Project README: [../README.md](../README.md)

## Mục đích

File này là checklist điều phối triển khai và nghiệm thu. Mỗi task phải trả lời rõ:

- làm gì
- dữ liệu/file nào liên quan
- review ở đâu
- check/test bằng gì
- confirm điều gì trước khi sang bước tiếp theo

File control tiến trình cấp cao vẫn là:

- `docs/roadmap.md`

File này control điều kiện nghiệm thu chi tiết.

Trước khi sang Task N deploy public, phải dùng thêm cổng duyệt thủ công:

- [checklist-duyet-truoc-deploy.md](checklist-duyet-truoc-deploy.md)

## Quy tắc cập nhật

Mỗi khi bắt đầu hoặc hoàn tất task:

- cập nhật trạng thái task trong file này
- cập nhật `docs/roadmap.md` nếu trạng thái cấp cao thay đổi
- cập nhật `docs/handoff.md` nếu là mốc bàn giao lớn

Mỗi khi đổi schema:

- cập nhật `prisma/schema-v2.prisma`
- cập nhật `docs/database-v2.md`
- chạy validate schema
- ghi rõ chưa/chạy migration trong `docs/handoff.md`

Mỗi khi đổi parser mã căn:

- cập nhật `docs/parser-ma-can-ho.md`
- thêm hoặc cập nhật golden test trong `lib/parser/apartment-parser.test.ts`
- nếu ảnh hưởng public lookup, cập nhật `lib/billing/fee-status.test.ts`
- nếu ảnh hưởng lọc giao dịch, cập nhật `docs/filter-rules.vi.md`
- chạy `npm test`

## Quy tắc qua cổng nghiệm thu

Không sang task tiếp theo nếu task hiện tại chưa có đủ:

1. Review: tài liệu/code/schema đã được đọc lại, không mâu thuẫn với roadmap.
2. Check: có lệnh hoặc báo cáo kiểm chứng dữ liệu.
3. Test: có test/build/validate phù hợp với phạm vi thay đổi.
4. Confirm: ghi rõ kết quả vào checklist hoặc handoff.

Với các bước có reset DB, migrate hoặc import dữ liệu thật, phải có backup/snapshot hoặc xác nhận rõ môi trường đang là dev.

## Trạng thái nền đã hoàn thành

Các phần dưới đây đã hoàn thành trước roadmap public web:

- [x] Cấu trúc code mới ưu tiên `src/modules/`
- [x] Database V1 đã thiết kế và migrate
- [x] PostgreSQL local đã chạy được
- [x] Prisma validate/generate đã chạy được
- [x] Import workbook quản lý cũ vào raw V1
- [x] Transform V1 ra `Apartment`, `Resident`, `Occupancy`
- [x] Audit dữ liệu contact từ file quản lý cũ
- [x] Preview contact từ file quản lý cũ
- [x] Đánh giá file `Danh_Sach_Can_Ho_Master.xlsx`
- [x] Preview contact từ file master mới
- [x] Mở rộng `schema-v2.prisma` cho auth, public fee snapshot và contact review

Mốc dữ liệu đã chốt:

- `934` căn hợp lệ
- `884` căn `CHUNG_CU`
- `50` căn `LIEN_KE`
- `LKV.45`, `LKV.47`, `LKV.58` giữ nguyên mã, tính phí như `LIEN_KE`
- file master mới khớp `934/934` mã căn
- preview contact file master mới:
  - `402` căn `NHAP_THANG`
  - `532` căn `CAN_RA_SOAT`
  - `1977` dòng contact preview

---

# Task list hiện tại

## Task A. Chuẩn hóa tài liệu cấp cao

### Mục tiêu

`docs/` là nơi lưu tài liệu xương sống. Người mới vào dự án phải biết đọc file nào trước và file nào control tiến trình.

### File liên quan

- `docs/README.md`
- `docs/roadmap.md`
- `docs/handoff.md`
- `docs/checklist-trien-khai-va-nghiem-thu.md`

### Việc cần làm

- tạo mục lục tài liệu
- tạo roadmap public web
- cập nhật handoff trỏ tới roadmap
- gộp checklist triển khai/nghiệm thu thành file hiện tại

### Review

- đọc lại `docs/README.md`
- đọc lại `docs/roadmap.md`
- kiểm tra thứ tự đọc trong `docs/handoff.md`

### Check/Test

- kiểm tra đủ 4 file tài liệu xương sống
- kiểm tra không còn mâu thuẫn: file control cấp cao là `docs/roadmap.md`, file nghiệm thu là checklist này

### Confirm để qua bước

- [x] `docs/README.md` tồn tại
- [x] `docs/roadmap.md` tồn tại
- [x] `docs/handoff.md` đã trỏ tới README/roadmap
- [x] checklist này đã gộp roadmap + nghiệm thu

### Trạng thái

- [x] Hoàn thành

---

## Task B. Chốt schema V2 mở rộng

### Mục tiêu

Chốt schema mục tiêu để phục vụ:

- căn hộ master
- contact staging/review
- tài khoản quản trị
- phân quyền `SUPER_ADMIN` / `MANAGER`
- import file theo dõi thu phí
- batch public trạng thái phí
- public snapshot cho cư dân tra cứu

### File liên quan

- `prisma/schema-v2.prisma`
- `docs/database-v2.md`
- `docs/roadmap.md`

### Việc cần làm

- bổ sung field gốc từ file master cho `can_ho`
- bổ sung vai trò/trạng thái contact
- bổ sung metadata review cho `ung_vien_lien_he_can_ho`
- thêm `tai_khoan_quan_tri`
- thêm staging `dong_theo_doi_thu_phi_tho`
- thêm `batch_trang_thai_phi_public`
- thêm `trang_thai_phi_can_ho_public`

### Review

- đọc lại schema V2
- đối chiếu với `docs/database-v2.md`
- đối chiếu với roadmap: public không đọc raw/contact

### Check/Test

```bash
npx prisma validate --schema prisma/schema-v2.prisma
```

Kết quả hiện tại:

- schema V2 đã validate thành công

### Confirm để qua bước

- [x] Có role `SUPER_ADMIN`
- [x] Có role `MANAGER`
- [x] Có bảng tài khoản quản trị
- [x] Có bảng staging file theo dõi thu phí
- [x] Có batch public trạng thái phí
- [x] Có snapshot phí public theo căn
- [x] Contact có vai trò/trạng thái/nguồn dữ liệu
- [x] Prisma validate pass
- [x] Đã tạo migration/reset DB dev

### Trạng thái

- [x] Hoàn thành phần schema
- [x] Đã áp dụng vào DB dev

---

## Task C. Migrate/reset DB dev sang V2

### Mục tiêu

Đưa DB dev sang schema V2 mở rộng để bắt đầu import dữ liệu theo pipeline mới.

### File liên quan

- `prisma/schema-v2.prisma`
- `prisma/migrations/`
- `.env`
- `db-sync/`
- `docs/handoff.md`

### Việc cần làm

- backup/snapshot DB dev hiện tại nếu cần giữ
- chuyển Prisma config hoặc lệnh migration sang `schema-v2.prisma`
- tạo migration V2
- reset DB dev
- generate Prisma Client V2
- seed rule phí
- chuẩn bị tài khoản `SUPER_ADMIN` đầu tiên

### Review

- đọc lại `schema-v2.prisma`
- xác nhận DB hiện tại là dev
- xác nhận snapshot cũ có thể restore nếu cần

### Check/Test

Các lệnh kiểm tra tối thiểu:

```bash
npx prisma validate --schema prisma/schema-v2.prisma
npx prisma generate --schema prisma/schema-v2.prisma
```

Sau migration/reset, kiểm tra bằng SQL:

```sql
select count(*) from can_ho;
select count(*) from tai_khoan_quan_tri;
select count(*) from quy_tac_phi;
```

### Confirm để qua bước

- [x] Có migration V2
- [x] DB dev đã reset/migrate thành công
- [x] Prisma Client V2 generate được
- [x] Có seed rule phí `CHUNG_CU = 250000`, `LIEN_KE = 200000`
- [x] Có tài khoản `SUPER_ADMIN` đầu tiên
- [x] `docs/handoff.md` ghi rõ DB đã sang V2

Kết quả thực tế:

- migration: `20260515000100_v2_public_web`
- backup trước migration: `.local/db-backups/apartment_fee_reviewer-before-v2-20260515-163208.sql`
- `npx prisma validate`, `npx prisma generate`, `npm test`, `npm run build` đã pass

### Trạng thái

- [x] Hoàn thành

---

## Task D. Import master căn hộ

### Mục tiêu

Import `Danh_Sach_Can_Ho_Master.xlsx` làm nguồn chính cho `can_ho`.

### File liên quan

- `docs/Danh_Sach_Can_Ho_Master.xlsx`
- `docs/reports/danh-gia-danh-sach-can-ho-master.md`
- bảng `lo_nhap_du_lieu`
- bảng `dong_du_lieu_quan_ly_tho`
- bảng `can_ho`

### Việc cần làm

- import raw sheet `MASTER DATA`
- lưu `header_values_json`, `values_json`, `mapped_row_json`
- sync `934` căn vào `can_ho`
- lưu:
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
- giữ `LKV.*` nguyên mã, tính phí như `LIEN_KE`

### Review

- review mapping cột Excel sang DB
- đối chiếu với báo cáo file master
- kiểm tra các case `LKV.45`, `LKV.47`, `LKV.58`

### Check/Test

Kiểm tra sau import:

```sql
select count(*) from can_ho;
select loai_can, count(*) from can_ho group by loai_can order by loai_can;
select ma_can from can_ho where ma_can in ('LKV.45', 'LKV.47', 'LKV.58');
```

Kỳ vọng:

- `can_ho = 934`
- `CHUNG_CU = 884`
- `LIEN_KE = 50`
- đủ 3 căn `LKV.*`

### Confirm để qua bước

- [x] Import raw master có batch
- [x] `can_ho` có đủ `934` căn
- [x] Không có `ma_can` trùng
- [x] Không có `ma_can` rỗng
- [x] Loại căn đúng
- [x] Có báo cáo/check output sau import

Kết quả thực tế:

- batch master V2: `1`
- `dong_du_lieu_quan_ly_tho`: `934` dòng
- `can_ho`: `934` căn
- `CHUNG_CU`: `884`
- `LIEN_KE`: `50`
- đủ `LKV.45`, `LKV.47`, `LKV.58`

### Trạng thái

- [x] Hoàn thành trong DB V2

---

## Task E. Sinh staging contact từ file master

### Mục tiêu

Sinh `ung_vien_lien_he_can_ho` từ file master, không đổ thẳng contact bẩn vào `lien_he_can_ho`.

### File liên quan

- `docs/Danh_Sach_Can_Ho_Master.xlsx`
- `docs/preview-master-lien-he-can-ho/README.md`
- `docs/preview-master-lien-he-can-ho/preview-tong-hop.csv`
- bảng `ung_vien_lien_he_can_ho`

### Việc cần làm

- đọc `Chủ Hộ (Tên)`
- đọc `Người sử dụng 1..5`
- đọc `SĐT 1..5`
- đọc `Thông tin phụ`
- đọc `Trạng Thái Sử Dụng (Auto)`
- đọc `TÌNH TRẠNG`
- sinh candidate contact
- phân loại `NHAP_THANG` / `CAN_RA_SOAT`
- lưu `ly_do_ra_soat`
- lưu payload gốc để manager xem lại

### Review

- mở `preview-tong-hop.csv`
- mở `can-ra-soat.csv`
- kiểm tra các case có:
  - chủ mới
  - khách thuê
  - tên lẫn số
  - số không tên
  - nhiều căn dùng chung số

### Check/Test

Query tối thiểu:

```sql
select count(*) from ung_vien_lien_he_can_ho;
select co_can_ra_soat, count(*) from ung_vien_lien_he_can_ho group by co_can_ra_soat;
select ma_can, count(*) from ung_vien_lien_he_can_ho group by ma_can order by count(*) desc limit 20;
```

Kỳ vọng tham chiếu từ preview:

- khoảng `1977` dòng contact candidate
- `402` căn nhập tương đối thẳng
- `532` căn cần rà soát

### Confirm để qua bước

- [x] Candidate được sinh vào DB
- [x] Có phân loại cần rà soát
- [x] Có lý do rà soát
- [x] Có payload gốc để review
- [x] Chưa tự nhập toàn bộ vào `lien_he_can_ho`

Kết quả thực tế:

- `ung_vien_lien_he_can_ho`: `1977` dòng
- candidate không cần rà soát: `484` dòng, thuộc `402` căn
- candidate cần rà soát: `1493` dòng, thuộc `532` căn

### Trạng thái

- [x] Hoàn thành trong DB V2

---

## Task F. Seed dữ liệu nền và tài khoản Super Admin

### Mục tiêu

Chuẩn bị dữ liệu tối thiểu để vùng quản trị hoạt động.

### File liên quan

- `prisma/schema-v2.prisma`
- script seed sẽ tạo mới
- bảng `quy_tac_phi`
- bảng `tai_khoan_quan_tri`

### Việc cần làm

- seed `quy_tac_phi`
- tạo tài khoản `SUPER_ADMIN` đầu tiên
- lưu password dạng hash, không lưu plain text
- ghi cách đổi mật khẩu ban đầu vào tài liệu vận hành

### Review

- xác nhận không hardcode password thật trong repo
- xác nhận role admin đúng `SUPER_ADMIN`

### Check/Test

```sql
select loai_can, ma_phi, so_tien from quy_tac_phi;
select ten_dang_nhap, vai_tro, trang_thai from tai_khoan_quan_tri;
```

### Confirm để qua bước

- [x] Có rule phí chung cư/liền kề
- [x] Có Super Admin đầu tiên
- [x] Không commit mật khẩu thật

Kết quả thực tế:

- `quy_tac_phi`: có rule `CHUNG_CU`, `LIEN_KE`
- `tai_khoan_quan_tri`: có user `admin`, role `SUPER_ADMIN`, trạng thái `DANG_HOAT_DONG`
- password dev được truyền qua biến môi trường khi seed, không ghi vào repo

### Trạng thái

- [x] Hoàn thành trên DB dev V2

---

## Task G. Auth và phân quyền quản trị

### Mục tiêu

Tạo vùng nội bộ bắt buộc đăng nhập, phân quyền rõ `SUPER_ADMIN` và `MANAGER`.

### File liên quan

- app/admin hoặc route quản trị sẽ tạo
- bảng `tai_khoan_quan_tri`

### Việc cần làm

- login quản trị
- đăng nhập quản trị bằng `ten_dang_nhap` hoặc số điện thoại
- session/cookie bảo mật
- middleware bảo vệ route quản trị
- role `SUPER_ADMIN`
- role `MANAGER`
- Super Admin quản lý tài khoản manager

### Review

- xác nhận route admin không truy cập được khi chưa login
- xác nhận manager không vào được chức năng Super Admin

### Check/Test

Test thủ công tối thiểu:

- chưa login vào admin bị redirect/login
- Super Admin vào được trang quản trị
- Manager không vào được trang import/chốt public

Test tự động nếu có:

- unit/integration cho guard phân quyền

### Confirm để qua bước

- [x] Login hoạt động
- [x] Login bằng số điện thoại đã có nền schema/code
- [x] Logout hoạt động
- [x] Route admin được bảo vệ
- [x] Role Super Admin đúng quyền
- [x] Role Manager bị chặn quyền nhạy cảm

Kết quả thực tế:

- có route `/admin/login`
- có route `/admin`
- có route `/admin/accounts` chỉ cho `SUPER_ADMIN`
- có route `/admin/import` chỉ cho `SUPER_ADMIN`
- có migration `20260517000100_add_admin_phone_login`
- có trường `tai_khoan_quan_tri.so_dien_thoai`
- form tạo manager bắt buộc nhập số điện thoại đăng nhập
- session lưu bằng cookie HTTP-only có chữ ký
- production bắt buộc có `ADMIN_SESSION_SECRET`
- middleware chặn vùng `/admin`
- Super Admin tạo/khóa manager được ở `/admin/accounts`
- `npm test`: `95` tests pass
- `npm run build`: pass

### Trạng thái

- [x] Hoàn thành phần nền auth/phân quyền

---

## Task H. Import file theo dõi thu phí

### Mục tiêu

Import file Excel theo dõi thu phí thủ công để lấy dữ liệu public cho cư dân.

### File liên quan

- file mẫu hiện tại: `docs/Theo dõi thu phí T4.xlsx`
- file tháng mới sau này: `Theo dõi thu phí T*.xlsx`
- bảng `lo_nhap_du_lieu`
- bảng `dong_theo_doi_thu_phi_tho`

### Việc cần làm

- import raw workbook thu phí
- nhận diện sheet/bảng lịch sử đóng phí
- map mã căn
- map cột `Tháng đã đóng đến hiện tại`
- sinh preview import
- phát hiện mã căn thiếu/sai
- phát hiện tháng bất thường

### Review

- review mapping cột trong file Excel thật
- review danh sách căn không map được
- review căn có tháng đóng bất thường

### Check/Test

Kiểm tra file T4 hiện tại:

- `Danh sách khách hàng`: khoảng `937` dòng có dữ liệu
- `Lịch sử đóng phí`: khoảng `937` dòng có dữ liệu
- kỳ vọng map về khoảng `934` căn hợp lệ

Query sau import:

```sql
select count(*) from dong_theo_doi_thu_phi_tho where lo_nhap_du_lieu_id = 3;
select count(*) from dong_theo_doi_thu_phi_tho where lo_nhap_du_lieu_id = 3 and ma_can is null;
select count(*) from dong_theo_doi_thu_phi_tho where lo_nhap_du_lieu_id = 3 and thang_da_dong_den_hien_tai is null;
```

### Confirm để qua bước

- [x] Raw workbook thu phí đã được lưu
- [x] Mã căn được map
- [x] Cột `Tháng đã đóng đến hiện tại` được đọc
- [x] Có preview lỗi
- [x] Chưa public dữ liệu nháp

Kết quả thực tế:

- script: `npm run import:fee-tracking:v2`
- file: `docs/Theo dõi thu phí T4.xlsx`
- sheet: `Lịch sử đóng phí`
- header row: `3`
- batch import: `lo_nhap_du_lieu.id = 3`
- `dong_theo_doi_thu_phi_tho`: `934` dòng
- mã căn không map được: `0`
- thiếu `Tháng đã đóng đến hiện tại`: `0`
- mã căn distinct: `934`
- không parse được tháng đã đóng: `0`
- đóng lẻ tiền: `3`
- tháng ngoài năm gốc 2026: `31`
- preview: `docs/preview-theo-doi-thu-phi/`
- `npm test`: `43` tests pass
- `npm run build`: pass

### Trạng thái

- [x] Hoàn thành staging import, chưa public

---

## Task I. Chốt batch trạng thái phí public

### Mục tiêu

Chỉ dữ liệu đã được Super Admin chốt mới hiển thị cho cư dân.

### File liên quan

- bảng `batch_trang_thai_phi_public`
- bảng `trang_thai_phi_can_ho_public`
- bảng `dong_theo_doi_thu_phi_tho`

### Việc cần làm

- tạo batch trạng thái phí từ dữ liệu thu phí đã import
- trạng thái: `NHAP`, `DA_KIEM_TRA`, `DA_PUBLIC`, `HUY`
- chỉ một batch được đánh dấu public hiện hành
- lưu người public và thời điểm public

### Review

- Super Admin xem preview trước khi chốt
- kiểm tra số căn trong batch
- kiểm tra căn thiếu dữ liệu tháng đóng

### Check/Test

```sql
select trang_thai, la_batch_public_hien_hanh, count(*)
from batch_trang_thai_phi_public
group by trang_thai, la_batch_public_hien_hanh;

select count(*) from trang_thai_phi_can_ho_public where batch_id = <batch_id>;
```

Kỳ vọng:

- batch public hiện hành có khoảng `934` dòng trạng thái căn
- không có nhiều hơn một batch `la_batch_public_hien_hanh = true`

### Confirm để qua bước

- [x] Có batch trạng thái phí
- [x] Có snapshot phí theo căn
- [x] Chỉ một batch public hiện hành
- [x] Có người chốt và thời điểm chốt

Kết quả hiện tại:

- script tạo batch nháp: `npm run prepare:fee-public-batch:v2`
- import batch nguồn: `lo_nhap_du_lieu.id = 3`
- batch trạng thái phí: `batch_trang_thai_phi_public.id = 2`
- trạng thái batch: `DA_PUBLIC`
- `la_batch_public_hien_hanh = true`
- snapshot phí: `934` dòng
- batch public hiện hành: `1`
- người public: `admin`
- script chốt public: `npm run publish:fee-public-batch:v2 -- --batch-id=2 --admin=admin`
- batch nháp cũ `id = 1` đã chuyển `HUY` vì dùng rule cũ
- không còn dòng lỗi parse tháng
- có `3` dòng đóng lẻ tiền
- có `31` dòng nằm ngoài năm gốc 2026, đã quy đổi được tháng/năm hiển thị

### Trạng thái

- [x] Hoàn thành

---

## Task J. Trang public cư dân tra cứu phí

### Mục tiêu

Cư dân không cần login có thể tra cứu tiến trình đóng phí căn hộ.

### File/bảng liên quan

- bảng `trang_thai_phi_can_ho_public`
- bảng `batch_trang_thai_phi_public`
- public route/page sẽ tạo

### Việc cần làm

- form nhập mã căn
- normalize mã căn
- chỉ đọc batch public hiện hành
- hiển thị:
  - mã căn
  - tháng đã đóng đến hiện tại
  - kỳ dữ liệu
  - thời điểm cập nhật
  - ghi chú public nếu có
- không hiển thị dữ liệu cá nhân

### Review

- kiểm tra UI trên desktop/mobile
- kiểm tra nội dung không lộ phone/CCCD/ghi chú nội bộ

### Check/Test

Test thủ công:

- nhập mã căn hợp lệ có dữ liệu
- nhập mã căn hợp lệ chưa có dữ liệu
- nhập mã căn sai format
- nhập mã căn thường/hoa/khoảng trắng
- không có batch public hiện hành

Test kỹ thuật:

```bash
npm test
npm run build
```

### Confirm để qua bước

- [x] Public page hoạt động không login
- [x] Chỉ đọc batch đã public
- [x] Không lộ dữ liệu nhạy cảm
- [x] Build pass

Kết quả thực tế:

- route public: `/tra-cuu-phi`
- route trang chủ cư dân: `/`
- trang chủ `/` là màn hình đầu tiên khi chạy project, ưu tiên mobile-first
- trang chủ có form tra cứu phí và lối vào quản trị `/admin/login`
- prompt thiết kế mobile-first trên Stitch: `docs/stitch-mobile-ui-prompt.md`
- ví dụ kiểm tra: `/tra-cuu-phi?ma_can=L4A.311A`
- `L4A.311A` hiển thị `đã đóng hết tháng 2 năm 2027`
- `L2.207` hiển thị trạng thái đóng lẻ tiền
- không hiển thị phone/contact/ghi chú nội bộ
- search box dùng parser mã căn hiện có để nhận nhiều kiểu input:
  - `L1.115`
  - `L1 115`
  - `L1115`
  - `can 311A toa L4A`
  - `can 124 lo 4b`
  - `lo 4b can 124`
  - `124lo4b`
  - `LK2-24`
- giới hạn input public tối đa `80` ký tự
- whitelist ký tự cho input tra cứu, chặn chuỗi có ký tự nguy hiểm như `'`, `=`, `<`, `>`
- query DB qua Prisma với candidate list, không nối SQL thủ công
- có rate-limit nhẹ theo IP: tối đa `40` lượt/phút
- `npm test`: `82` tests pass
- `npm run build`: pass
- tài liệu quản trị parser: `docs/parser-ma-can-ho.md`
- dữ liệu parser hiện có đã được gộp vào tài liệu trung tâm:
  - nguồn code/test hiện tại
  - 100 case backlog
  - 6 case thật parser từng bỏ sót từ báo cáo giao dịch 1.500.000 tháng 5/2026
  - quy trình version hóa, golden test, chống false-positive
- kiểm tra giao diện/kỹ thuật sau khi đổi trang chủ:
  - `npm test`: `82` tests pass
  - `npm run build`: pass
  - `/` trả `200`
  - `/tra-cuu-phi?ma_can=L1.115` trả `200`
  - `/admin/login` trả `200`

### Trạng thái

- [x] Hoàn thành phần nền public lookup
- [x] Hoàn thành chuyển trang chủ sang public resident mobile-first

---

## Task K. Dashboard quản lý

### Mục tiêu

Manager xem được dữ liệu căn hộ/contact/phí trong vùng nội bộ.

### Việc cần làm

- [x] tìm căn theo mã
- [x] xem thông tin căn
- [x] xem contact đã duyệt
- [x] xem contact candidate chưa duyệt
- [x] xem ghi chú gốc Excel khi dữ liệu chưa sạch
- [x] xem trạng thái phí public hiện tại
- [x] xem lịch sử import/chốt batch

### Review

- [x] xác nhận dashboard nằm trong vùng `/admin`, bắt buộc login
- [x] xác nhận manager không được cấp chức năng import/chốt batch
- [x] xác nhận dữ liệu contact chỉ hiển thị trong vùng admin, không public

### Check/Test

- route dashboard: `/admin/dashboard`
- chưa login vào `/admin/dashboard?ma_can=L1.115` trả redirect `307` về login
- `/admin/login` trả `200`
- `/tra-cuu-phi?ma_can=L1.115` vẫn trả `200`
- `npm test`: `82` tests pass
- `npm run build`: pass

### Confirm để qua bước

- [x] Dashboard quản lý hoạt động
- [x] Tìm căn đúng qua parser/search
- [x] Xem được contact/ghi chú gốc khi cần
- [x] Quyền manager bị giới hạn đúng ở mức nền: xem dashboard, không vào route import/accounts Super Admin

### Trạng thái

- [x] Hoàn thành phần nền dashboard quản lý

---

## Task L. Màn hình review contact nội bộ

### Mục tiêu

Duyệt contact candidate trước khi chuyển sang `lien_he_can_ho`.

### Việc cần làm

- [x] danh sách candidate
- [x] filter theo căn/trạng thái/chất lượng dữ liệu
- [x] xem ô gốc Excel
- [x] sửa tên/số điện thoại
- [x] chọn vai trò
- [x] chọn liên hệ chính
- [x] chọn nhận thông báo
- [x] duyệt/từ chối
- [x] ghi log người duyệt/thời điểm duyệt vào `payload_duyet_json`

### Review

- [x] route `/admin/contacts/review` nằm trong vùng admin, cần login
- [x] dữ liệu gốc Excel vẫn giữ trong `ung_vien_lien_he_can_ho`
- [x] duyệt không xóa candidate staging
- [x] từ chối chỉ đổi trạng thái candidate, không xóa raw payload

### Check/Test

- route `/admin/contacts/review` khi chưa login trả redirect `307`
- `/admin/login` trả `200`
- `/tra-cuu-phi?ma_can=L1.115` vẫn trả `200`
- smoke test DB dev:
  - candidate `1` được chuyển `DA_DUYET`
  - tạo được contact master từ candidate `1`
  - candidate `2` được chuyển `TU_CHOI`
- `npm test`: `82` tests pass
- `npm run build`: pass

### Confirm để qua bước

- [x] Duyệt contact tạo được master contact
- [x] Từ chối không tạo master contact
- [x] Có log duyệt
- [x] Raw payload vẫn còn

### Trạng thái

- [x] Hoàn thành phần nền review contact nội bộ

---

## Task M. Import sao kê và đối soát DB

### Mục tiêu

Đưa pipeline sao kê từ memory/app cũ vào DB.

### File liên quan

- `docs/lich-su-giao-dich(15-04-2026 09_33_29).xls`
- `docs/filter-rules.vi.md`
- bảng `dong_sao_ke_tho`
- bảng `giao_dich_ngan_hang`
- bảng `ket_qua_parse_giao_dich`
- bảng `ung_vien_khop_giao_dich`
- bảng `duyet_giao_dich`
- bảng `phan_bo_giao_dich`

### Việc cần làm

- [x] import raw sao kê
- [x] tạo fingerprint chống trùng
- [x] chuẩn hóa giao dịch
- [x] parse mã căn
- [x] lưu candidate
- [x] tạo review row mặc định
- [x] tạo allocation một-căn cho giao dịch khớp rõ

### Review

- [x] kiểm tra parser đang lưu `phien_ban_parser`
- [x] kiểm tra trạng thái parse được lưu vào `ket_qua_parse_giao_dich`
- [x] kiểm tra candidate được lưu vào `ung_vien_khop_giao_dich`
- [x] kiểm tra review/allocation được sinh vào DB
- [ ] kiểm tra sâu 6 case parser bỏ sót trong báo cáo giao dịch 1.500.000 tháng 5/2026 ở vòng cải tiến parser tiếp theo:
  - `L3p509`
  - `L4B426...` dính số điện thoại
  - `L3 phong 305`
  - `L4C phong515`
  - `107 lo 2`
  - `L4B p321`
- kiểm tra case nội bộ/không liên quan
- kiểm tra case multi-allocation

### Check/Test

```bash
npm test
```

Query kiểm tra:

```sql
select count(*) from dong_sao_ke_tho;
select count(*) from giao_dich_ngan_hang;
select trang_thai_khop, count(*) from ket_qua_parse_giao_dich group by trang_thai_khop;
```

Kết quả thực tế:

- script: `npm run import:bank-statement:v2`
- file: `docs/lich-su-giao-dich(15-04-2026 09_33_29).xls`
- batch import mới nhất: `lo_nhap_du_lieu.id = 7`
- `dong_sao_ke_tho`: `125`
- `giao_dich_ngan_hang`: `125`
- `ket_qua_parse_giao_dich`: `125`
- `duyet_giao_dich`: `125`
- `phan_bo_giao_dich`: `101`
- trạng thái parse:
  - `KHOP_TRUC_TIEP`: `42`
  - `KHOP_SAU_CHUAN_HOA`: `59`
  - `NHIEU_CAN`: `4`
  - `CHUA_NHAN_DIEN_DUOC_CAN`: `2`
  - `KHONG_LIEN_QUAN_CAN_HO`: `18`
- `npm test`: `82` tests pass
- `npm run build`: pass

### Confirm để qua bước

- [x] Sao kê import không trùng theo fingerprint/tham chiếu ngân hàng
- [x] Transaction được chuẩn hóa
- [x] Parse result được lưu
- [x] Candidate được lưu
- [x] Review/allocation được lưu

### Trạng thái

- [x] Hoàn thành phần nền import sao kê và đối soát DB

---

## Task N. Hoàn thiện project để khởi chạy ổn định

### Mục tiêu

Hoàn thiện project ở mức có thể khởi chạy ổn định trên local/staging trước khi deploy thật.

### Việc cần làm

- kiểm tra trang chủ cư dân mobile-first
- áp dụng design system từ [design-system.md](design-system.md)
- kiểm tra public lookup không login
- kiểm tra login admin bằng username và số điện thoại
- kiểm tra dashboard quản lý
- kiểm tra review contact
- kiểm tra import sao kê/đối soát DB
- kiểm tra export Excel vận hành
- chuẩn hóa runbook khởi chạy project
- đảm bảo test/build pass

### Review

- review route public/admin trên máy dev
- review tài khoản `admin`, SĐT `0904802553`, role `SUPER_ADMIN`
- review dữ liệu public không lộ SĐT/tên cư dân/ghi chú nội bộ
- review file export Excel chỉ dùng nội bộ

### Check/Test

- build production pass
- public page hoạt động
- admin login hoạt động
- export Excel chạy thử và đọc được trên máy local
- route admin nhạy cảm redirect khi chưa login
- `npm test` pass

### Confirm để qua bước

- [x] Public page hoạt động trên dev
- [x] Design system Stitch đã chuyển thành pattern nội bộ, không copy HTML prototype
- [x] Admin login có nền số điện thoại
- [x] SĐT `0904802553` đã gắn với `admin` role `SUPER_ADMIN`
- [x] Export Excel hoạt động như bản lưu vận hành trên máy dev
- [x] `npm test` pass
- [x] `npm run build` pass
- [ ] Chủ dự án duyệt giao diện mobile thực tế
- [ ] Chủ dự án duyệt dữ liệu public không lộ thông tin nhạy cảm

### Trạng thái

- [ ] Đang làm

---

## Task O. Deploy public web lên VPS

### Mục tiêu

Đưa web lên môi trường public an toàn. Đây là bước cuối của roadmap version hiện tại, chỉ làm sau khi Task N đạt.

Quyết định production chi tiết: [production-deploy-vps.md](production-deploy-vps.md).

### Việc cần làm

- chủ dự án duyệt [checklist-duyet-truoc-deploy.md](checklist-duyet-truoc-deploy.md)
- deploy trên VPS
- cài PostgreSQL trên cùng VPS
- cấu hình domain `noxhandong.com` sau khi mua và trỏ DNS
- cấu hình HTTPS
- cấu hình env production
- cấu hình backup DB bằng VPS snapshot và `pg_dump`
- tạo admin production
- kiểm tra public page không lộ dữ liệu nhạy cảm

### Review

- review biến môi trường production
- review quyền DB
- review route public/admin
- review Super Admin production và danh sách người giữ quyền

### Check/Test

- build production pass
- public page hoạt động
- admin login hoạt động
- backup DB chạy thử
- restore thử một bản `pg_dump`
- export Excel chạy thử và đọc được trên máy local

### Confirm để qua bước

- [ ] Domain/HTTPS hoạt động
- [ ] Public page hoạt động
- [ ] Admin login hoạt động
- [ ] Backup DB có quy trình rõ và có `pg_dump`
- [ ] Super Admin production đã được bàn giao đúng người, không dùng mật khẩu dev
- [ ] Không lộ dữ liệu nhạy cảm

### Trạng thái

- [ ] Chưa làm

---

# Thứ tự triển khai bắt buộc

1. Task C: Migrate/reset DB dev sang V2
2. Task D: Import master căn hộ
3. Task E: Sinh staging contact từ file master
4. Task F: Seed dữ liệu nền và tài khoản Super Admin
5. Task G: Auth và phân quyền quản trị
6. Task H: Import file theo dõi thu phí
7. Task I: Chốt batch trạng thái phí public
8. Task J: Trang public cư dân tra cứu phí
9. Task K: Dashboard quản lý
10. Task L: Màn hình review contact nội bộ
11. Task M: Import sao kê và đối soát DB
12. Task N: Hoàn thiện project để khởi chạy ổn định
13. Task O: Deploy public web lên VPS

Task A-M đã hoàn thành theo checklist hiện tại. Hiện tại đang ở Task N. Task O là bước cuối và chưa làm.

# Quy trình sau mỗi task

Sau mỗi task phải làm 4 việc:

1. Chạy check/test tương ứng trong task.
2. Ghi kết quả vào task đó.
3. Cập nhật `docs/roadmap.md`.
4. Nếu là mốc lớn, cập nhật `docs/handoff.md`.

Nếu task thất bại:

- không sang task tiếp theo
- ghi rõ lỗi
- ghi rõ dữ liệu/file bị ảnh hưởng
- sửa hoặc rollback trước khi tiếp tục
