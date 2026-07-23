import { expect, type Page, test } from "@playwright/test";

async function waitForHeroTurn(page: Page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const result = await Promise.race([
      page
        .locator(".action-bar.is-hero-turn")
        .waitFor({ state: "visible", timeout: 10_000 })
        .then(() => "turn" as const),
      page
        .getByRole("button", { name: "下一手" })
        .waitFor({ state: "visible", timeout: 10_000 })
        .then(() => "settled" as const),
    ]);
    if (result === "turn") return;
    await page.getByRole("button", { name: "下一手" }).click();
  }
  throw new Error("未能在四手内等到用户行动");
}

test("iPhone layout keeps the live controls reachable and touch sized", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await waitForHeroTurn(page);
  await page.waitForTimeout(450);

  const metrics = await page.evaluate(() => {
    const action = document
      .querySelector(".action-bar")
      ?.getBoundingClientRect();
    const buttons = Array.from(
      document.querySelectorAll<HTMLButtonElement>(".action-buttons button"),
    ).map((button) => button.getBoundingClientRect());
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      actionBottom: action?.bottom ?? Number.POSITIVE_INFINITY,
      viewportHeight: window.innerHeight,
      minimumButtonHeight: Math.min(...buttons.map((button) => button.height)),
    };
  });

  expect(metrics.documentWidth).toBe(metrics.viewportWidth);
  expect(metrics.actionBottom).toBeLessThanOrEqual(metrics.viewportHeight + 1);
  expect(metrics.minimumButtonHeight).toBeGreaterThanOrEqual(44);
  await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
});

test("iPad landscape has no information/action overlap", async ({ page }) => {
  await page.setViewportSize({ width: 1194, height: 834 });
  await page.goto("/");
  await waitForHeroTurn(page);

  const metrics = await page.evaluate(() => {
    const info = document.querySelector(".info-strip")?.getBoundingClientRect();
    const action = document
      .querySelector(".action-bar")
      ?.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      infoBottom: info?.bottom ?? 0,
      actionTop: action?.top ?? 0,
      actionBottom: action?.bottom ?? Number.POSITIVE_INFINITY,
      viewportHeight: window.innerHeight,
    };
  });

  expect(metrics.documentWidth).toBe(metrics.viewportWidth);
  expect(metrics.actionTop).toBeGreaterThanOrEqual(metrics.infoBottom);
  expect(metrics.actionBottom).toBeLessThanOrEqual(metrics.viewportHeight);
});

test("desktop keyboard shortcut can fold without stealing input keystrokes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await waitForHeroTurn(page);
  const amount = page.getByLabel("下注总额");
  const amountBeforeShortcut = await amount.inputValue();
  await amount.focus();
  await page.keyboard.press("f");
  await expect(page.getByRole("button", { name: "下一手" })).toHaveCount(0);
  await expect(amount).toHaveValue(amountBeforeShortcut);
  await amount.evaluate((element) => (element as HTMLInputElement).blur());
  await page.keyboard.press("f");
  await expect(
    page.locator('article[aria-label^="Hero，"]').filter({ hasText: "fold" }),
  ).toBeVisible();
});
