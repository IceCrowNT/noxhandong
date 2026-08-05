// @ts-nocheck

import fs from "node:fs";
import path from "node:path";
import {
  readStatementRows,
  resolveExistingInputArg,
  statementIncomePeriods,
} from "../src/modules/transactions/import/bank-statement-common";

function main() {
  const { inputPath } = resolveExistingInputArg("");
  if (!inputPath) {
    throw new Error("Missing bank statement input path");
  }

  const resolvedPath = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  const statement = readStatementRows(resolvedPath);
  const incomePeriods = statementIncomePeriods(statement.records);

  console.log(
    JSON.stringify(
      {
        sourceFile: inputPath,
        rawRows: statement.records.length,
        incomePeriods,
        hasMultipleIncomePeriods: incomePeriods.length > 1,
      },
      null,
      2,
    ),
  );
}

main();
