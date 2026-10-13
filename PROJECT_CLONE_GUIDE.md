# Hướng dẫn Clone và Phát triển Project (Apartment Fee Reviewer)

Tài liệu này cung cấp cái nhìn tổng quan toàn diện về kiến trúc, công nghệ, phương pháp luận và giao diện (theme) của hệ thống **Quản lý nội bộ (Apartment Fee Reviewer)**. Tài liệu này đặc biệt hữu ích khi bạn muốn clone (nhân bản) dự án này để phát triển một dự án tương tự.

---

## 1. Công Nghệ Cốt Lõi (Tech Stack)

Dự án này sử dụng một bộ công nghệ full-stack cực kỳ hiện đại và mạnh mẽ trong hệ sinh thái JavaScript/TypeScript:

*   **Framework chính:** [Next.js 15.2.4](https://nextjs.org/) (Sử dụng App Router hoàn toàn mới).
*   **Thư viện UI:** [React 19](https://react.dev/).
*   **Ngôn ngữ lập trình:** [TypeScript 5.8](https://www.typescriptlang.org/) (Strict typing cho cả Frontend và Backend).
*   **Cơ sở dữ liệu:** PostgreSQL.
*   **ORM (Kết nối CSDL):** [Prisma 7.7.0](https://www.prisma.io/).
*   **Styling (CSS):** [Tailwind CSS v4](https://tailwindcss.com/) (Tích hợp qua PostCSS).
*   **Quản lý State & UI Components:** 
    *   [Radix UI](https://www.radix-ui.com/): Cung cấp các primitive components (không chứa style) đảm bảo chuẩn Accessibility (a11y).
    *   [shadcn/ui](https://ui.shadcn.com/): Kiến trúc component tùy biến cao (thường kết hợp `class-variance-authority`, `clsx`, `tailwind-merge`).
    *   [Lucide React](https://lucide.dev/): Bộ icon chuẩn, nhẹ và đồng nhất cho toàn hệ thống.
*   **Hiển thị Biểu đồ:** [Recharts](https://recharts.org/) (Thư viện vẽ biểu đồ React mạnh mẽ và dễ custom).
*   **Xử lý File & Báo cáo (Document Processing):**
    *   *Word:* `docxtemplater`, `pizzip`, `jszip` (Dùng để render file Word `.docx` tự động dựa trên template).
    *   *Excel:* `exceljs`, `xlsx` (Đọc, ghi và parse file Excel phức tạp, import sao kê ngân hàng...).
    *   *PDF:* `pdf-parse`, `react-pdf`.
*   **Testing:** [Vitest](https://vitest.dev/) (Unit testing) và [Playwright](https://playwright.dev/) (End-to-End & UI testing).

---

## 2. Kiến Trúc và Phương Pháp Luận (Methodology)

### 2.1. Cấu trúc thư mục (Directory Structure)
Dự án được tổ chức theo mô hình **Feature-sliced / Modular** kết hợp với kiến trúc mặc định của Next.js:
*   `/app`: Chứa toàn bộ Routing của ứng dụng (Pages, Layouts, API Routes).
    *   `/app/api/*`: Xử lý các logic backend nặng (ví dụ: Export Excel, Word, PDF).
    *   `/app/admin/*`: Phân hệ quản trị dành riêng cho Ban quản lý (BQL).
*   `/components`: Chứa các Component dùng chung (UI components của shadcn, layout components).
*   `/src/modules`: Nơi chứa business logic, database queries, utils, services (tách biệt logic khỏi UI).
*   `/scripts`: Nơi chứa các file script chạy độc lập (Cronjobs, Import/Export dữ liệu lớn, Seeding, Backup DB). Sử dụng `tsx` hoặc `node`.
*   `/templates`: Chứa các file mẫu (ví dụ: `bao-cao-van-hanh.docx`).

### 2.2. Phương pháp gọi API và Xử lý dữ liệu
*   **Server Actions & Server Components:** Dự án tối ưu hóa hiệu suất bằng cách sử dụng tối đa React Server Components (RSC) và Server Actions của Next.js để query dữ liệu trực tiếp từ Prisma mà không cần viết quá nhiều API rườm rà.
*   **Bất đồng bộ (AJAX) không load lại trang:** Tại các trang quản trị (Dashboard, KPI), hệ thống sử dụng các state nội bộ kết hợp với fetch API (`/api/stats/...`) để cập nhật số liệu (PieChart, Table) ngay lập tức khi thay đổi tháng/năm mà không cần refresh trang.
*   **Script độc lập (Standalone Scripts):** Các tác vụ cực kỳ nặng (như đối soát hàng nghìn dòng sao kê ngân hàng, sync dữ liệu Master) được tách riêng thành các file `.cjs` hoặc `.ts` chạy độc lập ngoài luồng web server (trong thư mục `/scripts`).

### 2.3. Quản lý phân quyền (RBAC)
*   Tách biệt rõ ràng luồng người dùng (Resident/Cư dân) và quản trị viên (Admin/BQL).
*   Hệ thống có cơ chế bảo vệ Route và API (thông qua hàm như `getCurrentAdmin()` trong session/cookie).

---

## 3. Giao diện và Phong cách thiết kế (Theme & Design System)

*   **Minimalist & Clean (Tối giản & Gọn gàng):** Hệ thống hướng tới phong cách thiết kế phẳng, tận dụng tối đa không gian trắng (white space) để giảm tải thông tin cho mắt người quản trị.
*   **Màu sắc (Color Palette):**
    *   Sử dụng hệ thống biến CSS (CSS Variables) kết hợp Tailwind (ví dụ: `var(--background)`, `var(--primary)`, `var(--accent)`).
    *   Màu chủ đạo thường là các tone màu chuyên nghiệp (Xanh dương, Trắng, Xám nhạt).
    *   Hỗ trợ sẵn cấu trúc Dark Mode/Light Mode thông qua Tailwind.
*   **Thành phần giao diện (UI Components):**
    *   Sử dụng `shadcn/ui` mang lại cảm giác cực kỳ "Premium" (nhờ sự kết hợp của hiệu ứng shadow mượt mà, viền mỏng 1px, bo góc tinh tế `rounded-md` / `rounded-lg`).
    *   Sử dụng [Sonner](https://sonner.emilkowal.ski/) để hiển thị các thông báo (Toast notifications) dưới góc màn hình với animation xuất hiện rất hiện đại.
*   **Tương tác (Interaction):**
    *   Hạn chế chuyển trang toàn cục (Full page reload).
    *   Sử dụng nhiều Dialog, Popover, Select, và Tabs của Radix UI để người dùng thao tác trực tiếp trên 1 màn hình.

---

## 4. Các bước khởi tạo (Nếu bạn muốn clone)

1.  **Thiết lập Môi trường:** Cài đặt Node.js (>= 18.x hoặc 20.x), PostgreSQL.
2.  **Clone mã nguồn & Cài đặt:**
    ```bash
    npm install
    ```
3.  **Cấu hình Database:**
    *   Copy file `.env.example` thành `.env` và điền chuỗi kết nối PostgreSQL.
    *   Chạy lệnh: `npm run prisma:generate` và `npm run prisma:migrate:dev` để khởi tạo bảng.
4.  **Chạy dự án:**
    ```bash
    npm run dev
    ```

Dự án này là một hình mẫu xuất sắc cho một **Admin Dashboard / Internal Tool** đòi hỏi nghiệp vụ phức tạp, xử lý file văn bản nhiều và cần hiệu suất (Performance) cao.
