const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } = require("docx");

const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          size: 24, // 12pt
          font: "Times New Roman",
        },
      },
    },
  },
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: "--------------------------", bold: true })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: "BÁO CÁO CÔNG VIỆC VẬN HÀNH TÒA NHÀ", bold: true, size: 28 })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: "Tháng: {THANG_BAO_CAO}", italics: true })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),

        // 1. TỔNG QUAN TÌNH HÌNH
        new Paragraph({
          children: [new TextRun({ text: "1. TỔNG QUAN TÌNH HÌNH VẬN HÀNH TRONG THÁNG", bold: true })],
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({ text: "{TONG_QUAN_AN}", bullet: { level: 0 } }),
        new Paragraph({ text: "{TONG_QUAN_KT}", bullet: { level: 0 } }),
        new Paragraph({ text: "{TONG_QUAN_VS}", bullet: { level: 0 } }),
        new Paragraph({ text: "{TONG_QUAN_HC}", bullet: { level: 0 } }),
        new Paragraph({ text: "" }),

        // 2. KPI
        new Paragraph({
          children: [new TextRun({ text: "2. THỐNG KÊ HIỆU SUẤT XỬ LÝ CÔNG VIỆC (KPI)", bold: true })],
          heading: HeadingLevel.HEADING_3,
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "Bộ phận", alignment: AlignmentType.CENTER, bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Tổng số", alignment: AlignmentType.CENTER, bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Đã xong (Đúng hạn)", alignment: AlignmentType.CENTER, bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Đã xong (Trễ hạn)", alignment: AlignmentType.CENTER, bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Đang xử lý (Trong hạn)", alignment: AlignmentType.CENTER, bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Quá hạn chưa xong", alignment: AlignmentType.CENTER, bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Tỷ lệ Hoàn thành", alignment: AlignmentType.CENTER, bold: true })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "Kỹ thuật", bold: true })] }),
                new TableCell({ children: [new Paragraph("{KT_TONG}")] }),
                new TableCell({ children: [new Paragraph("{KT_DUNG}")] }),
                new TableCell({ children: [new Paragraph("{KT_TRE}")] }),
                new TableCell({ children: [new Paragraph("{KT_DANG}")] }),
                new TableCell({ children: [new Paragraph("{KT_QUA}")] }),
                new TableCell({ children: [new Paragraph("{KT_TYLE}")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "Vệ sinh", bold: true })] }),
                new TableCell({ children: [new Paragraph("{VS_TONG}")] }),
                new TableCell({ children: [new Paragraph("{VS_DUNG}")] }),
                new TableCell({ children: [new Paragraph("{VS_TRE}")] }),
                new TableCell({ children: [new Paragraph("{VS_DANG}")] }),
                new TableCell({ children: [new Paragraph("{VS_QUA}")] }),
                new TableCell({ children: [new Paragraph("{VS_TYLE}")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "Hành chính", bold: true })] }),
                new TableCell({ children: [new Paragraph("{HC_TONG}")] }),
                new TableCell({ children: [new Paragraph("{HC_DUNG}")] }),
                new TableCell({ children: [new Paragraph("{HC_TRE}")] }),
                new TableCell({ children: [new Paragraph("{HC_DANG}")] }),
                new TableCell({ children: [new Paragraph("{HC_QUA}")] }),
                new TableCell({ children: [new Paragraph("{HC_TYLE}")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "TỔNG CỘNG", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "{ALL_TONG}", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "{ALL_DUNG}", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "{ALL_TRE}", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "{ALL_DANG}", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "{ALL_QUA}", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "{ALL_TYLE}", bold: true })] }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: "" }),

        // 3. CHI TIẾT
        new Paragraph({
          children: [new TextRun({ text: "3. CHI TIẾT CÔNG VIỆC PHÁT SINH & SỰ CỐ", bold: true })],
          heading: HeadingLevel.HEADING_3,
        }),
        // 3.1 KT
        new Paragraph({ children: [new TextRun({ text: "3.1. Bộ phận Kỹ thuật", bold: true })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "STT", alignment: AlignmentType.CENTER, bold: true })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Tên công việc / Sự cố", alignment: AlignmentType.CENTER, bold: true })], width: { size: 25, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Phân loại", alignment: AlignmentType.CENTER, bold: true })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Ngày nhận", alignment: AlignmentType.CENTER, bold: true })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Deadline", alignment: AlignmentType.CENTER, bold: true })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Trạng thái", alignment: AlignmentType.CENTER, bold: true })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Kết quả thực hiện & Đề xuất", alignment: AlignmentType.CENTER, bold: true })], width: { size: 25, type: WidthType.PERCENTAGE } }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("{#DS_KY_THUAT}{stt}")] }),
                new TableCell({ children: [new Paragraph("{ten_cong_viec}")] }),
                new TableCell({ children: [new Paragraph("{phan_loai}")] }),
                new TableCell({ children: [new Paragraph("{ngay_tiep_nhan}")] }),
                new TableCell({ children: [new Paragraph("{deadline}")] }),
                new TableCell({ children: [new Paragraph("{trang_thai}")] }),
                new TableCell({ children: [new Paragraph("{ket_qua}{/DS_KY_THUAT}")] }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: "" }),

        // 3.2 VS
        new Paragraph({ children: [new TextRun({ text: "3.2. Bộ phận Vệ sinh", bold: true })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "STT", alignment: AlignmentType.CENTER, bold: true })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Tên công việc / Sự cố", alignment: AlignmentType.CENTER, bold: true })], width: { size: 25, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Phân loại", alignment: AlignmentType.CENTER, bold: true })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Ngày nhận", alignment: AlignmentType.CENTER, bold: true })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Deadline", alignment: AlignmentType.CENTER, bold: true })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Trạng thái", alignment: AlignmentType.CENTER, bold: true })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Kết quả thực hiện & Đề xuất", alignment: AlignmentType.CENTER, bold: true })], width: { size: 25, type: WidthType.PERCENTAGE } }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("{#DS_VE_SINH}{stt}")] }),
                new TableCell({ children: [new Paragraph("{ten_cong_viec}")] }),
                new TableCell({ children: [new Paragraph("{phan_loai}")] }),
                new TableCell({ children: [new Paragraph("{ngay_tiep_nhan}")] }),
                new TableCell({ children: [new Paragraph("{deadline}")] }),
                new TableCell({ children: [new Paragraph("{trang_thai}")] }),
                new TableCell({ children: [new Paragraph("{ket_qua}{/DS_VE_SINH}")] }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: "" }),

        // 3.3 HC
        new Paragraph({ children: [new TextRun({ text: "3.3. Bộ phận Hành chính / CSKH", bold: true })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "STT", alignment: AlignmentType.CENTER, bold: true })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Tên công việc / Sự cố", alignment: AlignmentType.CENTER, bold: true })], width: { size: 25, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Phân loại", alignment: AlignmentType.CENTER, bold: true })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Ngày nhận", alignment: AlignmentType.CENTER, bold: true })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Deadline", alignment: AlignmentType.CENTER, bold: true })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Trạng thái", alignment: AlignmentType.CENTER, bold: true })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Kết quả thực hiện & Đề xuất", alignment: AlignmentType.CENTER, bold: true })], width: { size: 25, type: WidthType.PERCENTAGE } }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("{#DS_HANH_CHINH}{stt}")] }),
                new TableCell({ children: [new Paragraph("{ten_cong_viec}")] }),
                new TableCell({ children: [new Paragraph("{phan_loai}")] }),
                new TableCell({ children: [new Paragraph("{ngay_tiep_nhan}")] }),
                new TableCell({ children: [new Paragraph("{deadline}")] }),
                new TableCell({ children: [new Paragraph("{trang_thai}")] }),
                new TableCell({ children: [new Paragraph("{ket_qua}{/DS_HANH_CHINH}")] }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: "" }),

        // 4. VẬT TƯ
        new Paragraph({
          children: [new TextRun({ text: "4. THỐNG KÊ VẬT TƯ TIÊU HAO & CHI PHÍ PHÁT SINH", bold: true })],
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({ text: "(Cập nhật thủ công bởi BQL)", italics: true }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "STT", alignment: AlignmentType.CENTER, bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Tên vật tư / Hạng mục", alignment: AlignmentType.CENTER, bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Số lượng xuất dùng", alignment: AlignmentType.CENTER, bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Vị trí thay thế", alignment: AlignmentType.CENTER, bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Tồn kho", alignment: AlignmentType.CENTER, bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Ghi chú", alignment: AlignmentType.CENTER, bold: true })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("")] }),
                new TableCell({ children: [new Paragraph("")] }),
                new TableCell({ children: [new Paragraph("")] }),
                new TableCell({ children: [new Paragraph("")] }),
                new TableCell({ children: [new Paragraph("")] }),
                new TableCell({ children: [new Paragraph("")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("")] }),
                new TableCell({ children: [new Paragraph("")] }),
                new TableCell({ children: [new Paragraph("")] }),
                new TableCell({ children: [new Paragraph("")] }),
                new TableCell({ children: [new Paragraph("")] }),
                new TableCell({ children: [new Paragraph("")] }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: "" }),

        // 5. KẾ HOẠCH
        new Paragraph({
          children: [new TextRun({ text: "5. KẾ HOẠCH CÔNG VIỆC TRỌNG TÂM THÁNG TỚI", bold: true })],
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({ text: "(Cập nhật thủ công bởi BQL)\n1. Kỹ thuật: \n2. Vệ sinh: \n3. Hành chính: " }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),

        // SIGNATURES
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: "none", size: 0, color: "FFFFFF" },
            bottom: { style: "none", size: 0, color: "FFFFFF" },
            left: { style: "none", size: 0, color: "FFFFFF" },
            right: { style: "none", size: 0, color: "FFFFFF" },
            insideHorizontal: { style: "none", size: 0, color: "FFFFFF" },
            insideVertical: { style: "none", size: 0, color: "FFFFFF" },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "LẬP BÁO CÁO", alignment: AlignmentType.CENTER, bold: true })], width: { size: 50, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "PHÊ DUYỆT / XÁC NHẬN", alignment: AlignmentType.CENTER, bold: true })], width: { size: 50, type: WidthType.PERCENTAGE } }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "(Ký, ghi rõ họ tên)", alignment: AlignmentType.CENTER, italics: true })] }),
                new TableCell({ children: [new Paragraph({ text: "(Ký, ghi rõ họ tên)", alignment: AlignmentType.CENTER, italics: true })] }),
              ],
            }),
          ],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("templates/bao-cao-van-hanh.docx", buffer);
  console.log("Template updated at templates/bao-cao-van-hanh.docx");
});
