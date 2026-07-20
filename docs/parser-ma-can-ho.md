# Parser mã căn hộ (Thuật toán lõi)

Tài liệu này định nghĩa nguyên tắc hoạt động, bảo trì và các test case cốt lõi cho bộ nhận diện mã căn tự động (Parser).

## 1. Vai trò

Parser mã căn hộ là thuật toán lõi duy nhất nằm tại: `src/modules/transactions/parser/apartment-parser.ts`.

Nó được dùng chung cho tất cả các luồng nghiệp vụ:
- Public lookup (cư dân tra cứu).
- Parse nội dung sao kê (tự động nhận dạng mã căn từ nội dung chuyển khoản).
- Import dữ liệu Excel vận hành.
- Gợi ý khớp giao dịch/căn hộ.

Mục tiêu của parser không phải chỉ nhận đúng format chuẩn như `L4B.124`, mà phải hiểu được "ngôn ngữ tự nhiên" của cư dân:
- Viết thiếu dấu chấm (`L1115`).
- Dùng khoảng trắng, gạch ngang, gạch chéo (`L1 115`, `L1-115`, `L1/115`).
- Dùng từ khóa (`căn 124 lô 4b`, `phòng 305 tòa L3`).
- Đảo thứ tự (`311A L4A`).

## 2. Quan hệ với các module khác

Parser chỉ làm đúng một việc: **Từ chuỗi Text thô -> Trả ra Mã Căn Hợp Lệ (hoặc danh sách ứng viên) kèm điểm tin cậy.**

Nó KHÔNG tự tiện quyết định:
- Có nên nạp giao dịch này vào hệ thống hay không (Nhiệm vụ của `filter-rules`).
- Giao dịch này có chắc chắn thuộc về căn này không (Nhiệm vụ của tính năng `Gợi ý` & sự xác nhận của `Admin` qua màn hình Duyệt Sao Kê).

## 3. Quản lý và Bảo trì Thuật Toán

Đây là module cực kỳ nhạy cảm, chỉ 1 sửa đổi nhỏ có thể làm sai lệch hàng ngàn giao dịch. 

**Tuyệt đối tuân thủ quy trình sau khi nâng cấp thuật toán:**

1. **Một nguồn thuật toán duy nhất:** Không tạo thêm parser khác trong code. Mọi nâng cấp phải thực hiện trên file `apartment-parser.ts` duy nhất.
2. **Duy trì Golden Test Set:** Mọi input rác/chưa nhận diện được từ thực tế (sao kê thật) phải được gom thành test case và đặt vào `lib/parser/apartment-parser.test.ts`. 
3. **Blacklist / False-positive:** Parser phải được lập trình để KHÔNG nhận nhầm các dãy số dài (như số điện thoại, số tài khoản, mã GD, ngày tháng) thành mã căn.
4. **Không tự quyết các ca khó (Ambiguous):** Ví dụ giao dịch ghi `L4B 425/426` (đóng cho 2 nhà) hoặc `4B 124` (thiếu ký tự L). Parser chỉ được phép trả về danh sách ứng viên (Multi-candidates) để Admin duyệt bằng tay, KHÔNG được phép tự động Map (Auto-map).

## 4. Backlog / Danh sách các mẫu input thực tế

Dưới đây là tập hợp một số mẫu input điển hình mà Parser hiện tại đang hỗ trợ hoặc cần đưa vào danh sách theo dõi:

| # | Input mẫu | Kỳ vọng | Nhóm |
| --- | --- | --- | --- |
| 1 | `L1.115` | `L1.115` | Chuẩn |
| 2 | `l1.115` | `L1.115` | Chữ thường |
| 3 | `L1 115`, `L1-115`, `L1/115` | `L1.115` | Dấu ngăn cách |
| 4 | `L1115` | `L1.115` | Viết liền (Compact) |
| 5 | `căn hộ L1.115` | `L1.115` | Tiếng Việt có dấu |
| 6 | `311A L4A` | `L4A.311A` | Đảo thứ tự |
| 7 | `căn 124 lô 4b` | `L4B.124` | Dùng từ khóa Lô / Căn |
| 8 | `L4C.506B` | `L4C.506B` | Căn có Suffix (B, C, F) |
| 9 | `LK2.24`, `IK2-24` | `LK2.24` | Liền kề / Nhầm chữ I và L |
| 10 | `LKV.45` | `LKV.45` | Căn LKV (Villa) |
| 11 | `L1315nop` | `L1.315` | Cố ý dính chữ (không nhận thành L1.315N) |
| 12 | `L4B 412 phi qlvh` | `L4B.412` | Kèm nghiệp vụ |
| 13 | `L2 phong 307 0912435236` | `L2.307` | Tránh nhận số điện thoại |
| 14 | `lô hai 306` | `L2.306` | Dùng chữ thay số cho Lô |
| 15 | `L4B 425/426` | `Cần review` | Đóng 2 căn |
| 16 | `0906123456`, `116002961023` | `Khước từ` | Số ĐT / STK |
