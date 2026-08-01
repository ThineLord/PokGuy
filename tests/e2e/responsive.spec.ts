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

test("iPhone layout keeps the live controls reachable and touch sized @webkit", async ({
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

  await page.getByRole("button", { name: "切换到英文" }).click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    })),
  ).toEqual({
    viewportWidth: 393,
    documentWidth: 393,
  });
});

test("iPad landscape has no information/action overlap @webkit", async ({
  page,
}) => {
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

test("iPhone showdown comparison stays within the viewport @webkit", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByRole("button", { name: "场景" }).click();
  await page.getByLabel("对手数量").fill("1");
  await page.getByLabel("你的底牌").fill("TH 9H");
  await page.getByLabel("起始街").selectOption("river");
  await page.getByLabel("公共牌").fill("2C 7D 9S JC 3H");
  await page.getByLabel("位置").selectOption("BB");
  await page.getByRole("button", { name: "开始此训练" }).click();

  const check = page.getByRole("button", { name: "过牌" });
  const call = page.getByRole("button", { name: /^跟注/ });
  await expect
    .poll(
      async () => !(await check.isDisabled()) || !(await call.isDisabled()),
      { timeout: 10_000 },
    )
    .toBe(true);
  if (!(await check.isDisabled())) await check.click();
  else await call.click();

  const comparison = page.getByLabel("正式牌型比较");
  await expect(comparison).toBeVisible();
  await expect(page.locator(".showdown-player")).toHaveCount(2);
  const metrics = await page.evaluate(() => {
    const panel = document.querySelector(".showdown-breakdown") as HTMLElement;
    const bounds = panel.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      panelLeft: bounds.left,
      panelRight: bounds.right,
    };
  });
  expect(metrics.documentWidth).toBe(metrics.viewportWidth);
  expect(metrics.panelLeft).toBeGreaterThanOrEqual(0);
  expect(metrics.panelRight).toBeLessThanOrEqual(metrics.viewportWidth);
});

test("desktop keyboard shortcut can fold without stealing input keystrokes @webkit", async ({
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
    page.locator('article[aria-label^="Hero，"]').filter({ hasText: "弃牌" }),
  ).toBeVisible();
});
