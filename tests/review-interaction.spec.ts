import { expect, test } from "@playwright/test";
import "dotenv/config";

import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from "../src/modules/auth/session";
import { prisma } from "../src/modules/database/prisma";

const baseURL = "http://localhost:3000";

async function addAdminSession(page: import("@playwright/test").Page) {
  const account = await prisma.taiKhoanQuanTri.findFirst({
    where: { vai_tro: "SUPER_ADMIN", trang_thai: "DANG_HOAT_DONG" },
    select: { id: true, ten_dang_nhap: true, vai_tro: true },
  });
  if (!account) throw new Error("Không tìm thấy Super Admin đang hoạt động.");

  const token = await createAdminSessionToken({
    userId: account.id,
    username: account.ten_dang_nhap,
    role: account.vai_tro,
  });
  await page.context().addCookies([
    {
      name: ADMIN_SESSION_COOKIE,
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

test("chọn giao dịch giữ vị trí cuộn và form duyệt trỏ tới giao dịch kế tiếp", async ({ page }) => {
  await addAdminSession(page);
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.goto(`${baseURL}/admin/transactions/review`, { waitUntil: "networkidle" });

  const links = page.locator("a[data-testid^='review-transaction-']");
  const linkCount = await links.count();
  test.skip(linkCount <= 1, "Không có đủ hai giao dịch trong bộ lọc hiện tại.");

  const list = page.getByTestId("review-transaction-list");
  const secondLink = links.nth(Math.min(3, linkCount - 1));
  await secondLink.evaluate((element) => {
    element.scrollIntoView({ block: "center" });
  });
  await page.evaluate(() => window.scrollTo(0, 420));
  await page.waitForTimeout(100);
  const windowScrollBefore = await page.evaluate(() => window.scrollY);
  const listScrollBefore = await list.evaluate((element) => element.scrollTop);
  expect(await page.evaluate(() => sessionStorage.getItem("admin-transaction-review-list-scroll"))).toBe(
    String(listScrollBefore),
  );

  const secondHref = await secondLink.getAttribute("href");
  if (!secondHref) throw new Error("Khong tim thay duong dan giao dich thu hai.");
  await secondLink.click();
  await expect(page).toHaveURL(new URL(secondHref, baseURL).toString(), { timeout: 15000 });
  await page.waitForTimeout(250);

  const windowScrollAfter = await page.evaluate(() => window.scrollY);
  const listScrollAfter = await list.evaluate((element) => element.scrollTop);
  expect(await page.evaluate(() => sessionStorage.getItem("admin-transaction-review-list-navigation-scroll"))).toBe(
    String(listScrollBefore),
  );
  expect(Math.abs(windowScrollAfter - windowScrollBefore)).toBeLessThanOrEqual(80);
  expect(Math.abs(listScrollAfter - listScrollBefore)).toBeLessThanOrEqual(30);

  const returnTo = await page.locator('form[action] input[name="returnTo"]').first().getAttribute("value");
  expect(returnTo).toContain("/admin/transactions/review?");
  expect(returnTo).toContain("transactionId=");
  const selectedTransactionId = new URL(secondHref, baseURL).searchParams.get("transactionId");
  expect(new URL(returnTo || "", baseURL).searchParams.get("transactionId")).not.toBe(selectedTransactionId);
});

test("giao dịch nhiều căn hiển thị đủ toàn bộ dòng phân bổ", async ({ page }) => {
  const transaction = await prisma.giaoDichNganHang.findFirst({
    where: {
      trang_thai_duyet: { in: ["CHUA_DUYET", "DA_RA_SOAT"] },
      trang_thai_khop: "NHIEU_CAN",
      ung_vien_khop: { some: {} },
    },
    orderBy: { id: "desc" },
    select: {
      id: true,
      so_tien: true,
      lo_nhap_du_lieu_id: true,
      ung_vien_khop: { select: { ma_can: true } },
    },
  });
  const expectedCodes = Array.from(new Set(transaction?.ung_vien_khop.map((item) => item.ma_can) || []));
  test.skip(!transaction || expectedCodes.length <= 6, "Không có giao dịch nhiều hơn 6 căn để kiểm tra.");

  await addAdminSession(page);
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.goto(
    `${baseURL}/admin/transactions/review?transactionId=${transaction!.id}&batchId=${transaction!.lo_nhap_du_lieu_id}&status=TAT_CA&from=`,
    { waitUntil: "networkidle" },
  );

  const form = page.getByTestId("multi-allocation-form");
  await expect(form.getByTestId("multi-allocation-row")).toHaveCount(expectedCodes.length);

  const amounts = await form.locator('input[name="allocationAmount"]').evaluateAll((inputs) =>
    inputs.map((input) => Number((input as HTMLInputElement).value || 0)),
  );
  expect(amounts.reduce((sum, amount) => sum + amount, 0)).toBe(Number(transaction!.so_tien));
});

test("không hiển thị lại form duyệt của giao dịch đã hoàn tất trong bộ lọc cần xử lý", async ({ page }) => {
  const approved = await prisma.giaoDichNganHang.findFirst({
    where: { trang_thai_duyet: "DA_DUYET" },
    orderBy: { id: "desc" },
    select: { id: true },
  });
  test.skip(!approved, "Không có giao dịch đã duyệt để kiểm tra.");

  await addAdminSession(page);
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.goto(`${baseURL}/admin/transactions/review?transactionId=${approved!.id}&status=CAN_XU_LY`, {
    waitUntil: "networkidle",
  });

  await expect(page.getByText(`Giao dịch #${approved!.id}`, { exact: true })).toHaveCount(0);

  await page.goto(`${baseURL}/admin/transactions/review?transactionId=${approved!.id}&status=TAT_CA&from=`, {
    waitUntil: "networkidle",
  });
  await expect(page.getByText(`Giao dịch #${approved!.id}`, { exact: true })).toBeVisible();
  await expect(page.getByText("Giao dịch đã hoàn tất xử lý và chỉ còn ở chế độ xem.")).toBeVisible();
  await expect(page.getByTestId("multi-allocation-form")).toHaveCount(0);
});

test("tìm được giao dịch theo mã căn đã duyệt thủ công dù nội dung gốc không có mã căn", async ({ page }) => {
  const transaction = await prisma.giaoDichNganHang.findFirst({
    where: {
      trang_thai_duyet: "DA_DUYET",
      ma_can_duoc_chon: { not: null },
    },
    orderBy: { id: "desc" },
    select: {
      id: true,
      ma_can_duoc_chon: true,
      noi_dung_goc: true,
    },
  });
  test.skip(!transaction?.ma_can_duoc_chon, "Không có giao dịch duyệt thủ công để kiểm tra.");

  const apartmentCode = transaction!.ma_can_duoc_chon!.split(",")[0].trim();
  test.skip(
    transaction!.noi_dung_goc.toUpperCase().includes(apartmentCode.toUpperCase()),
    "Giao dịch mẫu đã có sẵn mã căn trong nội dung gốc.",
  );

  await addAdminSession(page);
  await page.goto(
    `${baseURL}/admin/transactions/review?status=TAT_CA&q=${encodeURIComponent(apartmentCode)}`,
    { waitUntil: "networkidle" },
  );

  await expect(page.getByText(`Giao dịch #${transaction!.id}`, { exact: true })).toBeVisible();
  await expect(page.locator('input[name="q"]:not([type="hidden"])')).toHaveValue(apartmentCode);
});

test("form phân bổ cho phép tạo động ít nhất 8 căn và chia đủ tổng giao dịch", async ({ page }) => {
  const [transaction, apartments] = await Promise.all([
    prisma.giaoDichNganHang.findFirst({
      where: { trang_thai_duyet: { in: ["CHUA_DUYET", "DA_RA_SOAT"] } },
      orderBy: { id: "desc" },
      select: { id: true, so_tien: true, lo_nhap_du_lieu_id: true },
    }),
    prisma.canHo.findMany({
      orderBy: { ma_can: "asc" },
      take: 8,
      select: { ma_can: true },
    }),
  ]);
  test.skip(!transaction || apartments.length < 8, "Không có đủ dữ liệu để kiểm tra phân bổ động.");

  await addAdminSession(page);
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.goto(
    `${baseURL}/admin/transactions/review?transactionId=${transaction!.id}&batchId=${transaction!.lo_nhap_du_lieu_id}&status=TAT_CA&from=`,
    { waitUntil: "networkidle" },
  );

  const form = page.getByTestId("multi-allocation-form");
  await form.locator("xpath=..").locator("summary").click();
  await form.getByPlaceholder(/Ví dụ:/).fill(apartments.map((item) => item.ma_can).join("\n"));
  await form.getByRole("button", { name: "Tạo danh sách" }).click();

  await expect(form.getByTestId("multi-allocation-row")).toHaveCount(8);
  const amounts = await form.locator('input[name="allocationAmount"]').evaluateAll((inputs) =>
    inputs.map((input) => Number((input as HTMLInputElement).value || 0)),
  );
  expect(amounts.reduce((sum, amount) => sum + amount, 0)).toBe(Number(transaction!.so_tien));
});

test("đối soát tháng hiển thị toàn bộ dòng trong khung cuộn và sắp xếp theo tiêu đề", async ({ page }) => {
  await addAdminSession(page);
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.goto(`${baseURL}/admin/transactions/review?monthSort=date&monthDir=desc`, { waitUntil: "networkidle" });

  const scrollArea = page.getByTestId("monthly-reconciliation-scroll");
  await expect(scrollArea).toBeVisible();
  const rows = scrollArea.locator("a[href*='transactionId=']");
  const rowCount = await rows.count();
  test.skip(rowCount <= 12, "Tháng hiện tại không có hơn 12 dòng để kiểm tra cuộn.");

  const overflow = await scrollArea.evaluate((element) => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  }));
  expect(overflow.scrollHeight).toBeGreaterThan(overflow.clientHeight);

  await scrollArea.getByRole("link", { name: /^Căn/ }).click();
  await expect(page).toHaveURL(/monthSort=apartment/);
  await expect(page).toHaveURL(/monthDir=asc/);
  await expect(page.getByTestId("monthly-reconciliation-scroll")).toBeVisible();
});
