# Báo cáo dữ liệu thật

## Vai trò

Thư mục này gom các báo cáo đối soát/audit dữ liệu thật để giảm rác ở gốc `docs/`.

Các file ở đây là tài liệu lịch sử hoặc dữ liệu kiểm chứng rule. File điều phối cấp cao vẫn nằm ở gốc `docs/`:

- [../README.md](../README.md)
- [../roadmap.md](../roadmap.md)
- [../checklist-trien-khai-va-nghiem-thu.md](../checklist-trien-khai-va-nghiem-thu.md)
- [../handoff.md](../handoff.md)

## Danh sách báo cáo

| File | Vai trò |
| --- | --- |
| [de-xuat-mo-hinh-db-va-tinh-huong-cu-dan.md](de-xuat-mo-hinh-db-va-tinh-huong-cu-dan.md) | Đề xuất mô hình DB sau khi rà soát 934 căn và 24 tình huống cư dân |
| [bao-cao-ra-soat-934-can-ho-db.md](bao-cao-ra-soat-934-can-ho-db.md) | Báo cáo rà soát bảng `can_ho` hiện tại trong DB |
| [danh-gia-danh-sach-can-ho-master.md](danh-gia-danh-sach-can-ho-master.md) | Đánh giá file `Danh_Sach_Can_Ho_Master.xlsx`, xác nhận `934/934` mã căn |
| [bao-cao-audit-lien-he-can-ho.md](bao-cao-audit-lien-he-can-ho.md) | Audit dữ liệu liên hệ/cư dân từ file quản lý cũ |
| [bao-cao-cu-dan-bi-double.md](bao-cao-cu-dan-bi-double.md) | Báo cáo cư dân đang gắn nhiều căn trong dữ liệu V1 |
| [bao-cao-loc-giao-dich-1500000-thang-5-2026.md](bao-cao-loc-giao-dich-1500000-thang-5-2026.md) | Báo cáo lọc giao dịch `1.500.000` tháng 5/2026 |
| [bao-cao-phan-tich-sao-ke-6-thang-parser.md](bao-cao-phan-tich-sao-ke-6-thang-parser.md) | Phân tích 6 file sao kê 12/2025-5/2026, nâng parser mã căn và sinh report đối chiếu |
| [bao-cao-doi-soat-theo-doi-sao-ke-t1-t5-2026.md](bao-cao-doi-soat-theo-doi-sao-ke-t1-t5-2026.md) | Tổng hợp đối soát file theo dõi thu phí với sao kê T1-T5/2026 |
| [bao-cao-phan-loai-giao-dich-can-nhap-tay-t1-t5-2026.md](bao-cao-phan-loai-giao-dich-can-nhap-tay-t1-t5-2026.md) | Phân loại 173 giao dịch còn cần nhập tay/bằng chứng sau khi nâng parser |
| [T5-2026-lich-su-giao-dich-T5-26--doi-soat-theo-doi.xlsx](T5-2026-lich-su-giao-dich-T5-26--doi-soat-theo-doi.xlsx) | Report đối soát sao kê T5 với file `Theo dõi thu phí T5.xlsx` |
| [T5-2026-lich-su-giao-dich-T5-26--doi-soat-theo-doi-summary.json](T5-2026-lich-su-giao-dich-T5-26--doi-soat-theo-doi-summary.json) | Summary đối soát T5 sinh từ `npm run report:reconcile:fee-bank` |
| [bao-cao-can-ho-1500000-thang-5-chua-nhap.md](bao-cao-can-ho-1500000-thang-5-chua-nhap.md) | Đối chiếu căn đã đóng `1.500.000` nhưng chưa nhập T5 |
| [desktop-asng7jb-overview.md](desktop-asng7jb-overview.md) | Scan tổng quan ổ tài liệu vận hành cũ |

## File dữ liệu đi kèm

| File | Đi kèm báo cáo |
| --- | --- |
| [ra-soat-934-can-ho-db.csv](ra-soat-934-can-ho-db.csv) | Đánh giá từng dòng của 934 căn trong DB |
| [loc-giao-dich-1500000-thang-5-2026.csv](loc-giao-dich-1500000-thang-5-2026.csv) | Chi tiết báo cáo lọc giao dịch `1.500.000` tháng 5/2026 |
| [can-ho-1500000-thang-5-chua-nhap.csv](can-ho-1500000-thang-5-chua-nhap.csv) | Chi tiết căn đã đóng `1.500.000` nhưng chưa nhập T5 |
| [T5-2026-lich-su-giao-dich-T5-26--doi-soat-theo-doi-can-xu-ly.csv](T5-2026-lich-su-giao-dich-T5-26--doi-soat-theo-doi-can-xu-ly.csv) | Danh sách căn sai khớp/cần xử lý sau đối soát T5 |
| [phan-tich-giao-dich-can-nhap-tay-t1-t5-2026.xlsx](phan-tich-giao-dich-can-nhap-tay-t1-t5-2026.xlsx) | Excel phân loại giao dịch cần nhập tay/bằng chứng T1-T5 |
| [phan-tich-giao-dich-can-nhap-tay-t1-t5-2026.csv](phan-tich-giao-dich-can-nhap-tay-t1-t5-2026.csv) | CSV chi tiết giao dịch cần nhập tay/bằng chứng T1-T5 |

## Quy tắc

- Báo cáo đã chốt hoặc báo cáo lịch sử để trong thư mục này.
- Rule đang dùng để vận hành không đặt ở đây; đặt ở gốc `docs/`.
- Nếu báo cáo sinh ra từ script, ghi rõ script và input trong file báo cáo.
