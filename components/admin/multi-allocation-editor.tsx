"use client";

import { useMemo, useRef, useState } from "react";
import { CheckCircle2, ListPlus, Plus, Split, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  allocationTotal,
  parseAllocationCodeList,
  splitAllocationAmount,
  type AllocationEditorRow,
} from "@/src/modules/transactions/review/allocation-editor";

type RowWithId = AllocationEditorRow & { id: number };

type MultiAllocationEditorProps = {
  totalAmount: number;
  initialRows: Array<{ code: string; amount: number | string }>;
};

function formatMoney(value: number) {
  return `${value.toLocaleString("vi-VN")} đ`;
}

export function MultiAllocationEditor({ totalAmount, initialRows }: MultiAllocationEditorProps) {
  const nextId = useRef(1);
  const [rows, setRows] = useState<RowWithId[]>(() => {
    const source = initialRows.length ? [...initialRows] : [];
    while (source.length < 2) source.push({ code: "", amount: "" });
    return source.map((row) => ({
      id: nextId.current++,
      code: row.code,
      amount: row.amount ? String(row.amount) : "",
    }));
  });
  const [pastedCodes, setPastedCodes] = useState("");
  const [pasteError, setPasteError] = useState("");

  const allocated = useMemo(() => allocationTotal(rows), [rows]);
  const difference = totalAmount - allocated;
  const completeRows = rows.filter((row) => row.code.trim() && Number(row.amount.replace(/\D/g, "")) > 0);
  const canSubmit = completeRows.length >= 2 && difference === 0;

  function updateRow(id: number, patch: Partial<AllocationEditorRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((current) => [...current, { id: nextId.current++, code: "", amount: "" }]);
  }

  function removeRow(id: number) {
    setRows((current) => (current.length <= 2 ? current : current.filter((row) => row.id !== id)));
  }

  function divideEvenly(targetRows = rows) {
    const amounts = splitAllocationAmount(totalAmount, targetRows.length);
    setRows(targetRows.map((row, index) => ({ ...row, amount: String(amounts[index] || "") })));
  }

  function applyPastedCodes() {
    const codes = parseAllocationCodeList(pastedCodes);
    if (codes.length < 2) {
      setPasteError("Cần ít nhất 2 mã căn hợp lệ, mỗi mã cách nhau bằng xuống dòng, dấu phẩy hoặc dấu chấm phẩy.");
      return;
    }

    const amounts = splitAllocationAmount(totalAmount, codes.length);
    setRows(
      codes.map((code, index) => ({
        id: nextId.current++,
        code,
        amount: String(amounts[index] || ""),
      })),
    );
    setPasteError("");
  }

  return (
    <div className="grid gap-3">
      <div className="rounded-lg border border-[var(--line)] bg-slate-50 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Dán nhanh danh sách căn</p>
            <p className="text-xs text-[var(--muted)]">Mỗi dòng một mã căn; cũng chấp nhận dấu phẩy hoặc dấu chấm phẩy.</p>
          </div>
          <Button type="button" size="xs" variant="outline" onClick={applyPastedCodes}>
            <ListPlus size={15} aria-hidden="true" />
            Tạo danh sách
          </Button>
        </div>
        <Textarea
          value={pastedCodes}
          onChange={(event) => setPastedCodes(event.target.value)}
          placeholder={"Ví dụ:\nL4A.132\nL4A.202\nL4A.211A\nL4C.130"}
          rows={3}
          className="min-h-[72px] bg-white"
        />
        {pasteError ? <p className="mt-2 text-xs font-medium text-[var(--danger)]">{pasteError}</p> : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-[var(--muted)]">{rows.length} dòng phân bổ</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="xs" variant="outline" onClick={() => divideEvenly()}>
            <Split size={15} aria-hidden="true" />
            Chia đều
          </Button>
          <Button type="button" size="xs" variant="outline" onClick={addRow}>
            <Plus size={15} aria-hidden="true" />
            Thêm căn
          </Button>
        </div>
      </div>

      <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid grid-cols-[minmax(0,1fr)_110px_32px] gap-2"
            data-testid="multi-allocation-row"
          >
            <Input
              name="allocationCode"
              value={row.code}
              onChange={(event) => updateRow(row.id, { code: event.target.value })}
              placeholder={`Mã căn ${index + 1}`}
              aria-label={`Mã căn phân bổ ${index + 1}`}
            />
            <Input
              name="allocationAmount"
              value={row.amount}
              onChange={(event) => updateRow(row.id, { amount: event.target.value })}
              inputMode="numeric"
              placeholder="Số tiền"
              aria-label={`Số tiền phân bổ ${index + 1}`}
            />
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => removeRow(row.id)}
              disabled={rows.length <= 2}
              title="Xóa dòng"
              aria-label={`Xóa dòng phân bổ ${index + 1}`}
            >
              <Trash2 size={15} aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>

      <div
        className={`grid gap-1 rounded-lg border px-3 py-2 text-xs ${
          canSubmit
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-amber-200 bg-amber-50 text-amber-950"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <span>Đã phân bổ</span>
          <strong>
            {formatMoney(allocated)} / {formatMoney(totalAmount)}
          </strong>
        </div>
        {!canSubmit ? (
          <p>
            {completeRows.length < 2
              ? "Cần ít nhất 2 căn có mã và số tiền."
              : difference > 0
                ? `Còn thiếu ${formatMoney(difference)}.`
                : `Đang vượt ${formatMoney(Math.abs(difference))}.`}
          </p>
        ) : (
          <p>Tổng phân bổ đã khớp giao dịch.</p>
        )}
      </div>

      <Textarea name="note" placeholder="Ghi chú phân bổ nhiều căn" rows={2} />

      <SubmitButton variant="secondary" pendingText="Đang phân bổ..." disabled={!canSubmit}>
        <CheckCircle2 size={16} aria-hidden="true" />
        Duyệt phân bổ
      </SubmitButton>
    </div>
  );
}
