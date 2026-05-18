# Prompt Stitch - thiết kế giao diện mobile-first

## Mục tiêu

Thiết kế UI mobile-first cho web tra cứu phí căn hộ. Khoảng 90% người dùng là cư dân truy cập bằng điện thoại với nhiều kích thước màn hình khác nhau.

Trang đầu tiên của project là trang cư dân, không phải trang quản trị.

## Prompt dùng cho Stitch

```text
Design a mobile-first Vietnamese apartment fee lookup web app for residents of a social housing apartment complex.

Primary user:
- Resident using a phone.
- No login required.
- Wants to quickly check apartment fee payment progress.
- May type apartment codes in multiple formats such as "L1.115", "L1 115", "can 124 lo 4b", "124lo4b".

Primary screen:
- First screen must be the actual lookup experience, not a marketing landing page.
- Large clear title in Vietnamese: "Tra cứu tiến trình đóng phí căn hộ".
- One prominent input field labeled "Mã căn".
- Placeholder: "Ví dụ: L1.115, can 124 lo 4b".
- One primary button: "Tra cứu".
- Small secondary admin entry point: "Quản trị" or "Đăng nhập quản trị".
- Admin access must be visible but visually secondary, not competing with resident lookup.

Result screen:
- Show apartment code.
- Show payment progress text, for example:
  - "Đã đóng hết tháng 11 năm 2025"
  - "Đã đóng hết tháng 2 năm 2027"
  - "Đóng lẻ tiền, tương đương 3,5 tháng trong năm 2026"
- Show data period and updated time.
- Show errors clearly:
  - no public data found
  - invalid input
  - too many requests
- Do not show phone numbers, resident names, internal notes, Excel raw notes, or admin-only data.

Mobile layout requirements:
- Designed for 360px, 390px, 414px, and 430px wide screens.
- The lookup input and button should be easy to tap with one hand.
- Minimum tap target height 48px.
- Button full-width on mobile.
- No horizontal scrolling on public pages.
- Text must wrap cleanly and never overlap.
- Keep cognitive load low: one main action per screen.
- Use compact cards for results, not dense tables.
- Make error and empty states easy to understand.

Visual direction:
- Trustworthy, calm, civic/residential management tool.
- Avoid marketing-style hero layout.
- Avoid decorative blobs/orbs and heavy gradients.
- Prefer clean neutral background, high contrast text, restrained teal/green accent.
- Rounded corners should be subtle, around 8-12px.
- Typography should be readable for older residents.
- Vietnamese text must fit well on narrow screens.

Desktop behavior:
- Centered layout with max width around 900px.
- Form can be two columns on desktop: input + button.
- Result cards can be two columns on desktop.
- Admin entry remains secondary.

Deliverables:
- Mobile homepage lookup screen.
- Mobile result success screen.
- Mobile error/empty state.
- Desktop variant.
- Include component states: focused input, loading/submitting, success, error.
```

## Ghi chú triển khai trong project

- Trang chủ cư dân: `/`
- Trang kết quả tra cứu: `/tra-cuu-phi`
- Trang admin login: `/admin/login`
- Public không hiển thị dữ liệu nhạy cảm.
- Chi tiết parser mã căn nằm ở [parser-ma-can-ho.md](parser-ma-can-ho.md).
- Cấu trúc module nằm ở [module-map.md](module-map.md).
