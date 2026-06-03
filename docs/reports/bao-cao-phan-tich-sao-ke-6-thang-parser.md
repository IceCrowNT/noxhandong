# Báo cáo phân tích parser sao kê 6 tháng

Ngày tạo: 2026-05-26

## Mục tiêu

Đọc 6 file sao kê ngân hàng từ tháng 12/2025 đến tháng 5/2026, chỉ phân tích các dòng thanh toán thu bằng parser mã căn hiện tại và nâng cấp thuật toán theo dữ liệu thật.

Quyết định kỹ thuật quan trọng: toàn project chỉ còn một file chứa thuật toán parser mã căn:

- `src/modules/transactions/parser/apartment-parser.ts`

Các script sao kê không còn copy rule parser riêng. Chúng chỉ gọi parser chuẩn qua:

- `scripts/import-bank-statement-v2.ts`
- `scripts/report-bank-statement-parser-v2.ts`

Hai file `.cjs` tương ứng chỉ còn là wrapper để chạy TypeScript bằng `tsx`.

## File đã đọc

| File | Dòng thô | Dòng thanh toán thu | Dòng thanh toán chi đã bỏ qua | Ghi chú cấu trúc |
| --- | ---: | ---: | ---: | --- |
| `docs/resources/lich-su-giao-dich T12_2025.xls` | 266 | 251 | 15 | VietinBank eFAST, sheet `LICH SU GIAO DICH`, header dòng 19 |
| `docs/resources/lich-su-giao-dich T1.xls` | 270 | 254 | 16 | Cùng cấu trúc |
| `docs/resources/lich-su-giao-dich T2.xls` | 194 | 177 | 17 | Cùng cấu trúc |
| `docs/resources/lich-su-giao-dich T3.xls` | 224 | 210 | 14 | Cùng cấu trúc |
| `docs/resources/lich-su-giao-dich T4.xls` | 208 | 187 | 21 | Cùng cấu trúc |
| `docs/resources/lich-su-giao-dich T5(26).xls` | 354 | 339 | 15 | Cùng cấu trúc |
| **Tổng** | **1.516** | **1.418** | **98** | 6 file |

Các cột chính đều có đủ:

- `Ngày hạch toán/Accounting date`
- `Mô tả giao dịch/Transaction description`
- `Nợ/Debit`
- `Có/Credit`
- `Số giao dịch/Transaction number`
- `Số tài khoản đối ứng/Corresponsive account`
- `Tên tài khoản đối ứng/Corresponsive name`
- `Ngày phát sinh giao dịch/Transaction date`

## Quy tắc mới: chỉ duyệt thanh toán thu

Từ 2026-05-26, phần parser/report/review sao kê chỉ xử lý dòng tiền vào (`Có/Credit > 0`).

Dòng thanh toán chi:

- không đưa vào sheet `Chi tiet parser`
- không đưa vào sheet `Can kiem tra`
- không tạo `giao_dich_ngan_hang`
- không tạo `duyet_giao_dich`
- trong sheet gốc `Sao ke co parser` chỉ được chú thích `Bỏ qua: thanh toán chi`

Lý do: nghiệp vụ hiện tại là đối soát cư dân đóng phí. Các khoản chi như lương, BHXH, điện nước, dịch vụ không cần admin duyệt trong luồng thu phí.

## Kết quả sau khi nâng parser

Parser version: `apartment-code-parser-v0.4-canonical`

| File | Dòng thu phân tích | Nhận diện đúng căn | Nhiều căn ứng viên | Mã căn không tồn tại | Không nhận diện | Dòng cần kiểm tra |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| T12/2025 | 251 | 224 | 4 | 0 | 23 | 102 |
| T1/2026 | 254 | 199 | 10 | 4 | 41 | 143 |
| T2/2026 | 177 | 140 | 8 | 1 | 28 | 92 |
| T3/2026 | 210 | 172 | 4 | 1 | 33 | 97 |
| T4/2026 | 187 | 162 | 6 | 0 | 19 | 68 |
| T5/2026 | 339 | 289 | 6 | 1 | 43 | 64 |
| **Tổng** | **1.418** | **1.186** | **38** | **7** | **187** | **566** |

Tỷ lệ nhận diện được đúng một căn hợp lệ trên nhóm thanh toán thu: khoảng `83,6%`.

Lưu ý: nhóm `Không nhận diện` không đồng nghĩa là lỗi parser. Nhiều dòng là:

- chuyển khoản qua Zalo chỉ có tên người chuyển, không có mã căn
- nội dung chỉ ghi số căn nhưng thiếu lô/tòa, ví dụ chỉ có `căn 415`
- giao dịch thu khác không liên quan trực tiếp đến căn hộ

## Cải thiện

Trước khi bỏ thanh toán chi khỏi nhóm cần review, report có:

- Tổng dòng giao dịch: 1.516
- Dòng cần kiểm tra: 663

Sau khi chỉ phân tích thanh toán thu:

- Dòng thanh toán thu được phân tích: 1.418
- Dòng thanh toán chi bỏ qua: 98
- Dòng cần kiểm tra: 566

Việc bỏ thanh toán chi giúp giảm 97 dòng khỏi danh sách cần review mà không làm mất nghiệp vụ thu phí cư dân.

## Rule mới đã thêm

Các mẫu từ sao kê thật đã được đưa vào golden test:

| Input rút gọn | Kết quả |
| --- | --- |
| `L3 P505 dong phi QL` | `L3.505` |
| `Toa nha L2 _ so can ho 211B` | `L2.211B` |
| `Toa L2. so can 208` | `L2.208` |
| `L2- P508-phi chung cu` | `L2.508` |
| `L 1 , 118 , nop phi QLVH` | `L1.118` |
| `Toa LA4 so 210` | `L4A.210` |
| `L4C 506 a tu thang 1 den thang 6` | `L4C.506A` |
| `117l4 b` | `L4B.117` |
| `can ho 530 l4 b` | `L4B.530` |
| `L3p509` | `L3.509` |

Nhóm rule mới:

- `P`/`PHONG` nằm giữa block và số phòng: `L3 P505`, `L3p509`
- `SO CAN`, `SO CAN HO`, `SO NHA` giữa block và phòng
- chữ `L` bị tách khỏi số block: `L 1 118`
- block suffix bị tách: `117 l4 b`, `530 l4 b`
- typo `LA4` được hiểu là `L4A` khi có số phòng rõ ràng
- suffix phòng bị tách: `L4C 506 a`

## Không tự động suy luận các case mơ hồ

Các nhóm sau vẫn để `CHUA_NHAN_DIEN` hoặc cần review:

- Chỉ có tên người chuyển, không có mã căn.
- Chỉ có số căn nhưng thiếu lô/tòa, ví dụ `căn 415`.
- Chỉ có cụm chung chung như `chuyen khoan nhanh qua Zalo`.
- Một nội dung chứa nhiều căn. Parser trả nhiều candidate, không tự chọn một căn.

## File báo cáo đã sinh

Mỗi file sao kê đã sinh 3 report trong `docs/reports/`:

- `*-parser-doi-chieu.xlsx`: Excel có sheet `Sao ke co parser`, `Tong hop`, `Chi tiet parser`, `Can kiem tra`.
- `*-parser-summary.json`: thống kê ngắn.
- `*-can-kiem-tra.csv`: dòng cần review bằng mắt.

Các file chính:

- `lich-su-giao-dich-T12_2025-parser-doi-chieu.xlsx`
- `lich-su-giao-dich-T1-parser-doi-chieu.xlsx`
- `lich-su-giao-dich-T2-parser-doi-chieu.xlsx`
- `lich-su-giao-dich-T3-parser-doi-chieu.xlsx`
- `lich-su-giao-dich-T4-parser-doi-chieu.xlsx`
- `lich-su-giao-dich-T5-26--parser-doi-chieu.xlsx`

## Cổng dừng thủ công

Trước khi dùng parser này để import sao kê production, chủ dự án cần mở các sheet `Can kiem tra` trong 6 file report và xác nhận:

- các dòng `NHIEU_CAN` đúng là nhiều căn, không tự chọn
- các dòng `MA_CAN_KHONG_TON_TAI` có phải do cư dân ghi sai hay do thiếu căn trong master
- các dòng `KHONG_NHAN_DIEN` nào thực sự cần bổ sung rule tiếp
- có chấp nhận rule typo `LA4 -> L4A` trong ngữ cảnh có số phòng rõ ràng không

Không cần duyệt các dòng thanh toán chi trong sao kê. Những dòng này không tạo `duyet_giao_dich` khi import.

## Lệnh sử dụng

Sinh report một file:

```powershell
npm run report:bank-statement:parser -- "docs/resources/lich-su-giao-dich T1.xls"
```

Import sao kê vào DB staging/review:

```powershell
npm run import:bank-statement:v2 -- "docs/resources/lich-su-giao-dich T1.xls"
```

## Kiểm thử

Đã chạy:

```powershell
npm test
npm run build
```

Kết quả:

- `npm test`: `266` tests passed.
- `npm run build`: pass.
