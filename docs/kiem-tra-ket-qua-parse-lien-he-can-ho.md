# Kiểm tra kết quả parse liên hệ căn hộ

## Mục tiêu

Tài liệu này mô tả cách kiểm tra kết quả parse phần `THÔNG TIN CƯ DÂN` sau khi đã:

- tạo rule parse
- chạy audit từ file Excel thật

Mục tiêu của bước kiểm tra không phải là “đẹp dữ liệu”, mà là xác nhận:

- căn hộ này có những đầu mối liên hệ nào
- số điện thoại nào có thể dùng để gọi / nhắn tin
- trường hợp nào có thể tự động chấp nhận
- trường hợp nào bắt buộc phải rà soát

---

## File dùng để kiểm tra

### File nguồn

- `docs/Theo dõi thu phí T4.xlsx`

### File rule

- `docs/resident-import-rules.vi.md`

### File audit

- `docs/reports/bao-cao-audit-lien-he-can-ho.md`

---

## Quy trình kiểm tra đề xuất

### Bước 1. Kiểm tra tổng quan bằng báo cáo audit

Mở:

- `docs/reports/bao-cao-audit-lien-he-can-ho.md`

Xác nhận các chỉ số tổng:

- tổng ô cần rà soát: `896`
- có nhiều dòng: `432`
- có nhiều số điện thoại: `553`
- có cờ trạng thái: `262`

Ý nghĩa:

- đây là vùng dữ liệu “không nên đổ thẳng vào bảng master”
- các ô ngoài vùng này có thể auto-map dễ hơn

### Bước 2. Kiểm tra theo mã căn

Khi nghi ngờ một căn cụ thể, tìm theo:

- `Mã căn`
- `Chủ hộ`
- `Thông tin cư dân`

Ví dụ:

- `L4C.426`
- `L4A.403`
- `L1.115`

### Bước 3. Đối chiếu với rule parse

Với mỗi case, đối chiếu 4 điểm:

1. Có bao nhiêu tên / nhóm tên
2. Có bao nhiêu số điện thoại
3. Có ghi chú nghiệp vụ chen vào không
4. Có cờ trạng thái như `đã bán`, `chủ mới`, `khách thuê`, `sđt sai` không

### Bước 4. Chốt một trong ba mức xử lý

#### A. `AUTO_MAP`

Cho phép đưa thẳng vào `lien_he_can_ho`

Điều kiện điển hình:

- 1 đầu mối, 1 số điện thoại rõ ràng
- hoặc nhiều đầu mối = nhiều số, map theo thứ tự rõ ràng
- không có cờ trạng thái nghiệp vụ

Ví dụ:

- `Trần Thị Hiền/(0936.882.856.)`

#### B. `AUTO_MAP_GROUP`

Cho phép tạo 1 record liên hệ dạng nhóm

Điều kiện điển hình:

- nhiều tên nhưng chỉ có 1 số
- mục tiêu chỉ là liên hệ
- không cần tách quan hệ hộ gia đình

Ví dụ:

- `Hiếu / Mỹ Linh 0794115765`

Kết quả mong muốn:

- `ten_hien_thi = "Hiếu/ Mỹ Linh"`
- `so_dien_thoai = "0794115765"`

#### C. `CAN_RA_SOAT`

Không tự đổ vào master

Điều kiện điển hình:

- số tên và số điện thoại không cân bằng
- nhiều dòng trong cùng một ô
- có ghi chú nghiệp vụ lẫn với dữ liệu liên hệ
- có trạng thái như `đã bán`, `chủ mới`, `khách thuê`, `sđt sai`, `xác minh`

---

## Cách kiểm tra từng case sau này

Khi đã làm parser staging thật, mỗi dòng nên có bảng preview như sau:

| Cột | Ý nghĩa |
| --- | --- |
| `ma_can` | Mã căn gốc |
| `ten_chu_ho_goc` | Lấy từ cột `HỌ VÀ TÊN CHỦ HỘ` |
| `thong_tin_cu_dan_goc` | Toàn bộ text gốc |
| `ten_hien_thi_parse` | Tên hoặc nhóm tên parse ra |
| `so_dien_thoai_parse` | Số điện thoại parse ra |
| `la_lien_he_chinh_du_doan` | Có phải đầu mối chính hay không |
| `co_can_ra_soat` | Có cần review tay hay không |
| `flags_json` | Các cờ trạng thái |
| `ghi_chu_nghiep_vu` | Text nghiệp vụ cần tách riêng |
| `trang_thai_duyet` | `CHUA_DUYET / DA_DUYET / TU_CHOI` |

Người review chỉ cần nhìn bảng này là có thể duyệt.

---

## Những dạng trường hợp chưa xử lý sạch

Đây là các nhóm case hiện chưa nên auto-map hoàn toàn.

### 1. Nhiều người, nhiều số nhưng không rõ map theo thứ tự

Ví dụ:

- `L4C.426`
- `L4A.333`
- `L4C.329`

Lý do chưa xử lý sạch:

- có nhiều số
- có nhiều tên
- thứ tự không rõ
- có text chen giữa như `-Chị Bích`

Gợi ý:

- chỉ auto-map khi số tên = số số điện thoại và cấu trúc thực sự cân bằng
- còn lại đưa sang `CAN_RA_SOAT`

### 2. Có nhiều dòng trong cùng một ô

Ví dụ:

- `L4C.426`
- `L2.229`
- `L1.115`

Lý do chưa xử lý sạch:

- một dòng có thể là contact
- một dòng có thể là note nghiệp vụ
- một dòng có thể là người liên quan phụ

Gợi ý:

- parse theo từng dòng
- dòng nào chứa mô tả thanh toán / đóng hộ / cùng đóng phí thì tách vào `ghi_chu_nghiep_vu`

### 3. Có trạng thái chuyển chủ / đã bán

Ví dụ:

- `L2.222`
- `L4B.207`
- `L1.223`

Lý do chưa xử lý sạch:

- chưa biết nên giữ liên hệ cũ, chủ mới hay cả hai

Gợi ý:

- vẫn parse contact
- nhưng bắt buộc `co_can_ra_soat = true`
- chưa tự xóa liên hệ cũ

### 4. Có khách thuê / người thuê

Ví dụ:

- `L4A.403`
- `L1.111A`
- `L1.118`

Lý do chưa xử lý sạch:

- có thể nên giữ cả chủ hộ và người thuê
- nhưng chưa rõ ai là đầu mối chính để nhắc phí

Gợi ý:

- vẫn parse cả hai
- để reviewer chọn `la_lien_he_chinh`

### 5. Chỉ có trạng thái, không có số điện thoại usable

Ví dụ:

- `L2.207` -> `cần xin sdt`
- `L4C.421` -> `đã bán`
- `L4A.533` -> `sdt sai`

Lý do chưa xử lý sạch:

- không có contact usable để gọi / nhắn

Gợi ý:

- chỉ lưu cờ trạng thái
- không sinh `lien_he_can_ho` chính thức

### 6. Có ghi chú nghiệp vụ lẫn vào contact

Ví dụ:

- `L4C.426` -> `Thanh toán theo tháng: cứ cuối tháng sẽ nộp`
- `L1.111B` -> `cùng đóng phí cho L1.115`
- `L1.211B` -> `cty đóng hộ`

Lý do chưa xử lý sạch:

- đây không phải dữ liệu định danh
- nhưng lại quan trọng về nghiệp vụ thu phí

Gợi ý:

- tách riêng sang `ghi_chu_nghiep_vu`
- không trộn vào `ten_hien_thi`

### 7. Một nhóm tên dùng chung một số

Ví dụ:

- `Hiếu / Mỹ Linh 0794115765`

Đây không phải case lỗi.
Đây là case có thể hỗ trợ bằng rule riêng:

- tạo 1 contact group
- `ten_hien_thi = "Hiếu/ Mỹ Linh"`
- `so_dien_thoai = "0794115765"`

### 8. Chủ hộ gốc và contact thực tế khác nhau

Ví dụ:

- `Chủ cũ ... / Chủ mới ...`
- `Chủ hộ ...`
- `đã bán cho ...`

Lý do chưa xử lý sạch:

- tên ở cột `HỌ VÀ TÊN CHỦ HỘ` có thể đã cũ
- contact trong note có thể mới hơn

Gợi ý:

- vẫn giữ `ten_chu_ho_goc`
- parse thêm contact mới
- để reviewer chốt sau

---

## Đề xuất phương án kiểm tra để anh duyệt

Tôi đề xuất sau khi làm parser staging thật, ta sẽ sinh ra **một file preview dạng bảng** trước khi đổ vào DB master.

File preview nên có các cột:

- `ma_can`
- `ten_chu_ho_goc`
- `thong_tin_cu_dan_goc`
- `ten_hien_thi_parse`
- `so_dien_thoai_parse`
- `la_lien_he_chinh_du_doan`
- `co_can_ra_soat`
- `flags`
- `ghi_chu_nghiep_vu`
- `de_xuat_xu_ly`

Các giá trị `de_xuat_xu_ly`:

- `AUTO_MAP`
- `AUTO_MAP_GROUP`
- `CAN_RA_SOAT`
- `CHI_LUU_CO_TRANG_THAI`

Anh có thể review file này như bảng tính, chốt rule, rồi mới reset/import vào DB V2.

---

## Khuyến nghị chốt bước tiếp theo

Thứ tự đúng nên là:

1. chốt các nhóm `AUTO_MAP / AUTO_MAP_GROUP / CAN_RA_SOAT / CHI_LUU_CO_TRANG_THAI`
2. sinh file preview parse liên hệ căn hộ
3. anh duyệt bằng mắt trên file preview
4. sau đó mới migrate/reset DB V2
5. import lại workbook quản lý theo pipeline mới

Đây là cách an toàn nhất để không đưa dữ liệu bẩn vào bảng master quá sớm.
