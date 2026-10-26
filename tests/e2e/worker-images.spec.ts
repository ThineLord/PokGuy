import { expect, test } from "@playwright/test";

test("Worker optimizes a real static PNG through ASSETS and IMAGES", async ({
  page,
  request,
}) => {
  const source = await request.get("/og.png");
  expect(source.status()).toBe(200);
  expect(source.headers()["content-type"]).toContain("image/png");
  const original = await source.body();

  const path = "/_vinext/image?url=%2Fog.png&w=64&q=75";
  const response = await request.get(path, {
    headers: { Accept: "image/webp" },
  });
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/webp");
  const optimized = await response.body();
  expect(optimized.subarray(0, 4).toString()).toBe("RIFF");
  expect(optimized.subarray(8, 12).toString()).toBe("WEBP");
  expect(optimized.equals(original)).toBe(false);

  // Decode the returned bytes in Chromium: a 200 passthrough is insufficient.
  await page.goto("/");
  const dimensions = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/webp;base64,${base64}`;
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  }, optimized.toString("base64"));
  expect(dimensions.width).toBe(64);
  expect(dimensions.height).toBeGreaterThan(0);
});

test("Worker image route rejects unsafe inputs and preserves missing-asset status", async ({
  request,
}) => {
  for (const [path, status] of [
    ["/_vinext/image?url=%2Ffavicon.svg&w=64&q=75", 400],
    ["/_vinext/image?url=https%3A%2F%2Fexample.com%2Fa.png&w=64&q=75", 400],
    ["/_vinext/image?url=%2Fmissing-image.png&w=64&q=75", 404],
    ["/_vinext/image?url=%2Fog.png&w=63&q=75", 400],
  ] as const) {
    const response = await request.get(path, {
      headers: { Accept: "image/webp" },
    });
    expect(response.status(), path).toBe(status);
  }
});
