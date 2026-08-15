import { test, expect } from "@playwright/test";

/**
 * Smoke E2E that does not require a seeded demo database.
 * Full multi-role persistence flow requires TEST_* credentials in CI secrets.
 */
test.describe("public surfaces", () => {
  test("login page loads with campus hero image", async ({ page }) => {
    const imgErrors: string[] = [];
    page.on("response", (res) => {
      if (res.url().includes("/images/campus-hero") && res.status() >= 400) {
        imgErrors.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "CampusResolve" }).first()).toBeVisible();
    const hero = page.locator('img[alt*="campus" i], img[alt*="University" i]');
    // Desktop layout only shows hero; on mobile may be hidden — check network instead
    const res = await page.request.get("/images/campus-hero.jpg");
    expect(res.status()).toBe(200);
    expect(imgErrors).toEqual([]);
    void hero;
  });

  test("manifest is valid", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.name).toBe("CampusResolve");
    expect(json.display).toBe("standalone");
    expect(json.icons?.length).toBeGreaterThan(0);
  });

  test("offline page is available", async ({ page }) => {
    await page.goto("/offline");
    await expect(page.getByRole("heading", { name: "CampusResolve" })).toBeVisible();
    await expect(page.getByText(/offline/i)).toBeVisible();
  });

  test("signup is student-only copy", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /student account/i })).toBeVisible();
    await expect(page.getByText(/Staff accounts are invited/i)).toBeVisible();
  });
});

test.describe("authenticated persistence", () => {
  test.skip(
    !process.env.E2E_STUDENT_EMAIL || !process.env.E2E_STUDENT_PASSWORD,
    "Set E2E_STUDENT_EMAIL and E2E_STUDENT_PASSWORD against a test Supabase project",
  );

  test("student can sign in and see dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(process.env.E2E_STUDENT_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.E2E_STUDENT_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/student/);
  });
});
