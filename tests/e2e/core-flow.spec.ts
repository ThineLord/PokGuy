import { expect, test, type Page } from "@playwright/test";

async function waitForHeroOrSettlement(page: Page) {
  const fold = page.getByRole("button", { name: "Fold" });
  const nextHand = page.getByRole("button", { name: "下一手" });
  await expect
    .poll(
      async () =>
        (await nextHand.isVisible().catch(() => false)) ||
        (await fold.evaluateAll((buttons) =>
          buttons.some((button) => !(button as HTMLButtonElement).disabled),
        )),
      { timeout: 15_000 },
    )
    .toBe(true);
}

async function finishHand(
  page: Page,
  preferredAction: "fold" | "call" | "raise",
) {
  const nextHand = page.getByRole("button", { name: "下一手" });
  let usedPreferredAction = false;
  for (let decision = 0; decision < 30; decision += 1) {
    await waitForHeroOrSettlement(page);
    if (await nextHand.isVisible().catch(() => false)) return;

    const check = page.getByRole("button", { name: "Check" });
    const call = page.getByRole("button", { name: /^Call/ });
    const raise = page.getByRole("button", { name: /^(Raise|Bet)$/ });
    const fold = page.getByRole("button", { name: "Fold" });

    if (
      !usedPreferredAction &&
      preferredAction === "raise" &&
      (await raise.isEnabled())
    ) {
      await raise.click();
      usedPreferredAction = true;
    } else if (
      !usedPreferredAction &&
      preferredAction === "call" &&
      (await call.isEnabled())
    ) {
      await call.click();
      usedPreferredAction = true;
    } else if (preferredAction === "fold" || decision >= 3) {
      await fold.click();
      usedPreferredAction = true;
    } else if (await check.isEnabled()) {
      await check.click();
    } else if (await call.isEnabled()) {
      await call.click();
    } else {
      await fold.click();
    }
  }
  throw new Error("Hand did not settle within 30 hero decisions");
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("德州扑克牌桌")).toBeVisible();
});

test("start a hand, fold, open history and replay", async ({ page }) => {
  await page
    .getByRole("button", { name: "Fold" })
    .waitFor({ state: "visible" });
  while (await page.getByRole("button", { name: "Fold" }).isDisabled()) {
    await page.waitForTimeout(100);
  }
  await page.getByRole("button", { name: "Fold" }).click();
  await expect(page.getByRole("button", { name: "下一手" })).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole("button", { name: "历史与复盘" }).click();
  await expect(page.getByText("逐街复盘")).toBeVisible();
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByText(/底池/).first()).toBeVisible();
});

test("use call and raise controls", async ({ page }) => {
  const call = page.getByRole("button", { name: /^Call/ });
  while (await call.isDisabled()) await page.waitForTimeout(100);
  await call.click();
  await page.waitForTimeout(700);
  await page.getByLabel("下注总额").fill("3");
  const raise = page.getByRole("button", { name: /^(Raise|Bet)$/ });
  if (!(await raise.isDisabled())) await raise.click();
  await expect(page.getByLabel("德州扑克牌桌")).toBeVisible();
});

test("play consecutive hands without deadlocks, blank positions, or revealed folded cards", async ({
  page,
}) => {
  await page.getByRole("button", { name: "设置" }).click();
  await page.getByLabel("AI 思考延迟（ms）").fill("0");
  await page.getByLabel("短动画").uncheck();
  await page.getByRole("button", { name: "训练桌" }).click();

  const positions = new Set<string>();
  for (const preferredAction of [
    "fold",
    "call",
    "raise",
    "fold",
    "fold",
    "fold",
  ] as const) {
    await expect(page.getByLabel("德州扑克牌桌")).toBeVisible();
    const heroText = await page
      .locator('article[aria-label^="Hero，"]')
      .innerText();
    const position = heroText.match(/\b(BTN|SB|BB|UTG|HJ|CO)\b/)?.[1];
    expect(position).toBeTruthy();
    positions.add(position!);

    await finishHand(page, preferredAction);
    await expect(page.getByRole("button", { name: "下一手" })).toBeVisible();
    await expect(
      page.locator(".playing-card").filter({ hasText: /^R$/ }),
    ).toHaveCount(0);

    const foldedAiSeats = page
      .locator('article:not([aria-label^="Hero，"])')
      .filter({ hasText: "fold" });
    for (let seat = 0; seat < (await foldedAiSeats.count()); seat += 1) {
      await expect(foldedAiSeats.nth(seat).getByLabel("牌背")).toHaveCount(2);
    }
    await page.getByRole("button", { name: "下一手" }).click();
  }

  expect(positions.size).toBeGreaterThan(1);
});

test("enter a deterministic river scenario and reach showdown", async ({
  page,
}) => {
  await page.getByRole("button", { name: "单手牌" }).click();
  await page.getByLabel("对手数量").fill("5");
  await expect(page.getByLabel("位置").locator("option")).toHaveText([
    "BTN",
    "SB",
    "BB",
    "UTG",
    "HJ",
    "CO",
  ]);
  await page.getByLabel("对手数量").fill("1");
  await page.getByLabel("你的底牌").fill("TH 9H");
  await page.getByLabel("起始街").selectOption("river");
  await page.getByLabel("公共牌").fill("2C 7D 9S JC 3H");
  await page.getByLabel("位置").selectOption("BB");
  await page.getByRole("button", { name: "开始此训练" }).click();
  await expect(page.getByText("单手牌训练", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "2-max · 100 BB" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "调整场景" })).toBeVisible();
  await expect(page.getByText("RIVER", { exact: true })).toBeVisible();
  await expect(page.getByLabel("10 hearts")).toBeVisible();
  await expect(page.getByLabel("下注滑杆")).toHaveValue(
    await page.getByLabel("下注总额").inputValue(),
  );
  const check = page.getByRole("button", { name: "Check" });
  const call = page.getByRole("button", { name: /^Call/ });
  await expect
    .poll(
      async () => !(await check.isDisabled()) || !(await call.isDisabled()),
      { timeout: 10_000 },
    )
    .toBe(true);
  if (!(await check.isDisabled())) await check.click();
  else await call.click();
  await expect(page.getByText("摊牌完成")).toBeVisible();
  await page.getByRole("button", { name: "新场景" }).click();
  await expect(
    page.getByRole("heading", { name: "构建一个决策节点" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "训练桌" }).click();
  await page.getByRole("button", { name: "返回现金桌" }).click();
  await expect(page.getByText("标准现金桌训练", { exact: true })).toBeVisible();
});

test("edit AI settings, persist after reload, and export hands", async ({
  page,
}) => {
  await page.getByRole("button", { name: "设置" }).click();
  await page.getByLabel("玩家名称").fill("River Hero");
  await page.getByLabel("玩家名称").press("Tab");
  await page.getByRole("button", { name: /石墨构造/ }).click();
  await page.reload();
  await page.getByRole("button", { name: "设置" }).click();
  await expect(page.getByLabel("玩家名称")).toHaveValue("River Hero");
  await expect(page.getByRole("button", { name: /石墨构造/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出牌局记录" }).click();
  await expect((await download).suggestedFilename()).toBe(
    "riverlab-hands.json",
  );
});
