# Thiết kế Cơ sở Dữ liệu (Database)

Tài liệu này phản ánh cấu trúc và luồng hoạt động của cơ sở dữ liệu hiện hành. 

*Nguồn sự thật duy nhất (Source of Truth) cho cấu trúc bảng nằm tại file `prisma/schema.prisma`.*

## 1. Nguyên tắc cốt lõi

1. Bảng `can_ho` là bảng Master quản lý toàn bộ 934 căn hộ.
2. Dữ liệu nạp từ file Excel T5/2026 (Opening Balance) được xem là mốc quá khứ chuẩn, chốt sổ đến 23:59:00 ngày 31/05/2026.
3. Từ Tháng 6/2026 trở đi, Sao kê ngân hàng được nạp vào DB lưu theo hai lớp:
   - **Lớp thô (Raw/Canonical):** Lưu vết bất biến để audit, chống trùng lặp, dùng để huấn luyện/chỉnh sửa bộ Parser.
   - **Lớp vận hành (Operational):** Nơi ghi nhận trạng thái đã duyệt hay chưa, phân bổ tiền như thế nào.
4. Trạng thái của một giao dịch (Chưa duyệt, Đã duyệt, Bị từ chối, Bảo lưu) chỉ nằm ở một nguồn duy nhất: bảng `giao_dich_ngan_hang`.
5. Dữ liệu hiển thị ra trang Public cho cư dân xem KHÔNG đọc trực tiếp từ các giao dịch đang duyệt mà chỉ đọc từ một Snapshot (Batch) đã được Ban Quản Trị chốt (Publish).

## 2. Luồng xử lý Sao kê & Ghi nhận Phí

Khi File sao kê mới được tải lên, dữ liệu sẽ đi qua các bảng theo thứ tự sau:

`lo_nhap_du_lieu` -> `dong_sao_ke_tho` -> `giao_dich_sao_ke_tho_chuan` -> `giao_dich_ngan_hang` -> `phan_bo_giao_dich` -> `lich_su_dong_phi_can_ho` -> `trang_thai_phi_can_ho_public`

### Giải nghĩa 4 Bảng Vận Hành Trung Tâm:

#### 2.1. `giao_dich_ngan_hang`
- Đây là bảng giao dịch vận hành chính, sinh ra từ việc Import Sao kê.
- Lưu giữ kết quả tự động Parser (ví dụ: máy đoán đây là căn `L1.201`) và trạng thái duyệt thủ công của Admin.
- Một giao dịch tại đây có thể: Chưa duyệt, Duyệt cho 1 căn, Duyệt chia tiền cho nhiều căn, Bảo lưu, hoặc Từ chối (vì là rác).
- **Chú ý:** Tuyệt đối không tự chèn tay các giao dịch cũ vào bảng này nếu chúng không đến từ một file sao kê thực tế. 

#### 2.2. `phan_bo_giao_dich`
- Là bảng định tuyến "Một giao dịch được chia cho các căn nào và mỗi căn bao nhiêu tiền".
- Giao dịch được duyệt nhanh cho 1 căn -> sinh ra 1 dòng phân bổ. Giao dịch được duyệt cho nhiều căn -> sinh ra nhiều dòng phân bổ.

#### 2.3. `lich_su_dong_phi_can_ho`
- Lưu giữ các khoản phí đã được "Ghi nhận chính thức" vào lịch sử của căn hộ.
- Mỗi dòng ở đây là kết quả của một "Quyết định nghiệp vụ" (Admin ấn Duyệt hoặc Admin tạo giao dịch Bổ sung/Điều chỉnh), chứ không đơn thuần chỉ là dữ liệu thô.
- Bảng này đóng vai trò là "Hàng đợi": Chứa các dòng lịch sử đã duyệt nhưng chưa được Public. Khi Super Admin ấn "Chốt Public", các dòng này sẽ được gom lại và gắn ID để chứng minh chúng đã thuộc về một Batch Public nào đó.

#### 2.4. `trang_thai_phi_can_ho_public`
- Đây là bảng Snapshot lưu trữ kết quả cuối cùng để hiển thị cho cư dân tra cứu (luôn luôn có 934 dòng tương ứng với 934 căn trong 1 Batch).
- Không chứa bất kỳ logic tính toán rườm rà nào, chỉ hiển thị số dư, tháng đã đóng đến, để đảm bảo tốc độ Load cho trang Public cực kỳ nhanh.

## 3. Quản lý Danh Bạ Liên Hệ

| Bảng | Vai trò |
| --- | --- |
| `can_ho` | Thông tin Master của 934 căn hộ (mã căn, diện tích, phân khu). |
| `ung_vien_lien_he_can_ho` | Danh bạ rác / Dữ liệu tạm (Staging) được nạp từ các file Excel cũ, cần kiểm duyệt. |
| `lien_he_can_ho` | Danh bạ chính thức, đã được chuẩn hóa. Admin gọi điện, nhắn tin, tính toán cắt điện đều dựa trên số liệu này. |

## 4. Bổ sung giao dịch quá khứ (Điều chỉnh)

Khi cần xử lý các khoản phí "Nằm ngoài sao kê", "Bị sót", hoặc "Chuyển nhầm":
- **KHÔNG:** Sửa tay trực tiếp số tháng trên bảng Public.
- **KHÔNG:** Nhét thêm dòng giả mạo vào bảng `giao_dich_ngan_hang`.
- **LUÔN LUÔN:** Dùng tính năng Tạo giao dịch Bổ sung. Dữ liệu sẽ lưu qua bảng `bo_sung_giao_dich_qua_khu` kèm bằng chứng/ảnh chụp/giải trình -> Hệ thống tự sinh ra một dòng hợp lệ vào `lich_su_dong_phi_can_ho` -> Số tiền này sẽ được cộng gộp trong lần Chốt Public tiếp theo.
