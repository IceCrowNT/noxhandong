# HÆ°á»›ng dáº«n setup mÃ¡y má»›i vÃ  database

## Má»¥c tiÃªu

TÃ i liá»‡u nÃ y dÃ¹ng Ä‘á»ƒ dá»±ng mÃ´i trÆ°á»ng cháº¡y pháº§n má»m trÃªn mÃ¡y má»›i mÃ  khÃ´ng cáº§n cÃ i thá»§ cÃ´ng quÃ¡ nhiá»u bÆ°á»›c nhá»› tay.

Pháº§n má»m hiá»‡n táº¡i cáº§n tá»‘i thiá»ƒu:

- Node.js + npm
- PostgreSQL
- Prisma Client

Pháº§n má»m khuyáº¿n nghá»‹ Ä‘á»ƒ quáº£n lÃ½ database báº±ng giao diá»‡n:

- DBeaver Community

## CÃ³ nÃªn Ä‘á»“ng bá»™ luÃ´n database qua Git khÃ´ng?

CÃ³ thá»ƒ, náº¿u:

- táº¥t cáº£ mÃ¡y Ä‘á»u lÃ  mÃ¡y cÃ¡ nhÃ¢n cá»§a anh
- repo Ä‘ang Ä‘á»ƒ private
- dá»¯ liá»‡u hiá»‡n táº¡i chá»‰ lÃ  dá»¯ liá»‡u dev / thá»­ nghiá»‡m

NhÆ°ng khÃ´ng nÃªn commit cáº£ thÆ° má»¥c `postgres-data`.

### CÃ¡ch nÃªn dÃ¹ng

DÃ¹ng **logical snapshot** cá»§a database vÃ  commit snapshot Ä‘Ã³ vÃ o repo.

Project Ä‘Ã£ cÃ³ sáºµn cÆ¡ cháº¿ nÃ y:

- thÆ° má»¥c snapshot: `db-sync/`
- script backup:
  - `scripts/setup/backup-db-to-repo.sh`
- script restore:
  - `scripts/setup/restore-db-from-repo.sh`

### VÃ¬ sao cÃ¡ch nÃ y tá»‘t hÆ¡n commit `postgres-data`

- nháº¹ hÆ¡n nhiá»u
- dá»… pull / restore trÃªn mÃ¡y khÃ¡c
- Ã­t rá»§i ro há»ng repo
- khÃ´ng phá»¥ thuá»™c Ä‘Æ°á»ng dáº«n ná»™i bá»™ cá»§a PostgreSQL
- Ã­t gÃ¢y lá»—i push hÆ¡n so vá»›i commit data directory

### Khi nÃ o nÃªn dÃ¹ng snapshot DB

- muá»‘n Ä‘á»“ng bá»™ mÃ´i trÆ°á»ng dev giá»¯a cÃ¡c mÃ¡y cÃ¡ nhÃ¢n
- muá»‘n giá»¯ nguyÃªn dataset thá»­ nghiá»‡m Ä‘Ã£ import
- muá»‘n mÃ¡y khÃ¡c má»Ÿ lÃªn lÃ  cÃ³ Ä‘Ãºng dá»¯ liá»‡u Ä‘ang test

### Khi nÃ o khÃ´ng nÃªn dÃ¹ng snapshot DB

- dá»¯ liá»‡u production
- dá»¯ liá»‡u nháº¡y cáº£m
- database quÃ¡ lá»›n

Trong cÃ¡c trÆ°á»ng há»£p Ä‘Ã³ nÃªn:

- chá»‰ commit schema + migrations
- rá»“i import láº¡i tá»« file nguá»“n

## CÃ³ cáº§n cÃ i Ä‘áº§y Ä‘á»§ trÃªn mÃ¡y má»›i khÃ´ng?

CÃ³.

Náº¿u mÃ¡y má»›i muá»‘n:

- cháº¡y backend
- cháº¡y migration
- import dá»¯ liá»‡u Excel/PDF
- lÆ°u dá»¯ liá»‡u vÃ o database tháº­t

thÃ¬ báº¯t buá»™c pháº£i cÃ³:

1. Node.js
2. PostgreSQL
3. biáº¿n mÃ´i trÆ°á»ng `.env`

KhÃ´ng cáº§n cÃ i thÃªm má»™t tool riÃªng Ä‘á»ƒ import Excel. App sáº½ tá»± lÃ m pháº§n Ä‘Ã³ khi backend hoÃ n thiá»‡n.

NÃªn cÃ i thÃªm DBeaver náº¿u muá»‘n:

- xem báº£ng giá»‘ng SQL Server Management Studio
- cháº¡y SQL kiá»ƒm tra dá»¯ liá»‡u
- kiá»ƒm tra schema, index, relation
- export/import dá»¯ liá»‡u thá»§ cÃ´ng khi cáº§n debug

## Táº¡i sao khÃ´ng Ä‘Æ°a bá»™ cÃ i binary vÃ o repo?

KhÃ´ng nÃªn commit cÃ¡c file dáº¡ng:

- `.dmg`
- `.zip`
- binary náº·ng

vÃ o GitHub vÃ¬:

- repo sáº½ phÃ¬nh to ráº¥t nhanh
- dá»… gÃ¢y lá»—i push
- khÃ³ quáº£n lÃ½ version

Thay vÃ o Ä‘Ã³, project chá»‰ giá»¯:

- script táº£i installer tá»« nguá»“n chÃ­nh thá»©c
- script khá»Ÿi Ä‘á»™ng database local
- tÃ i liá»‡u setup

## DBeaver Community

DBeaver lÃ  cÃ´ng cá»¥ GUI khuyáº¿n nghá»‹ Ä‘á»ƒ kiá»ƒm tra PostgreSQL cá»§a project.

### CÃ i trÃªn Windows

Khuyáº¿n nghá»‹ cÃ i báº±ng `winget`:

```powershell
winget install --id DBeaver.DBeaver.Community --source winget --accept-package-agreements --accept-source-agreements
```

TrÃªn mÃ¡y hiá»‡n táº¡i Ä‘Ã£ cÃ i:

- package id: `DBeaver.DBeaver.Community`
- version: `26.0.5` báº£n full qua `winget`
- cÃ²n tháº¥y báº£n `26.0.4 (current user)` tá»« láº§n cÃ i trÆ°á»›c

CÃ³ thá»ƒ kiá»ƒm tra báº±ng:

```powershell
winget list --id DBeaver.DBeaver.Community
```

### Káº¿t ná»‘i database project trong DBeaver

Táº¡o connection má»›i:

- Database type: `PostgreSQL`
- Host: `localhost`
- Port: `5432`
- Database: `apartment_fee_reviewer`
- Username: `postgres`
- Password: `postgres`
- Schema: `public`

CÃ¡c báº£ng nÃªn má»Ÿ kiá»ƒm tra trÆ°á»›c:

- `can_ho`
- `ung_vien_lien_he_can_ho`
- `tai_khoan_quan_tri`
- `quy_tac_phi`
- `lo_nhap_du_lieu`
- `dong_du_lieu_quan_ly_tho`

SQL kiá»ƒm tra nhanh:

```sql
select count(*) from can_ho;
select loai_can, count(*) from can_ho group by loai_can order by loai_can;
select count(*) from ung_vien_lien_he_can_ho;
select ten_dang_nhap, vai_tro, trang_thai from tai_khoan_quan_tri;
select loai_can, ma_phi, so_tien from quy_tac_phi;
```

Ká»³ vá»ng DB dev V2 hiá»‡n táº¡i:

- `can_ho = 934`
- `CHUNG_CU = 884`
- `LIEN_KE = 50`
- `ung_vien_lien_he_can_ho = 1977`
- cÃ³ user `admin` role `SUPER_ADMIN`

### Náº¿u DBeaver bÃ¡o `Connection refused`

Lá»—i nÃ y thÆ°á»ng cÃ³ nghÄ©a lÃ  PostgreSQL local chÆ°a cháº¡y trÃªn `localhost:5432`.

TrÃªn Windows, cháº¡y trong thÆ° má»¥c project:

```powershell
npm run db:start:windows
```

Sau Ä‘Ã³ báº¥m `Retry` trong DBeaver hoáº·c reconnect láº¡i connection.

Kiá»ƒm tra nhanh port:

```powershell
Get-NetTCPConnection -LocalPort 5432 -State Listen
```

Náº¿u muá»‘n dá»«ng DB local:

```powershell
npm run db:stop:windows
```

## Cáº¥u trÃºc script setup

CÃ¡c script náº±m á»Ÿ:

- `scripts/setup/start-postgres-local.ps1`
- `scripts/setup/stop-postgres-local.ps1`
- `scripts/setup/install-postgres-app-local.sh`
- `scripts/setup/start-postgres-local.sh`
- `scripts/setup/stop-postgres-local.sh`
- `scripts/setup/create-dev-db.sh`
- `scripts/setup/backup-db-to-repo.sh`
- `scripts/setup/restore-db-from-repo.sh`

CÃ¡c script nÃ y:

- khÃ´ng táº¡o file náº·ng trong repo
- cÃ i `Postgres.app` vÃ o `~/Applications`
- táº¡o data directory á»Ÿ `~/.local/share/apartment-fee-reviewer`
- khÃ´ng áº£nh hÆ°á»Ÿng commit Git

## Quy trÃ¬nh setup trÃªn mÃ¡y má»›i

### Windows hiá»‡n táº¡i

TrÃªn mÃ¡y Windows hiá»‡n táº¡i, project Ä‘Ã£ chuyá»ƒn sang dÃ¹ng báº£n cÃ i full:

- Node.js LTS full: `OpenJS.NodeJS.LTS`, version `24.16.0`
- PostgreSQL full: `PostgreSQL.PostgreSQL.17`, version `17.10-1`
- PostgreSQL service: `postgresql-x64-17`
- service Ä‘ang Ä‘á»ƒ `Automatic`, tá»± cháº¡y cÃ¹ng Windows
- database dev: `apartment_fee_reviewer`
- user/password local: `postgres` / `postgres`

CÃ¡c báº£n portable cÃ²n tá»“n táº¡i Ä‘á»ƒ lÃ m fallback/backup, khÃ´ng cÃ²n lÃ  mÃ´i trÆ°á»ng chÃ­nh:

- Node portable trong `.tools/`
- PostgreSQL portable trong `.tools/`
- PostgreSQL portable runtime ngoÃ i repo á»Ÿ `C:\Users\IceCrow\apartment_fee_reviewer_runtime`

KhÃ´ng xÃ³a cÃ¡c thÆ° má»¥c portable náº¿u chÆ°a cÃ³ backup rÃµ rÃ ng, vÃ¬ cÃ³ thá»ƒ cáº§n dÃ¹ng láº¡i Ä‘á»ƒ Ä‘á»‘i chiáº¿u dá»¯ liá»‡u cÅ©.

Khá»Ÿi Ä‘á»™ng PostgreSQL trÃªn Windows:

```powershell
npm run db:start:windows
```

Dá»«ng PostgreSQL trÃªn Windows:

```powershell
npm run db:stop:windows
```

Script PowerShell sáº½ Æ°u tiÃªn service `postgresql-x64-17`; náº¿u mÃ¡y khÃ´ng cÃ³ service nÃ y má»›i fallback vá» PostgreSQL portable.

Kiá»ƒm tra cÃ´ng cá»¥ full:

```powershell
node -v
npm -v
psql --version
Get-Service postgresql-x64-17
```

Náº¿u terminal cÅ© chÆ°a nháº­n `node`, `npm` hoáº·c `psql`, Ä‘Ã³ng terminal/VS Code rá»“i má»Ÿ láº¡i Ä‘á»ƒ nháº­n PATH má»›i.

### Mac/Linux hoáº·c mÃ¡y khÃ¡c

Pháº§n dÆ°á»›i Ä‘Ã¢y lÃ  quy trÃ¬nh ná»n. TrÃªn Mac cÃ³ thá»ƒ dÃ¹ng cÃ¡c script `Postgres.app` bÃªn dÆ°á»›i.

### BÆ°á»›c 1. CÃ i Node.js

Khuyáº¿n nghá»‹ dÃ¹ng `nvm`.

Sau khi cÃ i xong, kiá»ƒm tra:

```bash
node -v
npm -v
```

### BÆ°á»›c 2. CÃ i Postgres.app báº±ng script

Trong thÆ° má»¥c project:

```bash
bash scripts/setup/install-postgres-app-local.sh
```

Máº·c Ä‘á»‹nh script sáº½ cÃ i:

- `Postgres.app` version `v2.9.4`
- PostgreSQL major `17`

### BÆ°á»›c 3. Khá»Ÿi Ä‘á»™ng PostgreSQL local

```bash
bash scripts/setup/start-postgres-local.sh
```

### BÆ°á»›c 4. Táº¡o database dev

```bash
bash scripts/setup/create-dev-db.sh
```

Database máº·c Ä‘á»‹nh:

- `apartment_fee_reviewer`

### BÆ°á»›c 5. Táº¡o file `.env`

Náº¿u chÆ°a cÃ³:

```bash
cp .env.example .env
```

GiÃ¡ trá»‹ hiá»‡n táº¡i:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/apartment_fee_reviewer?schema=public"
```

### BÆ°á»›c 6. Generate Prisma client

```bash
npm run prisma:generate
```

### BÆ°á»›c 7. Cháº¡y migration

```bash
npx prisma migrate dev --name init
```

## Äá»“ng bá»™ database giá»¯a cÃ¡c mÃ¡y qua Git

### Backup DB hiá»‡n táº¡i vÃ o repo

```bash
npm run db:backup:repo
```

Sau Ä‘Ã³ commit:

```bash
git add db-sync
git commit -m "Cap nhat snapshot database dev"
git push
```

### Restore DB tá»« repo trÃªn mÃ¡y khÃ¡c

Sau khi pull code má»›i nháº¥t:

```bash
npm run db:restore:repo
```

### File snapshot hiá»‡n táº¡i

ThÆ° má»¥c:

- `db-sync/`

File chÃ­nh:

- `apartment_fee_reviewer.latest.sql`
- `apartment_fee_reviewer.latest.meta.json`

### LÆ°u Ã½

- chá»‰ nÃªn giá»¯ **1 snapshot má»›i nháº¥t**
- khÃ´ng commit `.env`
- khÃ´ng commit `postgres-data`
- náº¿u snapshot quÃ¡ lá»›n, quay láº¡i phÆ°Æ¡ng Ã¡n:
  - migrations + import láº¡i tá»« file máº«u

## CÃ¡c lá»‡nh kiá»ƒm tra nhanh

### Kiá»ƒm tra postgres Ä‘ang cháº¡y chÆ°a trÃªn Windows

```powershell
Get-NetTCPConnection -LocalPort 5432 -State Listen
```

### Kiá»ƒm tra database Ä‘Ã£ cÃ³ chÆ°a trÃªn Windows

```powershell
psql -h localhost -p 5432 -U postgres -d apartment_fee_reviewer -c "\dt"
```

### Kiá»ƒm tra postgres Ä‘ang cháº¡y chÆ°a trÃªn Mac/Linux

```bash
lsof -nP -iTCP:5432 -sTCP:LISTEN
```

### Kiá»ƒm tra database Ä‘Ã£ cÃ³ chÆ°a

```bash
$HOME/Applications/Postgres.app/Contents/Versions/17/bin/psql -h localhost -p 5432 -U postgres -lqt
```

### Kiá»ƒm tra báº£ng sau migration

```bash
$HOME/Applications/Postgres.app/Contents/Versions/17/bin/psql -h localhost -p 5432 -U postgres -d apartment_fee_reviewer -c "\\dt"
```

## Dá»«ng database local

Windows:

```powershell
npm run db:stop:windows
```

Mac/Linux:

```bash
bash scripts/setup/stop-postgres-local.sh
```

## Tráº¡ng thÃ¡i hiá»‡n táº¡i cá»§a project

Äáº¿n thá»i Ä‘iá»ƒm tÃ i liá»‡u nÃ y Ä‘Æ°á»£c táº¡o:

- schema hiện hành Prisma Ä‘Ã£ validate
- Prisma Client Ä‘Ã£ generate theo `prisma/schema.prisma`
- DB dev Ä‘Ã£ migrate/reset sang V2
- migration V2 hiá»‡n táº¡i: `20260515000100_v2_public_web`
- PostgreSQL local trÃªn mÃ¡y Windows hiá»‡n táº¡i Ä‘Ã£ chuyá»ƒn sang báº£n full, cháº¡y báº±ng Windows service `postgresql-x64-17`
- Node.js trÃªn mÃ¡y Windows hiá»‡n táº¡i Ä‘Ã£ chuyá»ƒn sang báº£n full `OpenJS.NodeJS.LTS`
- PostgreSQL portable á»Ÿ `C:\Users\IceCrow\apartment_fee_reviewer_runtime` chá»‰ cÃ²n lÃ  fallback/backup
- DBeaver Community Ä‘Ã£ Ä‘Æ°á»£c cÃ i Ä‘á»ƒ kiá»ƒm tra database báº±ng giao diá»‡n

## Káº¿t luáº­n

MÃ¡y má»›i cáº§n setup database tháº­t náº¿u muá»‘n cháº¡y backend Ä‘Ãºng nghÄ©a.

NhÆ°ng khÃ´ng cáº§n táº¡o tool import riÃªng hoáº·c nháº­p tay dá»¯ liá»‡u master, vÃ¬ hÆ°á»›ng triá»ƒn khai cá»§a project lÃ :

- nháº­p Excel vÃ o báº£ng raw
- transform sang báº£ng business
- review trÃªn app

ToÃ n bá»™ bÆ°á»›c nÃ y sáº½ náº±m trong chÃ­nh pháº§n má»m.

Náº¿u muá»‘n nhiá»u mÃ¡y cÃ¡ nhÃ¢n cÃ¹ng phÃ¡t triá»ƒn trÃªn cÃ¹ng dataset dev, phÆ°Æ¡ng Ã¡n hiá»‡n táº¡i Ä‘Æ°á»£c khuyáº¿n nghá»‹ lÃ :

- commit `schema + migrations + scripts`
- vÃ  khi tháº­t sá»± cáº§n thÃ¬ commit thÃªm `db-sync/apartment_fee_reviewer.latest.sql`

KhÃ´ng dÃ¹ng Git Ä‘á»ƒ sync trá»±c tiáº¿p thÆ° má»¥c data cá»§a PostgreSQL.

