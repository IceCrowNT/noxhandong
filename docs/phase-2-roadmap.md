# Roadmap Phase 2: vận hành sao kê từ T6/2026

## Vai trò

File này là roadmap chính cho Phase 2 sau khi MVP đã deploy public tại `https://noxhandong.vn`.

Quyết định điều hướng Phase 2 ngày 2026-05-27:

- Không cố parse lại toàn bộ dữ liệu quá khứ T1-T5/2026 để ghi thành lịch sử giao dịch chuẩn trong DB.
- File `Theo dõi thu phí T5.xlsx` được coi là dữ liệu quá khứ chuẩn sau khi chủ dự án chốt.
- Dữ liệu public cuối T5/2026 là **mốc số dư ban đầu** của hệ thống.
- Từ T6/2026 trở đi, sao kê ngân hàng sẽ là nguồn dữ liệu vận hành mới của project.
- Phase 2 tập trung vào import sao kê tháng mới, parser, gợi ý khớp căn, duyệt giao dịch, lưu bằng chứng và cập nhật trạng thái phí từ dữ liệu sạch.

## Mục tiêu Phase 2

1. Chốt dữ liệu nền đến hết T5/2026 cho đủ `934` căn.
2. Thiết kế luồng import sao kê từ T6/2026 trở đi.
3. Xây dựng màn hình duyệt sao kê chuyên nghiệp cho các giao dịch không rõ căn.
4. Giữ parser mã căn tập trung tại một file thuật toán duy nhất.
5. Lưu được bằng chứng Zalo/nhập tay cho các giao dịch thiếu thông tin.
6. Cho phép admin cập nhật lịch sử đóng phí từ giao dịch đã duyệt.
7. Cuối mỗi kỳ, Super Admin chốt batch public để cư dân tra cứu.
8. Bổ sung các chức năng vận hành đã duyệt: thông báo PDF public, tài khoản nội bộ, thống kê gọn.

## Nguyên tắc bắt buộc

- Public lookup chỉ đọc batch đã chốt, không đọc trực tiếp từ sao kê staging.
- Sao kê từ T6/2026 trở đi mới là dữ liệu vận hành chuẩn của project.
- Dữ liệu chuẩn vĩnh viễn theo tháng nằm ở `so_chot_thang` / `so_chot_can_ho`, không nằm trực tiếp ở file import.
- Excel theo dõi thu phí từ T6/2026 trở đi là sổ chốt/công cụ đặc biệt sau đối soát, không còn là luồng public chính ngang hàng với sao kê.
- Sao kê T1-T5/2026 chỉ dùng để học parser, đối chiếu và tham khảo, không bắt buộc nhập lại DB chính thức.
- Parser không tự suy luận thiếu lô nếu không đủ dữ liệu. Ví dụ `L 111B` không được tự đổi thành `L1.111B`.
- Các case thiếu lô/thiếu căn chỉ vào **gợi ý duyệt**, không tự chốt.
- Mã tham chiếu ngân hàng là khóa chống trùng chính nếu có.
- Fingerprint chỉ là khóa phụ/fallback/audit.
- Giao dịch chi bị bỏ khỏi luồng duyệt phí cư dân, chỉ lưu raw nếu cần audit.
- Mọi thay đổi schema hoặc dữ liệu production phải backup trước.
- Mỗi rule parser mới phải có golden test.

## Trạng thái đầu vào

Đã có:

- Public web production chạy tại `https://noxhandong.vn`.
- VPS Windows Server, PostgreSQL local, Next.js service, Caddy HTTPS.
- Public batch `T5-2026`, đủ `934` căn.
- File theo dõi thu phí T5 đang là dữ liệu nền quan trọng nhất.
- Parser mã căn dùng chung cho public/admin/script tại `src/modules/transactions/parser/apartment-parser.ts`.
- Report học sao kê 6 tháng T12/2025-T5/2026 đã có trong `docs/reports/`.
- Report đối soát T1-T5 đã chỉ ra nhóm cần nhập tay/Zalo, nhưng không còn là mục tiêu nhập lại toàn bộ quá khứ.

Đã chốt thêm theo yêu cầu 2026-05-27:

- Dữ liệu T5 hiện tại được coi là dữ liệu gần nhất đã chốt để tiếp tục phát triển Phase 2.
- Tất cả dữ liệu là dữ liệu thật nhưng nguồn chuẩn vẫn nằm trong Excel, nên được phép test thoải mái trên DB/app trong giai đoạn phát triển nếu không ghi đè file nguồn.

Còn cần thiết kế/hoàn thiện:

- Schema lưu opening balance và giao dịch đã duyệt từ T6/2026.
- UI duyệt sao kê mới.
- Cơ chế cập nhật trạng thái phí từ giao dịch đã duyệt.

## Cổng dừng thủ công chung

Tôi không vượt qua các mốc này nếu chưa có chủ dự án duyệt:

- Chốt file T5 cuối cùng làm opening balance.
- Chạy migration production.
- Import sao kê thật từ T6/2026 vào DB production.
- Chốt batch public mới cho cư dân.
- Xóa/reset dữ liệu production.
- Deploy thay đổi lớn lên VPS.

---

# P0. Cập nhật roadmap Phase 2 theo hướng opening balance

## Mục tiêu

Đồng bộ tài liệu xương sống theo quyết định mới: T5 là mốc quá khứ chuẩn, T6 trở đi là dữ liệu hệ thống.

## Việc cần làm

- Cập nhật `docs/phase-2-roadmap.md`.
- Cập nhật `docs/roadmap.md`.
- Cập nhật `docs/doi-soat-sao-ke-va-bang-chung.md`.
- Đảm bảo `docs/README.md` vẫn trỏ đúng file roadmap Phase 2.

## Check/Test

- Không cần test code.
- Kiểm tra link tài liệu.

## Cổng dừng thủ công

- Chủ dự án đọc lại roadmap Phase 2 và duyệt thứ tự làm.

## Trạng thái

- [x] Đã cập nhật trong lượt 2026-05-27.

---

# P1. Chốt opening balance T5/2026

## Mục tiêu

Biến dữ liệu phí đến hết T5/2026 thành mốc nền chính thức cho toàn bộ `934` căn.

## Dữ liệu đầu vào

- File hiện tại: `docs/Theo dõi thu phí T5.xlsx`.
- Nếu có file sau ngày 2026-05-31, dùng file đó làm bản chốt cuối cùng.

## Việc cần làm

- Import file T5 cuối cùng vào staging.
- Validate đủ `934` căn.
- Validate không lỗi mã căn.
- Ghi rõ các căn đóng lẻ, căn ngoài mốc năm 2026, căn đóng vượt kỳ.
- Tạo batch public/opening balance:
  - kỳ dữ liệu: `T5-2026`
  - trạng thái: đã chốt
  - số căn: `934`
  - nguồn: file theo dõi thu phí T5
- Lưu metadata:
  - tên file
  - thời điểm chốt
  - người chốt
  - ghi chú đây là mốc quá khứ chuẩn

## Check/Test

- Public tra cứu được `934` căn.
- Căn đóng đến `-1`, `14`, số lẻ vẫn hiển thị đúng theo rule đã duyệt.
- Dashboard tổng quan dùng batch T5 làm nền.
- `npm test`
- `npm run build`

## Cổng dừng thủ công

- Không cần chờ thêm file T5 khác; dùng dữ liệu T5 hiện tại làm mốc chốt gần nhất.
- Nếu thao tác trên production, vẫn phải backup trước khi ghi đè/chốt lại batch public.

## Trạng thái

- [x] Đã dùng dữ liệu T5 hiện tại làm mốc chốt gần nhất cho dev/Phase 2. Production vẫn cần backup trước khi chốt lại batch.

---

# P2. Thiết kế schema cho sao kê từ T6/2026

## Mục tiêu

Chuẩn hóa DB để lưu sao kê mới, kết quả parser, gợi ý khớp căn, duyệt thủ công, bằng chứng và phân bổ tiền.

## Bảng/nhóm dữ liệu cần có

- `lo_nhap_du_lieu`: lô import file sao kê.
- `dong_sao_ke_tho`: raw row đầy đủ từ file sao kê.
- `giao_dich_sao_ke_tho_chuan`: raw canonical chống trùng để audit/học parser.
- `giao_dich_ngan_hang`: giao dịch operational và nguồn trạng thái parser/duyệt duy nhất.
- `ung_vien_khop_giao_dich`: danh sách căn hộ ứng viên khi parser chưa chắc.
- `phan_bo_giao_dich`: giao dịch được phân bổ cho một hoặc nhiều căn.
- `chung_tu_doi_soat`: ảnh Zalo/chứng từ/ghi chú thủ công.
- `lich_su_dong_phi_can_ho`: lịch sử phí sạch sinh từ giao dịch đã duyệt.
- `so_chot_thang`: sổ chốt tháng sau khi đối soát sao kê, Zalo/xác minh thủ công và Excel chốt tháng.
- `so_chot_can_ho`: 934 dòng dữ liệu chuẩn theo căn của một sổ chốt tháng.

## Quy tắc chống trùng

- Nếu có `ma_tham_chieu_ngan_hang`, dùng làm khóa chính để chống trùng giao dịch.
- Nếu cùng mã tham chiếu nhưng khác fingerprint, không tạo giao dịch mới, đánh dấu nghi vấn.
- Nếu không có mã tham chiếu, dùng fingerprint fallback gồm ngày, số tiền, nội dung chuẩn hóa, tài khoản/người chuyển nếu có.
- Re-import file chồng kỳ không được xóa trạng thái duyệt cũ.

## Check/Test

- Prisma validate.
- Migration dev.
- Import cùng file 2 lần không tạo trùng giao dịch chính.
- Import file chồng kỳ chỉ tăng raw staging nếu cần, không nhân đôi giao dịch chính.

## Cổng dừng thủ công

- Trước migration production phải backup DB.
- Chủ dự án duyệt schema trước khi tôi migrate production.

## Trạng thái

- [x] Đã thêm migration `20260527000100_phase2_operations` gồm `chung_tu_doi_soat`, `lich_su_dong_phi_can_ho`, `nhat_ky_dang_nhap_quan_tri`, `thong_bao_cong_khai`.
- [x] Đã thêm migration `20260528084826_add_monthly_closing_ledger` gồm `so_chot_thang`, `so_chot_can_ho` và liên kết `batch_trang_thai_phi_public.so_chot_thang_id`.
- [x] 02/06/2026: import sao kê đã dùng mốc `so_chot_thang.metadata_json.chotDenThoiDiem` để chỉ tạo giao dịch cần duyệt cho dòng thu sau mốc chốt. Dòng chi và dòng thu trước/đúng mốc vẫn có raw staging nếu cần audit, nhưng không đi vào `giao_dich_ngan_hang`.
- [x] 06/06/2026: migration `20260606090000_simplify_transaction_state` bỏ bảng parser/review trùng lặp; trạng thái hiện tại chỉ nằm ở `giao_dich_ngan_hang`, ứng viên khớp liên kết trực tiếp với giao dịch.
- [x] 06/06/2026: reset DB dev và dựng lại baseline T5 gồm 934 căn, 1 sổ chốt và 934 dòng public; giao dịch ngân hàng để trống để test sao kê mới.
- [x] 06/06/2026: tra cứu nội bộ hiển thị giao dịch `DA_RA_SOAT` cần bổ sung bằng chứng theo căn hộ.

---

# P3. Chuẩn hóa parser và suggestion engine

## Mục tiêu

Parser chỉ nhận diện chắc chắn; suggestion engine xử lý case mơ hồ để admin duyệt.

## Việc cần làm

- Giữ parser chính tại `src/modules/transactions/parser/apartment-parser.ts`.
- Không tạo parser thứ hai trong script.
- Tách rõ:
  - parser chắc chắn
  - gợi ý ứng viên
  - duyệt thủ công
- Với case thiếu lô như `L 111B`:
  - tìm các căn có đuôi `111B`
  - đối chiếu tên người chuyển, số điện thoại, contact candidate, chủ hộ gốc
  - nếu chỉ khớp token yếu như `LE` hoặc `THI`, không tự chốt
  - hiển thị danh sách ứng viên cho admin chọn

## Thang confidence đề xuất

- 100: mã căn đầy đủ, tồn tại trong DB.
- 90: mã căn rõ nhưng format bẩn, parser chuẩn hóa được an toàn.
- 70: thiếu một phần nhưng có số điện thoại/tên khớp mạnh với contact.
- 40: chỉ có đuôi căn hoặc tên token yếu, chỉ được gợi ý.
- 0: không đủ dữ liệu.

## Check/Test

- Golden test cho parser.
- Test case thật:
  - `L4C_sonha303` -> `L4C.303`
  - `303- Lo L4B` -> `L4B.303`
  - `L4B-110chuyen` -> `L4B.110`
  - `L 111B` không tự suy luận
- `npm test`
- `npm run build`

## Cổng dừng thủ công

- Chủ dự án duyệt rule mới trước khi dùng trên production.

## Trạng thái

- [x] Đã có nền và đã tích hợp gợi ý thiếu lô vào import sao kê; case `L 111B` liệt kê ứng viên, không tự chốt.

---

# P4. Web import sao kê T6/2026

## Mục tiêu

Super Admin upload sao kê tháng mới trực tiếp trên web.

## Luồng import

1. Upload file sao kê `.xls` hoặc `.xlsx`.
2. Hệ thống đọc preview, chưa ghi chính thức.
3. Preview hiển thị:
   - tổng dòng
   - dòng thu
   - dòng chi bị bỏ qua
   - giao dịch trùng
   - khớp chắc chắn
   - cần duyệt
   - nhiều căn
   - không nhận diện
4. Super Admin bấm `Nhập vào staging`.
5. Dữ liệu vào DB nhưng chưa cập nhật phí public.

## Không làm ở bước này

- Không tự động public cho cư dân.
- Không tự động cộng tiền vào lịch sử phí nếu giao dịch chưa duyệt.

## Check/Test

- Upload file hợp lệ.
- Upload sai định dạng.
- Upload lại cùng file.
- Upload file có giao dịch chi.
- Manager/Technician không import được.

## Cổng dừng thủ công

- Chủ dự án xem preview file T6 đầu tiên trước khi nhập staging production.

## Trạng thái

- [x] Đã thêm upload sao kê trên `/admin/import`: kiểm tra file hoặc nhập staging duyệt.

---

# P5. Màn hình duyệt sao kê chuyên nghiệp

## Mục tiêu

Đây là chức năng trọng tâm Phase 2. Admin xử lý nhanh các giao dịch parser chưa chắc chắn.

Spec thiết kế chi tiết nằm tại [thiet-ke-duyet-sao-ke-phase-2.md](thiet-ke-duyet-sao-ke-phase-2.md).

Mục tiêu UI:

- Trên PC 24 inch/1920x1080, một giao dịch đang duyệt phải xem được trọn vẹn thông tin quan trọng trong một màn hình.
- Không dùng bảng rộng làm màn chính.
- Không có kéo ngang toàn trang.
- Chỉ cuộn dọc ở danh sách giao dịch hoặc panel phụ.
- Dữ liệu phải được đánh giá chất lượng: chắc, khá chắc, cần kiểm tra, không đủ dữ liệu.

## Chức năng cần có

- Danh sách giao dịch theo trạng thái:
  - khớp chắc chắn
  - cần duyệt
  - nhiều căn
  - không nhận diện
  - nghi trùng
  - đã duyệt
- Bộ lọc:
  - kỳ/tháng
  - file import
  - trạng thái
  - số tiền
  - ngày giao dịch
  - mã căn
  - nội dung chứa từ khóa
- Panel chi tiết giao dịch:
  - ngày
  - số tiền
  - người chuyển
  - số tài khoản/SĐT nếu có
  - nội dung gốc
  - mã tham chiếu
  - file nguồn
- Panel gợi ý căn:
  - mã căn
  - chủ hộ gốc
  - contact từ Excel/chưa duyệt
  - số điện thoại
  - lý do gợi ý
  - điểm tin cậy
- Hành động:
  - chọn căn đúng
  - chia tiền cho nhiều căn
  - đánh dấu không liên quan
  - yêu cầu bằng chứng
  - upload ảnh Zalo/chứng từ
  - ghi chú duyệt

## Check/Test

- Duyệt giao dịch một căn.
- Duyệt giao dịch nhiều căn.
- Duyệt case thiếu lô như `L 111B`.
- Upload bằng chứng.
- Re-import không mất quyết định duyệt.
- Mobile usable, desktop thao tác nhanh.

## Cổng dừng thủ công

- Chủ dự án duyệt UX màn hình này trước khi nhập dữ liệu T6 thật.

## Trạng thái

- [x] Đã thêm route `/admin/transactions/review` theo layout master-detail-review, duyệt một căn, đánh dấu cần bằng chứng/từ chối và lưu bằng chứng.
- [x] Đã bổ sung form phân bổ một giao dịch cho nhiều căn, kiểm tra tổng tiền phân bổ phải bằng đúng số tiền giao dịch.
- [x] Màn duyệt sao kê chỉ hiển thị hàng đợi vận hành từ `01/06/2026` trở đi; sao kê T5/2026 trở về trước là dữ liệu phân tích/quá khứ đã chốt theo file theo dõi thu phí.
- [x] Đã thêm thao tác `Duyệt có bằng chứng`: một form vừa nhập mã căn xác nhận, vừa upload ảnh/PDF/ghi chú, vừa ghi lịch sử phí.
- [x] Đã tinh giản UI PC-first: gợi ý căn hộ chuyển thành danh sách compact, bỏ các form duyệt lặp trong từng gợi ý, form lưu bằng chứng riêng được thay bằng luồng duyệt chính.
- [x] Khi duyệt lại giao dịch chưa public, hệ thống xóa lịch sử phí chưa public cũ trước khi ghi lại để tránh nhân đôi.
- [x] Nếu giao dịch đã được đưa vào batch public, màn duyệt chặn sửa trực tiếp.

---

# P6. Cập nhật lịch sử phí từ giao dịch đã duyệt

## Mục tiêu

Sau khi giao dịch được duyệt, hệ thống tạo lịch sử đóng phí sạch cho từng căn.

## Luồng nghiệp vụ

1. Giao dịch ngân hàng được duyệt.
2. Admin xác nhận căn và số tiền phân bổ.
3. Hệ thống ghi vào lịch sử đóng phí.
4. Hệ thống tính trạng thái đã đóng đến tháng nào dựa trên opening balance + giao dịch mới.
5. Cuối kỳ, Super Admin chốt batch public mới.

## Quy tắc tính phí

- Opening balance T5 là mốc nền.
- Giao dịch từ T6 trở đi cộng tiếp từ mốc nền.
- Căn đã đóng vượt kỳ trước T6 giữ nguyên trạng thái vượt kỳ.
- Căn đóng lẻ được ghi nhận phần tiền, nhưng khi thống kê tháng có thể làm tròn xuống theo rule đã duyệt.

## Check/Test

- Một căn đóng đúng 1 kỳ.
- Một căn đóng nhiều kỳ.
- Một giao dịch cho nhiều căn.
- Một căn đã đóng vượt trước T6 rồi đóng tiếp.
- Một căn đóng lẻ.

## Cổng dừng thủ công

- Chủ dự án duyệt công thức tính trước khi dùng public.

## Trạng thái

- [x] Khi duyệt một căn hoặc nhiều căn trên màn sao kê, hệ thống ghi `phan_bo_giao_dich` và `lich_su_dong_phi_can_ho`.
- [x] Giao dịch chưa public có thể duyệt lại; hệ thống xóa lịch sử phí nháp cũ rồi ghi lại để không cộng trùng.
- [x] Giao dịch đã public bị khóa sửa trực tiếp tại màn duyệt.

---

# P7. Chốt batch public theo kỳ mới

## Mục tiêu

Super Admin chốt dữ liệu đã duyệt thành batch public để cư dân tra cứu.

## Luồng chốt

1. Chọn kỳ cần chốt, ví dụ `T6-2026`.
2. Xem báo cáo trước chốt:
   - tổng giao dịch đã import
   - đã duyệt
   - còn treo
   - tổng căn thay đổi trạng thái
   - căn có dữ liệu bất thường
3. Nếu còn giao dịch treo, hệ thống cảnh báo.
4. Super Admin xác nhận chốt.
5. Tạo snapshot public mới.
6. Cư dân tra cứu thấy dữ liệu mới.

## Check/Test

- Không cho manager/kỹ thuật chốt.
- Không public giao dịch chưa duyệt.
- Batch cũ vẫn có thể audit.
- Public lookup nhanh và không lộ dữ liệu nội bộ.

## Cổng dừng thủ công

- Chủ dự án duyệt báo cáo preview trước lần chốt T6 production đầu tiên.

## Trạng thái

- [x] Đã có luồng chốt public từ `lich_su_dong_phi_can_ho` tại `/admin/import`.
- [x] Script `prepare-public-batch-from-history-v2.cjs` lấy batch public hiện hành làm opening balance, cộng các dòng lịch sử phí đã duyệt chưa public và tạo snapshot đủ `934` căn.
- [x] `publish-fee-public-batch-v2.cjs` đã đánh dấu các dòng lịch sử phí được đưa vào batch public để tránh cộng lại ở kỳ sau.
- [x] UI đã tách thành 2 bước: `Tạo preview public` rồi `Xác nhận chốt batch này`.
- [x] Đã có trang drill-down `/admin/import/public-preview?batchId=...` để xem từng căn thay đổi, căn có tiền lẻ, số tháng cộng thêm và số dòng lịch sử trước khi chốt.
- [x] Có thể hủy preview batch nháp nếu tạo nhầm.

---

# P8. Card giao dịch gần nhất trong tra cứu nội bộ

## Mục tiêu

Khi kỹ thuật/quản lý tra cứu căn, thấy ngay bằng chứng giao dịch gần nhất.

## Hiển thị

- Tình trạng phí hiện tại.
- SĐT liên hệ từ dữ liệu Excel/chưa duyệt.
- Nút gọi nhanh trên mobile.
- Giao dịch gần nhất đã duyệt:
  - ngày
  - số tiền
  - nội dung gốc rút gọn
  - mã tham chiếu
  - trạng thái duyệt
  - file import
- Nếu giao dịch cần bằng chứng, hiển thị nhãn cảnh báo.

## Check/Test

- Căn có giao dịch mới.
- Căn chưa có giao dịch mới, chỉ có opening balance.
- Mobile không vỡ layout.

## Cổng dừng thủ công

- Chủ dự án duyệt mức thông tin được hiển thị cho manager/kỹ thuật.

## Trạng thái

- [x] Đã thêm card giao dịch gần nhất đã duyệt trong `/admin/dashboard` khi tra cứu một căn.
- [x] Card hiển thị ngày giao dịch, số tiền, người chuyển, mã tham chiếu, file nguồn, số bằng chứng và nội dung chuyển khoản gốc.
- [x] Mobile dùng bản compact, desktop dùng bản chi tiết.

---

# P9. Dashboard thống kê rút gọn

## Mục tiêu

Dashboard đủ chuyên nghiệp để vận hành và thuyết trình, nhưng không rối.

## Nhóm thống kê giữ lại

- Tổng quan kỳ phí:
  - tổng căn
  - đã hoàn thành kỳ hiện tại
  - chưa hoàn thành
  - cắt tháng này
  - đã cắt
- Phân bố tháng đã đóng đến:
  - biểu đồ đủ cho `934` căn
  - hiển thị cả số lượng và tỷ lệ
- Chất lượng import sao kê:
  - tổng giao dịch thu
  - khớp chắc chắn
  - cần duyệt
  - không nhận diện
  - nghi trùng
- Hiệu quả parser:
  - tỷ lệ nhận diện theo file/tháng
  - case cần bổ sung rule

## Không làm ngay

- Báo cáo tài chính kế toán chi tiết.
- Chart trang trí quá nhiều.
- Tính năng dự báo phức tạp.

## Check/Test

- Desktop thấy được search nội bộ sớm, không phải kéo quá sâu.
- Mobile dùng tab/list gọn.
- Không overflow ngang toàn trang.

## Cổng dừng thủ công

- Chủ dự án duyệt UI dashboard Phase 2 trước khi deploy.

## Trạng thái

- [x] Dashboard đã có thống kê rút gọn cho kỳ phí, phân bố tháng đã đóng đến, cảnh báo cắt điện, ma trận nhập dữ liệu và chất lượng sao kê.
- [x] Đã bổ sung thống kê parser/trạng thái duyệt giao dịch để phục vụ vận hành Phase 2.
- [ ] Vẫn cần review UI thực tế sau khi có sao kê T6 thật và nhiều giao dịch đã duyệt.

---

# P10. Quản trị tài khoản nội bộ vừa đủ

## Mục tiêu

Hoàn thiện tài khoản nội bộ theo các tính năng đã duyệt, không làm quá nặng.

## Tính năng

- Nhật ký đăng nhập gần nhất:
  - thời gian
  - IP
  - user agent rút gọn
- Trạng thái tài khoản:
  - đang hoạt động
  - bị khóa
  - lần đăng nhập cuối
- Reset mật khẩu cho tài khoản nội bộ.

## Không làm ngay

- Cấu hình quyền động theo role.
- Chính sách bảo mật phức tạp.
- Bắt buộc đổi mật khẩu định kỳ.

## Check/Test

- Login cập nhật lần đăng nhập cuối.
- Super Admin reset mật khẩu user khác.
- Tài khoản bị khóa không login được.

## Cổng dừng thủ công

- Chủ dự án duyệt copy/nút thao tác tài khoản để tránh nhầm.

## Trạng thái

- [x] Đã thêm nhật ký đăng nhập gần nhất và reset mật khẩu từ `/admin/accounts`.

---

# P11. Thông báo PDF public

## Mục tiêu

Admin đăng thông báo/PDF để cư dân xem từ trang chủ, không cần login.

## Phạm vi

- Admin tạo thông báo.
- Nhập tiêu đề, mô tả ngắn.
- Upload PDF.
- Trạng thái:
  - nháp
  - công khai
  - ẩn
- Public trang chủ hiển thị vài thông báo mới nhất.
- Có trang xem tất cả thông báo nếu cần.

## Check/Test

- Chỉ nhận PDF.
- Giới hạn dung lượng.
- Public chỉ thấy thông báo công khai.
- Manager/kỹ thuật không upload nếu không được phép.

## Cổng dừng thủ công

- Chủ dự án duyệt vị trí hiển thị để không phá mục tiêu search-bar landing page.

## Trạng thái

- [x] Đã thêm `/admin/announcements` và hiển thị thông báo public trên trang chủ.

---

# P12. Session đăng nhập dài hạn

## Mục tiêu

Giảm tình trạng admin bị logout thường xuyên.

## Việc cần làm

- Cho session max-age đọc từ env, ví dụ `ADMIN_SESSION_MAX_AGE_DAYS=3650`.
- Cookie vẫn giữ:
  - `HttpOnly`
  - `SameSite=Lax`
  - `Secure` khi production HTTPS
- Logout vẫn xóa cookie.

## Check/Test

- Login giữ session dài.
- Logout xóa session.
- `npm test`
- `npm run build`

## Cổng dừng thủ công

- Chủ dự án xác nhận chấp nhận session gần như vĩnh viễn vì tài khoản là nội bộ ít người.

## Trạng thái

- [x] Đã thêm `ADMIN_SESSION_MAX_AGE_DAYS`, mặc định 3650 ngày, vẫn giữ HttpOnly/SameSite/Secure theo môi trường.

---

# P13. Kiểm thử và deploy Phase 2

## Mục tiêu

Đưa Phase 2 lên production có kiểm soát.

## Trước deploy

- Backup DB production.
- Export Excel vận hành.
- Kiểm tra và xử lý lệch timezone production theo [vps-phase-2-todolist.md](vps-phase-2-todolist.md).
- `npm test`
- `npm run build`
- Nếu có UI lớn, chạy test mobile/desktop.
- Kiểm tra migration trên DB dev/staging.

## Sau deploy

- Kiểm tra `https://noxhandong.vn`.
- Kiểm tra `/admin/login`.
- Kiểm tra public lookup.
- Kiểm tra import preview.
- Kiểm tra quyền manager/kỹ thuật không thao tác nhầm.

## Cổng dừng thủ công

- Chủ dự án xác nhận thời điểm deploy.
- Chủ dự án xác nhận đã kiểm tra timezone VPS/app/DB trước deploy Phase 2.
- Chủ dự án duyệt preview sao kê T6 trước khi import/chốt production.

## Trạng thái

- [x] `npm run prisma:validate`: pass.
- [x] `npm test`: 269/269 pass.
- [x] `npm run build`: pass.
- [x] `npm run test:mobile-ui`: 40/40 pass sau khi restart dev server để xóa stale chunk dev.
- [ ] Chưa xử lý/xác nhận lệch timezone production; theo dõi tại [vps-phase-2-todolist.md](vps-phase-2-todolist.md).
- [ ] Chưa deploy Phase 2 lên production.
- [ ] Chưa chạy thử workflow production với sao kê T6 thật: import -> duyệt -> preview public -> chốt.

---

# P14. Chuẩn hóa phân quyền và menu theo vai trò

## Mục tiêu

Phản ánh đúng quyền của từng vai trò trên giao diện và dùng một nguồn phân quyền duy nhất cho menu, page, middleware, server action và API.

`MANAGER` và `TECHNICIAN` tiếp tục ngang quyền trong giai đoạn hiện tại, nhưng vẫn giữ hai role riêng để phục vụ thống kê nhân sự và mở rộng sau này.

## Hiện trạng cần xử lý

- Sidebar đang hiển thị tất cả chức năng cho mọi role.
- Middleware mới chặn chắc chắn một phần route quản trị.
- Trang duyệt sao kê vẫn có thể được role thường mở ở chế độ xem.
- Mục `/admin#database` chưa phải chức năng hoàn chỉnh và đang gây nhiễu menu.
- Kiểm tra quyền đang rải rác tại middleware, page và action, dễ thiếu đồng bộ.

## Ma trận quyền đã chốt

| Phân khu | Super Admin | Manager | Kỹ thuật |
| --- | --- | --- | --- |
| Tra cứu nội bộ | Toàn quyền | Xem | Xem |
| Tình trạng phí, thống kê | Xem | Xem | Xem |
| Liên hệ cư dân | Xem và duyệt | Chỉ xem, gọi nhanh | Chỉ xem, gọi nhanh |
| Nhập dữ liệu | Có | Ẩn | Ẩn |
| Duyệt sao kê | Có | Ẩn | Ẩn |
| Chốt công khai | Có | Ẩn | Ẩn |
| Quản lý thông báo | Có | Ẩn | Ẩn |
| Quản lý tài khoản | Có | Ẩn | Ẩn |
| Tài khoản của tôi | Có | Có | Có |

## Cấu trúc menu

### Manager và Kỹ thuật

**Công việc hằng ngày**

- Tra cứu nội bộ.
- Liên hệ cư dân.
- Tài khoản của tôi.

Không hiển thị chức năng quản trị dữ liệu.

### Super Admin

**Công việc hằng ngày**

- Tra cứu nội bộ.
- Liên hệ cư dân.

**Vận hành dữ liệu**

- Nhập dữ liệu.
- Duyệt sao kê.
- Thông báo.

**Quản trị hệ thống**

- Tài khoản quản trị.
- Tài khoản của tôi.

Tạm bỏ mục **Cơ sở dữ liệu** khỏi menu cho đến khi có trang quản trị DB thực sự hữu ích.

## Thiết kế kỹ thuật

Tạo nguồn phân quyền duy nhất tại:

`src/modules/auth/permissions.ts`

Danh sách quyền dự kiến:

```ts
type Permission =
  | "VIEW_DASHBOARD"
  | "VIEW_CONTACTS"
  | "REVIEW_CONTACTS"
  | "IMPORT_DATA"
  | "REVIEW_TRANSACTIONS"
  | "PUBLISH_DATA"
  | "MANAGE_ANNOUNCEMENTS"
  | "MANAGE_ACCOUNTS";
```

Mọi lớp sử dụng chung:

```ts
hasPermission(role, "IMPORT_DATA")
requirePermission("REVIEW_TRANSACTIONS")
```

## Ba lớp bảo vệ bắt buộc

1. Menu/UI không render chức năng không có quyền.
2. Page/middleware chặn truy cập URL trực tiếp và chuyển về dashboard với thông báo rõ ràng.
3. Server action/API luôn kiểm tra quyền trước khi đọc hoặc sửa dữ liệu nhạy cảm.

## Trình tự thực hiện

1. Tạo file phân quyền trung tâm.
2. Chia sidebar thành các phân khu theo role.
3. Ẩn hoàn toàn chức năng Super Admin khỏi Manager/Kỹ thuật.
4. Chặn trực tiếp route nhập dữ liệu, duyệt sao kê, thông báo và tài khoản quản trị.
5. Đồng bộ kiểm tra quyền tại page, action và API.
6. Test bằng đủ ba tài khoản role.

## Check/Test

- Manager/Kỹ thuật chỉ thấy Tra cứu nội bộ, Liên hệ cư dân và Tài khoản của tôi.
- Manager/Kỹ thuật truy cập trực tiếp route Super Admin bị từ chối và không đọc được dữ liệu quản trị.
- Super Admin thấy đầy đủ menu theo đúng phân khu.
- Action/API từ chối thao tác trái quyền kể cả khi gọi trực tiếp.
- Mục Cơ sở dữ liệu được bỏ khỏi menu.
- `npm test`
- `npm run build`
- Kiểm tra giao diện desktop và mobile với đủ ba role.

## Trạng thái

- [x] Đã triển khai ngày 10/06/2026.
- Nguồn quyền duy nhất: `src/modules/auth/permissions.ts`.
- Menu, middleware và server action đã dùng chung ma trận quyền.
- Manager/Kỹ thuật chỉ thấy tra cứu nội bộ, liên hệ cư dân và tài khoản cá nhân.
- Mục Cơ sở dữ liệu đã bỏ khỏi menu.
- Test quyền và production build đã đạt.

---

# P15. Tăng tính toàn vẹn dữ liệu sao kê và public

## Đã triển khai ngày 10/06/2026

- Số dư đóng lẻ được cộng dồn qua kỳ thay vì mất sau mỗi lần public.
- `phan_bo_giao_dich` có unique theo giao dịch/căn hộ.
- Import sao kê chạy nguyên tử trong `prisma.$transaction`.
- Re-import không tự ghi đè quyết định cũ; parser xung đột được cảnh báo.
- Thêm trạng thái `BAO_LUU` cho khoản chưa xác định hoặc không đưa vào phí.
- Preview tách rõ mốc phí thay đổi, giao dịch mới và số dư chuyển kỳ.
- Logic kỳ phí dùng một nguồn tại `src/modules/billing/paid-through.ts`.
- Logic đọc sao kê dùng chung chuyển vào `src/modules/transactions/import/`.
- Memory-flow cũ đã chuyển vào `archive/code/legacy-review-dashboard/`.
- Phân bổ nhiều căn và báo cáo sao kê đọc mức phí `QLVH` từ `quy_tac_phi`;
  không còn suy luận mức `250.000/200.000` từ chuỗi mã căn.
- Form phân bổ nhiều căn không còn giới hạn số dòng:
  - thêm/xóa dòng động;
  - dán danh sách mã căn từ Excel/Zalo;
  - chia đều tiền làm gợi ý;
  - chỉ cho duyệt khi có ít nhất hai căn và tổng phân bổ bằng đúng giao dịch.
- Đối soát theo tháng hiển thị toàn bộ dòng trong vùng cuộn riêng, header cố định
  và cho sắp xếp tăng/giảm theo căn, số tiền, người chuyển, ngày, trạng thái public.
- Preview public dùng chính helper của parser trung tâm để highlight đầy đủ cụm lô/căn trong nội dung gốc;
  giao dịch duyệt bằng chứng có cột riêng và dialog xem ảnh/PDF ngay trên trang.
- Kiểm tra local ngày 11/06/2026:
  - Prisma schema hợp lệ, database đã áp dụng đủ 9 migration;
  - `npm test`: 291/291 pass;
  - `npm run build`: pass;
  - mobile UI: 40/40 pass;
  - test tương tác duyệt sao kê: pass.

## Nợ cấu trúc còn lại

- Tiếp tục tách `app/admin/dashboard/page.tsx` thành các section component nhỏ.
- Chuyển toàn bộ publish/import Excel còn lại từ CLI orchestration sang service gọi trực tiếp nếu cần tối ưu tải lớn.

---

# Thứ tự ưu tiên đề xuất

1. P0 - Cập nhật roadmap Phase 2 theo hướng opening balance.
2. P1 - Chốt opening balance T5/2026.
3. P2 - Thiết kế schema cho sao kê từ T6/2026.
4. P3 - Chuẩn hóa parser và suggestion engine.
5. P4 - Web import sao kê T6/2026.
6. P5 - Màn hình duyệt sao kê chuyên nghiệp.
7. P6 - Cập nhật lịch sử phí từ giao dịch đã duyệt.
8. P7 - Chốt batch public theo kỳ mới.
9. P8 - Card giao dịch gần nhất trong tra cứu nội bộ.
10. P9 - Dashboard thống kê rút gọn.
11. P10 - Quản trị tài khoản nội bộ vừa đủ.
12. P11 - Thông báo PDF public.
13. P12 - Session đăng nhập dài hạn.
14. P13 - Kiểm thử và deploy Phase 2.
15. P14 - Chuẩn hóa phân quyền và menu theo vai trò.

## Mốc dừng lớn

Không nên bắt đầu import production từ T6/2026 nếu chưa có:

- opening balance T5 đã chốt;
- schema chống trùng đã xong;
- parser không tự suy luận case thiếu lô;
- UI duyệt giao dịch có thể chọn căn, chia tiền, lưu bằng chứng;
- backup production trước migration;
- quyền Super Admin/Manager/Technician đã được kiểm tra.

Không nên chốt public kỳ mới nếu còn:

- giao dịch thu chưa duyệt nhưng có khả năng ảnh hưởng phí cư dân;
- giao dịch nhiều căn chưa phân bổ;
- case Zalo/chứng từ chưa lưu bằng chứng;
- report trước chốt chưa được chủ dự án duyệt.

## Trạng thái Phase 2 hiện hành 2026-07-14

Đã vận hành được:

- Import sao kê ngân hàng.
- Duyệt nhanh, duyệt kèm bằng chứng, phân bổ nhiều căn, đánh dấu không liên quan.
- Tạo preview public và xác nhận public.
- Đối soát theo tháng theo ngày giao dịch đã duyệt.
- Thông báo PDF public cho cư dân.
- Export dữ liệu vận hành và lập danh sách thông báo thu phí/cắt điện.
- Bổ sung giao dịch quá khứ theo hướng có bằng chứng, không tạo giao dịch ngân hàng giả.

Cần tiếp tục tinh chỉnh:

- Quyền theo role và ẩn menu theo quyền.
- Danh bạ cư dân theo hướng CRUD đơn giản thay vì màn duyệt.
- Export theo tháng đồng bộ với bộ lọc đối soát.
- Rollback/gỡ duyệt chỉ cho giao dịch chưa public; giao dịch đã public xử lý bằng điều chỉnh.
- Dọn code cũ vào archive sau khi xác nhận không còn route/query dùng đến.
