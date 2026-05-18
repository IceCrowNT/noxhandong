import { headers } from "next/headers";
import Link from "next/link";

import { prisma } from "@/src/modules/database";
import {
  parsePublicLookupInput,
  PUBLIC_LOOKUP_MAX_LENGTH,
  publicFeeDisplayText,
} from "@/src/modules/billing/fee-status";

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
  if (!value) {
    return "-";
  }

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
  if (!payload || typeof payload !== "object") {
    return false;
  }

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
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
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

  return (
    <main className="public-fee-shell">
      <header className="resident-public-header">
        <Link className="resident-brand" href="/">
          <span className="resident-brand-mark" aria-hidden="true">
            AD
          </span>
          <span>BQT An Đồng</span>
        </Link>
        <Link className="admin-login-link" href="/admin/login">
          Quản trị
        </Link>
      </header>

      <section className="public-fee-hero">
        <div>
          <p className="resident-chip">Tra cứu cho cư dân</p>
          <h1>Kiểm tra phí quản lý căn hộ</h1>
          <p className="hero-copy">
            Nhập mã căn để xem căn hộ đã đóng phí đến tháng nào. Trang này chỉ hiển thị
            trạng thái phí đã được BQT xác nhận, không hiển thị thông tin cá nhân cư dân.
          </p>
        </div>
        <form className="public-fee-form" action="/tra-cuu-phi">
          <label className="upload-field">
            Mã căn
            <input
              aria-label="Nhập mã căn hộ cần tra cứu"
              name="ma_can"
              placeholder="Ví dụ: L1.115 hoặc căn 115 lô L1"
              defaultValue={rawApartmentCode}
              autoComplete="off"
              maxLength={PUBLIC_LOOKUP_MAX_LENGTH}
              inputMode="text"
            />
          </label>
          <button className="primary-button" type="submit">
            Tra cứu
          </button>
        </form>
      </section>

      <section className="public-fee-result">
        {!currentBatch ? (
          <div className="resident-state-card resident-state-card-muted">
            <h2>Chưa có dữ liệu tra cứu</h2>
            <p>BQT chưa xác nhận dữ liệu phí mới nhất để cư dân tra cứu. Vui lòng quay lại sau.</p>
          </div>
        ) : null}

        {currentBatch && !hasQuery ? (
          <div className="resident-state-card resident-state-card-muted">
            <h2>Nhập mã căn để tra cứu</h2>
            <p>Ví dụ: L1.115, L4B.412, LK2.10 hoặc căn 115 lô L1.</p>
          </div>
        ) : null}

        {currentBatch && hasQuery && rateLimit.limited ? (
          <div className="resident-state-card resident-state-card-error">
            <h2>Tra cứu quá nhanh</h2>
            <p>Vui lòng thử lại sau {rateLimit.retryAfterSeconds} giây.</p>
          </div>
        ) : null}

        {currentBatch && hasQuery && !rateLimit.limited && lookup && !lookup.ok ? (
          <div className="resident-state-card resident-state-card-error">
            <h2>Chưa nhận diện được mã căn</h2>
            <p>{lookup.message}</p>
            <p>Hãy thử nhập theo ví dụ: L1.115, L4B.412, LK2.10 hoặc căn 115 lô L1.</p>
          </div>
        ) : null}

        {currentBatch && hasQuery && !rateLimit.limited && lookup?.ok && !feeStatus ? (
          <div className="resident-state-card resident-state-card-error">
            <h2>Không tìm thấy dữ liệu</h2>
            <p>
              BQT chưa có dữ liệu tra cứu cho mã căn này hoặc nội dung nhập chưa đúng. Hãy
              kiểm tra lại mã căn rồi thử lại.
            </p>
            <Link className="secondary-button" href="/">
              Quay lại trang chủ
            </Link>
          </div>
        ) : null}

        {currentBatch && feeStatus ? (
          <div className="public-fee-result-card">
            <div className="public-fee-result-head">
              <span className="resident-success-mark" aria-hidden="true">
                ✓
              </span>
              <div>
                <p className="resident-chip resident-chip-success">Tra cứu thành công</p>
                <h2>{feeStatus.ma_can}</h2>
              </div>
            </div>

            <div className="public-fee-status-box">
              <span>Trạng thái đóng phí</span>
              <strong>
                {publicFeeDisplayText(
                  feeStatus.payload_public_json,
                  feeStatus.thang_da_dong_den_hien_tai,
                )}
              </strong>
            </div>

            {payloadFlag(feeStatus.payload_public_json, "isPartialPayment") ? (
              <div className="resident-warning-note">
                Căn này có dữ liệu đóng lẻ tiền so với mức phí chuẩn. Vui lòng liên hệ BQT nếu
                cần đối chiếu chi tiết.
              </div>
            ) : null}

            <div className="public-fee-meta-grid">
              <div>
                <span>Kỳ dữ liệu</span>
                <strong>{currentBatch.ky_du_lieu}</strong>
              </div>
              <div>
                <span>Chốt công khai lúc</span>
                <strong>{formatDateTime(currentBatch.public_luc)}</strong>
              </div>
              <div>
                <span>Nguồn hiển thị</span>
                <strong>Dữ liệu đã được BQT xác nhận</strong>
              </div>
            </div>

            <Link className="primary-button public-fee-repeat-button" href="/">
              Tra cứu mã khác
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
