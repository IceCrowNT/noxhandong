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

## Ghi chú Phase P 2026-05-26

Sau khi MVP đã deploy lên VPS và chạy public tại `https://noxhandong.vn`, hướng phát triển tiếp theo được đề xuất là **Phase P: Import sao kê trực tiếp và đối soát parser**.

Các vấn đề còn treo từ roadmap/checklist cũ:

- Chưa test restore một bản `pg_dump` sang database test.
- Chưa reboot VPS để xác nhận app service `noxh-an-dong`, service `caddy`, PostgreSQL và Scheduled Task backup tự chạy lại sau restart.
- Chưa đổi mật khẩu VPS `Administrator` và mật khẩu Super Admin production; tạm chấp nhận để sau cùng.
- Chưa bàn giao tài khoản Super Admin production cho người/tổ chức cuối cùng.
- Contact master vẫn chưa duyệt hàng loạt; phần lớn số điện thoại còn ở staging/raw Excel.
- Task M mới hoàn thành pipeline nền import sao kê vào DB, chưa đủ để vận hành đối soát sao kê trực tiếp thay Excel.
- Còn nhóm case parser sao kê cần học thêm từ dữ liệu thật 6 tháng gần nhất.
- Roadmap/checklist cần cập nhật lại trạng thái: `Task N` và `Task O` đã đạt MVP, Phase P là giai đoạn tiếp theo.

## Chống trùng giao dịch: mã tham chiếu và fingerprint

Định hướng đã chốt:

- `ma_tham_chieu_ngan_hang` là khóa chống trùng chính nếu file sao kê luôn có và ngân hàng đảm bảo unique.
- Vẫn nên sinh `fingerprint` để audit và fallback khi thiếu mã tham chiếu.
- Fingerprint không làm app nặng đáng kể với quy mô vài nghìn đến vài chục nghìn giao dịch; chi phí đọc Excel và ghi DB lớn hơn nhiều so với hash chuỗi.
- Không nên đưa nội dung giao dịch chuẩn hóa vào fingerprint chính nếu đã có mã tham chiếu, vì nội dung dễ thay đổi dấu/cách viết.

Fingerprint fallback nên dựa trên trường ổn định:

```text
ngày giao dịch + số tiền + chiều tiền vào/ra + mã tham chiếu nếu có
```

Nếu cùng mã tham chiếu nhưng fingerprint khác:

- Không tạo giao dịch mới.
- Đánh dấu nghi vấn `NGHI_VAN_THAY_DOI_DU_LIEU`.
- Cho admin xem raw row để kiểm tra.

## Dữ liệu cần học từ 6 tháng sao kê

Khi có file sao kê 6 tháng gần nhất, cần xử lý theo thứ tự:

1. Đọc raw row, không tự động chốt dữ liệu.
2. Thống kê các mẫu nội dung chuyển khoản thật.
3. Phân nhóm:
   - khớp rõ một căn
   - nhiều căn trong một nội dung
   - không rõ căn
   - không liên quan căn hộ
   - nghi giao dịch nội bộ/chuyển nhầm
   - nghi trùng do export chồng kỳ
4. Sinh báo cáo case parser chưa nhận diện được.
5. Bổ sung rule parser có golden test.
6. Đo tỷ lệ nhận diện theo từng file sao kê.
7. Chỉ sau khi tỷ lệ và false-positive đạt mức chấp nhận mới đưa vào chức năng import web.

## Tính năng admin người dùng đã duyệt cho Phase P

Chỉ thêm các tính năng gọn, trực tiếp phục vụ vận hành:

- Nhật ký đăng nhập gần nhất: thời gian, IP, thiết bị cơ bản.
- Trạng thái tài khoản: đang hoạt động, bị khóa, lần đăng nhập cuối.
- Reset mật khẩu cho tài khoản nội bộ.

Tạm không làm các tính năng thừa ở giai đoạn này:

- bắt buộc đổi mật khẩu lần đầu
- lịch sử thay đổi role chi tiết
- thu hồi toàn bộ session theo từng user
- cấu hình quyền động theo từng role

## So sánh thống kê hiện tại và thống kê rút gọn dự kiến

| Nhóm | Hiện tại đã có trên dashboard/admin | Dự kiến rút gọn Phase P | Nhận xét |
| --- | --- | --- | --- |
| Tổng quan kỳ phí | Có tổng căn, số căn đạt kỳ hiện tại, số căn chưa hoàn thành, thông tin batch T5-2026 | Giữ lại 1 cụm KPI chính: tổng căn, đã hoàn thành, chưa hoàn thành, cắt tháng này/đã cắt | Giữ vì phục vụ vận hành và thuyết trình |
| Phân bố tháng đã đóng đến | Có card/chart phân bố tháng đã đóng đến, hiển thị phần trăm có số lẻ | Giữ 1 chart duy nhất cho 934 căn, nhóm theo mốc tháng/năm, giữ mốc ngoài năm 2026 | Đây là chart giá trị nhất, không nên tách nhỏ |
| Cảnh báo cắt điện | Có logic `Cắt tháng này` và `Đã cắt điện` | Giữ trong nhóm tổng quan kỳ phí, không làm thêm bảng riêng phức tạp | Tránh trùng với danh sách chưa hoàn thành |
| Tra cứu căn hộ | Có tra cứu nội bộ, hiện phí, liên hệ raw/candidate, gọi nhanh | Giữ làm màn thao tác chính; bổ sung giao dịch ngân hàng gần nhất theo căn | Không tính là thống kê, nhưng là chức năng vận hành quan trọng |
| Lịch sử import | Có danh sách/lô import gần đây | Giữ ở trang import, không đưa quá nhiều lên dashboard | Dashboard không nên thành màn audit dài |
| Chất lượng import sao kê | Mới có dữ liệu nền trong DB/script, chưa có dashboard rõ | Thêm 1 cụm: tổng giao dịch, đã khớp căn, chưa nhận diện, nhiều căn, không liên quan | Cần cho Phase P |
| Hiệu quả parser | Có test/parser report rời rạc | Thêm thống kê tỷ lệ parser nhận diện theo từng file sao kê và danh sách case cần bổ sung rule | Đây là lõi Phase P |
| Giao dịch gần nhất theo căn | Chưa có trên dashboard chính | Thêm card read-only trong tra cứu nội bộ | Dùng làm bằng chứng đối chiếu nhanh |
| Tổng tiền theo tháng | Chưa cần | Không làm ngay | Dễ trùng với báo cáo kế toán, để sau |
| Biểu đồ quá nhiều loại | Một số card/chart đang thiên về demo/thuyết trình | Rút còn 3 nhóm chính: kỳ phí, parser/sao kê, giao dịch gần nhất | Giảm rối dashboard |

## Session đăng nhập admin

Hiện tại session admin đang có hạn ngắn để giảm rủi ro bảo mật. Nhu cầu mới: admin nội bộ muốn duy trì đăng nhập lâu dài vì số người dùng ít và không cần audit quá sâu.

Đề xuất kỹ thuật:

- Không gọi là "vĩnh viễn" tuyệt đối, vì cookie có thể mất khi đổi trình duyệt, xóa cookie, đổi `ADMIN_SESSION_SECRET`, hoặc đổi domain.
- Nên đặt thời hạn dài, ví dụ `180 ngày` hoặc `365 ngày`.
- Có thể đưa thời hạn vào biến môi trường `ADMIN_SESSION_MAX_AGE_DAYS`.
- Cookie vẫn phải là `HttpOnly`, `SameSite=Lax`, `Secure` trên HTTPS.
- Logout thủ công vẫn xóa cookie.

Mức đề xuất cho project này:

```text
ADMIN_SESSION_MAX_AGE_DAYS=365
```

## Cập nhật 2026-05-26: Zalo, nhập tay và bằng chứng đối soát

Đã tách nghiệp vụ chi tiết sang file:

- [doi-soat-sao-ke-va-bang-chung.md](doi-soat-sao-ke-va-bang-chung.md)

Nguyên tắc đã chốt ở mức backlog:

- Giao dịch Zalo/không rõ căn không được tự suy đoán quá mạnh.
- Admin nhập tay sau khi liên hệ cư dân hoặc xem ảnh sao kê cư dân gửi.
- Ảnh Zalo/chứng từ cần được lưu theo căn, ngày giao dịch, số tiền và mã giao dịch ngân hàng nếu có.
- Giai đoạn hiện tại chỉ sinh report đối soát, chưa tự động sửa trạng thái phí public.
