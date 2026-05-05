# Quy tắc nhập và tách dữ liệu cư dân

## Mục tiêu

Tài liệu này định nghĩa cách đọc và tách dữ liệu cư dân từ file Excel quản lý hiện tại, đặc biệt là phần:

- `HỌ VÀ TÊN CHỦ HỘ`
- `THÔNG TIN CƯ DÂN`

Mục tiêu là:

- không nhét dữ liệu bẩn thẳng vào bảng chuẩn
- bóc tách được tên người, số điện thoại và ghi chú
- giữ lại dữ liệu gốc để audit
- cho phép review tay trước khi đổ vào DB chuẩn

## Nguyên tắc

1. Dữ liệu gốc luôn phải giữ nguyên.
2. Không tự đoán quá mức khi thông tin mơ hồ.
3. Nếu parse được chắc chắn thì tách thành dữ liệu chuẩn.
4. Nếu parse chưa chắc chắn thì đưa vào bảng staging để review.

## Nguồn dữ liệu

### 1. `HỌ VÀ TÊN CHỦ HỘ`

Đây là nguồn ưu tiên để lấy:

- tên người chính

Không nên ghi đè tên này bằng dữ liệu từ cột ghi chú nếu chưa review.

### 2. `THÔNG TIN CƯ DÂN`

Đây là cột có thể chứa:

- thêm tên người liên quan
- một hoặc nhiều số điện thoại
- ghi chú như:
  - đã bán
  - khách thuê
  - chủ mới
  - cần xin sđt
  - sđt sai
- xác minh

## Kết quả audit thực tế từ file Excel

Đã đọc trực tiếp sheet `Danh sách khách hàng` trong file quản lý hiện tại.

Tổng số dòng dữ liệu có nội dung:

- `936`

Các mẫu nổi bật:

- có dấu `/`: `875` dòng
- có dấu `(` hoặc `)`: `703` dòng
- có từ khóa `đã bán`: `133` dòng
- có từ khóa `chủ mới`: `126` dòng
- có từ khóa `khách thuê`: `25` dòng
- có từ khóa `cần xin sđt`: `9` dòng
- có từ khóa `sđt sai`: `1` dòng
- có từ khóa `xác minh`: `1` dòng
- có hơn 1 số điện thoại: `554` dòng

Kết luận:

- dữ liệu cư dân thực tế phần lớn là dữ liệu nhiều người / nhiều số điện thoại / có trạng thái nghiệp vụ
- không thể xử lý an toàn nếu chỉ dùng một cột `note`
- bắt buộc phải có lớp staging parse + review

## Phân loại kết quả parse

### A. Sạch (`SACH`)

Ví dụ:

- `Trần Thị Hiền/(0936.882.856.)`

Parse:

- người 1: `Trần Thị Hiền`
- sđt 1: `0936882856`

### B. Có nhiều người (`NHIEU_NGUOI`)

Ví dụ:

- `Bùi Thị Hằng/Trần Quốc Hoàng(0906.021.387.0906.054.186)`

Parse:

- người 1: `Bùi Thị Hằng`
- sđt 1: `0906021387`
- người 2: `Trần Quốc Hoàng`
- sđt 2: `0906054186`

### C. Cần rà soát (`CAN_RA_SOAT`)

Ví dụ:

- `Phạm Đức Thuận/Nguyễn Thị Mận sdt sai`
- `cần xin sđt`
- `xác minh`

### D. Có trạng thái nghiệp vụ (`CO_TRANG_THAI`)

Ví dụ:

- `đã bán`
- `khách thuê`
- `chủ mới`
- `thuê mua`

## Rule tách tên và số điện thoại

### Rule 1. Tên chính

Luôn ưu tiên:

- `HỌ VÀ TÊN CHỦ HỘ`

làm:

- `ten_nguoi_chinh`

### Rule 2. Chuẩn hóa số điện thoại

Số điện thoại được chuẩn hóa theo các bước:

1. bỏ dấu chấm, dấu cách, dấu gạch
2. chỉ giữ chữ số
3. nếu dài 10 hoặc 11 số thì coi là candidate hợp lệ

Ví dụ:

- `0906.021.387` -> `0906021387`
- `0988 887113` -> `0988887113`

### Rule 3. Map tên và số điện thoại theo thứ tự

Nếu:

- số lượng tên = số lượng số điện thoại
- và không có cờ mơ hồ

thì map theo thứ tự:

- tên 1 -> sđt 1
- tên 2 -> sđt 2

Ví dụ:

- `Bùi Thị Hằng/Trần Quốc Hoàng(0906.021.387.0906.054.186)`

thì:

- `Bùi Thị Hằng` -> `0906021387`
- `Trần Quốc Hoàng` -> `0906054186`

### Rule 3A. Cho phép tách nhiều số trong cùng một cặp ngoặc

Nếu trong ngoặc có nhiều cụm số điện thoại nối bằng dấu chấm hoặc dấu ngăn cách khác, phải:

1. tách thành từng số điện thoại độc lập
2. chuẩn hóa từng số
3. chỉ map theo thứ tự nếu số lượng tên bằng số lượng số điện thoại

Ví dụ:

- `Bùi Thị Hằng/Trần Quốc Hoàng(0906.021.387.0906.054.186)`

thành:

- `0906021387`
- `0906054186`

### Rule 3B. Cho phép tách nhiều dòng trong một ô

Nếu nội dung có xuống dòng, phải xử lý từng dòng như một phân đoạn riêng.

Ví dụ thực tế:

- `Trương Thành Trung/(0933.456.655/0932.223.638-Chị Bích.)`
- `Hiếu / Mỹ Linh 0794115765`
- `Thanh toán theo tháng: cứ cuối tháng sẽ nộp`

Trong trường hợp này:

- dòng 1 chứa người chính + số điện thoại + người liên hệ phụ
- dòng 2 chứa thêm tên người liên quan và một số điện thoại
- dòng 3 là ghi chú nghiệp vụ, không phải dữ liệu định danh

Kết quả:

- phải parse theo từng dòng
- gom lại thành các `ung_vien_lien_he_can_ho`
- gắn cờ `CAN_RA_SOAT`

### Rule 4. Không auto-map khi lệch số lượng

Nếu:

- 2 tên nhưng 1 sđt
- 1 tên nhưng 2 sđt
- 3 tên nhưng 2 sđt

thì:

- không gán bừa
- chuyển sang `CAN_RA_SOAT`

### Rule 4A. Không auto-map khi có từ khóa quan hệ chen giữa

Ví dụ:

- `0932.223.638-Chị Bích`

Trong trường hợp này:

- không nên coi `Chị Bích` là tên chuẩn chắc chắn
- nên đưa vào `ghi_chu` hoặc `ten_tam`
- gắn cờ `CAN_RA_SOAT`

### Rule 5. Không dùng text mơ hồ làm dữ liệu chuẩn

Các cụm như:

- `cần xin sđt`
- `sđt sai`
- `xác minh`
- `ko rõ`

không được dùng để ghi vào số điện thoại chuẩn.

Chúng phải đi vào:

- `co_can_ra_soat = true`
- `co_gi_chu_trang_thai`

### Rule 5A. Không coi ghi chú chu kỳ thanh toán là dữ liệu cư dân

Ví dụ:

- `Thanh toán theo tháng: cứ cuối tháng sẽ nộp`
- `khách đóng 1 tháng 1 lần cùng với tiền điện nước`

Các nội dung này:

- không được parse thành tên
- không được parse thành số điện thoại
- phải đưa vào nhóm `ghi_chu_nghiep_vu`

## Rule nhận diện trạng thái

Nếu ghi chú chứa:

- `đã bán` -> `DA_BAN`
- `khách thuê` -> `KHACH_THUE`
- `chủ mới` -> `CHU_MOI`
- `thuê mua` -> `THUE_MUA`
- `mua bán` -> `MUA_BAN`
- `cần xin sđt` -> `CAN_XIN_SDT`
- `sđt sai` -> `SDT_SAI`
- `xác minh` -> `XAC_MINH`

thì phải lưu thành cờ riêng, không chỉ để trong text tự do.

### Rule 6A. Từ khóa trạng thái bán/chuyển chủ

Nếu có:

- `đã bán`
- `chủ mới`

thì đây là tín hiệu rất mạnh cho thấy dữ liệu người hiện tại có thể không còn đúng.

Kết quả:

- `co_can_ra_soat = true`
- tạo flag:
  - `DA_BAN`
  - `CHU_MOI`

### Rule 6B. Từ khóa thuê

Nếu có:

- `khách thuê`
- `thuê`

thì người parse ra có thể không phải chủ hộ.

Kết quả:

- `vai_tro_du_doan = KHACH_THUE` hoặc `NGUOI_LIEN_QUAN`
- không ghi đè chủ hộ chuẩn từ cột `HỌ VÀ TÊN CHỦ HỘ`

### Rule 6C. Từ khóa chất lượng dữ liệu

Nếu có:

- `cần xin sđt`
- `sđt sai`
- `xác minh`

thì:

- dữ liệu không đủ tin cậy để tự đổ vào bảng master
- phải chuyển sang review

## Nhóm pattern thực tế cần hỗ trợ

### Pattern 1. Một người, một số

Ví dụ:

- `Lê Thị Thu Huyền/(0904,019,299.)`

### Pattern 2. Hai người, hai số

Ví dụ:

- `Bùi Thị Hằng/Trần Quốc Hoàng(0906.021.387.0906.054.186)`

### Pattern 3. Một người, nhiều số

Ví dụ:

- `Vũ Thị Thu Huyền/ 0358422718 '0931204888 cần xin sdt`

Kết quả:

- không auto-map số nào là số chính
- gắn cờ `CAN_XIN_SDT`

### Pattern 4. Nhiều người, nhiều số, nhiều dòng

Ví dụ:

- `Trương Thành Trung/(0933.456.655/0932.223.638-Chị Bích.)`
- `Hiếu / Mỹ Linh 0794115765`
- `Thanh toán theo tháng: cứ cuối tháng sẽ nộp`

Kết quả:

- parse được các candidate
- nhưng bắt buộc review

### Pattern 5. Chỉ có trạng thái, không có dữ liệu người đủ sạch

Ví dụ:

- `cần xin sđt`

Kết quả:

- không sinh thẳng `lien_he_can_ho` vào bảng master
- chỉ sinh `ung_vien_lien_he_can_ho` cần review

## Mô hình dữ liệu đề xuất

### Bảng staging

#### `ung_vien_lien_he_can_ho`

Lưu một dòng parse từ Excel cho một đầu mối liên hệ ứng viên:

- `ma_can`
- `ten_chu_ho_goc`
- `thong_tin_cu_dan_goc`
- `ten_hien_thi_parse`
- `so_dien_thoai_parse`
- `la_lien_he_chinh_du_doan`
- `co_can_ra_soat`
- `flags_json`
- `ghi_chu_nghiep_vu`
- `payload_parse_json`
- `payload_duyet_json`

### Bảng master

#### `can_ho`

Giữ thông tin căn hộ chuẩn.

#### `lien_he_can_ho`

Mỗi record là một đầu mối liên hệ có thể:

- gọi điện
- nhắn tin
- nhận thông tin đóng phí

`ten_hien_thi` có thể là:

- một người: `Chị Bích`
- hoặc một nhóm tên dùng chung một số: `Hiếu/ Mỹ Linh`

## Kết luận

Từ thời điểm này:

- không nên đổ thẳng cột `THÔNG TIN CƯ DÂN` vào bảng contact master
- phải đi qua staging parse + review
- chỉ sau khi chốt mới đẩy vào:
  - `can_ho`
  - `lien_he_can_ho`
