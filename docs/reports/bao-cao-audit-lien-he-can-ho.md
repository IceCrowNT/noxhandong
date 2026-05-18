# Báo cáo audit liên hệ căn hộ

- File nguồn: `Theo dõi thu phí T4.xlsx`
- Tổng ô cần rà soát: `896`
- Có nhiều dòng: `432`
- Có nhiều số điện thoại: `553`
- Có cờ trạng thái: `262`

## Mẫu dữ liệu cần rà soát

| Dòng Excel | Mã căn | Chủ hộ | Số dòng | Số SĐT | Flags | Thông tin cư dân |
| --- | --- | --- | ---: | ---: | --- | --- |
| 2 | L2.528 | Bùi Thị Hằng | 1 | 1 |  | Bùi Thị Hằng/Trần Quốc Hoàng(0906.021.387.0906.054.186) |
| 3 | L4A.511A | Lê Thị Thu Huyền | 1 | 0 |  | Lê Thị Thu Huyền/(0904,019,299.) |
| 4 | L4C.312 | Phạm Thị Ngọc Thủy | 1 | 1 |  | Phạm Thị Ngọc Thủy/Đỗ Văn Quang(0914.271.155.0826.966.268) |
| 5 | L4C.426 | Trương Thành Trung | 3 | 3 | GHI_CHU_THANH_TOAN | Trương Thành Trung/(0933.456.655/0932.223.638-Chị Bích.)  Hiếu / Mỹ Linh 0794115765  Thanh toán theo tháng: cứ cuối tháng sẽ nộp |
| 6 | L1.524 | Vũ Thị Thu Huyền | 1 | 2 | CAN_XIN_SDT | Vũ Thị Thu Huyền/ 0358422718 '0931204888 cần xin sdt |
| 7 | L2.201 | Phạm Thị Mai Anh | 1 | 0 | CAN_XIN_SDT | Phạm Thị Mai Anh cần xin sdt |
| 8 | L2.207 | Nguyễn Thị Bích | 1 | 0 | CAN_XIN_SDT | cần xin sdt |
| 10 | L2.222 | Đào Thị Hoàn | 1 | 1 | DA_BAN | Đào Thị Hoàn/(0936.172.185.) đã bán |
| 11 | L2.229 | Phạm Thị Hường | 3 | 3 | DA_BAN, CHU_MOI | Phạm Thị Hường/Nguyễn Văn Khải(0833.832.687.)  0988887113 xin sđt chủ mới  Vũ Văn Muồng 0384 093 9999 đã bán |
| 12 | L2.231 | Đinh Thị Lương | 1 | 1 | DA_BAN | Đinh Thị Lương/(0912.240.269.) đã bán |
| 13 | L2.423 | Vũ Hà My | 2 | 2 | DA_BAN | Vũ Hà My/(0983.060.176.) đã bán  Lê Thu Hiền 091 992 1618 đã bán |
| 14 | L2.530 | Nguyễn Thị Hương Giang | 1 | 1 | CAN_XIN_SDT | Nguyễn Thị Hương Giang/(0916.179.288.) cần xin sdt |
| 15 | L4A.333 | Nguyễn Thế Quyền | 2 | 3 | DA_BAN | Nguyễn Thế Quyền/Đặng Thị Huyền Trang(0904.099.089.0978.055.888   (C Thu).0919.723.712) đã bán lại cho Phạm T Oanh 077 230 9276  đã bán |
| 16 | L4A.403 | Vũ Văn Vinh | 2 | 2 | KHACH_THUE, XAC_MINH | Vũ Văn Vinh/(0814.066.555.) xác minh  Đỗ Văn Khang 0827937680 khách thuê |
| 17 | L4A.533 | Phạm Đức Thuận | 1 | 0 | SDT_SAI | Phạm Đức Thuận/Nguyễn Thị Mận sdt sai |
| 18 | L4B.207 | Phạm Văn Điệp | 2 | 2 | DA_BAN, CHU_MOI | Phạm Văn Điệp/Bùi Thu Trang(0912.113.628.)  Chủ mới Lê Thị Vinh: 039 412 6659 đã bán |
| 19 | L4B.308 | Lê Văn Chiến | 1 | 1 | DA_BAN | Lê Văn Chiến/(0938.280.555.) đã bán cho Nguyễn Thị Thu Lương (chưa có thông tin liên hệ) |
| 20 | L4B.421 | Lê Phúc Hưng | 2 | 2 | DA_BAN, CHU_MOI | Lê Phúc Hưng 0522.104.289 đã bán chưa có thông tin chủ mới  Trần Thị Phượng 0936521289 |
| 21 | L4C.207 | Nguyễn Kim Thái Sơn | 1 | 1 |  | Nguyễn Kim Thái Sơn/(0936.888.337.) xin sdt |
| 22 | L4C.305 | Trần Thị Hiền | 1 | 1 |  | Trần Thị Hiền/(0936.882.856.) |
| 23 | L4C.329 | Trần Nhật Phương | 3 | 5 | CHU_MOI, CAN_XIN_SDT | Trần Nhật Phương/ (0916.087.899/ 0375.061.202 /0934.504.272.) Long 0912590338  Chủ mới Nguyễn Nhật Lệ 0898001037 0857246485  Cần xin sdt |
| 24 | L4C.425 | Hoàng Thị Hà | 1 | 1 | CAN_XIN_SDT | Hoàng Thị Hà/(0375.911.062.) cần xin sđt |
| 25 | L2.326 | Bùi Trọng Song | 1 | 2 |  | Bùi Trọng Song/Thạch Bích Vân  (0936.858.234 / 0931.130.188) ko phải chủ nhà |
| 26 | L4C.421 | Nguyễn Văn Toàn | 1 | 0 | DA_BAN | đã bán |
| 27 | LK1.40 | Vũ Thị Thủy/ Phan Mạnh Cường | 3 | 3 | DA_BAN, CHU_MOI | 0989,190,928   Chủ cũ: Lưu Tuấn Việt 0906156388 / Lê Mai 0904716417  Chủ mới: Trùng Khánh 0869250882 đã bán |
| 28 | L1.101 | Dương Mạnh Đức | 2 | 2 |  | Dương Mạnh Đức/(0826.698.886.)   -> Nhung 0826698886 |
| 29 | L1.102 | Nguyễn Thị Lệ Thủy | 1 | 1 |  | Nguyễn Thị Lệ Thủy/ 0912.392.805 |
| 30 | L1.103 | Lê Chí Quân | 2 | 2 |  | Lê Chí Quân ( 0704.160.318)   Đào Thị Bích (0384.001.018) |
| 31 | L1.105 | Nguyễn Quốc Hưng | 1 | 2 |  | Nguyễn Quốc Hưng/ 0973.280.386 Thủy 0943242668 |
| 32 | L1.106A | Lưu Thành Trung | 1 | 1 |  | Lưu Thành Trung/ 0919.065.229 |
| 34 | L1.107 | Vũ Đức Sang | 1 | 2 |  | Vũ Đức Sang/ 0762142668, Thủy 0943242668 |
| 35 | L1.108 | Lê Anh Thư | 1 | 1 |  | Lê Anh Thư/ 0964264176 |
| 36 | L1.109 | Nguyễn Ngọc Huy | 2 | 2 | DA_BAN | Nguyễn Ngọc Huy/ 0978879118 đã bán   Nam 0904044889 |
| 37 | L1.110 | Trần Sơn Lâm | 2 | 2 | CHU_MOI | Chủ cũ : 0762.145.000  Chủ mới Nguyễn Bá Hiền 0934232356 |
| 38 | L1.111A | Trịnh Thị Dảo | 2 | 2 | KHACH_THUE | Trịnh Thị Dảo/ 0912.241.948,   Khách thuê LỆ 0937 182 596 |
| 39 | L1.111B | Lê Nguyên Duy | 2 | 2 |  | Lê Nguyên Duy/ 0823263669  Anh Minh 0967328985, cùng đóng phí cho L1.115 |
| 40 | L1.112 | Nguyễn Đình Bắc | 2 | 2 |  | Nguyễn Đình Bắc/ 0989146408  Nguyễn Mạnh Toàn 0334408084 |
| 41 | L1.114 | Đỗ Danh Quân | 1 | 1 |  | Đỗ Danh Quân/ 0376619619 |
| 42 | L1.115 | Trần Anh Dũng | 4 | 2 |  | Trần Anh Dũng/Chu Thị Ngân  (0936.979.555.0979.479.662)   Đã ủy quyền cho Dương Văn Lộc   0967328985 con trai chú Lộc, cùng đóng phí cho L1.111B |
| 43 | L1.116 | Đinh Văn Thắng | 2 | 3 |  | Đinh Văn Thắng/ 0913.047866  'Người thuê: Chị Hoa 0983343890, Phạm Đức Chung 0934646885 |
| 44 | L1.117 | Nguyễn Đức Anh | 2 | 3 |  | Nguyễn Đức Anh/ (0934544662)  Đỗ Hải Ngân(0772.942.009/0772.942.009) |
| 45 | L1.118 | Đỗ Khắc Việt | 2 | 3 | KHACH_THUE | Đỗ Khắc Việt/ 0356.222.556 'Hồng 0899289266  Khách thuê; Đinh Thị Khánh Hoà 0899 289 266 |
| 46 | L1.119 | Hoàng Huy Hùng | 3 | 3 |  | Hoàng Huy Hùng 0904.209.139 /   Thơm 0917.374.699  Người thuê: Thủy 0911108339 |
| 47 | L1.120 | Đào Nhật Linh | 2 | 2 |  | 0982.839.445  C Biên 0973705691 |
| 48 | L1.121 | Đỗ Thị Thu Hường | 2 | 3 | CHU_MOI | Đỗ Thị Thu Hường/ 0946399938  Chủ mới Phan Văn Dâng 0399945768, Người thuê: 0934241761 |
| 49 | L1.122 | Hoàng Minh Cường | 2 | 2 |  | Hoàng Minh Cường/ 0865120201  Chủ hộ Nguyễn Thị Hương 0989601965 |
| 50 | L1.123 | Phan Thị Bé | 3 | 3 |  | Phan Thị Bé/ 0369684272,   con trai Quang Hòa 0931999886  Chủ hộ LK1.29  0824218479 |
| 51 | L1.124 | Vũ Huy Khánh | 3 | 3 | DA_BAN | Vũ Huy Khánh/ 0936.812.679  Vũ Văn Hiệp 0936812679 đã bán  Trần Văn Cường: 0909 635586 |
| 52 | L1.201 | Vũ Thị Thúy Ngân | 3 | 3 |  | Vũ Thị Thúy Ngân/  (0903.806.238 / 0936.270.772)  Dương 0965768483 |
| 53 | L1.202 | Đặng Anh Thơ | 2 | 2 |  | Đặng Anh Thơ/ 0934357347  Trần Thị Hà 0934 357 347 |
| 54 | L1.203 | Bùi Thị Tuyết Thu | 1 | 1 |  | Bùi Thị Tuyết Thu/ (0914.028.598) |
| 55 | L1.205 | Nguyễn Thu Hường | 1 | 1 |  | Nguyễn Thu Hường/ 0833170891 |
| 56 | L1.206A | Bùi Thúy Nga | 1 | 1 |  | Bùi Thúy Nga/ 0904164879 |
| 57 | L1.206B | Lưu Văn Tăng | 1 | 1 |  | Lưu Văn Tăng/ 0977062268 |
| 58 | L1.207 | Nguyễn Thị Ngọc | 3 | 3 |  | Nguyễn Thị Ngọc/   0769.258.243 / 0972.860.080  Đoàn Thị Oanh 0934212379 |
| 59 | L1.208 | Nguyễn Duyên Linh | 1 | 1 |  | Nguyễn Duyên Linh/0915520274 |
| 60 | L1.209 | Đỗ Xuân Hồng | 1 | 1 |  | Đỗ Xuân Hồng/ 0986799917 |
| 61 | L1.210 | Vũ Hải Nam | 1 | 1 |  | Vũ Hải Nam/ 0977611988 |
| 62 | L1.211A | Phạm Phương Linh | 4 | 5 | DA_BAN, CHU_MOI | Phạm Phương Linh/0936.962.866,   chủ hộ Thảo 0942920256  Nguyễn Hưng đang ở 0972113777 / 0396 856 791  Đã bán chủ mới : Lâm 039 6856791 |
| 63 | L1.211B | Phạm Tiến Duy | 3 | 2 |  | Phạm Tiến Duy/ Chú Thịnh   0913354604 (bố của Duy)  cty đóng hộ: Ms. Hải Ninh 0985793816 |
| 64 | L1.212 | Đoàn Anh Tùng | 3 | 3 |  | Đoàn Anh Tùng/ Đinh Thị Hà My  (0912392996) mẹ 0834.725.759   Nguyễn Hưng 0972113777 cọc , ng trung quốc đag thuê |
| 65 | L1.214 | Phan Khánh Ngọc | 1 | 1 |  | Phan Khánh Ngọc/ 0936323665 |
| 66 | L1.215 | Nguyễn Thị Vân Anh | 3 | 2 | CHU_MOI | Nguyễn Thị Vân Anh/  (0392.153.816 / 0934,367,048-bố Thành.)  Chủ mới Nguyễn Thanh Hương 0989 560 628 |
| 68 | L1.217 | Đàm Ánh Linh | 1 | 1 |  | Đàm Ánh Linh/0936936836 |
| 69 | L1.218 | Phạm Thị Linh | 1 | 1 |  | Phạm Thị Linh/ 0795244807 |
| 70 | L1.219 | Nguyễn Văn Tùng | 2 | 1 |  | Nguyễn Văn Tùng/ 0982552225   0376552225 |
| 71 | L1.220 | Vũ Văn Đê | 2 | 1 |  | Vũ Văn Đê/ 0983123376  0869004101 |
| 72 | L1.221 | Nguyễn Nhật Minh | 1 | 1 |  | Nguyễn Nhật Minh/ 0936676731 |
| 73 | L1.222 | Nguyễn Ngọc Khánh Hà | 3 | 2 |  | Nguyễn Ngọc Khánh Hà   ( 0932.043.886-Hương)   Vũ Đình Ngọc 0868889423 |
| 74 | L1.223 | Vũ Thị Ngọc Hà | 2 | 3 | DA_BAN | Vũ Thị Ngọc Hà/ 0382201382   đã bán cho Bùi Khánh Linh 0827725865/ 09852 955 898 |
| 75 | L1.224 | Nguyễn Thị Phượng | 1 | 1 |  | Nguyễn Thị Phượng/ 0904.342.478 |
| 76 | L1.301 | Nguyễn Ngọc Hà | 2 | 2 |  | Nguyễn Ngọc Hà/ 0936623774 thuê bao   Chị Liên 0398867011 |
| 77 | L1.302 | Phạm Nguyễn Ngọc Mai | 3 | 3 |  | 0989.416.158  '0941478399 hoặc   cty đóng hộ: Ms. Hải Ninh 0985793816 |
| 78 | L1.303 | Đỗ Gia Phú | 1 | 1 |  | Đỗ Gia Phú/ 0912.771.168 |
| 79 | L1.305 | Đặng Thanh Bình | 2 | 2 |  | Đặng Thanh Bình/ 0982882550  Người thuê: 0945314684 |
| 80 | L1.306A | Nguyễn Thị Hồng Nhung | 2 | 2 |  | Nguyễn Thị Hồng Nhung/ 0374564076  '0912961995 |
| 81 | L1.306B | Nguyễn Minh Chai | 2 | 2 |  | Nguyễn Minh Chai/ 0982140496  Nguyễn Văn Thành 0969073473 |
| 82 | L1.307 | Nguyễn Thị Thu Thủy | 2 | 2 | DA_BAN | Nguyễn Thị Thu Thủy/ 0947.085.258   đã bán cho Bùi Xuân Bình 0942903998 |
| 83 | L1.308 | Nguyễn Thị Hồng Loan | 2 | 2 | DA_BAN | Nguyễn Thị Hồng Loan -> Oanh 0856629989   đã bán lại cho Lan 0339514072 |
| 84 | L1.309 | Đào Thị Minh Huyền | 2 | 2 |  | Đào Thị Minh Huyền/ 0965019501  cô Nhung 0989563750 |

## Nhận xét

- Các ô có nhiều dòng, nhiều số điện thoại hoặc cờ trạng thái không nên đổ thẳng vào bảng master.
- Các ô này phải đi qua bảng `ung_vien_lien_he_can_ho` để review.