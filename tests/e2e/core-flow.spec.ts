import { expect, test, type Page } from "@playwright/test";

async function waitForHeroOrSettlement(page: Page) {
  const fold = page.getByRole("button", { name: "弃牌" });
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

    const check = page.getByRole("button", { name: "过牌" });
    const call = page.getByRole("button", { name: /^跟注/ });
    const raise = page.getByRole("button", { name: /^(加注|下注)$/ });
    const fold = page.getByRole("button", { name: "弃牌" });

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
  await expect(page.getByRole("button", { name: "重新买入" })).toBeDisabled();
  await page
    .getByRole("button", { name: "弃牌" })
    .waitFor({ state: "visible" });
  while (await page.getByRole("button", { name: "弃牌" }).isDisabled()) {
    await page.waitForTimeout(100);
  }
  await page.getByRole("button", { name: "弃牌" }).click();
  const foldedHero = page.locator('.seat[data-seat="0"].action-fold');
  await expect(foldedHero).toBeVisible();
  await expect(foldedHero.locator(".action-effect-fold i").first()).toHaveCSS(
    "animation-name",
    "fold-card-to-muck",
  );
  await expect(page.getByRole("button", { name: "下一手" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("本手正式结束")).toBeVisible();
  await expect(page.locator(".completion-copy > strong")).toHaveText(
    /只剩一手活牌|All-in 后无后续下注|河牌下注完成/,
  );
  await expect(page.getByText("赢家已经确定")).toBeVisible();
  await expect(page.getByText("筹码已经到账")).toBeVisible();
  await page.getByRole("button", { name: "历史与复盘" }).click();
  await expect(page.getByText("逐街复盘")).toBeVisible();
  await expect(page.getByRole("heading", { name: "训练反馈" })).toBeVisible();
  await expect(page.locator(".review-entry")).toHaveCount(1);
  await expect(page.getByText(/1 个决策 · 0 个待复查/)).toBeVisible();
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByText(/底池/).first()).toBeVisible();
});

test("create a real review item and keep Review Lab mobile-safe", async ({
  page,
}) => {
  await page.getByRole("button", { name: "单手牌" }).click();
  await page.getByLabel("起始街").selectOption("river");
  await page.getByLabel("位置").selectOption("SB");
  await page.getByRole("button", { name: "开始此训练" }).click();

  const fold = page.getByRole("button", { name: "弃牌" });
  const check = page.getByRole("button", { name: "过牌" });
  await expect(check).toBeEnabled();
  await expect(fold).toBeEnabled();
  await fold.click();
  await expect(page.getByText("本手正式结束")).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole("button", { name: "历史与复盘" }).click();
  await expect(
    page.locator(".review-grade", { hasText: "偏紧" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "待复查", exact: true }).click();
  await expect(page.locator(".history-item")).toHaveCount(1);

  await page.reload();
  await page.getByRole("button", { name: "历史与复盘" }).click();
  await expect(
    page.locator(".review-grade", { hasText: "偏紧" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "待复查", exact: true }).click();
  await expect(page.locator(".history-item")).toHaveCount(1);
  await page.getByRole("button", { name: "统计", exact: true }).click();
  await expect(
    page.locator(".stat-card", { hasText: "已点评决策" }).locator("strong"),
  ).toHaveText("1");
  await expect(
    page.locator(".stat-card", { hasText: "待复查决策" }).locator("strong"),
  ).toHaveText("1");

  await page.getByRole("button", { name: "历史与复盘" }).click();
  for (const viewport of [
    { width: 393, height: 852 },
    { width: 320, height: 780 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole("heading", { name: "训练反馈" })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const filterHeights = await page
      .locator(".history-filters button")
      .evaluateAll((buttons) =>
        buttons.map((button) => button.getBoundingClientRect().height),
      );
    expect(filterHeights.every((height) => height >= 44)).toBe(true);
  }
});

test("use call and raise controls", async ({ page }) => {
  const call = page.getByRole("button", { name: /^跟注/ });
  while (await call.isDisabled()) await page.waitForTimeout(100);
  await call.click();
  await expect(
    page.locator('.seat[data-seat="0"][data-last-action="call"]'),
  ).toBeVisible();
  await expect(
    page.locator('.seat[data-seat="0"] .action-callout-call'),
  ).toBeVisible();
  await page.waitForTimeout(700);
  await page.getByLabel("下注总额").fill("3");
  const raise = page.getByRole("button", { name: /^(加注|下注)$/ });
  if (!(await raise.isDisabled())) await raise.click();
  await expect(page.getByLabel("德州扑克牌桌")).toBeVisible();
});

test("show blind roles and clockwise dealing order", async ({ page }) => {
  const smallBlind = page.locator(".seat-position.small-blind");
  const bigBlind = page.locator(".seat-position.big-blind");
  await expect(smallBlind).toHaveCount(1);
  await expect(bigBlind).toHaveCount(1);
  await expect(smallBlind).toContainText("小盲");
  await expect(bigBlind).toContainText("大盲");
  await expect(page.getByText("顺时针行动")).toBeVisible();

  const clockwiseSeats = await page.locator(".seat").evaluateAll((seats) =>
    seats
      .map((seat) => ({
        seat: Number(seat.getAttribute("data-seat")),
        dealOrder: Number(seat.getAttribute("data-deal-order")),
        className: seat.className,
      }))
      .sort((left, right) => left.dealOrder - right.dealOrder),
  );
  expect(clockwiseSeats.map((seat) => seat.seat)).toEqual([1, 2, 3, 4, 5, 0]);
  expect(clockwiseSeats[0].className).toContain("seat-5-6");

  const dealSteps = await page
    .locator(".dealt-card")
    .evaluateAll((cards) =>
      cards
        .map((card) => Number(card.getAttribute("data-deal-step")))
        .sort((left, right) => left - right),
    );
  expect(dealSteps).toEqual(Array.from({ length: 12 }, (_, index) => index));
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
      .filter({ hasText: "弃牌" });
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
    page.getByRole("heading", { name: "2 人桌 · 100 BB" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "调整场景" })).toBeVisible();
  await expect(page.getByText("河牌", { exact: true })).toBeVisible();
  await expect(page.getByLabel("10 红桃")).toBeVisible();
  const wagerInput = page.getByLabel("下注总额");
  await expect(page.getByLabel("下注滑杆")).toHaveValue(
    await wagerInput.inputValue(),
  );
  expect(await wagerInput.inputValue()).toMatch(/^\d+(?:\.\d{1,2})?$/);
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
  await expect(page.getByText("摊牌完成")).toBeVisible();
  await expect(
    page.getByText("河牌下注完成，所有活牌已摊牌比较"),
  ).toBeVisible();
  await expect(page.getByText("主池和边池已经分别结算")).toBeVisible();
  await expect(page.getByText("无人跟注筹码已经退回")).toBeVisible();
  await expect(page.getByLabel("正式牌型比较")).toBeVisible();
  await expect(page.getByText("只比较最佳五张牌")).toBeVisible();
  await expect(page.locator(".showdown-player")).toHaveCount(2);
  await expect(page.locator(".showdown-player.is-winner")).toHaveCount(1);
  await expect(page.getByLabel("最佳五张").first()).toBeVisible();
  await expect(page.getByText("主池", { exact: true })).toBeVisible();
  await expect(
    page.locator(".showdown-pot-ledger .uncalled-return"),
  ).toHaveCount(0);
  await expect(page.locator(".showdown-pot-ledger")).not.toContainText(
    /(^|\s)0 BB/,
  );
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

test("rejects invalid blind settings and remains reloadable", async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.getByRole("button", { name: "设置" }).click();
  const smallBlind = page.getByLabel("小盲");
  const bigBlind = page.getByLabel("大盲");

  await smallBlind.fill("");
  await smallBlind.press("Tab");
  await expect(smallBlind).toHaveValue("0.5");

  await bigBlind.fill("0.25");
  await bigBlind.press("Tab");
  await expect(bigBlind).toHaveValue("1");

  const storedBlinds = await page.evaluate(() => {
    const serialized = window.localStorage.getItem("riverlab-poker-v2");
    if (!serialized) return null;
    const stored = JSON.parse(serialized) as {
      settings?: { smallBlind?: unknown; bigBlind?: unknown };
    };
    return stored.settings ?? null;
  });
  expect(storedBlinds).toMatchObject({ smallBlind: 0.5, bigBlind: 1 });

  await page.reload();
  await expect(page.getByLabel("德州扑克牌桌")).toBeVisible();
  await page.getByRole("button", { name: "设置" }).click();
  await expect(page.getByLabel("小盲")).toHaveValue("0.5");
  await expect(page.getByLabel("大盲")).toHaveValue("1");
  expect(pageErrors).toEqual([]);
});

test("switch the entire interface to English and keep it after reload", async ({
  page,
}) => {
  await expect(page.getByRole("button", { name: "弃牌" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Fold/ })).toHaveCount(0);
  await page.getByRole("button", { name: "切换到英文" }).click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await expect(page.getByLabel("Texas Hold'em table")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Fold/ })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByText("Standard cash-game training")).toBeVisible();
  expect(await page.locator("body").innerText()).not.toMatch(/[\u3400-\u9fff]/);

  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByLabel("Player name")).toBeVisible();
  await expect(page.getByText("AI player profiles")).toBeVisible();
  expect(await page.locator("body").innerText()).not.toMatch(/[\u3400-\u9fff]/);

  for (const destination of ["Single hand", "History & replay", "Stats"]) {
    await page.getByRole("button", { name: destination }).click();
    expect(await page.locator("body").innerText()).not.toMatch(
      /[\u3400-\u9fff]/,
    );
  }

  await page.reload();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
