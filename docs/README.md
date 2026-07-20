# Tài liệu dự án

Thư mục `docs/` là nguồn tài liệu cấp cao của dự án. Khi mở project, vui lòng đọc các tài liệu tại đây để nắm bắt kiến trúc và luồng nghiệp vụ thay vì phải lục tìm trong lịch sử chat.

## Tài Liệu Xương Sống

| File | Vai trò |
| --- | --- |
| [handoff.md](handoff.md) | Trạng thái bàn giao hiện hành, dữ liệu thật và tài khoản thử nghiệm |
| [roadmap.md](roadmap.md) | Bảng điều phối tiến độ: mục tiêu hiện tại, các task đang làm và backlog |
| [database.md](database.md) | Thiết kế cơ sở dữ liệu hiện hành và nguyên tắc chuẩn hóa dữ liệu |
| [parser-ma-can-ho.md](parser-ma-can-ho.md) | Tài liệu trung tâm cho bộ parse mã căn (rules, test cases, backlog) |
| [module-map.md](module-map.md) | Cấu trúc thư mục source code và ranh giới các module |
| [nghiep-vu-he-thong.md](nghiep-vu-he-thong.md) | Mô tả nghiệp vụ tổng quan để bàn giao cho người mới |

## Tài Liệu Triển Khai & Kiểm Thử

| File | Vai trò |
| --- | --- |
| [deploy-vps-step-by-step.md](deploy-vps-step-by-step.md) | Sổ tay (Runbook) duy nhất hướng dẫn quy trình deploy lên VPS production |
| [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md) | Cổng nghiệm thu chi tiết (review/check/test) cho các tính năng |
| [checklist-duyet-truoc-deploy.md](checklist-duyet-truoc-deploy.md) | Checklist dừng thủ công để duyệt an toàn trước khi đẩy code lên production |
| [production-deploy-vps.md](production-deploy-vps.md) | Tổng hợp các quyết định hạ tầng VPS (tham khảo, không dùng làm runbook) |
| [setup-may-moi-va-database.md](setup-may-moi-va-database.md) | Hướng dẫn thiết lập môi trường cho máy tính lập trình viên mới |

## Tài Liệu Thiết Kế (UI)

| File | Vai trò |
| --- | --- |
| [design-system.md](design-system.md) | Global design system và patterns cho giao diện Mobile-first (Public & Admin) |

## Nhóm Nghiệp Vụ Chuyên Biệt

Các văn bản mô tả logic và thuật toán xử lý đặc thù:
- [resident-import-rules.vi.md](resident-import-rules.vi.md) (Quy tắc lọc dữ liệu cư dân)
- [filter-rules.vi.md](filter-rules.vi.md) (Quy tắc lọc rác sao kê)
- [doi-soat-sao-ke-va-bang-chung.md](doi-soat-sao-ke-va-bang-chung.md) (Quy trình đối soát)
- [backlog-doi-soat-sao-ke.md](backlog-doi-soat-sao-ke.md) (Backlog tác vụ đối soát)
- [task-developer-hidden-feature-flags.md](task-developer-hidden-feature-flags.md) (Quản lý các tính năng đang phát triển)

## Ghi Chú Dọn Dẹp

- Không xóa thẳng file cũ nếu chưa chắc chắn.
- Các file tài liệu cũ, nháp, thiết kế tính năng đã hoàn thiện hoặc không còn sử dụng đã được chuyển vào thư mục `archive/` để giữ thư mục `docs/` luôn sạch sẽ.
- File xương sống phải có vai trò riêng biệt, tuyệt đối không lặp lại nội dung điều phối của nhau.
