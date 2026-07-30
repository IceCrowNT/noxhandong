import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContactDialog } from "@/components/resident/contact-dialog";
import { FeedbackDialog } from "@/components/resident/feedback-dialog";
import { PhoneCall, Landmark, MessageCircle } from "lucide-react";

export function ResidentFooter() {
  return (
    <footer className="relative z-10 mx-auto grid w-full max-w-4xl gap-5 sm:grid-cols-2 mt-auto pt-6 border-t border-[rgba(0,75,70,0.12)]">
      {/* Contact Card */}
      <Card className="border-[rgba(0,75,70,0.14)] bg-white/88 shadow-[0_16px_48px_rgba(25,28,28,0.10)] backdrop-blur">
        <CardContent className="p-4 md:p-5">
          <div className="mb-4 flex items-center gap-2 text-[var(--accent)]">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)]">
              <PhoneCall size={18} aria-hidden="true" />
            </span>
            <h2 className="text-lg font-bold">Đầu mối liên hệ</h2>
          </div>
          
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between border-b border-[var(--line)] pb-2 items-center">
              <span className="font-medium text-[var(--muted)]">Kỹ thuật (8h-22h)</span>
              <a href="tel:0816941333" className="text-[var(--accent)] font-bold hover:underline">0816 941 333</a>
            </div>
            <div className="flex justify-between border-b border-[var(--line)] pb-2 items-center">
              <span className="font-medium text-[var(--muted)]">Bảo vệ (24/24)</span>
              <a href="tel:0399845669" className="text-[var(--accent)] font-bold hover:underline">0399 845 669</a>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-[var(--line)]">
            <ContactDialog>
              <Button className="w-full mb-2 bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[rgba(0,75,70,0.15)] shadow-none" variant="secondary">
                Xem toàn bộ danh bạ (8 bộ phận)
              </Button>
            </ContactDialog>
            
            <FeedbackDialog>
              <Button className="w-full bg-[var(--accent)] hover:brightness-110 transition-all text-white shadow-sm" variant="default">
                <MessageCircle size={18} className="mr-2" />
                Gửi phản ánh / Góp ý
              </Button>
            </FeedbackDialog>
          </div>
        </CardContent>
      </Card>

      {/* Payment Card */}
      <Card className="border-[rgba(0,75,70,0.14)] bg-white/88 shadow-[0_16px_48px_rgba(25,28,28,0.10)] backdrop-blur">
        <CardContent className="p-4 md:p-5">
          <div className="mb-4 flex items-center gap-2 text-[var(--accent)]">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)]">
              <Landmark size={18} aria-hidden="true" />
            </span>
            <h2 className="text-lg font-bold">Thanh toán phí QLVH</h2>
          </div>
          <div className="grid gap-3 text-[15px] leading-relaxed">
            <div>
              <span className="block text-sm text-[var(--muted)]">Ngân hàng</span>
              <strong className="text-[var(--text)]">Vietinbank Lê Chân</strong>
            </div>
            <div>
              <span className="block text-sm text-[var(--muted)]">Chủ tài khoản</span>
              <strong className="text-[var(--text)]">Ban quản trị khu nhà ở xã hội tại xã An Đồng</strong>
            </div>
            <div>
              <span className="block text-sm text-[var(--muted)]">Số tài khoản</span>
              <strong className="text-xl tracking-wide text-[var(--accent)]">116 002 961 023</strong>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-[var(--accent-soft)] bg-[#f2f7f4] p-3 text-center text-sm font-medium text-[var(--accent)]">
            Vui lòng <span className="font-bold underline">Tra cứu phí</span> ở trên để lấy cú pháp chuyển khoản chính xác nhất cho căn hộ của bạn.
          </div>
        </CardContent>
      </Card>
    </footer>
  );
}
