import { expect, test, type Page } from "@playwright/test";

const key = "riverlab-poker-v2";

async function openApp(page: Page) {
  await page.goto("/");
  await expect(page.getByLabel("德州扑克牌桌")).toBeVisible();
}

async function completeTwoPlayerFold(page: Page) {
  await page.getByRole("button", { name: "设置" }).click();
  await page.getByLabel("桌面人数").selectOption("2");
  await page.getByRole("button", { name: "训练桌" }).click();
  await page.getByRole("button", { name: "重新开局" }).click();
  await page.getByRole("button", { name: "弃牌" }).click();
  await expect(page.getByRole("button", { name: "下一手" })).toBeVisible({
    timeout: 20_000,
  });
  await expect
    .poll(async () =>
      page.evaluate((storageKey) => {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return false;
        const data = JSON.parse(raw);
        return (
          data.recentHands?.length === 1 &&
          data.trainingRecords?.length === 1 &&
          data.stats?.hands === 1 &&
          typeof data.recentHands[0]?.id === "string" &&
          data.recentHands[0].id.length > 0
        );
      }, key),
    )
    .toBe(true);
  return page.evaluate((storageKey) => {
    const data = JSON.parse(localStorage.getItem(storageKey)!);
    return {
      raw: localStorage.getItem(storageKey)!,
      id: data.recentHands[0].id as string,
    };
  }, key);
}

test.describe("stale same-origin tabs", () => {
  test.setTimeout(90_000);

  test("a settings edit in a stale tab keeps the hand committed by the other tab", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const tabA = await context.newPage();
    const tabB = await context.newPage();
    await openApp(tabA);
    await openApp(tabB);
    await tabB.getByRole("button", { name: "设置" }).click();
    await expect(tabB.getByLabel("玩家名称")).toHaveValue("Hero");

    const committed = await completeTwoPlayerFold(tabA);
    await tabB.getByLabel("玩家名称").fill("Stale Hero");
    await expect
      .poll(async () =>
        tabB.evaluate((storageKey) => {
          const data = JSON.parse(localStorage.getItem(storageKey)!);
          return {
            name: data.settings.playerName as string,
            hands: data.recentHands.length as number,
            training: data.trainingRecords.length as number,
            stats: data.stats.hands as number,
            id: data.recentHands[0].id as string,
          };
        }, key),
      )
      .toEqual({
        name: "Stale Hero",
        hands: 1,
        training: 1,
        stats: 1,
        id: committed.id,
      });
    await expect(tabB.getByRole("alert")).toHaveCount(0);

    await tabB.getByRole("button", { name: "历史与复盘" }).click();
    await expect(tabB.getByText("逐街复盘")).toBeVisible();
    await tabB.getByLabel("玩家笔记").fill("仍保留这一手");
    await expect
      .poll(async () =>
        tabB.evaluate((storageKey) => {
          const data = JSON.parse(localStorage.getItem(storageKey)!);
          return {
            note: data.playerNotes[data.recentHands[0].id] as string,
            hands: data.recentHands.length as number,
            id: data.recentHands[0].id as string,
          };
        }, key),
      )
      .toEqual({
        note: "仍保留这一手",
        hands: 1,
        id: committed.id,
      });

    await tabA.reload();
    await tabA.getByRole("button", { name: "历史与复盘" }).click();
    await expect(tabA.getByText("逐街复盘")).toBeVisible();
    await expect(
      tabA.getByText("完成一手牌后，行动和底池变化会保存在这里。"),
    ).toHaveCount(0);
    await expect(tabA.getByLabel("玩家笔记")).toHaveValue("仍保留这一手");
    await context.close();
  });

  test("a stale settlement does not replace the newer hand, and retry keeps it", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const tabA = await context.newPage();
    const tabB = await context.newPage();
    await openApp(tabA);
    await openApp(tabB);
    const committed = await completeTwoPlayerFold(tabA);

    await tabB.getByRole("button", { name: "弃牌" }).click();
    await expect(tabB.getByRole("button", { name: "下一手" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(tabB.getByRole("alert")).toContainText("另一个标签页");
    await tabB.getByRole("button", { name: "历史与复盘" }).click();
    await expect(tabB.getByText("逐街复盘")).toBeVisible();

    const download = tabB.waitForEvent("download");
    await tabB
      .getByRole("alert")
      .getByRole("button", { name: "导出完整备份" })
      .click();
    const stream = await (await download).createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream!) chunks.push(chunk);
    const backup = JSON.parse(Buffer.concat(chunks).toString());
    expect(backup.format).toBe("pokguy-backup");
    expect(backup.formatVersion).toBe(1);
    expect(backup.data.version).toBe(2);
    expect(backup.data.recentHands.length).toBeGreaterThan(0);
    expect(backup.data.recentHands[0].id).not.toBe(committed.id);

    const beforeRetry = await tabB.evaluate(
      (storageKey) => localStorage.getItem(storageKey),
      key,
    );
    expect(JSON.parse(beforeRetry!).recentHands[0].id).toBe(committed.id);
    await tabB.getByRole("button", { name: "重试保存" }).click();
    await expect(tabB.getByRole("alert")).toContainText("重试不会覆盖");
    expect(
      await tabB.evaluate(
        (storageKey) => localStorage.getItem(storageKey),
        key,
      ),
    ).toBe(beforeRetry);

    await tabB.reload();
    await tabB.getByRole("button", { name: "历史与复盘" }).click();
    await expect(tabB.getByText("逐街复盘")).toBeVisible();
    await expect(
      tabB.getByText("完成一手牌后，行动和底池变化会保存在这里。"),
    ).toHaveCount(0);
    expect(
      await tabB.evaluate(
        (storageKey) =>
          JSON.parse(localStorage.getItem(storageKey)!).recentHands[0].id,
        key,
      ),
    ).toBe(committed.id);
    await context.close();
  });

  test("an edit after a full restore from the other tab keeps that hand", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const tabA = await context.newPage();
    const tabB = await context.newPage();
    await openApp(tabA);
    await openApp(tabB);
    const committed = await completeTwoPlayerFold(tabA);
    await tabA.getByRole("button", { name: "设置" }).click();
    const download = tabA.waitForEvent("download");
    await tabA.getByRole("button", { name: "导出完整备份" }).click();
    const file = await (await download).path();
    expect(file).toBeTruthy();

    await tabB.getByRole("button", { name: "设置" }).click();
    const beforeCancel = await tabB.evaluate(
      (storageKey) => localStorage.getItem(storageKey),
      key,
    );
    await tabB.getByLabel("选择备份文件").setInputFiles(file!);
    await expect(tabB.getByLabel("恢复预览")).toBeVisible();
    await tabB.getByRole("button", { name: "取消", exact: true }).click();
    expect(
      await tabB.evaluate(
        (storageKey) => localStorage.getItem(storageKey),
        key,
      ),
    ).toBe(beforeCancel);
    await expect(tabB.getByLabel("恢复预览")).toHaveCount(0);

    await tabB.getByLabel("选择备份文件").setInputFiles(file!);
    await tabB.getByRole("button", { name: "确认恢复" }).click();
    await expect(tabB.getByText("备份已恢复并保存。")).toBeVisible();
    await tabB.getByLabel("玩家名称").fill("Restored Hero");
    await expect
      .poll(async () =>
        tabB.evaluate((storageKey) => {
          const data = JSON.parse(localStorage.getItem(storageKey)!);
          return {
            name: data.settings.playerName as string,
            hands: data.recentHands.length as number,
            training: data.trainingRecords.length as number,
            stats: data.stats.hands as number,
            id: data.recentHands[0].id as string,
          };
        }, key),
      )
      .toEqual({
        name: "Restored Hero",
        hands: 1,
        training: 1,
        stats: 1,
        id: committed.id,
      });

    await tabA.getByLabel("玩家名称").fill("Older Tab");
    await expect(tabA.getByRole("alert")).toContainText("另一个标签页");
    const protectedRaw = await tabA.evaluate(
      (storageKey) => localStorage.getItem(storageKey),
      key,
    );
    expect(JSON.parse(protectedRaw!).settings.playerName).toBe("Restored Hero");
    expect(JSON.parse(protectedRaw!).recentHands[0].id).toBe(committed.id);
    await tabA.getByRole("button", { name: "重试保存" }).click();
    expect(
      await tabA.evaluate(
        (storageKey) => localStorage.getItem(storageKey),
        key,
      ),
    ).toBe(protectedRaw);

    await tabB.reload();
    await tabB.getByRole("button", { name: "历史与复盘" }).click();
    await expect(tabB.getByText("逐街复盘")).toBeVisible();
    await expect(
      tabB.getByText("完成一手牌后，行动和底池变化会保存在这里。"),
    ).toHaveCount(0);
    await context.close();
  });
});
