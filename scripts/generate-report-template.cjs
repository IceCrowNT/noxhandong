const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } = require("docx");

const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          size: 24,
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
          children: [
            new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, size: 28 }),
          ],
          alignment: "center",
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, size: 26 }),
          ],
          alignment: "center",
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "--------------------------", bold: true, size: 26 }),
          ],
          alignment: "center",
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "BÁO CÁO CÔNG VIỆC VẬN HÀNH BQL", bold: true, size: 22 }),
          ],
          alignment: "center",
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Tháng: {THANG_BAO_CAO}", italics: true, size: 24 }),
          ],
          alignment: "center",
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "1. Thống kê hiệu suất (KPI)", bold: true, size: 28 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "{NHAN_XET_CHUNG}", size: 24, italics: true }),
          ],
          indent: { firstLine: 720 },
        }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "Bộ phận", alignment: "center" })] }),
                new TableCell({ children: [new Paragraph({ text: "Tổng số", alignment: "center" })] }),
                new TableCell({ children: [new Paragraph({ text: "Đúng hạn", alignment: "center" })] }),
                new TableCell({ children: [new Paragraph({ text: "Trễ hạn", alignment: "center" })] }),
                new TableCell({ children: [new Paragraph({ text: "Chưa xong", alignment: "center" })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Kỹ thuật")] }),
                new TableCell({ children: [new Paragraph("{KT_TONG}")] }),
                new TableCell({ children: [new Paragraph("{KT_DUNG}")] }),
                new TableCell({ children: [new Paragraph("{KT_TRE}")] }),
                new TableCell({ children: [new Paragraph("{KT_CHUA}")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Vệ sinh")] }),
                new TableCell({ children: [new Paragraph("{VS_TONG}")] }),
                new TableCell({ children: [new Paragraph("{VS_DUNG}")] }),
                new TableCell({ children: [new Paragraph("{VS_TRE}")] }),
                new TableCell({ children: [new Paragraph("{VS_CHUA}")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Hành chính")] }),
                new TableCell({ children: [new Paragraph("{HC_TONG}")] }),
                new TableCell({ children: [new Paragraph("{HC_DUNG}")] }),
                new TableCell({ children: [new Paragraph("{HC_TRE}")] }),
                new TableCell({ children: [new Paragraph("{HC_CHUA}")] }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "2. Chi tiết công việc KỸ THUẬT", bold: true, size: 28 }),
          ],
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "Tên công việc", alignment: "center", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Ngày giao", alignment: "center", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Deadline", alignment: "center", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Trạng thái", alignment: "center", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Ghi chú báo xong", alignment: "center", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Ghi chú đóng việc", alignment: "center", bold: true })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("{#DS_KY_THUAT}{ten_cong_viec}")] }),
                new TableCell({ children: [new Paragraph("{thoi_gian_giao}")] }),
                new TableCell({ children: [new Paragraph("{deadline}")] }),
                new TableCell({ children: [new Paragraph("{trang_thai}")] }),
                new TableCell({ children: [new Paragraph("{ghi_chu}")] }),
                new TableCell({ children: [new Paragraph("{ghi_chu_dong}{/DS_KY_THUAT}")] }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "3. Chi tiết công việc VỆ SINH", bold: true, size: 28 }),
          ],
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "Tên công việc", alignment: "center", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Ngày giao", alignment: "center", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Deadline", alignment: "center", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Trạng thái", alignment: "center", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Ghi chú báo xong", alignment: "center", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Ghi chú đóng việc", alignment: "center", bold: true })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("{#DS_VE_SINH}{ten_cong_viec}")] }),
                new TableCell({ children: [new Paragraph("{thoi_gian_giao}")] }),
                new TableCell({ children: [new Paragraph("{deadline}")] }),
                new TableCell({ children: [new Paragraph("{trang_thai}")] }),
                new TableCell({ children: [new Paragraph("{ghi_chu}")] }),
                new TableCell({ children: [new Paragraph("{ghi_chu_dong}{/DS_VE_SINH}")] }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "4. Chi tiết công việc HÀNH CHÍNH", bold: true, size: 28 }),
          ],
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "Tên công việc", alignment: "center", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Ngày giao", alignment: "center", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Deadline", alignment: "center", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Trạng thái", alignment: "center", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Ghi chú báo xong", alignment: "center", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Ghi chú đóng việc", alignment: "center", bold: true })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("{#DS_HANH_CHINH}{ten_cong_viec}")] }),
                new TableCell({ children: [new Paragraph("{thoi_gian_giao}")] }),
                new TableCell({ children: [new Paragraph("{deadline}")] }),
                new TableCell({ children: [new Paragraph("{trang_thai}")] }),
                new TableCell({ children: [new Paragraph("{ghi_chu}")] }),
                new TableCell({ children: [new Paragraph("{ghi_chu_dong}{/DS_HANH_CHINH}")] }),
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
