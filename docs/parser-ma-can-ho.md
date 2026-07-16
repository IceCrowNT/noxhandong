# Parser mÃ£ cÄƒn há»™

## Vai trÃ²

Parser mÃ£ cÄƒn há»™ lÃ  thuáº­t toÃ¡n lÃµi cá»§a dá»± Ã¡n. NÃ³ Ä‘Æ°á»£c dÃ¹ng cho:

- public lookup cÆ° dÃ¢n
- parse ná»™i dung sao kÃª
- import dá»¯ liá»‡u váº­n hÃ nh
- gá»£i Ã½ khá»›p giao dá»‹ch/cÄƒn há»™

Má»¥c tiÃªu cá»§a parser khÃ´ng pháº£i chá»‰ nháº­n Ä‘Ãºng format chuáº©n nhÆ° `L4B.124`, mÃ  pháº£i hiá»ƒu cÃ¡c kiá»ƒu ngÆ°á»i dÃ¹ng hoáº·c ná»™i dung chuyá»ƒn khoáº£n hay viáº¿t:

- thiáº¿u dáº¥u cháº¥m
- dÃ¹ng dáº¥u cÃ¡ch, gáº¡ch ngang, gáº¡ch chÃ©o
- viáº¿t `cÄƒn`, `phÃ²ng`, `lÃ´`, `tÃ²a`
- Ä‘áº£o thá»© tá»± phÃ²ng trÆ°á»›c/tÃ²a sau
- viáº¿t nháº§m `IK` thay `LK`
- dÃ­nh sá»‘ tÃ i khoáº£n, sá»‘ Ä‘iá»‡n thoáº¡i hoáº·c ká»³ phÃ­

## Rule hiá»‡n táº¡i

Parser public lookup hiá»‡n Ä‘Ã£ há»— trá»£:

- `L1.115`, `L1 115`, `L1-115`, `L1115`
- `L4A.311A`, `L4A 311A`, `311A L4A`
- `can 124 lo 4b` -> `L4B.124`
- `lo 4b can 124` -> `L4B.124`
- `LK2.24`, `LK2 24`, `LK2-24`, `IK2-24`
- `LKV.45`

Public lookup Ä‘ang cÃ³ báº£o vá»‡:

- giá»›i háº¡n `80` kÃ½ tá»±
- whitelist kÃ½ tá»±
- query qua Prisma, khÃ´ng ná»‘i SQL thá»§ cÃ´ng
- rate-limit nháº¹ theo IP

## Nguá»“n dá»¯ liá»‡u parser Ä‘Ã£ tá»“n táº¡i

TÃ i liá»‡u nÃ y lÃ  file trung tÃ¢m cho **parser mÃ£ cÄƒn há»™**. CÃ¡c nguá»“n sau Ä‘ang lÃ  dá»¯ liá»‡u Ä‘áº§u vÃ o hoáº·c tÃ i liá»‡u Ä‘á»‘i chiáº¿u:

| Nguá»“n | Vai trÃ² |
| --- | --- |
| `src/modules/transactions/parser/apartment-parser.ts` | Logic parser mÃ£ cÄƒn chÃ­nh cho giao dá»‹ch/sao kÃª |
| `lib/parser/apartment-parser.test.ts` | Golden test cho parser giao dá»‹ch |
| `src/modules/billing/fee-status.ts` | Wrapper parser cho public lookup phÃ­ cÆ° dÃ¢n |
| `lib/billing/fee-status.test.ts` | Test riÃªng cho input public lookup |
| [filter-rules.vi.md](filter-rules.vi.md) | Rule lá»c giao dá»‹ch, dÃ¹ng káº¿t quáº£ parser Ä‘á»ƒ quyáº¿t Ä‘á»‹nh giá»¯/loáº¡i |
| [reports/bao-cao-loc-giao-dich-1500000-thang-5-2026.md](reports/bao-cao-loc-giao-dich-1500000-thang-5-2026.md) | Dá»¯ liá»‡u tháº­t Ä‘Ã£ chá»‰ ra cÃ¡c case parser cÃ²n bá» sÃ³t |
| [reports/loc-giao-dich-1500000-thang-5-2026.csv](reports/loc-giao-dich-1500000-thang-5-2026.csv) | File chi tiáº¿t Ä‘á»ƒ láº¥y input tháº­t lÃ m test |
| [module-map.md](module-map.md) | Quy Æ°á»›c vá»‹ trÃ­ module parser trong codebase |
| [database.md](database.md) | NÆ¡i lÆ°u káº¿t quáº£ parse giao dá»‹ch khi Ä‘Æ°a pipeline sao kÃª vÃ o DB |

CÃ¡c tÃ i liá»‡u contact parser nhÆ° [resident-import-rules.vi.md](resident-import-rules.vi.md), [kiem-tra-ket-qua-parse-lien-he-can-ho.md](kiem-tra-ket-qua-parse-lien-he-can-ho.md), `preview-lien-he-can-ho/` vÃ  `preview-master-lien-he-can-ho/` khÃ´ng pháº£i parser mÃ£ cÄƒn, nhÆ°ng cÃ³ cÃ¹ng nguyÃªn táº¯c váº­n hÃ nh:

- giá»¯ dá»¯ liá»‡u gá»‘c
- khÃ´ng tá»± Ä‘oÃ¡n quÃ¡ má»©c khi mÆ¡ há»“
- Ä‘Æ°a case báº©n vÃ o staging/review
- má»—i rule má»›i pháº£i cÃ³ preview/test Ä‘á»ƒ chá»‘ng há»“i quy

## Case tháº­t Ä‘Ã£ phÃ¡t hiá»‡n tá»« sao kÃª

Tá»« bÃ¡o cÃ¡o lá»c giao dá»‹ch `1.500.000` thÃ¡ng 5/2026, cÃ³ 6 dÃ²ng parser cÅ© tá»«ng bá» sÃ³t nhÆ°ng ngÆ°á»i review suy luáº­n Ä‘Æ°á»£c khÃ¡ rÃµ. ÄÃ¢y lÃ  nhÃ³m Æ°u tiÃªn cao khi tiáº¿p tá»¥c nÃ¢ng cáº¥p parser giao dá»‹ch:

| DÃ²ng Excel | Input tháº­t rÃºt gá»n | Ká»³ vá»ng | Gá»£i Ã½ rule |
| --- | --- | --- | --- |
| 20 | `L3p509 ... phi QLVH` | `L3.509` | nháº­n `p`/`phÃ²ng` dÃ­nh giá»¯a block vÃ  sá»‘ phÃ²ng |
| 25 | `toa nha L4B4260977817446...` | `L4B.426` | tÃ¡ch mÃ£ compact trÆ°á»›c sá»‘ Ä‘iá»‡n thoáº¡i |
| 26 | `L3 phong 305 tien dich vu...` | `L3.305` | block + tá»« khÃ³a `phong` + sá»‘ |
| 36 | `L4C phong515 ... PQL...` | `L4C.515` | tá»« khÃ³a `phong` dÃ­nh sá»‘ |
| 40 | `107 lo 2 ... dong phi quan ly...` | `L2.107` | phÃ²ng trÆ°á»›c, lÃ´ sau báº±ng tá»« khÃ³a `lo` |
| 102 | `L4B p321 ... qlvh...` | `L4B.321` | alias `p` cho `phÃ²ng` |

NhÃ³m nÃ y nÃªn Ä‘Æ°á»£c thÃªm vÃ o `lib/parser/apartment-parser.test.ts` trÆ°á»›c hoáº·c cÃ¹ng lÃºc sá»­a parser. Khi Ä‘Æ°a pipeline sao kÃª vÃ o DB, káº¿t quáº£ parse cáº§n lÆ°u `matchReason` Ä‘á»ƒ sau nÃ y biáº¿t rule nÃ o Ä‘Ã£ match.

## Quan há»‡ vá»›i filter vÃ  contact parser

Parser mÃ£ cÄƒn chá»‰ lÃ m má»™t viá»‡c: tá»« text thÃ´ sinh ra mÃ£ cÄƒn/candidate, vÃ­ dá»¥ `L4B.321`.

NÃ³ khÃ´ng quyáº¿t Ä‘á»‹nh:

- giao dá»‹ch cÃ³ liÃªn quan cÄƒn há»™ hay khÃ´ng
- dÃ²ng contact cÃ³ Ä‘Æ°á»£c nháº­p tháº³ng vÃ o master hay khÃ´ng
- thÃ¡ng phÃ­ Ä‘Ã£ Ä‘Ã³ng Ä‘áº¿n Ä‘Ã¢u
- cÃ³ public dá»¯ liá»‡u cho cÆ° dÃ¢n hay khÃ´ng

CÃ¡c quyáº¿t Ä‘á»‹nh Ä‘Ã³ thuá»™c module khÃ¡c:

- `filter-rules` quyáº¿t Ä‘á»‹nh giá»¯/loáº¡i giao dá»‹ch dá»±a trÃªn parser vÃ  tá»« khÃ³a nghiá»‡p vá»¥.
- `resident/contact parser` tÃ¡ch tÃªn, sá»‘ Ä‘iá»‡n thoáº¡i, ghi chÃº tá»« Excel master.
- `fee tracking parser` Ä‘á»c cá»™t `ThÃ¡ng Ä‘Ã£ Ä‘Ã³ng Ä‘áº¿n hiá»‡n táº¡i`.
- `public snapshot` chá»‰ hiá»ƒn thá»‹ dá»¯ liá»‡u Ä‘Ã£ Ä‘Æ°á»£c Super Admin chá»‘t.

Quy táº¯c chung: parser mÃ£ cÄƒn Ä‘Æ°á»£c phÃ©p tráº£ `candidate` vÃ  Ä‘á»™ tin cáº­y, nhÆ°ng khÃ´ng Ä‘Æ°á»£c tá»± ghi DB master hoáº·c tá»± public dá»¯ liá»‡u.

## Danh sÃ¡ch case cáº§n quáº£n lÃ½

Báº£ng nÃ y lÃ  backlog test/parser. Má»™t pháº§n Ä‘Ã£ pass, má»™t pháº§n lÃ  case cáº§n bá»• sung dáº§n khi gáº·p dá»¯ liá»‡u tháº­t.

| # | Input máº«u | Ká»³ vá»ng | NhÃ³m |
| --- | --- | --- | --- |
| 1 | `L1.115` | `L1.115` | chuáº©n |
| 2 | `l1.115` | `L1.115` | chá»¯ thÆ°á»ng |
| 3 | ` L1.115 ` | `L1.115` | khoáº£ng tráº¯ng |
| 4 | `L1 115` | `L1.115` | dáº¥u cÃ¡ch |
| 5 | `L1-115` | `L1.115` | gáº¡ch ngang |
| 6 | `L1/115` | `L1.115` | gáº¡ch chÃ©o |
| 7 | `L1_115` | `L1.115` | gáº¡ch dÆ°á»›i |
| 8 | `L1,115` | `L1.115` | dáº¥u pháº©y |
| 9 | `L1115` | `L1.115` | compact |
| 10 | `l1115` | `L1.115` | compact chá»¯ thÆ°á»ng |
| 11 | `can ho L1 115` | `L1.115` | cÃ³ tá»« khÃ³a |
| 12 | `cÄƒn há»™ L1.115` | `L1.115` | cÃ³ dáº¥u tiáº¿ng Viá»‡t |
| 13 | `can L1/115` | `L1.115` | tá»« khÃ³a + slash |
| 14 | `tra cuu can L1 115` | `L1.115` | cÃ¢u tá»± nhiÃªn |
| 15 | `toi o L1.115` | `L1.115` | cÃ¢u tá»± nhiÃªn |
| 16 | `L4A.311A` | `L4A.311A` | suffix |
| 17 | `l4a311a` | `L4A.311A` | compact suffix |
| 18 | `L4A 311A` | `L4A.311A` | dáº¥u cÃ¡ch suffix |
| 19 | `L4A-311A` | `L4A.311A` | gáº¡ch ngang suffix |
| 20 | `L4A/311A` | `L4A.311A` | slash suffix |
| 21 | `311A L4A` | `L4A.311A` | Ä‘áº£o thá»© tá»± |
| 22 | `311A/L4A` | `L4A.311A` | Ä‘áº£o thá»© tá»± slash |
| 23 | `can 311A toa L4A` | `L4A.311A` | phÃ²ng trÆ°á»›c tÃ²a sau |
| 24 | `phong 311A toa L4A` | `L4A.311A` | phÃ²ng/tÃ²a |
| 25 | `toa L4A phong 311A` | `L4A.311A` | tÃ²a/phÃ²ng |
| 26 | `can 124 lo 4b` | `L4B.124` | lÃ´ khÃ´ng cÃ³ chá»¯ L |
| 27 | `cÄƒn 124 lÃ´ 4b` | `L4B.124` | lÃ´ tiáº¿ng Viá»‡t |
| 28 | `phong 124 toa 4b` | `L4B.124` | tÃ²a khÃ´ng cÃ³ chá»¯ L |
| 29 | `lo 4b can 124` | `L4B.124` | Ä‘áº£o lÃ´/cÄƒn |
| 30 | `toa 4b phong 124` | `L4B.124` | Ä‘áº£o tÃ²a/phÃ²ng |
| 31 | `124lo4b` | `L4B.124` | compact lÃ´ |
| 32 | `124 toa 4b` | `L4B.124` | thiáº¿u tá»« cÄƒn |
| 33 | `124 lÃ´ 4b` | `L4B.124` | thiáº¿u tá»« cÄƒn |
| 34 | `4b 124` | cáº§n cÃ¢n nháº¯c | quÃ¡ mÆ¡ há»“ |
| 35 | `block 4b room 124` | `L4B.124` | tiáº¿ng Anh |
| 36 | `room 124 block 4b` | `L4B.124` | tiáº¿ng Anh Ä‘áº£o |
| 37 | `blk 4b 124` | `L4B.124` | viáº¿t táº¯t |
| 38 | `L4C.506B` | `L4C.506B` | suffix B |
| 39 | `L4C506B` | `L4C.506B` | compact suffix B |
| 40 | `506B L4C` | `L4C.506B` | Ä‘áº£o suffix B |
| 41 | `L2.406b` | `L2.406B` | suffix thÆ°á»ng |
| 42 | `L1A.111C` | `L1A.111C` | block cÃ³ suffix |
| 43 | `L1A111C` | `L1A.111C` | compact block suffix |
| 44 | `111B L1B` | `L1B.111B` | Ä‘áº£o block suffix |
| 45 | `L2A205F` | `L2A.205F` | suffix F |
| 46 | `LK2.24` | `LK2.24` | liá»n ká» |
| 47 | `lk2 24` | `LK2.24` | liá»n ká» cÃ¡ch |
| 48 | `LK2-24` | `LK2.24` | liá»n ká» gáº¡ch ngang |
| 49 | `IK2-24` | `LK2.24` | nháº§m I/L |
| 50 | `24 LK2` | `LK2.24` | liá»n ká» Ä‘áº£o |
| 51 | `lien ke 2 can 24` | `LK2.24` | cáº§n bá»• sung |
| 52 | `liá»n ká» 2 sá»‘ 24` | `LK2.24` | cáº§n bá»• sung |
| 53 | `lk 2 24` | `LK2.24` | cáº§n bá»• sung |
| 54 | `LK2 nha 24` | `LK2.24` | cáº§n bá»• sung |
| 55 | `LKV.45` | `LKV.45` | LKV |
| 56 | `lkv45` | `LKV.45` | cáº§n bá»• sung |
| 57 | `LKV 45` | `LKV.45` | cáº§n bá»• sung |
| 58 | `lien ke v 45` | `LKV.45` | cáº§n bá»• sung |
| 59 | `villa 45` | `LKV.45` | cáº§n quyáº¿t Ä‘á»‹nh |
| 60 | `L4B 412 phi qlvh` | `L4B.412` | cÃ³ nghiá»‡p vá»¥ |
| 61 | `phi L4B 412` | `L4B.412` | cÃ³ nghiá»‡p vá»¥ |
| 62 | `PQLCC 106B L1 thang 3` | `L1.106B` | thá»±c táº¿ sao kÃª |
| 63 | `107lo2 co k phi chung cu` | `L2.107` | alias lÃ´ |
| 64 | `L2 phong 307 0912435236` | `L2.307` | kÃ¨m sá»‘ Ä‘iá»‡n thoáº¡i |
| 65 | `L23070912435236 nop phi` | `L2.307` | dÃ­nh sá»‘ dÃ i |
| 66 | `L4B 114 0906018679 nop phi` | `L4B.114` | trÃ¡nh Äƒn sá»‘ Ä‘iá»‡n thoáº¡i |
| 67 | `MBVCB 13590264132 100558 L4B 114` | `L4B.114` | trÃ¡nh sá»‘ tÃ i khoáº£n |
| 68 | `L4B/320 0339349386` | `L4B.320` | slash + phone |
| 69 | `511A L4B 0868198425` | `L4B.511A` | room trÆ°á»›c + phone |
| 70 | `L4C phong515` | `L4C.515` | cáº§n bá»• sung compact tá»« khÃ³a |
| 71 | `toa nha L4B can 425` | `L4B.425` | tá»« khÃ³a dÃ i |
| 72 | `L4B can so 425` | `L4B.425` | sá»‘ nhÃ  |
| 73 | `L4B so nha 425` | `L4B.425` | sá»‘ nhÃ  |
| 74 | `can so 425 L4B` | `L4B.425` | Ä‘áº£o sá»‘ nhÃ  |
| 75 | `L4B-425+0796104179` | `L4B.425` | kÃ½ tá»± cá»™ng |
| 76 | `L4B.425.0796104179` | `L4B.425` | nhiá»u dáº¥u cháº¥m |
| 77 | `L4B 0425` | cáº§n quyáº¿t Ä‘á»‹nh | sá»‘ cÃ³ leading zero |
| 78 | `L04B.425` | cáº§n quyáº¿t Ä‘á»‹nh | block cÃ³ leading zero |
| 79 | `L4B táº§ng 4 phÃ²ng 425` | `L4B.425` | cÃ³ táº§ng |
| 80 | `phong 425 tang 4 toa B` | cáº§n quyáº¿t Ä‘á»‹nh | thiáº¿u L4B rÃµ rÃ ng |
| 81 | `can ho 4B-425` | `L4B.425` | cáº§n bá»• sung |
| 82 | `4B-425` | cáº§n cÃ¢n nháº¯c | mÆ¡ há»“ nhÆ°ng hay gáº·p |
| 83 | `B425 L4` | cáº§n quyáº¿t Ä‘á»‹nh | block/room Ä‘áº£o láº¡ |
| 84 | `L4 B 425` | `L4B.425` | cáº§n bá»• sung |
| 85 | `L 4B 425` | `L4B.425` | cáº§n bá»• sung |
| 86 | `L4B425` | `L4B.425` | compact |
| 87 | `L4b 425` | `L4B.425` | chá»¯ thÆ°á»ng |
| 88 | `cÄƒn: L4B-425` | `L4B.425` | dáº¥u cÃ¢u |
| 89 | `ma can L4B425` | `L4B.425` | tá»« khÃ³a |
| 90 | `mÃ£ cÄƒn L4B.425` | `L4B.425` | tiáº¿ng Viá»‡t |
| 91 | `L4B 425, L4B 426` | multi-candidate | nhiá»u cÄƒn |
| 92 | `L4B 425 va L4C 426` | multi-candidate | nhiá»u cÄƒn |
| 93 | `L4B425L4C426` | cáº§n trÃ¡nh | quÃ¡ dÃ­nh |
| 94 | `L4B 425/426` | cáº§n quyáº¿t Ä‘á»‹nh | nhiá»u phÃ²ng cÃ¹ng lÃ´ |
| 95 | `L4B 425-426` | cáº§n quyáº¿t Ä‘á»‹nh | range |
| 96 | `L4B 42` | khÃ´ng parse | thiáº¿u sá»‘ |
| 97 | `L4B 9999` | khÃ´ng parse | quÃ¡ dÃ i |
| 98 | `0906123456` | khÃ´ng parse | sá»‘ Ä‘iá»‡n thoáº¡i |
| 99 | `116002961023` | khÃ´ng parse | sá»‘ tÃ i khoáº£n |
| 100 | `L1.115' OR 1=1 --` | reject | báº£o máº­t |

## PhÆ°Æ¡ng Ã¡n quáº£n lÃ½ vÃ  báº£o trÃ¬

### 0. Version hÃ³a parser

Má»—i láº§n Ä‘á»•i rule Ä‘Ã¡ng ká»ƒ cáº§n ghi version parser trong code vÃ  trong dá»¯ liá»‡u parse:

- vÃ­ dá»¥: `apartment-code-parser-v0.2`
- khi parse giao dá»‹ch vÃ o DB, lÆ°u version vÃ o `ket_qua_parse_giao_dich.phien_ban_parser`
- khi táº¡o report, thá»‘ng kÃª theo version Ä‘á»ƒ biáº¿t káº¿t quáº£ Ä‘Æ°á»£c sinh bá»Ÿi rule nÃ o

Náº¿u má»™t report cÅ© Ä‘ang dÃ¹ng parser version cÅ©, khÃ´ng Ä‘Æ°á»£c coi Ä‘Ã³ lÃ  lá»—i dá»¯ liá»‡u má»›i náº¿u chÆ°a cháº¡y láº¡i report.

### 1. TÃ¡ch parser thÃ nh module cÃ³ contract rÃµ

Parser nÃªn cÃ³ contract á»•n Ä‘á»‹nh:

- input: chuá»—i thÃ´
- output:
  - `parsedApartmentCode`
  - `candidates`
  - `matchReason`
  - `confidence/score`
  - `normalizedDescription`

KhÃ´ng query DB trong parser. DB matching lÃ  bÆ°á»›c sau.

### 2. Duy trÃ¬ golden test set

Má»i case tháº­t gáº·p ngoÃ i váº­n hÃ nh pháº£i Ä‘Æ°á»£c thÃªm vÃ o test trÆ°á»›c hoáº·c cÃ¹ng lÃºc sá»­a parser.

File test hiá»‡n táº¡i:

- `lib/parser/apartment-parser.test.ts`
- `lib/billing/fee-status.test.ts`

NhÃ³m test báº¯t buá»™c nÃªn cÃ³:

- positive case: input pháº£i ra Ä‘Ãºng mÃ£ cÄƒn
- negative case: input khÃ´ng Ä‘Æ°á»£c parse nháº§m, vÃ­ dá»¥ sá»‘ Ä‘iá»‡n thoáº¡i/sá»‘ tÃ i khoáº£n
- ambiguity case: input chá»‰ nÃªn tráº£ candidate hoáº·c `NEED_REVIEW`, khÃ´ng auto-map
- public lookup case: input cÆ° dÃ¢n hay gÃµ pháº£i ra Ä‘Ãºng káº¿t quáº£
- transaction case: input sao kÃª tháº­t pháº£i khÃ´ng lÃ m há»ng filter/matcher

Khi thÃªm rule má»›i:

1. thÃªm case pass mong muá»‘n
2. thÃªm case chá»‘ng false-positive
3. cháº¡y `npm test`
4. ghi thay Ä‘á»•i vÃ o tÃ i liá»‡u nÃ y náº¿u lÃ  nhÃ³m rule má»›i

### 3. PhÃ¢n nhÃ³m rule theo Ä‘á»™ tin cáº­y

NÃªn giá»¯ score theo nhÃ³m:

- exact/dotted format: ráº¥t cao
- block-room cÃ³ tá»« khÃ³a: cao
- room-block Ä‘áº£o: cao vá»«a
- compact khÃ´ng dáº¥u phÃ¢n cÃ¡ch: trung bÃ¬nh
- suy luáº­n tá»« `lÃ´/tÃ²a/phÃ²ng`: trung bÃ¬nh
- case mÆ¡ há»“: khÃ´ng auto-map, chá»‰ gá»£i Ã½ candidate

### 4. CÃ³ blacklist false-positive

Parser pháº£i chá»‘ng cÃ¡c nhÃ³m sá»‘ khÃ´ng pháº£i mÃ£ cÄƒn:

- sá»‘ Ä‘iá»‡n thoáº¡i
- sá»‘ tÃ i khoáº£n
- mÃ£ giao dá»‹ch
- ngÃ y thÃ¡ng
- sá»‘ tiá»n
- chuá»—i ká»³ phÃ­ nhÆ° `T5-T10`

### 5. CÃ³ bá»™ Ä‘o cháº¥t lÆ°á»£ng parser

NÃªn táº¡o bÃ¡o cÃ¡o Ä‘á»‹nh ká»³:

- tá»•ng input Ä‘Ã£ parse
- sá»‘ parse Ä‘Æ°á»£c 1 candidate
- sá»‘ multi-candidate
- sá»‘ khÃ´ng parse Ä‘Æ°á»£c
- top `matchReason`
- top false-positive do ngÆ°á»i dÃ¹ng sá»­a tay

### 6. Quy trÃ¬nh update thuáº­t toÃ¡n

Khi gáº·p input má»›i:

1. lÆ°u input tháº­t vÃ o danh sÃ¡ch case.
2. xÃ¡c Ä‘á»‹nh expected output.
3. phÃ¢n loáº¡i: exact, alias, typo, compact, ambiguous, invalid.
4. thÃªm test.
5. sá»­a parser nhá» nháº¥t cÃ³ thá»ƒ.
6. cháº¡y test toÃ n bá»™.
7. kiá»ƒm tra khÃ´ng lÃ m há»ng case cÅ©.
8. cáº­p nháº­t tÃ i liá»‡u parser náº¿u thÃªm nhÃ³m rule má»›i.

### 7. Quy táº¯c an toÃ n cho public lookup

Public lookup pháº£i luÃ´n:

- giá»›i háº¡n Ä‘á»™ dÃ i input
- whitelist kÃ½ tá»±
- rate-limit
- khÃ´ng ná»‘i SQL thá»§ cÃ´ng
- chá»‰ query batch public hiá»‡n hÃ nh
- khÃ´ng tráº£ dá»¯ liá»‡u nháº¡y cáº£m

### 8. KhÃ´ng auto-map case mÆ¡ há»“

CÃ¡c case nhÆ° `4B 124`, `B425 L4`, `L4B 425/426` cáº§n Ä‘Æ°á»£c review trÆ°á»›c khi auto-map, vÃ¬ cÃ³ thá»ƒ gÃ¢y sai cÄƒn.

Parser cÃ³ thá»ƒ tráº£ candidate, nhÆ°ng UI/admin cáº§n Ä‘Ã¡nh dáº¥u `NEED_REVIEW` náº¿u Ä‘á»™ tin cáº­y tháº¥p.

### 9. Quy trÃ¬nh cáº­p nháº­t file xÆ°Æ¡ng sá»‘ng

Khi thay Ä‘á»•i parser mÃ£ cÄƒn:

1. cáº­p nháº­t file nÃ y náº¿u thÃªm nhÃ³m rule má»›i.
2. cáº­p nháº­t test trong `lib/parser/apartment-parser.test.ts` hoáº·c `lib/billing/fee-status.test.ts`.
3. náº¿u rule áº£nh hÆ°á»Ÿng lá»c giao dá»‹ch, cáº­p nháº­t [filter-rules.vi.md](filter-rules.vi.md).
4. náº¿u rule áº£nh hÆ°á»Ÿng pipeline DB, cáº­p nháº­t [database.md](database.md) hoáº·c field `matchReason`/`phien_ban_parser` tÆ°Æ¡ng á»©ng.
5. cáº­p nháº­t [roadmap.md](roadmap.md), [checklist-trien-khai-va-nghiem-thu.md](checklist-trien-khai-va-nghiem-thu.md), [handoff.md](handoff.md) náº¿u Ä‘Ã¢y lÃ  má»‘c nghiá»‡m thu.

## Backlog Æ°u tiÃªn gáº§n

1. ÄÆ°a 6 case tháº­t tá»« bÃ¡o cÃ¡o giao dá»‹ch 1.500.000 thÃ¡ng 5/2026 vÃ o golden test.
2. Chuáº©n hÃ³a alias `p`, `phong`, `phÃ²ng`, `can`, `cÄƒn`, `lo`, `lÃ´`, `toa`, `tÃ²a`.
3. Bá»• sung chá»‘ng false-positive khi mÃ£ cÄƒn compact dÃ­nh sá»‘ Ä‘iá»‡n thoáº¡i hoáº·c sá»‘ tÃ i khoáº£n.
4. TÃ¡ch rÃµ output `single high confidence`, `multi candidate`, `need review`, `invalid`.
5. Khi lÃ m Task M, lÆ°u `matchReason`, `confidence`, `phien_ban_parser` vÃ o DB Ä‘á»ƒ audit.

## Cáº­p nháº­t 2026-05-24: alias sá»‘ báº±ng chá»¯ cho lÃ´/tÃ²a

NhÃ³m rule má»›i Ä‘Ã£ Ä‘Æ°á»£c thÃªm cho cÃ¡c input cÆ° dÃ¢n hay nháº­p báº±ng tiáº¿ng Viá»‡t tá»± nhiÃªn:

- `lo hai 306`, `lÃ´ hai 306`, `lÃ´ hai cÄƒn 306` -> candidate `L2.306`
- `can 306 lo hai`, `cÄƒn 306 lÃ´ hai` -> candidate `L2.306`
- `306lohai`, `306 lo hai` -> candidate `L2.306`
- `lo bon b can 124`, `lÃ´ bá»‘n b cÄƒn 124`, `lÃ´ tÆ° b cÄƒn 124` -> candidate `L4B.124`

Parser hiá»‡n há»— trá»£ sá»‘ lÃ´/tÃ²a viáº¿t báº±ng chá»¯ sau khi bá» dáº¥u:

- `mot`, `nhat` -> `1`
- `hai` -> `2`
- `ba` -> `3`
- `bon`, `tu` -> `4`
- `nam` -> `5`
- `sau` -> `6`
- `bay` -> `7`
- `tam` -> `8`
- `chin` -> `9`

Quy táº¯c an toÃ n: náº¿u candidate dáº¡ng gá»‘c khÃ´ng tá»“n táº¡i trá»±c tiáº¿p nhÆ°ng cÃ³ nhiá»u cÄƒn cÃ¹ng tiá»n tá»‘, vÃ­ dá»¥ `L2.306` khá»›p `L2.306A` vÃ  `L2.306B`, public lookup pháº£i hiá»ƒn thá»‹ mÃ n `Cáº§n chá»n rÃµ cÄƒn`, khÃ´ng Ä‘Æ°á»£c tá»± chá»n A/B.

Kiá»ƒm tra Ä‘Ã£ bá»• sung:

- 100+ case sinh tá»± Ä‘á»™ng cho public lookup vá»›i nhiá»u máº«u cÃ¢u `lÃ´/tÃ²a/cÄƒn/phÃ²ng` vÃ  sá»‘ báº±ng chá»¯.
- Test trá»±c tiáº¿p parser cho cÃ¡c biáº¿n thá»ƒ `lo hai 306`, `lÃ´ hai cÄƒn 306`, `can 306 lo hai`, `306lohai`, `lo bon b can 124`.
- `npm test`: 265/265 pass.
- `npm run build`: pass.
- `npm run test:mobile-ui`: 40/40 pass.

## Cáº­p nháº­t 2026-05-26: sao kÃª 6 thÃ¡ng vÃ  má»™t parser duy nháº¥t

ÄÃ£ Ä‘á»c 6 file sao kÃª VietinBank eFAST trong `docs/resources/` tá»« 12/2025 Ä‘áº¿n 5/2026, tá»•ng `1.516` dÃ²ng giao dá»‹ch. BÃ¡o cÃ¡o chi tiáº¿t náº±m táº¡i:

- [reports/bao-cao-phan-tich-sao-ke-6-thang-parser.md](reports/bao-cao-phan-tich-sao-ke-6-thang-parser.md)

Quyáº¿t Ä‘á»‹nh ká»¹ thuáº­t:

- File duy nháº¥t chá»©a thuáº­t toÃ¡n parser mÃ£ cÄƒn: `src/modules/transactions/parser/apartment-parser.ts`.
- Version hiá»‡n táº¡i: `apartment-code-parser-v0.4-canonical`.
- `lib/parser/apartment-parser.ts` chá»‰ re-export parser chuáº©n.
- `scripts/import-bank-statement-v2.cjs` vÃ  `scripts/report-bank-statement-parser-v2.cjs` chá»‰ lÃ  wrapper, khÃ´ng chá»©a rule parser.
- Logic CLI sao kÃª chuyá»ƒn sang TypeScript vÃ  gá»i parser chuáº©n:
  - `scripts/import-bank-statement-v2.ts`
  - `scripts/report-bank-statement-parser-v2.ts`

Rule má»›i Ä‘Ã£ thÃªm tá»« dá»¯ liá»‡u tháº­t:

- `L3 P505` -> `L3.505`
- `L2 so can ho 211B` -> `L2.211B`
- `L2 so can 208` -> `L2.208`
- `L2 P508` -> `L2.508`
- `L 1 118` -> `L1.118`
- `LA4 so 210` -> `L4A.210`
- `L4C 506 a` -> `L4C.506A`
- `117l4 b` -> `L4B.117`
- `can ho 530 l4 b` -> `L4B.530`
- `Can ho 415 toa nha L2` -> `L2.415`
  - rule: `APARTMENT_ROOM_TOWER_BUILDING`
  - bắt buộc có ngữ cảnh `căn hộ` và cụm `tòa nhà/tòa/lô`;
  - không dùng chỉ riêng chuỗi `<số> tòa nhà <lô>` để tránh nhận nhầm địa chỉ hoặc số khác.
- `L3p509` -> `L3.509`

Káº¿t quáº£ sau khi nÃ¢ng parser trÃªn 6 file:

- Chá»‰ phÃ¢n tÃ­ch thanh toÃ¡n thu: `1.418/1.516` dÃ²ng.
- Bá» qua thanh toÃ¡n chi: `98` dÃ²ng.
- Nháº­n diá»‡n Ä‘Ãºng cÄƒn há»£p lá»‡: `1.186/1.418` dÃ²ng thu.
- Nhiá»u cÄƒn á»©ng viÃªn: `38` dÃ²ng, khÃ´ng tá»± chá»n.
- MÃ£ cÄƒn khÃ´ng tá»“n táº¡i trong `can_ho`: `7` dÃ²ng.
- KhÃ´ng nháº­n diá»‡n: `187` dÃ²ng thu, trong Ä‘Ã³ nhiá»u dÃ²ng lÃ  tÃªn-only/thiáº¿u lÃ´ tÃ²a.

Cá»•ng dá»«ng thá»§ cÃ´ng:

- Chá»§ dá»± Ã¡n cáº§n má»Ÿ cÃ¡c sheet `Can kiem tra` trong report Excel 6 thÃ¡ng.
- Chá»‰ sau khi duyá»‡t nhÃ³m `NHIEU_CAN`, `MA_CAN_KHONG_TON_TAI`, `KHONG_NHAN_DIEN` má»›i nÃªn dÃ¹ng parser nÃ y cho import sao kÃª production.

## Cáº­p nháº­t 2026-05-27: Ä‘á»‘i soÃ¡t T1-T5 vÃ  giáº£m nháº­p tay

Sau khi Ä‘á»‘i soÃ¡t sao kÃª T1-T5 vá»›i file theo dÃµi thu phÃ­, Ä‘Ã£ bá»• sung thÃªm cÃ¡c rule háº¹p tá»« dá»¯ liá»‡u tháº­t:

- `L4C_sonha303` -> `L4C.303`
- `303- Lo L4B` -> `L4B.303`
- `L4B-110chuyen` -> `L4B.110`

Káº¿t quáº£ sau khi cháº¡y láº¡i report Ä‘á»‘i soÃ¡t:

- giao dá»‹ch cáº§n báº±ng chá»©ng/nháº­p tay giáº£m tá»« `181` xuá»‘ng `174`.
- tiá»n sao kÃª phÃ¢n bá»• Ä‘Æ°á»£c tÄƒng tá»« `965.549.006` lÃªn `972.799.006`.
- lÆ°á»£t cÄƒn khá»›p tÄƒng tá»« `978` lÃªn `984`.

Rule `L 111B -> L1.111B` Ä‘Ã£ Ä‘Æ°á»£c loáº¡i bá» theo duyá»‡t nghiá»‡p vá»¥. MÃ£ `L 111B` thiáº¿u lÃ´ rÃµ rÃ ng nÃªn pháº£i Ä‘Æ°a vÃ o nhÃ³m nháº­p tay/kiá»ƒm chá»©ng, khÃ´ng tá»± suy luáº­n thÃ nh `L1.111B`.

CÃ¡c nhÃ³m khÃ´ng nÃ¢ng parser tá»± Ä‘á»™ng:

- giao dá»‹ch Zalo khÃ´ng cÃ³ mÃ£ cÄƒn.
- giao dá»‹ch chá»‰ cÃ³ tÃªn ngÆ°á»i chuyá»ƒn.
- giao dá»‹ch nhiá»u cÄƒn nhÆ°ng tá»•ng tiá»n khÃ´ng khá»›p file theo dÃµi.
- giao dá»‹ch cÃ³ tÃ­n hiá»‡u cÄƒn mÆ¡ há»“ chÆ°a Ä‘á»§ cháº¯c cháº¯n.
## Cap nhat 2026-05-29: nhan dien lo LKV

- Version parser moi: `apartment-code-parser-v0.5-lkv`.
- File parser duy nhat van la `src/modules/transactions/parser/apartment-parser.ts`.

Bo sung rule cho nhom lien ke `LKV`, vi thuc te sao ke co noi dung:

- `Hairent - TT phi quan ly Pruksa Hai Phong tu 01.05 - 31.10.26- LKV.47` -> `LKV.47`
- `LKV 47` -> `LKV.47`
- `LKV-47` -> `LKV.47`
- `LKV47` -> `LKV.47`
- `LK V 47` -> `LKV.47`
- `47 LKV` -> `LKV.47`

Quy tac an toan da them: neu trong noi dung co ngay thang dang `31.10.26- LKV.47`, parser khong duoc sinh nham ung vien `LKV.26` tu phan nam `26` dung truoc `LKV`.

Da cap nhat lai giao dich da import co noi dung `LKV.47` trong DB:

- giao dich `#829`
- trang thai parser moi: `KHOP_TRUC_TIEP`
- ma can parser: `LKV.47`
- do tin cay: `0.99`

Kiem tra:

- `npm.cmd test`: 270/270 pass.
- `npm.cmd run build`: pass.

## Cập nhật 2026-06-10: hợp nhất toàn bộ thuật toán parser

Nguồn thuật toán duy nhất:

`src/modules/transactions/parser/apartment-parser.ts`

File này hiện sở hữu toàn bộ:

- chuẩn hóa nội dung;
- nhận dạng mã căn và danh sách candidate;
- phân loại khớp trực tiếp/khớp chuẩn hóa/nhiều căn/mã không hợp lệ;
- rule loại giao dịch không liên quan;
- độ tin cậy;
- gợi ý căn khi chỉ có số căn nhưng thiếu lô;
- version parser `apartment-code-parser-v0.7-unified`.

`src/modules/transactions/matcher.ts`, script import và script báo cáo chỉ gọi kết quả từ module này, không được tự định nghĩa regex, từ khóa lọc hoặc cách phân loại riêng.

Hai wrapper `lib/filter-rules.ts` và `src/modules/shared/filter-rules.ts` đã ngừng sử dụng, được chuyển vào:

`archive/code/legacy-parser-2026-06-10/`

Quy tắc bảo trì:

1. Mọi rule mới chỉ được sửa trong file parser duy nhất.
2. Case dữ liệu thật phải có test hồi quy.
3. Không tạo thêm parser hoặc bộ từ khóa song song trong script.
4. File cũ không xóa ngay; chuyển vào archive theo quy tắc tại `docs/module-map.md`.

## Mốc parser hiện hành 2026-07-14

Parser chính duy nhất:

- `src/modules/transactions/parser/apartment-parser.ts`

Nguyên tắc bắt buộc:

- Không tạo parser thứ hai trong script/import/export.
- Mọi luồng import sao kê, preview, export có đánh dấu parser phải dùng chung parser chính.
- Khi thêm case thật, thêm test hồi quy để tránh sửa case này làm hỏng case cũ.
- File parser cũ hoặc helper thử nghiệm chuyển vào `archive/`, không xóa thẳng.

Một số case thực tế đã/đang cần giữ:

- `LK1 so nha 52` -> `LK1.52`.
- `LongL4 C-406A` -> `L4C.406A`.
- `toa L1can 208` -> `L1.208`.
- `L1315nop` -> `L1.315`, không nhận thành `L1.315N`.
- `Can ho 415 toa nha L2` -> `L2.415`.
- `toa L1315` cần kiểm tra tồn tại căn; nếu không tồn tại thì báo để duyệt tay.
