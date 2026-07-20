# Roadmap dự án

## Vai Trò File Này

`docs/roadmap.md` là bảng điều phối tiến độ cấp cao của dự án. File này chỉ trả lời 3 câu hỏi cốt lõi:
1. Mục tiêu hiện tại là gì?
2. Trạng thái hiện tại (Những gì đã xong)?
3. Các công việc cần làm tiếp theo (Backlog / To-Do)?

*(Các tài liệu xương sống khác vui lòng tra cứu tại `docs/README.md`)*

---

## 1. Mục Tiêu Sản Phẩm
Dự án hướng tới một Web App quản lý thu phí căn hộ, gồm hai phân hệ:
1. **Trang Public (noxhandong.vn)**: Dành cho cư dân tra cứu thông tin đóng phí, xem thông báo, không cần đăng nhập. Cư dân chỉ thấy dữ liệu đã được Ban Quản Trị (BQT) chốt công khai.
2. **Khu vực Quản Trị (Admin/Manager)**: Hệ thống nội bộ để BQT đối soát sao kê ngân hàng, duyệt giao dịch, tạo thông báo phí và quản lý danh bạ.

*Nguyên tắc vận hành cốt lõi:* Lấy dữ liệu Tháng 5/2026 làm mốc quá khứ chuẩn (Opening Balance). Từ Tháng 6/2026 trở đi, mọi dữ liệu phí phát sinh phải được duyệt từ Sao Kê Ngân Hàng.

---

## 2. Lịch Sử Triển Khai (Milestones)

- **Tháng 05/2026**: Hoàn thiện MVP Phase 1. Đã thiết lập xong database PostgreSQL (migrate sang V2), nhập dữ liệu gốc (934 căn hộ), xây dựng nền tảng Admin/Auth và trang tra cứu Public. Deploy production thành công lên VPS.
- **Tháng 06/2026 - Nay**: Triển khai Phase 2. Mở rộng tính năng đối soát sao kê, lưu bằng chứng giao dịch (ảnh chụp/Zalo), xử lý quy trình chốt dữ liệu cuối kỳ (preview trước khi public), và hoàn thiện báo cáo/xuất file vận hành (Excel, Word).

---

## 3. Trạng Thái Hiện Tại (Đã Hoàn Thành)

Dự án hiện đang vận hành ổn định trên Production. Các tính năng cốt lõi đã chạy mượt mà:
- **Cư dân**: Tra cứu tiến trình đóng phí (mobile-first UI), tải thông báo phí định dạng PDF/Word.
- **Dữ liệu**: Cơ sở dữ liệu PostgreSQL hoạt động an toàn với cơ chế Backup tự động lên Google Drive mỗi 2h sáng.
- **Xử lý giao dịch**: Hệ thống Import sao kê tự động bóc tách mã căn. Màn hình duyệt sao kê cho phép duyệt nhanh, đính kèm bằng chứng, bảo lưu hoặc từ chối.
- **Danh bạ cư dân**: Tính năng chuẩn hóa danh bạ từ dữ liệu thô, loại bỏ số trùng lặp, tối ưu thuật toán bóc tách và hỗ trợ gộp số tự động cho các luồng xuất file Excel vận hành (vd: Checklist Cắt điện).
- **Hệ thống phân quyền**: `SUPER_ADMIN` (toàn quyền), `MANAGER` & `TECHNICIAN` (truy cập đọc, tra cứu, xuất file).

---

## 4. Công Việc Tiếp Theo (Backlog / Ưu Tiên Gần)

1. **Hoàn thiện UI / Phân quyền nâng cao**: Tinh chỉnh lại thanh Menu nội bộ để ẩn/hiện chính xác theo Role của tài khoản.
2. **Gỡ duyệt nâng cao**: Hoàn thiện tính năng rollback/gỡ duyệt cho các giao dịch bị sai sót (đặc biệt là các giao dịch đã public).
3. **Làm sạch Database**: Tinh giản các bảng/cột thừa hoặc bảng test trong quá trình phát triển Phase 1 mà không gây ảnh hưởng dữ liệu thật.
4. **Tối ưu Báo Cáo**: Cải thiện biểu đồ Dashboard hiển thị mức độ đóng phí theo tháng trực quan hơn.

---

## 5. Rủi Ro & Cổng Dừng Thủ Công

**Rủi ro lớn cần kiểm soát:**
- Import sao kê ngân hàng chồng chéo ngày dẫn đến sinh rác dữ liệu thô (đã có cơ chế chống trùng lặp qua mã tham chiếu nhưng cần theo dõi thêm).
- Local và VPS lệch schema trước khi restore DB.

**Cổng dừng thủ công (Phải xin phép trước khi làm):**
- Xóa/Reset Database thật.
- Restore DB từ Local chép đè lên VPS.
- Deploy code mới lên Production.
- Đổi Schema làm ảnh hưởng dữ liệu thật.
