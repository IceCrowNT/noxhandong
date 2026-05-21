import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PUBLIC_LOOKUP_MAX_LENGTH } from "@/src/modules/billing/fee-status";

export default function HomePage() {
  return (
    <main className="relative grid min-h-screen grid-rows-[auto_1fr] overflow-hidden bg-[#edf3ef] px-4 pb-8 text-[var(--text)]">
      <div className="pointer-events-none fixed inset-0 -z-10">
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

      <header className="mx-auto flex min-h-16 w-full max-w-5xl items-center justify-between border-b border-[var(--line)] py-3">
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

      <section className="mx-auto grid w-full max-w-3xl place-items-center py-10">
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
              <Button type="submit" size="lg">
                <Search size={18} aria-hidden="true" />
                Tra cứu
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
