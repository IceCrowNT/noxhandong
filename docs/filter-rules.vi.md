# Bo quy tac loc giao dich

File code chinh dang chay:
- `lib/filter-rules.ts`
- `lib/matcher.ts`

File nay chi dung de doi chieu nghiep vu. Khong co logic thuc thi o day.

Rule chi tiết, backlog test và quy trình bảo trì parser mã căn nằm tại:

- [parser-ma-can-ho.md](parser-ma-can-ho.md)

File này chỉ mô tả cách bộ lọc sử dụng tín hiệu parser để giữ/loại giao dịch.

## Muc tieu

Bo loc chi co quyen dua mot dong vao nhom `Khong lien quan can ho` khi co dau hieu noi bo ro rang, hoac khong du bang chung de coi do la khoan cu dan dong phi.

## Dinh dang ma can ho

Hien tai parser ho tro 2 nhom ma:

- `Lx.xxx` hoac `LxA.xxxA`
  - vi du: `L2.212`, `L4B.519`, `L4C.406A`
- `LKx.x` hoac `LKx.xx`
  - vi du: `LK2.4`, `LK2.24`, `LK2.25`

Quy uoc moi:
- `LK` = lien ke
- `LK2-24` duoc chuan hoa thanh `LK2.24`
- `IK2-25` trong sao ke co the la loi OCR/typing, parser se coi nhu `LK2.25`
- `107lo2` duoc hieu la `L2.107` theo ngu canh phong truoc, lo sau

Neu mot dong co:
- ma can parse duoc
- hoac ma can hop le trong danh sach khach hang
- va co tu khoa dong phi nhu `PHI`, `QLVH`, `QLCC`, `NOP PHI`, `DONG PHI`

thi uu tien giu lai de match can ho, khong duoc loai chi vi phia cuoi co `BQT`, `NOXH`, ten tai khoan nhan tien, hoac mo ta tai khoan dich.

## Nhom rule

### 1. Tu khoa noi bo cung

Neu mo ta chua mot trong cac tu khoa sau, dong se bi dua vao `Khong lien quan can ho`:

- `TRA LAI TAI KHOAN`
- `DDA`
- `BHXH`
- `BHYT`
- `BHTN`
- `LUONG`
- `THU LAO`

Vi du:
- `Tra lai tai khoan DDA`
- `Thanh toan BHXH BHYT BHTN`
- `Thu lao BQT thang 3`

### 2. Tu khoa noi bo mem

Day la cac tu khoa chi duoc coi la noi bo khi KHONG co tin hieu cu dan dong phi:

- `BQT`
- `NOXH`
- `BAN QUAN TRI`

Neu co ma can + co `PHI` hoac `QLVH` thi KHONG duoc loai bo.

Vi du dung:
- `CT DI ... bqt noxh an dong tt dv an ninh t3.2026`
- `BQT khu nha o xa hoi thu chi noi bo`

Vi du khong duoc loai:
- `L4B 519 ... nop phi QLVH thang 4 ... toi 116002961023 BQT KHU NHA O XA HOI ...`
- `Can ho 407L4B ky phi QLVH ... toi ... BQT KHU NHA O XA HOI ...`

### 3. Giao dich chuyen khoan chung chung

Neu khong co ngu canh can ho va mo ta chua mot trong cac tu khoa sau, dong se bi dua vao `Khong lien quan can ho`:

- `CHUYEN KHOAN NHANH`
- `QUA ZALO`
- `CHUYEN KHOAN`
- `CK NHANH`
- `NHANH QUA`
- `NAP TIEN`
- `HOAN TIEN`

Vi du:
- `Mai Anh Vu chuyen khoan nhanh qua Zalo`
- `CK nhanh qua Zalo`

### 4. Nguong so tien toi thieu

Neu KHONG co tin hieu cu dan dong phi va so tien nho hon `100.000`, dong se bi dua vao `Khong lien quan can ho`.

Vi du:
- `80.000` va mo ta khong co ma can, khong co `PHI`, `QLVH`, `CAN HO`

Nguoc lai:
- `250.000` co `L4C 406A dong phi cc t4` thi khong duoc loai

### 5. So tien bang 0 hoac am

Neu so tien `<= 0`, dong se bi dua vao `Khong lien quan can ho`.

Vi du:
- `0` + `bqt noxh an dong tt dv an ninh t3.2026`

## Tin hieu giu lai de ra soat can ho

Chi can mot dong co mot trong cac nhom dau hieu sau, bo loc phai uu tien giu lai:

- parse duoc ma can
- ma can hop le trong file quan ly
- co tu khoa:
  - `PHI`
  - `QLVH`
  - `QLCC`
  - `PQLCC`
  - `CAN HO`
  - `CHUNG CU`
  - `NOP PHI`
  - `DONG PHI`
  - `TU THANG`
  - `DEN THANG`

Vi du phai giu lai:
- `Can ho 407L4B ky phi QLVH thang 04 2026 den thang 09 2026`
- `L4B 519 ... nop phi QLVH thang 4 den t5 2026`
- `Long L4C 406A dong phi cc t4`
- `L4C 332 ... ky phi QLVH tu thang 4 den thang 6`

## Cach doc ly do tren UI

Khi mot dong bi dua vao `Khong lien quan can ho`, cot `Ly do` se ghi ro:

- bi loc vi tu khoa noi bo cung nao
- hoac vi so tien <= 0
- hoac vi so tien nho hon nguong va khong co tin hieu cu dan dong phi
- hoac vi giao dich chuyen khoan chung chung khong co ngu canh can ho

Neu UI dang hien mot dong co ma can ro rang + `PHI/QLVH` ma van bi loai, do la dau hieu bo loc dang chay sai version hoac con mot rule short-circuit chua duoc go.
