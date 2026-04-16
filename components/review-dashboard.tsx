"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { AnalyzeResponse, ReviewRow } from "@/lib/types";
import { buildSuggestedAllocationDrafts, hasValidAllocationDrafts } from "@/lib/review/allocations";
import {
  getCategoryLabel,
  getRowCategory,
  getStatusLabel,
  isMatchedStatus,
  isNeedReviewStatus,
  ReviewCategory
} from "@/lib/review/presentation";
import { summarizeRows } from "@/lib/review/summary";

type FilterMode = ReviewCategory;

const ELIGIBLE_APPROVAL_STATUSES = new Set<ReviewRow["matchStatus"]>([
  "EXACT_MATCH",
  "NORMALIZED_MATCH",
  "MANUAL_FIXED",
  "MULTI_MATCH"
]);

function currency(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function deriveStatus(row: ReviewRow, approved: boolean): ReviewRow["matchStatus"] {
  if (approved) {
    return "APPROVED";
  }

  if (row.manualApartmentCode && row.matchedApartmentCode) {
    return "MANUAL_FIXED";
  }

  if (row.matchedApartmentCode) {
    return row.parsedApartmentCode === row.matchedApartmentCode ? "EXACT_MATCH" : "NORMALIZED_MATCH";
  }

  return row.matchStatus === "APPROVED" ? "NEED_REVIEW" : row.matchStatus;
}

export function ReviewDashboard() {
  const [managementFile, setManagementFile] = useState<File | null>(null);
  const [statementFile, setStatementFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [validCodes, setValidCodes] = useState<string[]>([]);
  const [customerOptions, setCustomerOptions] = useState<Array<{ code: string; ownerName?: string }>>([]);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("ALL");
  const [hideIgnored, setHideIgnored] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      if (hideIgnored && row.matchStatus === "IGNORED_INTERNAL") {
        return false;
      }

      const byFilter =
        filterMode === "ALL"
          ? true
          : filterMode === "UNAPPROVED"
            ? !row.approved
            : filterMode === "MATCHED"
              ? isMatchedStatus(row.matchStatus)
              : filterMode === "REVIEW"
                ? isNeedReviewStatus(row.matchStatus)
                : filterMode === "INVALID"
                  ? row.matchStatus === "INVALID_CODE"
                  : filterMode === "UNPARSED"
                    ? row.matchStatus === "UNPARSED"
                    : row.matchStatus === "IGNORED_INTERNAL";

      if (!byFilter) {
        return false;
      }

      if (!loweredQuery) {
        return true;
      }

      return [
        row.rawDescription,
        row.ownerName,
        row.matchedApartmentCode,
        row.parsedApartmentCode,
        row.reviewNote,
        row.senderName,
        row.senderAccount,
        row.transactionId
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(loweredQuery));
    });
  }, [filterMode, hideIgnored, query, rows]);

  const summary = useMemo(() => summarizeRows(rows), [rows]);
  const categorizedCountTotal =
    summary.matchedCount +
    summary.needReviewCount +
    summary.invalidCount +
    summary.unparsedCount +
    summary.ignoredCount;
  const categorizedAmountTotal =
    summary.matchedAmount +
    summary.needReviewAmount +
    summary.invalidAmount +
    summary.unparsedAmount +
    summary.ignoredAmount;
  const totalsBalanced =
    categorizedCountTotal === summary.totalTransactions &&
    categorizedAmountTotal === summary.totalAmount;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const categoryRows: Array<{
    category: Exclude<ReviewCategory, "ALL" | "UNAPPROVED">;
    count: number;
    amount: number;
  }> = [
    { category: "MATCHED", count: summary.matchedCount, amount: summary.matchedAmount },
    { category: "REVIEW", count: summary.needReviewCount, amount: summary.needReviewAmount },
    { category: "INVALID", count: summary.invalidCount, amount: summary.invalidAmount },
    { category: "UNPARSED", count: summary.unparsedCount, amount: summary.unparsedAmount },
    { category: "IGNORED", count: summary.ignoredCount, amount: summary.ignoredAmount }
  ];
  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [filterMode, hideIgnored, query, pageSize, rows.length]);

  useEffect(() => {
    if (filterMode === "IGNORED" && hideIgnored) {
      setHideIgnored(false);
    }
  }, [filterMode, hideIgnored]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!managementFile || !statementFile) {
      setError("Cần chọn đủ file quản lý và file sao kê.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("managementFile", managementFile);
      formData.append("statementFile", statementFile);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData
      });
      const rawResponse = await response.text();
      const payload = safeParseJson<AnalyzeResponse | { error: string }>(rawResponse);

      if (!response.ok) {
        throw new Error(payload && "error" in payload ? payload.error : rawResponse || "Không thể phân tích.");
      }

      if (!payload) {
        throw new Error("API không trả về JSON hợp lệ.");
      }

      if ("error" in payload) {
        throw new Error(payload.error);
      }

      setRows(
        payload.rows.map((row) =>
          row.matchStatus === "MULTI_MATCH"
            ? {
                ...row,
                allocationDrafts: buildSuggestedAllocationDrafts(row)
              }
            : row
        )
      );
      setValidCodes(payload.validApartmentCodes);
      setCustomerOptions(payload.customerOptions);
      setSheetNames(payload.workbookInfo.sheetNames);
      setPage(1);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Không thể phân tích.");
    } finally {
      setLoading(false);
    }
  }

  function updateRow(id: string, updater: (row: ReviewRow) => ReviewRow) {
    setRows((currentRows) => currentRows.map((row) => (row.id === id ? updater(row) : row)));
  }

  function handleManualCodeChange(id: string, value: string) {
    const normalizedValue = value.trim();
    const matchedCustomer = customerOptions.find((item) => item.code === normalizedValue);

    updateRow(id, (row) => {
      if (!normalizedValue) {
        const restoredCustomer = customerOptions.find((item) => item.code === row.parsedApartmentCode);
        const restoredRow: ReviewRow = {
          ...row,
          manualApartmentCode: undefined,
          matchedApartmentCode: restoredCustomer?.code,
          ownerName: restoredCustomer?.ownerName,
          approved: false
        };

        return {
          ...restoredRow,
          matchStatus: deriveStatus(restoredRow, false)
        };
      }

      const approved = matchedCustomer ? row.approved : false;
      return {
        ...row,
        manualApartmentCode: normalizedValue,
        matchedApartmentCode: matchedCustomer?.code,
        ownerName: matchedCustomer?.ownerName || row.ownerName,
        matchStatus: matchedCustomer ? "MANUAL_FIXED" : "NEED_REVIEW",
        matchReason: matchedCustomer
          ? "Manual apartment code selected by reviewer"
          : "Manual apartment code is not in customer list",
        matchConfidence: matchedCustomer ? 1 : 0.2,
        approved,
        suggestions: row.suggestions
      };
    });
  }

  function handleApproval(id: string, approved: boolean) {
    updateRow(id, (row) => ({
      ...row,
      approved,
      matchStatus: deriveStatus(row, approved)
    }));
  }

  function handleApproveEligible(checked: boolean) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        ELIGIBLE_APPROVAL_STATUSES.has(row.matchStatus)
        && (row.matchStatus !== "MULTI_MATCH" || hasValidAllocationDrafts(row))
          ? {
              ...row,
              approved: checked,
              matchStatus: deriveStatus(row, checked)
            }
          : row
      )
    );
  }

  function handleApplySuggestedAllocations(id: string) {
    updateRow(id, (row) => ({
      ...row,
      allocationDrafts: buildSuggestedAllocationDrafts(row),
      approved: false,
      matchStatus: deriveStatus({ ...row, approved: false }, false)
    }));
  }

  function handleAllocationAmountChange(id: string, apartmentCode: string, value: string) {
    const numericValue = Number(value.replace(/[^\d]/g, ""));
    updateRow(id, (row) => ({
      ...row,
      approved: false,
      allocationDrafts: (row.allocationDrafts ?? []).map((item) =>
        item.apartmentCode === apartmentCode
          ? {
              ...item,
              amount: Number.isFinite(numericValue) ? numericValue : 0
            }
          : item
      ),
      matchStatus: deriveStatus({ ...row, approved: false }, false)
    }));
  }

  function handleNoteChange(id: string, event: ChangeEvent<HTMLInputElement>) {
    const { value } = event.target;
    updateRow(id, (row) => ({
      ...row,
      reviewNote: value
    }));
  }

  async function handleExport() {
    const response = await fetch("/api/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ rows })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error || "Không thể export file.");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fee-review-${new Date().toISOString().slice(0, 10)}.xlsx`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Web app nội bộ</p>
          <h1>Xử lý sao kê và rà soát phí chung cư</h1>
          <p className="hero-copy">
            Upload workbook quản lý và sao kê ngân hàng, parse mã căn hộ theo rule-based parser, rà soát
            từng dòng trước khi export ra file Excel mới.
          </p>
        </div>
        <form className="upload-grid" onSubmit={handleAnalyze}>
          <label className="upload-field">
            <span>File Excel quản lý</span>
            <input type="file" accept=".xlsx,.xls" onChange={(event) => setManagementFile(event.target.files?.[0] || null)} />
          </label>
          <label className="upload-field">
            <span>File sao kê ngân hàng (Excel hoặc PDF)</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.pdf,application/pdf"
              onChange={(event) => setStatementFile(event.target.files?.[0] || null)}
            />
          </label>
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Đang phân tích..." : "Phân tích"}
          </button>
        </form>
        {sheetNames.length > 0 ? (
          <p className="sheet-note">Đã nhận diện workbook quản lý với các sheet: {sheetNames.join(", ")}</p>
        ) : null}
        {error ? <p className="error-banner">{error}</p> : null}
      </section>

      <section className="summary-grid">
        <SummaryCard label="Tổng giao dịch sao kê" value={summary.totalTransactions} secondary={`Tổng tiền: ${currency(summary.totalAmount)}`} />
        <SummaryCard label="Tổng tiền sao kê" value={currency(summary.totalAmount)} secondary="Tổng gốc từ file sao kê" />
        <SummaryCard
          label="Tổng tiền đã phân loại"
          value={currency(summary.classifiedAmount)}
          secondary={summary.amountGap === 0 ? "Đã khớp với tổng sao kê" : `Còn lệch: ${currency(summary.amountGap)}`}
        />
        <SummaryCard
          label={getCategoryLabel("MATCHED")}
          value={summary.matchedCount}
          secondary={`Số tiền: ${currency(summary.matchedAmount)}`}
        />
        <SummaryCard label="Cần rà soát" value={summary.needReviewCount} secondary={`Số tiền: ${currency(summary.needReviewAmount)}`} />
        <SummaryCard
          label={getCategoryLabel("INVALID")}
          value={summary.invalidCount}
          secondary={`Số tiền: ${currency(summary.invalidAmount)}`}
        />
        <SummaryCard
          label={getCategoryLabel("UNPARSED")}
          value={summary.unparsedCount}
          secondary={`Số tiền: ${currency(summary.unparsedAmount)}`}
        />
        <SummaryCard
          label={getCategoryLabel("IGNORED")}
          value={summary.ignoredCount}
          secondary={`Số tiền: ${currency(summary.ignoredAmount)}`}
        />
        <SummaryCard label="Đã duyệt" value={summary.approvedCount} secondary="Workflow" />
        <SummaryCard label="Chưa xác nhận" value={currency(summary.pendingAmount)} secondary="Chưa tick duyệt" />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Đối Soát Tổng</p>
            <h2>Phân Tách Theo Hạng Mục</h2>
          </div>
          <p className={`reconcile-pill ${totalsBalanced ? "reconcile-ok" : "reconcile-warn"}`}>
            {totalsBalanced && summary.amountGap === 0
              ? "Tổng tiền và số đơn đã khớp toàn bộ sao kê"
              : "Tổng phân loại chưa khớp, cần kiểm tra lại"}
          </p>
        </div>
        <div className="reconcile-table-wrap">
          <table className="reconcile-table">
            <thead>
              <tr>
                <th>Hạng mục</th>
                <th>Số đơn</th>
                <th>Tổng tiền</th>
              </tr>
            </thead>
            <tbody>
              {categoryRows.map((item) => (
                <tr key={item.category}>
                  <td>{getCategoryLabel(item.category)}</td>
                  <td>{item.count}</td>
                  <td>{currency(item.amount)}</td>
                </tr>
              ))}
              <tr className="reconcile-total">
                <td>Tổng sao kê</td>
                <td>{summary.totalTransactions}</td>
                <td>{currency(summary.totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Kết quả parse</p>
            <h2>Rà soát giao dịch</h2>
          </div>
          <div className="toolbar">
            <input
              className="search-input"
              placeholder="Tìm theo mã căn, nội dung, tên chủ hộ"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select className="select-input" value={filterMode} onChange={(event) => setFilterMode(event.target.value as FilterMode)}>
              <option value="ALL">Tất cả hạng mục</option>
              <option value="MATCHED">{getCategoryLabel("MATCHED")}</option>
              <option value="REVIEW">{getCategoryLabel("REVIEW")}</option>
              <option value="INVALID">{getCategoryLabel("INVALID")}</option>
              <option value="UNPARSED">{getCategoryLabel("UNPARSED")}</option>
              <option value="IGNORED">{getCategoryLabel("IGNORED")}</option>
              <option value="UNAPPROVED">Chưa tick duyệt</option>
            </select>
            <label className="toggle-inline">
              <input type="checkbox" checked={hideIgnored} onChange={(event) => setHideIgnored(event.target.checked)} />
              <span>Ẩn lệnh không liên quan căn hộ</span>
            </label>
            <select className="select-input compact-select" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              <option value={5}>5 dòng</option>
              <option value={10}>10 dòng</option>
              <option value={15}>15 dòng</option>
              <option value={20}>20 dòng</option>
            </select>
            <button className="secondary-button" type="button" onClick={() => handleApproveEligible(true)}>
              Tick tất cả dòng đủ điều kiện
            </button>
            <button className="secondary-button" type="button" onClick={() => handleApproveEligible(false)}>
              Bỏ tick hàng loạt
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="review-table">
            <thead>
              <tr>
                <th>Duyệt</th>
                <th>Ngày GD</th>
                <th>Số tiền</th>
                <th>Nội dung gốc</th>
                <th>Nội dung chuẩn hóa</th>
                <th>Mã parse</th>
                <th>Mã khớp</th>
                <th>Trạng thái</th>
                <th>Độ tin cậy</th>
                <th>Lý do</th>
                <th>Chủ hộ</th>
                <th>Sửa tay</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => {
                const currentCode = row.manualApartmentCode || row.matchedApartmentCode || "";
                const canApprove = Boolean(currentCode) || hasValidAllocationDrafts(row);
                const allocationSum = (row.allocationDrafts ?? []).reduce((sum, item) => sum + item.amount, 0);

                return (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.approved}
                        disabled={!canApprove}
                        onChange={(event) => handleApproval(row.id, event.target.checked)}
                      />
                    </td>
                    <td>{row.transactionDate || "-"}</td>
                    <td>{currency(row.amount)}</td>
                    <td className="wide-column">{row.rawDescription}</td>
                    <td className="wide-column muted">{row.normalizedDescription}</td>
                    <td>{row.parsedApartmentCode || "-"}</td>
                    <td>{currentCode || "-"}</td>
                    <td>
                      <span className={`status-pill status-${row.matchStatus.toLowerCase()}`}>{getStatusLabel(row.matchStatus)}</span>
                    </td>
                    <td>{row.matchConfidence.toFixed(2)}</td>
                    <td className="wide-column">
                      <strong>{getCategoryLabel(getRowCategory(row))}</strong>
                      <br />
                      {row.matchReason}
                    </td>
                    <td>{row.ownerName || "-"}</td>
                    <td>
                      {row.matchStatus === "MULTI_MATCH" ? (
                        <div className="allocation-editor">
                          <button className="secondary-button compact-button" type="button" onClick={() => handleApplySuggestedAllocations(row.id)}>
                            Áp dụng phí chuẩn
                          </button>
                          {(row.allocationDrafts ?? []).map((item) => (
                            <label key={item.apartmentCode} className="allocation-row">
                              <span>{item.apartmentCode}</span>
                              <input
                                className="note-input"
                                inputMode="numeric"
                                value={item.amount}
                                onChange={(event) => handleAllocationAmountChange(row.id, item.apartmentCode, event.target.value)}
                              />
                            </label>
                          ))}
                          <span className={`allocation-total ${allocationSum === row.amount ? "allocation-ok" : "allocation-warn"}`}>
                            Tổng phân bổ: {currency(allocationSum)} / {currency(row.amount)}
                          </span>
                        </div>
                      ) : (
                        <>
                          <input
                            list={`codes-${row.id}`}
                            className="select-input"
                            value={currentCode}
                            onChange={(event) => handleManualCodeChange(row.id, event.target.value)}
                            placeholder="Chọn mã căn"
                          />
                          <datalist id={`codes-${row.id}`}>
                            {validCodes.map((code) => (
                              <option value={code} key={code} />
                            ))}
                          </datalist>
                        </>
                      )}
                    </td>
                    <td>
                      <input
                        className="note-input"
                        value={row.reviewNote || ""}
                        onChange={(event) => handleNoteChange(row.id, event)}
                        placeholder="Ghi chú duyệt"
                      />
                    </td>
                  </tr>
                );
              })}
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="empty-state">
                    Chưa có dữ liệu phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="pagination-bar">
          <span className="pagination-meta">
            Hiển thị {paginatedRows.length === 0 ? 0 : (page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, filteredRows.length)} / {filteredRows.length} dòng
          </span>
          <div className="pagination-actions">
            <button className="secondary-button" type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
              Trang trước
            </button>
            <span className="pagination-meta">
              Trang {page}/{totalPages}
            </span>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
            >
              Trang sau
            </button>
          </div>
        </div>
      </section>

      <section className="panel export-panel">
        <div>
          <p className="eyebrow">Tổng hợp trước khi export</p>
          <h2>Xuất file Excel mới</h2>
          <p className="hero-copy">
            File output sẽ có các sheet `Lich su dong phi_reviewed`, `Need_review`, `Original_transactions`
            và `Summary`. File gốc không bị ghi đè.
          </p>
        </div>
        <button className="primary-button" type="button" onClick={handleExport} disabled={rows.length === 0}>
          Export Excel
        </button>
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  secondary
}: {
  label: string;
  value: string | number;
  secondary?: string;
}) {
  return (
    <article className="summary-card">
      <p>{label}</p>
      <strong>{value}</strong>
      {secondary ? <span className="summary-subtext">{secondary}</span> : null}
    </article>
  );
}

function safeParseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
