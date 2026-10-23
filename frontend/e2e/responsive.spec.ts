import { test, expect, type Page } from "@playwright/test";
const longName = "Community hospital and emergency medicine centre with a long institution name";
const institution = { id: 1, name: longName, location_type: "Hospital", area: "A long address for checking narrow screens, Colombo, Sri Lanka", contact_number: "0111234567", latitude: 6.9271, longitude: 79.8612, is_open: true, opening_hours: "08:00 - 20:00" };
const inventory = [{ id: 1, pharmacy_name: longName, medicine: "Medicine with a long name and strength 500 mg", generic: "Long generic medicine description", category: "General medicine", stock: 30, reserved: 2, reorder_level: 10, predicted_24h: 0, status: "Healthy", risk: "Low", updated: "2026-10-23T08:00:00Z" }];

async function workspace(page: Page) {
  await page.addInitScript(() => localStorage.setItem("mediassure-token", "responsive-test-token"));
  await page.route("**/*", async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown;
    if (path === "/auth/me") body = { id: 1, name: "Staff member with a long display name", email: "averylongaccountaddress@example.test", approved: true, role: "Hospital Staff" };
    else if (path === "/inventory") body = inventory;
    else if (path === "/pharmacies/mine") body = institution;
    else if (path === "/pharmacies") body = [{ ...institution, status: "Online", open_until: institution.opening_hours, stock_health: 80, urgent_gaps: 0, last_sync: "2026-10-23T08:00:00Z" }];
    else if (path === "/pharmacies/1/stock") body = [{ id: 1, medicine: inventory[0].medicine, generic: "Generic", strength: "500 mg", available: 28, updated_at: "2026-10-23T08:00:00Z" }];
    else if (path === "/reservations") body = [{ id: "1", can_manage: true, pharmacy_name: longName, patient: "A patient with a long name", medicine: inventory[0].medicine, quantity: 2, expires_at: "2026-10-23T09:00:00Z", status: "Pending" }];
    else if (path.startsWith("/operations/")) body = [];
    else return route.continue();
    await route.fulfill({ json: body });
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Emergency Request", exact: true })).toBeVisible();
}
async function navigate(page: Page, name: string) {
  if (page.viewportSize()!.width < 1024) await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.locator("#workspace-navigation").getByRole("button", { name, exact: true }).click();
}
async function noOverflow(page: Page) {
  const widths = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.width + 1);
}

test("authentication fits small screens in English and Sinhala", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  await noOverflow(page);
  await page.getByRole("combobox", { name: "Language / \u0db7\u0dcf\u0dc2\u0dcf\u0dc0" }).selectOption("si");
  await expect(page.locator("html")).toHaveAttribute("lang", "si");
  await noOverflow(page);
});

test("workspace navigation and stock modal fit the viewport", async ({ page }) => {
  await workspace(page); await noOverflow(page);
  if (page.viewportSize()!.width < 1024) {
    const menu = page.getByRole("button", { name: "Open menu", exact: true });
    await menu.click(); await expect(page.getByRole("dialog", { name: "Navigation" })).toBeVisible();
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator("#workspace-navigation button").last()).toBeFocused();
    await page.keyboard.press("Escape"); await expect(menu).toBeFocused();
  }
  await navigate(page, "My medicine stock");
  await expect(page.getByRole("button", { name: "Add medicine", exact: true })).toBeEnabled();
  await noOverflow(page);
  if (page.viewportSize()!.width < 768) await expect(page.locator("article").filter({ has: page.getByRole("heading", { name: inventory[0].medicine, exact: true }) })).toBeVisible();
  else await expect(page.getByRole("table")).toBeVisible();
  await page.getByRole("button", { name: "Add medicine", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add medicine", exact: true });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await dialog.getByRole("button", { name: "Save stock" }).scrollIntoViewIfNeeded();
  await expect(dialog.getByRole("button", { name: "Save stock" })).toBeInViewport();
  await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible();
  await navigate(page, "Reservations"); await noOverflow(page);
  await navigate(page, "Settings"); await noOverflow(page);
});

test("map filters, controls and details do not overlap or overflow", async ({ page }) => {
  await workspace(page); await navigate(page, "Sri Lanka map");
  await expect(page.getByRole("heading", { name: "Medicine availability atlas" })).toBeVisible();
  await noOverflow(page);
  const zoom = await page.getByRole("button", { name: "Zoom in", exact: true }).boundingBox();
  const closed = await page.getByText("Closed", { exact: true }).boundingBox();
  expect(zoom).not.toBeNull(); expect(closed).not.toBeNull();
  const overlaps = zoom!.x < closed!.x + closed!.width && zoom!.x + zoom!.width > closed!.x && zoom!.y < closed!.y + closed!.height && zoom!.y + zoom!.height > closed!.y;
  expect(overlaps).toBe(false);
  await page.locator("aside button").filter({ hasText: longName }).click();
  await expect(page.getByRole("heading", { name: "Available medicines", exact: true })).toBeVisible();
  await expect(page.getByText("Available stock: 28", { exact: true })).toBeVisible();
  await noOverflow(page);
  await page.locator("header select").selectOption("si");
  await expect(page.locator("html")).toHaveAttribute("lang", "si");
  await noOverflow(page);
});
