# Thiết Kế Màn Hình Duyệt Sao Kê Phase 2

## Vai trò

File này là spec UI/UX và dữ liệu cho màn hình duyệt sao kê từ T6/2026 trở đi.

Mục tiêu là khắc phục các vấn đề của các màn review hiện tại:

- bảng quá rộng, phải kéo ngang;
- dữ liệu bị tràn;
- quá nhiều cột nhưng thiếu trọng tâm;
- thao tác duyệt không rõ thứ tự;
- thông tin quan trọng bị đẩy xuống dưới;
- admin khó so sánh giao dịch, căn hộ, liên hệ và bằng chứng trong cùng một màn hình.

## Nguyên tắc đã chốt

- Dữ liệu T5/2026 hiện tại được coi là mốc chốt gần nhất.
- Vì nguồn thật vẫn nằm trong Excel, có thể test thoải mái trên DB/app trong giai đoạn Phase 2 nếu có backup trước các thao tác lớn.
- Từ T6/2026 trở đi, dữ liệu sao kê mới đi vào hệ thống bằng luồng sạch: import, parser, gợi ý, duyệt, lưu bằng chứng, cập nhật lịch sử phí, chốt public.
- Màn duyệt sao kê là màn nghiệp vụ trọng tâm của Phase 2.
- Trên PC 24 inch, một giao dịch đang duyệt phải xem được trọn vẹn thông tin quan trọng trong một màn hình 1920x1080, không kéo ngang.
- Chỉ cho phép cuộn dọc ở danh sách dài, không cho cuộn ngang toàn trang.

## Thiết bị mục tiêu

### Desktop chính

- Màn hình 24 inch, độ phân giải phổ biến: `1920x1080`.
- Browser có sidebar admin bên trái.
- Vùng nội dung thực tế sau sidebar khoảng `1600px` rộng.

### Laptop phụ

- `1366x768` hoặc `1440x900`.
- Vẫn dùng được, nhưng có thể phải cuộn dọc nhiều hơn.

### Mobile

- Không phải màn duyệt chính.
- Chỉ cần xem nhanh, lọc, gọi điện hoặc kiểm tra trạng thái.
- Các thao tác duyệt phức tạp nên ưu tiên desktop.

## Bố cục desktop đề xuất

Route dự kiến:

- `/admin/transactions/review`

Layout desktop 24 inch:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Topbar: Duyệt sao kê | Kỳ T6-2026 | File | Bộ lọc nhanh | Tìm kiếm          │
├──────────────────────┬──────────────────────────────────────┬────────────────┤
│ Cột A                │ Cột B                                │ Cột C          │
│ Danh sách giao dịch  │ Giao dịch đang chọn                  │ Gợi ý & Duyệt  │
│ 360-420px            │ 560-680px                            │ 420-520px      │
│                      │                                      │                │
│ - Tabs trạng thái    │ - Thông tin giao dịch                │ - Căn gợi ý    │
│ - Search/filter      │ - Nội dung gốc                       │ - Contact      │
│ - Row card compact   │ - Parser result                      │ - Lịch sử phí  │
│ - Chỉ cuộn dọc       │ - Bằng chứng liên quan               │ - Action       │
└──────────────────────┴──────────────────────────────────────┴────────────────┘
```

Không dùng bảng rộng cho danh sách giao dịch chính. Dùng **row card compact**.

## Cột A: Danh sách giao dịch

Mục tiêu: admin quét nhanh và chọn giao dịch cần xử lý.

Chiều rộng: `360-420px`.

Hiển thị mỗi dòng như một card thấp `72-96px`, không phải table.

Thông tin bắt buộc:

- ngày giao dịch;
- số tiền;
- trạng thái;
- mã căn parser được hoặc nhãn `Chưa rõ căn`;
- người chuyển hoặc tài khoản;
- một dòng nội dung rút gọn.

Ví dụ card:

```text
26/03/2026     1.500.000
Chưa rõ lô     L 111B
LE THI LIEU - 0975348495
ck can ho L 111B nop phi 012026 062026...
```

Trạng thái nên dùng badge:

- `Khớp chắc`
- `Cần duyệt`
- `Nhiều căn`
- `Chưa rõ căn`
- `Có Zalo`
- `Nghi trùng`
- `Đã duyệt`

Không hiển thị:

- toàn bộ nội dung gốc dài;
- tất cả mã kỹ thuật;
- nhiều cột thời gian/import/parser.

Các dữ liệu đó chuyển sang cột B/C.

## Cột B: Giao dịch đang chọn

Mục tiêu: xem đầy đủ giao dịch gốc và đánh giá parser.

Chiều rộng: `560-680px`.

Các khối trong cột B:

### 1. Tóm tắt giao dịch

Hiển thị lớn và rõ:

- số tiền;
- ngày giao dịch;
- người chuyển;
- tài khoản/SĐT nếu có;
- mã tham chiếu ngân hàng;
- file/lô import;
- số lần xuất hiện nếu re-import.

Độ ưu tiên:

1. Số tiền.
2. Ngày.
3. Mã tham chiếu.
4. Người chuyển/tài khoản.
5. File nguồn.

### 2. Nội dung chuyển khoản gốc

Hiển thị trong box riêng, wrap nhiều dòng, không tràn ngang.

Yêu cầu:

- giữ nguyên nội dung gốc;
- có nút copy;
- highlight các đoạn parser bắt được, ví dụ `L4B`, `303`, `Zalo`, `012026 062026`;
- nếu nội dung quá dài, box cao tối đa khoảng `160px`, cuộn dọc bên trong.

### 3. Kết quả parser

Hiển thị:

- mã căn parser được;
- danh sách mã căn nếu nhiều căn;
- confidence;
- match reason;
- parser version;
- cảnh báo false-positive nếu có.

Ví dụ:

```text
Kết quả parser
Trạng thái: Thiếu lô, cần duyệt
Ứng viên: L1.111B, L2.111B, L3.111B, L4A.111B, L4B.111B, L4C.111B
Độ tin cậy cao nhất: 40/100
Lý do: chỉ có đuôi căn 111B, không khớp mạnh tên/SĐT
```

### 4. Bằng chứng liên quan

Hiển thị nếu có:

- ảnh Zalo;
- file chứng từ;
- ghi chú xác minh;
- người upload;
- ngày upload.

Nếu chưa có:

- hiển thị trạng thái `Chưa có bằng chứng`;
- có nút `Thêm bằng chứng`.

## Cột C: Gợi ý căn và thao tác duyệt

Mục tiêu: admin ra quyết định nhanh.

Chiều rộng: `420-520px`.

Các khối trong cột C:

### 1. Danh sách căn gợi ý

Không dùng bảng. Dùng list card.

Mỗi card căn gợi ý hiển thị:

- mã căn;
- chủ hộ gốc;
- liên hệ từ Excel/contact candidate;
- SĐT;
- trạng thái phí hiện tại từ opening balance;
- giao dịch gần nhất nếu có;
- điểm tin cậy;
- lý do gợi ý.

Ví dụ:

```text
L1.111B                  Điểm 10/100
Chủ hộ: Lê Nguyên Duy
Liên hệ: Lê Nguyên Duy - 0823263669
Trạng thái phí: đã đóng hết T5/2026
Lý do: chỉ khớp token yếu "LE"
[Chọn căn này]
```

### 2. Đánh giá chất lượng gợi ý

Thang đánh giá:

- `Rất chắc`: mã căn đầy đủ và tồn tại, hoặc SĐT khớp trực tiếp.
- `Khá chắc`: tên đầy đủ khớp với contact/chủ hộ, không có ứng viên cạnh tranh mạnh.
- `Cần kiểm tra`: chỉ khớp một phần tên hoặc đuôi căn.
- `Không đủ dữ liệu`: không có căn hoặc không có liên hệ đáng tin.

Quy tắc:

- Chỉ `Rất chắc` mới được cho phép gợi ý chọn nhanh.
- `Khá chắc` vẫn cần admin bấm xác nhận.
- `Cần kiểm tra` và `Không đủ dữ liệu` không tự chọn.

### 3. Thao tác duyệt

Các action chính:

- `Duyệt cho căn này`
- `Phân bổ nhiều căn`
- `Đánh dấu không liên quan`
- `Cần bổ sung bằng chứng`
- `Không xác định được`

Yêu cầu:

- Nút nguy hiểm phải tách khỏi nút chính.
- Mọi action phải ghi log người thao tác.
- Action cập nhật phí phải chỉ chạy sau khi giao dịch đã có căn/phân bổ hợp lệ.

### 4. Ghi chú duyệt

Textarea ngắn:

- bắt buộc khi `Không xác định được`, `Đánh dấu không liên quan`, hoặc sửa parser;
- không bắt buộc khi giao dịch khớp chắc.

## Dữ liệu nào cần hiển thị và đánh giá chất lượng

| Nhóm dữ liệu | Trường | Hiển thị ở đâu | Độ quan trọng | Ghi chú chất lượng |
| --- | --- | --- | --- | --- |
| Giao dịch | Số tiền | Cột A/B | Rất cao | Luôn hiển thị lớn |
| Giao dịch | Ngày giao dịch | Cột A/B | Rất cao | Dùng để đối chiếu kỳ |
| Giao dịch | Mã tham chiếu ngân hàng | Cột B | Rất cao | Khóa chống trùng chính |
| Giao dịch | Nội dung gốc | Cột B | Rất cao | Phải wrap, không tràn ngang |
| Giao dịch | Người chuyển | Cột A/B | Cao | Dùng cho suggestion |
| Giao dịch | SĐT/tài khoản | Cột A/B/C | Cao | Dùng match contact |
| Parser | Mã căn parser | Cột A/B | Rất cao | Nếu thiếu lô thì không tự chốt |
| Parser | Confidence | Cột B/C | Cao | Dùng quyết định có auto-suggest không |
| Parser | Match reason | Cột B/C | Cao | Admin cần hiểu vì sao gợi ý |
| Căn hộ | Mã căn | Cột C | Rất cao | Tiêu điểm quyết định |
| Căn hộ | Chủ hộ gốc | Cột C | Cao | Dữ liệu gốc Excel, chưa chắc là liên hệ hiện tại |
| Liên hệ | SĐT candidate | Cột C | Cao | Cần hiển thị nhưng ghi rõ dữ liệu chưa duyệt nếu chưa vào master |
| Phí | Trạng thái opening balance | Cột C | Trung bình cao | Giúp biết căn đã đóng đến đâu trước giao dịch mới |
| Bằng chứng | Ảnh/file Zalo | Cột B/C | Cao với case mơ hồ | Không bắt buộc với giao dịch khớp chắc |
| Audit | File import | Cột B | Trung bình | Cần khi truy vết |
| Audit | Người duyệt | Cột B/C sau duyệt | Trung bình | Cần cho log |

## Các case cần hỗ trợ ngay

### Case 1: Khớp chắc một căn

Ví dụ nội dung có `L4B.303`.

Màn hình:

- Cột A badge `Khớp chắc`.
- Cột B hiển thị parser confidence cao.
- Cột C hiển thị một căn chính.
- Admin có thể bấm `Duyệt cho căn này`.

### Case 2: Thiếu lô

Ví dụ `L 111B`.

Màn hình:

- Cột A badge `Thiếu lô`.
- Cột B ghi rõ không tự suy luận.
- Cột C liệt kê toàn bộ ứng viên có đuôi `111B`.
- Nếu không khớp SĐT/tên mạnh, không có nút auto-chọn.

### Case 3: Nhiều căn trong một giao dịch

Màn hình:

- Cột A badge `Nhiều căn`.
- Cột B hiển thị tổng số tiền.
- Cột C có chế độ phân bổ:
  - danh sách căn;
  - số tiền từng căn;
  - tổng đã phân bổ;
  - cảnh báo nếu lệch tổng.

### Case 4: Zalo/không có mã căn

Màn hình:

- Cột A badge `Có Zalo` hoặc `Chưa rõ căn`.
- Cột B hiển thị nội dung gốc.
- Cột C yêu cầu chọn căn thủ công hoặc upload bằng chứng.

### Case 5: Nghi trùng

Màn hình:

- Cột A badge `Nghi trùng`.
- Cột B hiển thị mã tham chiếu và các lần xuất hiện.
- Cột C chỉ cho phép xác nhận giữ giao dịch gốc hoặc đánh dấu bản import sau là trùng.

## Quy tắc tránh vỡ layout

- Không dùng table rộng cho màn review chính.
- Nếu cần bảng, chỉ dùng trong modal/chi tiết phụ và vẫn phải `overflow-x-auto` bên trong vùng nhỏ, không làm tràn toàn trang.
- Nội dung gốc luôn `white-space: pre-wrap` hoặc wrap tương đương.
- Mã dài như mã tham chiếu dùng `break-all`.
- Mỗi cột tự cuộn dọc nếu cần, không cuộn ngang.
- Với desktop, chiều cao danh sách giao dịch nên là `calc(100vh - topbar)`.
- Với card ứng viên, giới hạn thông tin trên card, chi tiết phụ mở bằng disclosure.

## Mobile/tablet

Mobile không cố nhét 3 cột.

Layout mobile:

- tab 1: `Danh sách`
- tab 2: `Giao dịch`
- tab 3: `Gợi ý`

Mobile chỉ để kiểm tra nhanh và xử lý đơn giản. Duyệt nhiều căn hoặc upload nhiều bằng chứng nên ưu tiên desktop.

## Cổng nghiệm thu UI

Trước khi coi màn duyệt sao kê đạt:

- [ ] Ở desktop 1920x1080, chọn một giao dịch và xem được số tiền, ngày, người chuyển, nội dung gốc, parser result, danh sách gợi ý, action duyệt mà không kéo ngang.
- [ ] Không có horizontal scroll toàn trang.
- [ ] Nội dung chuyển khoản dài không phá layout.
- [ ] Case `L 111B` hiển thị đủ 6 ứng viên nhưng không tự chọn.
- [ ] Case nhiều căn có tổng phân bổ và cảnh báo lệch tiền.
- [ ] Case Zalo có chỗ upload bằng chứng.
- [ ] Manager/kỹ thuật không duyệt được nếu quyền không cho phép.
- [ ] Mobile 390px/430px dùng tabs, không bị vỡ bảng.

## Kết luận thiết kế

Màn duyệt sao kê không nên là một bảng lớn. Nó nên là màn **master-detail-review**:

- bên trái là danh sách giao dịch;
- giữa là giao dịch gốc và kết quả parser;
- bên phải là căn gợi ý, liên hệ, trạng thái phí và action duyệt.

Cách này phù hợp hơn với nghiệp vụ thật: admin không chỉ đọc bảng, mà phải ra quyết định dựa trên nhiều nguồn dữ liệu trong cùng một màn hình.
