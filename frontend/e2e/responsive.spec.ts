import { test, expect, type Page } from "@playwright/test";
const longName = "Community hospital and emergency medicine centre with a long institution name";
const institution = { id: 1, name: longName, location_type: "Hospital", area: "A long address for checking narrow screens, Colombo, Sri Lanka", contact_number: "0111234567", latitude: 6.9271, longitude: 79.8612, is_open: true, opening_hours: "08:00 - 20:00" };
const inventory = [{ id: 1, pharmacy_name: longName, medicine: "Medicine with a long name and strength 500 mg", generic: "Long generic medicine description", category: "General medicine", stock: 30, reserved: 2, reorder_level: 10, predicted_24h: 0, status: "Healthy", risk: "Low", updated: "2026-10-23T08:00:00Z" }];

async function workspace(page: Page, role: "Patient" | "Pharmacist" | "Hospital Staff" | "Admin" = "Hospital Staff") {
  await page.addInitScript(() => localStorage.setItem("mediassure-token", "responsive-test-token"));
  await page.route("**/*", async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown;
    if (path === "/auth/me") body = { id: 1, name: "Staff member with a long display name", email: "averylongaccountaddress@example.test", approved: true, role };
    else if (path === "/dashboard/summary") body = { active_medicines: 1, low_stock_risk: 0, pending_reservations: 1, transfer_suggestions: 0, api_mode: "database" };
    else if (path === "/medicines/search") body = [{ id: 1, name: "Panadol", strength: "500 mg" }];
    else if (path === "/pharmacies/recommendations") body = Number(new URL(route.request().url()).searchParams.get("quantity")) > 10 ? [] : [{ id: 1, name: "Ruhunu", area: "Colombo", distance_km: 1, travel_time_minutes: 3, contact_number: "0111234567", current_stock: 10, availability_confidence: .9, emergency_rescue_score: 90, verified: false, location_type: "Pharmacy", latitude: 7, longitude: 80, updated_at: "2026-10-23T08:00:00Z" }];
    else if (path === "/inventory") body = inventory;
    else if (path === "/pharmacies/mine") body = institution;
    else if (path === "/pharmacies") body = [{ ...institution, status: "Online", open_until: institution.opening_hours, stock_health: 80, urgent_gaps: 0, last_sync: "2026-10-23T08:00:00Z" }];
    else if (path === "/pharmacies/1/stock") body = [{ id: 1, medicine: inventory[0].medicine, generic: "Generic", strength: "500 mg", available: 28, updated_at: "2026-10-23T08:00:00Z" }];
    else if (path === "/reservations") body = [{ id: "1", can_manage: true, pharmacy_name: longName, patient: "A patient with a long name", medicine: inventory[0].medicine, quantity: 2, expires_at: "2026-10-23T09:00:00Z", status: "Pending" }];
    else if (path === "/operations/emails") body = { transport: "disabled", messages: [] };
    else if (path.startsWith("/operations/")) body = [];
    else return route.continue();
    await route.fulfill({ json: body });
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: role === "Pharmacist" ? "Pharmacist Dashboard" : role === "Admin" ? "Administration Dashboard" : "Emergency Request", exact: true })).toBeVisible();
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


test("search values can be edited and cleared without changing saved records", async ({ page }) => {
  await workspace(page);
  const writes: string[] = [];
  page.on("request", request => { if (["POST", "PATCH", "DELETE"].includes(request.method()) && /^\/(inventory|reservations|pharmacies|auth|admin)(\/|$)/.test(new URL(request.url()).pathname)) writes.push(request.url()); });
  const query = page.locator('input[name="query"]');
  const quantity = page.locator('input[name="quantity"]');
  const latitude = page.locator('input[name="latitude"]');
  const longitude = page.locator('input[name="longitude"]');
  const clear = page.getByRole("button", { name: "Clear search", exact: true });
  const search = page.getByRole("button", { name: "Search pharmacies", exact: true });
  await search.click();
  await expect(query).toHaveAttribute("aria-invalid", "true");
  await clear.click();
  await expect(query).toHaveAttribute("aria-invalid", "false");
  await query.fill("Panadol"); await quantity.fill("10"); await latitude.fill("7"); await longitude.fill("80");
  await search.click(); await expect(page.getByRole("heading", { name: "Ruhunu", exact: true })).toBeVisible();
  await quantity.fill("60");
  await expect(page.getByRole("heading", { name: "Ruhunu", exact: true })).toHaveCount(0);
  await search.click(); await expect(page.getByText("No matching medicine locations", { exact: true })).toBeVisible();
  await quantity.fill("1"); await search.click();
  await expect(page.getByRole("heading", { name: "Ruhunu", exact: true })).toBeVisible();
  await clear.click();
  await expect(query).toHaveValue(""); await expect(quantity).toHaveValue("1");
  await expect(latitude).toHaveValue(""); await expect(longitude).toHaveValue("");
  await expect(page.getByText("Ready to search", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ruhunu", exact: true })).toHaveCount(0);
  expect(writes).toEqual([]);
  await noOverflow(page);
});


test("stock rows expose edit and confirmed delete actions", async ({ page }) => {
  await workspace(page);
  let edited: Record<string, unknown> | undefined;
  let deletions = 0;
  await page.route("**/inventory", route => route.fulfill({ json: deletions ? [] : inventory }));
  await page.route("**/inventory/1", async route => {
    if (route.request().method() === "PATCH") {
      edited = route.request().postDataJSON();
      await route.fulfill({ json: {} });
    } else if (route.request().method() === "DELETE") {
      deletions++;
      await route.fulfill({ status: 204 });
    } else await route.continue();
  });
  await navigate(page, "My medicine stock");
  await page.getByRole("button", { name: "Edit", exact: true }).filter({ visible: true }).click();
  const edit = page.getByRole("dialog", { name: "Edit medicine", exact: true });
  await expect(edit).toBeVisible();
  await edit.locator('input[name="medicine"]').fill("Panadol");
  await edit.locator('input[name="stock"]').fill("42");
  await edit.getByRole("button", { name: "Save stock", exact: true }).click();
  await expect(edit).not.toBeVisible();
  expect(edited?.medicine).toBe("Panadol");
  expect(edited?.stock).toBe(42);
  await page.getByRole("button", { name: "Delete", exact: true }).filter({ visible: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Delete medicine", exact: true });
  await expect(confirmation).toBeVisible();
  expect(deletions).toBe(0);
  await confirmation.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(deletions).toBe(0);
  await page.getByRole("button", { name: "Delete", exact: true }).filter({ visible: true }).click();
  await confirmation.getByRole("button", { name: "Delete medicine", exact: true }).click();
  await expect(confirmation).not.toBeVisible();
  expect(deletions).toBe(1);
  await expect(page.getByText("No inventory records", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Medicine pickup location", exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Emergency Request", exact: true })).toBeVisible();
  await navigate(page, "My medicine stock");
  await expect(page.getByText("No inventory records", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Medicine pickup location", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add medicine", exact: true })).toBeEnabled();
  await noOverflow(page);
});


test("profile edits validate and persist across reloads", async ({ page }) => {
  await workspace(page);
  let saved = { id: 1, name: "Staff member with a long display name", email: "averylongaccountaddress@example.test", phone: "0111234567", approved: true, role: "Hospital Staff" };
  let saves = 0;
  await page.route("**/auth/me", async route => {
    if (route.request().method() === "PATCH") {
      const body = route.request().postDataJSON();
      saved = { ...saved, ...body }; saves++;
    }
    await route.fulfill({ json: saved });
  });
  await navigate(page, "Settings");
  const name = page.locator('input[name="name"]');
  const email = page.locator('input[name="email"]');
  const phone = page.locator('input[name="phone"]');
  await name.fill(" ");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  expect(saves).toBe(0);
  await name.fill("Updated staff member");
  await email.fill("updated@example.test");
  await phone.fill("0771234567");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByText("Profile updated successfully", { exact: true })).toBeVisible();
  expect(saves).toBe(1);
  await expect(name).toHaveValue("Updated staff member");
  await noOverflow(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Emergency Request", exact: true })).toBeVisible();
  await navigate(page, "Settings");
  await expect(name).toHaveValue("Updated staff member");
  await expect(email).toHaveValue("updated@example.test");
  await expect(phone).toHaveValue("0771234567");
  await page.locator("header select").selectOption("si");
  await expect(page.locator("html")).toHaveAttribute("lang", "si");
  await noOverflow(page);
});


test("rebalancing confirms transfers and alerts show honest email status", async ({ page }) => {
  await workspace(page);
  let transfers = 0;
  let emails = 0;
  await page.route("**/operations/transfers", async route => {
    if (route.request().method() === "POST") {
      transfers++;
      const body = route.request().postDataJSON();
      expect(body.quantity).toBe(8);
      expect(body.request_key).toMatch(/^[a-f0-9-]{36}$/);
      await route.fulfill({ json: { id: 1 } });
    } else await route.fulfill({ json: transfers ? [] : [{ from_inventory_id: 1, to_inventory_id: 2, from: "Donor pharmacy", to: "Receiver hospital", medicine: "Panadol 500 mg", qty: 8, distance_km: 2.3, can_execute: true }] });
  });
  await page.route("**/operations/transfer-history", route => route.fulfill({ json: transfers ? [{ id: 1, from: "Donor pharmacy", to: "Receiver hospital", medicine: "Panadol 500 mg", qty: 8, status: "completed", created_at: "2026-10-23T08:00:00Z" }] : [] }));
  await page.route("**/operations/alerts", route => route.fulfill({ json: [{ inventory_id: 1, title: "Panadol 500 mg", pharmacy: "Donor pharmacy", available: 0, reserved: 2, reorder_level: 10, tone: "danger" }] }));
  await page.route("**/operations/alerts/email", route => { emails++; return route.fulfill({ json: { transport: "disabled", queued: 1 } }); });
  await page.route("**/operations/emails", route => route.fulfill({ json: { transport: "disabled", messages: emails ? [{ id: 1, subject: "MediAssure: low stock - Panadol", status: "pending", attempts: 0, last_error: null, created_at: "2026-10-23T08:00:00Z", sent_at: null }] : [] } }));
  await navigate(page, "Rebalancing");
  await expect(page.getByText("Panadol 500 mg", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Record completed transfer", exact: true }).click();
  const confirm = page.getByRole("dialog", { name: "Confirm completed transfer", exact: true });
  await expect(confirm).toBeVisible();
  expect(transfers).toBe(0);
  await confirm.getByRole("button", { name: "Confirm completed transfer", exact: true }).click();
  await expect(page.getByText("#1", { exact: false })).toBeVisible();
  expect(transfers).toBe(1);
  await noOverflow(page);
  // App refresh after transfer reloads alerts from the mocked current stock.
  await navigate(page, "Alerts");
  await expect(page.getByText("Available stock: 0", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Email my alerts", exact: true }).click();
  await expect(page.getByText("Low-stock email notifications queued. Repeated requests do not send duplicates today.", { exact: true })).toBeVisible();
  await expect(page.getByText("MediAssure: low stock - Panadol", { exact: true })).toBeVisible();
  await expect(page.getByText("Delivery status: Queued", { exact: true })).toBeVisible();
  await expect(page.getByText("Email delivery is not configured. Messages remain queued until an administrator enables email delivery.", { exact: true })).toBeVisible();
  expect(emails).toBe(1);
  await noOverflow(page);
  await page.locator("header select").selectOption("si");
  await expect(page.locator("html")).toHaveAttribute("lang", "si");
  await noOverflow(page);
});


test("each account role displays its own illustration", async ({ page }) => {
  const cases = [
    ["Patient", "Patient finding medicine", "patient.png"],
    ["Pharmacist", "Pharmacist managing medicine stock", "pharmacist.png"],
    ["Hospital Staff", "Hospital staff managing medical supplies", "hospital-staff.png"],
    ["Admin", "Administrator coordinating the medicine network", "admin.png"],
  ] as const;
  for (const [role, alt, filename] of cases) {
    await workspace(page, role);
    if (page.viewportSize()!.width < 1024) await page.getByRole("button", { name: "Open menu", exact: true }).click();
    const image = page.locator("#workspace-navigation").getByRole("img", { name: alt, exact: true });
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute("src", new RegExp(filename.replace(".", "\\.")));
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
    await noOverflow(page);
  }
});
