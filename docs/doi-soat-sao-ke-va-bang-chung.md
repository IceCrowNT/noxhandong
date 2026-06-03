# Đối Soát Sao Kê Và Bằng Chứng

File này là tài liệu nghiệp vụ cho Phase 2: đối soát sao kê ngân hàng với file `Theo dõi thu phí`, xử lý giao dịch không rõ căn hộ và lưu bằng chứng thủ công.

## Quyết Định Vận Hành Từ 2026-05-27

Phase 2 không còn đặt mục tiêu nhập lại toàn bộ sao kê quá khứ T1-T5/2026 vào DB chính thức.

Quyết định đã chốt:

- Dữ liệu `Theo dõi thu phí T5.xlsx` là mốc quá khứ chuẩn sau khi chủ dự án duyệt file cuối cùng.
- Mốc này được gọi là **opening balance T5/2026**.
- Sao kê T1-T5/2026 chỉ dùng để học parser, đối chiếu sai lệch và làm dữ liệu tham khảo.
- Từ T6/2026 trở đi, sao kê ngân hàng mới là nguồn dữ liệu vận hành chính của hệ thống.
- Giao dịch từ T6/2026 sẽ đi qua luồng: import sao kê, parser, gợi ý khớp căn, admin duyệt, lưu bằng chứng nếu cần, cập nhật lịch sử phí, chốt public.
- Public lookup vẫn chỉ đọc batch đã chốt, không đọc trực tiếp từ sao kê chưa duyệt.

Lý do:

- Dữ liệu quá khứ có nhiều giao dịch Zalo, nhập tay, thiếu mã căn, sai cú pháp hoặc một giao dịch cho nhiều căn.
- Parse lại toàn bộ quá khứ tốn công nhưng không tăng nhiều giá trị vận hành.
- Chốt T5 làm mốc nền giúp dữ liệu sạch bắt đầu từ T6, dễ kiểm soát hơn.

## Mục Tiêu

- Đối chiếu từng giao dịch thu trong sao kê với từng căn hộ.
- So khớp số tiền đã ghi trong file `Theo dõi thu phí` theo từng tháng.
- Phát hiện căn đã ghi thu phí nhưng chưa thấy sao kê.
- Phát hiện sao kê đã có tiền nhưng chưa ghi vào file theo dõi.
- Gom các giao dịch không nhận diện được căn vào danh sách cần xử lý thủ công.
- Lưu được bằng chứng cho các trường hợp cư dân gửi ảnh qua Zalo hoặc nội dung chuyển khoản thiếu/sai thông tin căn hộ.

## Nguồn Dữ Liệu

### File theo dõi thu phí

Nguồn nghiệp vụ thủ công, hiện đang coi là dữ liệu thô nhưng toàn vẹn.

Ví dụ: `docs/Theo dõi thu phí T5.xlsx`

Sheet chính:

- `Lịch sử đóng phí`

Cột quan trọng:

- `Số căn hộ`
- `T1` đến `T12`
- `Tổng số dư`
- `Tháng đã đóng đến hiện tại (năm 2026)`
- `Ghi chú`

### File sao kê ngân hàng

Nguồn đối chiếu dòng tiền thực tế.

Ví dụ:

- `docs/resources/lich-su-giao-dich T5(26).xls`

Nguyên tắc:

- Chỉ phân tích thanh toán thu.
- Thanh toán chi vẫn giữ ở raw/audit nhưng không đưa vào đối soát cư dân.
- Ưu tiên mã tham chiếu ngân hàng để chống trùng.
- Fingerprint chỉ là fallback/audit.

## Luồng Đối Soát

1. Đọc file theo dõi thu phí.
2. Lấy danh sách `934` căn và số tiền ở cột tháng cần đối soát, ví dụ `T5`.
3. Đọc sao kê cùng kỳ.
4. Bỏ qua các dòng chi.
5. Dùng parser mã căn duy nhất của project để nhận diện căn hộ từ nội dung giao dịch.
6. Tạo phân bổ tạm:
   - một giao dịch một căn: gán toàn bộ số tiền cho căn đó.
   - một giao dịch nhiều căn: nếu tổng tiền các căn ứng viên trong file theo dõi khớp số tiền sao kê, tự phân bổ theo file theo dõi.
   - không nhận diện được căn hoặc nhiều căn không khớp tiền: đưa vào danh sách xử lý thủ công.
7. So tổng tiền theo từng căn:
   - tiền trong file theo dõi tháng đó
   - tiền sao kê đã phân bổ
8. Sinh report Excel để admin kiểm tra bằng mắt.

## Trạng Thái Đối Soát Theo Căn

- `KHONG_PHAT_SINH`: file theo dõi không ghi tiền tháng đó và sao kê cũng không có phân bổ.
- `KHOP`: số tiền file theo dõi khớp số tiền sao kê đã phân bổ.
- `CO_THEO_DOI_CHUA_THAY_SAO_KE`: file theo dõi có tiền nhưng chưa thấy giao dịch sao kê tương ứng.
- `CO_SAO_KE_CHUA_GHI_THEO_DOI`: sao kê có tiền đã parser được căn nhưng file theo dõi chưa ghi tháng đó.
- `LECH_TIEN`: cả hai bên đều có tiền nhưng số tiền không bằng nhau.

## Trạng Thái Đối Soát Theo Giao Dịch

- `DA_PHAN_BO_MOT_CAN`: parser nhận diện được một căn hợp lệ.
- `DA_PHAN_BO_NHIEU_CAN`: parser nhận diện nhiều căn và tổng tiền file theo dõi của các căn đó khớp số tiền sao kê.
- `CAN_RA_SOAT_NHIEU_CAN`: parser nhận diện nhiều căn nhưng chưa đủ điều kiện phân bổ tự động.
- `CAN_NHAP_TAY`: không nhận diện được căn hoặc cần bằng chứng ngoài hệ thống.

## Case Zalo Và Nhập Tay

Một số giao dịch qua Zalo hoặc chuyển khoản nhanh không có mã căn trong nội dung. Các trường hợp này không nên cố parse bằng suy đoán quá mạnh vì dễ sai căn.

Các case cần xử lý thủ công:

- nội dung có chữ `Zalo` nhưng không có mã căn.
- chỉ có tên cư dân, không có mã căn.
- chỉ có số căn nhưng thiếu lô.
- chỉ có lô nhưng thiếu số căn.
- ghi sai mã căn.
- một người nộp hộ nhiều căn nhưng nội dung không liệt kê đủ.
- cư dân gửi ảnh sao kê qua Zalo sau đó kế toán nhập tay vào file theo dõi.

Quy tắc:

- Không tự động public/sửa trạng thái phí từ các giao dịch này.
- Admin nhập tay căn hộ sau khi xác minh.
- Lưu bằng chứng theo ngày giao dịch, mã căn, số tiền và mã giao dịch ngân hàng nếu có.

## Bằng Chứng Cần Lưu

Giai đoạn tiếp theo nên thêm bảng/chức năng lưu chứng từ:

- ảnh Zalo cư dân gửi.
- ảnh sao kê/chứng từ chuyển khoản.
- ghi chú xác minh thủ công.
- người xác minh.
- ngày xác minh.
- liên kết với giao dịch ngân hàng nếu đã có trong sao kê.
- liên kết với căn hộ nếu đã xác định được.

Tên bảng đề xuất sau này:

- `chung_tu_doi_soat`

Trường tối thiểu:

- `id`
- `can_ho_id`
- `giao_dich_ngan_hang_id`
- `loai_chung_tu`
- `duong_dan_file`
- `ten_file_goc`
- `ngay_giao_dich`
- `so_tien`
- `ma_tham_chieu_ngan_hang`
- `ghi_chu`
- `nguoi_tao_id`
- `ngay_tao`

## Script Hiện Có

Script report:

```bash
npm run report:reconcile:fee-bank
```

Mặc định script dùng:

- file theo dõi: `docs/Theo dõi thu phí T5.xlsx`
- file sao kê: `docs/resources/lich-su-giao-dich T5(26).xls`
- cột tháng: `T5`
- kỳ dữ liệu: `T5-2026`

Có thể chạy tùy biến:

```bash
npm run report:reconcile:fee-bank -- --tracking "docs/Theo dõi thu phí T5.xlsx" --statement "docs/resources/lich-su-giao-dich T5(26).xls" --month T5 --period T5-2026
```

Output:

- `docs/reports/T5-2026-lich-su-giao-dich-T5-26--doi-soat-theo-doi.xlsx`
- `docs/reports/T5-2026-lich-su-giao-dich-T5-26--doi-soat-theo-doi-summary.json`
- `docs/reports/T5-2026-lich-su-giao-dich-T5-26--doi-soat-theo-doi-can-xu-ly.csv`

## Kết Quả Mốc T5-2026

Sau khi đối soát `Theo dõi thu phí T5.xlsx` với `lich-su-giao-dich T5(26).xls`:

- căn trong file theo dõi: `934`
- dòng sao kê thô: `354`
- dòng thu được phân tích: `339`
- dòng chi bỏ qua: `15`
- tổng tiền cột `T5` trong file theo dõi: `344.350.000`
- tổng tiền sao kê đã phân bổ được: `336.650.000`
- căn khớp tiền: `263`
- căn còn sai khớp: `87`
- giao dịch cần bằng chứng/nhập tay: `47`
- giao dịch nhiều căn tự phân bổ được theo file theo dõi: `3`
- giao dịch nhiều căn chưa phân bổ được: `3`
- giao dịch không nhận diện căn: `44`

Phân loại theo căn:

- `KHONG_PHAT_SINH`: `584`
- `KHOP`: `263`
- `CO_THEO_DOI_CHUA_THAY_SAO_KE`: `55`
- `LECH_TIEN`: `2`
- `CO_SAO_KE_CHUA_GHI_THEO_DOI`: `30`

Phân loại theo giao dịch:

- `DA_PHAN_BO_MOT_CAN`: `289`
- `CAN_NHAP_TAY`: `44`
- `CAN_RA_SOAT_NHIEU_CAN`: `3`
- `DA_PHAN_BO_NHIEU_CAN`: `3`

## Kết Quả Mốc T1-T5/2026

Đã chạy đối soát cùng logic cho các tháng `T1` đến `T5`.

Báo cáo tổng hợp:

- [reports/bao-cao-doi-soat-theo-doi-sao-ke-t1-t5-2026.md](reports/bao-cao-doi-soat-theo-doi-sao-ke-t1-t5-2026.md)

Tổng hợp nhanh:

- dòng thu sao kê T1-T5: `1.167`
- tiền file theo dõi T1-T5: `1.099.150.000`
- tiền sao kê đã phân bổ được: `972.799.006`
- căn khớp theo từng tháng: `984`
- căn cần xử lý theo từng tháng: `241`
- giao dịch cần bằng chứng/nhập tay: `174`
- giao dịch nhiều căn tự phân bổ được: `23`
- giao dịch nhiều căn chưa phân bổ được: `10`
- giao dịch không nhận diện căn: `164`

Báo cáo phân loại nhóm cần nhập tay:

- [reports/bao-cao-phan-loai-giao-dich-can-nhap-tay-t1-t5-2026.md](reports/bao-cao-phan-loai-giao-dich-can-nhap-tay-t1-t5-2026.md)

Các nhóm chính còn lại:

- `54` giao dịch Zalo cần bằng chứng.
- `73` giao dịch không rõ căn.
- `15` giao dịch chỉ có tên/ngữ cảnh chung chung.
- `15` giao dịch có mẫu căn cần xem lại bằng mắt.
- `10` giao dịch nhiều căn lệch tiền.

## Quy Tắc Phát Triển Tiếp

- Parser mã căn vẫn chỉ nằm ở một nơi: `src/modules/transactions/parser/apartment-parser.ts`.
- Script đối soát được phép gọi parser, nhưng không tự tạo thuật toán parser riêng.
- Không đưa case nhập tay vào public lookup nếu chưa được admin xác nhận.
- Report Excel là bước kiểm tra trước khi đưa dữ liệu vào DB chính thức.
