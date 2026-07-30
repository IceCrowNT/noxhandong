"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PhoneCall } from "lucide-react";
import React from "react";

export function ContactDialog({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md bg-white/95 backdrop-blur">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-[var(--accent)]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)]">
              <PhoneCall size={20} aria-hidden="true" />
            </span>
            Danh bạ liên hệ dự án
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-0 text-[15px] max-h-[60vh] overflow-y-auto pr-2 mt-4">
          <div className="flex justify-between border-b border-[var(--line)] py-3 items-center">
            <span className="font-medium text-[var(--muted)]">1. Trưởng bộ phận Điện</span>
            <a href="tel:0934293112" className="text-[var(--accent)] font-bold hover:underline">0934 293 112</a>
          </div>
          <div className="flex justify-between border-b border-[var(--line)] py-3 items-center">
            <span className="font-medium text-[var(--muted)]">2. Trưởng bộ phận Nước</span>
            <a href="tel:0386298978" className="text-[var(--accent)] font-bold hover:underline">0386 298 978</a>
          </div>
          <div className="flex justify-between border-b border-[var(--line)] py-3 items-center">
            <span className="font-medium text-[var(--muted)]">3. Kế toán Điện nước</span>
            <a href="tel:0901518189" className="text-[var(--accent)] font-bold hover:underline">0901 518 189</a>
          </div>
          <div className="flex justify-between border-b border-[var(--line)] py-3 items-center">
            <span className="font-medium text-[var(--muted)]">4. Tiếp nhận thông tin ĐN</span>
            <a href="tel:02253871395" className="text-[var(--accent)] font-bold hover:underline">0225 387 1395</a>
          </div>
          <div className="flex justify-between border-b border-[var(--line)] py-3 items-center">
            <span className="font-medium text-[var(--muted)]">5. Kỹ thuật, sửa chữa (8h-22h)</span>
            <a href="tel:0816941333" className="text-[var(--accent)] font-bold hover:underline">0816 941 333</a>
          </div>
          <div className="flex justify-between border-b border-[var(--line)] py-3 items-center">
            <span className="font-medium text-[var(--muted)]">6. Kế toán thu phí QLVH</span>
            <a href="tel:0839430222" className="text-[var(--accent)] font-bold hover:underline">0839 430 222</a>
          </div>
          <div className="flex justify-between border-b border-[var(--line)] py-3 items-center">
            <span className="font-medium text-[var(--muted)]">7. Giám sát vệ sinh dự án</span>
            <a href="tel:0947488392" className="text-[var(--accent)] font-bold hover:underline">0947 488 392</a>
          </div>
          <div className="flex justify-between py-3 items-center">
            <span className="font-medium text-[var(--muted)]">8. Đội trưởng bảo vệ (24/24)</span>
            <div className="text-right leading-relaxed">
              <a href="tel:0352757853" className="block text-[var(--accent)] font-bold hover:underline">035 27 57 853</a>
              <a href="tel:0399845669" className="block text-[var(--accent)] font-bold hover:underline">0399 845 669</a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
