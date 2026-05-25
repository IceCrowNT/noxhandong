# Design system

## Vai trò

File này là **xương sống UI/UX của project**.

Mọi quyết định thiết kế quan trọng cho public page, admin dashboard, mobile layout, component pattern, copy hiển thị và quy tắc responsive phải được ghi tại đây. Khi có thay đổi UI/UX đáng kể, cập nhật file này cùng với `docs/handoff.md`.

Thiết kế lấy cảm hứng từ bản Stitch trong `stitch_markdown_dashboard_viewer/`, nhưng đã điều chỉnh nội dung và nguyên tắc cho đúng nghiệp vụ BQT An Đồng.

Không copy nguyên HTML từ Stitch vào app. Stitch chỉ là visual reference; code chính vẫn theo Next.js hiện tại.

## Quan hệ với tài liệu khác

- `docs/design-system.md`: quyết định UI/UX, layout, component, mobile-first, copy, token.
- `docs/handoff.md`: trạng thái đã làm và kết quả kiểm tra gần nhất.
- `docs/roadmap.md`: task cấp cao, không ghi chi tiết từng pattern UI.
- `docs/checklist-trien-khai-va-nghiem-thu.md`: điều kiện nghiệm thu và checklist test.
- `docs/stitch-mobile-ui-prompt.md`: prompt thiết kế tham khảo, không phải nguồn sự thật sau khi đã implement.

Khi thay đổi UI lớn:

1. Cập nhật `docs/design-system.md`.
2. Cập nhật `docs/handoff.md`.
3. Nếu ảnh hưởng nghiệm thu, cập nhật `docs/checklist-trien-khai-va-nghiem-thu.md`.
4. Chạy test/build và ghi kết quả.

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

- `NOXH An Đồng`

Không dùng:

- `Cư Dân Xanh`
- `Resident Portal`
- các cụm gợi ý có chức năng chưa tồn tại như `Thông báo`, `Cá nhân`

Copy public ưu tiên:

- `Tra cứu phí quản lý`
- `Mã căn`
- `Nhập mã căn, ví dụ L1.115`
- `Tra cứu`

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

- Desktop: `public/images/resident-home-desktop.webp` theo tỉ lệ 16:9, resize 1920x1080
- Mobile: `public/images/resident-home-mobile.webp` theo tỉ lệ 9:16, resize 1080x1920
- Logo header: `public/images/logo-hoanghuy.webp`, resize 256x256
- Credit: `public/images/README.md`
- Chỉ áp dụng cho trang cư dân/public lookup.
- Admin giữ nền sạch, không dùng ảnh nền để tránh giảm khả năng đọc bảng dữ liệu.

## Màu sắc

Token chính đang dùng trong `app/globals.css`:

| Token              | Giá trị   | Vai trò                    |
| ------------------ | ----------- | --------------------------- |
| `--bg`           | `#f7faf8` | nền public/admin           |
| `--panel`        | `#f1f4f3` | surface nâng nhẹ          |
| `--panel-strong` | `#ffffff` | card/input                  |
| `--line`         | `#bec9c6` | border chính               |
| `--text`         | `#191c1c` | chữ chính                 |
| `--muted`        | `#3f4947` | chữ phụ                   |
| `--accent`       | `#004b46` | nút chính, brand, focus   |
| `--accent-soft`  | `#e5f2eb` | nền trạng thái tốt      |
| `--success`      | `#2d7a4d` | thành công                |
| `--danger`       | `#ba1a1a` | lỗi                        |
| `--warning`      | `#9a3412` | cảnh báo/đóng lẻ tiền |

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
- Trang chủ phải tối giản: chỉ có tiêu đề, input, nút tra cứu.
- Không hiển thị nhiều chip, ví dụ, ghi chú hoặc mô tả dài trên màn đầu.
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

## Cập nhật UI stack 2026-05-21

Project chính đã cài Tailwind CSS và bộ component nội bộ theo phong cách shadcn/ui.

Quy ước áp dụng:

- `app/globals.css` vẫn giữ design token gốc và CSS cho các màn public hiện hữu.
- Tailwind được dùng để dựng giao diện mới nhanh, nhất là khu vực admin.
- Component nền nằm trong `components/ui/`: `button`, `input`, `card`, `badge`, `table`.
- Helper class nằm ở `lib/utils.ts`.
- `components.json` ghi alias theo chuẩn shadcn/ui để sau này có thể thêm component bằng CLI hoặc tự copy component.

Phạm vi đã chuyển trước:

- `/admin/login`
- `/admin`
- `/admin/import`

Nguyên tắc tiếp theo:

- Public landing page không bắt buộc dùng shadcn/ui; ưu tiên tối giản, nhẹ và dễ dùng.
- Admin dashboard, tài khoản, review contact, import/đối soát nên chuyển dần sang `components/ui`.
- Không rewrite toàn bộ một lần; chuyển từng route, chạy `npm test` và `npm run build` sau mỗi cụm.

## Cập nhật UI admin 2026-05-21

Các route admin chính đã chuyển sang Tailwind + component nền:

- `/admin/login`
- `/admin`
- `/admin/import`
- `/admin/accounts`
- `/admin/dashboard`
- `/admin/contacts/review`

Phần còn giữ CSS custom:

- Trang public `/`
- Trang public `/tra-cuu-phi`
- Một số class nền dùng chung như `page-shell`, `admin-shell`, `eyebrow`, background và token màu.

Quy tắc tiếp theo:

- Không cần xóa CSS cũ ngay nếu chưa gây lỗi.
- Khi sửa UI admin, ưu tiên dùng `components/ui`.
- Khi sửa UI public, ưu tiên đơn giản hóa trải nghiệm mobile; chỉ dùng shadcn/ui nếu thật sự cần component phức tạp.

## Ghi chú cấu hình Tailwind v4

Tailwind v4 cần khai báo source rõ trong `app/globals.css` để sinh utility class cho project Next.js này:

```css
@source "../app/**/*.{ts,tsx}";
@source "../components/**/*.{ts,tsx}";
@source "../src/**/*.{ts,tsx}";
@source "../lib/**/*.{ts,tsx}";
```

Nếu thiếu các dòng này, trang admin có thể bị mất toàn bộ style Tailwind và hiển thị như HTML thô.

## Demo dashboard vận hành 2026-05-21

Đã từng tạo route thử nghiệm `/admin/dashboard-demo` để duyệt bố cục trước khi áp dụng.

Mục tiêu demo:

- học bố cục dashboard hiện đại từ mẫu tham khảo, không dùng màu/glow/dark theme của mẫu;
- dùng Tailwind + `components/ui` hiện có, không thêm CSS/template ngoài;
- thử sidebar desktop, header sticky, KPI cards, chart SVG nhẹ, bảng có vùng cuộn riêng;
- tránh tình trạng bảng dài buộc người dùng kéo ngang/toàn trang quá nhiều.

Route này dùng dữ liệu mẫu và chưa thay thế dashboard thật.

## Áp dụng dashboard vận hành 2026-05-21

Đã áp dụng bố cục demo vào dashboard thật `/admin/dashboard`.

Điểm đã áp dụng:

- sidebar desktop;
- header sticky;
- KPI cards dùng dữ liệu thật;
- chart SVG nhẹ từ các lô import gần nhất;
- cơ cấu căn hộ bằng progress bars;
- search box đặt gần đầu màn hình;
- bảng kết quả, danh bạ, contact nháp và lịch sử import cuộn trong từng card.

Mục tiêu là giảm việc kéo ngang/toàn trang khi quản lý dữ liệu dài. Sau khi áp dụng vào dashboard thật, route demo đã được gỡ khỏi project.

## Áp dụng toàn project 2026-05-21

Bộ giao diện vận hành đã được áp dụng cho các route chính:

- Public:
  - `/`
  - `/tra-cuu-phi`
- Admin:
  - `/admin/login`
  - `/admin`
  - `/admin/dashboard`
  - `/admin/import`
  - `/admin/accounts`
  - `/admin/contacts/review`

Chuẩn mới:

- Admin dùng `AdminFrame` trong `components/admin/admin-frame.tsx`.
- Bảng rộng/dài dùng `ScrollPanel` để cuộn trong card.
- Public dùng cùng tone màu, ảnh nền, card và button/input từ `components/ui`, nhưng không dùng sidebar.
- Route demo `/admin/dashboard-demo` đã được gỡ khỏi project sau khi áp dụng vào dashboard thật.

## Cập nhật admin layout 2026-05-21

Admin layout chuyển gần hơn với mẫu dashboard của shadcn/ui:

- `AdminFrame` không còn dùng header dạng card lớn.
- Header admin là topbar mỏng cao `56px`, có border dưới, title ngắn và nút đăng xuất.
- Tiêu đề trang, badge và mô tả nằm trong vùng content, không bọc trong panel riêng.
- Sidebar bỏ khối ghi chú phụ để giảm nhiễu và tiết kiệm chiều cao.
- Card nền chuyển về `bg-white`, `shadow-sm`, border gọn hơn theo hướng component mặc định.
- Button nền chuyển về chiều cao gọn hơn, gần mặc định shadcn.

Mục tiêu: giảm diện tích header, tăng mật độ thông tin, giữ giao diện quản trị tinh tế và dễ scan.

## Chuẩn hóa component shadcn 2026-05-21

Đã rà theo docs chính thức của shadcn/ui cho các nhóm component đang cần trong project:

- `Button`: giữ API `variant`, `size`, `asChild`; đưa kích thước về gọn hơn theo mặc định shadcn.
- `Input`: chuẩn hóa về `h-9`, `rounded-md`, focus ring mảnh, hỗ trợ `type="file"`.
- `Table`: bổ sung `TableFooter`, `TableCaption`; cell/head gọn hơn để dashboard nhiều dữ liệu không bị cao quá.
- `Label`: dùng cho form thay vì label tự style rời rạc.
- `Select`: dùng Radix Select cho bộ lọc và trường vai trò liên hệ, thay native `<select>`.
- `Checkbox`: dùng Radix Checkbox cho các lựa chọn duyệt liên hệ.
- `DropdownMenu`: đã thêm component nền để dùng cho row actions/menu sau này.
- `Textarea` và `Separator`: thêm component nền cho form ghi chú dài và chia vùng layout khi cần.

Quy tắc tiếp theo:

- Không tự viết native `<select>` hoặc checkbox thường trong route admin mới.
- Form admin ưu tiên dùng `Label` + `Input`/`Select`/`Checkbox`.
- Bảng admin ưu tiên dùng `Table` + `ScrollPanel`; nếu có thao tác nhiều trên từng dòng thì dùng `DropdownMenu`.
- Chỉ cài thêm component shadcn khi có nhu cầu thật, tránh kéo nhiều JS vào trang public cư dân.

## Mobile UI audit 2026-05-21

Đã thêm test Playwright tại `tests/mobile-ui.spec.ts`.

Phạm vi test:

- 10 viewport mobile: iPhone SE 3, iPhone 13, iPhone 14 Pro, iPhone 15 Pro Max, Pixel 5, Pixel 7, Galaxy S9+, Galaxy S24, Galaxy S24 Ultra, Galaxy Z Fold 5 folded.
- Route public: `/`, `/tra-cuu-phi?ma_can=L1.115`.
- Route đăng nhập: `/admin/login`.
- Route admin sau đăng nhập bằng `admin` / `Admin@123`: `/admin`, `/admin/dashboard`, `/admin/import`, `/admin/contacts/review`, `/admin/accounts`.

Tiêu chí tự động:

- trang có nội dung chính, không render trắng;
- không có Next runtime error;
- không có tràn ngang cấp trang;
- screenshot full-page được lưu vào `.local/mobile-ui-audit/`.

Lệnh chạy lại:

```bash
npm run test:mobile-ui
```

Kết quả gần nhất: `40/40` test pass. Lỗi phát hiện trong lần đầu là `/admin/import` bị tràn ngang do card trong grid nở theo bảng rộng; đã sửa bằng cách thêm `min-w-0` vào `Card`.

## Admin mobile-first hiện hành 2026-05-23

### Điều hướng admin

Desktop:

- Dùng sidebar cố định bên trái.
- Trang `/admin` có thể hiển thị shortcut card vì đủ không gian và hỗ trợ scan nhanh.

Mobile/tablet nhỏ:

- Dùng topbar gọn.
- Menu điều hướng nằm trong `Sheet` mở bằng nút hamburger.
- Không lặp lại toàn bộ menu dưới dạng card trên `/admin`, tránh tạo hai lớp điều hướng trùng nhau.
- Trang `/admin` mobile chỉ giữ một hành động ưu tiên: `Tra cứu nhanh căn hộ`.

Component liên quan:

- `components/admin/admin-frame.tsx`
- `components/admin/admin-navigation.tsx`
- `components/ui/sheet.tsx`

### Dashboard admin mobile

Route: `/admin/dashboard`

Desktop:

- Giữ dashboard đầy đủ với KPI cards, chart, bảng và vùng cuộn nội bộ.
- Desktop được phép hiển thị nhiều thông tin cùng lúc.

Mobile:

- Không ép toàn bộ dashboard desktop xuống một cột dài.
- Dùng Tabs để giảm endless scroll:
  - `Tổng quan`: KPI, vòng hoàn thành kỳ phí, phân bố tháng phí, danh sách cần chú ý.
  - `Tra cứu`: ô tìm căn, tình trạng đóng phí, gọi nhanh, hồ sơ căn, dữ liệu gốc Excel.
  - `Lịch sử`: ma trận nhập dữ liệu và lịch sử import dạng card.
- Bảng dài không hiển thị dạng `<table>` trên mobile; chuyển sang card/list.
- Tab mặc định trên mobile: `Tra cứu`, vì nhân sự nội bộ cần tìm căn/SĐT nhanh ngay sau khi đăng nhập.

Component liên quan:

- `components/ui/tabs.tsx`
- `@radix-ui/react-tabs`

### Table-to-cards

Quy tắc:

- Desktop: dùng `Table` + `ScrollPanel` hoặc `overflow-x-auto` trong card.
- Mobile: ưu tiên card/list summary.
- Không để bảng rộng làm overflow ngang toàn trang.
- Nếu bắt buộc giữ bảng trên mobile, phải cuộn trong khung riêng và không làm `body.scrollWidth` lớn hơn viewport.

### Kiểm tra bắt buộc sau khi sửa UI mobile

Sau mỗi thay đổi UI mobile/admin:

- Kiểm tra `390px`.
- Kiểm tra `400px` hoặc `430px`.
- Kiểm tra desktop `1440px`.
- Kiểm tra CSS/JS static không trả `500`.
- Kiểm tra không overflow ngang toàn trang.
- Chạy:

```bash
npm test
npm run build
```

Nếu vừa chạy `npm run build` trong lúc dev server đang mở, phải dừng dev server và xoá `.next` trước khi chạy lại `npm run dev` để tránh lỗi mất CSS/chunk 500.

## Cập nhật table import 2026-05-23

- Trang có bảng dữ liệu dài như `/admin/import` ưu tiên mỗi bảng là một section full-width.
- Không ép hai bảng lớn vào hai cột nếu làm mất khả năng đọc hoặc làm thanh cuộn khó thao tác.
- Chuỗi dài trong bảng như tên file upload phải dùng `truncate`/`title` hoặc đặt trong vùng scroll riêng, không để phá card.
- `ScrollPanel` phải có `max-height` và `overflow-auto` rõ ràng; table chỉ được cuộn trong card, không làm tràn ngang toàn trang.

## UX import phí 2026-05-24

- Không dùng chữ `staging` trên giao diện vận hành vì quá kỹ thuật.
- Nút phụ là `Chỉ kiểm tra file`: đọc file, parse dữ liệu, báo số dòng/lỗi nhưng không công khai cho cư dân.
- Nút chính là `Nhập và công khai cho cư dân`: import file, tạo snapshot public và đặt batch mới làm dữ liệu hiện hành.
- Không thêm nút `Công khai từ staging` khi chưa có màn review thật sự; tránh tạo hai đường public khác nhau và rủi ro public nhầm batch cũ.
- Sau khi kiểm tra file, phải hiển thị số dòng, mã căn không khớp, thiếu tháng, không parse được tháng, đóng lẻ tiền và ngoài năm 2026.

## Rà soát UI admin mobile 2026-05-24

- Sau đăng nhập chuyển thẳng vào `/admin/dashboard` thay vì trang đệm `/admin`.
- Route `/admin` mặc định cũng chuyển sang `/admin/dashboard`; chỉ giữ trang `/admin?denied=1` để báo lỗi phân quyền.
- Menu admin không hiển thị mục `Vùng quản trị` riêng vì route này chỉ redirect; brand/logo dẫn về dashboard.
- Mobile dashboard mở tab `Tra cứu` trước để phục vụ thao tác nhanh.
- `/admin/accounts`, `/admin/import`, `/admin/contacts/review` dùng card/list trên mobile; bảng desktop chỉ hiện từ breakpoint lớn hơn.
- Trang duyệt liên hệ mobile chỉ hiển thị tóm tắt từng liên hệ; form duyệt/từ chối nằm trong khối mở rộng để giảm cuộn dài.
- Tên file dài phải có `truncate` và card mobile phải có `min-w-0` để không tạo overflow ngang.

## Chart phân bố phí 2026-05-24

- Phân bố `Tháng đã đóng đến hiện tại` dùng histogram/thanh ngang, không dùng pie/donut.
- Lý do: cần hiển thị đủ toàn bộ nhóm tháng của `934` căn, có số căn và phần trăm từng nhóm.
- Phần trăm từng nhóm hiển thị 1 chữ số thập phân khi cần, ví dụ `1 căn` trên `934 căn` hiển thị khoảng `0,1%`, không làm tròn thành `0%`.
- Chart phải có tổng đối soát ngay trong card:
  - `Tổng`: tổng căn trong batch.
  - `Đạt kỳ`: số căn đã đạt/vượt kỳ hiện tại.
  - `Số mốc`: số nhóm tháng/năm đang tồn tại.
- Màu:
  - xanh: đã đạt hoặc vượt kỳ hiện tại.
  - vàng: chưa đạt kỳ hiện tại.
- Mobile vẫn hiển thị đủ các mốc tháng, không cắt top 6/top 10.

## Card cảnh báo cắt điện 2026-05-24

- Card `Cần chú ý` trên dashboard đổi thành `Cảnh báo cắt điện`.
- Logic theo kỳ phí hiện tại:
  - `Cắt tháng này`: căn đã đóng hết tháng `kỳ hiện tại - 4`.
  - `Đã cắt điện`: căn có mốc đóng phí thấp hơn ngưỡng cắt tháng này.
- Ví dụ kỳ `T5-2026`:
  - đóng hết tháng `1/2026` là `Cắt tháng này`;
  - đóng hết trước tháng `1/2026` là `Đã cắt điện`.
- UI hiển thị nhóm `Cắt tháng này` trước, nhóm `Đã cắt điện` sau.
- Đây là cảnh báo nội bộ cho admin/manager, không hiển thị trên public lookup.

## Cập nhật dashboard desktop 2026-05-24

- Desktop `/admin/dashboard` ưu tiên thao tác vận hành: card `Tra cứu nhanh` nằm ngay đầu nội dung, trước KPI và chart.
- Mobile vẫn giữ Tabs và mở tab `Tra cứu` mặc định.
- Logo admin dùng cùng asset `public/images/logo-hoanghuy.webp` với public header để đồng bộ nhận diện.
- Card `Hoàn thành kỳ phí` bổ sung số liệu phụ trong phần trống: kỳ hiện tại, số căn còn thiếu, số căn đóng lẻ đã làm tròn và số căn chưa có dữ liệu.
