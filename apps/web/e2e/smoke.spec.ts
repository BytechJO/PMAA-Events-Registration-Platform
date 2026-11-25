import { expect, test } from "@playwright/test";

test("the home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Events Registration Platform" })).toBeVisible();
});

test("the health check answers", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBe(true);
  expect(await res.json()).toMatchObject({ status: "ok" });
});

test("admin APIs refuse anonymous callers", async ({ request }) => {
  const res = await request.get("/api/admin/ping");
  expect(res.status()).toBe(401);
  expect(await res.json()).toMatchObject({ error: "unauthorized" });
});
