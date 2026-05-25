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
| [ ] | Thêm unique constraint cho `phan_bo_giao_dich` theo cặp giao dịch/căn hộ | P0 | Prisma schema có `@@unique([giao_dich_ngan_hang_id, can_ho_id])`, migration chạy được |
| [ ] | Bọc import sao kê/phân bổ trong `prisma.$transaction` | P0 | Import lỗi giữa chừng không để lại dữ liệu nửa vời |
| [ ] | Không reset `duyet_giao_dich` đã được duyệt khi re-import | P1 | Re-import giao dịch cũ giữ nguyên trạng thái khác `CHUA_DUYET` |
| [ ] | Hợp nhất parser TS/CJS hoặc dùng chung rule/config/test | P1 | Một bộ test parser kiểm được cả web và script |
| [ ] | Đưa mức phí phân bổ khỏi hardcode 250.000/200.000 | P2 | Logic đọc từ DB/config theo loại căn và thời điểm áp dụng |
| [ ] | Ghi log khi parser mới mâu thuẫn với quyết định duyệt cũ | P2 | Có cảnh báo để manager rà soát, không tự ghi đè quyết định cũ |
| [ ] | Card giao dịch ngân hàng gần nhất theo căn hộ | P2 | Khi tra cứu căn trong admin, hiển thị giao dịch đối chiếu gần nhất; chi tiết tại `docs/backlog-doi-soat-sao-ke.md` |

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
