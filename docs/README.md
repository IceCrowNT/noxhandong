# Tài liệu dự án

Thư mục `docs/` là nguồn tài liệu cấp cao của dự án. Khi mở project, đọc theo thứ tự trong file này trước khi dựa vào lịch sử chat.

## Entry Points

- Project README: [../README.md](../README.md)
- Handoff hiện tại: [handoff.md](handoff.md)
- Roadmap control: [roadmap.md](roadmap.md)
- Checklist nghiệm thu: [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md)
- Checklist duyệt trước deploy: [checklist-duyet-truoc-deploy.md](checklist-duyet-truoc-deploy.md)
- Database hiện hành: [database.md](database.md)
- Parser mã căn: [parser-ma-can-ho.md](parser-ma-can-ho.md)
- Design system: [design-system.md](design-system.md)
- Roadmap Phase 2: [phase-2-roadmap.md](phase-2-roadmap.md)
- Runbook deploy VPS duy nhất: [deploy-vps-step-by-step.md](deploy-vps-step-by-step.md)
- Production VPS decisions/checklist: [production-deploy-vps.md](production-deploy-vps.md)
- Todo VPS Phase 2: [vps-phase-2-todolist.md](vps-phase-2-todolist.md)
- Todo đồng thuận kỹ thuật: [todolist-dong-thuan-antigravity-codex.md](todolist-dong-thuan-antigravity-codex.md)
- Backlog đối soát sao kê: [backlog-doi-soat-sao-ke.md](backlog-doi-soat-sao-ke.md)
- Task Developer ẩn/feature flags: [task-developer-hidden-feature-flags.md](task-developer-hidden-feature-flags.md)

## Mục Đích

Tài liệu trong `docs/` dùng để nắm:

- mục tiêu sản phẩm
- trạng thái bàn giao
- thiết kế database
- rule nghiệp vụ
- checklist triển khai
- báo cáo dữ liệu thật
- roadmap phát triển
- quy trình deploy/vận hành VPS

## Tài Liệu Đọc Đầu Tiên

1. [handoff.md](handoff.md)
2. [roadmap.md](roadmap.md)
3. [phase-2-roadmap.md](phase-2-roadmap.md)
4. [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md)
5. [checklist-duyet-truoc-deploy.md](checklist-duyet-truoc-deploy.md)
6. [database.md](database.md)
7. [parser-ma-can-ho.md](parser-ma-can-ho.md)
8. [design-system.md](design-system.md)
9. [module-map.md](module-map.md)
10. [setup-may-moi-va-database.md](setup-may-moi-va-database.md)
11. [production-deploy-vps.md](production-deploy-vps.md)
12. [deploy-vps-step-by-step.md](deploy-vps-step-by-step.md)
13. [vps-phase-2-todolist.md](vps-phase-2-todolist.md)
14. [todolist-dong-thuan-antigravity-codex.md](todolist-dong-thuan-antigravity-codex.md)
15. [backlog-doi-soat-sao-ke.md](backlog-doi-soat-sao-ke.md)

## Nhóm Tài Liệu Xương Sống

| File | Vai trò |
| --- | --- |
| [handoff.md](handoff.md) | Trạng thái bàn giao hiện tại, việc đã xong, việc đang mở |
| [roadmap.md](roadmap.md) | Bảng điều phối cấp cao: mục tiêu, trạng thái task, task tiếp theo, quyết định lớn |
| [phase-2-roadmap.md](phase-2-roadmap.md) | Roadmap sau MVP: opening balance T5/2026, sao kê từ T6/2026, duyệt giao dịch, bằng chứng, thống kê |
| [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md) | Cổng nghiệm thu chi tiết: review/check/test/confirm cho từng task |
| [checklist-duyet-truoc-deploy.md](checklist-duyet-truoc-deploy.md) | Cổng dừng thủ công trước deploy |
| [database.md](database.md) | Thiết kế database hiện hành |
| [parser-ma-can-ho.md](parser-ma-can-ho.md) | Tài liệu trung tâm cho parser mã căn: nguồn case, rule, backlog test, bảo trì |
| [design-system.md](design-system.md) | Global design/pattern cho public/admin UI |
| [module-map.md](module-map.md) | Quy ước cấu trúc thư mục và ranh giới module |
| [setup-may-moi-va-database.md](setup-may-moi-va-database.md) | Hướng dẫn dựng môi trường và database |
| [production-deploy-vps.md](production-deploy-vps.md) | Quyết định và checklist production; không dùng làm runbook thao tác |
| [deploy-vps-step-by-step.md](deploy-vps-step-by-step.md) | Runbook deploy/vận hành VPS duy nhất: Windows Server, PostgreSQL, NSSM, Caddy HTTPS, backup, restore DB local authoritative |
| [vps-phase-2-todolist.md](vps-phase-2-todolist.md) | Todo riêng cho VPS Phase 2: backup, timezone, migration, nghiệm thu production |
| [todolist-dong-thuan-antigravity-codex.md](todolist-dong-thuan-antigravity-codex.md) | Todo list đồng thuận giữa Antigravity/Codex cho các việc kỹ thuật |
| [backlog-doi-soat-sao-ke.md](backlog-doi-soat-sao-ke.md) | Backlog Phase 2 cho import/đối soát sao kê |
| [task-developer-hidden-feature-flags.md](task-developer-hidden-feature-flags.md) | Task Developer ẩn và feature flags nội bộ, chưa triển khai |

## Nhóm Nghiệp Vụ Import, Sao Kê Và Contact

| File | Vai trò |
| --- | --- |
| [resident-import-rules.vi.md](resident-import-rules.vi.md) | Rule tách dữ liệu cư dân/liên hệ từ Excel |
| [filter-rules.vi.md](filter-rules.vi.md) | Rule lọc giao dịch sao kê không liên quan căn hộ |
| [doi-soat-sao-ke-va-bang-chung.md](doi-soat-sao-ke-va-bang-chung.md) | Ý tưởng và nghiệp vụ đối soát sao kê/bằng chứng |
| [backlog-doi-soat-sao-ke.md](backlog-doi-soat-sao-ke.md) | Backlog đối soát sao kê |
| [kiem-tra-ket-qua-parse-lien-he-can-ho.md](kiem-tra-ket-qua-parse-lien-he-can-ho.md) | Cách kiểm tra kết quả parse contact |

## Nhóm Báo Cáo Dữ Liệu Thật

Các báo cáo đặt trong [reports/](reports/). Đây là tài liệu tham khảo, không phải file control tiến trình.

Đọc mục lục báo cáo tại [reports/README.md](reports/README.md).

## File Dữ Liệu Đi Kèm

Các file Excel/CSV trong `docs/` là dữ liệu mẫu hoặc kết quả preview để kiểm chứng rule. Dữ liệu vận hành thật nên được import qua UI/script chính thức và ghi nhận trong DB.

## Quy Tắc Cập Nhật Tài Liệu

Khi chốt thay đổi lớn, cập nhật ít nhất:

- `handoff.md`
- `roadmap.md`
- `checklist-trien-khai-va-nghiem-thu.md`

Khi thay đổi database:

- cập nhật `database.md`
- cập nhật `prisma/schema.prisma`
- nếu file schema cũ không còn dùng, chuyển vào thư mục archive thay vì xóa thẳng

Khi thay đổi rule parser:

- cập nhật `parser-ma-can-ho.md`
- đảm bảo project chỉ có một nguồn thuật toán parser chính, tránh nhiều file cùng phân tích mã căn theo cách khác nhau

Khi thay đổi UI:

- cập nhật `design-system.md` nếu thay đổi là pattern dùng lâu dài

Khi thay đổi deploy:

- cập nhật duy nhất [deploy-vps-step-by-step.md](deploy-vps-step-by-step.md)
- không tạo thêm runbook deploy song song

## Quy Tắc Dọn File

- Không xóa thẳng file cũ nếu chưa chắc chắn.
- File cũ, thử nghiệm hoặc không còn dùng nên chuyển vào thư mục `archive/`.
- File xương sống phải có vai trò riêng, không trùng lặp nội dung điều phối với file khác.

## Mốc xương sống hiện hành 2026-07-14

Các file điều phối chính:

- `roadmap.md`: thứ tự phát triển, trạng thái Phase 1/Phase 2 và backlog.
- `phase-2-roadmap.md`: chi tiết các hạng mục Phase 2.
- `handoff.md`: trạng thái môi trường, dữ liệu và bàn giao gần nhất.
- `database.md`: thiết kế DB đang dùng và nguyên tắc nguồn dữ liệu.
- `parser-ma-can-ho.md`: quy tắc parser mã căn hộ; chỉ một parser chính.
- `module-map.md`: bản đồ phân khu code, khu vực archive và tránh trùng lặp.
- `deploy-vps-step-by-step.md`: runbook deploy duy nhất lên VPS.
- `nghiep-vu-he-thong.md`: mô tả nghiệp vụ để người mới tiếp nhận hiểu hệ thống.

Nguyên tắc: tài liệu xương sống ghi quyết định hiện hành; báo cáo phân tích để trong `docs/reports/` chỉ dùng tham khảo, không thay thế roadmap/handoff/database.
