# Tài liệu dự án

## Entry points

- Project README: [../README.md](../README.md)
- Handoff hiện tại: [handoff.md](handoff.md)
- Roadmap control: [roadmap.md](roadmap.md)
- Checklist nghiệm thu: [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md)
- Checklist duyệt trước deploy: [checklist-duyet-truoc-deploy.md](checklist-duyet-truoc-deploy.md)
- Database V2: [database-v2.md](database-v2.md)
- Parser mã căn: [parser-ma-can-ho.md](parser-ma-can-ho.md)
- Design system: [design-system.md](design-system.md)
- Production VPS: [production-deploy-vps.md](production-deploy-vps.md)
- Runbook deploy VPS: [deploy-vps-step-by-step.md](deploy-vps-step-by-step.md)
- Todo đồng thuận kỹ thuật: [todolist-dong-thuan-antigravity-codex.md](todolist-dong-thuan-antigravity-codex.md)
- Backlog đối soát sao kê: [backlog-doi-soat-sao-ke.md](backlog-doi-soat-sao-ke.md)

## Mục đích

Thư mục `docs/` là nơi lưu tài liệu cấp cao nhất của dự án. Đây là nguồn chính để nắm:

- mục tiêu sản phẩm
- trạng thái bàn giao
- thiết kế database
- rule nghiệp vụ
- checklist triển khai
- báo cáo dữ liệu thật
- roadmap phát triển

Không nên dựa vào lịch sử chat làm nguồn sự thật chính.

## Tài liệu đọc đầu tiên

1. [handoff.md](handoff.md)
2. [roadmap.md](roadmap.md)
3. [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md)
4. [checklist-duyet-truoc-deploy.md](checklist-duyet-truoc-deploy.md)
5. [database-v2.md](database-v2.md)
6. [parser-ma-can-ho.md](parser-ma-can-ho.md)
7. [design-system.md](design-system.md)
8. [resident-import-rules.vi.md](resident-import-rules.vi.md)
9. [setup-may-moi-va-database.md](setup-may-moi-va-database.md)
10. [module-map.md](module-map.md)
11. [production-deploy-vps.md](production-deploy-vps.md)
12. [deploy-vps-step-by-step.md](deploy-vps-step-by-step.md)
13. [todolist-dong-thuan-antigravity-codex.md](todolist-dong-thuan-antigravity-codex.md)
14. [backlog-doi-soat-sao-ke.md](backlog-doi-soat-sao-ke.md)

## Nhóm tài liệu xương sống

| File | Vai trò |
| --- | --- |
| [handoff.md](handoff.md) | Trạng thái bàn giao hiện tại, việc đã xong, việc đang mở |
| [roadmap.md](roadmap.md) | Bảng điều phối cấp cao: mục tiêu, trạng thái task, task tiếp theo, quyết định lớn |
| [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md) | Cổng nghiệm thu chi tiết: review/check/test/confirm cho từng task |
| [checklist-duyet-truoc-deploy.md](checklist-duyet-truoc-deploy.md) | Cổng dừng thủ công trước Task N, chủ dự án duyệt UI/mobile/dữ liệu/production readiness |
| [database-v2.md](database-v2.md) | Thiết kế database mới nhất theo hướng căn hộ/contact-centric |
| [database-v1.md](database-v1.md) | Thiết kế DB nền ban đầu, giữ để đối chiếu lịch sử |
| [parser-ma-can-ho.md](parser-ma-can-ho.md) | Tài liệu trung tâm cho parser mã căn: nguồn case, rule, backlog test, bảo trì |
| [design-system.md](design-system.md) | Global design/pattern lấy từ Stitch, đã chỉnh theo nghiệp vụ BQT An Đồng |
| [module-map.md](module-map.md) | Quy ước đặt code trong `src/modules/` |
| [setup-may-moi-va-database.md](setup-may-moi-va-database.md) | Hướng dẫn dựng môi trường và database |
| [stitch-mobile-ui-prompt.md](stitch-mobile-ui-prompt.md) | Prompt thiết kế mobile-first trên Stitch |
| [production-deploy-vps.md](production-deploy-vps.md) | Quyết định và checklist production khi deploy trên VPS |
| [deploy-vps-step-by-step.md](deploy-vps-step-by-step.md) | Runbook thao tác deploy MVP lên VPS: DNS, PostgreSQL, PM2, Caddy, backup |
| [todolist-dong-thuan-antigravity-codex.md](todolist-dong-thuan-antigravity-codex.md) | Todo list đã đồng thuận giữa Antigravity/Codex cho Task N và backlog đối soát sao kê |
| [backlog-doi-soat-sao-ke.md](backlog-doi-soat-sao-ke.md) | Backlog Phase 2 cho import/đối soát sao kê, gồm ý tưởng card giao dịch gần nhất theo căn hộ |

## Nhóm nghiệp vụ import và contact

| File | Vai trò |
| --- | --- |
| [resident-import-rules.vi.md](resident-import-rules.vi.md) | Rule tách dữ liệu cư dân/liên hệ từ Excel |
| [filter-rules.vi.md](filter-rules.vi.md) | Rule lọc giao dịch sao kê không liên quan căn hộ |
| [parser-ma-can-ho.md](parser-ma-can-ho.md) | Rule, backlog test và phương án bảo trì parser mã căn hộ |
| [kiem-tra-ket-qua-parse-lien-he-can-ho.md](kiem-tra-ket-qua-parse-lien-he-can-ho.md) | Cách kiểm tra kết quả parse contact |
| [preview-lien-he-can-ho/README.md](preview-lien-he-can-ho/README.md) | Mô tả preview contact từ file quản lý cũ |
| [preview-master-lien-he-can-ho/README.md](preview-master-lien-he-can-ho/README.md) | Mô tả preview contact từ file master mới |
| [preview-theo-doi-thu-phi/README.md](preview-theo-doi-thu-phi/README.md) | Preview import file theo dõi thu phí T4 |

## Nhóm báo cáo đối soát dữ liệu thật

| File | Vai trò |
| --- | --- |
| [reports/README.md](reports/README.md) | Mục lục báo cáo dữ liệu thật |
| [reports/de-xuat-mo-hinh-db-va-tinh-huong-cu-dan.md](reports/de-xuat-mo-hinh-db-va-tinh-huong-cu-dan.md) | Đề xuất mô hình DB theo dữ liệu 934 căn và các tình huống cư dân cần xử lý |
| [reports/bao-cao-ra-soat-934-can-ho-db.md](reports/bao-cao-ra-soat-934-can-ho-db.md) | Rà soát dữ liệu `can_ho` trong DB hiện tại |
| [reports/ra-soat-934-can-ho-db.csv](reports/ra-soat-934-can-ho-db.csv) | CSV đánh giá từng dòng của 934 căn hộ |
| [reports/danh-gia-danh-sach-can-ho-master.md](reports/danh-gia-danh-sach-can-ho-master.md) | Đánh giá file `Danh_Sach_Can_Ho_Master.xlsx` |
| [reports/bao-cao-audit-lien-he-can-ho.md](reports/bao-cao-audit-lien-he-can-ho.md) | Audit dữ liệu liên hệ từ file quản lý cũ |
| [reports/bao-cao-cu-dan-bi-double.md](reports/bao-cao-cu-dan-bi-double.md) | Báo cáo cư dân đang gắn nhiều căn trong dữ liệu V1 |
| [reports/bao-cao-loc-giao-dich-1500000-thang-5-2026.md](reports/bao-cao-loc-giao-dich-1500000-thang-5-2026.md) | Báo cáo lọc giao dịch 1.500.000 tháng 5/2026 |
| [reports/bao-cao-can-ho-1500000-thang-5-chua-nhap.md](reports/bao-cao-can-ho-1500000-thang-5-chua-nhap.md) | Đối chiếu căn đã đóng 1.500.000 nhưng chưa nhập T5 |
| [reports/desktop-asng7jb-overview.md](reports/desktop-asng7jb-overview.md) | Scan tổng quan ổ tài liệu vận hành cũ |

## File dữ liệu đi kèm

Các file Excel/CSV trong `docs/` là dữ liệu mẫu hoặc kết quả preview để kiểm chứng rule:

- `Danh_Sach_Can_Ho_Master.xlsx`
- `Theo dõi thu phí T5.xlsx`
- `lich-su-giao-dich(...).xls`
- các file CSV trong `preview-lien-he-can-ho/`
- các file CSV trong `preview-master-lien-he-can-ho/`
- các file CSV báo cáo giao dịch 1.500.000 tháng 5/2026

## Quy tắc cập nhật tài liệu

Khi chốt thay đổi lớn, cần cập nhật ít nhất:

- `handoff.md`
- `roadmap.md`
- `checklist-trien-khai-va-nghiem-thu.md`

Khi thay đổi database:

- cập nhật `database-v2.md`
- cập nhật `prisma/schema-v2.prisma`

Khi thay đổi rule nghiệp vụ:

- cập nhật tài liệu rule tương ứng trong `docs/`
- sinh lại báo cáo/preview nếu rule ảnh hưởng dữ liệu thật

Khi thay đổi UI/UX:

- cập nhật [design-system.md](design-system.md)
- cập nhật [handoff.md](handoff.md)
- nếu ảnh hưởng nghiệm thu mobile/desktop, cập nhật [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md)
