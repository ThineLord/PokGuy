import { test, expect } from "@playwright/test";
import { appendCompletedHand, defaultData } from "../../src/storage/storage";
import {
  act,
  startHand,
  startTrainingScenario,
} from "../../src/engine/state/gameState";
test("cash and scenario counters stay separate across reload @webkit", async ({
  page,
}) => {
  const players = [
    { id: "hero", name: "Hero", seat: 0, stack: 100, kind: "human" as const },
    { id: "ai", name: "AI", seat: 1, stack: 100, kind: "ai" as const },
  ];
  const options = {
    players,
    dealerSeat: 0,
    smallBlind: 0.5,
    bigBlind: 1,
    seed: 9,
  };
  const cash = startHand({ ...options, handId: "hand-scope" });
  let data = appendCompletedHand(
    defaultData(),
    act(cash, "hero", { type: "fold" }),
    "hero",
  );
  let scenario = startTrainingScenario({
    ...options,
    heroId: "hero",
    startStreet: "river",
    handId: "scenario-scope",
  });
  scenario = act(scenario, scenario.actingPlayerId!, { type: "check" });
  scenario = act(scenario, scenario.actingPlayerId!, { type: "check" });
  data = appendCompletedHand(data, scenario, "hero");
  data.settings.autoAi = false;
  await page.addInitScript(
    (data) =>
      !localStorage.getItem("riverlab-poker-v2") &&
      localStorage.setItem("riverlab-poker-v2", JSON.stringify(data)),
    data,
  );
  await page.goto("/");
  await page.getByRole("button", { name: /统计/ }).click();
  await expect(page.getByText(/VPIP 0\/1/)).toBeVisible();
  await page.getByLabel("统计范围").selectOption("scenario");
  await expect(page.getByText(/VPIP 0\/0/)).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /统计/ }).click();
  await expect(page.getByText(/VPIP 0\/1/)).toBeVisible();
  await page.getByLabel("统计范围").selectOption("legacy");
  await expect(page.getByText(/旧版统计无法可靠拆分/)).toBeVisible();
});

for (const locale of ["zh-CN", "en"] as const) {
  test(`opponent estimates after a hand with no opponent action in ${locale} @webkit`, async ({
    page,
  }) => {
    const zh = locale === "zh-CN";
    await page.addInitScript((language) => {
      localStorage.setItem("riverlab-locale", language);
    }, locale);
    await page.goto("/");
    const settings = page.getByRole("button", {
      name: zh ? "设置" : "Settings",
      exact: true,
    });
    await settings.click();
    const heading = page.locator(".profile-editor-heading");
    await expect(heading).toContainText(
      zh
        ? "尚无此对手的牌局记录。"
        : "No hands recorded for this opponent yet.",
    );
    await expect(heading).not.toContainText("VPIP");

    await page.getByLabel(zh ? "桌面人数" : "Table size").selectOption("2");
    await page
      .getByRole("button", {
        name: zh ? "训练桌" : "Training table",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: zh ? "重新开局" : "Restart session" })
      .click();
    await page
      .getByRole("button", { name: zh ? "弃牌" : "Fold", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: zh ? "下一手" : "Next hand" }),
    ).toBeVisible();

    await settings.click();
    await expect(heading).toContainText(zh ? "已记录 1 手" : "1 hand recorded");
    await expect(heading).toContainText(
      zh ? "估计值（含初始值）" : "Estimates (including starting values)",
    );
    await expect(heading).toContainText("VPIP 21% · PFR 17% · AF 1.4");
  });
}
