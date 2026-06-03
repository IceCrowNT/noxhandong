# Apartment Fee Reviewer

Web app quáº£n lÃ½/Ä‘á»‘i soÃ¡t thu phÃ­ cÄƒn há»™. Project Ä‘ang phÃ¡t triá»ƒn theo hÆ°á»›ng PostgreSQL, import Excel, quáº£n trá»‹ ná»™i bá»™ vÃ  trang public Ä‘á»ƒ cÆ° dÃ¢n tra cá»©u tiáº¿n trÃ¬nh Ä‘Ã³ng phÃ­.

README nÃ y lÃ  **menu Ä‘áº§u vÃ o cá»§a toÃ n project**. Chi tiáº¿t ká»¹ thuáº­t vÃ  nghiá»‡p vá»¥ náº±m trong `docs/`.

## Äá»c Ä‘áº§u tiÃªn

1. [docs/README.md](docs/README.md) - má»¥c lá»¥c tÃ i liá»‡u xÆ°Æ¡ng sá»‘ng
2. [docs/handoff.md](docs/handoff.md) - tráº¡ng thÃ¡i bÃ n giao hiá»‡n táº¡i
3. [docs/nghiep-vu-he-thong.md](docs/nghiep-vu-he-thong.md) - mÃ´ táº£ nghiá»‡p vá»¥ há»‡ thá»‘ng
4. [docs/roadmap.md](docs/roadmap.md) - hÆ°á»›ng Ä‘i vÃ  task cáº¥p cao
5. [docs/phase-2-roadmap.md](docs/phase-2-roadmap.md) - roadmap sau MVP
6. [docs/checklist-trien-khai-va-nghiem-thu.md](docs/checklist-trien-khai-va-nghiem-thu.md) - checklist review/check/test/confirm
7. [docs/checklist-duyet-truoc-deploy.md](docs/checklist-duyet-truoc-deploy.md) - cá»•ng dá»«ng thá»§ cÃ´ng trÆ°á»›c deploy
8. [docs/database.md](docs/database.md) - thiáº¿t káº¿ database má»¥c tiÃªu
9. [docs/module-map.md](docs/module-map.md) - cáº¥u trÃºc thÆ° má»¥c vÃ  ranh giá»›i module
10. [docs/parser-ma-can-ho.md](docs/parser-ma-can-ho.md) - rule, dá»¯ liá»‡u tháº­t vÃ  backlog parser mÃ£ cÄƒn
11. [docs/design-system.md](docs/design-system.md) - global design/pattern cho UI
12. [docs/thiet-ke-duyet-sao-ke-phase-2.md](docs/thiet-ke-duyet-sao-ke-phase-2.md) - thiáº¿t káº¿ mÃ n duyá»‡t sao kÃª Phase 2
13. [docs/production-deploy-vps.md](docs/production-deploy-vps.md) - quyáº¿t Ä‘á»‹nh production VPS
14. [docs/deploy-vps-step-by-step.md](docs/deploy-vps-step-by-step.md) - runbook xÆ°Æ¡ng sá»‘ng deploy/váº­n hÃ nh VPS
15. [docs/vps-phase-2-todolist.md](docs/vps-phase-2-todolist.md) - todo VPS Phase 2, gá»“m backup/timezone/deploy

File control tiáº¿n trÃ¬nh cáº¥p cao: [docs/roadmap.md](docs/roadmap.md).

File control nghiá»‡m thu chi tiáº¿t: [docs/checklist-trien-khai-va-nghiem-thu.md](docs/checklist-trien-khai-va-nghiem-thu.md).

## Má»¥c tiÃªu hiá»‡n táº¡i

- Public page cho cÆ° dÃ¢n tra cá»©u tiáº¿n trÃ¬nh Ä‘Ã³ng phÃ­, khÃ´ng cáº§n login.
- Admin/Manager Ä‘Äƒng nháº­p Ä‘á»ƒ xem dá»¯ liá»‡u ná»™i bá»™ theo quyá»n.
- Super Admin import/chá»‘t dá»¯ liá»‡u thu phÃ­ trÆ°á»›c khi public.
- PostgreSQL lÃ  database chÃ­nh.
- Dá»¯ liá»‡u T5/2026 lÃ  má»‘c quÃ¡ khá»© chuáº©n; tá»« T6/2026 hÆ°á»›ng váº­n hÃ nh lÃ  import sao kÃª ngÃ¢n hÃ ng, duyá»‡t giao dá»‹ch vÃ  chá»‘t public theo ká»³.

## Tráº¡ng thÃ¡i ngáº¯n

- DB dev Ä‘Ã£ migrate/reset sang V2.
- ÄÃ£ import `934` cÄƒn tá»« `Danh_Sach_Can_Ho_Master.xlsx`.
- ÄÃ£ sinh `1977` contact candidate, chÆ°a nháº­p tháº³ng vÃ o contact master.
- ÄÃ£ cÃ³ auth/admin ná»n, dashboard quáº£n lÃ½, review contact, import sao kÃª DB vÃ  public route `/tra-cuu-phi`.
- Trang chá»§ `/` hiá»‡n lÃ  trang cÆ° dÃ¢n mobile-first, cÃ³ form tra cá»©u vÃ  lá»‘i vÃ o `/admin/login`.
- MVP Ä‘Ã£ deploy production táº¡i `https://noxhandong.vn`.
- Task tiáº¿p theo theo roadmap: Phase 2, chá»‘t opening balance T5/2026 vÃ  xÃ¢y luá»“ng sao kÃª tá»« T6/2026.

Xem chi tiáº¿t trong [docs/handoff.md](docs/handoff.md).

## TÃ i liá»‡u chÃ­nh

| File | Vai trÃ² |
| --- | --- |
| [docs/README.md](docs/README.md) | Má»¥c lá»¥c tÃ i liá»‡u |
| [docs/handoff.md](docs/handoff.md) | Tráº¡ng thÃ¡i bÃ n giao |
| [docs/nghiep-vu-he-thong.md](docs/nghiep-vu-he-thong.md) | MÃ´ táº£ nghiá»‡p vá»¥ tá»•ng quan Ä‘á»ƒ bÃ n giao ngÆ°á»i má»›i |
| [docs/roadmap.md](docs/roadmap.md) | Äiá»u phá»‘i hÆ°á»›ng Ä‘i vÃ  task cáº¥p cao |
| [docs/phase-2-roadmap.md](docs/phase-2-roadmap.md) | Roadmap sau MVP: opening balance T5/2026, import sao kÃª tá»« T6/2026, duyá»‡t giao dá»‹ch, lÆ°u báº±ng chá»©ng, thá»‘ng kÃª, admin user |
| [docs/checklist-trien-khai-va-nghiem-thu.md](docs/checklist-trien-khai-va-nghiem-thu.md) | Äiá»u kiá»‡n nghiá»‡m thu tá»«ng task |
| [docs/checklist-duyet-truoc-deploy.md](docs/checklist-duyet-truoc-deploy.md) | Cá»•ng duyá»‡t thá»§ cÃ´ng trÆ°á»›c deploy |
| [docs/database.md](docs/database.md) | Database má»¥c tiÃªu |
| [docs/module-map.md](docs/module-map.md) | Cáº¥u trÃºc project, module hiá»‡n táº¡i vÃ  module má»¥c tiÃªu |
| [docs/parser-ma-can-ho.md](docs/parser-ma-can-ho.md) | Parser mÃ£ cÄƒn, test case, báº£o trÃ¬ thuáº­t toÃ¡n |
| [docs/design-system.md](docs/design-system.md) | Design system mobile-first cho public/admin UI |
| [docs/thiet-ke-duyet-sao-ke-phase-2.md](docs/thiet-ke-duyet-sao-ke-phase-2.md) | Spec mÃ n duyá»‡t sao kÃª Phase 2: khÃ´ng kÃ©o ngang, má»™t mÃ n desktop 24 inch, Ä‘Ã¡nh giÃ¡ cháº¥t lÆ°á»£ng thÃ´ng tin |
| [docs/stitch-mobile-ui-prompt.md](docs/stitch-mobile-ui-prompt.md) | Prompt thiáº¿t káº¿ mobile-first trÃªn Stitch |
| [docs/production-deploy-vps.md](docs/production-deploy-vps.md) | Deploy production trÃªn VPS, PostgreSQL, domain, backup, Super Admin |
| [docs/deploy-vps-step-by-step.md](docs/deploy-vps-step-by-step.md) | Deploy/váº­n hÃ nh VPS: DNS, PostgreSQL, NSSM service, Caddy HTTPS, backup |
| [docs/vps-phase-2-todolist.md](docs/vps-phase-2-todolist.md) | Todo riÃªng cho VPS Phase 2: backup, timezone, migration, nghiá»‡m thu production |
| [docs/setup-may-moi-va-database.md](docs/setup-may-moi-va-database.md) | Setup mÃ¡y má»›i vÃ  database |

## Cáº¥u trÃºc project

KhÃ´ng mÃ´ táº£ chi tiáº¿t á»Ÿ README Ä‘á»ƒ trÃ¡nh láº·p.

Xem báº£n Ä‘á»“ module táº¡i [docs/module-map.md](docs/module-map.md).

## Cháº¡y local

```bash
npm install
npm run db:start:windows
npm run dev
```

Má»Ÿ `http://localhost:3000`.

TrÃªn Windows hiá»‡n táº¡i, Node.js vÃ  PostgreSQL Ä‘Ã£ Ä‘Æ°á»£c cÃ i báº£n full. PostgreSQL cháº¡y báº±ng service `postgresql-x64-17`; náº¿u terminal chÆ°a nháº­n `node`/`npm`/`psql`, Ä‘Ã³ng VS Code hoáº·c terminal rá»“i má»Ÿ láº¡i.

Chá»‰ dÃ¹ng Node portable trong repo khi cáº§n fallback:

```powershell
$env:PATH = "$PWD\.tools\node-v22.13.1-win-x64;$env:PATH"
npm run dev
```

## Lá»‡nh thÆ°á»ng dÃ¹ng

```bash
npm test
npm run build
npm run prisma:validate
npm run prisma:generate
```

## Ghi chÃº

MVP cÅ© xá»­ lÃ½ file trong bá»™ nhá»› váº«n cÃ²n má»™t sá»‘ route/API Ä‘á»ƒ tÆ°Æ¡ng thÃ­ch. HÆ°á»›ng phÃ¡t triá»ƒn chÃ­nh hiá»‡n táº¡i lÃ  DB V2 theo tÃ i liá»‡u trong `docs/`.

