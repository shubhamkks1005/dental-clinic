import { expect, test } from "@playwright/test";

// Q2.13 Settings > Clinic and doctor. Design: Settings.dc.html, PhoneSettings.dc.html.
// The value typed here is cleared again at the end so other specs see the install defaults.
test("Clinic and doctor: amber warning, live preview, last saved, History", async ({ page }) => {
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  await page.goto("/app/settings/clinic");
  await expect(page.getByRole("heading", { name: "Clinic and doctor" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Clinic", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Doctor", exact: true })).toBeVisible();

  const reg = page.getByRole("textbox", { name: /^Registration number/ });
  const warning = page.getByText("Required before you print a prescription or certificate.");
  const preview = page.getByRole("complementary", { name: "Prescription preview" });
  await expect(reg).toHaveValue("");
  await expect(warning).toBeVisible();
  await expect(reg).toHaveAttribute("aria-describedby", /warn-doctor\.registration_no/);
  await expect(preview).toContainText("Reg. no. missing");
  const bg = await warning.evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(bg).not.toBe("rgba(0, 0, 0, 0)");

  // Typing changes the preview at once; nothing is saved yet.
  await reg.fill("A-12345");
  await expect(warning).toHaveCount(0);
  await expect(preview).toContainText("Reg. no. A-12345");
  const tagline = page.getByRole("textbox", { name: /^Tagline/ });
  const originalTagline = await tagline.inputValue();
  await tagline.fill("Fake tagline for preview");
  await expect(preview).toContainText("Fake tagline for preview");
  await page.screenshot({ path: "docs/ui-audit/screenshots/redesign/Q2.13/Settings.png" });

  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Saved.", { exact: true })).toBeVisible();
  await expect(page.getByText(/Last saved .* by /)).toBeVisible();

  await page.getByRole("button", { name: "History", exact: true }).click();
  await expect(page.getByLabel("History of")).toBeVisible();
  await expect(page.getByLabel("History of")).toHaveValue("doctor.registration_no");

  // Put the defaults back.
  await reg.fill("");
  await tagline.fill(originalTagline);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Saved.", { exact: true })).toBeVisible();
});

test("Clinic and doctor is view only for the receptionist", async ({ page }) => {
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/settings/clinic");
  await expect(page.getByText("View only. Ask the doctor to change these.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: /^Registration number/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save changes" })).toHaveCount(0);
});

test("Clinic and doctor at 360, 768 and 1366: no sideways scroll, targets 44 px", async ({
  page,
}) => {
  await page.goto("/api/staff/auth/dev-login?role=doctor");
  for (const [w, h] of [
    [360, 780],
    [768, 1024],
    [1366, 768],
  ] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/app/settings/clinic");
    await expect(page.getByRole("heading", { name: "Clinic and doctor" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
    const small = await page.evaluate(
      () =>
        [...document.querySelectorAll("main button, main input, main select, main textarea")]
          .filter((e) => (e as HTMLElement).offsetParent !== null)
          .map((e) => e.getBoundingClientRect())
          .filter((r) => r.width > 0 && r.height < 44).length,
    );
    expect(small, `targets under 44px at ${w}`).toBe(0);
    if (w === 360)
      await page.screenshot({
        path: "docs/ui-audit/screenshots/redesign/Q2.13/PhoneSettings.png",
        fullPage: true,
      });
  }
});
