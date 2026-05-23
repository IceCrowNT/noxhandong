# Handoff Dự Án

## Liên kết xương sống

- Mục lục tài liệu: [README.md](README.md)
- Roadmap control: [roadmap.md](roadmap.md)
- Checklist nghiệm thu: [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md)
- Database V2: [database-v2.md](database-v2.md)
- Parser mã căn: [parser-ma-can-ho.md](parser-ma-can-ho.md)
- Design system: [design-system.md](design-system.md)
- Setup máy mới/database: [setup-may-moi-va-database.md](setup-may-moi-va-database.md)
- Production VPS: [production-deploy-vps.md](production-deploy-vps.md)

## Mục đích

File này dùng để:

- bàn giao nhanh trạng thái dự án giữa các máy
- giúp agent hoặc lập trình viên khác nắm được đang ở bước nào
- biết phải đọc gì trước khi tiếp tục làm
- tránh phải dựa vào lịch sử chat làm nguồn chính

## Ngày cập nhật

- 2026-04-21
- Bổ sung tài liệu roadmap/mục lục: 2026-05-14
- Migrate DB dev sang V2, import master và sinh contact candidate: 2026-05-15
- Gộp dữ liệu parser mã căn vào tài liệu trung tâm: 2026-05-15
- Hoàn thành nền dashboard quản lý Task K: 2026-05-15
- Hoàn thành nền review contact nội bộ Task L: 2026-05-16
- Hoàn thành nền import sao kê và đối soát DB Task M: 2026-05-16
- Tối ưu hướng mobile-first cho trang cư dân và tạo cổng duyệt trước deploy: 2026-05-16
- Chốt hướng production VPS, PostgreSQL cùng VPS, domain dự kiến `noxhandong.com`: 2026-05-16
- Chuẩn bị nền production: admin login bằng số điện thoại, script `pg_dump`, export Excel vận hành: 2026-05-17
- Gắn SĐT `0904802553` cho tài khoản `admin` role `SUPER_ADMIN`; deploy VPS chuyển thành bước cuối: 2026-05-17
- Chuyển design Stitch thành design system nội bộ và chỉnh public UI/copy theo nghiệp vụ BQT An Đồng: 2026-05-17
- Rà soát 934 căn trong DB, tạo báo cáo dữ liệu thật và đề xuất mô hình DB/tình huống cư dân: 2026-05-18
- Thêm ảnh nền chung cư xanh local, tối giản trang chủ theo hướng search-bar landing page: 2026-05-18
- Chốt index là search-bar landing page; góp ý dài hạn để ở backlog, mục tiêu hiện tại vẫn là Task N local/staging readiness: 2026-05-19

## Trạng thái hiện tại

Dự án đã đi qua các bước nền tảng:

- chốt `database v1`
- dựng `Prisma schema`
- cài `PostgreSQL` local
- chạy migration đầu tiên
- import raw workbook quản lý vào DB
- transform master data từ workbook quản lý
- thiết kế `database v2` cho phần cư dân/import
- chuyển `v2` sang mô hình contact-centric theo căn hộ
- chạy audit thật trên cột `THÔNG TIN CƯ DÂN` từ file Excel quản lý
- tạo `docs/README.md` và `docs/roadmap.md` làm tài liệu control cấp cao
- mở rộng `prisma/schema-v2.prisma` cho auth quản trị, public fee snapshot và import file theo dõi thu phí
- validate `schema-v2.prisma` thành công
- tạo migration V2 `20260515000100_v2_public_web`
- backup DB dev trước migration vào `.local/db-backups/apartment_fee_reviewer-before-v2-20260515-163208.sql`
- áp dụng migration V2 vào DB dev
- chuyển `prisma.config.ts` sang dùng `prisma/schema-v2.prisma`
- generate Prisma Client theo schema V2
- seed rule phí nền và tài khoản `SUPER_ADMIN` đầu tiên
- import `Danh_Sach_Can_Ho_Master.xlsx` vào `can_ho`
- sinh `ung_vien_lien_he_can_ho` từ file master mới
- triển khai nền auth/phân quyền quản trị:
  - `/admin/login`
  - `/admin`
  - `/admin/accounts`
  - `/admin/import`
  - middleware bảo vệ vùng `/admin`
  - cookie session HTTP-only có chữ ký
  - đăng nhập bằng `ten_dang_nhap` hoặc `so_dien_thoai`
  - migration `20260517000100_add_admin_phone_login`
  - tài khoản `admin` có SĐT đăng nhập `0904802553`, role `SUPER_ADMIN`
- import file theo dõi thu phí T4 vào staging:
  - script `npm run import:fee-tracking:v2`
  - batch `lo_nhap_du_lieu.id = 3`
  - `dong_theo_doi_thu_phi_tho`: `934` dòng
  - mã căn không map được: `0`
  - thiếu tháng đã đóng: `0`
  - không parse được tháng đã đóng: `0`
  - đóng lẻ tiền: `3`
  - tháng ngoài năm gốc 2026: `31`
- tạo batch snapshot phí nháp:
  - script `npm run prepare:fee-public-batch:v2`
  - `batch_trang_thai_phi_public.id = 2`
  - trạng thái `DA_PUBLIC`
  - `trang_thai_phi_can_ho_public`: `934` dòng
  - `la_batch_public_hien_hanh = true`
  - batch public hiện hành: `1`
  - public bởi `admin`
  - batch nháp cũ `id = 1` đã chuyển `HUY` vì dùng rule cũ
- triển khai trang public tra cứu phí:
  - route `/` là trang chủ cư dân mobile-first/search-bar landing page
  - trang chủ đã tối giản: brand, link quản trị nhỏ, tiêu đề, ô nhập mã căn và nút tra cứu
  - route `/tra-cuu-phi`
  - không cần login
  - chỉ đọc batch public hiện hành
  - không hiển thị dữ liệu contact/ghi chú nội bộ
  - search box dùng parser mã căn đã có
  - giới hạn input `80` ký tự
  - whitelist ký tự public lookup
  - query qua Prisma, không nối SQL thủ công
  - rate-limit nhẹ theo IP
  - hỗ trợ nhóm input tự nhiên như `can 124 lo 4b`
  - ảnh nền desktop local đang dùng: `public/images/resident-home-desktop.webp`
  - ảnh nền mobile local đang dùng: `public/images/resident-home-mobile.webp`
  - logo header local đang dùng: `public/images/logo-hoanghuy.webp`
  - background tự chọn ảnh 16:9 trên desktop và 9:16 trên mobile
  - tài liệu quản trị parser: `docs/parser-ma-can-ho.md`
  - prompt thiết kế mobile-first trên Stitch: `docs/stitch-mobile-ui-prompt.md`
  - checklist duyệt thủ công trước deploy: `docs/checklist-duyet-truoc-deploy.md`
- đã gộp dữ liệu parser mã căn hiện có vào `docs/parser-ma-can-ho.md`:
  - nguồn code/test đang dùng
  - 100 case backlog
  - 6 case thật từ báo cáo giao dịch 1.500.000 tháng 5/2026 mà parser cũ từng bỏ sót
  - quan hệ với filter rule, contact parser và pipeline DB
  - quy trình version hóa, golden test và chống false-positive
- triển khai dashboard quản lý nội bộ:
  - route `/admin/dashboard`
  - truy cập cần login admin/manager
  - tìm căn theo mã hoặc input parser hỗ trợ
  - xem thông tin căn, trạng thái phí public hiện hành, contact master, contact candidate/ghi chú gốc và lịch sử import gần đây
  - link từ `/admin`
  - `npm test`: `82` tests pass
  - `npm run build`: pass
- triển khai màn hình review contact nội bộ:
  - route `/admin/contacts/review`
  - truy cập cần login admin/manager
  - lọc candidate theo mã căn, trạng thái duyệt, chất lượng dữ liệu
  - xem dữ liệu gốc Excel và dữ liệu parse
  - sửa tên/SĐT/vai trò trước khi duyệt
  - duyệt candidate để tạo `lien_he_can_ho`
  - từ chối candidate
  - ghi log duyệt vào `payload_duyet_json`
  - smoke test DB dev: candidate `1` đã `DA_DUYET` và tạo contact master, candidate `2` đã `TU_CHOI`
  - `npm test`: `82` tests pass
  - `npm run build`: pass
- triển khai import sao kê và đối soát DB:
  - script `npm run import:bank-statement:v2`
  - file nguồn `docs/lich-su-giao-dich(15-04-2026 09_33_29).xls`
  - batch mới nhất `lo_nhap_du_lieu.id = 7`
  - `dong_sao_ke_tho`: `125`
  - `giao_dich_ngan_hang`: `125`
  - `ket_qua_parse_giao_dich`: `125`
  - `duyet_giao_dich`: `125`
  - `phan_bo_giao_dich`: `101`
  - parse status: `KHOP_TRUC_TIEP = 42`, `KHOP_SAU_CHUAN_HOA = 59`, `NHIEU_CAN = 4`, `CHUA_NHAN_DIEN_DUOC_CAN = 2`, `KHONG_LIEN_QUAN_CAN_HO = 18`
  - `npm test`: `95` tests pass
  - `npm run build`: pass
- đã rà soát DB hiện tại:
  - `can_ho`: `934`
  - `CHUNG_CU`: `884`
  - `LIEN_KE`: `50`
  - mã liền kề hợp lệ hiện gồm `LK1.*`, `LK2.*`, `LKV.*`
  - `ung_vien_lien_he_can_ho`: `1977`
  - `lien_he_can_ho`: mới có `1`, cần duyệt contact master trước vận hành thật cho manager
  - báo cáo: `docs/reports/bao-cao-ra-soat-934-can-ho-db.md`
  - CSV từng dòng: `docs/reports/ra-soat-934-can-ho-db.csv`

Hiện tại chưa làm xong:

- duyệt hàng loạt contact master từ staging để manager có dữ liệu SĐT đủ sạch
- kiểm tra UI mobile thực tế 360/390/414/430px cho search-bar landing page
- kiểm tra dữ liệu nhạy cảm trước khi push remote nếu repo không private
- cải thiện cấu trúc `raw payload` để dễ đối chiếu với Excel nếu tiếp tục mở rộng import/sao kê
- mở rộng auth sang các màn hình nghiệp vụ sau này nếu có thêm route mới

## Mốc dữ liệu quan trọng

### Workbook quản lý

File đang dùng:

- `docs/Theo dõi thu phí T4.xlsx`

Kết quả đã chốt:

- tổng số căn hợp lệ: `934`
- trong đó:
  - `CHUNG_CU`: `884`
  - `LIEN_KE`: `50`
- 3 căn `LKV.*` được chấp nhận:
  - giữ nguyên mã căn
  - nhưng tính phí như `LIEN_KE`

### Master data trong DB

Sau khi sync từ workbook quản lý:

- `Apartment`: `934`
- `Resident`: `918`
- `Occupancy`: `934`

Giải thích:

- `Resident` ít hơn `Apartment` vì đang dedupe theo:
  - `fullName`
  - `phoneNumber`
- Đây là chủ đích thiết kế, không phải lỗi import

### Raw management import

Batch hiện tại:

- `cmo3svv9t00006tz6edwpu0g4`

Số dòng raw:

- tổng: `1944`
- theo sheet:
  - `Danh sách khách hàng`: `939`
  - `Lịch sử đóng phí`: `938`
  - `Sheet1`: `46`
  - `Khách ck nhầm vào tk An Điền`: `16`
  - `Khách nộp bổ sung nợ vàoAn Điền`: `5`

### Master V2 trong DB dev

Sau migration/reset V2 và import file master mới:

- `can_ho`: `934`
- `dong_du_lieu_quan_ly_tho`: `934`
- `CHUNG_CU`: `884`
- `LIEN_KE`: `50`
- đủ `LKV.45`, `LKV.47`, `LKV.58`
- `ung_vien_lien_he_can_ho`: `1977`
- candidate không cần rà soát: `484` dòng, thuộc `402` căn
- candidate cần rà soát: `1493` dòng, thuộc `532` căn
- `quy_tac_phi`: có rule `CHUNG_CU`, `LIEN_KE`
- `tai_khoan_quan_tri`: có user `admin`, SĐT `0904802553`, role `SUPER_ADMIN`, trạng thái `DANG_HOAT_DONG`

## Vấn đề đang mở

### 1. Raw payload chưa đủ dễ đọc

Raw hiện tại đang lưu kiểu:

- `payload.values = [...]`

Điều này giữ được dữ liệu gốc, nhưng chưa thuận tiện để audit và đối chiếu với Excel.

Hướng sửa đã chốt:

- giữ nguyên `values`
- bổ sung:
  - `headerValues`
  - `mappedRow`
  - `rowType`
  - `sourceRowIndex`

Đây là việc nên làm trước khi đi sâu hơn vào import sao kê.

### 2. Schema V1 chưa phù hợp hoàn toàn cho dữ liệu cư dân

Đã tạo phương án V2:

- `docs/resident-import-rules.vi.md`
- `docs/database-v2.md`
- `prisma/schema-v2.prisma`

Điểm mới:

- tên bảng/cột tiếng Việt không dấu
- `id` dùng số tự tăng
- chuyển sang quản lý `lien_he_can_ho`
- thêm staging `ung_vien_lien_he_can_ho`
- thêm audit script để rà dữ liệu bẩn trong cột `THÔNG TIN CƯ DÂN`

Kết quả audit mới nhất:

- tổng ô cần rà soát: `896`
- nhiều dòng: `432`
- nhiều số điện thoại: `553`
- có cờ trạng thái: `262`

Report:

- `docs/reports/bao-cao-audit-lien-he-can-ho.md`
- `docs/kiem-tra-ket-qua-parse-lien-he-can-ho.md`

Preview parse mới nhất:

- `docs/preview-lien-he-can-ho/README.md`
- `docs/preview-lien-he-can-ho/preview-tong-hop.csv`
- `docs/preview-lien-he-can-ho/can-ra-soat.csv`

Số lượng:

- `AUTO_MAP`: `440` căn nguồn
- `AUTO_MAP_GROUP`: `0`
- `CAN_RA_SOAT`: `491` căn nguồn
- `CHI_LUU_CO_TRANG_THAI`: `3` căn nguồn

### 3. Sao kê chưa nhập vào DB

Phần sao kê hiện mới xử lý ở app cũ / memory flow, chưa đưa vào DB pipeline mới.

## File quan trọng cần đọc trước

Máy khác khi vào dự án nên đọc theo thứ tự này:

1. `docs/handoff.md`
2. `docs/README.md`
3. `docs/roadmap.md`
4. `docs/checklist-trien-khai-va-nghiem-thu.md`
5. `docs/database-v1.md`
6. `docs/database-v2.md`
7. `docs/parser-ma-can-ho.md`
8. `docs/resident-import-rules.vi.md`
9. `docs/filter-rules.vi.md`
10. `docs/module-map.md`

Nếu làm phần DB/setup:

11. `docs/setup-may-moi-va-database.md`

Nếu kiểm chất lượng dữ liệu master:

12. `docs/reports/bao-cao-cu-dan-bi-double.md`
13. `docs/reports/bao-cao-audit-lien-he-can-ho.md`
14. `docs/kiem-tra-ket-qua-parse-lien-he-can-ho.md`
15. `docs/preview-lien-he-can-ho/README.md`
16. `docs/preview-lien-he-can-ho/can-ra-soat.csv`

## Các file và thư mục cần biết

### Schema và migration

- `prisma/schema.prisma`
- `prisma/schema-v2.prisma`
- `prisma/migrations/`
- `prisma.config.ts`

### Cấu hình

- `.env.example`
- `.env` local, không commit
- `config/periodic-fee-rules.json`

### Scripts hiện có

- `scripts/setup/install-postgres-app-local.sh`
- `scripts/setup/start-postgres-local.sh`
- `scripts/setup/stop-postgres-local.sh`
- `scripts/setup/create-dev-db.sh`
- `scripts/import-management-raw.cjs`
- `scripts/sync-management-master.cjs`
- `scripts/report-resident-duplicates.cjs`
- `scripts/audit-resident-contact-notes.cjs`

### Cấu trúc code

Code mới nên đặt trong:

- `src/modules/`

Các module đã có khung:

- `shared`
- `imports`
- `transactions`
- `database`
- `apartments`
- `residents`
- `billing`
- `exceptions`
- `documents`

`lib/` và `components/` hiện vẫn tồn tại để tương thích ngược, nhưng không nên đổ code mới vào đó nếu không cần thiết.

## Cách dựng môi trường trên máy khác

Máy khác không cần copy “file DB” từ máy này.

Cách đúng:

1. clone repo
2. cài Node.js
3. đọc `docs/setup-may-moi-va-database.md`
4. cài PostgreSQL local
5. tạo `.env` từ `.env.example`
6. chạy migration
7. import lại file mẫu trong `docs/`

Không nên sync:

- thư mục data PostgreSQL local
- `.env`
- binary cài đặt

## Lệnh thường dùng

### Prisma

```bash
npm run prisma:validate
npm run prisma:generate
npm run prisma:studio
npx prisma migrate dev
```

### Import workbook quản lý

```bash
npm run import:management:raw
npm run sync:management:master
```

### Báo cáo cư dân bị double

```bash
npm run report:resident:duplicates
```

### Chạy app

```bash
npm run dev
```

## Việc cần làm tiếp theo

### Theo roadmap mới

File control tiến trình:

- `docs/roadmap.md`

Bước tiếp theo sau khi đã migrate/import V2 dev, có nền auth, batch public, trang chủ cư dân mobile-first, trang public tra cứu phí, dashboard quản lý, review contact và import sao kê DB:

1. hoàn thiện project để khởi chạy ổn định trên local/staging
2. chủ dự án duyệt checklist trước deploy
3. deploy public web lên VPS ở bước cuối

Lưu ý:

- DB dev đã reset/migrate sang V2; dữ liệu V1 đã backup local trước migration.
- Trang public chỉ đọc bảng snapshot trạng thái phí đã được Super Admin chốt.
- Production dự kiến deploy trên VPS, PostgreSQL cài cùng VPS, domain `noxhandong.com`.
- Export Excel chỉ là bản lưu vận hành, không thay thế `pg_dump`/backup DB thật.
- Đã có script `npm run prod:backup:postgres` để tạo PostgreSQL dump.
- Đã có script `npm run export:operations:xlsx` để xuất Excel vận hành; lần test dev xuất `934` căn, `934` dòng phí public hiện hành.

### File master mới đã được thẩm định

- File: `docs/Danh_Sach_Can_Ho_Master.xlsx`
- Báo cáo: `docs/reports/danh-gia-danh-sach-can-ho-master.md`
- Kết luận:
  - tập mã căn khớp hoàn toàn với dữ liệu hiện có: `934/934`
  - nên dùng làm nguồn master chính cho `can_ho`
  - chưa nên dùng thẳng cho contact master, vì các cột `Người sử dụng 1..5` vẫn còn dữ liệu bẩn
- Script sync phần `can_ho`:
  - `npm run sync:apartment:master`
  - chỉ sync dữ liệu căn hộ từ file master mới
  - chưa đụng vào contact master
- Script sinh contact candidate vào DB:
  - `npm run sync:master:contacts`
  - sinh `ung_vien_lien_he_can_ho`
  - chưa tự nhập toàn bộ vào `lien_he_can_ho`
- Preview contact từ file master mới:
  - `npm run preview:master:contacts`
  - `docs/preview-master-lien-he-can-ho/README.md`
  - `docs/preview-master-lien-he-can-ho/nhap-thang.csv`
  - `docs/preview-master-lien-he-can-ho/can-ra-soat.csv`
  - kết quả hiện tại:
    - `NHAP_THANG`: `402` căn
    - `CAN_RA_SOAT`: `532` căn
    - `1977` dòng contact preview

### Bước tiếp theo chi tiết

Theo `docs/roadmap.md` và `docs/checklist-trien-khai-va-nghiem-thu.md`, task hiện tại là `Task N. Hoàn thiện project để khởi chạy ổn định`.

Cần làm trước khi deploy:

- kiểm tra lại public mobile UI
- kiểm tra lại login bằng SĐT `0904802553`
- kiểm tra dashboard/review contact/import/export
- chuẩn hóa runbook khởi chạy project
- chủ dự án duyệt checklist trước deploy
- sau đó mới cấu hình VPS/domain/HTTPS/backup DB

Chỉ sau khi Task O deploy pass nghiệm thu mới coi roadmap hiện tại hoàn tất:

- public page hoạt động trên domain production
- admin login hoạt động trên production
- backup DB có quy trình rõ

## Quy tắc làm việc khi sang máy khác

Khi bắt đầu ở máy khác, yêu cầu agent hoặc người làm mới:

1. đọc `docs/handoff.md`
2. đọc `docs/checklist-trien-khai-va-nghiem-thu.md`
3. xác nhận trạng thái môi trường:
   - Node
   - PostgreSQL
   - `.env`
   - migration
4. chỉ sau đó mới tiếp tục task tiếp theo

Không nên bắt đầu bằng việc đọc lại toàn bộ lịch sử chat.

## Quy tắc cập nhật file này

Mỗi khi chốt xong một chặng lớn, phải cập nhật:

- `docs/handoff.md`
- `docs/checklist-trien-khai-va-nghiem-thu.md`

Nếu có thay đổi nghiệp vụ:

- cập nhật thêm `docs/filter-rules.vi.md`
- hoặc tài liệu nghiệp vụ tương ứng

Nếu có thay đổi parser mã căn:

- cập nhật `docs/parser-ma-can-ho.md`
- thêm golden test tương ứng
- chạy `npm test`
## Cập nhật nhanh 2026-05-20

- UI quản trị đã được tiếng Việt hóa phần hiển thị, không còn dùng nhãn tiếng Anh chính như `contact candidate`, `public`, `dashboard`, `review contact` trên các trang quản trị chính.
- Trang `/admin/login` đã có link `Về trang chủ`.
- Tài khoản `admin` vẫn giữ username kỹ thuật là `admin`, nhưng `ten_hien_thi` trong DB đã đổi thành `Quản trị cao nhất`.
- File thu phí mới nhất hiện tại: `docs/Theo dõi thu phí T5.xlsx`.
- Kết quả import T5: `lo_nhap_du_lieu.id = 8`, `934` dòng, `3` dòng đóng lẻ, `8` dòng ngoài năm gốc 2026, không có lỗi mã căn/thiếu tháng/không parse tháng.
- Batch phí `T5-2026` có `batch_trang_thai_phi_public.id = 3` và đang là batch công khai hiện hành.
- Sao kê mới `lich-su-giao-dich(20-05-2026 08_51_50).xls` đã được parse/đối chiếu:
  - report Excel: `docs/reports/lich-su-giao-dich-20-05-2026-08_51_50--parser-doi-chieu.xlsx`
  - summary JSON: `docs/reports/lich-su-giao-dich-20-05-2026-08_51_50--parser-summary.json`
  - CSV cần kiểm tra: `docs/reports/lich-su-giao-dich-20-05-2026-08_51_50--can-kiem-tra.csv`
  - DB import batch: `lo_nhap_du_lieu.id = 9`
- Trang `/admin/import` đã có form upload file thu phí Excel:
  - file upload được lưu tạm trong `.local/admin-uploads/fee-tracking`
  - nút `Chỉ nhập staging` chạy import vào `dong_theo_doi_thu_phi_tho`
  - nút `Nhập và chốt công khai` chạy import, tạo batch phí và public ngay

## Cập nhật nhanh 2026-05-21

- Đã cài Tailwind CSS chính thức vào project Next.js qua `@tailwindcss/postcss`.
- Đã thêm cấu hình `postcss.config.mjs` và `components.json`.
- Đã thêm bộ component nền theo phong cách shadcn/ui trong `components/ui/`: `button`, `input`, `card`, `badge`, `table`.
- Đã thêm helper `cn()` tại `lib/utils.ts`.
- Đã chuyển trước các màn `/admin/login`, `/admin`, `/admin/import`.
- Kiểm tra kỹ thuật: `npm test` pass 95 tests, `npm run build` pass.
- Lưu ý: `npm install` báo còn vulnerability trong dependency tree hiện tại; chưa chạy `npm audit fix --force` để tránh nâng version/bẻ project ngoài phạm vi.

## Cập nhật UI nhanh 2026-05-21

- Đã chuyển tiếp các màn admin còn lại sang Tailwind + component nền:
  - `/admin/accounts`
  - `/admin/dashboard`
  - `/admin/contacts/review`
- Tổng các màn admin đã chuyển hiện gồm: `/admin/login`, `/admin`, `/admin/import`, `/admin/accounts`, `/admin/dashboard`, `/admin/contacts/review`.
- Không đổi parser, DB schema, import/export script hay server action nghiệp vụ.
- Kiểm tra kỹ thuật sau chuyển UI: `npm test` pass 95 tests, `npm run build` pass.

## Fix UI nhanh 2026-05-21

- Lỗi: `/admin/login` và dashboard hiển thị như HTML thô vì Tailwind chỉ load theme/base, chưa sinh utility class.
- Nguyên nhân: Tailwind v4 chưa scan source Next.js rõ ràng.
- Đã thêm `@source` cho `app`, `components`, `src`, `lib` trong `app/globals.css`.
- Đã restart dev server, `/admin/login` và `/` trả 200.
- Kiểm tra sau fix: `npm test` pass 95 tests, `npm run build` pass.

## Demo dashboard UI 2026-05-21

- Đã tạo route demo `/admin/dashboard-demo`.
- Có nút `Xem demo UI` từ trang `/admin`.
- Demo chỉ dùng mock data, không đổi DB, parser, import/export hay dashboard thật.
- Ý tưởng chính: sidebar, header sticky, KPI cards, chart SVG nhẹ, bảng cuộn trong từng card.
- Kiểm tra kỹ thuật: `npm test` pass 95 tests, `npm run build` pass.

## Áp dụng dashboard UI 2026-05-21

- Đã áp dụng bố cục demo vào dashboard thật `/admin/dashboard`.
- Dashboard thật vẫn dùng `getApartmentDashboardData`, không đổi truy vấn nghiệp vụ, DB schema, parser hay import/export.
- Các bảng dài trong dashboard đã được đưa vào vùng cuộn nội bộ trong card.
- Kiểm tra kỹ thuật: `npm test` pass 95 tests, `npm run build` pass.

## Áp dụng UI toàn project 2026-05-21

- Đã tạo `components/admin/admin-frame.tsx` gồm:
  - `AdminFrame`: layout sidebar/header/sticky cho admin.
  - `ScrollPanel`: khung cuộn nội bộ cho bảng dài.
- Đã áp dụng khung admin mới cho:
  - `/admin`
  - `/admin/dashboard`
  - `/admin/import`
  - `/admin/accounts`
  - `/admin/contacts/review`
- Đã đồng bộ public UI cho:
  - `/`
  - `/tra-cuu-phi`
- Đã gỡ route demo `/admin/dashboard-demo`.
- Không đổi DB, parser, import/export hoặc server action nghiệp vụ.
- Kiểm tra kỹ thuật: `npm test` pass 95 tests, `npm run build` pass.

## Cập nhật môi trường Windows 2026-05-22

- Đã chuyển môi trường Windows từ portable sang bản cài full:
  - Node.js LTS full: `OpenJS.NodeJS.LTS` version `24.16.0`
  - PostgreSQL full: `PostgreSQL.PostgreSQL.17` version `17.10-1`
  - PostgreSQL service: `postgresql-x64-17`, trạng thái `Running`, `StartType = Automatic`
- Đã backup DB portable trước khi chuyển:
  - `.local/db-backups/apartment_fee_reviewer-before-full-postgres-20260522.dump`
- Đã restore DB dev vào PostgreSQL full service:
  - `can_ho = 934`
  - `giao_dich_ngan_hang = 395`
  - user `admin`, SĐT `0904802553`, role `SUPER_ADMIN`
- Đã thêm script Windows:
  - `scripts/setup/start-postgres-local.ps1`
  - `scripts/setup/stop-postgres-local.ps1`
  - `npm run db:start:windows`
  - `npm run db:stop:windows`
- Script Windows ưu tiên service `postgresql-x64-17`; Node/PostgreSQL portable trong `.tools/` và PostgreSQL runtime ở `C:\Users\IceCrow\apartment_fee_reviewer_runtime` chỉ còn là fallback/backup.
- Kiểm tra kỹ thuật sau chuyển môi trường: `npm test` pass 95 tests, `npm run build` pass.

## Cập nhật dashboard vận hành 2026-05-22

- Dashboard `/admin/dashboard` đã chuyển hướng thành màn tra cứu/tổng quan nhanh, không xử lý nghiệp vụ nặng.
- Khi vừa mở dashboard có KPI và chart kỳ phí:
  - tổng căn hộ
  - số căn đã hoàn thành kỳ hiện tại
  - số căn chưa hoàn thành kỳ hiện tại
  - phân bố tháng đã đóng đến
  - danh sách căn cần chú ý
- Quy tắc thống kê kỳ phí:
  - số lẻ như `3.5` được làm tròn xuống thành tháng `3`
  - căn đóng vượt kỳ hiện tại vẫn tính là hoàn thành kỳ hiện tại
  - mốc ngoài năm 2026 giữ đúng tháng/năm thực tế khi hiển thị chart
- Tra cứu căn hộ hiển thị nhanh tình trạng phí, dữ liệu liên hệ gốc từ Excel/chưa duyệt và nút `Gọi` bằng link `tel:`.
- Kiểm tra kỹ thuật sau chỉnh dashboard: `npm test` pass 95 tests, `npm run build` pass, đã kiểm tra desktop và mobile 390/430px bằng Playwright screenshot.

## Cập nhật admin mobile-first 2026-05-22

- Admin layout đã chuyển sang mô hình responsive:
  - Desktop `lg` trở lên: sidebar cố định bên trái.
  - Mobile/tablet nhỏ: chỉ còn topbar gọn và nút menu; menu mở bằng `Sheet` trượt từ trái.
- Trang `/admin` đã chuyển card chức năng sang dạng list compact trên mobile; desktop vẫn giữ card grid.
- Các bảng dài trong admin dùng vùng cuộn riêng (`ScrollPanel`, `overflow-x-auto`, `min-width`) để không kéo ngang toàn trang.
- Đã thêm test hook ổn định cho menu mobile:
  - `data-testid="admin-mobile-menu-trigger"`
  - `data-testid="admin-mobile-sheet"`
- Kiểm tra kỹ thuật:
  - `npm test` pass 95 tests.
  - Build sạch sau khi dừng dev server và xoá `.next`: `npm run build` pass.
  - Playwright kiểm tra `/admin` desktop 1440px, `/admin` mobile 430px/390px, `/admin/dashboard?ma_can=L1.112` mobile 430px: CSS có load, không overflow ngang toàn trang, menu mobile mở được bằng Sheet.
