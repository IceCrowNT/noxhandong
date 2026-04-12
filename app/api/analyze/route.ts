import { NextResponse } from "next/server";
import { readManagementWorkbook } from "@/lib/excel/management-reader";
import { buildReviewRows } from "@/lib/matcher";
import { parseApartmentCode } from "@/lib/parser/apartment-parser";
import { summarizeRows } from "@/lib/review/summary";
import { readStatementFile } from "@/lib/statement-reader";
import { AnalyzeResponse } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const managementFile = formData.get("managementFile");
    const statementFile = formData.get("statementFile");

    if (!(managementFile instanceof File) || !(statementFile instanceof File)) {
      return NextResponse.json({ error: "Cần upload đủ file quản lý và file sao kê." }, { status: 400 });
    }

    if (managementFile.name === statementFile.name && managementFile.size === statementFile.size) {
      return NextResponse.json(
        { error: "File quản lý và file sao kê đang là cùng một file. Hãy chọn đúng file sao kê ngân hàng." },
        { status: 400 }
      );
    }

    const managementBuffer = await managementFile.arrayBuffer();
    const managementData = readManagementWorkbook(managementBuffer);
    const transactions = await readStatementFile(statementFile);
    const parseResults = transactions.map((transaction) => parseApartmentCode(transaction.description));
    const rows = buildReviewRows(transactions, parseResults, managementData.customers);

    const response: AnalyzeResponse = {
      workbookInfo: {
        customerCount: managementData.customers.length,
        sheetNames: managementData.workbookSheetNames
      },
      validApartmentCodes: managementData.customers.map((item) => item.apartmentCode).sort(),
      customerOptions: managementData.customers
        .map((item) => ({
          code: item.apartmentCode,
          ownerName: item.ownerName
        }))
        .sort((left, right) => left.code.localeCompare(right.code)),
      rows,
      summary: summarizeRows(rows)
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể phân tích file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
