import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/* T012 admin shell, with the local test sign-in (ADMIN_DEV_SIGN_IN, set by playwright.config.ts). */

async function signInAs(page: Page, role: string) {
  await page.goto("/admin");
  await page.getByRole("button", { name: role, exact: true }).click();
  await page.waitForURL("**/admin/events");
  await page.waitForLoadState("networkidle"); // hydrated: menu button and dropdowns respond
}

/** The menu is in the sidebar on desktop and behind the menu button below 1024 px. */
async function menu(page: Page) {
  const button = page.getByRole("button", { name: "Open menu" });
  if (await button.isVisible()) {
    await expect(async () => {
      if (!(await page.getByRole("dialog").isVisible())) await button.click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 10_000 });
  }
  return page.getByRole("navigation", { name: "Admin" }).filter({ visible: true });
}

test("an anonymous visitor sees the sign-in screen, not the admin", async ({ page }) => {
  await page.goto("/admin/registrations");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Admin" })).toHaveCount(0);
  await expect(page.getByText("No registrations yet")).toHaveCount(0);
});

test("move between admin sections", async ({ page }) => {
  await signInAs(page, "Super Admin");
  await expect(page).toHaveTitle("Events · PMAA Admin");
  await expect(page.getByText("No events yet")).toBeVisible();

  let nav = await menu(page);
  await expect(nav.getByRole("link", { name: "Events" })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "Registrations" }).click();
  await expect(page).toHaveURL(/\/admin\/registrations$/);
  await expect(page.getByText("No registrations yet")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Registrations");

  nav = await menu(page);
  await expect(nav.getByRole("link", { name: "Registrations" })).toHaveAttribute("aria-current", "page");
  // Grayed-out sections are not links.
  await expect(nav.getByRole("link", { name: /Messages/ })).toHaveCount(0);
  await expect(nav.locator('[data-nav="messages"]')).toHaveAttribute("aria-disabled", "true");
});

test("the menu shows the role and lets you sign out", async ({ page }) => {
  await signInAs(page, "Event Admin");
  await menu(page);
  const account = page.getByRole("button", { name: "Test Event Admin Event Admin" }).filter({ visible: true });
  await account.click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("Read-only sees only Events and Registrations", async ({ page }) => {
  await signInAs(page, "Read-only");
  const nav = await menu(page);
  await expect(nav.locator("[data-nav]")).toHaveCount(2);
  await expect(nav.getByText("Settings")).toHaveCount(0);
});

test("a user with no admin role gets 'not allowed' (AT-11)", async ({ page }) => {
  await signInAs(page, "No role (not on the admin list)");
  await expect(page.getByRole("heading", { name: "You don't have access to this page" })).toBeVisible();
  await expect(page.getByText("No events yet")).toHaveCount(0);
});

test("an unknown admin page shows 'not found' inside the shell", async ({ page }) => {
  await signInAs(page, "Super Admin");
  await page.goto("/admin/settings");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Not found");
});

test("at tablet width the menu collapses behind a button and still works", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await signInAs(page, "Super Admin");
  await expect(page.getByRole("navigation", { name: "Admin" }).filter({ visible: true })).toHaveCount(0);
  const nav = await menu(page);
  await nav.getByRole("link", { name: "Registrations" }).click();
  await expect(page).toHaveURL(/\/admin\/registrations$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("keyboard: the skip link comes first and focus is visible", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await signInAs(page, "Super Admin");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toHaveAttribute("data-nav", "events");
  const ring = await focused.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(ring).not.toBe("none");
});

test("the admin shell passes an axe accessibility check", async ({ page }) => {
  await signInAs(page, "Super Admin");
  for (const path of ["/admin/events", "/admin/registrations", "/admin/nothing-here"]) {
    await page.goto(path);
    await expect(page.locator("#admin-content")).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect([path, results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)]).toEqual([path, []]);
  }
});

test("the sign-in screen passes an axe accessibility check", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});
