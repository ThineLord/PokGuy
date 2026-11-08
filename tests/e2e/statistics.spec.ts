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
    (data) => localStorage.setItem("riverlab-poker-v2", JSON.stringify(data)),
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
