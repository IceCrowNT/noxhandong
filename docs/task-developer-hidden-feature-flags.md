# Task: Developer an va feature flags noi bo

## Trang thai

- Backlog Phase 2.
- Chua trien khai code.

## Muc tieu

Tao mot khu vuc an danh cho tai khoan `DEVELOPER`, khong hien thi trong sidebar/menu van hanh thuong. Khu vuc nay dung de bat/tat nhanh mot so card hoac tinh nang dang thu nghiem ma khong can sua code/deploy lai moi lan.

## Nguyen tac

- Chi truy cap bang URL an, vi du `/admin/dev`.
- Khong hien thi trong menu cho `SUPER_ADMIN`, `MANAGER`, `TECHNICIAN`.
- `DEVELOPER` co quyen cao hon `SUPER_ADMIN` ve mat cau hinh he thong.
- Feature flags chi nen dieu khien hien/ an UI hoac tinh nang thu nghiem.
- Khong dung feature flags de bo qua cac rule nghiep vu quan trong nhu public du lieu, duyet sao ke, phan quyen server.

## De xuat bang cau hinh

Bang du kien: `feature_flag_noi_bo`

- `id`
- `feature_key`
- `ten_hien_thi`
- `mo_ta`
- `enabled`
- `config_json`
- `ngay_tao`
- `ngay_cap_nhat`

## Vi du flag

- `dashboard.show_import_history`
- `dashboard.show_statement_quality`
- `dashboard.show_data_matrix`
- `review.show_advanced_filters`
- `preview.show_evidence_column`

## Rủi ro

- Khong nen bo log hoan toan cho thao tac thay doi du lieu. Neu can gon nhe, log co the an khoi UI admin thuong nhung van nen giu de truy vet loi nghiep vu.
- Neu cho developer an tat qua nhieu UI, can co mac dinh an toan de khong lam mat chuc nang van hanh cua BQT.

