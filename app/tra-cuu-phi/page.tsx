import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  parsePublicLookupInput,
  PUBLIC_LOOKUP_MAX_LENGTH,
  publicFeeDisplayText,
} from "@/src/modules/billing/fee-status";
import { prisma } from "@/src/modules/database";

type FeeLookupPageProps = {
  searchParams?: Promise<{
    ma_can?: string;
  }>;
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 40;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitBucket>();

function formatDateTime(value: Date | null) {
  if (!value) return "-";

  return value.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function payloadFlag(payload: unknown, key: string) {
  if (!payload || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  return Boolean(record[key]);
}

async function checkRateLimit() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for") || "";
  const ip =
    forwardedFor
      .split(",")
      .map((item) => item.trim())
      .find(Boolean) ||
    headerStore.get("x-real-ip") ||
    "local";

  const now = Date.now();
  const current = rateLimitStore.get(ip);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false, retryAfterSeconds: 0 };
  }

  current.count += 1;
  if (current.count > RATE_LIMIT_MAX_REQUESTS) {
    return {
      limited: true,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  return { limited: false, retryAfterSeconds: 0 };
}

function PublicBackground() {
  return (
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
  );
}

function StateCard({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "error";
}) {
  return (
    <Card className={tone === "error" ? "bg-red-50/90" : "bg-white/86"}>
      <CardContent className="grid gap-3 p-6 text-center">
        {tone === "error" ? (
          <AlertCircle className="mx-auto text-red-800" size={34} aria-hidden="true" />
        ) : (
          <Search className="mx-auto text-[var(--accent)]" size={34} aria-hidden="true" />
        )}
        {children}
      </CardContent>
    </Card>
  );
}

export default async function FeeLookupPage({ searchParams }: FeeLookupPageProps) {
  const params = await searchParams;
  const rawApartmentCode = params?.ma_can || "";
  const hasQuery = rawApartmentCode.trim().length > 0;
  const rateLimit = hasQuery ? await checkRateLimit() : { limited: false, retryAfterSeconds: 0 };
  const lookup = hasQuery ? parsePublicLookupInput(rawApartmentCode) : null;

  const currentBatch = await prisma.batchTrangThaiPhiPublic.findFirst({
    where: {
      trang_thai: "DA_PUBLIC",
      la_batch_public_hien_hanh: true,
    },
    orderBy: { public_luc: "desc" },
  });

  const feeStatuses =
    currentBatch && lookup?.ok && !rateLimit.limited
      ? await prisma.trangThaiPhiCanHoPublic.findMany({
          where: {
            batch_id: currentBatch.id,
            ma_can: {
              in: lookup.candidates,
            },
          },
        })
      : [];
  const feeStatus =
    lookup?.ok && feeStatuses.length > 0
      ? lookup.candidates
          .map((candidate) => feeStatuses.find((status) => status.ma_can === candidate))
          .find((status) => Boolean(status)) || null
      : null;
  const expandableCandidatePrefixes =
    lookup?.ok && !feeStatus
      ? lookup.candidates.filter((candidate) => /^L[1-9][A-Z]?\.[1-9]\d{2}$/.test(candidate))
      : [];
  const expandedFeeStatuses =
    currentBatch && lookup?.ok && !feeStatus && expandableCandidatePrefixes.length > 0 && !rateLimit.limited
      ? await prisma.trangThaiPhiCanHoPublic.findMany({
          where: {
            batch_id: currentBatch.id,
            OR: expandableCandidatePrefixes.map((candidate) => ({
              ma_can: {
                startsWith: candidate,
              },
            })),
          },
          orderBy: {
            ma_can: "asc",
          },
        })
      : [];
  const resolvedFeeStatus = feeStatus || (expandedFeeStatuses.length === 1 ? expandedFeeStatuses[0] : null);
  const ambiguousFeeStatuses = !feeStatus && expandedFeeStatuses.length > 1 ? expandedFeeStatuses : [];

  return (
    <main className="relative isolate min-h-screen bg-[#edf3ef] px-4 pb-8 text-[var(--text)]">
      <PublicBackground />

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

      <section className="relative z-10 mx-auto grid w-full max-w-4xl gap-4 py-8">
        <Card className="bg-white/82 shadow-[0_18px_60px_rgba(25,28,28,0.12)]">
          <CardContent className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_360px] md:items-end md:p-7">
            <div>
              <div className="mb-3 w-fit rounded-full border border-[var(--line)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                Tra cứu cho cư dân
              </div>
              <h1 className="text-3xl font-bold leading-tight text-[var(--accent)] md:text-4xl">
                Kiểm tra phí quản lý căn hộ
              </h1>
            </div>
            <form className="grid gap-3" action="/tra-cuu-phi">
              <label className="grid gap-2 text-sm font-bold">
                Mã căn
                <Input
                  aria-label="Nhập mã căn hộ cần tra cứu"
                  name="ma_can"
                  placeholder="Ví dụ: L1.115 hoặc căn 115 lô L1"
                  defaultValue={rawApartmentCode}
                  autoComplete="off"
                  maxLength={PUBLIC_LOOKUP_MAX_LENGTH}
                  inputMode="text"
                />
              </label>
              <SubmitButton size="lg" pendingText="Đang tra cứu...">
                <Search size={18} aria-hidden="true" />
                Tra cứu
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        {!currentBatch ? (
          <StateCard>
            <h2 className="text-2xl font-bold">Chưa có dữ liệu tra cứu</h2>
            <p className="mx-auto max-w-xl text-sm leading-6 text-[var(--muted)]">
              BQT chưa xác nhận dữ liệu phí mới nhất để cư dân tra cứu. Vui lòng quay lại sau.
            </p>
          </StateCard>
        ) : null}

        {currentBatch && !hasQuery ? (
          <StateCard>
            <h2 className="text-2xl font-bold">Nhập mã căn để tra cứu</h2>
            <p className="mx-auto max-w-xl text-sm leading-6 text-[var(--muted)]">
              Ví dụ: L1.115, L4B.412, LK2.10 hoặc căn 115 lô L1.
            </p>
          </StateCard>
        ) : null}

        {currentBatch && hasQuery && rateLimit.limited ? (
          <StateCard tone="error">
            <h2 className="text-2xl font-bold text-red-800">Tra cứu quá nhanh</h2>
            <p className="text-sm leading-6 text-red-800">Vui lòng thử lại sau {rateLimit.retryAfterSeconds} giây.</p>
          </StateCard>
        ) : null}

        {currentBatch && hasQuery && !rateLimit.limited && lookup && !lookup.ok ? (
          <StateCard tone="error">
            <h2 className="text-2xl font-bold text-red-800">Chưa nhận diện được mã căn</h2>
            <p className="mx-auto max-w-xl text-sm leading-6 text-red-800">{lookup.message}</p>
            <p className="mx-auto max-w-xl text-sm leading-6 text-red-800">
              Hãy thử nhập theo ví dụ: L1.115, L4B.412, LK2.10 hoặc căn 115 lô L1.
            </p>
          </StateCard>
        ) : null}

        {currentBatch && hasQuery && !rateLimit.limited && lookup?.ok && !resolvedFeeStatus && ambiguousFeeStatuses.length === 0 ? (
          <StateCard tone="error">
            <h2 className="text-2xl font-bold text-red-800">Không tìm thấy dữ liệu</h2>
            <p className="mx-auto max-w-xl text-sm leading-6 text-red-800">
              BQT chưa có dữ liệu tra cứu cho mã căn này hoặc nội dung nhập chưa đúng. Hãy kiểm tra lại mã căn rồi thử lại.
            </p>
            <Button asChild variant="secondary" className="mx-auto">
              <Link href="/">Quay lại trang chủ</Link>
            </Button>
          </StateCard>
        ) : null}

        {currentBatch && hasQuery && !rateLimit.limited && lookup?.ok && ambiguousFeeStatuses.length > 1 ? (
          <Card className="border-l-4 border-l-amber-400 bg-white/90 shadow-[0_18px_60px_rgba(25,28,28,0.12)]">
            <CardContent className="grid gap-4 p-5 md:p-7">
              <div>
                <div className="mb-2 w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800">
                  Cần chọn rõ căn
                </div>
                <h2 className="text-2xl font-bold text-amber-900">Tìm thấy nhiều căn phù hợp</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Nội dung nhập có thể là nhiều căn cùng số. Vui lòng chọn đúng hậu tố căn hộ.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {ambiguousFeeStatuses.map((status) => (
                  <Button asChild key={status.ma_can} variant="secondary" className="justify-start">
                    <Link href={`/tra-cuu-phi?ma_can=${encodeURIComponent(status.ma_can)}`}>{status.ma_can}</Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {currentBatch && resolvedFeeStatus ? (
          <Card className="border-l-4 border-l-[var(--success)] bg-white/90 shadow-[0_18px_60px_rgba(25,28,28,0.12)]">
            <CardContent className="grid gap-5 p-5 md:p-7">
              <div className="flex items-center gap-4">
                <div className="grid h-13 w-13 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--success)]">
                  <CheckCircle2 size={34} aria-hidden="true" />
                </div>
                <div>
                  <div className="mb-1 w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Tra cứu thành công
                  </div>
                  <h2 className="text-4xl font-bold leading-none text-[var(--accent)]">{resolvedFeeStatus.ma_can}</h2>
                </div>
              </div>

              <div className="grid gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Trạng thái đóng phí</span>
                <strong className="text-2xl leading-snug text-emerald-800">
                  {publicFeeDisplayText(resolvedFeeStatus.payload_public_json, resolvedFeeStatus.thang_da_dong_den_hien_tai)}
                </strong>
              </div>

              {payloadFlag(resolvedFeeStatus.payload_public_json, "isPartialPayment") ? (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm font-semibold leading-6 text-orange-800">
                  Căn này có dữ liệu đóng lẻ tiền so với mức phí chuẩn. Vui lòng liên hệ BQT nếu cần đối chiếu chi tiết.
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-[var(--line)] bg-white p-4">
                  <span className="mb-2 block text-xs font-bold uppercase text-[var(--muted)]">Kỳ dữ liệu</span>
                  <strong>{currentBatch.ky_du_lieu}</strong>
                </div>
                <div className="rounded-lg border border-[var(--line)] bg-white p-4">
                  <span className="mb-2 block text-xs font-bold uppercase text-[var(--muted)]">Chốt công khai lúc</span>
                  <strong>{formatDateTime(currentBatch.public_luc)}</strong>
                </div>
                <div className="rounded-lg border border-[var(--line)] bg-white p-4">
                  <span className="mb-2 block text-xs font-bold uppercase text-[var(--muted)]">Nguồn hiển thị</span>
                  <strong>Dữ liệu chỉ mang tính chất tham khảo - sẽ được kiểm duyệt mỗi cuối tháng</strong>
                </div>
              </div>

              <Button asChild>
                <Link href="/">Tra cứu mã khác</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
