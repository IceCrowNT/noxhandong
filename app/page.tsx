import Image from "next/image";
import Link from "next/link";
import { Bell, CalendarDays, FileText, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { PUBLIC_LOOKUP_MAX_LENGTH } from "@/src/modules/billing/fee-status";
import { prisma } from "@/src/modules/database";
import { formatVietnamDate } from "@/src/modules/shared/utils/date-time";
import { AnnouncementDialog } from "@/components/resident/announcement-dialog";

export default async function HomePage() {
  const announcements = await prisma.thongBaoCongKhai.findMany({
    where: { trang_thai: "CONG_KHAI" },
    orderBy: [{ ngay_cong_khai: "desc" }, { id: "desc" }],
    take: 3,
    select: {
      id: true,
      tieu_de: true,
      mo_ta_ngan: true,
      duong_dan_file: true,
      ngay_cong_khai: true,
    },
  });

  return (
    <main className="relative isolate grid min-h-screen grid-rows-[auto_1fr] overflow-hidden bg-[#edf3ef] px-4 pb-8 text-[var(--text)]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <Image
          className="hidden h-full w-full object-cover md:block"
          src="/images/resident-home-desktop.webp"
          alt=""
          aria-hidden="true"
          fill
          priority
        />
        <Image
          className="h-full w-full object-cover md:hidden"
          src="/images/resident-home-mobile.webp"
          alt=""
          aria-hidden="true"
          fill
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(247,250,248,0.58)] via-[rgba(247,250,248,0.78)] to-[rgba(247,250,248,0.95)]" />
      </div>

      <header className="relative z-10 mx-auto flex min-h-16 w-full max-w-5xl items-center justify-between border-b border-[var(--line)] py-3">
        <Link className="flex items-center gap-3 text-[var(--accent)]" href="/">
          <Image
            className="rounded-full border border-[rgba(0,75,70,0.18)] bg-white p-1"
            src="/images/logo-hoanghuy.webp"
            alt=""
            aria-hidden="true"
            width={40}
            height={40}
          />
          <span className="text-lg font-bold md:text-xl">BQT An Đồng</span>
        </Link>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/login">Quản trị</Link>
        </Button>
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-3xl place-items-center py-10">
        <Card className="w-full bg-white/82 shadow-[0_18px_60px_rgba(25,28,28,0.12)]">
          <CardContent className="p-5 md:p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 w-fit rounded-full border border-[var(--line)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                Cư dân không cần đăng nhập
              </div>
              <h1 className="text-4xl font-bold leading-tight text-[var(--accent)] md:text-5xl">
                Tra cứu phí quản lý
              </h1>
            </div>

            <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px] md:items-end" action="/tra-cuu-phi">
              <label className="grid gap-2 text-sm font-bold">
                Mã căn
                <Input
                  aria-label="Nhập mã căn hộ"
                  autoComplete="off"
                  inputMode="text"
                  maxLength={PUBLIC_LOOKUP_MAX_LENGTH}
                  name="ma_can"
                  placeholder="Nhập mã căn, ví dụ L1.115"
                />
              </label>
              <SubmitButton size="lg" pendingText="Đang tra cứu...">
                <Search size={18} aria-hidden="true" />
                Tra cứu
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        {announcements.length ? (
          <section className="mt-5 w-full rounded-2xl border border-[rgba(0,75,70,0.14)] bg-white/88 p-3 shadow-[0_16px_48px_rgba(25,28,28,0.10)] backdrop-blur md:p-4">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Bell size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-[17px] font-bold leading-6 text-[var(--accent)]">Thông báo từ BQT</h2>
                  <p className="text-[13px] font-medium leading-5 text-[var(--muted)]">Tài liệu công khai cho cư dân</p>
                </div>
              </div>
              <span className="hidden rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)] sm:block">
                {announcements.length} tin mới
              </span>
            </div>

            <div className="grid gap-2">
              {announcements.map((item, index) => {
                const isPrimary = index === 0;
                return (
                  <AnnouncementDialog key={item.id} item={item}>
                    <button
                      type="button"
                      className={
                        isPrimary
                          ? "group grid gap-3 rounded-xl border border-[rgba(0,75,70,0.20)] bg-[rgba(232,245,238,0.82)] p-4 text-left transition hover:border-[var(--accent)] hover:bg-[rgba(232,245,238,0.96)] sm:grid-cols-[1fr_auto] sm:items-center w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                          : "group grid gap-2 rounded-xl border border-[var(--line)] bg-white/88 p-3 text-left transition hover:border-[var(--accent)] sm:grid-cols-[1fr_auto] sm:items-center w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                      }
                    >
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                          <FileText size={15} aria-hidden="true" />
                          {isPrimary ? "Thông báo mới nhất" : (item.duong_dan_file ? "PDF công khai" : "Thông báo")}
                        </div>
                        <strong className={isPrimary ? "block text-lg leading-snug text-[var(--text)]" : "block truncate text-sm text-[var(--text)]"}>
                          {item.tieu_de}
                        </strong>
                        {item.mo_ta_ngan ? (
                          <p className={isPrimary ? "mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]" : "mt-1 line-clamp-1 text-sm text-[var(--muted)]"}>
                            {item.mo_ta_ngan}
                          </p>
                        ) : null}
                        <div className="mt-2 flex items-center gap-1 text-xs text-[var(--muted)]">
                          <CalendarDays size={14} aria-hidden="true" />
                          {formatVietnamDate(item.ngay_cong_khai)}
                        </div>
                      </div>
                      <span className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] px-3 text-sm font-bold text-white transition group-hover:brightness-110">
                        Xem chi tiết
                      </span>
                    </button>
                  </AnnouncementDialog>
                );
              })}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
