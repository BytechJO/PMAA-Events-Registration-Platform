import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const slug = "creating-engaging-digital-content";

test("FR-002 server renders the public webinar with accessible session choices", async ({
  page,
  request,
}) => {
  const path = `/webinars/${slug}`;
  const html = await (await request.get(path)).text();
  expect(html).toContain("<em>Digital Content</em>");
  expect(html).not.toMatch(
    /demo-draft|joinUrl|privateEmail|teams\.microsoft\.com/i,
  );

  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Creating Engaging Digital Content on the GROW LMS",
  );
  const registerNow = page.getByRole("link", { name: "Register now" });
  await expect(registerNow).toHaveCSS("background-color", "rgb(189, 36, 127)");
  await registerNow.click();
  await expect(page).toHaveURL(/#sessions$/);
  await expect(page.getByText("Places available")).toBeAttached();
  await expect(page.getByText("Session full")).toBeAttached();
  await expect(page.getByText("Registration closed")).toBeAttached();
  const registration = page.getByRole("link", {
    name: /Register for this session/,
  });
  await expect(registration).toHaveCount(1);
  await expect(registration).toHaveAttribute(
    "href",
    `${path}/register?session=demo-open`,
  );

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("FR-002 public API excludes unpublished data", async ({
  request,
  page,
}) => {
  const response = await request.get(`/api/public/events/${slug}`);
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  const body = await response.json();
  expect(
    body.sessions.map(
      ({ availability }: { availability: string }) => availability,
    ),
  ).toEqual(["open", "full", "closed"]);
  expect(Object.keys(body.sessions[0]).sort()).toEqual([
    "availability",
    "endsAt",
    "id",
    "startsAt",
    "timeZone",
  ]);
  expect(await response.text()).not.toMatch(/demo-draft|joinUrl|privateEmail/i);
  for (const hidden of ["draft-webinar", "unknown-webinar"]) {
    expect((await request.get(`/api/public/events/${hidden}`)).status()).toBe(
      404,
    );
  }
  await page.goto("/webinars/draft-webinar");
  await expect(page.getByText("This page could not be found.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Register now" })).toHaveCount(0);
});
