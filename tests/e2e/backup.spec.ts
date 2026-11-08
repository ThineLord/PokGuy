import { test, expect } from "@playwright/test";
import { appendCompletedHand, defaultData } from "../../src/storage/storage";
import { act, startHand } from "../../src/engine/state/gameState";
import { createBackup } from "../../src/storage/backup";
const key = "riverlab-poker-v2";
function populated() {
  const game = startHand({
    players: [
      { id: "hero", name: "Backup Hero", seat: 0, stack: 100, kind: "human" },
      { id: "ai", name: "AI", seat: 1, stack: 100, kind: "ai" },
    ],
    dealerSeat: 0,
    smallBlind: 0.5,
    bigBlind: 1,
    seed: 9,
    handId: "hand-backup",
  });
  const data = appendCompletedHand(
    defaultData(),
    act(game, "hero", { type: "fold" }),
    "hero",
  );
  data.settings.playerName = "Backup Hero";
  data.settings.autoAi = false;
  data.playerNotes[game.handId] = "Keep this note";
  data.trainingRecords = [
    { handId: game.handId, createdAt: new Date().toISOString(), grade: "偏紧" },
  ];
  return data;
}
test("full backup download, preview, cancel and restore in a fresh browser @webkit", async ({
  page,
  browser,
}) => {
  const source = populated();
  await page.addInitScript(
    ({ key, source }) => localStorage.setItem(key, JSON.stringify(source)),
    { key, source },
  );
  await page.goto("/");
  await page.getByRole("button", { name: /设置/ }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出完整备份" }).click();
  const file = await (await download).path();
  expect(file).toBeTruthy();
  const context = await browser.newContext();
  const fresh = await context.newPage();
  await fresh.goto("/");
  await fresh.getByRole("button", { name: /设置/ }).click();
  await fresh.getByLabel("选择备份文件").setInputFiles(file!);
  await expect(fresh.getByLabel("恢复预览")).toContainText("Backup Hero");
  await fresh.getByRole("button", { name: "取消", exact: true }).click();
  expect(
    await fresh.evaluate((key) => localStorage.getItem(key), key),
  ).toBeNull();
  await fresh.getByLabel("选择备份文件").setInputFiles(file!);
  await fresh.getByRole("button", { name: "确认恢复" }).click();
  await expect(fresh.getByText("备份已恢复并保存。")).toBeVisible();
  await fresh.reload();
  expect(
    await fresh.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key),
  ).toEqual(source);
  await fresh.getByRole("button", { name: /设置/ }).click();
  await fresh.getByLabel("选择备份文件").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from("[]"),
  });
  await expect(
    fresh.getByText("文件无效、不兼容或超过 10 MB。未修改现有数据。"),
  ).toBeVisible();
  expect(
    await fresh.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key),
  ).toEqual(source);
  await context.close();
});
test("quota failure stays visible, rescue export includes memory changes, retry survives reload @webkit", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /设置/ }).click();
  await page.evaluate((key) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === key) throw new DOMException("full", "QuotaExceededError");
      return original.call(this, k, v);
    };
    (window as unknown as { restore: () => void }).restore = () => {
      Storage.prototype.setItem = original;
    };
  }, key);
  await page.getByLabel("玩家名称").fill("Rescue Hero");
  await expect(page.getByRole("alert")).toContainText("更改尚未保存");
  const download = page.waitForEvent("download");
  await page
    .getByRole("alert")
    .getByRole("button", { name: "导出完整备份" })
    .click();
  const stream = await (await download).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  expect(
    JSON.parse(Buffer.concat(chunks).toString()).data.settings.playerName,
  ).toBe("Rescue Hero");
  await page.evaluate(() => {
    (window as unknown as { restore: () => void }).restore();
  });
  await page.getByRole("button", { name: "重试保存" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.reload();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).settings.playerName,
      key,
    ),
  ).toBe("Rescue Hero");
});
test("restore failure retains the previous dataset @webkit", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /设置/ }).click();
  const before = await page.evaluate((key) => localStorage.getItem(key), key);
  await page.getByLabel("选择备份文件").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify(
        createBackup(populated(), { locale: "zh-CN", theme: "dark" }),
      ),
    ),
  });
  await page.evaluate((key) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === key) throw new DOMException("full", "QuotaExceededError");
      return original.call(this, k, v);
    };
  }, key);
  await page.getByRole("button", { name: "确认恢复" }).click();
  await expect(page.getByText(/恢复未完成/)).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    before,
  );
});

test("legacy settings confirmation preserves the active hand @webkit", async ({
  page,
}) => {
  const source = populated();
  await page.addInitScript(
    ({ key, source }) => localStorage.setItem(key, JSON.stringify(source)),
    { key, source },
  );
  await page.goto("/");
  await expect(page.locator('.seat[data-seat="0"] .playing-card')).toHaveCount(
    2,
  );
  const oldCards = await page
    .locator('.seat[data-seat="0"] .playing-card')
    .allTextContents();
  await page.getByRole("button", { name: /设置/ }).click();
  await page.getByLabel("选择备份文件").setInputFiles({
    name: "settings.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        version: 2,
        settings: { ...source.settings, playerName: "Next Hand Name" },
        aiProfiles: source.aiProfiles,
      }),
    ),
  });
  await page.getByRole("button", { name: "确认恢复" }).click();
  await page.getByRole("button", { name: /训练桌/ }).click();
  await expect(
    page.locator('.seat[data-seat="0"] .seat-topline'),
  ).toContainText("Backup Hero");
  expect(
    await page.locator('.seat[data-seat="0"] .playing-card').allTextContents(),
  ).toEqual(oldCards);
});
