import Link from "next/link";

import { logoutAction } from "@/app/admin/actions";
import { requireAdmin } from "@/src/modules/auth/current-user";
import { getApartmentDashboardData } from "@/src/modules/apartments/dashboard";

type DashboardPageProps = {
  searchParams?: Promise<{
    ma_can?: string;
  }>;
};

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "-";
}

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" ? value.toLocaleString("vi-VN") : "-";
}

function compactText(value: string | null | undefined) {
  return value && value.trim() ? value : "-";
}

export default async function AdminDashboardPage({ searchParams }: DashboardPageProps) {
  const account = await requireAdmin();
  const params = await searchParams;
  const data = await getApartmentDashboardData(params?.ma_can || "");
  const selected = data.search.selectedApartment;

  return (
    <main className="page-shell admin-shell">
      <section className="panel admin-header">
        <div>
          <p className="eyebrow">MANAGER</p>
          <h1>Dashboard quản lý</h1>
          <p className="hero-copy">
            Tài khoản {account.ten_hien_thi || account.ten_dang_nhap} có thể tra cứu căn, trạng
            thái phí public và dữ liệu contact nội bộ.
          </p>
        </div>
        <div className="admin-actions">
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

      <section className="admin-kpi-grid">
        <div className="admin-kpi">
          <span>Tổng căn</span>
          <strong>{formatNumber(data.summary.totalApartments)}</strong>
          <p>
            {data.summary.apartmentTypes
              .map((item) => `${item.type}: ${formatNumber(item.count)}`)
              .join(" · ")}
          </p>
        </div>
        <div className="admin-kpi">
          <span>Contact cần xử lý</span>
          <strong>{formatNumber(data.summary.contactReviewCount)}</strong>
          <p>Candidate chưa duyệt hoặc cần rà soát.</p>
        </div>
        <div className="admin-kpi">
          <span>Contact master</span>
          <strong>{formatNumber(data.summary.approvedContactCount)}</strong>
          <p>Liên hệ đã vào bảng chính thức.</p>
        </div>
        <div className="admin-kpi">
          <span>Batch public</span>
          <strong>{data.summary.currentBatch?.ky_du_lieu || "-"}</strong>
          <p>
            {data.summary.currentBatch
              ? `${formatNumber(data.summary.currentBatch.tong_so_can)} căn · ${formatDateTime(
                  data.summary.currentBatch.public_luc
                )}`
              : "Chưa có batch public hiện hành."}
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Tra cứu nội bộ</p>
            <h2>Tìm căn hộ</h2>
            <p className="hero-copy">
              Nhập mã căn hoặc các biến thể như `L1 115`, `can 124 lo 4b`, `124lo4b`.
            </p>
          </div>
          <form className="admin-search-form" action="/admin/dashboard">
            <input
              className="search-input"
              defaultValue={data.search.query}
              maxLength={80}
              name="ma_can"
              placeholder="Nhập mã căn"
            />
            <button className="primary-button" type="submit">
              Tìm
            </button>
          </form>
        </div>

        {data.search.parseMessage ? (
          <div className="error-banner">{data.search.parseMessage}</div>
        ) : null}

        {data.search.query ? (
          <div className="table-wrap compact-table-wrap">
            <table className="review-table admin-dashboard-table">
              <thead>
                <tr>
                  <th>Mã căn</th>
                  <th>Loại</th>
                  <th>Lô</th>
                  <th>Số</th>
                  <th>Chủ hộ gốc</th>
                  <th>Trạng thái gốc</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {data.search.results.length ? (
                  data.search.results.map((apartment) => (
                    <tr key={apartment.id}>
                      <td>
                        <strong>{apartment.ma_can}</strong>
                      </td>
                      <td>{apartment.loai_can}</td>
                      <td>{apartment.ma_lo}</td>
                      <td>{apartment.ma_so}</td>
                      <td>{compactText(apartment.chu_ho_ten_goc)}</td>
                      <td>
                        {compactText(apartment.trang_thai_su_dung_goc)} /{" "}
                        {compactText(apartment.tinh_trang_goc)}
                      </td>
                      <td>
                        <Link
                          className="secondary-button compact-button"
                          href={`/admin/dashboard?ma_can=${encodeURIComponent(apartment.ma_can)}`}
                        >
                          Xem
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="empty-state" colSpan={7}>
                      Không tìm thấy căn phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {selected ? (
        <>
          <section className="panel">
            <p className="eyebrow">Hồ sơ căn</p>
            <h2>{selected.ma_can}</h2>
            <div className="admin-detail-grid">
              <div>
                <span>Loại căn</span>
                <strong>{selected.loai_can}</strong>
              </div>
              <div>
                <span>Diện tích</span>
                <strong>{selected.dien_tich_m2 ? `${selected.dien_tich_m2} m2` : "-"}</strong>
              </div>
              <div>
                <span>Chủ hộ gốc</span>
                <strong>{compactText(selected.chu_ho_ten_goc)}</strong>
              </div>
              <div>
                <span>Tình trạng</span>
                <strong>{compactText(selected.tinh_trang_goc)}</strong>
              </div>
              <div>
                <span>Trạng thái sử dụng</span>
                <strong>{compactText(selected.trang_thai_su_dung_goc)}</strong>
              </div>
              <div>
                <span>Trạng thái hệ thống</span>
                <strong>{selected.trang_thai}</strong>
              </div>
            </div>
          </section>

          <section className="panel">
            <p className="eyebrow">Phí public hiện hành</p>
            <h2>{selected.currentFeeStatus?.display_text || "Chưa có trạng thái phí public"}</h2>
            {selected.currentFeeStatus ? (
              <div className="admin-detail-grid">
                <div>
                  <span>Kỳ dữ liệu</span>
                  <strong>{selected.currentFeeStatus.ky_du_lieu}</strong>
                </div>
                <div>
                  <span>Tháng đã đóng</span>
                  <strong>{compactText(selected.currentFeeStatus.thang_da_dong_den_hien_tai)}</strong>
                </div>
                <div>
                  <span>Batch</span>
                  <strong>#{selected.currentFeeStatus.batch.id}</strong>
                </div>
                <div>
                  <span>Public lúc</span>
                  <strong>{formatDateTime(selected.currentFeeStatus.batch.public_luc)}</strong>
                </div>
              </div>
            ) : null}
          </section>

          <section className="panel">
            <p className="eyebrow">Contact master</p>
            <h2>Liên hệ đã duyệt</h2>
            <div className="table-wrap compact-table-wrap">
              <table className="review-table admin-dashboard-table">
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>SĐT</th>
                    <th>Vai trò</th>
                    <th>Chính</th>
                    <th>Nhận TB</th>
                    <th>Trạng thái</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.lien_he.length ? (
                    selected.lien_he.map((contact) => (
                      <tr key={contact.id}>
                        <td>{contact.ten_hien_thi}</td>
                        <td>{compactText(contact.so_dien_thoai)}</td>
                        <td>{compactText(contact.vai_tro_lien_he)}</td>
                        <td>{contact.la_lien_he_chinh ? "Có" : "Không"}</td>
                        <td>{contact.nhan_thong_bao ? "Có" : "Không"}</td>
                        <td>{contact.trang_thai_lien_he}</td>
                        <td>{compactText(contact.ghi_chu)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="empty-state" colSpan={7}>
                        Chưa có contact master. Xem candidate bên dưới.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <p className="eyebrow">Contact staging</p>
            <h2>Candidate và ghi chú gốc</h2>
            <div className="table-wrap">
              <table className="review-table admin-contact-table">
                <thead>
                  <tr>
                    <th>Parse tên/SĐT</th>
                    <th>Gốc Excel</th>
                    <th>Review</th>
                    <th>Cờ</th>
                    <th>Ghi chú nghiệp vụ</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.contactCandidates.length ? (
                    selected.contactCandidates.map((candidate) => (
                      <tr key={candidate.id}>
                        <td>
                          <strong>{compactText(candidate.ten_hien_thi_parse)}</strong>
                          <br />
                          {compactText(candidate.so_dien_thoai_parse)}
                        </td>
                        <td>
                          <strong>{compactText(candidate.ten_chu_ho_goc)}</strong>
                          <br />
                          {compactText(candidate.ten_nguoi_su_dung_goc)}
                          <br />
                          {compactText(candidate.so_dien_thoai_goc)}
                          <br />
                          <span className="muted">{compactText(candidate.thong_tin_phu_goc)}</span>
                        </td>
                        <td>
                          {candidate.trang_thai_duyet}
                          <br />
                          {candidate.co_can_ra_soat ? "Cần rà soát" : "Tương đối sạch"}
                          <br />
                          <span className="muted">{compactText(candidate.ly_do_ra_soat)}</span>
                        </td>
                        <td>{candidate.flags.length ? candidate.flags.join(", ") : "-"}</td>
                        <td>{compactText(candidate.ghi_chu_nghiep_vu || candidate.ghi_chu_goc)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="empty-state" colSpan={5}>
                        Không có contact candidate cho căn này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      <section className="panel">
        <p className="eyebrow">Import gần đây</p>
        <h2>Lịch sử nhập dữ liệu</h2>
        <div className="table-wrap compact-table-wrap">
          <table className="review-table admin-dashboard-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Loại nguồn</th>
                <th>Tên file</th>
                <th>Số dòng</th>
                <th>Trạng thái</th>
                <th>Thời điểm</th>
              </tr>
            </thead>
            <tbody>
              {data.latestImports.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>{item.loai_nguon}</td>
                  <td>{item.ten_file}</td>
                  <td>{formatNumber(item.so_dong)}</td>
                  <td>{item.trang_thai}</td>
                  <td>{formatDateTime(item.thoi_diem_nhap)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
