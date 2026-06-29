import ExcelJS from "exceljs";

import { prisma } from "@/src/modules/database";
import { transactionMatchStatusLabel, transactionReviewStatusLabel } from "@/src/modules/shared/labels";

const PERIOD_PATTERN = /^T(0?[1-9]|1[0-2])-(\d{4})$/i;

function parsePeriod(period: string) {
  const match = String(period || "").trim().match(PERIOD_PATTERN);
  if (!match) {
    throw new Error("Kỳ dữ liệu không hợp lệ.");
  }

  const month = Number(match[1]);
  const year = Number(match[2]);
  if (year < 2026 || (year === 2026 && month < 6)) {
    throw new Error("Xuất sao kê tháng chỉ hỗ trợ từ T6-2026.");
  }

  return { month, year, label: `T${month}-${year}` };
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Saigon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(value);
}

function formatMoney(value: number) {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
}

function worksheetBorder() {
  return {
    top: { style: "thin" as const },
    left: { style: "thin" as const },
    right: { style: "thin" as const },
    bottom: { style: "thin" as const },
  };
}

function resolveApartmentName(row: {
  ma_can_duoc_chon: string | null;
  ma_can_parse: string | null;
  phan_bo_giao_dich: Array<{ can_ho: { ma_can: string } }>;
}) {
  const allocatedCodes = [...new Set(row.phan_bo_giao_dich.map((item) => item.can_ho.ma_can).filter(Boolean))];
  if (allocatedCodes.length) return allocatedCodes.join(", ");
  if (row.ma_can_duoc_chon?.trim()) return row.ma_can_duoc_chon.trim();
  if (row.ma_can_parse?.trim()) return row.ma_can_parse.trim();
  return "";
}

function resolveReason(row: {
  trang_thai_duyet: string | null;
  trang_thai_khop: string | null;
  ghi_chu_duyet: string | null;
  ma_can_duoc_chon: string | null;
  ma_can_parse: string | null;
  phan_bo_giao_dich: Array<{ can_ho: { ma_can: string } }>;
}) {
  if (row.ghi_chu_duyet?.trim()) return row.ghi_chu_duyet.trim();

  const allocatedCodes = [...new Set(row.phan_bo_giao_dich.map((item) => item.can_ho.ma_can).filter(Boolean))];
  if (allocatedCodes.length > 1) {
    return "Phân bổ nhiều căn";
  }

  if (row.ma_can_duoc_chon && row.ma_can_parse && row.ma_can_duoc_chon !== row.ma_can_parse) {
    return `Duyệt tay khác parser (${row.ma_can_parse})`;
  }

  if (row.ma_can_duoc_chon && !row.ma_can_parse) {
    return "Nhập tay / duyệt tay";
  }

  if (row.trang_thai_duyet === "DA_DUYET") {
    return transactionMatchStatusLabel(row.trang_thai_khop);
  }

  return `${transactionReviewStatusLabel(row.trang_thai_duyet)}${row.trang_thai_khop ? ` · ${transactionMatchStatusLabel(row.trang_thai_khop)}` : ""}`;
}

export async function buildMonthlyBankStatementWorkbook(period: string) {
  const { month, year, label } = parsePeriod(period);
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));

  const rows = await prisma.giaoDichNganHang.findMany({
    where: {
      so_tien: {
        gt: 0,
      },
      ngay_giao_dich: {
        gte: start,
        lt: end,
      },
    },
    orderBy: [{ ngay_giao_dich: "asc" }, { id: "asc" }],
    select: {
      id: true,
      ngay_giao_dich: true,
      so_tien: true,
      ten_nguoi_chuyen: true,
      tai_khoan_nguoi_chuyen: true,
      tham_chieu_ngan_hang: true,
      noi_dung_goc: true,
      ma_can_parse: true,
      ma_can_duoc_chon: true,
      ghi_chu_duyet: true,
      trang_thai_khop: true,
      trang_thai_duyet: true,
      lo_nhap_du_lieu: {
        select: {
          id: true,
          ten_file: true,
        },
      },
      phan_bo_giao_dich: {
        select: {
          so_tien_phan_bo: true,
          can_ho: {
            select: {
              ma_can: true,
            },
          },
        },
      },
    },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Codex";
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet(`Sao ke ${label}`, {
    views: [{ state: "frozen", ySplit: 1 }],
    pageSetup: { paperSize: 9, orientation: "landscape", fitToWidth: 1, fitToHeight: 0 },
  });

  sheet.columns = [
    { header: "STT", key: "stt", width: 8 },
    { header: "Ngày giao dịch", key: "ngay", width: 24 },
    { header: "Số tiền", key: "soTien", width: 16 },
    { header: "Người chuyển", key: "nguoiChuyen", width: 26 },
    { header: "Tài khoản/SĐT", key: "taiKhoan", width: 20 },
    { header: "Mã tham chiếu", key: "thamChieu", width: 24 },
    { header: "Nội dung chuyển khoản", key: "noiDung", width: 60 },
    { header: "Tên căn hộ sau parser/duyệt", key: "canHo", width: 24 },
    { header: "Thông tin lý do", key: "lyDo", width: 34 },
    { header: "Trạng thái duyệt", key: "trangThai", width: 18 },
    { header: "Lô nhập", key: "loNhap", width: 14 },
    { header: "Tên file nhập", key: "tenFile", width: 34 },
  ];

  sheet.getRow(1).height = 22;
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF5EF" } };
    cell.border = worksheetBorder();
  });

  let totalAmount = 0;
  let assignedCount = 0;
  const statusCounts = new Map<string, number>();

  rows.forEach((row, index) => {
    const amount = Number(row.so_tien);
    const apartmentName = resolveApartmentName(row);
    const reason = resolveReason(row);
    const status = transactionReviewStatusLabel(row.trang_thai_duyet);

    totalAmount += amount;
    if (apartmentName) assignedCount += 1;
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);

    const excelRow = sheet.addRow({
      stt: index + 1,
      ngay: formatDateTime(row.ngay_giao_dich),
      soTien: amount,
      nguoiChuyen: row.ten_nguoi_chuyen || "",
      taiKhoan: row.tai_khoan_nguoi_chuyen || "",
      thamChieu: row.tham_chieu_ngan_hang || "",
      noiDung: row.noi_dung_goc,
      canHo: apartmentName,
      lyDo: reason,
      trangThai: status,
      loNhap: `#${row.lo_nhap_du_lieu.id}`,
      tenFile: row.lo_nhap_du_lieu.ten_file,
    });

    excelRow.eachCell((cell, colNumber) => {
      cell.border = worksheetBorder();
      cell.alignment = {
        vertical: "top",
        horizontal: colNumber === 3 ? "right" : "left",
        wrapText: true,
      };
    });

    excelRow.getCell("soTien").numFmt = "#,##0";
  });

  const summary = workbook.addWorksheet("Thong ke", {
    pageSetup: { paperSize: 9, orientation: "portrait", fitToWidth: 1, fitToHeight: 0 },
  });
  summary.columns = [
    { header: "Thông tin", key: "label", width: 32 },
    { header: "Giá trị", key: "value", width: 48 },
  ];

  summary.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF5EF" } };
    cell.border = worksheetBorder();
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  const summaryRows: Array<[string, string]> = [
    ["Kỳ dữ liệu", label],
    ["Tổng giao dịch", rows.length.toLocaleString("vi-VN")],
    ["Tổng tiền ghi có", `${formatMoney(totalAmount)} đ`],
    ["Đã gán căn hộ", assignedCount.toLocaleString("vi-VN")],
    ["Chưa gán căn hộ", (rows.length - assignedCount).toLocaleString("vi-VN")],
  ];

  for (const [status, count] of statusCounts.entries()) {
    summaryRows.push([`Trạng thái ${status}`, count.toLocaleString("vi-VN")]);
  }

  summaryRows.push(["Ghi chú", "Cột “Tên căn hộ sau parser/duyệt” ưu tiên phân bổ thực tế, sau đó đến căn duyệt tay, cuối cùng mới dùng kết quả parser."]);

  summaryRows.forEach(([label, value]) => {
    const row = summary.addRow({ label, value });
    row.eachCell((cell) => {
      cell.border = worksheetBorder();
      cell.alignment = { vertical: "top", wrapText: true };
    });
  });

  return {
    workbook,
    fileName: `Sao-ke-ngan-hang-${label}.xlsx`,
  };
}
