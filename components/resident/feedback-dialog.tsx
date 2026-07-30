"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageCircle, Wrench, Trash2, Coins, HelpCircle } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function FeedbackDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md bg-white/95 backdrop-blur">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-[var(--accent)]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)]">
              <MessageCircle size={20} aria-hidden="true" />
            </span>
            Gửi phản ánh / Góp ý
          </DialogTitle>
          <DialogDescription>
            Vui lòng chọn chủ đề bạn muốn phản ánh để được kết nối chat Zalo trực tiếp đến đúng bộ phận phụ trách.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 mt-4">
          <Button asChild variant="outline" className="h-auto p-4 justify-start border-[var(--line)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors whitespace-normal">
            <Link href="https://zalo.me/0816941333" target="_blank" onClick={() => setOpen(false)}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f2f7f4] border border-[rgba(0,75,70,0.12)] text-[var(--accent)] mr-3">
                <Wrench size={18} />
              </span>
              <div className="text-left flex-1">
                <strong className="block text-[var(--text)]">Kỹ thuật</strong>
                <span className="text-xs text-[var(--muted)] font-normal">Điện, Nước, Hư hỏng sự cố tòa nhà...</span>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto p-4 justify-start border-[var(--line)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors whitespace-normal">
            <Link href="https://zalo.me/0839430222" target="_blank" onClick={() => setOpen(false)}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f2f7f4] border border-[rgba(0,75,70,0.12)] text-[var(--accent)] mr-3">
                <Trash2 size={18} />
              </span>
              <div className="text-left flex-1">
                <strong className="block text-[var(--text)]">Vệ sinh môi trường</strong>
                <span className="text-xs text-[var(--muted)] font-normal">Vệ sinh hành lang, khu vực chung...</span>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto p-4 justify-start border-[var(--line)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors whitespace-normal">
            <Link href="https://zalo.me/0839430222" target="_blank" onClick={() => setOpen(false)}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f2f7f4] border border-[rgba(0,75,70,0.12)] text-[var(--accent)] mr-3">
                <Coins size={18} />
              </span>
              <div className="text-left flex-1">
                <strong className="block text-[var(--text)]">Tài chính</strong>
                <span className="text-xs text-[var(--muted)] font-normal">Đóng phí Quản lý vận hành...</span>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto p-4 justify-start border-[var(--line)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors whitespace-normal">
            <Link href="https://zalo.me/0839430222" target="_blank" onClick={() => setOpen(false)}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f2f7f4] border border-[rgba(0,75,70,0.12)] text-[var(--accent)] mr-3">
                <HelpCircle size={18} />
              </span>
              <div className="text-left flex-1">
                <strong className="block text-[var(--text)]">Góp ý khác</strong>
                <span className="text-xs text-[var(--muted)] font-normal">Các vấn đề khác gửi tới BQT</span>
              </div>
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
