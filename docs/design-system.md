# Design system

## Vai trò

File này là nguồn chuẩn cho hướng thiết kế giao diện của project. Thiết kế lấy cảm hứng từ bản Stitch trong `stitch_markdown_dashboard_viewer/`, nhưng đã điều chỉnh nội dung và nguyên tắc cho đúng nghiệp vụ BQT An Đồng.

Không copy nguyên HTML từ Stitch vào app. Stitch chỉ là visual reference; code chính vẫn theo Next.js hiện tại.

## Tinh thần thiết kế

Hướng thiết kế chính: **civic utility**, tức là công cụ cư dân rõ ràng, tin cậy, dễ đọc, không mang cảm giác landing page quảng cáo.

Nguyên tắc:

- Cư dân xem được việc cần xem trong vài giây.
- Mobile-first vì phần lớn truy cập đến từ điện thoại.
- Không dùng trang trí thừa, gradient phức tạp, orb/blob, hero marketing.
- Nội dung công khai không hiển thị SĐT, tên cư dân, ghi chú nội bộ, raw Excel.
- Vùng quản trị phải thực dụng, nhiều thông tin nhưng vẫn dễ quét.

## Brand và copy chuẩn

Tên hiển thị public:

- `BQT An Đồng`

Không dùng:

- `Cư Dân Xanh`
- `Resident Portal`
- các cụm gợi ý có chức năng chưa tồn tại như `Thông báo`, `Cá nhân`

Copy public ưu tiên:

- `Tra cứu phí quản lý căn hộ`
- `Tra cứu phí quản lý`
- `Nhập mã căn để xem đã đóng phí đến tháng nào.`
- `Không cần đăng nhập`
- `Không hiển thị thông tin cá nhân`

Copy kết quả:

- `Tra cứu thành công`
- `Trạng thái đóng phí`
- `Kỳ dữ liệu`
- `Chốt công khai lúc`
- `Dữ liệu đã được BQT xác nhận`

Copy lỗi:

- `Chưa nhận diện được mã căn`
- `Không tìm thấy dữ liệu`
- `Hãy thử nhập theo ví dụ: L1.115, L4B.412, LK2.10 hoặc căn 115 lô L1.`

## Hình nền

Trang public dùng ảnh nền chung cư xanh:

- File local: `public/images/green-apartment-courtyard-bg.jpg`
- Credit: `public/images/README.md`
- Chỉ áp dụng cho trang cư dân/public lookup.
- Admin giữ nền sạch, không dùng ảnh nền để tránh giảm khả năng đọc bảng dữ liệu.

## Màu sắc

Token chính đang dùng trong `app/globals.css`:

| Token | Giá trị | Vai trò |
| --- | --- | --- |
| `--bg` | `#f7faf8` | nền public/admin |
| `--panel` | `#f1f4f3` | surface nâng nhẹ |
| `--panel-strong` | `#ffffff` | card/input |
| `--line` | `#bec9c6` | border chính |
| `--text` | `#191c1c` | chữ chính |
| `--muted` | `#3f4947` | chữ phụ |
| `--accent` | `#004b46` | nút chính, brand, focus |
| `--accent-soft` | `#e5f2eb` | nền trạng thái tốt |
| `--success` | `#2d7a4d` | thành công |
| `--danger` | `#ba1a1a` | lỗi |
| `--warning` | `#9a3412` | cảnh báo/đóng lẻ tiền |

## Typography

Ưu tiên font hỗ trợ tiếng Việt tốt:

```css
font-family: "Be Vietnam Pro", "Segoe UI", system-ui, sans-serif;
```

Không dùng font-size scale theo viewport cho text nhỏ. Chỉ heading public được dùng `clamp()` có giới hạn.

## Component pattern

### Public header

- Brand trái: `BQT An Đồng`.
- Link phải: `Quản trị`.
- Không đặt admin link thành CTA chính.

### Public lookup card

- Card trung tâm, bán kính 12px.
- Input và nút tối thiểu 48px chiều cao.
- Form full-width trên mobile.
- Không dùng bottom navigation nếu chưa có chức năng thật.

### Result state

- Card trắng, border trái màu success.
- Mã căn là tiêu điểm.
- Trạng thái phí nằm trong box xanh nhạt.
- Metadata bắt buộc: kỳ dữ liệu, thời điểm chốt công khai, nguồn hiển thị.
- Nếu `isPartialPayment = true`, hiển thị cảnh báo nhẹ, không coi là lỗi hệ thống.

### Error state

- Card lỗi riêng, chữ rõ, không làm người dùng hoang mang.
- Luôn đưa ví dụ nhập lại.
- Có hành động quay về trang chủ hoặc tra cứu lại.

### Admin

- Giữ kiểu work-focused: card nhỏ, bảng rõ, ít trang trí.
- Không dùng hero lớn trong admin.
- Route nhạy cảm vẫn ưu tiên rõ quyền và trạng thái.

## Quy tắc phát triển sau này

- Mọi UI public mới phải theo token trong `app/globals.css`.
- Nếu thêm chức năng cư dân mới như thông báo/cá nhân, chỉ khi có login cư dân thật mới thêm navigation tương ứng.
- Không public dữ liệu cá nhân chỉ vì có trong DB.
- Nếu Stitch/Figma sinh UI mới, phải map lại copy theo file này trước khi implement.
- Khi đổi design token, cập nhật file này và kiểm tra mobile 360px, 390px, 414px, 430px.
