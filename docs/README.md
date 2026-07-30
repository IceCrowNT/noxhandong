# Tài liệu dự án

Thư mục `docs/` là nguồn tài liệu cấp cao của project. Cập nhật gần nhất: 2026-07-28, theo trạng thái source hiện có trong workspace, bao gồm cả các thay đổi chưa commit.

## Tài Liệu Xương Sống

| File | Vai trò |
| --- | --- |
| [handoff.md](handoff.md) | Trạng thái bàn giao hiện hành, môi trường, dữ liệu thật, điểm cần chú ý khi tiếp nhận |
| [roadmap.md](roadmap.md) | Điều phối tiến độ: mục tiêu, phần đã xong, backlog gần |
| [nghiep-vu-he-thong.md](nghiep-vu-he-thong.md) | Mô tả nghiệp vụ tổng quan, người dùng, luồng dữ liệu và giới hạn an toàn |
| [database.md](database.md) | Mô hình dữ liệu hiện hành, bảng trung tâm và nguyên tắc ghi/đọc dữ liệu |
| [module-map.md](module-map.md) | Bản đồ route/module/source và quy tắc đặt code mới |
| [design-system.md](design-system.md) | Quy tắc UI/UX public/admin, component pattern và các quyết định thiết kế |
| [parser-ma-can-ho.md](parser-ma-can-ho.md) | Rule parser mã căn và backlog test case |

## Tài Liệu Vận Hành

| File | Vai trò |
| --- | --- |
| [setup-may-moi-va-database.md](setup-may-moi-va-database.md) | Dựng môi trường dev và database trên máy mới |
| [deploy-vps-step-by-step.md](deploy-vps-step-by-step.md) | Runbook deploy VPS |
| [production-deploy-vps.md](production-deploy-vps.md) | Ghi chú hạ tầng production |
| [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md) | Checklist nghiệm thu tính năng |
| [checklist-duyet-truoc-deploy.md](checklist-duyet-truoc-deploy.md) | Checklist dừng tay trước deploy |

## Tài Liệu Nghiệp Vụ Chuyên Biệt

- [resident-import-rules.vi.md](resident-import-rules.vi.md): quy tắc lọc dữ liệu cư dân.
- [filter-rules.vi.md](filter-rules.vi.md): quy tắc lọc rác sao kê.
- [doi-soat-sao-ke-va-bang-chung.md](doi-soat-sao-ke-va-bang-chung.md): quy trình đối soát sao kê và bằng chứng.
- [backlog-doi-soat-sao-ke.md](backlog-doi-soat-sao-ke.md): backlog riêng cho đối soát sao kê.
- [task-bo-sung-giao-dich-qua-khu.md](task-bo-sung-giao-dich-qua-khu.md): nghiệp vụ bổ sung giao dịch quá khứ.
- [task-developer-hidden-feature-flags.md](task-developer-hidden-feature-flags.md): quản lý tính năng đang phát triển.

## Báo Cáo Và Dữ Liệu Kiểm Chứng

- `docs/reports/`: báo cáo dữ liệu thật, file đối soát, parser summary.
- `docs/preview-*`: output preview từ script import/review.
- `docs/resources/`: file sao kê mẫu và tài nguyên kiểm chứng.

## Quy Tắc Duy Trì Tài Liệu

- File xương sống phải phản ánh source hiện tại, không chỉ lịch sử chat.
- Khi thay đổi route, schema, luồng import/public, hoặc UI public/admin đáng kể, cập nhật ít nhất `handoff.md`, `module-map.md` và file nghiệp vụ liên quan.
- Báo cáo lịch sử để trong `docs/reports/`; không trộn vào roadmap.
- Không xóa tài liệu cũ nếu chưa chắc; chuyển vào `archive/` kèm README khi cần.
