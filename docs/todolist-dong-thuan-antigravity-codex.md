# Todo list đồng thuận Antigravity - Codex

Nguồn đồng thuận: `CURRENT_FEEDBACK.md`, ngày 23/05/2026.

File này ghi các việc Antigravity và Codex đã thống nhất sau khi phản biện kỹ thuật. File không thay thế `docs/roadmap.md`; roadmap vẫn là điều phối cấp cao. File này dùng để theo dõi các việc có tính rủi ro kỹ thuật trước deploy public và trước khi vận hành đối soát sao kê thật.

## Nguyên tắc ưu tiên

- Giai đoạn 1 tập trung hoàn thiện public lookup, admin cơ bản, import/chốt Excel phí và nghiệm thu mobile.
- Giai đoạn 2 mới đưa module đối soát sao kê ngân hàng vào vận hành thật.
- Rủi ro đối soát sao kê không được chặn deploy public lookup nếu module này chưa giao cho BQT/manager dùng chính thức.
- Dữ liệu batch public phải lấy từ DB thật tại thời điểm nghiệm thu, không ghi cứng theo kỳ test cũ.

## Giai đoạn 1 - Trước khi deploy public lookup

| Trạng thái | Việc cần làm | Mức ưu tiên | Điều kiện kiểm tra |
| --- | --- | --- | --- |
| [x] | Truy vấn DB để xác nhận batch phí public hiện hành trước nghiệm thu/deploy | P0 | 23/05/2026: public batch `8`, kỳ `T5-2026`, đủ `934` căn, publish bởi `admin` |
| [x] | Kiểm tra public lookup không hiển thị tên cư dân, SĐT, ghi chú nội bộ, raw Excel | P0 | 23/05/2026: public route chỉ đọc batch/status phí; không query contact/raw Excel |
| [x] | Kiểm tra mobile public ở 390px và 430px | P0 | 23/05/2026: Playwright mobile audit pass |
| [x] | Kiểm tra admin mobile ở 390px và 430px | P1 | 23/05/2026: Playwright mobile audit pass, dashboard dùng Tabs |
| [x] | Kiểm tra desktop 1440px cho public và admin | P1 | 23/05/2026: kiểm tra `/`, `/tra-cuu-phi`, `/admin`, `/admin/dashboard`, không overflow ngang |
| [x] | Kiểm tra Super Admin import/chốt file Excel phí | P0 | 23/05/2026: rebuild từ `docs/Theo dõi thu phí T5.xlsx`, import batch `25`, public batch `8`, đủ `934` dòng |
| [x] | Kiểm tra login/logout và role guard | P0 | 23/05/2026: login admin pass; token `MANAGER` vào `/admin/import` bị redirect `/admin?denied=1`, `SUPER_ADMIN` vào được |
| [ ] | Cấu hình `ADMIN_SESSION_SECRET` production riêng, không dùng secret dev | P0 | `.env.production`/VPS có secret riêng |
| [x] | Kiểm tra không push dữ liệu nhạy cảm trong `db-sync/*.sql` lên remote dùng chung | P0 | 23/05/2026: thêm ignore và gỡ `db-sync/*.sql`, `*.meta.json` khỏi Git index, file vẫn giữ trên máy |
| [x] | Ghi và dùng runbook build sạch khi lỗi CSS/chunk | P1 | 23/05/2026: dừng dev, xóa `.next`, `npm run build`, chạy lại dev server |
| [x] | Chạy kiểm tra kỹ thuật cuối Task N | P0 | 23/05/2026: `npm test` pass 95/95, `npm run build` pass, `npm run test:mobile-ui` pass 40/40 |

## Giai đoạn 2 - Trước khi vận hành đối soát sao kê thật

| Trạng thái | Việc cần làm | Mức ưu tiên | Điều kiện kiểm tra |
| --- | --- | --- | --- |
| [x] | Thêm unique constraint cho `phan_bo_giao_dich` theo cặp giao dịch/căn hộ | P0 | 10/06/2026: migration `20260610150000_phase2_integrity_and_reserve` đã chạy; không có dữ liệu trùng trước migration |
| [x] | Bọc import sao kê/phân bổ trong `prisma.$transaction` | P0 | 10/06/2026: toàn bộ batch raw/canonical/operational dùng một transaction, timeout 120 giây |
| [x] | Không reset `duyet_giao_dich` đã được duyệt khi re-import | P1 | 02/06/2026: re-import giữ nguyên trạng thái đã duyệt/từ chối; không chuyển giao dịch cũ sang batch raw mới |
| [x] | Hợp nhất parser TS/CJS hoặc dùng chung rule/config/test | P1 | Parser mã căn duy nhất tại `src/modules/transactions/parser/apartment-parser.ts`; parser kỳ phí duy nhất tại `src/modules/billing/paid-through.ts`; script CJS chỉ là launcher |
| [x] | Đưa mức phí phân bổ khỏi hardcode 250.000/200.000 | P2 | 10/06/2026: màn duyệt và báo cáo sao kê đọc `quy_tac_phi` theo loại căn/thời điểm; thiếu rule thì chỉ chia đều để gợi ý, không tự đoán mức phí |
| [x] | Ghi log khi parser mới mâu thuẫn với quyết định duyệt cũ | P2 | Re-import lưu `payload_goc_json.parserConflict`, giữ nguyên quyết định cũ và hiển thị cảnh báo trên màn duyệt |
| [x] | Card giao dịch ngân hàng gần nhất theo căn hộ | P2 | Tra cứu nội bộ đã hiển thị giao dịch gần nhất, nội dung gốc và bằng chứng liên quan |
| [x] | Thêm lớp sổ chốt tháng chuẩn vĩnh viễn | P0 | 28/05/2026: thêm `so_chot_thang`, `so_chot_can_ho`, public batch liên kết `so_chot_thang_id`; Excel chuyển thành công cụ đặc biệt |
| [x] | Màn đối soát giao dịch đã duyệt theo tháng | P0 | 10/06/2026: module `monthly-reconciliation.ts` tổng hợp số căn, số giao dịch, tổng tiền và số dòng chưa public; đối soát Excel đầy đủ tiếp tục dùng báo cáo chuyên dụng |
| [x] | Import sao kê chỉ tạo giao dịch cần duyệt sau mốc sổ chốt mới nhất | P0 | 02/06/2026: `scripts/import-bank-statement-v2.ts` tự đọc `so_chot_thang.metadata_json.chotDenThoiDiem`; dòng thu trước/đúng mốc chỉ lưu raw staging, không tạo `giao_dich_ngan_hang`/`duyet_giao_dich` |
| [x] | Không lấy nhầm sổ chốt không có mốc thời gian làm cutoff import sao kê | P0 | 02/06/2026: import/report/trang duyệt chỉ dùng sổ có `chotDenThoiDiem`; sổ T6 chưa có cutoff không làm mất mốc chốt T5 |
| [x] | Trang duyệt không tự chọn batch raw-only sau khi re-import file trùng | P1 | 02/06/2026: nếu batch import mới chỉ có raw staging và `0` giao dịch, trang duyệt mặc định chọn batch gần nhất có giao dịch |
| [x] | Dọn dữ liệu giao dịch sinh sai do re-import sau khi mất cutoff | P0 | 02/06/2026: xóa 5 giao dịch ngày 31/05/2026 thuộc batch lỗi `#46` và 1 lịch sử thử nghiệm chưa public; batch vận hành còn 16 giao dịch sau cutoff, 14 giao dịch cần duyệt |
| [x] | Chuẩn hóa phân quyền tập trung và ẩn menu theo role | P1 | 10/06/2026: `permissions.ts` là nguồn duy nhất; menu, middleware và action dùng chung; bỏ mục Cơ sở dữ liệu; có test 3 role |
| [x] | Bảo toàn tiền đóng lẻ qua nhiều kỳ public | P0 | `previousCarryAmount + newPaymentAmount` mới được quy đổi tháng; số dư lưu trong payload public và `so_chot_can_ho.so_du_chua_du_thang` |
| [x] | Thêm trạng thái bảo lưu giao dịch | P1 | Khoản ủng hộ/chưa đủ căn có thể chuyển `BAO_LUU`, không tạo lịch sử phí và không nằm trong hàng chờ chính |
| [x] | Bỏ `execFileSync` khỏi web import | P1 | Server action chạy CLI bất đồng bộ qua `src/modules/imports/script-runner.ts` |

## Backlog cần quyết định

| Trạng thái | Việc cần quyết định | Ghi chú |
| --- | --- | --- |
| [ ] | Có đưa đối soát sao kê ngân hàng vào bản deploy đầu tiên không | Đề xuất hiện tại: không chặn public lookup |
| [ ] | Chọn cách hợp nhất parser | Ưu tiên build artifact JS hoặc rule/config dùng chung; chỉ dùng runtime TS nếu có lý do rõ |
| [ ] | Mức audit admin production | Hiện chủ dự án muốn nhẹ, không audit rườm rà; chỉ giữ mức đủ truy vết thao tác import/chốt quan trọng |

## Cập nhật kiểm tra cuối Task N - 24/05/2026

- Public lookup đã kiểm tra lại với nhiều kiểu input parser: `L1.115`, `l1 115`, `can 115 lo l1`, `L1115`, `LK2.10`.
- Public page chỉ trả trạng thái phí `T5-2026`, không lộ số điện thoại, tên cư dân, ghi chú hoặc raw Excel.
- Admin dashboard đã kiểm tra desktop 1440px và mobile 430px với căn `L1.115`, không overflow ngang.
- Web import đã test bằng `docs/Theo dõi thu phí T5.xlsx`:
  - `Chỉ kiểm tra file`: `934` dòng, `0` lỗi mã căn, `0` thiếu tháng, `0` không parse được tháng, `3` đóng lẻ, `8` ngoài năm 2026.
  - `Nhập và công khai cho cư dân`: tạo batch public hiện hành đúng `T5-2026`.
- DB sau khi dọn dữ liệu test:
  - public batch hiện hành: `batch_trang_thai_phi_public.id = 9`
  - import batch tương ứng: `lo_nhap_du_lieu.id = 32`
  - snapshot public: `934` căn
  - chỉ còn `1` batch public hiện hành.
- Kiểm tra kỹ thuật cuối: `npm test` pass 95/95, `npm run build` pass, `npm run test:mobile-ui` pass 40/40.
