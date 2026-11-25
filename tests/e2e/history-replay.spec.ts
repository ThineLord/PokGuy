import { expect, test, type Page } from "@playwright/test";
import { STORAGE_KEY } from "../../src/storage/storage";
import { timelineHistory } from "../fixtures/replayHands";

const CHINESE_RUNOUT = ["9 方片", "9 红桃", "K 方片", "3 红桃", "8 红桃"];
const ENGLISH_RUNOUT = [
  "9 diamonds",
  "9 hearts",
  "K diamonds",
  "3 hearts",
  "8 hearts",
];

const seeded = timelineHistory();
if (seeded.recentHands.length < 2)
  throw new Error("Timeline fixture is missing a hand");

async function boardLabels(page: Page) {
  return page
    .locator(".replay-board .playing-card")
    .evaluateAll((cards) =>
      cards.map((card) => card.getAttribute("aria-label") ?? ""),
    );
}

async function openHistory(page: Page) {
  await page.goto("/");
  await page.evaluate(
    ({ key, data }) => localStorage.setItem(key, JSON.stringify(data)),
    { key: STORAGE_KEY, data: seeded },
  );
  await page.reload();
  const history = page.getByRole("button", { name: "历史与复盘" });
  await expect(history).toBeEnabled();
  await history.click();
  await expect(page.getByText("逐街复盘")).toBeVisible();
}

test("replays a saved shove, call, and runout, then switches hands", async ({
  page,
}) => {
  await openHistory(page);
  const savedGames = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    const data = JSON.parse(raw ?? "{}") as {
      recentHands?: Array<{ id: string; game: unknown }>;
    };
    return JSON.stringify(data.recentHands?.map((hand) => hand.game) ?? []);
  }, STORAGE_KEY);
  const event = page.locator(".replay-event");
  const step = page.locator(".replay-controls span");

  await expect(step).toHaveText("0/3");
  await expect(event).toContainText("起始状态");
  await expect(event).not.toContainText("全押");
  await expect(event).not.toContainText("1.5 BB → 11 BB");
  await expect.poll(() => boardLabels(page)).toEqual([]);

  await page.getByRole("button", { name: "下一步" }).click();
  await expect(step).toHaveText("1/3");
  await expect(event).toContainText("全押");
  await expect(event).toContainText("1.5 BB → 11 BB");
  await expect(event).not.toContainText("跟注");
  await expect.poll(() => boardLabels(page)).toEqual([]);

  await page.getByRole("button", { name: "下一步" }).click();
  await expect(step).toHaveText("2/3");
  await expect(event).toContainText("跟注");
  await expect(event).not.toContainText("全押");
  await expect(event).not.toContainText("1.5 BB → 11 BB");
  await expect.poll(() => boardLabels(page)).toEqual([]);

  await page.getByRole("button", { name: "下一步" }).click();
  await expect(step).toHaveText("3/3");
  await expect(event).toContainText("终局公共牌");
  await expect(event).toContainText("公共牌已发完");
  await expect(event).not.toContainText("跟注");
  await expect.poll(() => boardLabels(page)).toEqual(CHINESE_RUNOUT);
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(step).toHaveText("3/3");

  await page.locator(".history-item").nth(1).click();
  await expect(step).toHaveText("0/1");
  await expect(event).toContainText("起始状态");
  await expect(event).not.toContainText("2/1");
  await expect.poll(() => boardLabels(page)).toEqual([]);
  await expect(page.getByRole("button", { name: "自动播放" })).toBeVisible();

  await page.locator(".history-item").nth(0).click();
  await expect(step).toHaveText("0/3");
  await page.getByRole("button", { name: "自动播放" }).click();
  await expect
    .poll(async () => {
      const label = (await step.textContent()) ?? "";
      const paused = await page.getByRole("button", { name: "暂停" }).count();
      return `${label}|${paused}`;
    })
    .toBe("3/3|0");
  await expect.poll(() => boardLabels(page)).toEqual(CHINESE_RUNOUT);
  await page.waitForTimeout(800);
  await expect(step).toHaveText("3/3");

  await page.locator(".history-item").nth(1).click();
  await expect(step).toHaveText("0/1");
  await page.locator(".history-item").nth(0).click();
  await expect(step).toHaveText("0/3");
  await page.getByRole("button", { name: "自动播放" }).click();
  await page.getByRole("button", { name: "待复查", exact: true }).click();
  await expect(step).toHaveText("0/1");
  await expect(event).toContainText("起始状态");
  await expect(page.getByRole("button", { name: "暂停" })).toHaveCount(0);
  await page.waitForTimeout(900);
  await expect(step).toHaveText("0/1");
  await expect(page.locator(".history-item")).toHaveCount(1);

  await page.getByRole("button", { name: "切换到英文" }).click();
  await expect(step).toHaveText("0/1");
  await expect(event).toContainText("Starting state");
  await expect(event).toContainText("Blinds");
  await expect(page.getByRole("button", { name: "Autoplay" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
  await page.getByRole("button", { name: "All", exact: true }).click();
  await page.locator(".history-item").nth(0).click();
  await expect(step).toHaveText("0/3");
  await expect(event).not.toContainText("All-in");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(step).toHaveText("1/3");
  await expect(event).toContainText("All-in");
  await expect(event).toContainText("Pot 1.5 BB → 11 BB");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(step).toHaveText("2/3");
  await expect(event).toContainText("Call");
  await expect(event).not.toContainText("All-in");
  await expect.poll(() => boardLabels(page)).toEqual([]);
  await page.getByRole("button", { name: "Next" }).click();
  await expect(step).toHaveText("3/3");
  await expect(event).toContainText("Final board");
  await expect(event).toContainText("Public cards dealt");
  await expect.poll(() => boardLabels(page)).toEqual(ENGLISH_RUNOUT);

  const playedGames = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    const data = JSON.parse(raw ?? "{}") as {
      recentHands?: Array<{ game: unknown }>;
    };
    return JSON.stringify(data.recentHands?.map((hand) => hand.game) ?? []);
  }, STORAGE_KEY);
  expect(playedGames).toBe(savedGames);
});
