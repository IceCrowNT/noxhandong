# Todo nang cap quy tac phi theo 2 phase

Muc tieu: chuan bi he thong cho viec tang/doi phi trong tuong lai, nhung khong lam xao tron quy trinh van hanh hien tai. Phase 1 nang loi tinh toan va giu UI quan ly phi o trang thai an. Phase 2 chi mo quan tri rule phi khi BQT co quyet dinh chinh thuc.

Nguyen tac bat buoc: moi lan sua logic lien quan don vi phi phai kiem tra lai tat ca tinh nang trong muc "Ma tran tinh nang can test". Khong duoc chi test rieng file vua sua, vi don vi phi dang anh huong truc tiep den public data, tra cuu cu dan, thong bao thu phi va bao cao.

Uu tien cao nhat: du lieu phi cua tung can ho phai dung tuyet doi trong pham vi du lieu dau vao da duyet. Tat ca thay doi UI, export, template, report deu la thu yeu so voi cac truong cot loi:

- `paidThrough` / `thang_da_dong_den_hien_tai`
- `numericMonth`
- `remainderAmount`
- `isPartialPayment`
- `payload_public_json`
- lich su `lich_su_dong_phi_can_ho`
- public snapshot `trang_thai_phi_can_ho_public`

Neu co bat ky test nao cho thay cac truong tren lech so voi logic cu khi chua co rule moi, hoac lech so voi fixture khi co rule moi, thi khong duoc tiep tuc lam UI/export cho den khi sua xong loi du lieu.

## 0. Hien trang source code dang dung don vi phi

Nguon DB hien co:

- [ ] `prisma/schema.prisma` - model `QuyTacPhi`, map bang `quy_tac_phi`.
  - Hien chi co index `[loai_can, ma_phi, hieu_luc_tu_ngay]`, chua co DB-level constraint/trigger chan overlap.
- [ ] `scripts/seed-v2.cjs` - seed 2 rule `QLVH` hien tai cho `CHUNG_CU` va `LIEN_KE`.
  - `ensureFeeRule` dang idempotent theo rule da ton tai, nhung chua tu dong dong rule cu khi them rule phi moi trong tuong lai.

Tinh nang dung don vi phi truc tiep:

- [ ] `src/modules/billing/paid-through.ts`
  - `FEE_BASE_YEAR = 2026` la moc anchor de quy doi `numericMonth` sang thang/nam thuc.
  - Y nghia: `numericMonth` khong phai thang trong nam hien tai, ma la so thu tu thang tuong doi bat dau tu nam goc 2026.
  - Vi du: `numericMonth = 1` la T1/2026, `numericMonth = 12` la T12/2026, `numericMonth = 13` la T1/2027, `numericMonth = 14` la T2/2027, `numericMonth = -1` la T11/2025.
  - Khong duoc doi `FEE_BASE_YEAR` khi sang nam 2027/2028; neu doi se lam lech toan bo paid-through da luu.
  - Dang duoc dung trong `resolveRelativeMonth`, `buildPaidThroughInfo`, `parsePaidThroughValue`; cac module dashboard, import fee tracking, prepare public batch va export ledger deu phu thuoc vao cach quy doi nay.
  - Ham `calculatePaidThroughAdvance` dang nhan `unitFee`.
  - Dang tinh `addedMonths = availableAmount / unitFee`.
  - Anh huong truc tiep den "thang da dong den".

- [ ] `scripts/prepare-public-batch-from-history-v2.ts`
  - Doc `quyTacPhi` voi `dang_ap_dung: true`, `ma_phi: "QLVH"`.
  - Tao `feeByType`, lay `unitFee` theo `loai_can`.
  - Ghi `unitFee`, `remainderAmount`, `paidThrough`, `publicDisplayText` vao `payload_public_json`.
  - La diem rui ro cao nhat vi tao du lieu public cho cu dan.

- [ ] `src/modules/apartments/fee-notice-export.ts`
  - `getMonthlyFeeMap` doc `quyTacPhi`.
  - Dang fallback hardcode `CHUNG_CU = 250000`, `LIEN_KE = 200000`.
  - Dang tinh `totalFee = monthlyFee * 6`.
  - Anh huong thong bao thu phi va file xuat.

- [ ] `app/api/export/fee-notice-docx/route.ts`
  - Tieu thu dataset tu `getFeeNoticeDataset`, trong do route thay placeholder bang `row.monthlyFee`, `row.totalFee`.
  - Source of truth can sua truoc la `src/modules/apartments/fee-notice-export.ts`, route DOCX chu yeu la noi render/template.
  - Placeholder lien quan: `{{PHI_HANG_THANG}}`, `{{TONG_PHI}}`.

- [ ] `app/api/export/fee-notice-list/route.ts`
  - Dung dataset tu `getFeeNoticeDataset`.
  - Anh huong Excel/checklist thong bao thu phi.

- [ ] `app/api/export/fee-distribution-report/route.ts`
  - Xuat bao cao tien do thu phi tu `getApartmentDashboardData`.
  - Doc `distributionOverview.distribution` va `attentionRows`, phu thuoc gian tiep vao `paidThrough` da tinh.
  - Neu logic tinh `paidThrough` doi, so lieu bao cao thu/con no trong file nay cung doi.

- [ ] `app/api/export/monthly-fee-ledger/route.ts`
  - Route goi `scripts/export-monthly-fee-ledger.ts`.
  - Can test cung script ledger vi route la duong nguoi dung bam export trong UI.

- [ ] `app/admin/transactions/review/page.tsx`
  - Doc `quyTacPhi` theo `feeEffectiveAt`.
  - Tao `feeByApartmentCode` de goi `suggestTransactionAllocations`.
  - Anh huong goi y phan bo giao dich nhieu can.

- [ ] `src/modules/transactions/review/allocations.ts`
  - Khong doc DB, nhung dung `feeByApartmentCode` lam trong so phan bo.
  - Co logic `exactMatch`: neu tong tien giao dich bang tong fee chuan thi gan `MULTI_EXACT`; neu khong thi chia theo ty trong.
  - Neu caller dua fee sai thoi diem, ca so tien goi y va nhan `MULTI_EXACT/MULTI_PRORATED` deu co the sai.

- [ ] `scripts/report-bank-statement-parser-v2.ts`
  - Doc `quyTacPhi`.
  - Dung `monthlyFee` de tinh `equivalentMonths`.
  - Anh huong report kiem tra parser/sao ke.

Tinh nang dung ket qua tinh phi/payload public gian tiep:

- [ ] `app/tra-cuu-phi/page.tsx`
  - Hien `publicFeeDisplayText`.
  - Hien canh bao `isPartialPayment`.

- [ ] `src/modules/billing/fee-status.ts`
  - Parse input tra cuu va format trang thai phi public.

- [ ] `src/modules/apartments/dashboard.ts`
  - Doc `paidThrough`, `remainderAmount`, `isPartialPayment`.
  - Tinh tong quan hoan thanh ky phi, canh bao cat dien, phan bo thang da dong den, tra cuu nhieu can.

- [ ] `src/modules/apartments/financial-profile.ts`
  - Hien lich su dong phi, cong no/so du/thang da dong den trong ho so can ho.

- [ ] `app/admin/database/apartment-financial-profile.tsx`
  - UI hien ho so tai chinh can ho.

- [ ] `app/admin/import/public-preview/page.tsx`
  - Hien preview public, so du/chua du thang qua `remainderAmount`.

- [ ] `src/modules/imports/monthly-closing.ts`
  - Copy payload public sang so chot thang, doc `remainderAmount`.

- [ ] `scripts/export-monthly-fee-ledger.ts`
  - Xuat so theo doi thu phi, doc `paidThrough` va `remainderAmount`.

Nguon can don dep/deprecate neu khong con la source of truth:

- [ ] `config/periodic-fee-rules.json` - dang hardcode monthly fee.
- [ ] `scripts/fix-l4a-126-127-public.cjs` - one-off hardcode `unitFee = 250000`.
- [ ] `scripts/prepare-template.ts`, `scripts/temp-modify-word.js` - template co text cong thuc/placeholder phi co dinh.

## 1. Ma tran tinh nang can test sau moi thay doi lien quan don vi phi

Moi checklist item o Phase 1/Phase 2 neu cham den don vi phi phai tick lai ma tran nay.

- [ ] Tinh "thang da dong den"
  - Test `calculatePaidThroughAdvance`/helper moi voi muc phi hien tai.
  - Test co tien du, tien le, tien khong du 1 thang.
  - Test can chung cu va lien ke.
  - Test bat buoc khong duoc lam lech `numericMonth`, `paidThrough.displayText`, `thang_da_dong_den_hien_tai`.
  - So sanh ket qua truoc/sau tren mot tap can fixture truoc khi chap nhan thay doi.

- [ ] Tao public preview tu lich su da duyet
  - Chay/kiem tra `prepare-public-batch-from-history-v2`.
  - Xem `payload_public_json` co dung `paidThrough`, `remainderAmount`, `publicDisplayText`.
  - Kiem tra khong lam lui `paidThrough` cua can da public cao hon.
  - Kiem tra ngau nhien/toan bo cac can co giao dich moi: so tien nop, so thang duoc cong, so du le va thang da dong den phai khop bang tinh tay.

- [ ] Public/tra cuu cu dan
  - Trang `/tra-cuu-phi` hien dung "da dong den".
  - Can co tien le van hien canh bao partial dung.
  - Khong lo thong tin noi bo/audit ra public neu khong can.
  - Du lieu public cua cu dan khong duoc hien thang da dong den thap hon snapshot truoc neu khong co quy trinh rollback/chinh sua duoc phe duyet.

- [ ] Tra cuu noi bo/dashboard
  - Dashboard tong quan hoan thanh ky phi khong lech.
  - Phan bo thang da dong den khong lech.
  - Canh bao cat dien khong lech.
  - Tra cuu nhanh 1 can va tra cuu nhieu can hien dung.

- [ ] Ho so tai chinh can ho
  - Lich su giao dich van dung so tien goc.
  - Trang thai hien tai van dung public batch hien hanh.
  - Neu co `remainderAmount`/audit moi thi khong gay loi UI.

- [ ] Duyet sao ke va phan bo nhieu can
  - Goi y phan bo 1 can/nhieu can van dung.
  - Giao dich nhieu can co muc phi khac nhau phan bo theo dung trong so.
  - Giao dich co ngay qua khu/tuong lai khong lay sai fee hien tai.

- [ ] Thong bao thu phi
  - Danh sach can can thong bao dung theo `paidThrough`.
  - Tong tien thong bao dung.
  - Neu khoang 6 thang cat qua moc tang phi thi tong tien bang tong tung thang.

- [ ] Export DOCX thong bao thu phi
  - `{{PHI_HANG_THANG}}` va `{{TONG_PHI}}` dung voi truong hop 1 muc phi.
  - Neu nhieu muc phi trong 6 thang, co text/placeholder khong gay sai nghiep vu.

- [ ] Export Excel danh sach thong bao
  - File list thu phi dung so tien.
  - Header/label khong noi sai "x 6" neu nhieu muc phi.

- [ ] Bao cao so theo doi thu phi
  - Route `app/api/export/monthly-fee-ledger/route.ts` tra file duoc.
  - Export monthly fee ledger khong loi voi payload moi.
  - Cac cot `paidThrough`, `remainderAmount` khong lech.

- [ ] Bao cao tien do thu phi
  - Route `app/api/export/fee-distribution-report/route.ts` tra file duoc.
  - So can da thu/con no dung theo `paidThrough` moi.
  - Chi dong tren cung duoc boi do, cac dong cu mau den theo yeu cau UI/report hien tai.
  - So lieu report chi duoc chap nhan sau khi doi chieu voi public snapshot, khong chi nhin file Excel render thanh cong.

- [ ] Report parser/sao ke
  - `equivalentMonths` khong con tinh sai khi co lich phi thay doi.
  - Report van chay duoc voi du lieu hien tai.

- [ ] Seed/config/legacy
  - Seed local khong tao duplicate rule.
  - Seed/script Phase 2 neu them rule moi phai dong rule cu bang `hieu_luc_den_ngay`.
  - Khong con flow nghiep vu chinh doc fee tu hardcode/config cu.

Lenh test toi thieu sau moi cum sua:

- [ ] `npm test`
- [ ] `npm run prisma:validate`
- [ ] `npm run build`
- [ ] Neu co UI thay doi: mo dev server va kiem tra thu cong cac man admin/public lien quan.

## 2. Phase 1 - Nang loi tinh phi, giu van hanh hien tai

Trang thai DB mong muon: khong tao bang moi, khong migrate schema. Chi doc bang `quy_tac_phi` hien co.

### 2.1. Kiem tra va xac nhan DB hien tai

- [ ] Kiem tra rule `QLVH` cho `CHUNG_CU`.
- [ ] Kiem tra rule `QLVH` cho `LIEN_KE`.
- [ ] Rule hien tai co `hieu_luc_tu_ngay` hop le.
- [ ] Rule hien tai co `hieu_luc_den_ngay = NULL`.
- [ ] Khong co rule cung `loai_can + ma_phi` bi chong lan thoi gian.
- [ ] Khong can migration schema cho Phase 1.

Checklist trong checklist:

- [ ] Chay ma tran test muc 1 cho seed/config.
- [ ] Ghi lai ket qua rule DB local/prod truoc khi sua code.

### 2.2. Tao helper tinh phi theo ky hieu luc

File de xuat: `src/modules/billing/fee-schedule.ts`.

- [ ] Tao type `FeeMonth`, `FeeRuleWindow`, `FeeScheduleResult`.
- [ ] Tao helper lay rule dung tai mot thang theo `loai_can`, `ma_phi`.
- [ ] Tao helper tra ve lich phi tung thang trong mot khoang.
- [ ] Hieu `hieu_luc_den_ngay = NULL` la con hieu luc vo thoi han.
- [ ] Giu `FEE_BASE_YEAR = 2026` la anchor lich su; helper moi khong duoc doi moc nay.
- [ ] Neu thieu rule phi cho thang can tinh thi throw loi ro.
- [ ] Neu rule overlap thi helper/validator bao loi ro.
- [ ] Khong fallback ve `250000`/`200000` trong helper nghiep vu.
- [ ] Xac dinh policy khi can dong truoc xa hon rule da co:
  - Neu rule cu co `hieu_luc_den_ngay = NULL`, duoc phep assume rule cu tiep tuc vo thoi han.
  - Neu rule cu da bi dong han va khoang tuong lai chua co rule tiep theo, phai throw loi "thieu rule phi".
  - Khong duoc tu y lay rule cu da het han de tinh thang tuong lai.

Checklist trong checklist:

- [ ] Unit test rule hien tai 1 muc phi.
- [ ] Unit test rule cat moc T1/2027.
- [ ] Unit test missing rule.
- [ ] Unit test overlapping rule.
- [ ] Unit test rule `hieu_luc_den_ngay = NULL` ap dung vo thoi han.
- [ ] Unit test rule cu da dong han nhung thieu rule tiep theo thi fail.
- [ ] Chay day du ma tran test muc 1: tinh thang da dong den, public preview, thong bao thu phi.

### 2.3. Thay logic `unitFee` trong tinh "thang da dong den"

File chinh: `src/modules/billing/paid-through.ts`.

- [ ] Giu ham cu neu can de backward compatibility test, nhung flow moi dung schedule-based helper.
- [ ] Thay phep chia `availableAmount / unitFee` bang tinh tung thang.
- [ ] Thuat toan moi phai lap tu `baseNumericMonth + 1`, moi vong:
  - Resolve thang/nam thuc tu `numericMonth` va `FEE_BASE_YEAR`.
  - Lay fee dung cho thang do.
  - Neu `availableAmount >= monthlyFee`, tru tien va them thang vao `paidMonths`.
  - Neu khong du tien, dung lai va giu phan con lai o `remainderAmount`.
- [ ] Ket qua moi can tra ve:
  - `previousCarryAmount`
  - `newPaymentAmount`
  - `availableAmount`
  - `paidMonths`
  - `paidMonths[].numericMonth`
  - `paidMonths[].month`
  - `paidMonths[].year`
  - `paidMonths[].feeAmount`
  - `paidMonths[].feeRuleId`
  - `addedMonths`
  - `remainderAmount`
  - `nextNumericMonth`
  - `calculationMode`
  - `feeRuleIds`
- [ ] Neu chua co rule moi, ket qua phai giong code cu.
- [ ] So tien le giu vao `remainderAmount`.
- [ ] Test `publicDisplayText` va `isPartialPayment` khi fee moi cao hon fee cu lam con du tien nhung khong du them 1 thang moi.

Checklist trong checklist:

- [ ] Test chung cu 250.000d/thang hien tai.
- [ ] Test lien ke 200.000d/thang hien tai.
- [ ] Test dong vat nam T9/2026 den T2/2027 khi T1/2027 tang phi.
- [ ] Test tien le va partial payment.
- [ ] Chay lai ma tran: public preview, public lookup, dashboard, ledger.

### 2.4. Cap nhat tao public preview tu lich su da duyet

File chinh: `scripts/prepare-public-batch-from-history-v2.ts`.

- [ ] Doc fee rules theo range thang can tinh, khong chi lay rule `dang_ap_dung` moi nhat.
- [ ] Tinh `paidThrough` bang helper schedule.
- [ ] Ghi audit vao `payload_public_json`:
  - `calculationMode`
  - `feeSchedule`
  - `feeRuleIds`
  - `paidMonths`
  - `remainderAmount`
- [ ] Giu `publicDisplayText` giong hien tai neu khong co tang phi.
- [ ] Khong lam lui `paidThrough` hien tai neu batch moi co du lieu ky cu.
- [ ] Neu thieu rule phi, fail sớm truoc khi tao batch nhap.

Checklist trong checklist:

- [ ] Tao preview voi du lieu hien tai, so can/thang da dong den khong lech.
- [ ] Tao preview voi fixture tang phi T1/2027.
- [ ] Kiem tra `/admin/import/public-preview`.
- [ ] Kiem tra `/tra-cuu-phi`.
- [ ] Kiem tra `src/modules/imports/monthly-closing.ts` van doc payload moi.
- [ ] Kiem tra `scripts/export-monthly-fee-ledger.ts` van xuat duoc.

### 2.5. Cap nhat thong bao thu phi

File chinh:

- `src/modules/apartments/fee-notice-export.ts`
- `app/api/export/fee-notice-docx/route.ts`
- `app/api/export/fee-notice-list/route.ts`

- [ ] Bo fallback hardcode fee trong dataset nghiep vu.
- [ ] Bo cach tinh `totalFee = monthlyFee * 6`.
- [ ] Tinh tong phi bang tong lich phi tung thang.
- [ ] Neu 6 thang cung muc phi, UI/file xuat giu format cu.
- [ ] Neu 6 thang co nhieu muc phi, template DOCX hien tai khong the bieu dien bang 1 so `{{PHI_HANG_THANG}}`; phai chon 1 trong 2 phuong an:
  - Phuong an A: tao template DOCX moi co bang breakdown tung thang.
  - Phuong an B: giu template cu, thay `{{PHI_HANG_THANG}}` bang text `Theo bang phi tung thang` va `{{TONG_PHI}}` bang tong thuc te.
- [ ] De xuat Phase 1 chon phuong an B de it thay doi template nhat.
- [ ] Kiem tra template docx/script template co con cau `PHI_HANG_THANG x 6` gay sai nghiep vu khong.
- [ ] Neu route DOCX khong sua nhieu, van phai test vi no la noi render placeholder tu dataset.

Checklist trong checklist:

- [ ] Test dataset thong bao voi 1 muc phi.
- [ ] Test dataset thong bao cat qua T1/2027.
- [ ] Test DOCX voi 6 thang cung muc phi.
- [ ] Test DOCX voi 6 thang co 2 muc phi; khong duoc hien cong thuc sai `mot muc phi x 6`.
- [ ] Export DOCX.
- [ ] Export Excel danh sach thong bao.
- [ ] Kiem tra trang `app/admin/database/page.tsx` link export van dung.

### 2.6. Cap nhat duyet sao ke va goi y phan bo

File chinh:

- `app/admin/transactions/review/page.tsx`
- `src/modules/transactions/review/allocations.ts`

- [ ] Xac nhan `feeEffectiveAt` dang lay theo ngay giao dich hay ky du lieu.
- [ ] Lay fee theo thang lien quan den giao dich/ky phi, khong lay nham muc phi hien tai.
- [ ] `feeByApartmentCode` phai co trong so dung cho tung can.
- [ ] `src/modules/transactions/review/allocations.ts` can tinh `expectedTotal` theo fee dung thoi diem, vi `exactMatch` quyet dinh nhan `MULTI_EXACT` vs `MULTI_PRORATED`.
- [ ] Neu giao dich nhieu can cat qua moc tang phi va khong the suy dien ro, can yeu cau duyet tay/phan bo tay.

Checklist trong checklist:

- [ ] Test giao dich 1 can.
- [ ] Test giao dich nhieu can cung loai can.
- [ ] Test giao dich nhieu can khac loai can.
- [ ] Test giao dich nhieu can co tong tien khop fee cu nhung khong khop fee moi, va nguoc lai.
- [ ] Test giao dich qua khu khi fee hien tai da thay doi.
- [ ] Test khong cap quick approve sai khi parser tim thay nhieu can.

### 2.7. Cap nhat report parser/sao ke

File chinh: `scripts/report-bank-statement-parser-v2.ts`.

- [ ] Khong tinh `equivalentMonths = amount / monthlyFee` bang muc phi hien tai neu giao dich thuoc thang khac.
- [ ] Neu can tinh so thang tu so tien, dung helper schedule.
- [ ] Neu khong du thong tin de suy ra range thang, report can ghi "can kiem tra", khong cho cam giac chac chan gia.

Checklist trong checklist:

- [ ] Chay report voi data hien tai.
- [ ] Kiem tra cot `Tuong duong so thang`.
- [ ] Kiem tra note canh bao voi giao dich nhieu can/nhieu thang.

### 2.8. Cap nhat dashboard, tra cuu noi bo, tra cuu cu dan

File/module lien quan:

- `app/tra-cuu-phi/page.tsx`
- `src/modules/billing/fee-status.ts`
- `src/modules/apartments/dashboard.ts`
- `src/modules/apartments/financial-profile.ts`
- `app/admin/database/apartment-financial-profile.tsx`
- `app/admin/dashboard/page.tsx`

- [ ] Dam bao cac UI hien tai khong bi doi text neu chua co fee change.
- [ ] Neu payload co field moi, UI khong crash.
- [ ] Can co `remainderAmount` van hien canh bao partial dung.
- [ ] Neu sau nay co thu bu do fee change, chua hien public neu chua chot nghiep vu.

Checklist trong checklist:

- [ ] Kiem tra trang chu va `/tra-cuu-phi`.
- [ ] Kiem tra `/admin/dashboard` tra cuu nhanh 1 can.
- [ ] Kiem tra tra cuu nhieu can.
- [ ] Kiem tra dashboard tong quan, canh bao cat dien.
- [ ] Kiem tra ho so tai chinh can ho.
- [ ] Kiem tra bao cao tien do thu phi qua `app/api/export/fee-distribution-report/route.ts`.

### 2.9. Don dep source of truth

- [ ] Quyet dinh `quy_tac_phi` la source of truth cho phi QLVH.
- [ ] `config/periodic-fee-rules.json` chi con dung cho reference/test hoac deprecate.
- [ ] Script one-off hardcode fee khong duoc goi trong quy trinh van hanh.
- [ ] Tim va xu ly tat ca hardcode `250000`, `200000`, `monthlyFee * 6`, `unitFee`.
- [ ] Ghi ro file nao la source of truth tinh phi, file nao chi la route/render/export.

Checklist trong checklist:

- [ ] Chay `rg "250000|200000|monthlyFee \\* 6|unitFee"`.
- [ ] Chay `rg "FEE_BASE_YEAR|monthlyFee|totalFee|quyTacPhi|feeByApartmentCode|equivalentMonths"`.
- [ ] Phan loai tung ket qua: nghiep vu chinh, test, template, script legacy.
- [ ] Khong de nghiep vu chinh dung hardcode.

### 2.10. Tieu chi xong Phase 1

- [ ] Van hanh hien tai khong doi.
- [ ] Khong can migrate DB.
- [ ] Ket qua tinh phi voi rule hien tai khong lech so voi truoc.
- [ ] Public preview tao duoc va public lookup hien dung.
- [ ] Thong bao thu phi va export khong tinh sai tong tien.
- [ ] Duyet sao ke/goi y phan bo khong dung sai fee theo ngay hien tai.
- [ ] Code da san sang cho viec them rule phi tuong lai.
- [ ] Da chay `npm test`, `npm run prisma:validate`, `npm run build`.

## 3. Phase 2 - Mo quan tri thay doi phi khi co quyet dinh chinh thuc

Trang thai DB co the can cap nhat du lieu, nhung chua chac can sua schema. Chi can migration neu them audit table/constraint DB.

### 3.1. UI quan ly quy tac phi

- [ ] Tao/bat menu `Quy tac phi` duoi nhom `Co so du lieu`.
- [ ] Phan quyen:
  - Admin va quan ly duoc them/sua/vo hieu hoa rule.
  - Ky thuat chi duoc xem.
- [ ] Them permission moi, de xuat `MANAGE_FEE_RULES`.
- [ ] Gan permission:
  - `SUPER_ADMIN`: co `MANAGE_FEE_RULES`.
  - `MANAGER`: can BQT chot; neu cho quan ly thay doi phi thi co `MANAGE_FEE_RULES`, neu khong thi chi duoc xem.
  - `TECHNICIAN`: khong co `MANAGE_FEE_RULES`.
- [ ] Cap nhat `src/modules/auth/permissions.ts`.
- [ ] Cap nhat `permissionForAdminPath` de route `/admin/fee-rules` hoac `/admin/database/fee-rules` map dung permission.
- [ ] Cap nhat `components/admin/admin-navigation.tsx`.
- [ ] Cap nhat bang mo ta role tren `app/admin/accounts/page.tsx`.

Checklist trong checklist:

- [ ] Super Admin thay va thao tac duoc.
- [ ] Manager thay va thao tac duoc neu chot nghiep vu cho phep.
- [ ] Technician chi xem hoac khong thay nut sua.
- [ ] Middleware va server action cung chan dung, khong chi an nut UI.

### 3.2. Form/list rule phi

- [ ] Danh sach hien loai can, ma phi, so tien, tu ngay, den ngay, trang thai, ghi chu.
- [ ] Form them/sua chan so tien <= 0.
- [ ] Form chan ngay ket thuc nho hon ngay bat dau.
- [ ] Form chan rule chong lan thoi gian.
- [ ] Co tuy chon dong rule cu khi them rule moi.
- [ ] Co preview tinh thu: chon can/loai can + khoang thang, hien phi tung thang va tong tien.
- [ ] Xem xet DB-level overlap protection trong Phase 2:
  - PostgreSQL exclusion constraint voi daterange/tstzrange neu chap nhan migration nang cao.
  - Hoac trigger check overlap.
  - Neu chua lam DB-level constraint, bat buoc co server-side validator va test canh tranh toi thieu.

Checklist trong checklist:

- [ ] Test tao rule hop le.
- [ ] Test sua rule hop le.
- [ ] Test overlap bi chan.
- [ ] Test xoa/vo hieu hoa khong pha du lieu public cu.
- [ ] Test preview tinh thu cat qua moc tang phi.

### 3.3. Script cap nhat phi noi bo

- [ ] Script dong rule cu bang `hieu_luc_den_ngay`.
- [ ] Script them rule moi tu ngay hieu luc.
- [ ] Script idempotent, chay lai khong tao trung.
- [ ] Script in log truoc/sau.
- [ ] Script co dry-run.
- [ ] Script Phase 2 khong dung logic seed cu don thuan `findFirst -> skip`, vi can dong rule cu khi them rule moi.
- [ ] Script phai verify sau khi apply:
  - Moi `(loai_can, ma_phi)` chi co mot rule active tai moi thang.
  - Rule cu da co `hieu_luc_den_ngay`.
  - Rule moi co `hieu_luc_tu_ngay` dung va `hieu_luc_den_ngay = NULL`.

Neu tang phi them 50.000d tu T1/2027, du lieu ky vong:

- [ ] `CHUNG_CU`, `QLVH`, `250000`, tu `2026-01-01`, den `2026-12-31`.
- [ ] `LIEN_KE`, `QLVH`, `200000`, tu `2026-01-01`, den `2026-12-31`.
- [ ] `CHUNG_CU`, `QLVH`, `300000`, tu `2027-01-01`, den `NULL`.
- [ ] `LIEN_KE`, `QLVH`, `250000`, tu `2027-01-01`, den `NULL`.

Checklist trong checklist:

- [ ] Chay dry-run local.
- [ ] Chay apply local.
- [ ] Verify DB khong overlap.
- [ ] Tao preview fixture dong vat T12/2026 -> T1/2027.
- [ ] Chay lai toan bo ma tran tinh nang can test.

### 3.4. Audit va rollback

- [ ] Neu can audit table: tao migration rieng.
- [ ] Audit ghi ai thay doi, luc nao, noi dung truoc/sau, ly do.
- [ ] Rollback duoc rule moi neu nhap sai.
- [ ] Public data cu khong bi tinh lai/ghi de ngoai y muon.

Checklist trong checklist:

- [ ] Backup DB truoc deploy.
- [ ] Test rollback local.
- [ ] Test deploy staging/local-prod mode neu co.

### 3.5. Quy trinh deploy VPS

- [ ] Backup DB.
- [ ] Deploy code.
- [ ] Chay `npm run prisma:validate`.
- [ ] Neu co migration: chay `npm run prisma:migrate:deploy`.
- [ ] Neu Phase 2 them DB-level overlap constraint/trigger: test migration tren ban copy DB truoc VPS that.
- [ ] Chay script cap nhat rule phi neu co quyet dinh tang phi.
- [ ] Verify rule phi tren production.
- [ ] Test mot can chung cu va mot can lien ke.
- [ ] Tao preview thu truoc khi public that.
- [ ] Xuat thong bao thu phi thu neu ky cat qua moc tang phi.

Tieu chi xong Phase 2:

- [ ] Admin/quan ly cap nhat duoc rule phi tu UI hoac script noi bo.
- [ ] Rule phi moi khong chong lan rule cu.
- [ ] Cac tinh nang tinh phi tu dong nhan rule moi theo ngay hieu luc.
- [ ] Co rollback khi nhap sai.
- [ ] Toan bo ma tran tinh nang can test da pass.
