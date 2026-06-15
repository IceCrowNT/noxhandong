# SÆ¡ Ä‘á»“ module project

## Vai trÃ² file nÃ y

`docs/module-map.md` lÃ  file xÆ°Æ¡ng sá»‘ng vá» cáº¥u trÃºc thÆ° má»¥c vÃ  ranh giá»›i module.

File nÃ y tráº£ lá»i:

- code má»›i nÃªn Ä‘áº·t á»Ÿ Ä‘Ã¢u
- module nÃ o sá»Ÿ há»¯u pháº§n nghiá»‡p vá»¥ nÃ o
- `app/`, `src/modules/`, `lib/`, `scripts/`, `prisma/`, `docs/` khÃ¡c nhau nhÆ° tháº¿ nÃ o
- phá»¥ thuá»™c giá»¯a cÃ¡c module Ä‘i theo chiá»u nÃ o

File nÃ y khÃ´ng thay tháº¿ roadmap sáº£n pháº©m. Roadmap náº±m á»Ÿ [roadmap.md](roadmap.md).

Module map pháº£i lÃ m hai viá»‡c cÃ¹ng lÃºc:

- pháº£n Ã¡nh cáº¥u trÃºc thá»±c táº¿ hiá»‡n táº¡i
- Ä‘á»‹nh trÆ°á»›c cáº¥u trÃºc tá»‘i thiá»ƒu khi hoÃ n táº¥t roadmap hiá»‡n táº¡i vÃ  cÃ¡c chá»©c nÄƒng Ä‘Ã£ chá»‘t/tháº£o luáº­n

## NguyÃªn táº¯c chung

- `src/modules/` lÃ  nÆ¡i Ä‘áº·t logic nghiá»‡p vá»¥ má»›i.
- `app/` lÃ  route/UI shell cá»§a Next.js, chá»‰ nÃªn gá»i vÃ o `src/modules/`.
- `lib/` lÃ  lá»›p tÆ°Æ¡ng thÃ­ch cÅ© cá»§a MVP, chÆ°a xÃ³a vÃ¬ cÃ²n test vÃ  import cÅ©.
- `components/` chá»‰ giá»¯ component cÅ© hoáº·c component ráº¥t chung.
- `scripts/` lÃ  entrypoint váº­n hÃ nh/import/report cháº¡y báº±ng CLI.
- `prisma/` sá»Ÿ há»¯u schema/migration, khÃ´ng chá»©a nghiá»‡p vá»¥ UI.
- `docs/` sá»Ÿ há»¯u tÃ i liá»‡u xÆ°Æ¡ng sá»‘ng, rule, bÃ¡o cÃ¡o dá»¯ liá»‡u tháº­t.

## Cáº¥u trÃºc thá»±c táº¿ hiá»‡n táº¡i

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

docs/
  reports/
  preview-lien-he-can-ho/
  preview-master-lien-he-can-ho/
  preview-theo-doi-thu-phi/
```

## Cáº¥u trÃºc má»¥c tiÃªu khi hoÃ n táº¥t roadmap

ÄÃ¢y lÃ  cáº¥u trÃºc Ä‘á»‹nh hÆ°á»›ng. KhÃ´ng cáº§n táº¡o háº¿t file ngay, nhÆ°ng khi phÃ¡t triá»ƒn Task K/L/M/N vÃ  cÃ¡c chá»©c nÄƒng Ä‘Ã£ tháº£o luáº­n thÃ¬ pháº£i bÃ¡m theo sÆ¡ Ä‘á»“ nÃ y.

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

Ghi chÃº:

- `contacts/` lÃ  module má»¥c tiÃªu rÃµ hÆ¡n cho liÃªn há»‡ cÆ° dÃ¢n. `residents/` hiá»‡n cÃ³ thá»ƒ giá»¯ táº¡m, nhÆ°ng khi lÃ m má»›i nÃªn Æ°u tiÃªn tÃªn `contacts/` náº¿u code chá»§ yáº¿u xá»­ lÃ½ liÃªn há»‡/sá»‘ Ä‘iá»‡n thoáº¡i.
- `notifications/` chá»‰ táº¡o khi tháº­t sá»± cÃ³ chá»©c nÄƒng gá»­i thÃ´ng bÃ¡o/SMS/email/Zalo hoáº·c template nháº¯c phÃ­. Hiá»‡n chÆ°a cáº§n build.
- `reports/` trong `src/modules/` lÃ  generator/exporter cháº¡y code. `docs/reports/` lÃ  nÆ¡i lÆ°u káº¿t quáº£ bÃ¡o cÃ¡o Ä‘Ã£ sinh.
- `documents/` dÃ¹ng cho template, chá»©ng tá»«, file xuáº¥t, thÃ´ng bÃ¡o Word/PDF náº¿u sau nÃ y quáº£n lÃ½ trong app.

## Báº£n Ä‘á»“ task sang module

| Task/chá»©c nÄƒng | Route/UI | Module chÃ­nh | Module phá»¥ |
| --- | --- | --- | --- |
| Public cÆ° dÃ¢n tra cá»©u phÃ­ | `app/tra-cuu-phi` | `billing/public-status` | `transactions/parser`, `shared/security` |
| Admin login/session | `app/admin/login` | `auth` | `database` |
| Quáº£n lÃ½ tÃ i khoáº£n manager | `app/admin/accounts` | `auth` | `database` |
| Task K dashboard quáº£n lÃ½ | `app/admin/dashboard`, `app/admin/apartments` | `apartments` | `billing`, `contacts`, `auth` |
| TÃ¬m cÄƒn vÃ  xem há»“ sÆ¡ cÄƒn | `app/admin/apartments/[maCan]` | `apartments` | `contacts`, `billing`, `transactions` |
| Task L review contact | `app/admin/contacts/review` | `contacts/review` | `imports`, `auth` |
| Import file theo dÃµi thu phÃ­ | `app/admin/imports/fee-tracking` | `billing/fee-tracking` | `imports/excel`, `documents` |
| Chá»‘t batch public | `app/admin/imports/fee-tracking` | `billing/public-status` | `auth` |
| Task M import sao kÃª | `app/admin/imports/statements` | `transactions` | `imports/excel`, `imports/pdf` |
| Review giao dá»‹ch | `app/admin/transactions/review` | `transactions/review` | `exceptions`, `apartments` |
| Allocation nhiá»u cÄƒn | `app/admin/transactions/review` | `transactions/allocation` | `billing` |
| Ngoáº¡i lá»‡ ck nháº§m/ná»™p há»™/khÃ´ng rÃµ cÄƒn | `app/admin/transactions/review` | `exceptions` | `transactions` |
| BÃ¡o cÃ¡o/preview dá»¯ liá»‡u | route admin hoáº·c CLI | `reports` | `documents`, `imports` |
| Deploy/production ops | khÃ´ng pháº£i app route | `scripts/setup`, docs setup | `database`, `auth` |

## Vai trÃ² tá»«ng vÃ¹ng

### `app/`

Chá»©a route/page/action cá»§a Next.js.

Äang cÃ³:

- `app/admin/login`: Ä‘Äƒng nháº­p quáº£n trá»‹
- `app/admin`: trang quáº£n trá»‹ ná»™i bá»™
- `app/admin/accounts`: quáº£n lÃ½ tÃ i khoáº£n, chá»‰ `SUPER_ADMIN`
- `app/admin/import`: vÃ¹ng import/chá»‘t dá»¯ liá»‡u, chá»‰ `SUPER_ADMIN`
- `app/tra-cuu-phi`: trang public cÆ° dÃ¢n tra cá»©u phÃ­
- `app/api/analyze`, `app/api/export`: API MVP cÅ© cÃ²n dÃ¹ng memory flow

Quy táº¯c:

- route má»›i chá»‰ Ä‘iá»u phá»‘i request, auth, render UI
- logic nghiá»‡p vá»¥ Ä‘áº·t trong `src/modules/`
- khÃ´ng Ä‘áº·t parser, matcher, repository dÃ i trá»±c tiáº¿p trong `app/`

### `src/modules/shared`

Chá»©a pháº§n dÃ¹ng chung toÃ n app:

- háº±ng sá»‘
- kiá»ƒu dá»¯ liá»‡u chung
- rule lá»c chung
- helper normalize text

Quy táº¯c:

- `shared` khÃ´ng Ä‘Æ°á»£c import ngÆ°á»£c domain module nhÆ° `billing`, `auth`, `transactions`
- chá»‰ chá»©a logic tháº­t sá»± dÃ¹ng chung

### `src/modules/database`

Chá»©a káº¿t ná»‘i database vÃ  Prisma client.

Äang cÃ³:

- `prisma.ts`
- `index.ts`

Quy táº¯c:

- Prisma client dÃ¹ng chung Ä‘áº·t á»Ÿ Ä‘Ã¢y
- repository hoáº·c query chuyÃªn biá»‡t nÃªn Ä‘áº·t gáº§n domain náº¿u phÃ¬nh to
- khÃ´ng Ä‘áº·t UI logic trong module nÃ y

### `src/modules/auth`

Chá»©a auth quáº£n trá»‹:

- láº¥y user hiá»‡n táº¡i
- hash/verify password
- session cookie HTTP-only cÃ³ chá»¯ kÃ½
- kiá»ƒm quyá»n `SUPER_ADMIN` / `MANAGER`

Quy táº¯c:

- má»i route admin pháº£i Ä‘i qua auth/session
- logic role guard Ä‘áº·t á»Ÿ Ä‘Ã¢y hoáº·c helper gáº§n Ä‘Ã¢y
- khÃ´ng Ä‘á»ƒ route tá»± kiá»ƒm role báº±ng string rá»i ráº¡c láº·p láº¡i nhiá»u nÆ¡i

### `src/modules/billing`

Chá»©a nghiá»‡p vá»¥ phÃ­/public fee lookup.

Äang cÃ³:

- `fee-status.ts`: parse input public lookup vÃ  láº¥y tráº¡ng thÃ¡i phÃ­ public

Quy táº¯c:

- chá»‰ Ä‘á»c snapshot public Ä‘Ã£ chá»‘t khi phá»¥c vá»¥ cÆ° dÃ¢n
- khÃ´ng tráº£ phone/contact/ghi chÃº ná»™i bá»™ ra public
- náº¿u cáº§n rule thÃ¡ng phÃ­, Ä‘áº·t táº¡i Ä‘Ã¢y hoáº·c module con cá»§a billing

### `src/modules/imports`

Chá»©a luá»“ng nháº­p liá»‡u tá»« file:

- Ä‘á»c Excel quáº£n lÃ½
- Ä‘á»c sao kÃª Excel
- Ä‘á»c sao kÃª PDF
- export workbook káº¿t quáº£

Quy táº¯c:

- parser Ä‘á»c file chá»‰ biáº¿n file thÃ nh record thÃ´ hoáº·c record chuáº©n hÃ³a
- khÃ´ng tá»± quyáº¿t Ä‘á»‹nh duyá»‡t nghiá»‡p vá»¥
- import DB dÃ i nÃªn cÃ³ script entrypoint trong `scripts/`, logic chÃ­nh Ä‘áº·t á»Ÿ `src/modules/imports`

### `src/modules/transactions`

Chá»©a logic xoay quanh giao dá»‹ch sao kÃª:

- matcher
- parser mÃ£ cÄƒn
- phÃ¢n loáº¡i tráº¡ng thÃ¡i
- summary
- allocation nhiá»u cÄƒn
- UI review cÅ©

Parser mÃ£ cÄƒn lÃ  thuáº­t toÃ¡n lÃµi dÃ¹ng chung cho sao kÃª, matcher vÃ  public lookup. TÃ i liá»‡u Ä‘iá»u phá»‘i rule/case/backlog náº±m táº¡i [parser-ma-can-ho.md](parser-ma-can-ho.md).

Contract ká»³ vá»ng cá»§a parser mÃ£ cÄƒn:

- nháº­n input text thÃ´
- tráº£ mÃ£ cÄƒn/candidate Ä‘Ã£ chuáº©n hÃ³a
- tráº£ lÃ½ do match (`matchReason`) vÃ  Ä‘á»™ tin cáº­y náº¿u cÃ³
- khÃ´ng tá»± query DB
- khÃ´ng tá»± ghi DB master
- khÃ´ng tá»± quyáº¿t Ä‘á»‹nh public dá»¯ liá»‡u

### `src/modules/apartments`

Module dÃ nh cho nghiá»‡p vá»¥ cÄƒn há»™.

Hiá»‡n má»›i cÃ³ README giá»¯ chá»—. Khi lÃ m Task K dashboard, Ä‘Ã¢y lÃ  nÆ¡i há»£p lÃ½ Ä‘á»ƒ Ä‘áº·t:

- query tÃ¬m cÄƒn theo mÃ£
- view model thÃ´ng tin cÄƒn
- repository hoáº·c service liÃªn quan `can_ho`

### `src/modules/residents`

Module chuyá»ƒn tiáº¿p dÃ nh cho cÆ° dÃ¢n/contact.

Hiá»‡n má»›i cÃ³ README giá»¯ chá»—. Task L Ä‘Ã£ dÃ¹ng module má»¥c tiÃªu `src/modules/contacts` cho review contact, nÃªn khÃ´ng thÃªm logic contact má»›i vÃ o `residents`.

Ghi chÃº Ä‘á»‹nh hÆ°á»›ng:

- náº¿u code má»›i chá»§ yáº¿u xá»­ lÃ½ liÃªn há»‡/sá»‘ Ä‘iá»‡n thoáº¡i/ghi chÃº, nÃªn tÃ¡ch sang module má»¥c tiÃªu `src/modules/contacts`
- `residents` chá»‰ nÃªn dÃ¹ng khi sau nÃ y quáº£n lÃ½ há»“ sÆ¡ cÆ° dÃ¢n nhÆ° má»™t thá»±c thá»ƒ rá»™ng hÆ¡n contact

### `src/modules/contacts`

Module má»¥c tiÃªu cho liÃªn há»‡ cÄƒn há»™ vÃ  review contact.

Äang cÃ³ ná»n review contact ná»™i bá»™ tá»« Task L.

Sá»Ÿ há»¯u:

- parser contact tá»« file master
- staging contact candidate
- approve/reject contact
- táº¡o/sá»­a `lien_he_can_ho`
- quy táº¯c dá»¯ liá»‡u nháº¡y cáº£m trong admin
- view model cho manager xem contact/ghi chÃº gá»‘c

KhÃ´ng sá»Ÿ há»¯u:

- public fee lookup
- parser mÃ£ cÄƒn trong sao kÃª
- auth/role

### `src/modules/exceptions`

Module dÃ nh cho ngoáº¡i lá»‡ nghiá»‡p vá»¥:

- chuyá»ƒn khoáº£n nháº§m
- káº¿ toÃ¡n/chá»§ Ä‘áº§u tÆ° chuyá»ƒn há»™
- khÃ´ng rÃµ cÄƒn
- giao dá»‹ch cáº§n xá»­ lÃ½ tay

Hiá»‡n má»›i cÃ³ README giá»¯ chá»—.

### `src/modules/documents`

Module dÃ nh cho tÃ i liá»‡u/chá»©ng tá»«/sao lÆ°u file náº¿u sau nÃ y cáº§n quáº£n lÃ½ metadata file.

Hiá»‡n má»›i cÃ³ README giá»¯ chá»—.

Khi má»Ÿ rá»™ng, module nÃ y cÃ³ thá»ƒ sá»Ÿ há»¯u:

- template thÃ´ng bÃ¡o phÃ­
- file xuáº¥t Excel/PDF
- metadata file import/export
- lá»‹ch sá»­ file Ä‘Ã£ phÃ¡t hÃ nh

### `src/modules/notifications` dá»± kiáº¿n

Module chá»‰ táº¡o khi cÃ³ nhu cáº§u gá»­i thÃ´ng bÃ¡o tháº­t.

CÃ³ thá»ƒ sá»Ÿ há»¯u:

- template ná»™i dung nháº¯c phÃ­
- queue gá»­i SMS/email/Zalo náº¿u sau nÃ y tÃ­ch há»£p
- log gá»­i thÃ´ng bÃ¡o
- rule chá»n contact nháº­n thÃ´ng bÃ¡o

KhÃ´ng táº¡o sá»›m náº¿u chÆ°a cÃ³ chá»©c nÄƒng gá»­i tháº­t, Ä‘á»ƒ trÃ¡nh phÃ¬nh project.

### `src/modules/reports` dá»± kiáº¿n

Module code Ä‘á»ƒ sinh bÃ¡o cÃ¡o/preview.

KhÃ¡c vá»›i `docs/reports/`:

- `src/modules/reports` lÃ  code generator/exporter
- `docs/reports` lÃ  output tÃ i liá»‡u Ä‘Ã£ sinh hoáº·c bÃ¡o cÃ¡o Ä‘Ã£ chá»‘t

NÃªn táº¡o khi cÃ¡c script report hiá»‡n táº¡i báº¯t Ä‘áº§u láº·p logic hoáº·c cáº§n cháº¡y tá»« UI admin.

## `lib/` vÃ  lá»›p tÆ°Æ¡ng thÃ­ch cÅ©

`lib/` hiá»‡n váº«n tá»“n táº¡i vÃ¬ MVP cÅ© vÃ  test Ä‘ang dÃ¹ng:

- `lib/parser/apartment-parser.test.ts`
- `lib/matcher.test.ts`
- `lib/pdf/statement-pdf-reader.test.ts`
- `lib/review/allocations.test.ts`
- cÃ¡c wrapper re-export logic tá»« `src/modules`

Quy táº¯c:

- khÃ´ng thÃªm nghiá»‡p vá»¥ má»›i vÃ o `lib/` náº¿u cÃ³ thá»ƒ Ä‘áº·t trong `src/modules/`
- náº¿u pháº£i thÃªm test á»Ÿ `lib/`, test nÃªn kiá»ƒm behavior cá»§a module tháº­t
- chuyá»ƒn dáº§n import tá»« `lib/` sang `src/modules/` khi á»•n Ä‘á»‹nh

## `scripts/`

`scripts/` lÃ  nÆ¡i Ä‘áº·t lá»‡nh váº­n hÃ nh:

- seed DB
- import Excel
- sync master
- preview contact
- publish batch public
- backup/restore dev DB

Quy táº¯c:

- script chá»‰ lÃ  entrypoint CLI má»ng
- logic xá»­ lÃ½ dÃ i nÃªn tÃ¡ch vá» `src/modules/`
- script pháº£i ghi rÃµ input/output trong log
- script import dá»¯ liá»‡u tháº­t pháº£i giá»¯ raw payload Ä‘á»ƒ audit

## `docs/`

`docs/` lÃ  nguá»“n sá»± tháº­t cá»§a tÃ i liá»‡u dá»± Ã¡n.

NhÃ³m xÆ°Æ¡ng sá»‘ng á»Ÿ gá»‘c `docs/`:

- [README.md](README.md)
- [handoff.md](handoff.md)
- [roadmap.md](roadmap.md)
- [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md)
- [database.md](database.md)
- [module-map.md](module-map.md)
- [parser-ma-can-ho.md](parser-ma-can-ho.md)
- [setup-may-moi-va-database.md](setup-may-moi-va-database.md)

BÃ¡o cÃ¡o dá»¯ liá»‡u tháº­t Ä‘Ã£ gom vÃ o:

- [reports/README.md](reports/README.md)

Quy táº¯c:

- tÃ i liá»‡u Ä‘ang Ä‘iá»u phá»‘i dá»± Ã¡n Ä‘á»ƒ á»Ÿ gá»‘c `docs/`
- bÃ¡o cÃ¡o lá»‹ch sá»­/Ä‘á»‘i soÃ¡t Ä‘á»ƒ trong `docs/reports/`
- preview sinh tá»« script Ä‘á»ƒ trong thÆ° má»¥c `preview-*`
- khÃ´ng dÃ¹ng lá»‹ch sá»­ chat lÃ m nguá»“n sá»± tháº­t chÃ­nh

## Luáº­t phá»¥ thuá»™c

Chiá»u phá»¥ thuá»™c mong muá»‘n:

```text
app/
  -> src/modules/*
  -> components/ náº¿u lÃ  UI chung

scripts/
  -> src/modules/*
  -> prisma/database

src/modules/<domain>
  -> src/modules/database
  -> src/modules/shared

src/modules/shared
  -> khÃ´ng import domain module

lib/
  -> src/modules/* hoáº·c giá»¯ code cÅ© táº¡m thá»i
```

KhÃ´ng nÃªn:

- import tá»« `app/` vÃ o `src/modules/`
- Ä‘á»ƒ `shared` import `billing`, `auth`, `transactions`
- Ä‘á»ƒ parser gá»i DB trá»±c tiáº¿p
- Ä‘á»ƒ route public Ä‘á»c raw import/contact ná»™i bá»™
- Ä‘á»ƒ script chá»©a toÃ n bá»™ nghiá»‡p vá»¥ dÃ i mÃ  khÃ´ng tÃ¡ch module

## Quy táº¯c Ä‘áº·t file má»›i

| Loáº¡i viá»‡c | NÆ¡i Ä‘áº·t |
| --- | --- |
| Route/page Next.js | `app/...` |
| Auth/session/role | `src/modules/auth` |
| Query DB dÃ¹ng chung | `src/modules/database` hoáº·c module domain |
| Dashboard cÄƒn há»™ | `src/modules/apartments` + `app/admin` |
| Contact review | `src/modules/contacts` náº¿u táº¡o má»›i, táº¡m thá»i cÃ³ thá»ƒ dÃ¹ng `src/modules/residents` |
| Public fee lookup | `src/modules/billing` + `app/tra-cuu-phi` |
| Parser mÃ£ cÄƒn | `src/modules/transactions/parser` |
| Rule parser/documentation | `docs/parser-ma-can-ho.md` |
| Import Excel/PDF | `src/modules/imports` |
| CLI import/seed/publish | `scripts/*.cjs` |
| BÃ¡o cÃ¡o dá»¯ liá»‡u tháº­t | `docs/reports/` |
| Code sinh bÃ¡o cÃ¡o | `src/modules/reports` khi cáº§n dÃ¹ng láº¡i ngoÃ i script |
| Template thÃ´ng bÃ¡o/chá»©ng tá»« | `src/modules/documents` |
| Gá»­i thÃ´ng bÃ¡o | `src/modules/notifications` khi cÃ³ tÃ­ch há»£p tháº­t |
| Test parser/matcher | test hiá»‡n cÃ³ trong `lib/**.test.ts`, vá» sau cÃ³ thá»ƒ chuyá»ƒn gáº§n module |

## Cá»•ng kiá»ƒm tra khi Ä‘á»•i cáº¥u trÃºc

Má»—i láº§n di chuyá»ƒn module hoáº·c Ä‘á»•i import:

```bash
npm test
npm run build
```

Náº¿u Ä‘á»•i Prisma/schema:

```bash
npm run prisma:validate
npm run prisma:generate
```

Náº¿u Ä‘á»•i parser mÃ£ cÄƒn:

- cáº­p nháº­t [parser-ma-can-ho.md](parser-ma-can-ho.md)
- thÃªm golden test
- cháº¡y `npm test`

## Káº¿t luáº­n

Tá»« thá»i Ä‘iá»ƒm nÃ y:

- `src/modules/` lÃ  cáº¥u trÃºc chuáº©n cho nghiá»‡p vá»¥ má»›i
- `app/` chá»‰ lÃ  lá»›p route/UI cá»§a Next.js
- `lib/` lÃ  lá»›p tÆ°Æ¡ng thÃ­ch cÅ©, khÃ´ng pháº£i nÆ¡i má»Ÿ rá»™ng chÃ­nh
- `scripts/` lÃ  entrypoint váº­n hÃ nh, khÃ´ng pháº£i nÆ¡i chá»©a toÃ n bá»™ nghiá»‡p vá»¥ dÃ i háº¡n
- `docs/module-map.md` lÃ  file control cáº¥u trÃºc thÆ° má»¥c


# Quy tắc archive file cũ

- File cũ hoặc không còn sử dụng không được xóa ngay.
- Trước khi archive phải xác nhận không còn import, route, script trong `package.json`, test hoặc tài liệu vận hành phụ thuộc.
- Code cũ được chuyển vào `../archive/code/`, đổi sang đuôi `.archive` để Next.js, TypeScript và test runner không biên dịch.
- Mỗi nhóm archive phải có README ghi ngày chuyển, lý do và file thay thế.
- Không được import hoặc chạy runtime từ `archive/`.
- Chỉ xóa vĩnh viễn sau khi chủ dự án duyệt rõ ràng.

## Nợ cấu trúc đang theo dõi

Báo cáo hiện hành:

- [reports/bao-cao-ra-soat-trung-lap-code-va-phan-khu.md](reports/bao-cao-ra-soat-trung-lap-code-va-phan-khu.md)

Các điểm cần giữ khi tiếp tục phát triển:

- Parser mã căn chỉ có một nguồn chuẩn tại
  `src/modules/transactions/parser/apartment-parser.ts`.
- Wrapper trong `lib/` chỉ dùng cho tương thích, không thêm nghiệp vụ mới.
- Quy tắc "tháng đã đóng đến" đã gom về
  `src/modules/billing/paid-through.ts`; không tạo thêm bản sao thuật toán.
- Reader/import sao kê dùng chung đã chuyển về
  `src/modules/transactions/import/bank-statement-common.ts`.
- `app/admin/import/actions.ts` chỉ nên điều phối form và quyền; nghiệp vụ import,
  public và sổ chốt phải thuộc module billing/imports.
- Cụm `ReviewDashboard` memory-flow cũ đã chuyển vào
  `../archive/code/legacy-review-dashboard/` ngày 10/06/2026.

## Module mới sau đợt chuẩn hóa 10/06/2026

- `src/modules/auth/permissions.ts`: nguồn phân quyền duy nhất.
- `src/modules/billing/paid-through.ts`: parse mốc phí, quy đổi tháng và số dư
  chuyển kỳ.
- `src/modules/imports/script-runner.ts`: chạy CLI bất đồng bộ từ web.
- `src/modules/imports/monthly-closing.ts`: tạo sổ chốt từ batch public.
- `src/modules/transactions/review/monthly-reconciliation.ts`: tổng hợp giao
  dịch đã duyệt theo tháng.
