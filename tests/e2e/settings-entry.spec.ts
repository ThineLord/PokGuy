import { expect, test, type Locator, type Page } from "@playwright/test";

async function storedTableSettings(page: Page) {
  return page.evaluate(() => {
    const serialized = window.localStorage.getItem("riverlab-poker-v2");
    if (!serialized) return null;
    const stored = JSON.parse(serialized) as {
      settings?: {
        startingStackBb?: number;
        smallBlind?: number;
        bigBlind?: number;
      };
    };
    return stored.settings ?? null;
  });
}

async function replaceByTyping(field: Locator, text: string) {
  await field.click();
  await field.press("ControlOrMeta+a");
  if (text === "") await field.press("Backspace");
  else await field.pressSequentially(text);
  await field.press("Tab");
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("德州扑克牌桌")).toBeVisible();
  await page.getByRole("button", { name: "设置" }).click();
});

test("typed stack and fractional blinds replace the stored table settings", async ({
  page,
}) => {
  const stack = page.getByLabel("初始筹码（BB）");
  const smallBlind = page.getByLabel("小盲");
  const bigBlind = page.getByLabel("大盲");
  const handBlind = page.getByLabel("小盲，0.5 BB");

  await stack.click();
  await stack.press("ControlOrMeta+a");
  await stack.pressSequentially("7");
  await expect(stack).toHaveValue("7");
  expect((await storedTableSettings(page))?.startingStackBb ?? 100).toBe(100);
  await stack.pressSequentially("5");
  await stack.press("Tab");
  await expect(stack).toHaveValue("75");
  expect(await storedTableSettings(page)).toMatchObject({
    startingStackBb: 75,
    smallBlind: 0.5,
    bigBlind: 1,
  });

  await smallBlind.click();
  await smallBlind.press("ControlOrMeta+a");
  await smallBlind.pressSequentially("0.");
  await expect(smallBlind).toHaveValue(/^0\.?$/);
  expect((await storedTableSettings(page))?.smallBlind ?? 0.5).toBe(0.5);
  await smallBlind.pressSequentially("25");
  await smallBlind.press("Tab");
  await expect(smallBlind).toHaveValue("0.25");
  expect(await storedTableSettings(page)).toMatchObject({
    startingStackBb: 75,
    smallBlind: 0.25,
    bigBlind: 1,
  });

  await replaceByTyping(bigBlind, "2");
  await expect(bigBlind).toHaveValue("2");
  expect(await storedTableSettings(page)).toMatchObject({ bigBlind: 2 });

  await page.getByRole("button", { name: "训练桌" }).click();
  await expect(handBlind).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("德州扑克牌桌")).toBeVisible();
  await page.getByRole("button", { name: "设置" }).click();
  await expect(page.getByLabel("初始筹码（BB）")).toHaveValue("75");
  await expect(page.getByLabel("小盲")).toHaveValue("0.25");
  await expect(page.getByLabel("大盲")).toHaveValue("2");

  await replaceByTyping(page.getByLabel("初始筹码（BB）"), "7");
  await expect(page.getByLabel("初始筹码（BB）")).toHaveValue("75");
  await replaceByTyping(page.getByLabel("小盲"), "");
  await expect(page.getByLabel("小盲")).toHaveValue("0.25");
  await replaceByTyping(page.getByLabel("大盲"), "0.1");
  await expect(page.getByLabel("大盲")).toHaveValue("2");
  await expect(page.getByLabel("小盲")).toHaveValue("0.25");
  expect(await storedTableSettings(page)).toMatchObject({
    startingStackBb: 75,
    smallBlind: 0.25,
    bigBlind: 2,
  });
});
