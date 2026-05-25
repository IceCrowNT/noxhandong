# Backlog đối soát sao kê ngân hàng

File này lưu các ý tưởng và yêu cầu cho giai đoạn đối soát sao kê ngân hàng. Đây là backlog Phase 2, không chặn bản deploy public lookup đầu tiên.

## Ý tưởng: card giao dịch gần nhất theo căn hộ

Khi admin/manager tra cứu một căn hộ trong `/admin/dashboard`, hệ thống nên hiển thị thêm một card nội bộ:

**Giao dịch ngân hàng gần nhất**

Mục tiêu:

- Tăng độ tin cậy khi kiểm tra tình trạng đóng phí.
- Cho manager/kỹ thuật có bằng chứng đối chiếu nhanh khi cần gọi cư dân.
- Hỗ trợ thuyết trình dự án bằng dữ liệu thực tế: trạng thái phí + giao dịch đối chiếu gần nhất.

## Dữ liệu nên hiển thị

- Ngày giao dịch.
- Số tiền.
- Nội dung gốc sao kê.
- Nội dung chuẩn hóa.
- Mã căn parser nhận diện.
- Trạng thái duyệt/phân bổ.
- Mã tham chiếu ngân hàng nếu có.
- File/lô import sao kê.
- Số lần giao dịch này xuất hiện nếu bị import trùng.

## Nguyên tắc nghiệp vụ

- Chỉ hiển thị trong vùng admin/manager, không public cho cư dân.
- Public lookup vẫn lấy trạng thái phí từ batch Excel đã chốt, không lấy trực tiếp từ sao kê.
- Ưu tiên hiển thị giao dịch đã duyệt/phân bổ.
- Nếu chưa có giao dịch đã duyệt, có thể hiển thị giao dịch parser nghi ngờ gần nhất nhưng phải ghi rõ `Chưa duyệt`.
- Nếu có sao kê trùng, chỉ hiển thị một giao dịch đại diện và báo số lần xuất hiện.
- Không dùng card này để tự động sửa trạng thái phí public trong giai đoạn đầu.

## Dữ liệu đầu vào cần có

Để xây dựng và test tốt, cần một hoặc nhiều file sao kê thật dài, càng đa dạng nội dung càng tốt:

- Nhiều tháng giao dịch.
- Có giao dịch đúng mã căn.
- Có giao dịch thiếu/sai mã căn.
- Có giao dịch nhiều căn trong một nội dung.
- Có giao dịch không liên quan phí căn hộ.
- Có giao dịch trùng do export chồng kỳ.
- Có giao dịch số tiền lẻ.
- Có nội dung chuyển khoản chỉ có tên cư dân, không có mã căn.

## Bảng/logic liên quan

Dự kiến đọc từ:

- `giao_dich_ngan_hang`
- `phan_bo_giao_dich`
- `duyet_giao_dich`
- `lo_nhap_du_lieu`

Điều kiện kỹ thuật cần làm trước khi vận hành thật:

- Thêm unique constraint cho phân bổ giao dịch/căn hộ.
- Bọc import sao kê và phân bổ trong transaction.
- Không reset trạng thái duyệt khi re-import sao kê cũ.
- Đồng bộ parser mã căn giữa web và script.

## Trạng thái

- Trạng thái hiện tại: backlog Phase 2.
- Mức ưu tiên: nên làm sau khi public lookup và import/chốt Excel phí đã ổn định.
- Có thể làm bản read-only trước: chỉ hiển thị giao dịch gần nhất, chưa cho duyệt/sửa ngay trong card.
