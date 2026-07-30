# Thiết kế cơ sở dữ liệu

Cập nhật: 2026-07-28. Source of truth kỹ thuật vẫn là `prisma/schema.prisma`; tài liệu này mô tả vai trò nghiệp vụ của các bảng chính.

## Nguyên Tắc Cốt Lõi

1. `can_ho` là trục master của 934 căn hộ.
2. Public cư dân chỉ đọc snapshot đã public, không đọc raw Excel/sao kê.
3. Giao dịch ngân hàng thật đi qua import, parser, review rồi mới ghi lịch sử phí.
4. Không tạo giao dịch ngân hàng giả cho khoản quá khứ/bổ sung; dùng `bo_sung_giao_dich_qua_khu`.
5. File chứng từ/thông báo phải lưu metadata: đường dẫn, tên gốc, MIME type, dung lượng.
6. Batch public không bị xóa ngay sau khi có batch mới để còn audit.

## Nhóm Bảng Master Và Liên Hệ

| Bảng | Vai trò |
| --- | --- |
| `can_ho` | Master căn hộ: mã căn, loại căn, lô, diện tích, trạng thái |
| `lien_he_can_ho` | Danh bạ liên hệ chính thức đã chuẩn hóa |
| `ung_vien_lien_he_can_ho` | Contact staging từ file/raw, cần review |
| `dong_du_lieu_quan_ly_tho` | Dòng dữ liệu thô từ workbook quản lý |

Nguyên tắc public: tên/SĐT/ghi chú liên hệ không xuất hiện ở route cư dân không login.

## Nhóm Import Và Raw Data

| Bảng | Vai trò |
| --- | --- |
| `lo_nhap_du_lieu` | Batch import chung cho workbook/sao kê/chứng từ |
| `dong_theo_doi_thu_phi_tho` | Dòng thô từ Excel theo dõi thu phí |
| `dong_sao_ke_tho` | Dòng thô sao kê ngân hàng |
| `giao_dich_sao_ke_tho_chuan` | Giao dịch canonical đã chuẩn hóa/fingerprint |

Raw/canonical dùng để audit và chống trùng; không phải dữ liệu public cuối cùng.

## Nhóm Giao Dịch Và Lịch Sử Phí

| Bảng | Vai trò |
| --- | --- |
| `giao_dich_ngan_hang` | Giao dịch vận hành chính, chứa kết quả parser và trạng thái duyệt |
| `ung_vien_khop_giao_dich` | Candidate căn hộ parser gợi ý |
| `phan_bo_giao_dich` | Một giao dịch phân bổ cho một hoặc nhiều căn |
| `lich_su_dong_phi_can_ho` | Dòng phí đã được ghi nhận chính thức cho căn |
| `chung_tu_doi_soat` | Bằng chứng/ghi chú đính kèm giao dịch |

`giao_dich_ngan_hang.trang_thai_duyet` là trạng thái review hiện hành. `lich_su_dong_phi_can_ho` là hàng đợi chờ public nếu `batch_phi_public_id` còn null.

## Nhóm Chốt Tháng Và Public Snapshot

| Bảng | Vai trò |
| --- | --- |
| `so_chot_thang` | Sổ chốt tháng từ Excel/sao kê/điều chỉnh |
| `so_chot_can_ho` | Chi tiết trạng thái từng căn trong sổ chốt |
| `batch_trang_thai_phi_public` | Batch public cho cư dân, có cờ hiện hành |
| `trang_thai_phi_can_ho_public` | Snapshot 934 dòng theo từng batch |

Luồng chính:

```text
Excel opening balance hoặc lịch sử phí đã duyệt
  -> preview/chốt sổ
  -> batch_trang_thai_phi_public
  -> trang_thai_phi_can_ho_public
  -> public lookup cư dân
```

## Bổ Sung Giao Dịch Quá Khứ

| Bảng | Vai trò |
| --- | --- |
| `bo_sung_giao_dich_qua_khu` | Khoản bổ sung/điều chỉnh không đi từ sao kê import |
| `lich_su_dong_phi_can_ho` | Dòng lịch sử phí sinh ra từ bổ sung |

Quy tắc:

- Không nhét dòng giả vào `giao_dich_ngan_hang`.
- Luôn lưu bằng chứng hoặc ghi chú giải trình.
- Khoản bổ sung chỉ ra public sau lần preview/public tiếp theo.

## Thông Báo Public

| Bảng | Vai trò |
| --- | --- |
| `thong_bao_cong_khai` | Thông báo public trên trang chủ |

Trường file:

- `ten_file_goc`
- `duong_dan_file`
- `mime_type`
- `kich_thuoc_byte`

Trạng thái:

- `NHAP`
- `CONG_KHAI`
- `AN`

File đính kèm hiện hỗ trợ PDF và ảnh. Viewer public quyết định hiển thị dựa trên `mime_type` và fallback theo đuôi file.

## Auth Và Audit

| Bảng | Vai trò |
| --- | --- |
| `tai_khoan_quan_tri` | Tài khoản admin/manager/technician |
| `nhat_ky_dang_nhap_quan_tri` | Log đăng nhập |

Role:

- `SUPER_ADMIN`
- `MANAGER`
- `TECHNICIAN`

Permission route đọc từ `src/modules/auth/permissions.ts`.

## File Upload

Hiện file runtime lưu dưới `public/uploads`:

- `public/uploads/evidence`: bằng chứng giao dịch.
- `public/uploads/historical-supplements`: bằng chứng bổ sung quá khứ.
- `public/uploads/announcements`: file thông báo public.

Route `/uploads/[...path]` phục vụ file từ `public/uploads`, có kiểm tra target path không vượt khỏi thư mục uploads. Nếu sau này file có quyền riêng tư, không dùng route public này cho file đó.

## Cổng Kiểm Tra Khi Đổi DB

```bash
npm run prisma:validate
npm run prisma:generate
npx tsc --noEmit
npm test
```

Trước khi migration production:

- backup PostgreSQL
- xác nhận rollback plan
- xác nhận không có import/public batch đang chạy
