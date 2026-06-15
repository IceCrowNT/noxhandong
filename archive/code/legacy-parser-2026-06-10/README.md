# Legacy parser wrappers - 2026-06-10

Hai file trong thư mục này được chuyển khỏi source sau khi thuật toán parser được hợp nhất.

## File đã archive

- `lib-filter-rules.ts.archive`
- `src-modules-shared-filter-rules.ts.archive`

## Lý do

Hai file chỉ làm nhiệm vụ re-export bộ rule cũ và không còn được source code, route, script hoặc test sử dụng.

## File thay thế

Toàn bộ thuật toán parser, phân loại giao dịch, bộ từ khóa lọc và gợi ý căn thiếu lô nằm tại:

`src/modules/transactions/parser/apartment-parser.ts`

Không được khôi phục hai wrapper này vào runtime nếu chưa có lý do kỹ thuật và test tương ứng.

