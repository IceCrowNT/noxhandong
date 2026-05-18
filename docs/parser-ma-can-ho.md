# Parser mã căn hộ

## Vai trò

Parser mã căn hộ là thuật toán lõi của dự án. Nó được dùng cho:

- public lookup cư dân
- parse nội dung sao kê
- import dữ liệu vận hành
- gợi ý khớp giao dịch/căn hộ

Mục tiêu của parser không phải chỉ nhận đúng format chuẩn như `L4B.124`, mà phải hiểu các kiểu người dùng hoặc nội dung chuyển khoản hay viết:

- thiếu dấu chấm
- dùng dấu cách, gạch ngang, gạch chéo
- viết `căn`, `phòng`, `lô`, `tòa`
- đảo thứ tự phòng trước/tòa sau
- viết nhầm `IK` thay `LK`
- dính số tài khoản, số điện thoại hoặc kỳ phí

## Rule hiện tại

Parser public lookup hiện đã hỗ trợ:

- `L1.115`, `L1 115`, `L1-115`, `L1115`
- `L4A.311A`, `L4A 311A`, `311A L4A`
- `can 124 lo 4b` -> `L4B.124`
- `lo 4b can 124` -> `L4B.124`
- `LK2.24`, `LK2 24`, `LK2-24`, `IK2-24`
- `LKV.45`

Public lookup đang có bảo vệ:

- giới hạn `80` ký tự
- whitelist ký tự
- query qua Prisma, không nối SQL thủ công
- rate-limit nhẹ theo IP

## Nguồn dữ liệu parser đã tồn tại

Tài liệu này là file trung tâm cho **parser mã căn hộ**. Các nguồn sau đang là dữ liệu đầu vào hoặc tài liệu đối chiếu:

| Nguồn | Vai trò |
| --- | --- |
| `src/modules/transactions/parser/apartment-parser.ts` | Logic parser mã căn chính cho giao dịch/sao kê |
| `lib/parser/apartment-parser.test.ts` | Golden test cho parser giao dịch |
| `src/modules/billing/fee-status.ts` | Wrapper parser cho public lookup phí cư dân |
| `lib/billing/fee-status.test.ts` | Test riêng cho input public lookup |
| [filter-rules.vi.md](filter-rules.vi.md) | Rule lọc giao dịch, dùng kết quả parser để quyết định giữ/loại |
| [reports/bao-cao-loc-giao-dich-1500000-thang-5-2026.md](reports/bao-cao-loc-giao-dich-1500000-thang-5-2026.md) | Dữ liệu thật đã chỉ ra các case parser còn bỏ sót |
| [reports/loc-giao-dich-1500000-thang-5-2026.csv](reports/loc-giao-dich-1500000-thang-5-2026.csv) | File chi tiết để lấy input thật làm test |
| [module-map.md](module-map.md) | Quy ước vị trí module parser trong codebase |
| [database-v2.md](database-v2.md) | Nơi lưu kết quả parse giao dịch khi đưa pipeline sao kê vào DB |

Các tài liệu contact parser như [resident-import-rules.vi.md](resident-import-rules.vi.md), [kiem-tra-ket-qua-parse-lien-he-can-ho.md](kiem-tra-ket-qua-parse-lien-he-can-ho.md), `preview-lien-he-can-ho/` và `preview-master-lien-he-can-ho/` không phải parser mã căn, nhưng có cùng nguyên tắc vận hành:

- giữ dữ liệu gốc
- không tự đoán quá mức khi mơ hồ
- đưa case bẩn vào staging/review
- mỗi rule mới phải có preview/test để chống hồi quy

## Case thật đã phát hiện từ sao kê

Từ báo cáo lọc giao dịch `1.500.000` tháng 5/2026, có 6 dòng parser cũ từng bỏ sót nhưng người review suy luận được khá rõ. Đây là nhóm ưu tiên cao khi tiếp tục nâng cấp parser giao dịch:

| Dòng Excel | Input thật rút gọn | Kỳ vọng | Gợi ý rule |
| --- | --- | --- | --- |
| 20 | `L3p509 ... phi QLVH` | `L3.509` | nhận `p`/`phòng` dính giữa block và số phòng |
| 25 | `toa nha L4B4260977817446...` | `L4B.426` | tách mã compact trước số điện thoại |
| 26 | `L3 phong 305 tien dich vu...` | `L3.305` | block + từ khóa `phong` + số |
| 36 | `L4C phong515 ... PQL...` | `L4C.515` | từ khóa `phong` dính số |
| 40 | `107 lo 2 ... dong phi quan ly...` | `L2.107` | phòng trước, lô sau bằng từ khóa `lo` |
| 102 | `L4B p321 ... qlvh...` | `L4B.321` | alias `p` cho `phòng` |

Nhóm này nên được thêm vào `lib/parser/apartment-parser.test.ts` trước hoặc cùng lúc sửa parser. Khi đưa pipeline sao kê vào DB, kết quả parse cần lưu `matchReason` để sau này biết rule nào đã match.

## Quan hệ với filter và contact parser

Parser mã căn chỉ làm một việc: từ text thô sinh ra mã căn/candidate, ví dụ `L4B.321`.

Nó không quyết định:

- giao dịch có liên quan căn hộ hay không
- dòng contact có được nhập thẳng vào master hay không
- tháng phí đã đóng đến đâu
- có public dữ liệu cho cư dân hay không

Các quyết định đó thuộc module khác:

- `filter-rules` quyết định giữ/loại giao dịch dựa trên parser và từ khóa nghiệp vụ.
- `resident/contact parser` tách tên, số điện thoại, ghi chú từ Excel master.
- `fee tracking parser` đọc cột `Tháng đã đóng đến hiện tại`.
- `public snapshot` chỉ hiển thị dữ liệu đã được Super Admin chốt.

Quy tắc chung: parser mã căn được phép trả `candidate` và độ tin cậy, nhưng không được tự ghi DB master hoặc tự public dữ liệu.

## Danh sách case cần quản lý

Bảng này là backlog test/parser. Một phần đã pass, một phần là case cần bổ sung dần khi gặp dữ liệu thật.

| # | Input mẫu | Kỳ vọng | Nhóm |
| --- | --- | --- | --- |
| 1 | `L1.115` | `L1.115` | chuẩn |
| 2 | `l1.115` | `L1.115` | chữ thường |
| 3 | ` L1.115 ` | `L1.115` | khoảng trắng |
| 4 | `L1 115` | `L1.115` | dấu cách |
| 5 | `L1-115` | `L1.115` | gạch ngang |
| 6 | `L1/115` | `L1.115` | gạch chéo |
| 7 | `L1_115` | `L1.115` | gạch dưới |
| 8 | `L1,115` | `L1.115` | dấu phẩy |
| 9 | `L1115` | `L1.115` | compact |
| 10 | `l1115` | `L1.115` | compact chữ thường |
| 11 | `can ho L1 115` | `L1.115` | có từ khóa |
| 12 | `căn hộ L1.115` | `L1.115` | có dấu tiếng Việt |
| 13 | `can L1/115` | `L1.115` | từ khóa + slash |
| 14 | `tra cuu can L1 115` | `L1.115` | câu tự nhiên |
| 15 | `toi o L1.115` | `L1.115` | câu tự nhiên |
| 16 | `L4A.311A` | `L4A.311A` | suffix |
| 17 | `l4a311a` | `L4A.311A` | compact suffix |
| 18 | `L4A 311A` | `L4A.311A` | dấu cách suffix |
| 19 | `L4A-311A` | `L4A.311A` | gạch ngang suffix |
| 20 | `L4A/311A` | `L4A.311A` | slash suffix |
| 21 | `311A L4A` | `L4A.311A` | đảo thứ tự |
| 22 | `311A/L4A` | `L4A.311A` | đảo thứ tự slash |
| 23 | `can 311A toa L4A` | `L4A.311A` | phòng trước tòa sau |
| 24 | `phong 311A toa L4A` | `L4A.311A` | phòng/tòa |
| 25 | `toa L4A phong 311A` | `L4A.311A` | tòa/phòng |
| 26 | `can 124 lo 4b` | `L4B.124` | lô không có chữ L |
| 27 | `căn 124 lô 4b` | `L4B.124` | lô tiếng Việt |
| 28 | `phong 124 toa 4b` | `L4B.124` | tòa không có chữ L |
| 29 | `lo 4b can 124` | `L4B.124` | đảo lô/căn |
| 30 | `toa 4b phong 124` | `L4B.124` | đảo tòa/phòng |
| 31 | `124lo4b` | `L4B.124` | compact lô |
| 32 | `124 toa 4b` | `L4B.124` | thiếu từ căn |
| 33 | `124 lô 4b` | `L4B.124` | thiếu từ căn |
| 34 | `4b 124` | cần cân nhắc | quá mơ hồ |
| 35 | `block 4b room 124` | `L4B.124` | tiếng Anh |
| 36 | `room 124 block 4b` | `L4B.124` | tiếng Anh đảo |
| 37 | `blk 4b 124` | `L4B.124` | viết tắt |
| 38 | `L4C.506B` | `L4C.506B` | suffix B |
| 39 | `L4C506B` | `L4C.506B` | compact suffix B |
| 40 | `506B L4C` | `L4C.506B` | đảo suffix B |
| 41 | `L2.406b` | `L2.406B` | suffix thường |
| 42 | `L1A.111C` | `L1A.111C` | block có suffix |
| 43 | `L1A111C` | `L1A.111C` | compact block suffix |
| 44 | `111B L1B` | `L1B.111B` | đảo block suffix |
| 45 | `L2A205F` | `L2A.205F` | suffix F |
| 46 | `LK2.24` | `LK2.24` | liền kề |
| 47 | `lk2 24` | `LK2.24` | liền kề cách |
| 48 | `LK2-24` | `LK2.24` | liền kề gạch ngang |
| 49 | `IK2-24` | `LK2.24` | nhầm I/L |
| 50 | `24 LK2` | `LK2.24` | liền kề đảo |
| 51 | `lien ke 2 can 24` | `LK2.24` | cần bổ sung |
| 52 | `liền kề 2 số 24` | `LK2.24` | cần bổ sung |
| 53 | `lk 2 24` | `LK2.24` | cần bổ sung |
| 54 | `LK2 nha 24` | `LK2.24` | cần bổ sung |
| 55 | `LKV.45` | `LKV.45` | LKV |
| 56 | `lkv45` | `LKV.45` | cần bổ sung |
| 57 | `LKV 45` | `LKV.45` | cần bổ sung |
| 58 | `lien ke v 45` | `LKV.45` | cần bổ sung |
| 59 | `villa 45` | `LKV.45` | cần quyết định |
| 60 | `L4B 412 phi qlvh` | `L4B.412` | có nghiệp vụ |
| 61 | `phi L4B 412` | `L4B.412` | có nghiệp vụ |
| 62 | `PQLCC 106B L1 thang 3` | `L1.106B` | thực tế sao kê |
| 63 | `107lo2 co k phi chung cu` | `L2.107` | alias lô |
| 64 | `L2 phong 307 0912435236` | `L2.307` | kèm số điện thoại |
| 65 | `L23070912435236 nop phi` | `L2.307` | dính số dài |
| 66 | `L4B 114 0906018679 nop phi` | `L4B.114` | tránh ăn số điện thoại |
| 67 | `MBVCB 13590264132 100558 L4B 114` | `L4B.114` | tránh số tài khoản |
| 68 | `L4B/320 0339349386` | `L4B.320` | slash + phone |
| 69 | `511A L4B 0868198425` | `L4B.511A` | room trước + phone |
| 70 | `L4C phong515` | `L4C.515` | cần bổ sung compact từ khóa |
| 71 | `toa nha L4B can 425` | `L4B.425` | từ khóa dài |
| 72 | `L4B can so 425` | `L4B.425` | số nhà |
| 73 | `L4B so nha 425` | `L4B.425` | số nhà |
| 74 | `can so 425 L4B` | `L4B.425` | đảo số nhà |
| 75 | `L4B-425+0796104179` | `L4B.425` | ký tự cộng |
| 76 | `L4B.425.0796104179` | `L4B.425` | nhiều dấu chấm |
| 77 | `L4B 0425` | cần quyết định | số có leading zero |
| 78 | `L04B.425` | cần quyết định | block có leading zero |
| 79 | `L4B tầng 4 phòng 425` | `L4B.425` | có tầng |
| 80 | `phong 425 tang 4 toa B` | cần quyết định | thiếu L4B rõ ràng |
| 81 | `can ho 4B-425` | `L4B.425` | cần bổ sung |
| 82 | `4B-425` | cần cân nhắc | mơ hồ nhưng hay gặp |
| 83 | `B425 L4` | cần quyết định | block/room đảo lạ |
| 84 | `L4 B 425` | `L4B.425` | cần bổ sung |
| 85 | `L 4B 425` | `L4B.425` | cần bổ sung |
| 86 | `L4B425` | `L4B.425` | compact |
| 87 | `L4b 425` | `L4B.425` | chữ thường |
| 88 | `căn: L4B-425` | `L4B.425` | dấu câu |
| 89 | `ma can L4B425` | `L4B.425` | từ khóa |
| 90 | `mã căn L4B.425` | `L4B.425` | tiếng Việt |
| 91 | `L4B 425, L4B 426` | multi-candidate | nhiều căn |
| 92 | `L4B 425 va L4C 426` | multi-candidate | nhiều căn |
| 93 | `L4B425L4C426` | cần tránh | quá dính |
| 94 | `L4B 425/426` | cần quyết định | nhiều phòng cùng lô |
| 95 | `L4B 425-426` | cần quyết định | range |
| 96 | `L4B 42` | không parse | thiếu số |
| 97 | `L4B 9999` | không parse | quá dài |
| 98 | `0906123456` | không parse | số điện thoại |
| 99 | `116002961023` | không parse | số tài khoản |
| 100 | `L1.115' OR 1=1 --` | reject | bảo mật |

## Phương án quản lý và bảo trì

### 0. Version hóa parser

Mỗi lần đổi rule đáng kể cần ghi version parser trong code và trong dữ liệu parse:

- ví dụ: `apartment-code-parser-v0.2`
- khi parse giao dịch vào DB, lưu version vào `ket_qua_parse_giao_dich.phien_ban_parser`
- khi tạo report, thống kê theo version để biết kết quả được sinh bởi rule nào

Nếu một report cũ đang dùng parser version cũ, không được coi đó là lỗi dữ liệu mới nếu chưa chạy lại report.

### 1. Tách parser thành module có contract rõ

Parser nên có contract ổn định:

- input: chuỗi thô
- output:
  - `parsedApartmentCode`
  - `candidates`
  - `matchReason`
  - `confidence/score`
  - `normalizedDescription`

Không query DB trong parser. DB matching là bước sau.

### 2. Duy trì golden test set

Mọi case thật gặp ngoài vận hành phải được thêm vào test trước hoặc cùng lúc sửa parser.

File test hiện tại:

- `lib/parser/apartment-parser.test.ts`
- `lib/billing/fee-status.test.ts`

Nhóm test bắt buộc nên có:

- positive case: input phải ra đúng mã căn
- negative case: input không được parse nhầm, ví dụ số điện thoại/số tài khoản
- ambiguity case: input chỉ nên trả candidate hoặc `NEED_REVIEW`, không auto-map
- public lookup case: input cư dân hay gõ phải ra đúng kết quả
- transaction case: input sao kê thật phải không làm hỏng filter/matcher

Khi thêm rule mới:

1. thêm case pass mong muốn
2. thêm case chống false-positive
3. chạy `npm test`
4. ghi thay đổi vào tài liệu này nếu là nhóm rule mới

### 3. Phân nhóm rule theo độ tin cậy

Nên giữ score theo nhóm:

- exact/dotted format: rất cao
- block-room có từ khóa: cao
- room-block đảo: cao vừa
- compact không dấu phân cách: trung bình
- suy luận từ `lô/tòa/phòng`: trung bình
- case mơ hồ: không auto-map, chỉ gợi ý candidate

### 4. Có blacklist false-positive

Parser phải chống các nhóm số không phải mã căn:

- số điện thoại
- số tài khoản
- mã giao dịch
- ngày tháng
- số tiền
- chuỗi kỳ phí như `T5-T10`

### 5. Có bộ đo chất lượng parser

Nên tạo báo cáo định kỳ:

- tổng input đã parse
- số parse được 1 candidate
- số multi-candidate
- số không parse được
- top `matchReason`
- top false-positive do người dùng sửa tay

### 6. Quy trình update thuật toán

Khi gặp input mới:

1. lưu input thật vào danh sách case.
2. xác định expected output.
3. phân loại: exact, alias, typo, compact, ambiguous, invalid.
4. thêm test.
5. sửa parser nhỏ nhất có thể.
6. chạy test toàn bộ.
7. kiểm tra không làm hỏng case cũ.
8. cập nhật tài liệu parser nếu thêm nhóm rule mới.

### 7. Quy tắc an toàn cho public lookup

Public lookup phải luôn:

- giới hạn độ dài input
- whitelist ký tự
- rate-limit
- không nối SQL thủ công
- chỉ query batch public hiện hành
- không trả dữ liệu nhạy cảm

### 8. Không auto-map case mơ hồ

Các case như `4B 124`, `B425 L4`, `L4B 425/426` cần được review trước khi auto-map, vì có thể gây sai căn.

Parser có thể trả candidate, nhưng UI/admin cần đánh dấu `NEED_REVIEW` nếu độ tin cậy thấp.

### 9. Quy trình cập nhật file xương sống

Khi thay đổi parser mã căn:

1. cập nhật file này nếu thêm nhóm rule mới.
2. cập nhật test trong `lib/parser/apartment-parser.test.ts` hoặc `lib/billing/fee-status.test.ts`.
3. nếu rule ảnh hưởng lọc giao dịch, cập nhật [filter-rules.vi.md](filter-rules.vi.md).
4. nếu rule ảnh hưởng pipeline DB, cập nhật [database-v2.md](database-v2.md) hoặc field `matchReason`/`phien_ban_parser` tương ứng.
5. cập nhật [roadmap.md](roadmap.md), [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md), [handoff.md](handoff.md) nếu đây là mốc nghiệm thu.

## Backlog ưu tiên gần

1. Đưa 6 case thật từ báo cáo giao dịch 1.500.000 tháng 5/2026 vào golden test.
2. Chuẩn hóa alias `p`, `phong`, `phòng`, `can`, `căn`, `lo`, `lô`, `toa`, `tòa`.
3. Bổ sung chống false-positive khi mã căn compact dính số điện thoại hoặc số tài khoản.
4. Tách rõ output `single high confidence`, `multi candidate`, `need review`, `invalid`.
5. Khi làm Task M, lưu `matchReason`, `confidence`, `phien_ban_parser` vào DB để audit.
