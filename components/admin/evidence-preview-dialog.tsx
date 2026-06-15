"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ExternalLink, Eye, FileText, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";

type EvidencePreviewDialogProps = {
  filePath: string;
  fileName?: string | null;
  mimeType?: string | null;
  evidenceType: string;
  note?: string | null;
};

export function EvidencePreviewDialog({
  filePath,
  fileName,
  mimeType,
  evidenceType,
  note,
}: EvidencePreviewDialogProps) {
  const isImage = Boolean(mimeType?.startsWith("image/")) || /\.(png|jpe?g|gif|webp|bmp)$/i.test(filePath);
  const isPdf = mimeType === "application/pdf" || /\.pdf$/i.test(filePath);

  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <Button type="button" variant="outline" size="xs">
          <Eye size={14} aria-hidden="true" />
          Xem
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[1px]" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 grid max-h-[92vh] w-[min(94vw,980px)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-hidden rounded-lg border border-[var(--line)] bg-white p-4 shadow-2xl focus:outline-none sm:p-5">
          <div className="flex min-w-0 items-start justify-between gap-4 pr-9">
            <div className="min-w-0">
              <DialogPrimitive.Title className="truncate text-lg font-semibold">
                Bằng chứng {evidenceType}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 truncate text-sm text-[var(--muted)]">
                {fileName || "Tệp đối soát đính kèm"}
              </DialogPrimitive.Description>
            </div>
            <Button asChild variant="outline" size="xs">
              <a href={filePath} target="_blank" rel="noreferrer">
                <ExternalLink size={14} aria-hidden="true" />
                Mở tệp gốc
              </a>
            </Button>
          </div>

          <div className="flex min-h-[280px] items-center justify-center overflow-auto rounded-lg border border-[var(--line)] bg-slate-50">
            {isImage ? (
              <div className="relative h-[72vh] w-full">
                <Image
                  src={filePath}
                  alt={fileName ? `Bằng chứng ${fileName}` : "Bằng chứng giao dịch"}
                  fill
                  unoptimized
                  sizes="94vw"
                  className="object-contain"
                />
              </div>
            ) : isPdf ? (
              <iframe src={filePath} title={fileName || "Bằng chứng PDF"} className="h-[72vh] w-full bg-white" />
            ) : (
              <div className="grid justify-items-center gap-3 p-8 text-center text-sm text-[var(--muted)]">
                <FileText size={36} aria-hidden="true" />
                <p>Định dạng này không xem trực tiếp trong popup.</p>
                <Button asChild variant="secondary">
                  <a href={filePath} target="_blank" rel="noreferrer">
                    Mở tệp
                  </a>
                </Button>
              </div>
            )}
          </div>

          {note ? (
            <div className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-[var(--muted)]">
              <strong className="text-[var(--text)]">Ghi chú:</strong> {note}
            </div>
          ) : null}

          <DialogPrimitive.Close className="absolute right-3 top-3 rounded-md p-2 text-[var(--muted)] transition-colors hover:bg-slate-100 hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
            <X size={18} aria-hidden="true" />
            <span className="sr-only">Đóng</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
