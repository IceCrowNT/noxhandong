"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { AnalyzeResponse, ReviewRow } from "@/lib/types";
import { summarizeRows } from "@/lib/review/summary";

type FilterMode = "ALL" | "MATCHED" | "REVIEW" | "UNAPPROVED";

const ELIGIBLE_APPROVAL_STATUSES = new Set<ReviewRow["matchStatus"]>([
  "EXACT_MATCH",
  "NORMALIZED_MATCH",
  "MANUAL_FIXED"
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
          : filterMode === "MATCHED"
            ? ["EXACT_MATCH", "NORMALIZED_MATCH", "MANUAL_FIXED", "APPROVED"].includes(row.matchStatus)
            : filterMode === "REVIEW"
              ? ["UNPARSED", "INVALID_CODE", "MULTI_MATCH", "NEED_REVIEW"].includes(row.matchStatus)
              : !row.approved;

      if (!byFilter) {
        return false;
      }

      if (!loweredQuery) {
        return true;
      }

      return [row.rawDescription, row.ownerName, row.matchedApartmentCode, row.parsedApartmentCode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(loweredQuery));
    });
  }, [filterMode, hideIgnored, query, rows]);

  const summary = useMemo(() => summarizeRows(rows), [rows]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [filterMode, hideIgnored, query, pageSize, rows.length]);

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

      setRows(payload.rows);
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
          ? {
              ...row,
              approved: checked,
              matchStatus: deriveStatus(row, checked)
            }
          : row
      )
    );
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
        <SummaryCard label="Tổng giao dịch" value={summary.totalTransactions} />
        <SummaryCard label="Đã lọc bỏ" value={summary.ignoredCount} />
        <SummaryCard label="Matched" value={summary.matchedCount} />
        <SummaryCard label="Cần rà soát" value={summary.needReviewCount} />
        <SummaryCard label="Invalid" value={summary.invalidCount} />
        <SummaryCard label="Unparsed" value={summary.unparsedCount} />
        <SummaryCard label="Đã duyệt" value={summary.approvedCount} />
        <SummaryCard label="Tổng tiền matched" value={currency(summary.matchedAmount)} />
        <SummaryCard label="Chưa xác nhận" value={currency(summary.pendingAmount)} />
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
              <option value="ALL">Tất cả</option>
              <option value="MATCHED">Chỉ dòng khớp</option>
              <option value="REVIEW">Chỉ dòng cần rà soát</option>
              <option value="UNAPPROVED">Chỉ dòng chưa duyệt</option>
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

                return (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.approved}
                        disabled={!currentCode}
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
                      <span className={`status-pill status-${row.matchStatus.toLowerCase()}`}>{row.matchStatus}</span>
                    </td>
                    <td>{row.matchConfidence.toFixed(2)}</td>
                    <td className="wide-column">{row.matchReason}</td>
                    <td>{row.ownerName || "-"}</td>
                    <td>
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

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="summary-card">
      <p>{label}</p>
      <strong>{value}</strong>
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
