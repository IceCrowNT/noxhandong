# Apartment Fee Reviewer

Web app quản lý/đối soát thu phí căn hộ. Project đang phát triển theo hướng PostgreSQL, import Excel, quản trị nội bộ và trang public để cư dân tra cứu tiến trình đóng phí.

README này là **menu đầu vào của toàn project**. Chi tiết kỹ thuật và nghiệp vụ nằm trong `docs/`.

## Đọc đầu tiên

1. [docs/README.md](docs/README.md) - mục lục tài liệu xương sống
2. [docs/handoff.md](docs/handoff.md) - trạng thái bàn giao hiện tại
3. [docs/roadmap.md](docs/roadmap.md) - hướng đi và task cấp cao
4. [docs/checklist-trien-khai-va-nghiem-thu.md](docs/checklist-trien-khai-va-nghiem-thu.md) - checklist review/check/test/confirm
5. [docs/checklist-duyet-truoc-deploy.md](docs/checklist-duyet-truoc-deploy.md) - cổng dừng thủ công trước deploy
6. [docs/database-v2.md](docs/database-v2.md) - thiết kế database mục tiêu
7. [docs/module-map.md](docs/module-map.md) - cấu trúc thư mục và ranh giới module
8. [docs/parser-ma-can-ho.md](docs/parser-ma-can-ho.md) - rule, dữ liệu thật và backlog parser mã căn
9. [docs/design-system.md](docs/design-system.md) - global design/pattern cho UI
10. [docs/production-deploy-vps.md](docs/production-deploy-vps.md) - quyết định production VPS

File control tiến trình cấp cao: [docs/roadmap.md](docs/roadmap.md).

File control nghiệm thu chi tiết: [docs/checklist-trien-khai-va-nghiem-thu.md](docs/checklist-trien-khai-va-nghiem-thu.md).

## Mục tiêu hiện tại

- Public page cho cư dân tra cứu tiến trình đóng phí, không cần login.
- Admin/Manager đăng nhập để xem dữ liệu nội bộ theo quyền.
- Super Admin import/chốt dữ liệu thu phí trước khi public.
- PostgreSQL là database chính.
- Excel vẫn là nguồn vận hành thủ công ở giai đoạn đầu.

## Trạng thái ngắn

- DB dev đã migrate/reset sang V2.
- Đã import `934` căn từ `Danh_Sach_Can_Ho_Master.xlsx`.
- Đã sinh `1977` contact candidate, chưa nhập thẳng vào contact master.
- Đã có auth/admin nền, dashboard quản lý, review contact, import sao kê DB và public route `/tra-cuu-phi`.
- Trang chủ `/` hiện là trang cư dân mobile-first, có form tra cứu và lối vào `/admin/login`.
- Task tiếp theo theo roadmap: Deploy public web.

Xem chi tiết trong [docs/handoff.md](docs/handoff.md).

## Tài liệu chính

| File | Vai trò |
| --- | --- |
| [docs/README.md](docs/README.md) | Mục lục tài liệu |
| [docs/handoff.md](docs/handoff.md) | Trạng thái bàn giao |
| [docs/roadmap.md](docs/roadmap.md) | Điều phối hướng đi và task cấp cao |
| [docs/checklist-trien-khai-va-nghiem-thu.md](docs/checklist-trien-khai-va-nghiem-thu.md) | Điều kiện nghiệm thu từng task |
| [docs/checklist-duyet-truoc-deploy.md](docs/checklist-duyet-truoc-deploy.md) | Cổng duyệt thủ công trước deploy |
| [docs/database-v2.md](docs/database-v2.md) | Database mục tiêu |
| [docs/module-map.md](docs/module-map.md) | Cấu trúc project, module hiện tại và module mục tiêu |
| [docs/parser-ma-can-ho.md](docs/parser-ma-can-ho.md) | Parser mã căn, test case, bảo trì thuật toán |
| [docs/design-system.md](docs/design-system.md) | Design system mobile-first cho public/admin UI |
| [docs/stitch-mobile-ui-prompt.md](docs/stitch-mobile-ui-prompt.md) | Prompt thiết kế mobile-first trên Stitch |
| [docs/production-deploy-vps.md](docs/production-deploy-vps.md) | Deploy production trên VPS, PostgreSQL, domain, backup, Super Admin |
| [docs/setup-may-moi-va-database.md](docs/setup-may-moi-va-database.md) | Setup máy mới và database |

## Cấu trúc project

Không mô tả chi tiết ở README để tránh lặp.

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
