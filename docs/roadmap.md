# Roadmap dự án

## Vai trò file này

`docs/roadmap.md` là file điều phối cấp cao của dự án.

File này chỉ trả lời:

- mục tiêu sản phẩm là gì
- đang ở giai đoạn nào
- task nào đã xong, task nào đang làm, task nào tiếp theo
- quyết định kỹ thuật nào đã chốt
- rủi ro lớn cần kiểm soát

File này không ghi checklist nghiệm thu chi tiết. Điều kiện review/check/test/confirm nằm trong [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md).

## Liên kết xương sống

- Mục lục tài liệu: [README.md](README.md)
- Handoff hiện tại: [handoff.md](handoff.md)
- Checklist nghiệm thu: [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md)
- Database V2: [database-v2.md](database-v2.md)
- Parser mã căn: [parser-ma-can-ho.md](parser-ma-can-ho.md)
- Design system: [design-system.md](design-system.md)
- Production VPS: [production-deploy-vps.md](production-deploy-vps.md)
- Runbook deploy VPS: [deploy-vps-step-by-step.md](deploy-vps-step-by-step.md)
- Todo đồng thuận Antigravity/Codex: [todolist-dong-thuan-antigravity-codex.md](todolist-dong-thuan-antigravity-codex.md)
- Project README: [../README.md](../README.md)

## Ngày cập nhật

- 2026-05-14: tạo roadmap public web/admin.
- 2026-05-15: DB dev đã migrate sang V2, import master căn hộ, sinh contact candidate, triển khai nền auth/admin.
- 2026-05-15: gộp dữ liệu parser mã căn hiện có vào `docs/parser-ma-can-ho.md` và nối vào file xương sống.
- 2026-05-15: hoàn thành nền dashboard quản lý Task K.
- 2026-05-16: hoàn thành nền màn hình review contact nội bộ Task L.
- 2026-05-16: hoàn thành nền import sao kê và đối soát DB Task M.
- 2026-05-16: đổi trang chủ `/` thành trang cư dân mobile-first, tạo prompt Stitch và checklist duyệt thủ công trước deploy.
- 2026-05-16: chốt hướng production: deploy VPS, PostgreSQL cùng VPS, domain khi đó dự kiến `noxhandong.com`, cần backup DB thật ngoài export Excel.
- 2026-05-17: chuẩn bị nền production: admin đăng nhập bằng số điện thoại, script `pg_dump`, script export Excel vận hành.
- 2026-05-17: gắn SĐT `0904802553` cho tài khoản `admin` role `SUPER_ADMIN`; xác định deploy VPS là bước cuối sau khi roadmap hiện tại hoàn thiện.
- 2026-05-17: chuyển design Stitch thành design system nội bộ và chỉnh public UI/copy theo nghiệp vụ BQT An Đồng.
- 2026-05-18: rà soát 934 căn trong DB, tạo báo cáo dữ liệu thật và đề xuất mô hình DB/tình huống cư dân.
- 2026-05-18: thêm ảnh nền chung cư xanh local, tối giản trang chủ theo hướng search-bar landing page.
- 2026-05-19: chốt định hướng index là search-bar landing page; góp ý dài hạn để ở backlog, không làm lệch mục tiêu hiện tại.
- 2026-05-23: ghi nhận đồng thuận Antigravity/Codex, tạo `docs/todolist-dong-thuan-antigravity-codex.md` để tách việc chặn deploy public và backlog đối soát sao kê.
- 2026-05-23: rebuild dữ liệu phí public theo `docs/Theo dõi thu phí T5.xlsx`; public batch hiện hành là `T5-2026`, đủ `934` căn.
- 2026-05-25: chốt phân quyền nội bộ cố định: `SUPER_ADMIN` toàn quyền; `MANAGER` và `TECHNICIAN` ngang quyền chỉ tra cứu/xem liên hệ/gọi nhanh/tài khoản cá nhân.
- 2026-05-25: deploy MVP lên Vultr/domain `noxhandong.vn`; chạy Windows Server trước, PostgreSQL local, Next.js bằng NSSM service, Caddy HTTPS và backup/export tự động.

## Mục tiêu sản phẩm

Dự án hướng tới một web app có thể public, gồm hai vùng:

1. Public cho cư dân tra cứu tiến trình đóng phí theo mã căn, không cần login.
2. Quản trị nội bộ có login, phân quyền `SUPER_ADMIN`, `MANAGER` và `TECHNICIAN`.

## Nguyên tắc đã chốt

- Tiếp tục dùng PostgreSQL.
- Không chuyển SQL Server ở giai đoạn này.
- Excel vẫn là nguồn vận hành thủ công trong giai đoạn đầu.
- App import Excel để tra cứu và kiểm soát, chưa thay thế Excel ngay.
- Public page chỉ đọc dữ liệu đã được Super Admin chốt.
- Public không hiển thị phone, CCCD, thường trú, ghi chú nội bộ, ghi chú gốc Excel.
- Contact bẩn phải đi qua staging/review, không đổ thẳng vào contact master.
- Super Admin mới được import/chốt dữ liệu thu phí public.
- Super Admin có thể tạo thêm tài khoản `SUPER_ADMIN`, `MANAGER`, hoặc `TECHNICIAN` từ UI, không cần thao tác trực tiếp trong DB ở vận hành bình thường.
- Manager và kỹ thuật ngang quyền: tra cứu nội bộ, xem liên hệ cư dân/dữ liệu gốc, gọi nhanh cư dân, tự quản lý tài khoản cá nhân.
- Manager và kỹ thuật không được import/chốt phí, duyệt/từ chối liên hệ, tạo tài khoản hoặc đổi phân quyền.

## Trạng thái hiện tại

Đã hoàn thành nền V2 trên máy dev hiện tại:

- DB dev đã migrate/reset sang `prisma/schema-v2.prisma`.
- Migration V2: `20260515000100_v2_public_web`.
- Backup trước migration: `.local/db-backups/apartment_fee_reviewer-before-v2-20260515-163208.sql`.
- Prisma Client đã generate theo schema V2.
- `can_ho`: `934` căn.
- `CHUNG_CU`: `884`.
- `LIEN_KE`: `50`.
- `dong_du_lieu_quan_ly_tho`: `934` raw row từ file master.
- `ung_vien_lien_he_can_ho`: `1977` contact candidate.
- `402` căn nhập tương đối thẳng.
- `532` căn cần rà soát.
- Đã seed rule phí nền và tài khoản `SUPER_ADMIN` dev.
- Đã có nền auth/admin:
  - `/admin/login`
  - `/admin`
  - `/admin/accounts`
  - `/admin/import`
  - middleware bảo vệ `/admin`
  - route Super Admin được chặn riêng.
- Đã import file theo dõi thu phí T4 vào staging:
  - batch `lo_nhap_du_lieu.id = 3`
  - `dong_theo_doi_thu_phi_tho`: `934` dòng
  - mã căn không map được: `0`
  - thiếu tháng đã đóng: `0`
  - không parse được tháng đã đóng: `0`
  - đóng lẻ tiền: `3`
  - tháng ngoài năm gốc 2026: `31`
- Đã tạo batch snapshot phí nháp:
  - `batch_trang_thai_phi_public.id = 2`
  - trạng thái `DA_PUBLIC`
  - `trang_thai_phi_can_ho_public`: `934` dòng
  - đã đánh dấu public hiện hành
  - người public: `admin`
  - batch nháp cũ `id = 1` đã chuyển `HUY` vì dùng rule cũ
- Đã có trang public tra cứu phí:
  - route `/tra-cuu-phi`
  - cư dân không cần login
  - chỉ đọc batch public hiện hành
  - không hiển thị phone/contact/ghi chú nội bộ
  - search box dùng parser mã căn, giới hạn `80` ký tự, whitelist ký tự và rate-limit nhẹ
  - đã hỗ trợ nhóm input tự nhiên như `can 124 lo 4b`
  - tài liệu quản trị parser: `docs/parser-ma-can-ho.md`
- Đã có dashboard quản lý nội bộ:
  - route `/admin/dashboard`
  - manager/super admin đã login đều xem được
  - tìm căn theo mã hoặc input parser hỗ trợ
  - xem hồ sơ căn, trạng thái phí public hiện hành, contact master, contact candidate và lịch sử import gần đây
- Đã có màn hình review contact nội bộ:
  - route `/admin/contacts/review`
  - filter theo mã căn, trạng thái duyệt, chất lượng dữ liệu
  - xem dữ liệu gốc Excel và dữ liệu parse
  - sửa tên/SĐT/vai trò, chọn liên hệ chính, chọn nhận thông báo
  - duyệt candidate để tạo `lien_he_can_ho`
  - từ chối candidate
  - ghi log duyệt vào `payload_duyet_json`
- Đã import sao kê mẫu vào DB:
  - script `npm run import:bank-statement:v2`
  - file `docs/lich-su-giao-dich(15-04-2026 09_33_29).xls`
  - batch mới nhất `lo_nhap_du_lieu.id = 7`
  - `dong_sao_ke_tho`: `125`
  - `giao_dich_ngan_hang`: `125`
  - `ket_qua_parse_giao_dich`: `125`
  - `duyet_giao_dich`: `125`
  - `phan_bo_giao_dich`: `101`
  - trạng thái parse: `KHOP_TRUC_TIEP = 42`, `KHOP_SAU_CHUAN_HOA = 59`, `NHIEU_CAN = 4`, `CHUA_NHAN_DIEN_DUOC_CAN = 2`, `KHONG_LIEN_QUAN_CAN_HO = 18`
- Đã tối ưu hướng public mobile-first:
  - route `/` là trang đầu tiên cho cư dân
  - index đi theo hướng search-bar landing page: tối giản, chuyên nghiệp, ít chữ
  - form tra cứu nằm ngay trên trang chủ
  - có lối vào quản trị qua `/admin/login`
  - route `/tra-cuu-phi` có điều hướng về trang chủ và quản trị
  - prompt thiết kế Stitch: `docs/stitch-mobile-ui-prompt.md`
  - cổng dừng thủ công trước deploy: `docs/checklist-duyet-truoc-deploy.md`
  - ảnh nền desktop đã tối ưu và dùng ở `public/images/resident-home-desktop.webp`
  - ảnh nền mobile đã tối ưu và dùng ở `public/images/resident-home-mobile.webp`
  - logo header đã tối ưu và dùng ở `public/images/logo-hoanghuy.webp`
  - background tự chọn ảnh 16:9 trên desktop và 9:16 trên mobile
- Đã rà soát dữ liệu căn hộ trong DB:
  - `can_ho`: đủ `934` căn
  - mã liền kề hợp lệ hiện gồm `LK1.*`, `LK2.*`, `LKV.*`
  - contact master mới có `1` dòng, phần lớn dữ liệu liên hệ vẫn ở staging
  - báo cáo: `docs/reports/bao-cao-ra-soat-934-can-ho-db.md`
  - CSV từng dòng: `docs/reports/ra-soat-934-can-ho-db.csv`
- Đã chốt hướng production:
  - deploy trên VPS
  - PostgreSQL cài trên cùng VPS với app
  - domain production hiện tại `noxhandong.vn`
  - dùng backup/snapshot VPS
  - đã thêm script `prod:backup:postgres` để chạy `pg_dump`
  - đã thêm script `export:operations:xlsx` để lưu bản vận hành trên máy local
  - Super Admin production cần chốt người giữ và không dùng mật khẩu dev
- Đã chuẩn bị đăng nhập quản trị bằng số điện thoại:
  - migration `20260517000100_add_admin_phone_login`
  - migration `20260525000100_add_technician_role`
  - thêm `tai_khoan_quan_tri.so_dien_thoai`
  - admin/manager đăng nhập được bằng username hoặc số điện thoại chuẩn hóa
  - Super Admin tạo manager/kỹ thuật bắt buộc nhập số điện thoại đăng nhập
  - Super Admin đổi role manager/kỹ thuật và xem bảng quyền theo role tại `/admin/accounts`
  - Super Admin khóa và mở khóa lại tài khoản nội bộ
  - mỗi tài khoản có trang `/admin/profile` để tự đổi tên hiển thị, email và mật khẩu
  - tài khoản `admin` hiện có SĐT đăng nhập `0904802553`, role `SUPER_ADMIN`

## Bảng tiến trình cấp cao

| Task | Tên | Trạng thái | Ghi chú |
| --- | --- | --- | --- |
| A | Chuẩn hóa tài liệu cấp cao | Done | `docs/README.md`, roadmap, checklist, handoff đã liên kết |
| B | Chốt schema V2 mở rộng | Done | Có auth, public fee snapshot, contact review |
| C | Migrate/reset DB dev sang V2 | Done | Migration `20260515000100_v2_public_web` |
| D | Import master căn hộ | Done | `934` căn từ `Danh_Sach_Can_Ho_Master.xlsx` |
| E | Sinh staging contact từ file master | Done | `1977` candidate, chưa nhập vào contact master |
| F | Seed dữ liệu nền và Super Admin | Done | Rule phí và user admin dev đã có |
| G | Auth và phân quyền quản trị | Done | Login/logout, middleware, Super Admin route guard |
| H | Import file theo dõi thu phí | Done | `934` dòng staging, parse tháng theo năm gốc 2026 |
| I | Chốt batch trạng thái phí public | Done | Batch `2` là public hiện hành |
| J | Trang public cư dân tra cứu phí | Done | Route `/tra-cuu-phi`, không login |
| K | Dashboard quản lý | Done | Manager xem căn/contact/phí |
| L | Màn hình review contact nội bộ | Done | Duyệt candidate vào contact master |
| M | Import sao kê và đối soát DB | Done | Đưa pipeline sao kê vào DB |
| N | Hoàn thiện project để khởi chạy ổn định | Current | Local/staging readiness, UI, auth, import/export, runbook |
| O | Deploy public web lên VPS | Final | Domain, HTTPS, backup, production env |

## Task đang ưu tiên

Task đang ưu tiên là **Task N. Hoàn thiện project để khởi chạy ổn định**.

Deploy VPS là **Task O**, chỉ làm sau khi Task N và checklist duyệt trước deploy đã đạt.

Mục tiêu:

- chốt và kiểm tra luồng public mobile-first/search-bar landing page
- chốt và kiểm tra login bằng SĐT cho Super Admin/Manager
- kiểm tra dashboard, review contact, import sao kê, export Excel
- chuẩn hóa runbook khởi chạy local/staging
- đảm bảo test/build pass trước khi chuyển sang deploy

Điều kiện nghiệm thu deploy nằm trong checklist duyệt thủ công [checklist-duyet-truoc-deploy.md](checklist-duyet-truoc-deploy.md), nhưng chỉ áp dụng khi bắt đầu Task O.

Quyết định production chi tiết nằm trong [production-deploy-vps.md](production-deploy-vps.md).

## Góp ý cải thiện sau

Các mục dưới đây là backlog tham khảo, không chặn mục tiêu hiện tại nếu chưa ảnh hưởng trực tiếp tới public lookup, import Excel phí, review contact hoặc khởi chạy local/staging:

- Đồng bộ parser TypeScript và parser trong script CJS để tránh lệch rule khi xử lý sao kê.
- Làm rõ `prisma/schema.prisma` V1 là schema lưu lịch sử, tránh chạy nhầm với `schema-v2.prisma`.
- Đưa hằng số phí `250000` và `200000` trong logic đối soát về DB/config khi bắt đầu dùng đối soát sao kê thường xuyên.
- Bảo vệ luồng re-import sao kê để không xóa review giao dịch đã duyệt.
- Thêm card nội bộ `Giao dịch ngân hàng gần nhất` khi tra cứu căn hộ để làm bằng chứng đối chiếu; chi tiết lưu tại `docs/backlog-doi-soat-sao-ke.md`.
- Kiểm tra dữ liệu nhạy cảm trong `db-sync/*.sql` trước khi push repo ra remote dùng chung.
- Thêm constraint cho batch public hiện hành nếu có nguy cơ nhiều người cùng publish.
- Zalo Login chỉ xem là tính năng sau, ưu tiên cho admin/manager nếu cần; không áp dụng cho cư dân public ở giai đoạn hiện tại.

## Thứ tự triển khai

1. Task N: Hoàn thiện project để khởi chạy ổn định
2. Task O: Deploy public web lên VPS

Task A-M đã hoàn thành phần nền theo checklist hiện tại. Task O là bước cuối, không làm trước khi Task N đạt.

## Quyết định kỹ thuật đã chốt

- PostgreSQL là database chính.
- Prisma dùng `prisma/schema-v2.prisma` làm schema mục tiêu.
- Auth quản trị dùng tài khoản trong bảng `tai_khoan_quan_tri`.
- Admin/manager có thể đăng nhập bằng `ten_dang_nhap` hoặc `so_dien_thoai`.
- Session admin dùng cookie HTTP-only có chữ ký.
- Production bắt buộc có `ADMIN_SESSION_SECRET`.
- Public page chỉ đọc snapshot/batch đã public, không đọc raw import trực tiếp.
- File `Danh_Sach_Can_Ho_Master.xlsx` là nguồn chính cho `can_ho`.
- File Excel theo dõi thu phí là nguồn vận hành thủ công cho trạng thái đóng phí public.
- Parser mã căn là thuật toán lõi, được quản lý tập trung ở `docs/parser-ma-can-ho.md`.
- Mỗi rule parser mới phải có golden test và chống false-positive trước khi dùng cho import/đối soát.

## Rủi ro lớn

- Public không login có thể bị tra mã căn hàng loạt.
- Excel thủ công có thể sai tháng hoặc sai mã căn.
- Contact candidate còn bẩn, dễ nhầm người nhận thông báo nếu nhập thẳng.
- Nếu không có bước chốt batch, cư dân có thể thấy dữ liệu nháp.
- Nếu public nhầm ghi chú nội bộ, có rủi ro lộ thông tin cá nhân.
- Parser mã căn nếu quá “tham” có thể match nhầm số điện thoại, số tài khoản hoặc nhiều căn trong một nội dung.

## Cách kiểm soát

- Public chỉ đọc batch đã chốt.
- Không public phone/CCCD/ghi chú gốc.
- Super Admin kiểm tra preview trước khi public.
- Mọi import giữ raw row và mapped row để audit.
- Contact đi qua staging/review.
- Các route admin nhạy cảm yêu cầu `SUPER_ADMIN`.
- Parser mã căn có tài liệu trung tâm, golden test, blacklist false-positive và lưu `matchReason`/`phien_ban_parser` khi đưa sao kê vào DB.

## Cập nhật Task N 2026-05-22

- Đã xử lý phần admin responsive cần làm ngay:
  - desktop giữ sidebar cố định.
  - mobile/tablet nhỏ dùng topbar + `Sheet` menu.
  - trang `/admin` mobile chuyển card chức năng sang list compact.
  - bảng dài dùng vùng cuộn riêng, tránh overflow ngang toàn trang.
- Đã kiểm tra `390px`, `430px`, desktop `1440px` bằng Playwright.
- `npm test` pass 95 tests, `npm run build` pass sau build sạch.
## Cập nhật nhanh 2026-05-20

- Đã cập nhật UI quản trị theo hướng tiếng Việt hóa: trang `/admin`, `/admin/login`, `/admin/dashboard`, `/admin/accounts`, `/admin/import`, `/admin/contacts/review`.
- Trang login quản trị đã có nút quay về trang chủ.
- Các enum/ký hiệu kỹ thuật như `SUPER_ADMIN`, `MANAGER`, `TECHNICIAN`, `DA_PUBLIC` vẫn giữ trong schema/DB để bảo toàn logic, nhưng UI hiển thị bằng nhãn tiếng Việt.
- Đã đổi tên hiển thị tài khoản `admin` trong DB thành `Quản trị cao nhất`.
- Đã import file mới `docs/Theo dõi thu phí T5.xlsx`: `934` dòng, `0` lỗi mã căn, `0` thiếu tháng, `0` không parse được tháng, `3` dòng đóng lẻ, `8` dòng ngoài năm gốc 2026.
- Đã tạo và public lô phí `T5-2026`: `batch_trang_thai_phi_public.id = 3`, `934` căn, đang là lô công khai hiện hành.
- Đã tạo script `npm run report:bank-statement:parser -- "<file sao kê>"` để sinh Excel có cột `Căn parser` cạnh cột nội dung giao dịch và đối chiếu với batch thu phí hiện hành.
- Đã xử lý file sao kê `lich-su-giao-dich(20-05-2026 08_51_50).xls`: tạo report trong `docs/reports`, import DB batch `lo_nhap_du_lieu.id = 9`.
- Đã bổ sung UI upload file thu phí tại `/admin/import`: Super Admin có thể chọn file Excel, `Chỉ nhập staging` hoặc `Nhập và chốt công khai`.

- 2026-05-21: cài Tailwind CSS và component nền theo phong cách shadcn/ui; chuyển trước `/admin/login`, `/admin`, `/admin/import`.

- 2026-05-21: tiếp tục chuyển UI admin sang Tailwind/component nền cho `/admin/accounts`, `/admin/dashboard`, `/admin/contacts/review`; test/build pass.

## Cập nhật kiểm tra cuối Task N 2026-05-24

- Public/admin/import đã được kiểm tra lại sau khi sửa UX import.
- Public batch hiện hành: `T5-2026`, `batch_trang_thai_phi_public.id = 9`, đủ `934` căn.
- Web import đã chạy được cả `Chỉ kiểm tra file` và `Nhập và công khai cho cư dân`.
- Dữ liệu test phát sinh từ import web đã được dọn, chỉ giữ import batch thu phí hiện hành `lo_nhap_du_lieu.id = 32`.
- `npm test`, `npm run build`, `npm run test:mobile-ui` đều pass.
