# Sơ đồ module project

## Vai trò file này

`docs/module-map.md` là file xương sống về cấu trúc thư mục và ranh giới module.

File này trả lời:

- code mới nên đặt ở đâu
- module nào sở hữu phần nghiệp vụ nào
- `app/`, `src/modules/`, `lib/`, `scripts/`, `prisma/`, `docs/` khác nhau như thế nào
- phụ thuộc giữa các module đi theo chiều nào

File này không thay thế roadmap sản phẩm. Roadmap nằm ở [roadmap.md](roadmap.md).

Module map phải làm hai việc cùng lúc:

- phản ánh cấu trúc thực tế hiện tại
- định trước cấu trúc tối thiểu khi hoàn tất roadmap hiện tại và các chức năng đã chốt/thảo luận

## Nguyên tắc chung

- `src/modules/` là nơi đặt logic nghiệp vụ mới.
- `app/` là route/UI shell của Next.js, chỉ nên gọi vào `src/modules/`.
- `lib/` là lớp tương thích cũ của MVP, chưa xóa vì còn test và import cũ.
- `components/` chỉ giữ component cũ hoặc component rất chung.
- `scripts/` là entrypoint vận hành/import/report chạy bằng CLI.
- `prisma/` sở hữu schema/migration, không chứa nghiệp vụ UI.
- `docs/` sở hữu tài liệu xương sống, rule, báo cáo dữ liệu thật.

## Cấu trúc thực tế hiện tại

```text
app/
  admin/
    accounts/
    import/
    login/
  api/
    analyze/
    export/
  tra-cuu-phi/

src/
  modules/
    apartments/
    auth/
    billing/
    contacts/
    database/
    documents/
    exceptions/
    imports/
    residents/
    shared/
    transactions/

lib/
  billing/
  excel/
  parser/
  pdf/
  review/

scripts/
  setup/
  *.cjs

prisma/
  migrations/
  schema.prisma
  schema-v2.prisma

docs/
  reports/
  preview-lien-he-can-ho/
  preview-master-lien-he-can-ho/
  preview-theo-doi-thu-phi/
```

## Cấu trúc mục tiêu khi hoàn tất roadmap

Đây là cấu trúc định hướng. Không cần tạo hết file ngay, nhưng khi phát triển Task K/L/M/N và các chức năng đã thảo luận thì phải bám theo sơ đồ này.

```text
app/
  admin/
    accounts/
    apartments/
      [maCan]/
    contacts/
      review/
    dashboard/
    imports/
      fee-tracking/
      statements/
    login/
    transactions/
      review/
    page.tsx

  api/
    public/
      fee-status/
    admin/
      imports/
      contacts/
      transactions/

  tra-cuu-phi/

src/
  modules/
    apartments/
      repositories/
      services/
      ui/
      view-models/

    auth/
      guards/
      repositories/

    billing/
      fee-rules/
      fee-tracking/
      public-status/
      repositories/
      services/
      ui/

    contacts/
      parser/
      review/
      repositories/
      services/
      ui/

    database/
      repositories/
      prisma.ts

    documents/
      templates/
      exports/
      repositories/

    exceptions/
      classifiers/
      repositories/
      services/
      ui/

    imports/
      excel/
      pdf/
      validators/
      jobs/

    notifications/
      templates/
      services/

    reports/
      generators/
      exporters/

    shared/
      security/
      utils/
      validation/

    transactions/
      allocation/
      matcher/
      parser/
      review/
      repositories/
      services/
      ui/

scripts/
  import-*.cjs
  preview-*.cjs
  publish-*.cjs
  report-*.cjs
  seed-*.cjs
  setup/
```

Ghi chú:

- `contacts/` là module mục tiêu rõ hơn cho liên hệ cư dân. `residents/` hiện có thể giữ tạm, nhưng khi làm mới nên ưu tiên tên `contacts/` nếu code chủ yếu xử lý liên hệ/số điện thoại.
- `notifications/` chỉ tạo khi thật sự có chức năng gửi thông báo/SMS/email/Zalo hoặc template nhắc phí. Hiện chưa cần build.
- `reports/` trong `src/modules/` là generator/exporter chạy code. `docs/reports/` là nơi lưu kết quả báo cáo đã sinh.
- `documents/` dùng cho template, chứng từ, file xuất, thông báo Word/PDF nếu sau này quản lý trong app.

## Bản đồ task sang module

| Task/chức năng | Route/UI | Module chính | Module phụ |
| --- | --- | --- | --- |
| Public cư dân tra cứu phí | `app/tra-cuu-phi` | `billing/public-status` | `transactions/parser`, `shared/security` |
| Admin login/session | `app/admin/login` | `auth` | `database` |
| Quản lý tài khoản manager | `app/admin/accounts` | `auth` | `database` |
| Task K dashboard quản lý | `app/admin/dashboard`, `app/admin/apartments` | `apartments` | `billing`, `contacts`, `auth` |
| Tìm căn và xem hồ sơ căn | `app/admin/apartments/[maCan]` | `apartments` | `contacts`, `billing`, `transactions` |
| Task L review contact | `app/admin/contacts/review` | `contacts/review` | `imports`, `auth` |
| Import file theo dõi thu phí | `app/admin/imports/fee-tracking` | `billing/fee-tracking` | `imports/excel`, `documents` |
| Chốt batch public | `app/admin/imports/fee-tracking` | `billing/public-status` | `auth` |
| Task M import sao kê | `app/admin/imports/statements` | `transactions` | `imports/excel`, `imports/pdf` |
| Review giao dịch | `app/admin/transactions/review` | `transactions/review` | `exceptions`, `apartments` |
| Allocation nhiều căn | `app/admin/transactions/review` | `transactions/allocation` | `billing` |
| Ngoại lệ ck nhầm/nộp hộ/không rõ căn | `app/admin/transactions/review` | `exceptions` | `transactions` |
| Báo cáo/preview dữ liệu | route admin hoặc CLI | `reports` | `documents`, `imports` |
| Deploy/production ops | không phải app route | `scripts/setup`, docs setup | `database`, `auth` |

## Vai trò từng vùng

### `app/`

Chứa route/page/action của Next.js.

Đang có:

- `app/admin/login`: đăng nhập quản trị
- `app/admin`: trang quản trị nội bộ
- `app/admin/accounts`: quản lý tài khoản, chỉ `SUPER_ADMIN`
- `app/admin/import`: vùng import/chốt dữ liệu, chỉ `SUPER_ADMIN`
- `app/tra-cuu-phi`: trang public cư dân tra cứu phí
- `app/api/analyze`, `app/api/export`: API MVP cũ còn dùng memory flow

Quy tắc:

- route mới chỉ điều phối request, auth, render UI
- logic nghiệp vụ đặt trong `src/modules/`
- không đặt parser, matcher, repository dài trực tiếp trong `app/`

### `src/modules/shared`

Chứa phần dùng chung toàn app:

- hằng số
- kiểu dữ liệu chung
- rule lọc chung
- helper normalize text

Quy tắc:

- `shared` không được import ngược domain module như `billing`, `auth`, `transactions`
- chỉ chứa logic thật sự dùng chung

### `src/modules/database`

Chứa kết nối database và Prisma client.

Đang có:

- `prisma.ts`
- `index.ts`

Quy tắc:

- Prisma client dùng chung đặt ở đây
- repository hoặc query chuyên biệt nên đặt gần domain nếu phình to
- không đặt UI logic trong module này

### `src/modules/auth`

Chứa auth quản trị:

- lấy user hiện tại
- hash/verify password
- session cookie HTTP-only có chữ ký
- kiểm quyền `SUPER_ADMIN` / `MANAGER`

Quy tắc:

- mọi route admin phải đi qua auth/session
- logic role guard đặt ở đây hoặc helper gần đây
- không để route tự kiểm role bằng string rời rạc lặp lại nhiều nơi

### `src/modules/billing`

Chứa nghiệp vụ phí/public fee lookup.

Đang có:

- `fee-status.ts`: parse input public lookup và lấy trạng thái phí public

Quy tắc:

- chỉ đọc snapshot public đã chốt khi phục vụ cư dân
- không trả phone/contact/ghi chú nội bộ ra public
- nếu cần rule tháng phí, đặt tại đây hoặc module con của billing

### `src/modules/imports`

Chứa luồng nhập liệu từ file:

- đọc Excel quản lý
- đọc sao kê Excel
- đọc sao kê PDF
- export workbook kết quả

Quy tắc:

- parser đọc file chỉ biến file thành record thô hoặc record chuẩn hóa
- không tự quyết định duyệt nghiệp vụ
- import DB dài nên có script entrypoint trong `scripts/`, logic chính đặt ở `src/modules/imports`

### `src/modules/transactions`

Chứa logic xoay quanh giao dịch sao kê:

- matcher
- parser mã căn
- phân loại trạng thái
- summary
- allocation nhiều căn
- UI review cũ

Parser mã căn là thuật toán lõi dùng chung cho sao kê, matcher và public lookup. Tài liệu điều phối rule/case/backlog nằm tại [parser-ma-can-ho.md](parser-ma-can-ho.md).

Contract kỳ vọng của parser mã căn:

- nhận input text thô
- trả mã căn/candidate đã chuẩn hóa
- trả lý do match (`matchReason`) và độ tin cậy nếu có
- không tự query DB
- không tự ghi DB master
- không tự quyết định public dữ liệu

### `src/modules/apartments`

Module dành cho nghiệp vụ căn hộ.

Hiện mới có README giữ chỗ. Khi làm Task K dashboard, đây là nơi hợp lý để đặt:

- query tìm căn theo mã
- view model thông tin căn
- repository hoặc service liên quan `can_ho`

### `src/modules/residents`

Module chuyển tiếp dành cho cư dân/contact.

Hiện mới có README giữ chỗ. Task L đã dùng module mục tiêu `src/modules/contacts` cho review contact, nên không thêm logic contact mới vào `residents`.

Ghi chú định hướng:

- nếu code mới chủ yếu xử lý liên hệ/số điện thoại/ghi chú, nên tách sang module mục tiêu `src/modules/contacts`
- `residents` chỉ nên dùng khi sau này quản lý hồ sơ cư dân như một thực thể rộng hơn contact

### `src/modules/contacts`

Module mục tiêu cho liên hệ căn hộ và review contact.

Đang có nền review contact nội bộ từ Task L.

Sở hữu:

- parser contact từ file master
- staging contact candidate
- approve/reject contact
- tạo/sửa `lien_he_can_ho`
- quy tắc dữ liệu nhạy cảm trong admin
- view model cho manager xem contact/ghi chú gốc

Không sở hữu:

- public fee lookup
- parser mã căn trong sao kê
- auth/role

### `src/modules/exceptions`

Module dành cho ngoại lệ nghiệp vụ:

- chuyển khoản nhầm
- kế toán/chủ đầu tư chuyển hộ
- không rõ căn
- giao dịch cần xử lý tay

Hiện mới có README giữ chỗ.

### `src/modules/documents`

Module dành cho tài liệu/chứng từ/sao lưu file nếu sau này cần quản lý metadata file.

Hiện mới có README giữ chỗ.

Khi mở rộng, module này có thể sở hữu:

- template thông báo phí
- file xuất Excel/PDF
- metadata file import/export
- lịch sử file đã phát hành

### `src/modules/notifications` dự kiến

Module chỉ tạo khi có nhu cầu gửi thông báo thật.

Có thể sở hữu:

- template nội dung nhắc phí
- queue gửi SMS/email/Zalo nếu sau này tích hợp
- log gửi thông báo
- rule chọn contact nhận thông báo

Không tạo sớm nếu chưa có chức năng gửi thật, để tránh phình project.

### `src/modules/reports` dự kiến

Module code để sinh báo cáo/preview.

Khác với `docs/reports/`:

- `src/modules/reports` là code generator/exporter
- `docs/reports` là output tài liệu đã sinh hoặc báo cáo đã chốt

Nên tạo khi các script report hiện tại bắt đầu lặp logic hoặc cần chạy từ UI admin.

## `lib/` và lớp tương thích cũ

`lib/` hiện vẫn tồn tại vì MVP cũ và test đang dùng:

- `lib/parser/apartment-parser.test.ts`
- `lib/matcher.test.ts`
- `lib/pdf/statement-pdf-reader.test.ts`
- `lib/review/allocations.test.ts`
- các wrapper re-export logic từ `src/modules`

Quy tắc:

- không thêm nghiệp vụ mới vào `lib/` nếu có thể đặt trong `src/modules/`
- nếu phải thêm test ở `lib/`, test nên kiểm behavior của module thật
- chuyển dần import từ `lib/` sang `src/modules/` khi ổn định

## `scripts/`

`scripts/` là nơi đặt lệnh vận hành:

- seed DB
- import Excel
- sync master
- preview contact
- publish batch public
- backup/restore dev DB

Quy tắc:

- script chỉ là entrypoint CLI mỏng
- logic xử lý dài nên tách về `src/modules/`
- script phải ghi rõ input/output trong log
- script import dữ liệu thật phải giữ raw payload để audit

## `docs/`

`docs/` là nguồn sự thật của tài liệu dự án.

Nhóm xương sống ở gốc `docs/`:

- [README.md](README.md)
- [handoff.md](handoff.md)
- [roadmap.md](roadmap.md)
- [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md)
- [database-v2.md](database-v2.md)
- [module-map.md](module-map.md)
- [parser-ma-can-ho.md](parser-ma-can-ho.md)
- [setup-may-moi-va-database.md](setup-may-moi-va-database.md)

Báo cáo dữ liệu thật đã gom vào:

- [reports/README.md](reports/README.md)

Quy tắc:

- tài liệu đang điều phối dự án để ở gốc `docs/`
- báo cáo lịch sử/đối soát để trong `docs/reports/`
- preview sinh từ script để trong thư mục `preview-*`
- không dùng lịch sử chat làm nguồn sự thật chính

## Luật phụ thuộc

Chiều phụ thuộc mong muốn:

```text
app/
  -> src/modules/*
  -> components/ nếu là UI chung

scripts/
  -> src/modules/*
  -> prisma/database

src/modules/<domain>
  -> src/modules/database
  -> src/modules/shared

src/modules/shared
  -> không import domain module

lib/
  -> src/modules/* hoặc giữ code cũ tạm thời
```

Không nên:

- import từ `app/` vào `src/modules/`
- để `shared` import `billing`, `auth`, `transactions`
- để parser gọi DB trực tiếp
- để route public đọc raw import/contact nội bộ
- để script chứa toàn bộ nghiệp vụ dài mà không tách module

## Quy tắc đặt file mới

| Loại việc | Nơi đặt |
| --- | --- |
| Route/page Next.js | `app/...` |
| Auth/session/role | `src/modules/auth` |
| Query DB dùng chung | `src/modules/database` hoặc module domain |
| Dashboard căn hộ | `src/modules/apartments` + `app/admin` |
| Contact review | `src/modules/contacts` nếu tạo mới, tạm thời có thể dùng `src/modules/residents` |
| Public fee lookup | `src/modules/billing` + `app/tra-cuu-phi` |
| Parser mã căn | `src/modules/transactions/parser` |
| Rule parser/documentation | `docs/parser-ma-can-ho.md` |
| Import Excel/PDF | `src/modules/imports` |
| CLI import/seed/publish | `scripts/*.cjs` |
| Báo cáo dữ liệu thật | `docs/reports/` |
| Code sinh báo cáo | `src/modules/reports` khi cần dùng lại ngoài script |
| Template thông báo/chứng từ | `src/modules/documents` |
| Gửi thông báo | `src/modules/notifications` khi có tích hợp thật |
| Test parser/matcher | test hiện có trong `lib/**.test.ts`, về sau có thể chuyển gần module |

## Cổng kiểm tra khi đổi cấu trúc

Mỗi lần di chuyển module hoặc đổi import:

```bash
npm test
npm run build
```

Nếu đổi Prisma/schema:

```bash
npm run prisma:validate
npm run prisma:generate
```

Nếu đổi parser mã căn:

- cập nhật [parser-ma-can-ho.md](parser-ma-can-ho.md)
- thêm golden test
- chạy `npm test`

## Kết luận

Từ thời điểm này:

- `src/modules/` là cấu trúc chuẩn cho nghiệp vụ mới
- `app/` chỉ là lớp route/UI của Next.js
- `lib/` là lớp tương thích cũ, không phải nơi mở rộng chính
- `scripts/` là entrypoint vận hành, không phải nơi chứa toàn bộ nghiệp vụ dài hạn
- `docs/module-map.md` là file control cấu trúc thư mục
