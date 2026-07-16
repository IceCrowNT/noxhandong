# Apartment Fee Reviewer

Web app quản lý và đối soát thu phí căn hộ. Project dùng PostgreSQL, import Excel/sao kê ngân hàng, khu quản trị nội bộ và trang public để cư dân tra cứu tiến trình đóng phí.

README này là **menu đầu vào của toàn project**. Chi tiết kỹ thuật, nghiệp vụ và roadmap nằm trong `docs/`.

## Đọc đầu tiên

1. [docs/README.md](docs/README.md) - mục lục tài liệu xương sống.
2. [docs/handoff.md](docs/handoff.md) - trạng thái bàn giao hiện tại.
3. [docs/nghiep-vu-he-thong.md](docs/nghiep-vu-he-thong.md) - mô tả nghiệp vụ hệ thống.
4. [docs/roadmap.md](docs/roadmap.md) - hướng đi và task cấp cao.
5. [docs/phase-2-roadmap.md](docs/phase-2-roadmap.md) - roadmap sau MVP.
6. [docs/checklist-trien-khai-va-nghiem-thu.md](docs/checklist-trien-khai-va-nghiem-thu.md) - checklist review/check/test/confirm.
7. [docs/checklist-duyet-truoc-deploy.md](docs/checklist-duyet-truoc-deploy.md) - cổng dừng thủ công trước deploy.
8. [docs/database.md](docs/database.md) - thiết kế database mục tiêu.
9. [docs/module-map.md](docs/module-map.md) - cấu trúc thư mục và ranh giới module.
10. [docs/parser-ma-can-ho.md](docs/parser-ma-can-ho.md) - rule, dữ liệu thật và backlog parser mã căn.
11. [docs/design-system.md](docs/design-system.md) - global design/pattern cho UI.
12. [docs/thiet-ke-duyet-sao-ke-phase-2.md](docs/thiet-ke-duyet-sao-ke-phase-2.md) - thiết kế màn duyệt sao kê Phase 2.
13. [docs/production-deploy-vps.md](docs/production-deploy-vps.md) - quyết định/checklist production VPS, không phải runbook thao tác.
14. [docs/deploy-vps-step-by-step.md](docs/deploy-vps-step-by-step.md) - runbook deploy/vận hành VPS duy nhất.
15. [docs/vps-phase-2-todolist.md](docs/vps-phase-2-todolist.md) - todo VPS Phase 2, gồm backup/timezone/deploy.

File control tiến trình cấp cao: [docs/roadmap.md](docs/roadmap.md).

File control nghiệm thu chi tiết: [docs/checklist-trien-khai-va-nghiem-thu.md](docs/checklist-trien-khai-va-nghiem-thu.md).

## Mục tiêu hiện tại

- Public page cho cư dân tra cứu tiến trình đóng phí, không cần login.
- Admin/Manager/Kỹ thuật đăng nhập để xem dữ liệu nội bộ theo quyền.
- Super Admin import/chốt dữ liệu thu phí trước khi public.
- PostgreSQL là database chính.
- Dữ liệu T5/2026 là mốc quá khứ chuẩn; từ T6/2026 hướng vận hành là import sao kê ngân hàng, duyệt giao dịch và chốt public theo kỳ.

## Trạng thái ngắn

- DB dev đã migrate/reset sang V2.
- Đã import `934` căn từ `Danh_Sach_Can_Ho_Master.xlsx`.
- Đã có auth/admin nền, dashboard quản lý, review contact, import sao kê DB và public route `/tra-cuu-phi`.
- Trang chủ `/` là trang cư dân mobile-first, có form tra cứu và lối vào `/admin/login`.
- MVP đã deploy production tại `https://noxhandong.vn`.
- Task tiếp theo theo roadmap: Phase 2, chốt opening balance T5/2026 và xây luồng sao kê từ T6/2026.

Xem chi tiết trong [docs/handoff.md](docs/handoff.md).

## Tài liệu chính

| File | Vai trò |
| --- | --- |
| [docs/README.md](docs/README.md) | Mục lục tài liệu |
| [docs/handoff.md](docs/handoff.md) | Trạng thái bàn giao |
| [docs/nghiep-vu-he-thong.md](docs/nghiep-vu-he-thong.md) | Mô tả nghiệp vụ tổng quan để bàn giao người mới |
| [docs/roadmap.md](docs/roadmap.md) | Điều phối hướng đi và task cấp cao |
| [docs/phase-2-roadmap.md](docs/phase-2-roadmap.md) | Roadmap sau MVP: opening balance T5/2026, import sao kê từ T6/2026, duyệt giao dịch, lưu bằng chứng, thống kê, admin user |
| [docs/checklist-trien-khai-va-nghiem-thu.md](docs/checklist-trien-khai-va-nghiem-thu.md) | Điều kiện nghiệm thu từng task |
| [docs/checklist-duyet-truoc-deploy.md](docs/checklist-duyet-truoc-deploy.md) | Cổng duyệt thủ công trước deploy |
| [docs/database.md](docs/database.md) | Database mục tiêu |
| [docs/module-map.md](docs/module-map.md) | Cấu trúc project, module hiện tại và module mục tiêu |
| [docs/parser-ma-can-ho.md](docs/parser-ma-can-ho.md) | Parser mã căn, test case, bảo trì thuật toán |
| [docs/design-system.md](docs/design-system.md) | Design system mobile-first cho public/admin UI |
| [docs/thiet-ke-duyet-sao-ke-phase-2.md](docs/thiet-ke-duyet-sao-ke-phase-2.md) | Spec màn duyệt sao kê Phase 2: không kéo ngang, một màn desktop 24 inch, đánh giá chất lượng thông tin |
| [docs/stitch-mobile-ui-prompt.md](docs/stitch-mobile-ui-prompt.md) | Prompt thiết kế mobile-first trên Stitch |
| [docs/production-deploy-vps.md](docs/production-deploy-vps.md) | Quyết định/checklist production VPS; không dùng làm runbook thao tác |
| [docs/deploy-vps-step-by-step.md](docs/deploy-vps-step-by-step.md) | Runbook deploy/vận hành VPS duy nhất: DNS, PostgreSQL, NSSM service, Caddy HTTPS, backup, restore DB local authoritative |
| [docs/vps-phase-2-todolist.md](docs/vps-phase-2-todolist.md) | Todo riêng cho VPS Phase 2: backup, timezone, migration, nghiệm thu production |
| [docs/setup-may-moi-va-database.md](docs/setup-may-moi-va-database.md) | Setup máy mới và database |

## Cấu trúc project

README không mô tả chi tiết cấu trúc thư mục để tránh lặp tài liệu.

Xem bản đồ module tại [docs/module-map.md](docs/module-map.md).

## Chạy local

```bash
npm install
npm run db:start:windows
npm run dev
```

Mở `http://localhost:3000`.

Trên Windows hiện tại, Node.js và PostgreSQL đã được cài bản full. PostgreSQL chạy bằng service `postgresql-x64-17`; nếu terminal chưa nhận `node`/`npm`/`psql`, đóng VS Code hoặc terminal rồi mở lại.

Chỉ dùng Node portable trong repo khi cần fallback:

```powershell
$env:PATH = "$PWD\.tools\node-v22.13.1-win-x64;$env:PATH"
npm run dev
```

## Lệnh thường dùng

```bash
npm test
npm run build
npm run prisma:validate
npm run prisma:generate
```

## Ghi chú

MVP cũ xử lý file trong bộ nhớ vẫn còn một số route/API để tương thích. Hướng phát triển chính hiện tại là DB V2 theo tài liệu trong `docs/`.

## Mốc hiện hành 2026-07-14

App hiện đang vận hành ổn theo mô hình Phase 2:

- Cư dân tra cứu phí public không cần đăng nhập.
- Admin vận hành qua dashboard, nhập sao kê, duyệt giao dịch, chốt public và quản lý thông báo PDF.
- Dữ liệu Excel T5 final là mốc quá khứ chuẩn; từ T6/2026 trở đi, sao kê ngân hàng sau khi duyệt là nguồn phát sinh chính.
- File xương sống trong `docs/` là nguồn điều phối nghiệp vụ, DB, parser, deploy và bàn giao. Khi có thay đổi lớn, cập nhật `docs/README.md`, `docs/roadmap.md`, `docs/handoff.md`, `docs/database.md`, `docs/parser-ma-can-ho.md` và `docs/deploy-vps-step-by-step.md`.
