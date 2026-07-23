"use client";

import { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatVietnamDate } from "@/src/modules/shared/utils/date-time";

interface AnnouncementDialogProps {
  children: ReactNode;
  item: {
    tieu_de: string;
    mo_ta_ngan: string | null;
    duong_dan_file: string | null;
    ngay_cong_khai: Date | null;
  };
}

export function AnnouncementDialog({ children, item }: AnnouncementDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] p-4 sm:p-6 gap-6 bg-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-[var(--accent)] leading-snug">
            {item.tieu_de}
          </DialogTitle>
          <DialogDescription className="text-sm font-medium">
            Ngày đăng: {formatVietnamDate(item.ngay_cong_khai)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 mt-2">
          {item.mo_ta_ngan ? (
            <div className="text-[var(--text)] whitespace-pre-wrap leading-relaxed text-[15px] sm:text-base">
              {item.mo_ta_ngan}
            </div>
          ) : null}

          {item.duong_dan_file ? (
            <div className="grid gap-2 border-t border-[var(--line)] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">Tài liệu đính kèm</span>
                <a 
                  href={item.duong_dan_file} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-sm font-semibold text-[var(--primary)] hover:underline"
                >
                  Mở PDF toàn màn hình
                </a>
              </div>
              <div className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-lg overflow-hidden h-[60vh] min-h-[400px]">
                {/* Fallback to google docs viewer if mobile, or just standard object/iframe */}
                <iframe 
                  src={`${item.duong_dan_file}#toolbar=0`} 
                  className="w-full h-full"
                  title="PDF Viewer"
                />
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
