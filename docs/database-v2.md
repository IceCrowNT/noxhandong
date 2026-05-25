# Database V2

## Liên kết xương sống

- Mục lục tài liệu: [README.md](README.md)
- Handoff hiện tại: [handoff.md](handoff.md)
- Roadmap control: [roadmap.md](roadmap.md)
- Checklist nghiệm thu: [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md)
- Schema tương ứng: [../prisma/schema-v2.prisma](../prisma/schema-v2.prisma)

## Mục tiêu

Database V2 sửa lại trọng tâm của V1 theo đúng nghiệp vụ thực tế:

- lấy **căn hộ** làm trung tâm
- quản lý **đầu mối liên hệ của căn hộ**
- không cố ép dữ liệu bẩn thành mô hình dân cư quá sâu
- parse và review dữ liệu liên hệ trước khi đổ vào bảng chuẩn
- dùng tên bảng/cột tiếng Việt không dấu để dễ review
- dùng `id` số tự tăng để dễ đối chiếu trong DB

V2 phù hợp hơn với mục tiêu thật của hệ thống hiện tại:

- tìm ai để gọi điện
- tìm số nào để nhắn tin / gửi thông tin đóng phí
- biết ai là đầu mối chính của căn

## Tư tưởng thiết kế

### 1. Không lấy `cu_dan` làm trung tâm quá sớm

Dữ liệu Excel hiện tại không đủ sạch để xác định chuẩn:

- ai là chủ hộ pháp lý
- ai là vợ/chồng/con
- ai là khách thuê
- ai là đồng sở hữu

Nếu cố đi theo mô hình dân cư “đẹp” quá sớm, hệ thống sẽ:

- phức tạp
- khó import
- dễ sai

Vì vậy V2 chuyển sang:

- `can_ho`
- `lien_he_can_ho`
- `ung_vien_lien_he_can_ho`

### 2. Một căn có nhiều đầu mối liên hệ

Ví dụ:

- chủ hộ chính
- người liên quan 1
- người liên quan 2
- nhóm tên dùng chung một số điện thoại

Đây là cách phù hợp với mục tiêu thu phí hơn là phân loại quan hệ hộ gia đình.

### 3. Không xóa dữ liệu gốc

V2 vẫn giữ:

- raw gốc
- parsed staging
- review

Chỉ sau khi review xong mới đổ vào bảng master.

## Giải thích về ID hiện tại

Trong V1, `id` có dạng:

- `cmo42x...`

Đây là `cuid()` do Prisma tạo, không phải mã hóa.

Với cách review dữ liệu thủ công, loại ID này bất tiện vì:

- khó nhìn
- khó đối chiếu giữa các bảng

Vì vậy V2 dùng:

- `id integer generated always as identity`

## Các bảng chính

## 1. `can_ho`

Bảng master căn hộ.

Các cột chính:

- `id`
- `ma_can`
- `loai_can`
- `ma_lo`
- `ma_so`
- `dien_tich_m2`
- `toa_lo_goc`
- `loai_hinh_goc`
- `chu_ho_ten_goc`
- `trang_thai_su_dung_goc`
- `tinh_trang_goc`
- `trang_thai`
- `ghi_chu`
- `ngay_tao`
- `ngay_cap_nhat`

Ghi chú:

- Mã liền kề trong dữ liệu thật hiện gồm `LK1.*`, `LK2.*`, `LKV.*`
- Các mã này vẫn giữ nguyên `ma_can`
- nhưng `loai_can = LIEN_KE`

## 2. `lien_he_can_ho`

Bảng contact master theo căn hộ.

Mỗi record là một đầu mối liên hệ có thể dùng để:

- gọi điện
- nhắn tin
- gửi thông tin đóng phí

Các cột chính:

- `id`
- `can_ho_id`
- `ten_hien_thi`
- `so_dien_thoai`
- `la_lien_he_chinh`
- `nhan_thong_bao`
- `zalo_link`
- `vai_tro_lien_he`
- `trang_thai_lien_he`
- `thu_tu_uu_tien`
- `nguon_du_lieu`
- `nguon_dong_du_lieu_tho_id`
- `co_can_ra_soat`
- `ghi_chu`
- `ngay_tao`
- `ngay_cap_nhat`

Giải thích:

- `ten_hien_thi` có thể là một người:
  - `Chị Bích`
- hoặc một nhóm tên dùng chung một số:
  - `Hiếu/ Mỹ Linh`

## 3. `quy_tac_phi`

Thay cho `FeeRule`.

Các cột chính:

- `id`
- `loai_can`
- `ma_phi`
- `so_tien`
- `hieu_luc_tu_ngay`
- `hieu_luc_den_ngay`
- `dang_ap_dung`
- `ghi_chu`

Seed ban đầu:

- `CHUNG_CU` + `QLVH` = `250000`
- `LIEN_KE` + `QLVH` = `200000`

## 4. `lo_nhap_du_lieu`

Thay cho `ImportBatch`.

Các cột chính:

- `id`
- `loai_nguon`
  - `WORKBOOK_QUAN_LY`
  - `SAO_KE_NGAN_HANG`
  - `CHUNG_TU`
- `ten_file`
- `ma_bam_file`
- `so_dong`
- `trang_thai`
- `tong_quan_loi`
- `metadata_json`
- `thoi_diem_nhap`

## 5. `dong_du_lieu_quan_ly_tho`

Thay cho `RawManagementRow`.

Các cột chính:

- `id`
- `lo_nhap_du_lieu_id`
- `ten_sheet`
- `so_dong_nguon`
- `loai_dong`
- `header_values_json`
- `values_json`
- `mapped_row_json`
- `payload_json`
- `ngay_tao`

Điểm mới:

- giữ raw gốc
- đồng thời lưu `mapped_row_json` để dễ audit

## 6. `ung_vien_lien_he_can_ho`

Đây là bảng staging quan trọng nhất của V2.

Mỗi record là một candidate đầu mối liên hệ parse ra từ dữ liệu Excel.

Các cột chính:

- `id`
- `lo_nhap_du_lieu_id`
- `dong_du_lieu_tho_id`
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
- `trang_thai_duyet`
- `ghi_chu_duyet`
- `ngay_tao`
- `ngay_cap_nhat`

Ví dụ:

Từ ô:

- `Trương Thành Trung/(0933.456.655/0932.223.638-Chị Bích.)`
- `Hiếu / Mỹ Linh 0794115765`
- `Thanh toán theo tháng: cứ cuối tháng sẽ nộp`

có thể sinh ra:

- `Trương Thành Trung` / `0933456655` / `la_lien_he_chinh_du_doan = true`
- `Chị Bích` / `0932223638`
- `Hiếu/ Mỹ Linh` / `0794115765`

và ghi chú nghiệp vụ:

- `Thanh toán theo tháng: cứ cuối tháng sẽ nộp`

## 7. `dong_sao_ke_tho`

Thay cho `RawBankStatementRow`.

Các cột chính:

- `id`
- `lo_nhap_du_lieu_id`
- `so_dong_nguon`
- `header_values_json`
- `values_json`
- `mapped_row_json`
- `payload_json`
- `ngay_tao`

## 7B. `tai_khoan_quan_tri`

Bảng tài khoản quản trị nội bộ.

Vai trò ban đầu:

- `SUPER_ADMIN`
- `MANAGER`
- `TECHNICIAN`

Các cột chính:

- `id`
- `ten_dang_nhap`
- `so_dien_thoai`
- `email`
- `mat_khau_hash`
- `vai_tro`
- `trang_thai`
- `ten_hien_thi`
- `lan_dang_nhap_cuoi`
- `ngay_tao`
- `ngay_cap_nhat`

Quy tắc:

- `SUPER_ADMIN` có toàn quyền: import/chốt batch dữ liệu public, duyệt/từ chối liên hệ, tạo/khóa/mở khóa/đổi vai trò tài khoản quản trị.
- `SUPER_ADMIN` có thể tạo thêm tài khoản `SUPER_ADMIN`, `MANAGER`, hoặc `TECHNICIAN` từ UI `/admin/accounts`; không cần tạo admin trực tiếp trong DB ở vận hành bình thường.
- `MANAGER` chỉ được tra cứu nội bộ, xem liên hệ cư dân/dữ liệu gốc, gọi nhanh cư dân và quản lý tài khoản cá nhân.
- `TECHNICIAN` dùng cho đội kỹ thuật, quyền hiện tại ngang `MANAGER`: tra cứu nội bộ, xem liên hệ cư dân/dữ liệu gốc, gọi nhanh cư dân và quản lý tài khoản cá nhân.
- `MANAGER` và `TECHNICIAN` không được import/chốt phí, duyệt/từ chối liên hệ, tạo tài khoản hoặc đổi phân quyền.
- `so_dien_thoai` là số đã chuẩn hóa, dùng được để đăng nhập admin/manager.
- Mỗi tài khoản quản trị có trang hồ sơ riêng để tự đổi `ten_hien_thi`, `email`, và `mat_khau_hash` thông qua đổi mật khẩu.
- Không export hoặc hiển thị `mat_khau_hash` trong file Excel vận hành.

## 7C. `dong_theo_doi_thu_phi_tho`

Bảng staging cho file Excel theo dõi thu phí thủ công.

Mục tiêu:

- giữ raw/mapped row từ workbook thu phí
- đọc cột `Tháng đã đóng đến hiện tại`
- không public trực tiếp dữ liệu nháp

Các cột chính:

- `id`
- `lo_nhap_du_lieu_id`
- `ten_sheet`
- `so_dong_nguon`
- `header_values_json`
- `values_json`
- `mapped_row_json`
- `ma_can`
- `thang_da_dong_den_hien_tai`
- `payload_json`
- `ngay_tao`

## 7D. `batch_trang_thai_phi_public`

Bảng batch dữ liệu phí đã import/chốt để public cho cư dân.

Các trạng thái:

- `NHAP`
- `DA_KIEM_TRA`
- `DA_PUBLIC`
- `HUY`

Các cột chính:

- `id`
- `lo_nhap_du_lieu_id`
- `ky_du_lieu`
- `ten_file_nguon`
- `trang_thai`
- `la_batch_public_hien_hanh`
- `tong_so_can`
- `tong_quan_loi`
- `metadata_json`
- `nguoi_public_id`
- `public_luc`
- `ngay_tao`
- `ngay_cap_nhat`

Quy tắc:

- Chỉ batch `DA_PUBLIC` và `la_batch_public_hien_hanh = true` được trang public đọc.
- Batch nháp không được hiển thị cho cư dân.

## 7E. `trang_thai_phi_can_ho_public`

Bảng snapshot trạng thái phí public theo căn hộ.

Đây là bảng duy nhất trang public cư dân nên đọc.

Các cột chính:

- `id`
- `batch_id`
- `can_ho_id`
- `ma_can`
- `thang_da_dong_den_hien_tai`
- `ky_du_lieu`
- `ghi_chu_public`
- `payload_public_json`
- `ngay_tao`

Không lưu ở đây:

- số điện thoại
- CCCD
- thường trú
- ghi chú nội bộ
- ghi chú gốc Excel chưa duyệt

## 8. `giao_dich_ngan_hang`

Thay cho `BankTransaction`.

Các cột chính:

- `id`
- `lo_nhap_du_lieu_id`
- `van_tay_giao_dich`
- `tham_chieu_ngan_hang`
- `ngay_giao_dich`
- `so_tien`
- `noi_dung_goc`
- `noi_dung_chuan_hoa`
- `ten_nguoi_chuyen`
- `tai_khoan_nguoi_chuyen`
- `ma_giao_dich_text`
- `payload_goc_json`
- `ngay_tao`
- `ngay_cap_nhat`

## 9. `ket_qua_parse_giao_dich`

Thay cho `TransactionParseResult`.

Rule parser mã căn, nguồn case và quy trình bảo trì nằm tại [parser-ma-can-ho.md](parser-ma-can-ho.md). Bảng này phải lưu đủ dấu vết để biết một kết quả parse được sinh bởi version/rule nào.

Các cột chính:

- `id`
- `giao_dich_ngan_hang_id`
- `phien_ban_parser`
- `ma_can_parse`
- `trang_thai_khop`
- `ly_do_khop`
- `do_tin_cay`
- `la_giao_dich_noi_bo`
- `ngay_tao`
- `ngay_cap_nhat`

## 10. `ung_vien_khop_giao_dich`

Thay cho `TransactionCandidate`.

Các cột chính:

- `id`
- `ket_qua_parse_giao_dich_id`
- `ma_can`
- `diem`
- `ly_do`
- `thu_hang`
- `ngay_tao`

## 11. `duyet_giao_dich`

Thay cho `TransactionReview`.

Các cột chính:

- `id`
- `giao_dich_ngan_hang_id`
- `trang_thai_duyet`
- `ma_can_duoc_chon`
- `ghi_chu_duyet`
- `nguoi_duyet`
- `ngay_duyet`

## 12. `phan_bo_giao_dich`

Thay cho `TransactionAllocation`.

Các cột chính:

- `id`
- `giao_dich_ngan_hang_id`
- `can_ho_id`
- `so_tien_phan_bo`
- `cach_phan_bo`
- `ghi_chu`
- `ngay_tao`

## 13. `ngoai_le_giao_dich`

Thay cho `ExceptionCase`.

Các cột chính:

- `id`
- `giao_dich_ngan_hang_id`
- `can_ho_id`
- `loai_ngoai_le`
- `trang_thai`
- `ghi_chu`
- `nguoi_xu_ly`
- `ngay_tao`
- `ngay_cap_nhat`

## Luồng dữ liệu V2

### 1. Import workbook quản lý

Nguồn:

- `Danh sách khách hàng`
- `Lịch sử đóng phí`

Đích:

- `lo_nhap_du_lieu`
- `dong_du_lieu_quan_ly_tho`

### 2. Parse contact theo căn

Đích:

- `ung_vien_lien_he_can_ho`

### 3. Review

Sau review mới đổ vào:

- `can_ho`
- `lien_he_can_ho`

### 4. Import sao kê

Đích:

- `dong_sao_ke_tho`
- `giao_dich_ngan_hang`
- `ket_qua_parse_giao_dich`
- `ung_vien_khop_giao_dich`
- `duyet_giao_dich`
- `phan_bo_giao_dich`

### 5. Import file theo dõi thu phí public

Nguồn:

- file Excel theo dõi thu phí đang được vận hành thủ công
- cột `Tháng đã đóng đến hiện tại`

Đích staging:

- `lo_nhap_du_lieu`
- `dong_theo_doi_thu_phi_tho`

Đích public sau khi Super Admin chốt:

- `batch_trang_thai_phi_public`
- `trang_thai_phi_can_ho_public`

Trang public cư dân chỉ đọc snapshot đã chốt, không đọc raw workbook.

## Kết luận

V2 theo hướng contact-centric phù hợp hơn với mục tiêu thật của hệ thống:

- gọi đúng người
- nhắn đúng số
- biết căn có những đầu mối liên hệ nào

Nó thực dụng hơn và bám dữ liệu Excel thật hơn mô hình dân cư quá sâu.
