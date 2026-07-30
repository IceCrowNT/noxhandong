# Nghiệp vụ hệ thống BQT An Đồng

Cập nhật: 2026-07-28.

## Mục Tiêu

Hệ thống hỗ trợ BQT An Đồng quản lý thu phí căn hộ, đối soát sao kê ngân hàng, công khai trạng thái đóng phí cho cư dân và xuất tài liệu vận hành.

Mục tiêu không phải thay toàn bộ Excel trong một lần, mà là đưa dữ liệu quan trọng vào DB theo quy trình có kiểm soát, có audit và có khả năng public an toàn.

## Người Dùng

### Cư dân

Cư dân không cần đăng nhập. Có thể:

- Tra cứu trạng thái đóng phí theo mã căn.
- Xem thông báo public mới nhất.
- Xem file thông báo dạng PDF hoặc ảnh.
- Xem đầu mối liên hệ dự án và thông tin chuyển khoản QLVH.
- Bấm góp ý/phản ánh để đi tới Zalo đúng nhóm.

Cư dân không được xem:

- Tên/SĐT cư dân khác.
- Ghi chú nội bộ.
- Raw Excel/sao kê.
- Bằng chứng giao dịch nội bộ.
- Contact staging.

### Nội bộ

Role:

- `SUPER_ADMIN`: toàn quyền.
- `MANAGER`: xem/tra cứu/xuất theo quyền được cấp.
- `TECHNICIAN`: tương tự manager ở các luồng đọc/vận hành.

Các thao tác có rủi ro như import, public batch, duyệt giao dịch, quản lý tài khoản, quản lý thông báo chỉ dành cho quyền phù hợp theo `src/modules/auth/permissions.ts`.

## Dữ Liệu Căn Hộ

- Master có 934 căn trong `can_ho`.
- Mã căn là trục nối giữa phí, liên hệ, giao dịch, bằng chứng và public snapshot.
- Parser mã căn phải chuẩn hóa input tự nhiên trước khi tra cứu/đối soát.

## Tra Cứu Phí Public

Luồng:

```text
Cư dân nhập mã căn
  -> parse input
  -> tìm batch public hiện hành
  -> đọc trang_thai_phi_can_ho_public
  -> hiển thị tháng đã đóng đến
```

Đặc điểm hiện hành:

- Có rate limit cơ bản theo IP trong memory.
- Nếu input mơ hồ và match nhiều căn cùng tiền tố, UI yêu cầu chọn rõ căn.
- Nếu có đóng lẻ tiền, hiển thị cảnh báo nhẹ.
- Public chỉ đọc dữ liệu đã `DA_PUBLIC`.

## Public Footer Và Liên Hệ

Trang public hiện có footer cư dân:

- Đầu mối liên hệ nhanh: kỹ thuật, bảo vệ.
- Dialog danh bạ 8 bộ phận.
- Dialog góp ý/phản ánh mở Zalo theo nhóm vấn đề.
- Thông tin chuyển khoản QLVH.

`app/actions.ts` hiện chỉ là stub server action cho feedback; chưa phải kênh xử lý phản ánh chính thức.

## Thông Báo Công Khai

Admin có thể tạo thông báo public với:

- Tiêu đề.
- Nội dung text.
- File đính kèm PDF hoặc ảnh.
- Trạng thái nháp/công khai/ẩn.

Cư dân xem thông báo trên trang chủ. Viewer:

- ảnh: hiển thị trực tiếp bằng `next/image`;
- PDF: hiển thị bằng `react-pdf` trong dialog full-screen trên mobile.

Nguyên tắc:

- Không upload tài liệu chứa dữ liệu cá nhân nhạy cảm.
- Chỉ thông báo `CONG_KHAI` xuất hiện ngoài public.
- File public phải nằm trong `public/uploads/announcements`.

## Sao Kê Ngân Hàng Và Duyệt Giao Dịch

Luồng:

```text
Import sao kê
  -> lưu raw/canonical
  -> parser gợi ý mã căn
  -> admin review
  -> phân bổ một hoặc nhiều căn
  -> lưu lịch sử phí và bằng chứng
  -> preview/public batch
```

Nguyên tắc:

- Không tự động sửa trạng thái public chỉ vì import sao kê.
- Giao dịch cần quyết định duyệt/từ chối/bảo lưu.
- Bằng chứng có thể là ảnh/PDF/ghi chú.
- Giao dịch đã public cần quy trình rollback riêng, không gỡ tùy tiện.

## Bổ Sung Giao Dịch Quá Khứ

Dùng khi có khoản phí hợp lệ không đi từ sao kê import hoặc cần điều chỉnh.

Nguyên tắc:

- Không tạo `giao_dich_ngan_hang` giả.
- Ghi `bo_sung_giao_dich_qua_khu`.
- Sinh lịch sử phí hợp lệ.
- Public ở batch tiếp theo sau khi preview/chốt.

## Admin Database Và Hồ Sơ Tài Chính Căn Hộ

`/admin/database` là màn tra cứu dữ liệu vận hành và xuất file. Phần hồ sơ tài chính căn hộ hiện có:

- Header căn hộ: mã căn, chủ hộ/liên hệ chính, diện tích.
- Trạng thái đóng phí: chỉ giữ “Đã đóng đến”.
- Lịch sử tài chính dạng bảng compact:
  - thời gian;
  - loại/kỳ phí;
  - nội dung;
  - chứng từ;
  - số tiền.

Không thêm các card tổng quan nếu số liệu chỉ lặp lại dữ liệu trong bảng hoặc không giúp quyết định nghiệp vụ.

## Xuất File Vận Hành

Các file đang có:

- Báo cáo tiến độ phí.
- Sổ tháng FINAL.
- Sao kê tháng.
- Checklist thông báo/cắt điện.
- Word thông báo thu phí/cắt điện.

Export chỉ nên đọc dữ liệu đã chốt hoặc dữ liệu preview có trạng thái rõ, tránh xuất nhầm batch nháp thành tài liệu vận hành.

## Những Điều Không Được Làm Tùy Tiện

- Không public dữ liệu cá nhân ra route cư dân.
- Không sửa tay public snapshot thay cho quy trình preview/public.
- Không xóa DB hoặc file upload thật nếu chưa backup và được duyệt.
- Không import/restore local đè lên production.
- Không thêm parser thứ hai bằng regex riêng trong UI.
- Không để route public đọc raw import hoặc contact staging.
