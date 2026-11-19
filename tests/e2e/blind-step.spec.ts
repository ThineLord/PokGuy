import { expect, test } from "@playwright/test";
import { defaultData } from "../../src/storage/storage";

test("native blind step advances one chip and keeps the entered total", async ({
  page,
}) => {
  const fixture = defaultData();
  fixture.settings.seatCount = 2;
  fixture.settings.smallBlind = 1;
  fixture.settings.bigBlind = 3;
  fixture.settings.autoAi = false;
  fixture.settings.animations = false;
  await page.goto("/");
  await page.evaluate(
    (data) => localStorage.setItem("riverlab-poker-v2", JSON.stringify(data)),
    fixture,
  );
  await page.reload();
  const wager = page.getByLabel("下注总额");
  const slider = page.getByLabel("下注滑杆");
  await expect(wager).toBeVisible();
  await wager.fill(String(6.01 / 3));
  await expect
    .poll(async () =>
      wager.evaluate((input) => {
        const field = input as HTMLInputElement;
        return Number((field.valueAsNumber * 3).toFixed(2));
      }),
    )
    .toBe(6.01);
  expect(
    await wager.evaluate(
      (input) => (input as HTMLInputElement).validity.stepMismatch,
    ),
  ).toBe(false);
  expect(
    await slider.evaluate((input) =>
      Number(((input as HTMLInputElement).valueAsNumber * 3).toFixed(2)),
    ),
  ).toBe(6.01);
  await wager.focus();
  await wager.press("ArrowUp");
  await expect
    .poll(async () =>
      wager.evaluate((input) => {
        const field = input as HTMLInputElement;
        return Number((field.valueAsNumber * 3).toFixed(2));
      }),
    )
    .toBe(6.02);
  expect(
    await slider.evaluate((input) =>
      Number(((input as HTMLInputElement).valueAsNumber * 3).toFixed(2)),
    ),
  ).toBe(6.02);
});
