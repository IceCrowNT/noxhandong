# Design system

Cập nhật: 2026-07-28.

## Vai Trò

File này là xương sống UI/UX của project. Khi thay đổi public page, admin dashboard, màn database, dialog thông báo, form import hoặc component pattern, cập nhật file này cùng `docs/handoff.md`.

## Tinh Thần Thiết Kế

Hướng chính: **civic utility**. Giao diện phải giống công cụ vận hành tin cậy, rõ ràng, không giống landing page quảng cáo.

Nguyên tắc:

- Public: cư dân hiểu được trạng thái phí trong vài giây.
- Admin: ưu tiên scan dữ liệu, so sánh, thao tác lặp lại.
- Không thêm card/chỉ số nếu không giúp quyết định nghiệp vụ.
- Không lồng card trong card nếu chỉ để trang trí.
- Không dùng orb/blob/gradient phức tạp.
- Không public dữ liệu cá nhân nhạy cảm.

## Token Và Stack UI

- Tailwind CSS v4.
- Component nền ở `components/ui`: `button`, `input`, `card`, `table`, `dialog`, `select`, `notice`, `submit-button`.
- Admin dùng `AdminFrame`.
- Public dùng chung token màu trong `app/globals.css`, có ảnh nền cư dân.
- PDF public dùng `react-pdf`, load client-only.

Token chính:

| Token | Vai trò |
| --- | --- |
| `--bg` | nền trang |
| `--panel`, `--panel-strong` | surface/card |
| `--line` | border |
| `--text`, `--muted` | chữ chính/phụ |
| `--accent`, `--accent-soft` | brand/action/trạng thái tốt |
| `--success`, `--danger`, `--warning` | trạng thái |

## Public UI

### Trang chủ `/`

Thành phần hiện hành:

- Header brand `BQT An Đồng` và link `Quản trị`.
- Card tra cứu phí.
- Danh sách tối đa 3 thông báo public mới nhất.
- Footer cư dân gồm đầu mối liên hệ, danh bạ, góp ý/Zalo và thông tin chuyển khoản.

Quy tắc:

- Tra cứu phí vẫn là tác vụ chính.
- Thông báo và footer là vùng phụ, không được lấn át form tra cứu.
- Trên mobile, dialog thông báo nên full-screen hoặc gần full-screen để đọc PDF/ảnh.

### Trang tra cứu `/tra-cuu-phi`

Kết quả thành công cần có:

- Mã căn rõ.
- Trạng thái đóng phí nổi bật.
- Kỳ dữ liệu và thời điểm public.
- Cảnh báo đóng lẻ nếu có.

Không hiển thị:

- Tên/SĐT cư dân.
- Bằng chứng giao dịch.
- Raw nội dung sao kê.

### Thông báo public

- Card danh sách trên trang chủ phải ngắn, dễ bấm.
- Dialog ảnh dùng vùng xem lớn, object-contain.
- Dialog PDF dùng `react-pdf`, không iframe PDF cũ.
- Nếu file không phải ảnh thì mặc định xem như PDF/tài liệu; phải có trạng thái loading/error rõ.

## Admin UI

Admin là công cụ vận hành, không phải dashboard trình diễn.

Quy tắc:

- Mật độ thông tin cao nhưng phải có phân cấp.
- Dùng bảng cho dữ liệu dạng dòng nghiệp vụ trên desktop.
- Mobile có thể chuyển bảng sang card/list, nhưng không làm overflow ngang toàn trang.
- Card chỉ dùng cho nhóm chức năng, trạng thái quan trọng, form, modal hoặc item lặp lại có ý nghĩa.
- Không thêm KPI/card nếu số liệu chỉ lặp lại dữ liệu kế bên hoặc không tạo hành động.

## Màn `/admin/dashboard`

Mục tiêu: tra cứu nội bộ nhanh cho quản lý/kỹ thuật, gồm một căn hoặc nhiều căn.

### Tra cứu nhiều căn

- Đặt trong cụm `Tra cứu nội bộ`, không đưa sang `/admin/database`.
- Input là danh sách mã căn tự do, hỗ trợ kiểu `L1 217`, `L1.217`, `L1217`, xuống dòng hoặc cách nhau bằng dấu phẩy.
- Bộ chọn khoảng tháng chỉ gồm `6 tháng` và `12 tháng`; cột tháng luôn lùi từ tháng tra xét hiện tại.
- Output là bảng shadcn/ui `Table`, không dùng KPI/card tổng hợp.
- Mỗi căn là một dòng. Nếu một căn có nhiều giao dịch trong cùng tháng, hiển thị nhiều dòng số tiền trong cùng ô, không cộng gộp.
- Mỗi số tiền là nút mở chi tiết giao dịch bằng `Sheet`/dialog cùng theme, hiển thị thời gian đóng, nội dung chuyển khoản và bằng chứng ảnh/file/text nếu có.
- Không có dòng tổng cộng, không có ghi chú, không có xuất Excel.
- Cột cuối bắt buộc là `Tháng đã đóng đến`.
- Desktop dùng bảng rộng có cuộn ngang trong khung; mobile nằm trong tab riêng để tránh làm tràn toàn trang.

## Màn `/admin/database`

Mục tiêu: tra cứu dữ liệu tài chính căn hộ và xuất file vận hành.

Hồ sơ tài chính căn hộ hiện hành:

- Header: căn hộ, chủ hộ/liên hệ chính, diện tích.
- Trạng thái đóng phí: chỉ giữ `Đã đóng đến`.
- Lịch sử tài chính: bảng compact.

Cột bảng khuyến nghị:

- `Thời gian`
- `Loại / kỳ phí`
- `Nội dung`
- `Chứng từ`
- `Số tiền`

Quy tắc riêng:

- Không dùng timeline dài nếu dữ liệu cần scan nhanh.
- Không hiển thị các card tổng quan như tổng tiền/chứng từ nếu chưa có nghiệp vụ đối chiếu rõ.
- Nội dung giao dịch dài dùng `line-clamp` hoặc vùng mở rộng có chủ đích.
- Chứng từ là link/nút gọn; không render thumbnail lớn trong bảng.

## Màn Import

- Form import dùng `ClientActionForm` nếu cần giữ trạng thái client sau submit server action.
- Nút import dài hạn dùng `ImportProgressButton`.
- Sau submit, nút có thể giữ trạng thái “Đang xử lý dữ liệu...” để tránh người dùng bấm lại trong lúc redirect/reload.
- Luôn hiển thị cảnh báo khi thao tác chốt public trực tiếp.

## Màn Duyệt Sao Kê

- Giữ mô hình master/detail hoặc vùng thao tác rõ.
- Nội dung chuyển khoản phải wrap, không tràn khung.
- Gợi ý parser là gợi ý, không thay quyết định duyệt.
- Phân bổ nhiều căn phải hiển thị tổng đã phân bổ/còn thiếu/vượt.
- Bằng chứng ảnh/PDF nên mở trong dialog hoặc link riêng, không phá layout chính.

## Component Quy Ước

- Button thao tác chính dùng icon lucide khi phù hợp.
- Form server action dùng `SubmitButton` hoặc component client có trạng thái pending.
- Form field dùng `Label` + `Input`/`Select`/`Textarea`.
- Bảng dùng `components/ui/table`.
- Thông báo trạng thái dùng `Notice`.
- Dialog file/tài liệu phải có loading/error state.

## Responsive

Kiểm tra tối thiểu:

- Mobile: 390px, 430px.
- Desktop: 1440px.
- Không có overflow ngang toàn trang.
- Text trong nút/card không vỡ hoặc đè lên nhau.
- Dialog public đọc được trên mobile.

Lệnh gợi ý:

```bash
npm run test:mobile-ui
```

## Cổng Kiểm Tra UI

Sau thay đổi UI đáng kể:

```bash
npx tsc --noEmit
npm run lint
npm test
```

Nếu thay đổi route public/admin lớn, chạy thêm:

```bash
npm run build
npm run test:mobile-ui
```

Lưu ý: build hiện không thay thế typecheck vì `ignoreBuildErrors` đang bật.
