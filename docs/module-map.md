# Sơ đồ module project

Cập nhật: 2026-07-28.

## Vai Trò

File này là nguồn điều phối cấu trúc source: code mới đặt ở đâu, module nào sở hữu nghiệp vụ nào, và route nào là UI/entrypoint.

## Nguyên Tắc Chung

- `app/`: route, page, server action và API route của Next.js.
- `src/modules/`: logic nghiệp vụ, query/view model, parser, import/export reusable.
- `components/`: component UI dùng lại; tách `components/admin`, `components/resident`, `components/ui`.
- `lib/`: lớp tương thích cũ và test legacy, không thêm nghiệp vụ mới nếu có thể đặt trong `src/modules`.
- `scripts/`: entrypoint CLI vận hành/import/report.
- `prisma/`: schema và migrations.
- `docs/`: tài liệu xương sống, rule nghiệp vụ, báo cáo dữ liệu.
- `public/uploads`: file runtime upload; không tự ý xóa hoặc coi như asset source tĩnh thông thường.

## Route Hiện Có

```text
app/
  page.tsx                              # Public home: lookup, announcements, resident footer
  tra-cuu-phi/page.tsx                  # Public fee lookup
  actions.ts                            # Stub feedback action, chưa nối webhook/DB thật
  uploads/[...path]/route.ts            # Serve public/uploads an toàn hơn static direct path

  admin/
    page.tsx                            # Redirect/entry admin
    actions.ts                          # Admin shared actions
    login/page.tsx
    profile/page.tsx
    accounts/page.tsx
    dashboard/page.tsx
    database/page.tsx
    database/apartment-financial-profile.tsx
    database/transaction-search-results.tsx
    import/page.tsx
    import/actions.ts
    import/public-preview/page.tsx
    transactions/review/page.tsx
    transactions/review/actions.ts
    contacts/review/page.tsx
    contacts/review/actions.ts
    announcements/page.tsx
    announcements/actions.ts

  api/export/
    fee-distribution-report/route.ts
    fee-notice-docx/route.ts
    fee-notice-list/route.ts
    monthly-bank-statement/route.ts
    monthly-fee-ledger/route.ts
```

## Module Hiện Có

```text
src/modules/
  apartments/
    dashboard.ts
    fee-notice-export.ts
    financial-profile.ts
  auth/
    current-user.ts
    identity.ts
    password.ts
    permissions.ts
    session.ts
  billing/
    fee-status.ts
    paid-through.ts
  contacts/
    directory.ts
    review.ts
  database/
    prisma.ts
    index.ts
  exports/
    monthly-bank-statement.ts
  imports/
    excel/
    pdf/
    monthly-closing.ts
    script-runner.ts
  shared/
    constants.ts
    labels.ts
    types.ts
    utils/
  transactions/
    import/bank-statement-common.ts
    matcher.ts
    parser/apartment-parser.ts
    review/
```

## Ownership Theo Nghiệp Vụ

| Nghiệp vụ | Route/UI | Module chính |
| --- | --- | --- |
| Public lookup phí | `/`, `/tra-cuu-phi` | `src/modules/billing` |
| Parser mã căn | public/admin/import/review | `src/modules/transactions/parser` |
| Dashboard nội bộ | `/admin/dashboard` | `src/modules/apartments/dashboard.ts` |
| Hồ sơ tài chính căn hộ | `/admin/database` | `src/modules/apartments/financial-profile.ts` |
| Xuất thông báo phí/cắt điện | `/api/export/fee-*` | `src/modules/apartments/fee-notice-export.ts` |
| Xuất sao kê tháng | `/api/export/monthly-bank-statement` | `src/modules/exports/monthly-bank-statement.ts` |
| Import/chốt dữ liệu | `/admin/import` | `src/modules/imports`, `src/modules/transactions/import` |
| Review giao dịch | `/admin/transactions/review` | `src/modules/transactions/review` |
| Danh bạ/review contact | `/admin/contacts/review` | `src/modules/contacts` |
| Auth/permission | mọi route admin | `src/modules/auth` |
| Thông báo public | `/admin/announcements`, `/` | hiện ở `app/admin/announcements` + `ThongBaoCongKhai`; chưa tách `src/modules/announcements` |
| Feedback cư dân | footer public | hiện là component + `app/actions.ts` stub; chưa có module/domain thật |

## Component Map

```text
components/ui/          # Button, Input, Table, Dialog, Select, Notice...
components/admin/       # AdminFrame, navigation, form/progress helpers
components/resident/    # Announcement dialog, PDF viewer, contact/feedback/footer
```

Quy tắc:

- Admin dùng `AdminFrame` và `components/ui`.
- Public giữ đơn giản, mobile-first, không thêm navigation khi chưa có chức năng thật.
- PDF viewer cư dân dùng client-only dynamic import vì `react-pdf/pdfjs` không chạy server-side.

## Quy Tắc Đặt Code Mới

| Loại việc | Nơi đặt |
| --- | --- |
| Page/route/server action ngắn | `app/...` |
| Logic nghiệp vụ dùng lại | `src/modules/<domain>` |
| Query/view model căn hộ | `src/modules/apartments` |
| Public fee lookup | `src/modules/billing` |
| Parser/matcher sao kê | `src/modules/transactions` |
| Import Excel/PDF | `src/modules/imports` hoặc `src/modules/transactions/import` |
| Contact/danh bạ | `src/modules/contacts` |
| Auth/role/session | `src/modules/auth` |
| Upload/file metadata nếu phình to | tạo `src/modules/documents` hoặc `src/modules/uploads` |
| Feedback cư dân thật | tạo module mới, ví dụ `src/modules/resident-feedback` |
| Script CLI | `scripts/` gọi vào `src/modules` |

## Nợ Cấu Trúc

- `app/admin/announcements` đang chứa logic upload/validate trực tiếp. Nếu tính năng thông báo mở rộng, tách sang module riêng.
- `app/actions.ts` là stub feedback, chưa có persistence.
- `app/uploads/[...path]/route.ts` đang đọc file trực tiếp từ disk; nếu có quyền riêng tư theo file, cần chuyển sang service kiểm quyền.
- `next.config.mjs` đang ignore TypeScript build errors; cần tắt khi nợ type đã sạch.
- `lib/` còn test/wrapper legacy; không thêm nghiệp vụ mới vào đây.

## Cổng Kiểm Tra Khi Đổi Cấu Trúc

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Nếu đổi Prisma/schema:

```bash
npm run prisma:validate
npm run prisma:generate
```

Nếu đổi parser mã căn:

- cập nhật `docs/parser-ma-can-ho.md`
- thêm/điều chỉnh test
- chạy `npm test`
