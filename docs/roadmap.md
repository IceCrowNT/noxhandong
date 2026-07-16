# Roadmap dự án

## Vai Trò File Này

`docs/roadmap.md` là file điều phối cấp cao của dự án.

File này chỉ trả lời:

- mục tiêu sản phẩm là gì
- đang ở giai đoạn nào
- task nào đã xong, task nào đang làm, task nào tiếp theo
- quyết định kỹ thuật nào đã chốt
- rủi ro lớn cần kiểm soát

Checklist nghiệm thu chi tiết nằm trong [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md).

## Liên Kết Xương Sống

- Mục lục tài liệu: [README.md](README.md)
- Project README: [../README.md](../README.md)
- Handoff hiện tại: [handoff.md](handoff.md)
- Checklist nghiệm thu: [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md)
- Checklist duyệt trước deploy: [checklist-duyet-truoc-deploy.md](checklist-duyet-truoc-deploy.md)
- Database hiện hành: [database.md](database.md)
- Parser mã căn: [parser-ma-can-ho.md](parser-ma-can-ho.md)
- Design system: [design-system.md](design-system.md)
- Roadmap Phase 2: [phase-2-roadmap.md](phase-2-roadmap.md)
- Runbook deploy VPS duy nhất: [deploy-vps-step-by-step.md](deploy-vps-step-by-step.md)
- Production VPS decisions/checklist: [production-deploy-vps.md](production-deploy-vps.md)
- Todo VPS Phase 2: [vps-phase-2-todolist.md](vps-phase-2-todolist.md)
- Todo đồng thuận Antigravity/Codex: [todolist-dong-thuan-antigravity-codex.md](todolist-dong-thuan-antigravity-codex.md)
- Task Developer ẩn/feature flags: [task-developer-hidden-feature-flags.md](task-developer-hidden-feature-flags.md)

## Ngày Cập Nhật

- 2026-05-14: tạo roadmap public web/admin.
- 2026-05-15: DB dev migrate sang V2, import master căn hộ, sinh contact candidate, triển khai nền auth/admin.
- 2026-05-16: hoàn thành nền review contact, import sao kê và đối soát DB.
- 2026-05-16: đổi trang chủ `/` thành trang cư dân mobile-first, tạo prompt Stitch và checklist duyệt thủ công trước deploy.
- 2026-05-17: chuẩn bị nền production: đăng nhập bằng số điện thoại, backup DB, export Excel vận hành.
- 2026-05-18: rà soát 934 căn trong DB, tạo báo cáo dữ liệu thật và đề xuất mô hình DB/tình huống cư dân.
- 2026-05-23: rebuild dữ liệu phí public theo file theo dõi thu phí T5, đủ `934` căn.
- 2026-05-25: chốt phân quyền nội bộ cố định: `SUPER_ADMIN` toàn quyền; `MANAGER` và `TECHNICIAN` ngang quyền đọc/tra cứu/gọi nhanh/tài khoản cá nhân.
- 2026-05-25: deploy MVP lên Vultr/domain `noxhandong.vn`; Windows Server, PostgreSQL local, Next.js bằng NSSM service, Caddy HTTPS.
- 2026-06: Phase 2 tập trung vào opening balance T5/2026, import sao kê từ T6/2026, duyệt giao dịch, lưu bằng chứng, public theo kỳ, tối ưu dashboard và đối soát.

## Mục Tiêu Sản Phẩm

Dự án hướng tới một web app có thể public, gồm hai vùng:

1. Public cho cư dân tra cứu tiến trình đóng phí theo mã căn, không cần login.
2. Quản trị nội bộ có login, phân quyền `SUPER_ADMIN`, `MANAGER` và `TECHNICIAN`.

## Nguyên Tắc Đã Chốt

- Tiếp tục dùng PostgreSQL.
- Không chuyển SQL Server ở giai đoạn này.
- Excel T5/2026 là mốc dữ liệu quá khứ chuẩn khi được import/chốt đúng file final.
- Từ T6/2026, hướng vận hành chính là import sao kê ngân hàng, duyệt giao dịch, lưu bằng chứng khi cần và chốt public theo kỳ.
- Public page chỉ đọc dữ liệu đã được Super Admin chốt.
- Public không hiển thị phone, CCCD, thường trú, ghi chú nội bộ, ghi chú gốc Excel.
- Contact bẩn phải đi qua staging/review, không đổ thẳng vào contact master.
- Super Admin mới được import/chốt dữ liệu phí public, duyệt sao kê, quản lý thông báo và quản lý tài khoản.
- Super Admin có thể tạo thêm tài khoản `SUPER_ADMIN`, `MANAGER`, hoặc `TECHNICIAN` từ UI.
- Manager và kỹ thuật ngang quyền: tra cứu nội bộ, xem liên hệ cư dân/dữ liệu gốc, gọi nhanh cư dân, tự quản lý tài khoản cá nhân.
- Manager và kỹ thuật không được import/chốt phí, duyệt sao kê, tạo tài khoản hoặc đổi phân quyền.
- File cũ hoặc không dùng nữa chuyển vào `archive/`, không xóa thẳng.
- Project chỉ nên có một nguồn thuật toán parser mã căn chính để tránh xung đột.

## Trạng Thái Hiện Tại

### Đã Hoàn Thành

- Nền DB V2/PostgreSQL đã hoạt động.
- Đã import danh sách `934` căn hộ.
- Đã có public page cư dân `/`.
- Đã có route tra cứu phí `/tra-cuu-phi`.
- Đã có auth/admin:
  - `/admin/login`
  - `/admin`
  - `/admin/dashboard`
  - `/admin/import`
  - `/admin/transactions/review`
  - `/admin/announcements`
  - `/admin/accounts`
  - `/admin/me`
- Đã có parser mã căn dùng cho public search, dashboard và sao kê.
- Đã có dashboard nội bộ mobile-first/desktop usable.
- Đã có màn hình duyệt sao kê Phase 2:
  - danh sách giao dịch
  - chi tiết giao dịch
  - gợi ý căn hộ
  - duyệt nhanh
  - duyệt kèm bằng chứng
  - phân bổ nhiều căn
  - bảo lưu/từ chối
- Đã có luồng tạo preview public sau duyệt và xác nhận chốt public.
- Đã có upload thông báo PDF cho cư dân xem public.
- MVP đã deploy production tại `https://noxhandong.vn`.

### Đang Hoàn Thiện

- Chuẩn hóa dữ liệu sau khi xác định file T5 final đúng.
- Dọn các luồng import cũ để tránh dùng nhầm file test.
- Rà soát chống trùng sao kê khi import nhiều file chồng ngày.
- Hợp nhất nguồn parser, đưa file cũ không dùng vào `archive/`.
- Tối ưu giao diện duyệt sao kê và preview public.
- Tối ưu dashboard tra cứu nội bộ, biểu đồ phân bố tháng đã đóng đến và danh sách cắt điện.
- Chuẩn hóa phân quyền UI/menu theo role.

## Phase 1 - MVP Public/Admin

Trạng thái: **hoàn thành và đã deploy production**.

Phạm vi:

- Cư dân tra cứu phí không cần login.
- Admin đăng nhập.
- Super Admin import/chốt dữ liệu public.
- PostgreSQL chạy trên VPS.
- HTTPS qua Caddy.
- Service Next.js chạy bằng NSSM.

## Phase 2 - Sao Kê Là Luồng Chính

Roadmap chi tiết nằm trong [phase-2-roadmap.md](phase-2-roadmap.md).

Mục tiêu Phase 2:

- Dùng file theo dõi thu phí T5 final làm mốc opening balance.
- Từ T6/2026 trở đi, import sao kê ngân hàng vào DB.
- Sao kê thô phải chống trùng bằng mã tham chiếu/fingerprint.
- Chỉ giao dịch sau mốc chốt mới đi vào hàng chờ duyệt.
- Giao dịch có bằng chứng Zalo/ảnh phải lưu lại được và xem lại được.
- Duyệt xong mới tạo lịch sử phí.
- Cuối kỳ tạo preview public, kiểm tra rồi mới xác nhận public.
- Có đối soát theo tháng để so với file Excel vận hành/thủ công khi cần.

## Task Ưu Tiên Gần

1. Làm sạch tài liệu xương sống bị lỗi encoding.
2. Chốt lại một file schema Prisma duy nhất đang hoạt động.
3. Rà soát các bảng/dữ liệu sao kê bị sinh trùng khi import nhiều file chồng ngày.
4. Rà soát code parser, archive các parser cũ hoặc script thử nghiệm không còn dùng.
5. Tối ưu bộ lọc duyệt sao kê:
   - tìm theo mã căn đã duyệt
   - tìm theo bằng chứng
   - tìm theo trạng thái bảo lưu/từ chối/đã duyệt
6. Hoàn thiện preview public:
   - highlight đúng đoạn nội dung chuyển khoản đã dùng để parser
   - thêm cột bằng chứng nếu giao dịch duyệt bằng ảnh
7. Hoàn thiện phân quyền UI/menu theo role.
8. Chuẩn bị quy trình deploy Phase 2 theo [deploy-vps-step-by-step.md](deploy-vps-step-by-step.md).

## Rủi Ro Chính

- Dùng nhầm file Excel test thay vì file T5 final.
- Import sao kê chồng ngày tạo dữ liệu thô trùng quá nhiều.
- Nhiều file/parser cùng xử lý mã căn theo logic khác nhau.
- Dữ liệu public bị chốt khi chưa preview kỹ.
- Local và VPS lệch schema trước khi restore DB.
- Tài liệu deploy bị tách thành nhiều runbook khác nhau.

## Cổng Dừng Thủ Công

Phải dừng và xin xác nhận người dùng khi:

- xóa/reset DB thật
- restore DB local lên VPS
- deploy code mới lên production
- xác nhận public batch mới cho cư dân
- đổi schema ảnh hưởng dữ liệu thật
- xóa hoặc archive file/schema/parser cũ

## Quy Tắc Deploy

- Chỉ dùng một runbook deploy: [deploy-vps-step-by-step.md](deploy-vps-step-by-step.md).
- Local hiện là nguồn dữ liệu thật khi người dùng xác nhận.
- Khi VPS schema cũ hơn local:
  1. backup VPS
  2. update code/schema trên VPS
  3. chạy migration hoặc reset schema theo hướng dẫn
  4. restore DB local authoritative
  5. copy `public/uploads/evidence` nếu cần
  6. build/start lại service
  7. nghiệm thu production

## Trạng Thái Tài Liệu

- `README.md`: menu đầu vào toàn project.
- `docs/README.md`: mục lục tài liệu xương sống.
- `docs/roadmap.md`: điều phối cấp cao.
- `docs/phase-2-roadmap.md`: chi tiết Phase 2.
- `docs/deploy-vps-step-by-step.md`: runbook deploy duy nhất.
- `docs/production-deploy-vps.md`: quyết định/checklist production, không phải runbook thao tác.

## Cập nhật tiến trình 2026-07-14

Trạng thái hiện tại:

- Phase 1 đã deploy thành công lên VPS/domain.
- Phase 2 đang vận hành ổn ở mức MVP mở rộng: tra cứu public, dashboard nội bộ, nhập sao kê, duyệt sao kê, public dữ liệu phí, thông báo PDF, danh bạ cư dân và các xuất file vận hành.
- Dữ liệu T5 final là mốc chốt quá khứ. Từ T6/2026 trở đi, giao dịch ngân hàng được import, duyệt, public theo kỳ.
- Local và VPS có thể lệch dữ liệu trong giai đoạn test; trước khi sync phải xác định rõ nguồn chuẩn. Hiện nguyên tắc là production/VPS có thể là nguồn thật sau khi đã vận hành, local dùng để phát triển và test.

Các việc còn theo dõi:

- Hoàn thiện quyền theo role bằng một nguồn phân quyền trung tâm.
- Tinh giản DB/code trùng lặp nhưng không xóa bảng/cột khi chưa có lợi ích rõ ràng.
- Hoàn thiện rollback/gỡ duyệt cho giao dịch chưa public; giao dịch đã public không gỡ trực tiếp, xử lý bằng giao dịch điều chỉnh/bổ sung.
- Cải thiện xuất Excel/Word theo yêu cầu thực tế sau khi mẫu vận hành được chốt.
