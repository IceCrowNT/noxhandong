# Tham khảo hệ thống tương tự và đề xuất tính năng

## Vai trò

File này ghi nhận các hệ thống quản lý cư dân/HOA/property portal đã tham khảo để định hướng Phase 2.

Ngày tham khảo: 2026-05-26.

## 20 hệ thống tương tự

| # | Hệ thống | Nhóm tính năng nổi bật | Link |
| --- | --- | --- | --- |
| 1 | AppFolio Online Portal | thanh toán, lịch sử thanh toán, yêu cầu bảo trì, tài liệu chia sẻ | https://www.appfolio.com/help/online-portal |
| 2 | BuildingLink Resident Portal | dashboard cư dân, bulletin board, trải nghiệm mobile, tùy biến theo tòa nhà | https://vprelive.buildinglink.com/Public/buildinglink/ResidentExperience/ResidentPortal.aspx |
| 3 | Buildium Resident Center | thanh toán, bảo trì, thông báo email/text, tài liệu, message board | https://www.buildium.com/features/resident-center/ |
| 4 | Condo Control | thông báo, tài liệu, sự kiện, message, package/security/amenity | https://www.condocontrol.com/communication/ |
| 5 | DoorLoop Tenant Portal | thanh toán, bảo trì, thông báo, shared documents, tenant communication | https://www.doorloop.com/features/tenant-management-software |
| 6 | Yardi Breeze / CondoCafe | online payment, maintenance, communications, resident/condo portal | https://www.yardibreeze.com/ |
| 7 | Vantaca Home | board/homeowner portal, billing, requests, documents, directory, workflow sync | https://support.vantaca.com/hc/en-us/articles/360050060451-Modern-Portal-The-Homeowner-Portal |
| 8 | FRONTSTEPS | resident engagement, document organization, community management workflows | https://frontsteps.com/ |
| 9 | Enumerate Engage | HOA resident portal, role-based information, messages, requests, payments | https://goenumerate.com/products/engage |
| 10 | PayHOA | accounting, online dues, autopay, documents, requests, communications | https://www.payhoa.com/ |
| 11 | CINC Systems | secure payment portal, news/updates, amenity reservations, voting/surveys, communication | https://cincsystems.com/ |
| 12 | HOA Express | website builder, document library, payments, blast email/text, announcements | https://www.hoa-express.com/ |
| 13 | Rentec Direct Tenant Portal | online payments, maintenance, lease documents, property notices, payment history | https://www.rentecdirect.com/details/tenant-portal |
| 14 | TenantCloud | payments, maintenance, leases, documents, messages, property board/announcements | https://support.tenantcloud.com/en/articles/11930700-let-s-get-started |
| 15 | ManageCasa | HOA communication, announcements, messages, documents, legal notices | https://managecasa.com/communication |
| 16 | HOA One | requests, reservations, announcements, documents, payments | https://hoaone.ai/ |
| 17 | Effortless HOA | board portal, online dues, document management, voting/elections, homeowner portal | https://effortlesshoa.com/ |
| 18 | CondoPro | unit info, balance, maintenance, amenities, events, documents, announcements | https://condopro.net/ |
| 19 | ApplyHOA | branded website, resident portal, payments, documents, announcements, bilingual/community pages | https://applyhoa.com/ |
| 20 | ClickPay Resident Portal | payments and resident communications/documents | https://site.clickpay.com/wp-content/uploads/2018/01/ClickPay-Resident-Portal.pdf |

## Nhận xét chung từ các hệ thống tham khảo

Các hệ thống hoàn thiện thường có các nhóm tính năng lặp lại:

- Resident portal/mobile-first.
- Online payment hoặc ít nhất lịch sử thanh toán.
- Thông báo/bảng tin.
- Thư viện tài liệu.
- Yêu cầu bảo trì/hỗ trợ.
- Tin nhắn hoặc kênh liên hệ chính thức.
- Dashboard quản trị.
- Role/permission.
- Audit/log.
- Báo cáo và export.

Với dự án BQT An Đồng, không nên bê nguyên toàn bộ mô hình lớn vì quy mô hiện tại nhỏ hơn và nghiệp vụ đang cần nhất là:

- tra cứu phí công khai
- import/chốt dữ liệu phí
- parser sao kê
- đối soát giao dịch
- liên hệ cư dân nội bộ
- thông báo PDF công khai

## 10 tính năng phù hợp đề xuất

### 1. Thông báo công khai dạng PDF

Phù hợp làm ngay trong Phase 2.

Admin upload PDF, cư dân xem ở trang chủ không cần login.

Ứng dụng:

- thông báo thu phí
- bảo trì/cắt điện/cắt nước
- lịch tiếp dân
- hướng dẫn thanh toán

### 2. Trang danh sách thông báo công khai

Trang chủ chỉ hiển thị vài thông báo mới nhất, còn trang riêng hiển thị toàn bộ thông báo đã public.

Lợi ích:

- không làm trang chủ rối
- cư dân dễ tìm thông báo cũ

### 3. Giao dịch ngân hàng gần nhất theo căn

Hiển thị trong tra cứu nội bộ.

Lợi ích:

- kỹ thuật/kế toán có bằng chứng đối chiếu nhanh
- hỗ trợ gọi cư dân chính xác hơn

### 4. Preview import sao kê trước khi ghi DB

Trước khi import thật, hệ thống hiển thị:

- tổng dòng
- đã khớp căn
- chưa nhận diện
- nhiều căn
- nghi trùng
- không liên quan

Lợi ích:

- tránh đưa dữ liệu bẩn vào DB
- chủ dự án có thể duyệt bằng mắt

### 5. Màn hình rà soát giao dịch chưa khớp

Admin xem và sửa tay các dòng:

- chưa nhận diện căn
- nhiều căn
- nghi sai mã
- nghi trùng

Lợi ích:

- parser không cần hoàn hảo 100%
- vẫn vận hành được với dữ liệu thực tế

### 6. Thống kê hiệu quả parser theo từng file

Mỗi file sao kê có tỷ lệ:

- khớp rõ
- khớp sau chuẩn hóa
- chưa nhận diện
- nhiều căn
- không liên quan

Lợi ích:

- biết parser đang tốt lên hay kém đi
- có dữ liệu để quyết định rule mới

### 7. Thư viện tài liệu nội bộ cho admin

Khác với thông báo public.

Chỉ admin/manager/kỹ thuật xem được:

- biểu mẫu nội bộ
- hướng dẫn quy trình
- file mẫu import
- biên bản không public

Lợi ích:

- giảm thất lạc file vận hành

### 8. Nhật ký đăng nhập và trạng thái tài khoản

Tính năng đã được chủ dự án duyệt.

Lưu:

- lần đăng nhập cuối
- IP
- user agent rút gọn
- trạng thái hoạt động/khóa

Lợi ích:

- đủ kiểm soát nội bộ
- không quá nặng audit

### 9. Reset mật khẩu nội bộ

Super Admin reset mật khẩu cho manager/kỹ thuật.

Lợi ích:

- vận hành thực tế dễ hơn
- không cần can thiệp DB

### 10. FAQ/hướng dẫn cư dân ngắn

Một khối rất ngắn trên trang public hoặc trang riêng:

- cách nhập mã căn
- liên hệ BQT khi dữ liệu sai
- hướng dẫn xem thông báo
- hướng dẫn chuyển khoản

Lợi ích:

- giảm cuộc gọi hỏi lại
- không cần cư dân đăng nhập

## Tính năng chưa nên làm ngay

- Cư dân login riêng.
- Thanh toán online thật.
- App mobile native.
- Chat/ticket phức tạp.
- Voting/biểu quyết.
- Đặt tiện ích/amenity booking.
- AI chatbot.
- E-signature.
- Tự động gửi SMS/Zalo hàng loạt.
- Kế toán đầy đủ thay Excel.

Các tính năng này có thể hữu ích về dài hạn, nhưng chưa phù hợp với mục tiêu Phase 2 là parser sao kê, đối soát DB và vận hành public lookup ổn định.

