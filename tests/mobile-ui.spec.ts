import { test, expect, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3000";

const mobileDevices = [
  { name: "iPhone SE 3", width: 375, height: 667, deviceScaleFactor: 2, userAgent: devices["iPhone SE"].userAgent },
  { name: "iPhone 13", width: 390, height: 844, deviceScaleFactor: 3, userAgent: devices["iPhone 13"].userAgent },
  { name: "iPhone 14 Pro", width: 393, height: 852, deviceScaleFactor: 3, userAgent: devices["iPhone 14 Pro"].userAgent },
  { name: "iPhone 15 Pro Max", width: 430, height: 932, deviceScaleFactor: 3, userAgent: devices["iPhone 15 Pro Max"].userAgent },
  { name: "Pixel 5", width: 393, height: 851, deviceScaleFactor: 2.75, userAgent: devices["Pixel 5"].userAgent },
  { name: "Pixel 7", width: 412, height: 915, deviceScaleFactor: 2.625, userAgent: devices["Pixel 7"].userAgent },
  { name: "Galaxy S9+", width: 320, height: 658, deviceScaleFactor: 4.5, userAgent: devices["Galaxy S9+"].userAgent },
  { name: "Galaxy S24", width: 360, height: 780, deviceScaleFactor: 3, userAgent: devices["Galaxy S24"].userAgent },
  { name: "Galaxy S24 Ultra", width: 384, height: 854, deviceScaleFactor: 3.5, userAgent: devices["Galaxy S24"].userAgent },
  { name: "Galaxy Z Fold 5 folded", width: 344, height: 882, deviceScaleFactor: 3, userAgent: devices["Galaxy A55"].userAgent }
] as const;

const publicRoutes = [
  { name: "home", path: "/", requiredText: "Tra cứu" },
  { name: "lookup-result", path: "/tra-cuu-phi?ma_can=L1.115", requiredText: "Tra cứu" },
  { name: "admin-login", path: "/admin/login", requiredText: "Đăng nhập" }
] as const;

const adminRoutes = [
  { name: "admin-home", path: "/admin", requiredText: "Vùng quản trị" },
  { name: "admin-dashboard", path: "/admin/dashboard", requiredText: "Tra cứu nội bộ" },
  { name: "admin-import", path: "/admin/import", requiredText: "Nhập" },
  { name: "admin-contacts", path: "/admin/contacts/review", requiredText: "Liên hệ" },
  { name: "admin-accounts", path: "/admin/accounts", requiredText: "Tài khoản" }
] as const;

function safeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function assertMobileLayout(page: import("@playwright/test").Page, requiredText: string) {
  await expect(page.locator("body")).toContainText(requiredText, { timeout: 15000 });
  await expect(page.locator("text=Runtime Error")).toHaveCount(0);
  await expect(page.locator("text=Unhandled Runtime Error")).toHaveCount(0);
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return {
      clientWidth: doc.clientWidth,
      scrollWidth: Math.max(doc.scrollWidth, body.scrollWidth),
      bodyTextLength: body.innerText.trim().length
    };
  });
  expect(metrics.bodyTextLength).toBeGreaterThan(20);
  expect(metrics.scrollWidth - metrics.clientWidth).toBeLessThanOrEqual(2);
}

async function login(page: import("@playwright/test").Page) {
  await page.goto(`${baseURL}/admin/login`, { waitUntil: "networkidle" });
  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill("Admin@123");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/admin(?:\?|$)/, { timeout: 15000 });
}

for (const device of mobileDevices) {
  test.describe(device.name, () => {
    test.use({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: device.deviceScaleFactor,
      hasTouch: true,
      isMobile: true,
      userAgent: device.userAgent
    });

    for (const route of publicRoutes) {
      test(`${route.name} has no page-level mobile overflow`, async ({ page }, testInfo) => {
        await page.goto(`${baseURL}${route.path}`, { waitUntil: "networkidle" });
        await assertMobileLayout(page, route.requiredText);
        await page.screenshot({
          fullPage: true,
          path: `.local/mobile-ui-audit/${safeName(device.name)}-${route.name}.png`
        });
        testInfo.annotations.push({ type: "viewport", description: `${device.width}x${device.height}` });
      });
    }

    test("authenticated admin routes have no page-level mobile overflow", async ({ page }, testInfo) => {
      await login(page);
      for (const route of adminRoutes) {
        await page.goto(`${baseURL}${route.path}`, { waitUntil: "networkidle" });
        await assertMobileLayout(page, route.requiredText);
        await page.screenshot({
          fullPage: true,
          path: `.local/mobile-ui-audit/${safeName(device.name)}-${route.name}.png`
        });
      }
      testInfo.annotations.push({ type: "viewport", description: `${device.width}x${device.height}` });
    });
  });
}
