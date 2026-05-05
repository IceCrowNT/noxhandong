# Đánh giá file `Danh_Sach_Can_Ho_Master.xlsx`

## Kết luận nhanh

- File master mới **khớp 100% bộ mã căn hiện có**.
- Có thể dùng file này làm **nguồn master chính cho danh sách căn hộ**.
- Tuy nhiên phần dữ liệu liên hệ trong các cột `Người sử dụng 1..5` và `Thông tin phụ` **chưa sạch hoàn toàn**, vẫn cần đi qua pipeline parse/review trước khi đổ vào bảng contact chuẩn.

## Nguồn đối chiếu

- File master mới:
  - `docs/Danh_Sach_Can_Ho_Master.xlsx`
- File quản lý cũ:
  - `docs/Theo dõi thu phí T4.xlsx`
- Mốc dữ liệu hiện tại:
  - tổng căn chuẩn đang dùng: `934`

## Kết quả đối chiếu mã căn

Sheet trong file master:
- `MASTER DATA`

Số liệu:
- tổng dòng dữ liệu: `934`
- số mã căn không rỗng: `934`
- số mã căn unique: `934`
- số mã căn trùng: `0`
- số mã căn blank: `0`

So với bộ mã căn cũ:
- chỉ có trong file master: `0`
- chỉ có trong file cũ: `0`

Kết luận:
- Bộ mã căn trong file master mới **trùng khớp hoàn toàn** với bộ mã căn hiện có.
- 3 căn `LKV.45`, `LKV.47`, `LKV.58` vẫn có mặt đầy đủ.

## Cấu trúc cột hiện có

Các cột chính:
- `STT`
- `Tòa/Lô`
- `Mã Căn Hộ`
- `Diện tích (m2)`
- `Loại Hình`
- `Chủ Hộ (Tên)`
- `Người sử dụng 1` -> `Người sử dụng 5`
- `SĐT 1` -> `SĐT 5`
- `Thông tin phụ (Khách thuê/Chuyển nhượng)`
- `Trạng Thái Sử Dụng (Auto)`
- `TÌNH TRẠNG`
- `CCCD`
- `NGÀY CẤP`
- `THƯỜNG TRÚ`
- `Ghi chú`

## Điểm tốt của file master mới

### 1. Danh sách căn hộ đã sạch hơn rõ rệt
- mã căn đã tách riêng thành cột
- không còn phải suy ra mã căn từ cột lẫn ghi chú
- rất phù hợp để làm nguồn cho bảng `can_ho`

### 2. Liên hệ đã được bóc ra thành nhiều cột
- có sẵn `Người sử dụng 1..5`
- có sẵn `SĐT 1..5`
- đây là nền tốt hơn nhiều so với chỉ có một cột `THÔNG TIN CƯ DÂN`

### 3. Trạng thái nghiệp vụ đã được tách tương đối rõ
- `Trạng Thái Sử Dụng (Auto)` đã chia:
  - `Chủ Hộ`
  - `Đã Bán / Chủ Mới`
  - `Khách Thuê`

## Điểm chưa sạch / cần đi qua review

### 1. Chủ hộ và Người sử dụng 1 chưa luôn khớp

Số liệu:
- `owner_eq_user1`: `568`
- `owner_ne_user1`: `366`

Điều này có nghĩa:
- nhiều dòng đã đưa trạng thái hoặc contact phụ vào `Người sử dụng 1`
- không thể coi `Người sử dụng 1` là dữ liệu sạch tuyệt đối

Ví dụ:
- `L1.105`
  - `Chủ Hộ (Tên) = Nguyễn Quốc Hưng`
  - `Người sử dụng 1 = Thủy 0943242668`
- `L1.109`
  - `Người sử dụng 1 = đã bán`
- `L1.509`
  - `Người sử dụng 1 = Chủ mới Nguyễn Ngọc Phương`

### 2. Cột tên vẫn còn lẫn số điện thoại / ghi chú

Số liệu:
- số ô tên có chứa chữ số: `296`
- số dòng bị ảnh hưởng: `174`

Ví dụ:
- `L1.105`
  - `Người sử dụng 1 = Thủy 0943242668`
  - `Người sử dụng 2 = 0973.280.386 Thủy`
- `L1.212`
  - `Người sử dụng 1 = mẹ 0834.725.759`
- `L1.511A`
  - `Người sử dụng 2 = Phạm Thị Bích đã nhận thông báo đóng phí tháng 5`

Kết luận:
- cột `Người sử dụng` chưa thể đưa thẳng vào contact master

### 3. Cột số điện thoại nhìn sạch hơn nhiều

Số liệu:
- số ô số điện thoại không rỗng nhưng sai chuẩn 10 chữ số: `0`

Đây là điểm tốt:
- các cột `SĐT 1..5` có thể tin cậy hơn phần cột tên

### 4. Cột `Thông tin phụ` vẫn là nơi chứa nhiều dữ liệu bẩn hữu ích nhưng chưa chuẩn

Số lượng:
- `934/934` dòng đều có dữ liệu trong `Thông tin phụ`

Đây vừa là lợi thế, vừa là nguồn bẩn:
- lợi thế vì còn giữ được context cũ
- bẩn vì vẫn chứa:
  - chủ cũ / chủ mới
  - khách thuê
  - đóng phí chung nhiều căn
  - chỉ dẫn gửi thông báo
  - người thân / người liên hệ

### 5. Trạng thái sử dụng đã rõ hơn, nhưng vẫn cần logic import

Phân bố:
- `Chủ Hộ`: `649`
- `Đã Bán / Chủ Mới`: `221`
- `Khách Thuê`: `64`

Điều này cho thấy:
- không thể import contact theo một rule duy nhất cho toàn bộ 934 căn
- cần rule riêng theo từng trạng thái

## Đánh giá nghiệp vụ

### File này phù hợp để làm gì

- làm nguồn chuẩn cho `can_ho`
- làm nguồn chuẩn ban đầu cho:
  - `dien_tich`
  - `loai_hinh`
  - `chu_ho_ten`
  - `trang_thai_su_dung`
- làm nguồn contact tốt hơn file cũ cho bước staging

### File này chưa phù hợp để làm gì

- chưa nên đổ thẳng toàn bộ `Người sử dụng 1..5` vào bảng contact chính
- chưa nên coi `Người sử dụng 1` luôn là contact chính
- chưa nên bỏ hoàn toàn `Thông tin phụ`

## Khuyến nghị triển khai

### Nên làm ngay

1. Dùng file này làm nguồn master mới cho bảng `can_ho`
2. Dùng cột `Chủ Hộ (Tên)` làm nguồn mặc định cho contact chính sơ bộ
3. Dùng `SĐT 1..5` làm nguồn số điện thoại ưu tiên
4. Đưa toàn bộ `Người sử dụng 1..5 + SĐT 1..5 + Thông tin phụ` vào staging review

### Không nên làm ngay

1. Không đổ thẳng `Người sử dụng 1..5` vào bảng contact chuẩn
2. Không bỏ qua `Thông tin phụ`
3. Không assume `Người sử dụng 1 == Chủ hộ` cho mọi dòng

## Đề xuất chốt

Nếu chọn file này làm nguồn master mới, tôi khuyên pipeline nên là:

1. `Danh_Sach_Can_Ho_Master.xlsx`
2. import vào bảng raw/staging mới
3. sync trực tiếp phần `can_ho`
4. sinh staging contact từ:
   - `Chủ Hộ (Tên)`
   - `Người sử dụng 1..5`
   - `SĐT 1..5`
   - `Thông tin phụ`
5. review contact
6. rồi mới đổ vào bảng contact chuẩn

## Kết luận cuối

File `Danh_Sach_Can_Ho_Master.xlsx`:
- **đủ tốt để thay thế file quản lý cũ ở vai trò master apartment source**
- **chưa đủ sạch để làm contact source cuối cùng mà không qua review**

Nói ngắn:
- phần `căn hộ`: **đã ổn**
- phần `liên hệ`: **tốt hơn trước nhưng vẫn phải staging + review**
