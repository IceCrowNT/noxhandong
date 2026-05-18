# Preview import theo dõi thu phí

Thư mục này chứa kết quả preview sau khi chạy:

```bash
npm run import:fee-tracking:v2
```

Nguồn hiện tại:

- file: `docs/Theo dõi thu phí T4.xlsx`
- sheet: `Lịch sử đóng phí`
- header row: `3`
- batch DB mới nhất: `lo_nhap_du_lieu.id = 3`

Kết quả import hiện tại:

- dòng nguồn: `934`
- dòng import vào `dong_theo_doi_thu_phi_tho`: `934`
- mã căn không map được: `0`
- thiếu `Tháng đã đóng đến hiện tại`: `0`
- không parse được tháng đã đóng: `0`
- đóng lẻ tiền: `3`
- tháng ngoài năm gốc 2026: `31`

Rule tháng đã đóng:

- năm gốc là `2026`
- `hết tháng 0` nghĩa là đã đóng hết tháng 12 năm 2025
- `hết tháng -1` nghĩa là đã đóng hết tháng 11 năm 2025
- `hết tháng 12` nghĩa là đã đóng hết tháng 12 năm 2026
- `hết tháng 14` nghĩa là đã đóng hết tháng 2 năm 2027
- số lẻ như `3,5` là đóng lẻ tiền, không phải lỗi parse

File preview:

- `summary.json`: tổng quan import
- `ma-can-khong-map-duoc.csv`: mã căn không map được vào `can_ho`
- `thieu-thang-da-dong.csv`: dòng thiếu cột tháng đã đóng
- `thang-da-dong-khong-parse-duoc.csv`: dòng không parse được tháng đã đóng
- `dong-le-tien.csv`: dòng có số tháng lẻ do cư dân đóng lẻ tiền
- `ngoai-nam-2026.csv`: dòng có tháng tương đối nằm ngoài năm gốc 2026

Dữ liệu này vẫn là staging, chưa public cho cư dân.
