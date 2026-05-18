import Link from "next/link";

import { logoutAction } from "@/app/admin/actions";
import { approveContactAction, rejectContactAction } from "@/app/admin/contacts/review/actions";
import { requireAdmin } from "@/src/modules/auth/current-user";
import {
  getContactReviewData,
  isContactReviewStatus,
  type ContactReviewNeedsFilter,
} from "@/src/modules/contacts/review";

type ContactReviewPageProps = {
  searchParams?: Promise<{
    ma_can?: string;
    status?: string;
    needs?: string;
    page?: string;
    approved?: string;
    rejected?: string;
    error?: string;
  }>;
};

const ROLE_OPTIONS = [
  "CHU_HO",
  "CHU_MOI",
  "CHU_CU",
  "KHACH_THUE",
  "NGUOI_THAN",
  "NGUOI_NHAN_THONG_BAO",
  "DONG_HO",
  "MOI_GIOI",
  "KHAC",
] as const;

function text(value: string | null | undefined) {
  return value && value.trim() ? value : "-";
}

function getNeedsFilter(value: string | undefined): ContactReviewNeedsFilter {
  if (value === "NEEDS_REVIEW" || value === "CLEAN") {
    return value;
  }
  return "ALL";
}

function statusMessage(params: Awaited<ContactReviewPageProps["searchParams"]>) {
  if (params?.approved === "1") return "Đã duyệt candidate và tạo/cập nhật contact master.";
  if (params?.rejected === "1") return "Đã từ chối contact candidate.";
  if (params?.error === "1") return "Không xử lý được candidate. Kiểm tra lại dữ liệu đầu vào.";
  return null;
}

export default async function ContactReviewPage({ searchParams }: ContactReviewPageProps) {
  const account = await requireAdmin();
  const params = await searchParams;
  const status = params?.status && isContactReviewStatus(params.status) ? params.status : "CHUA_DUYET";
  const needs = getNeedsFilter(params?.needs);
  const page = Number(params?.page || "1");
  const data = await getContactReviewData({
    maCan: params?.ma_can,
    status,
    needs,
    page,
  });
  const message = statusMessage(params);

  return (
    <main className="page-shell admin-shell">
      <section className="panel admin-header">
        <div>
          <p className="eyebrow">Contact review</p>
          <h1>Duyệt liên hệ căn hộ</h1>
          <p className="hero-copy">
            Đăng nhập bằng {account.ten_hien_thi || account.ten_dang_nhap}. Dữ liệu gốc được giữ
            trong staging, chỉ candidate đã duyệt mới tạo contact master.
          </p>
        </div>
        <div className="admin-actions">
          <Link className="secondary-button" href="/admin/dashboard">
            Dashboard
          </Link>
          <Link className="secondary-button" href="/admin">
            Về admin
          </Link>
          <form action={logoutAction}>
            <button className="secondary-button" type="submit">
              Đăng xuất
            </button>
          </form>
        </div>
      </section>

      {message ? (
        <div className={params?.error === "1" ? "error-banner" : "status-banner"}>{message}</div>
      ) : null}

      <section className="admin-kpi-grid">
        <div className="admin-kpi">
          <span>Tổng theo bộ lọc</span>
          <strong>{data.pagination.total.toLocaleString("vi-VN")}</strong>
          <p>
            Trang {data.pagination.page}/{data.pagination.pageCount}
          </p>
        </div>
        {data.summary.statusCounts.map((item) => (
          <div className="admin-kpi" key={item.status}>
            <span>{item.status}</span>
            <strong>{item.count.toLocaleString("vi-VN")}</strong>
            <p>Trạng thái duyệt candidate.</p>
          </div>
        ))}
        {data.summary.reviewCounts.map((item) => (
          <div className="admin-kpi" key={String(item.needsReview)}>
            <span>{item.needsReview ? "Cần rà soát" : "Tương đối sạch"}</span>
            <strong>{item.count.toLocaleString("vi-VN")}</strong>
            <p>Phân loại chất lượng dữ liệu.</p>
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Bộ lọc</p>
            <h2>Danh sách candidate</h2>
          </div>
          <form className="contact-filter-form" action="/admin/contacts/review">
            <input
              className="search-input"
              defaultValue={data.filters.maCan}
              maxLength={80}
              name="ma_can"
              placeholder="Lọc theo mã căn"
            />
            <select className="select-input" defaultValue={data.filters.status} name="status">
              <option value="ALL">Tất cả trạng thái</option>
              <option value="CHUA_DUYET">Chưa duyệt</option>
              <option value="DA_DUYET">Đã duyệt</option>
              <option value="TU_CHOI">Từ chối</option>
            </select>
            <select className="select-input" defaultValue={data.filters.needs} name="needs">
              <option value="ALL">Tất cả chất lượng</option>
              <option value="NEEDS_REVIEW">Cần rà soát</option>
              <option value="CLEAN">Tương đối sạch</option>
            </select>
            <button className="primary-button" type="submit">
              Lọc
            </button>
          </form>
        </div>

        <div className="table-wrap contact-review-wrap">
          <table className="review-table contact-review-table">
            <thead>
              <tr>
                <th>Căn</th>
                <th>Dữ liệu gốc</th>
                <th>Parse đề xuất</th>
                <th>Rà soát</th>
                <th>Duyệt vào contact master</th>
                <th>Từ chối</th>
              </tr>
            </thead>
            <tbody>
              {data.candidates.length ? (
                data.candidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td>
                      <strong>{text(candidate.ma_can)}</strong>
                      <br />
                      <span className="muted">#{candidate.id}</span>
                      <br />
                      {candidate.trang_thai_duyet}
                    </td>
                    <td>
                      <strong>{text(candidate.ten_chu_ho_goc)}</strong>
                      <br />
                      Người sử dụng: {text(candidate.ten_nguoi_su_dung_goc)}
                      <br />
                      SĐT gốc: {text(candidate.so_dien_thoai_goc)}
                      <br />
                      <span className="muted">{text(candidate.thong_tin_phu_goc)}</span>
                      <br />
                      <span className="muted">{text(candidate.ghi_chu_goc)}</span>
                    </td>
                    <td>
                      <strong>{text(candidate.ten_hien_thi_parse)}</strong>
                      <br />
                      {text(candidate.so_dien_thoai_parse)}
                      <br />
                      Vai trò: {text(candidate.vai_tro_du_doan)}
                      <br />
                      Chính: {candidate.la_lien_he_chinh_du_doan ? "Có" : "Không"}
                    </td>
                    <td>
                      {candidate.co_can_ra_soat ? "Cần rà soát" : "Tương đối sạch"}
                      <br />
                      <span className="muted">{text(candidate.ly_do_ra_soat)}</span>
                      <br />
                      Flags: {candidate.flags.length ? candidate.flags.join(", ") : "-"}
                      <br />
                      <span className="muted">{text(candidate.ghi_chu_nghiep_vu)}</span>
                    </td>
                    <td>
                      <form action={approveContactAction} className="contact-review-form">
                        <input name="candidateId" type="hidden" value={candidate.id} />
                        <label>
                          Tên hiển thị
                          <input
                            name="displayName"
                            required
                            defaultValue={
                              candidate.ten_hien_thi_parse ||
                              candidate.ten_nguoi_su_dung_goc ||
                              candidate.ten_chu_ho_goc ||
                              ""
                            }
                          />
                        </label>
                        <label>
                          Số điện thoại
                          <input
                            name="phoneNumber"
                            defaultValue={candidate.so_dien_thoai_parse || candidate.so_dien_thoai_goc || ""}
                          />
                        </label>
                        <label>
                          Vai trò
                          <select name="role" defaultValue={candidate.vai_tro_du_doan || "KHAC"}>
                            {ROLE_OPTIONS.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="toggle-inline">
                          <input
                            name="isPrimary"
                            type="checkbox"
                            defaultChecked={candidate.la_lien_he_chinh_du_doan}
                          />
                          Liên hệ chính
                        </label>
                        <label className="toggle-inline">
                          <input
                            name="receivesNotification"
                            type="checkbox"
                            defaultChecked={candidate.nhan_thong_bao_du_doan ?? true}
                          />
                          Nhận thông báo
                        </label>
                        <label>
                          Ghi chú duyệt
                          <input name="note" defaultValue={candidate.ghi_chu_duyet || ""} />
                        </label>
                        <button className="primary-button compact-button" type="submit">
                          Duyệt
                        </button>
                      </form>
                    </td>
                    <td>
                      <form action={rejectContactAction} className="contact-review-form">
                        <input name="candidateId" type="hidden" value={candidate.id} />
                        <label>
                          Lý do từ chối
                          <input name="rejectNote" defaultValue={candidate.ghi_chu_duyet || ""} />
                        </label>
                        <button className="secondary-button compact-button" type="submit">
                          Từ chối
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty-state" colSpan={6}>
                    Không có candidate theo bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-bar">
          <span className="pagination-meta">
            {data.pagination.total.toLocaleString("vi-VN")} candidate
          </span>
          <div className="pagination-actions">
            <Link
              className="secondary-button compact-button"
              href={`/admin/contacts/review?ma_can=${encodeURIComponent(data.filters.maCan)}&status=${data.filters.status}&needs=${data.filters.needs}&page=${Math.max(1, data.pagination.page - 1)}`}
            >
              Trước
            </Link>
            <Link
              className="secondary-button compact-button"
              href={`/admin/contacts/review?ma_can=${encodeURIComponent(data.filters.maCan)}&status=${data.filters.status}&needs=${data.filters.needs}&page=${Math.min(data.pagination.pageCount, data.pagination.page + 1)}`}
            >
              Sau
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
