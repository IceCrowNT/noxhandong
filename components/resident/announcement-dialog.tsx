"use client";

import { ReactNode } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatVietnamDate } from "@/src/modules/shared/utils/date-time";

const PDFViewer = dynamic(() => import("./pdf-viewer"), {
  ssr: false,
  loading: () => <div className="py-10 text-center text-sm font-semibold text-[var(--muted)]">Đang khởi tạo trình xem PDF...</div>,
});

interface AnnouncementDialogProps {
  children: ReactNode;
  item: {
    tieu_de: string;
    mo_ta_ngan: string | null;
    duong_dan_file: string | null;
    mime_type: string | null;
    ngay_cong_khai: Date | null;
  };
}

function isImageAttachment(item: AnnouncementDialogProps["item"]) {
  if (item.mime_type?.startsWith("image/")) return true;
  return Boolean(item.duong_dan_file?.match(/\.(jpeg|jpg|gif|png|webp)$/i));
}

export function AnnouncementDialog({ children, item }: AnnouncementDialogProps) {
  const isImage = isImageAttachment(item);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      {/* Cập nhật DialogContent để Full-screen trên mobile */}
      <DialogContent className="max-w-4xl max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto w-full sm:w-[95vw] h-[100dvh] sm:h-auto rounded-none sm:rounded-lg p-4 sm:p-8 gap-6 bg-white sm:shadow-2xl">
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
              {isImage ? (
                <div className="relative block h-[70vh] min-h-[320px] w-full overflow-hidden rounded-lg bg-[#edf3ef]">
                  <Image
                    src={item.duong_dan_file}
                    alt={item.tieu_de}
                    fill
                    sizes="100vw"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-full rounded-lg overflow-hidden bg-[#edf3ef] flex flex-col items-center py-4">
                  <PDFViewer file={item.duong_dan_file} />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
