import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { readStatementWorkbook } from "@/lib/excel/statement-reader";

describe("readStatementWorkbook", () => {
  it("rejects management workbook uploaded as statement workbook", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Mã căn hộ", "Chủ hộ"], ["L1.101", "A"]]), "Danh sách khách hàng");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Số căn hộ", "T1"], ["L1.101", 250000]]), "Lịch sử đóng phí");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

    expect(() => readStatementWorkbook(buffer)).toThrow(
      "File sao kê có vẻ là file quản lý chung cư. Hãy chọn đúng file sao kê ngân hàng."
    );
  });
});
