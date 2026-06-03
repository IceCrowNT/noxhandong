# Báo Cáo Đối Soát Theo Dõi Thu Phí Và Sao Kê T1-T5/2026

Ngày lập: 2026-05-26

## Phạm Vi

Đối soát file `docs/Theo dõi thu phí T5.xlsx`, sheet `Lịch sử đóng phí`, với các file sao kê trong `docs/resources/`:

- `lich-su-giao-dich T1.xls`
- `lich-su-giao-dich T2.xls`
- `lich-su-giao-dich T3.xls`
- `lich-su-giao-dich T4.xls`
- `lich-su-giao-dich T5(26).xls`

Mỗi tháng dùng đúng cột tương ứng trong file theo dõi: `T1`, `T2`, `T3`, `T4`, `T5`.

Lưu ý: đây là đối soát với file theo dõi hiện tại `Theo dõi thu phí T5.xlsx`, không phải snapshot lịch sử tại thời điểm cuối từng tháng. Nếu file theo dõi đã được sửa bổ sung sau đó, kết quả phản ánh trạng thái hiện tại của workbook.

## Nguyên Tắc

- Chỉ xét dòng sao kê thu.
- Dòng chi bị bỏ qua khỏi đối soát cư dân.
- Parser mã căn chỉ dùng thuật toán chung tại `src/modules/transactions/parser/apartment-parser.ts`.
- Giao dịch một căn được phân bổ toàn bộ vào căn parser nhận diện.
- Giao dịch nhiều căn chỉ tự phân bổ nếu tổng tiền các căn ứng viên trong file theo dõi đúng bằng số tiền sao kê.
- Giao dịch Zalo/không rõ căn/thiếu lô/thiếu căn/sai mã được đưa vào nhóm cần nhập tay hoặc cần bằng chứng.

## Tổng Hợp T1-T5

| Kỳ | Dòng thu sao kê | Tiền file theo dõi | Tiền sao kê phân bổ được | Căn khớp | Căn cần xử lý | Giao dịch cần bằng chứng/nhập tay | Nhiều căn tự phân bổ | Nhiều căn chưa phân bổ | Không nhận diện căn |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| T1-2026 | 254 | 255.650.000 | 205.450.000 | 211 | 62 | 46 | 7 | 3 | 43 |
| T2-2026 | 177 | 148.913.730 | 131.650.000 | 157 | 36 | 31 | 5 | 2 | 29 |
| T3-2026 | 210 | 184.150.000 | 152.469.006 | 171 | 33 | 34 | 3 | 0 | 34 |
| T4-2026 | 187 | 166.086.270 | 142.830.000 | 180 | 23 | 20 | 5 | 2 | 18 |
| T5-2026 | 339 | 344.350.000 | 340.400.000 | 265 | 87 | 43 | 3 | 3 | 40 |
| Tổng | 1.167 | 1.099.150.000 | 972.799.006 | 984 | 241 | 174 | 23 | 10 | 164 |

## Nhận Định

### 1. T5 có dữ liệu lớn nhất và sai khớp nhiều nhất

T5 có `339` dòng thu và `87` căn cần xử lý. Đây là tháng nên ưu tiên kiểm bằng mắt trước vì số lượng giao dịch cao nhất.

### 2. T3 là tháng sạch nhất về giao dịch nhiều căn

T3 có `0` giao dịch nhiều căn chưa phân bổ được. Các giao dịch nhiều căn phát hiện trong T3 đều đã tự phân bổ được theo file theo dõi.

### 3. Các giao dịch không nhận diện căn vẫn là điểm nghẽn chính

T1-T5 còn `164` giao dịch không nhận diện căn sau khi đã bổ sung thêm một số rule parser an toàn. Nhóm này nhiều khả năng bao gồm:

- chuyển khoản qua Zalo
- nội dung chỉ có tên cư dân
- thiếu lô
- thiếu số căn
- ghi sai mã căn
- chuyển khoản hộ nhiều căn nhưng không ghi đủ căn

Nhóm này không nên tự suy đoán quá mạnh. Cần luồng nhập tay và lưu bằng chứng.

### 4. Đã có nền tảng xử lý giao dịch một đơn nhiều căn

T1-T5 có `23` giao dịch nhiều căn đã tự phân bổ được bằng cách đối chiếu tổng tiền với file theo dõi. Còn `10` giao dịch nhiều căn chưa phân bổ được, cần review.

### 5. Sau nâng parser ngày 2026-05-27

Đã bổ sung các rule hẹp cho mẫu có căn rõ trong nội dung:

- `L4C sonha303`
- `303 Lo L4B`
- `L4B 110chuyen`

Kết quả:

- giao dịch cần bằng chứng/nhập tay giảm từ `181` xuống `174`.
- tiền sao kê phân bổ được tăng từ `965.549.006` lên `972.799.006`.
- số lượt căn khớp tăng từ `978` lên `984`.

Rule `L 111B -> L1.111B` đã bị loại bỏ theo duyệt nghiệp vụ: không tự suy luận thêm số lô từ một mã thiếu lô rõ ràng.

Report phân loại nhóm cần nhập tay:

- [phan-tich-giao-dich-can-nhap-tay-t1-t5-2026.xlsx](phan-tich-giao-dich-can-nhap-tay-t1-t5-2026.xlsx)
- [phan-tich-giao-dich-can-nhap-tay-t1-t5-2026.json](phan-tich-giao-dich-can-nhap-tay-t1-t5-2026.json)
- [phan-tich-giao-dich-can-nhap-tay-t1-t5-2026.csv](phan-tich-giao-dich-can-nhap-tay-t1-t5-2026.csv)

## File Report Đã Sinh

| Kỳ | Excel đối soát | Summary | CSV cần xử lý |
| --- | --- | --- | --- |
| T1-2026 | [T1-2026-lich-su-giao-dich-T1-doi-soat-theo-doi.xlsx](T1-2026-lich-su-giao-dich-T1-doi-soat-theo-doi.xlsx) | [summary](T1-2026-lich-su-giao-dich-T1-doi-soat-theo-doi-summary.json) | [CSV](T1-2026-lich-su-giao-dich-T1-doi-soat-theo-doi-can-xu-ly.csv) |
| T2-2026 | [T2-2026-lich-su-giao-dich-T2-doi-soat-theo-doi.xlsx](T2-2026-lich-su-giao-dich-T2-doi-soat-theo-doi.xlsx) | [summary](T2-2026-lich-su-giao-dich-T2-doi-soat-theo-doi-summary.json) | [CSV](T2-2026-lich-su-giao-dich-T2-doi-soat-theo-doi-can-xu-ly.csv) |
| T3-2026 | [T3-2026-lich-su-giao-dich-T3-doi-soat-theo-doi.xlsx](T3-2026-lich-su-giao-dich-T3-doi-soat-theo-doi.xlsx) | [summary](T3-2026-lich-su-giao-dich-T3-doi-soat-theo-doi-summary.json) | [CSV](T3-2026-lich-su-giao-dich-T3-doi-soat-theo-doi-can-xu-ly.csv) |
| T4-2026 | [T4-2026-lich-su-giao-dich-T4-doi-soat-theo-doi.xlsx](T4-2026-lich-su-giao-dich-T4-doi-soat-theo-doi.xlsx) | [summary](T4-2026-lich-su-giao-dich-T4-doi-soat-theo-doi-summary.json) | [CSV](T4-2026-lich-su-giao-dich-T4-doi-soat-theo-doi-can-xu-ly.csv) |
| T5-2026 | [T5-2026-lich-su-giao-dich-T5-26--doi-soat-theo-doi.xlsx](T5-2026-lich-su-giao-dich-T5-26--doi-soat-theo-doi.xlsx) | [summary](T5-2026-lich-su-giao-dich-T5-26--doi-soat-theo-doi-summary.json) | [CSV](T5-2026-lich-su-giao-dich-T5-26--doi-soat-theo-doi-can-xu-ly.csv) |

## Bước Tiếp Theo Đề Xuất

1. Chủ dự án mở từng file Excel, ưu tiên sheet `Can xu ly` và `Bang chung nhap tay`.
2. Lấy mẫu 20-30 giao dịch `CAN_NHAP_TAY` để phân loại:
   - Zalo
   - thiếu lô
   - thiếu căn
   - chỉ có tên cư dân
   - sai mã căn
3. Chốt schema/chức năng lưu bằng chứng.
4. Sau khi có luồng nhập tay, mới đưa đối soát này vào web admin.
