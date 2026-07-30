# Apartment Fee Reviewer

Web app quản lý và đối soát thu phí căn hộ cho BQT An Đồng. Hệ thống dùng Next.js, PostgreSQL và Prisma để nhập dữ liệu vận hành, duyệt sao kê ngân hàng, chốt trạng thái phí public, xuất file nghiệp vụ và cung cấp trang tra cứu cho cư dân.

Trạng thái tài liệu được cập nhật theo workspace ngày 2026-07-28. Các thay đổi chưa commit vẫn được xem là thực trạng hiện tại nếu đang có trong cây source.

## Phân hệ chính

- Public: `/` và `/tra-cuu-phi`, cư dân tra cứu phí không cần đăng nhập, xem thông báo public, đầu mối liên hệ, thông tin chuyển khoản và liên kết góp ý/Zalo.
- Admin: `/admin/dashboard`, `/admin/database`, `/admin/import`, `/admin/transactions/review`, `/admin/contacts/review`, `/admin/accounts`, `/admin/announcements`, `/admin/profile`.
- API export: xuất danh sách thông báo, Word thông báo phí/cắt điện, báo cáo phân bổ phí, sổ tháng và sao kê tháng.
- Uploads: file bằng chứng và thông báo public nằm dưới `public/uploads`, có route phục vụ file `/uploads/[...path]`.

## Công nghệ

- Next.js `15.2.4`, React `19`.
- PostgreSQL + Prisma `7.7`.
- Tailwind CSS v4 + bộ component nội bộ kiểu shadcn/ui.
- `react-pdf` dùng cho trình xem PDF thông báo trong dialog cư dân.
- Vitest cho unit test, Playwright cho audit mobile.

## Chạy local

```bash
npm install
npm run db:start:windows
npm run prisma:migrate:deploy
npm run prisma:generate
npm run dev
```

Mở `http://localhost:3000`.

Trên Windows, nếu terminal chưa nhận `node`, `npm` hoặc `psql`, đóng VS Code/terminal rồi mở lại. Chỉ dùng Node portable trong repo khi cần fallback:

```powershell
$env:PATH = "$PWD\.tools\node-v22.13.1-win-x64;$env:PATH"
npm run dev
```

## Lệnh kiểm tra

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
npm run prisma:validate
```

Lưu ý: `next.config.mjs` hiện đang đặt `typescript.ignoreBuildErrors = true` để build không chặn bởi lỗi TypeScript. Vì vậy `npx tsc --noEmit` vẫn là cổng kiểm tra bắt buộc trước khi deploy.

## Tài liệu

Đọc [docs/README.md](docs/README.md) để xem mục lục tài liệu xương sống: handoff, roadmap, database, module map, nghiệp vụ hệ thống và design system.
