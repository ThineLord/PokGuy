import { test, expect } from "@playwright/test";
import { defaultData } from "../../src/storage/storage";
test("seat details expose readable public info and return keyboard focus @webkit", async ({
  page,
}) => {
  const data = defaultData();
  data.settings.autoAi = false;
  data.settings.bigBlind = 2;
  data.settings.smallBlind = 1;
  data.settings.playerName = "A deliberately long player name";
  await page.addInitScript(
    (data) => localStorage.setItem("riverlab-poker-v2", JSON.stringify(data)),
    data,
  );
  await page.goto("/");
  for (const width of [393, 320]) {
    await page.setViewportSize({ width, height: 852 });
    const trigger = page.getByRole("button", {
      name: "查看座位详情 A deliberately long player name",
    });
    await expect(trigger).toBeVisible();
    const box = await trigger.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(
      await page
        .locator('.seat[data-seat="0"] .seat-topline strong')
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(11);
    await expect(
      page.locator('.seat[data-seat="0"] .seat-meta span').first(),
    ).toHaveText("100 BB");
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading")).toHaveText(
      "A deliberately long player name",
    );
    await expect(dialog.locator(".playing-card")).toHaveCount(0);
    await expect(dialog.locator("dd").first()).toHaveText("100 BB");
    await page.keyboard.press("f");
    await expect(dialog).toBeVisible();
    await expect(page.locator(".complete-bar")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 393) await page.keyboard.press("Escape");
    else await dialog.getByRole("button", { name: "关闭座位详情" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
});
