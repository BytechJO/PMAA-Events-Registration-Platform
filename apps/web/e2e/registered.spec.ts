import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/*
 * T023 "You're registered" page (doc 08 core-04) with the sample registrations (PUBLIC_SAMPLE_DATA,
 * set by playwright.config.ts). Starts at the page: the form and the registration API that lead here
 * come with T021 and T022.
 */

const page_ = (token: string, slug = "creating-engaging-digital-content") => `/webinars/${slug}/registered?token=${token}`;

test("a registered teacher sees what happens next", async ({ page }) => {
  await page.goto(page_("sample-confirmed"));
  await expect(page.getByRole("heading", { name: "You're registered!" })).toBeVisible();
  await expect(page.getByText("Sunday 14 March 2027, 3:00 – 4:00 PM (Amman, UTC+3)")).toBeVisible();
  await expect(page.getByText("We are sending a confirmation email to lina.haddad@school.example")).toBeVisible();
  await expect(page.getByText("We will remind you by email 24 hours and 1 hour before the session starts.")).toBeVisible();
  await expect(page.getByText(/we (have )?sent/i)).toHaveCount(0);
});

test("Add to calendar: the .ics file downloads with the session's time", async ({ page }) => {
  await page.goto(page_("sample-confirmed"));
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Apple / .ics file" }).click()]);
  expect(download.suggestedFilename()).toBe("webinar-2027-03-14.ics");
  const ics = await readFile((await download.path())!, "utf8");
  expect(ics).toContain("BEGIN:VCALENDAR");
  expect(ics).toContain("DTSTART:20270314T120000Z"); // 3:00 PM in Amman
  expect(ics).toContain("DTEND:20270314T130000Z");
  expect(ics).toContain("SUMMARY:Creating Engaging Digital Content on the GROW LMS");
  expect(ics).not.toContain("lina.haddad");
});

test("Add to calendar: Google and Outlook open in a new tab with the session", async ({ page }) => {
  await page.goto(page_("sample-confirmed"));
  const google = page.getByRole("link", { name: "Google Calendar" });
  await expect(google).toHaveAttribute("href", /^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE.*dates=20270314T120000Z\/20270314T130000Z/);
  await expect(google).toHaveAttribute("target", "_blank");
  await expect(google).toHaveAttribute("rel", "noreferrer noopener");
  const outlook = page.getByRole("link", { name: "Outlook" });
  await expect(outlook).toHaveAttribute("href", /^https:\/\/outlook\.office\.com\/calendar\/0\/deeplink\/compose\?.*startdt=2027-03-14T12%3A00%3A00\.000Z/);
});

test("the token never leaks: no referrer, not indexed", async ({ page }) => {
  await page.goto(page_("sample-confirmed"));
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("a waitlisted teacher sees the waiting list, with no calendar entry", async ({ page }) => {
  await page.goto(page_("sample-waitlisted"));
  await expect(page.getByRole("heading", { name: "You're on the waiting list" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Apple / .ics file" })).toHaveCount(0);
});

test("an unknown token or another event's page shows 'not found'", async ({ page, request }) => {
  for (const url of [page_("unknown-token-1234"), page_("sample-confirmed", "another-event")]) {
    await page.goto(url);
    await expect(page.getByRole("heading", { name: "We couldn't find this registration" })).toBeVisible();
  }
  expect((await request.get("/api/public/registrations/unknown-token-1234/calendar.ics")).status()).toBe(404);
});

test("the page fits a phone: one column, no sideways scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto(page_("sample-confirmed"));
  await expect(page.getByRole("heading", { name: "You're registered!" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  const [g, o] = [await page.getByRole("link", { name: "Google Calendar" }).boundingBox(), await page.getByRole("link", { name: "Outlook" }).boundingBox()];
  expect(o!.y).toBeGreaterThan(g!.y); // stacked, not side by side
});

test("the confirmation page passes an axe accessibility check", async ({ page }) => {
  for (const token of ["sample-confirmed", "sample-waitlisted", "unknown-token-1234"]) {
    await page.goto(page_(token));
    await expect(page.locator("main h1")).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect([token, results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)]).toEqual([token, []]);
  }
});
