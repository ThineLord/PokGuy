import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("德州扑克牌桌")).toBeVisible();
});

test("start a hand, fold, open history and replay", async ({ page }) => {
  await page.getByRole("button", { name: "Fold" }).waitFor({ state: "visible" });
  while (await page.getByRole("button", { name: "Fold" }).isDisabled()) {
    await page.waitForTimeout(100);
  }
  await page.getByRole("button", { name: "Fold" }).click();
  await expect(page.getByRole("button", { name: "下一手" })).toBeVisible();
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

test("enter a deterministic river scenario and reach showdown", async ({ page }) => {
  await page.getByRole("button", { name: "单手牌" }).click();
  await page.getByLabel("你的底牌").fill("AS AH");
  await page.getByLabel("起始街").selectOption("river");
  await page.getByLabel("公共牌").fill("2C 7D 9S JC 3H");
  await page.getByLabel("位置").selectOption("BTN");
  await page.getByLabel("对手数量").fill("1");
  await page.getByRole("button", { name: "开始此训练" }).click();
  await expect(page.getByText("RIVER", { exact: true })).toBeVisible();
  const check = page.getByRole("button", { name: "Check" });
  const call = page.getByRole("button", { name: /^Call/ });
  await expect.poll(async () => !(await check.isDisabled()) || !(await call.isDisabled()), { timeout: 10_000 }).toBe(true);
  if (!(await check.isDisabled())) await check.click(); else await call.click();
  await expect(page.getByText("摊牌完成")).toBeVisible();
});

test("edit AI settings, persist after reload, and export hands", async ({ page }) => {
  await page.getByRole("button", { name: "设置" }).click();
  await page.getByLabel("玩家名称").fill("River Hero");
  await page.getByLabel("玩家名称").press("Tab");
  await page.reload();
  await page.getByRole("button", { name: "设置" }).click();
  await expect(page.getByLabel("玩家名称")).toHaveValue("River Hero");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出牌局记录" }).click();
  await expect((await download).suggestedFilename()).toBe("riverlab-hands.json");
});
