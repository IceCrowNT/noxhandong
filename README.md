# Apartment Fee Reviewer

Web app quản lý và đối soát thu phí căn hộ. Project sử dụng PostgreSQL, hỗ trợ import dữ liệu từ Excel/sao kê ngân hàng, cung cấp khu vực quản trị nội bộ cho Ban Quản Trị và trang tra cứu public dành cho cư dân.

Tài liệu chi tiết về kỹ thuật, nghiệp vụ, thiết kế cơ sở dữ liệu và kế hoạch phát triển (Roadmap) được lưu trữ tại thư mục `docs/`.

## Tài liệu dự án

Vui lòng truy cập [docs/README.md](docs/README.md) để xem mục lục các tài liệu quan trọng và hướng dẫn hệ thống.

## Chạy Local

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
