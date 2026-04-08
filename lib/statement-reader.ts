import { readStatementWorkbook } from "@/lib/excel/statement-reader";
import { TransactionRecord } from "@/lib/types";

function isPdfFile(fileName: string, mimeType: string): boolean {
  return mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
}

export async function readStatementFile(file: File): Promise<TransactionRecord[]> {
  const buffer = await file.arrayBuffer();
  if (isPdfFile(file.name, file.type)) {
    const { readStatementPdf } = await import("@/lib/pdf/statement-pdf-reader");
    return readStatementPdf(buffer);
  }

  return readStatementWorkbook(buffer);
}
