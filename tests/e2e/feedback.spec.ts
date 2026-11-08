import { test, expect } from "@playwright/test";
test("a river shove is reviewed using its pre-action context @webkit", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "单手牌" }).click();
  await page.getByLabel("对手数量").fill("1");
  await page.getByLabel("你的底牌").fill("3C 4D");
  await page
    .getByRole("combobox", { name: "起始街", exact: true })
    .selectOption("river");
  await page.getByLabel("公共牌").fill("AS KS QS JS 2H");
  await page.getByLabel("位置").selectOption("BB");
  await page.getByRole("button", { name: "开始此训练" }).click();
  await page.getByRole("button", { name: /^全押/ }).click();
  await expect(page.getByText("本手正式结束")).toBeVisible();
  await page.getByRole("button", { name: "历史与复盘" }).click();
  await expect(page.locator(".review-grade")).toContainText("尺度异常");
  await expect(page.getByText(/行动前筹码/)).toBeVisible();
  await expect(page.getByText(/行动前粗略胜率/)).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "历史与复盘" }).click();
  await expect(page.locator(".review-grade")).toContainText("尺度异常");
});
test("uncovered decisions are explicitly not assessed @webkit", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "弃牌", exact: true }).click();
  await page.getByRole("button", { name: "历史与复盘" }).click();
  await expect(page.locator(".review-grade")).toContainText("未充分评估");
  await expect(page.getByText(/当前启发式信息不足/)).toBeVisible();
});
