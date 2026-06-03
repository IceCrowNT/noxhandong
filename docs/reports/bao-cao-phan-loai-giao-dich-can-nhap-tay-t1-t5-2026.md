# Báo Cáo Phân Loại Giao Dịch Cần Nhập Tay T1-T5/2026

Ngày lập: 2026-05-27

## Mục Tiêu

Phân tích nhóm giao dịch chưa thể tự đối soát sau khi chạy report đối soát T1-T5/2026. Mục tiêu là tách rõ:

- nhóm có thể tiếp tục nâng parser;
- nhóm bắt buộc nhập tay;
- nhóm cần ảnh Zalo/chứng từ cư dân;
- nhóm nên lọc khỏi đối soát cư dân.

## Input

Các file report đối soát:

- `T1-2026-lich-su-giao-dich-T1-doi-soat-theo-doi.xlsx`
- `T2-2026-lich-su-giao-dich-T2-doi-soat-theo-doi.xlsx`
- `T3-2026-lich-su-giao-dich-T3-doi-soat-theo-doi.xlsx`
- `T4-2026-lich-su-giao-dich-T4-doi-soat-theo-doi.xlsx`
- `T5-2026-lich-su-giao-dich-T5-26--doi-soat-theo-doi.xlsx`

Sheet đọc:

- `Bang chung nhap tay`

Script:

```bash
npm run report:reconcile:manual-evidence
```

## Kết Quả Tổng Hợp

Tổng giao dịch còn cần nhập tay/bằng chứng sau khi đã nâng parser: `174`.

| Nhóm xử lý | Số dòng | Nhận định |
| --- | ---: | --- |
| `KHONG_RO_CAN` | 73 | Không đủ tín hiệu căn hộ trong nội dung; không nên tự đoán |
| `ZALO_CAN_BANG_CHUNG` | 54 | Chuyển khoản qua Zalo; cần nhập tay và lưu ảnh/chứng từ |
| `TEN_NGUOI_CHUYEN_CHUNG_CHUNG` | 15 | Chỉ có tên/ngữ cảnh chuyển tiền chung; cần đối chiếu contact hoặc hỏi cư dân |
| `CO_MAU_CAN_CAN_XEM_LAI` | 15 | Có vẻ có mã căn nhưng chưa đủ điều kiện tự phân bổ; cần kiểm bằng mắt trước khi thêm rule |
| `NHIEU_CAN_LECH_TIEN` | 10 | Parser thấy nhiều căn nhưng tổng tiền theo file theo dõi không khớp sao kê |
| `NOI_BO_TRA_LAI` | 5 | Giao dịch nội bộ/trả lãi tài khoản; nên lọc khỏi nhóm cư dân |
| `TIEN_NHO_NOI_BO_KHAC` | 2 | Số tiền nhỏ, khả năng không phải phí cư dân |

## Theo Tháng

| Kỳ | Zalo | Không rõ căn | Tên chung chung | Có mẫu căn cần xem | Nhiều căn lệch tiền | Nội bộ/trả lãi | Tiền nhỏ |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| T1-2026 | 11 | 23 | 3 | 5 | 3 | 1 | 0 |
| T2-2026 | 6 | 14 | 5 | 1 | 2 | 2 | 1 |
| T3-2026 | 10 | 15 | 3 | 4 | 0 | 1 | 0 |
| T4-2026 | 10 | 4 | 1 | 2 | 2 | 1 | 0 |
| T5-2026 | 17 | 16 | 3 | 3 | 3 | 0 | 1 |

## Đã Nâng Parser Trong Lần Này

Đã thêm rule hẹp cho các mẫu có mã căn rõ ràng:

- `L4C_sonha303`
- `303- Lo L4B`
- `lo 4 b 406 b`
- `L4B-110chuyen`

Kết quả sau khi chạy lại report:

- giao dịch cần nhập tay/bằng chứng giảm từ `181` xuống `174`.
- tiền sao kê phân bổ được tăng từ `965.549.006` lên `972.799.006`.
- số lượt căn khớp tăng từ `978` lên `984`.

Rule `L 111B -> L1.111B` không được giữ lại, vì nội dung thiếu lô rõ ràng và không được tự thêm/suy luận số lô.

## Không Nên Tự Động Parse Tiếp Các Nhóm Sau

### Zalo

Nội dung thường là:

- `chuyen khoan nhanh qua Zalo`
- chỉ có tên hiển thị trên Zalo
- không có căn hộ

Không có đủ dữ liệu để tự xác định căn. Cần nhập tay và lưu bằng chứng.

### Chỉ Có Tên Người Chuyển

Có thể đối chiếu contact trong tương lai, nhưng không nên tự gán vì:

- một người có thể liên quan nhiều căn;
- chủ cũ/chủ mới/khách thuê có thể thay đổi;
- tên ngân hàng không chắc trùng tên cư dân trong Excel.

### Nhiều Căn Lệch Tiền

Không được tự phân bổ nếu tổng tiền theo file theo dõi không bằng số tiền sao kê. Cần admin kiểm tra.

## Đề Xuất Tiếp Theo

1. Thêm chức năng admin `Đối soát sao kê`.
2. Có danh sách giao dịch `CAN_NHAP_TAY`, lọc theo nhóm trên.
3. Cho admin chọn căn, nhập ghi chú, upload ảnh Zalo/chứng từ.
4. Sau khi xác nhận, lưu vào bảng bằng chứng.
5. Giao dịch đã xác nhận thủ công mới được dùng để hỗ trợ kiểm toán hoặc hiển thị trong dashboard nội bộ.

## Output

- [phan-tich-giao-dich-can-nhap-tay-t1-t5-2026.xlsx](phan-tich-giao-dich-can-nhap-tay-t1-t5-2026.xlsx)
- [phan-tich-giao-dich-can-nhap-tay-t1-t5-2026.json](phan-tich-giao-dich-can-nhap-tay-t1-t5-2026.json)
- [phan-tich-giao-dich-can-nhap-tay-t1-t5-2026.csv](phan-tich-giao-dich-can-nhap-tay-t1-t5-2026.csv)
