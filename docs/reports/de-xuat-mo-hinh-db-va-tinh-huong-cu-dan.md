# Đề xuất mô hình DB và tình huống cư dân

Ngày lập: 2026-05-18

## Kết luận sau khi rà soát 934 căn

- `can_ho` hiện có đủ 934 căn.
- Phân loại hiện tại: 884 căn chung cư, 50 căn liền kề.
- Mã căn hợp lệ theo dữ liệu thật gồm `L1.*`, `L2.*`, `L3.*`, `L4A.*`, `L4B.*`, `L4C.*`, `LK1.*`, `LK2.*`, `LKV.*`.
- Không thiếu tên chủ hộ gốc.
- Không thiếu dữ liệu phí đã chốt cho batch public hiện hành.
- Contact master mới có 1 dòng, còn 1977 dòng đang nằm ở staging `ung_vien_lien_he_can_ho`. Đây là trạng thái đúng nếu hệ thống chưa review contact hàng loạt.
- 628 căn có từ 2 số điện thoại raw trở lên, cần review trước khi chọn liên hệ chính.
- 13 căn không thấy số điện thoại trong raw theo rule rà soát hiện tại.
- 46 căn có dấu hiệu ghi chú nghiệp vụ cần giữ lại khi duyệt contact.

Danh sách từng dòng nằm tại:

- `docs/reports/ra-soat-934-can-ho-db.csv`
- `docs/reports/bao-cao-ra-soat-934-can-ho-db.md`

## Thiết kế DB nên giữ theo hướng nào

Không nên chuyển sang mô hình `cu_dan` quá sâu ở giai đoạn này. Nguồn Excel hiện tại không đủ sạch để xác định chắc chắn một người là chủ hộ pháp lý, khách thuê, người thân, người nhận thông báo hay người đóng tiền.

Mô hình hợp lý nhất hiện tại:

- `can_ho`: bảng gốc, mỗi căn là trung tâm.
- `ung_vien_lien_he_can_ho`: staging từ Excel, giữ raw và parse.
- `lien_he_can_ho`: contact master sau khi quản lý duyệt.
- `dong_theo_doi_thu_phi_tho`: staging file theo dõi thu phí.
- `batch_trang_thai_phi_public`: batch dữ liệu phí đã được Super Admin xác nhận.
- `trang_thai_phi_can_ho_public`: snapshot duy nhất cho trang cư dân.
- `giao_dich_ngan_hang`, `ket_qua_parse_giao_dich`, `duyet_giao_dich`, `phan_bo_giao_dich`: phục vụ sao kê và đối soát sau.

## Trường nên ưu tiên ổn định

### `can_ho`

- `ma_can`: mã hiển thị và lookup chính.
- `loai_can`: `CHUNG_CU` hoặc `LIEN_KE`.
- `ma_lo`, `ma_so`: phục vụ filter, parser, dashboard.
- `dien_tich_m2`: chỉ nên bắt buộc với chung cư nếu nguồn có dữ liệu ổn.
- `chu_ho_ten_goc`, `ghi_chu`: giữ nguyên raw để đối chiếu.
- `trang_thai`: trạng thái vận hành, không nên lấy hoàn toàn từ Excel raw.

### `lien_he_can_ho`

- `ten_hien_thi`: tên dùng để gọi/nhắn tin.
- `so_dien_thoai`: số đã chuẩn hóa.
- `la_lien_he_chinh`: mỗi căn chỉ nên có tối đa 1 contact chính.
- `nhan_thong_bao`: phân biệt người có nhận thông báo phí hay không.
- `vai_tro_lien_he`: chủ hộ, khách thuê, người thân, người nhận thông báo.
- `co_can_ra_soat`, `ghi_chu`: giữ các trường hợp chưa chắc chắn.

### `trang_thai_phi_can_ho_public`

- Chỉ lưu dữ liệu cư dân được phép xem.
- Không lưu số điện thoại, tên cư dân, ghi chú nội bộ.
- Nên bổ sung về sau trường chuẩn hóa `paid_through_year`, `paid_through_month`, `paid_through_index` để không phụ thuộc quá nhiều vào JSON.

## 24 tình huống cư dân cần hệ thống xử lý

1. Chủ hộ đang ở, đóng đủ đến tháng hiện tại.
2. Chủ hộ đang ở nhưng đóng chậm, ví dụ hết tháng 11/2025 trong năm 2026.
3. Chủ hộ đóng trước, ví dụ hết tháng 2/2027, cần hiển thị dễ hiểu.
4. Cư dân đóng lẻ tiền, chưa đủ hệ số 200.000 hoặc 250.000.
5. Một căn có nhiều số điện thoại, cần chọn liên hệ chính.
6. Một căn có chủ cũ và chủ mới trong ghi chú.
7. Một căn có khách thuê là người cần nhận thông báo.
8. Một căn có người thân đứng ra đóng tiền.
9. Một số điện thoại đại diện nhiều căn.
10. Một giao dịch ngân hàng thanh toán cho nhiều căn.
11. Một căn được thanh toán bằng nhiều giao dịch nhỏ.
12. Nội dung chuyển khoản ghi sai mã căn nhưng tên người chuyển khớp contact.
13. Nội dung chuyển khoản chỉ ghi số phòng, không ghi lô/tòa.
14. Nội dung chuyển khoản ghi kiểu tự nhiên: `can 115 lo L1`.
15. Nội dung chuyển khoản có nhiều mã căn, cần tách phân bổ.
16. Căn không có số điện thoại trong Excel, cần flag thiếu contact.
17. Căn có ghi chú thanh toán theo tháng, cần giữ ghi chú nội bộ.
18. Căn liền kề `LK1.*`, `LK2.*`, `LKV.*` không có diện tích nhưng vẫn hợp lệ.
19. Cư dân tra cứu public không cần login.
20. Cư dân nhập sai mã căn, hệ thống chỉ báo không tìm thấy, không lộ dữ liệu khác.
21. Manager cần xem số điện thoại theo căn, nhưng cư dân public không được xem.
22. Super Admin import file phí và chỉ sau khi xác nhận thì cư dân mới thấy.
23. File Excel tháng sau thay đổi cấu trúc nhẹ, cần staging để kiểm trước.
24. BQT bàn giao tài khoản cho người mới, cần role rõ ràng nhưng không cần audit quá nặng.

## Khuyến nghị thực hiện tiếp

1. Giữ mô hình apartment-centric hiện tại.
2. Chưa tạo bảng `cu_dan` độc lập cho đến khi dữ liệu người đủ sạch.
3. Siết quy trình duyệt contact trước khi cho manager dùng thật.
4. Cho phép Excel là nguồn vận hành, nhưng public page chỉ đọc snapshot đã xác nhận.
5. Bổ sung trường chuẩn hóa trạng thái phí sau khi UI import phí ổn định.
