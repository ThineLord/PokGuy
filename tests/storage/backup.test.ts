import {
  createBackup,
  parseBackup,
  prepareRestore,
  restoreBackup,
} from "@/src/storage/backup";
import {
  appendCompletedHand,
  defaultData,
  STORAGE_KEY,
} from "@/src/storage/storage";
import { act, startHand } from "@/src/engine/state/gameState";
const prefs = { locale: "en", theme: "dark" } as const;
function sample() {
  const game = startHand({
    players: [
      { id: "hero", name: "Hero", seat: 0, stack: 100, kind: "human" },
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
  data.playerNotes[game.handId] = "Review later";
  data.trainingRecords = [
    { handId: game.handId, createdAt: new Date().toISOString(), grade: "偏紧" },
  ];
  return data;
}
it("round trips every persisted field and preferences without depending on key order", () => {
  const data = sample();
  const backup = createBackup(data, prefs);
  const reordered = {
    ...backup,
    data: Object.fromEntries(Object.entries(data).reverse()),
  };
  expect(
    parseBackup(JSON.stringify(reordered), defaultData(), prefs).backup,
  ).toEqual(backup);
});
it("rejects future formats, invalid records, and legacy hand exports without mutating current data", () => {
  const data = sample();
  const before = JSON.stringify(data);
  const backup = createBackup(data, prefs);
  for (const raw of [
    { ...backup, formatVersion: 2 },
    { ...backup, data: { ...data, trainingRecords: [{ grade: "bogus" }] } },
    data.recentHands,
  ])
    expect(() => parseBackup(JSON.stringify(raw), data, prefs)).toThrow();
  expect(JSON.stringify(data)).toBe(before);
});
it("recognizes settings-only exports explicitly and preserves history", () => {
  const data = sample();
  const result = parseBackup(
    JSON.stringify({
      version: 2,
      settings: { ...data.settings, playerName: "Restored" },
      aiProfiles: data.aiProfiles,
    }),
    data,
    prefs,
  );
  expect(result.legacy).toBe(true);
  expect(result.backup.data.settings.playerName).toBe("Restored");
  expect(result.backup.data.recentHands).toEqual(data.recentHands);
});
it("rolls back preferences after a quota error and permits a successful retry", () => {
  const old = defaultData();
  const values = new Map([
    [STORAGE_KEY, JSON.stringify(old)],
    ["riverlab-locale", "zh-CN"],
  ]);
  let fail = true;
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      if (key === STORAGE_KEY && fail)
        throw new DOMException("quota", "QuotaExceededError");
      values.set(key, value);
    },
  };
  const backup = createBackup(sample(), prefs);
  expect(restoreBackup(backup, storage)).toBe("failed");
  expect(values.size).toBe(2);
  expect(values.get("riverlab-locale")).toBe("zh-CN");
  expect(values.get(STORAGE_KEY)).toBe(JSON.stringify(old));
  fail = false;
  expect(restoreBackup(backup, storage)).toBe("saved");
  expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(backup.data);
});

it("legacy confirmation preserves records created after its preview", () => {
  const data = defaultData();
  const preview = parseBackup(
    JSON.stringify({
      version: 2,
      settings: data.settings,
      aiProfiles: data.aiProfiles,
    }),
    data,
    prefs,
  );
  const latest = sample();
  const result = prepareRestore(preview, latest, {
    locale: "zh-CN",
    theme: "light",
  });
  expect(result.data.recentHands).toEqual(latest.recentHands);
  expect(result.data.playerNotes).toEqual(latest.playerNotes);
  expect(result.data.trainingRecords).toEqual(latest.trainingRecords);
  expect(result.preferences.theme).toBe("light");
});

it("reports incomplete rollback and repairs every field on a complete retry", () => {
  const values = new Map([
    ["riverlab-locale", "zh-CN"],
    ["pokguy-theme", "light"],
    [STORAGE_KEY, JSON.stringify(defaultData())],
  ]);
  let broken = true;
  let localeWritten = false;
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      if (
        broken &&
        (key === "pokguy-theme" || (key === "riverlab-locale" && localeWritten))
      )
        throw new Error("storage failure");
      values.set(key, value);
      if (key === "riverlab-locale") localeWritten = true;
    },
  };
  expect(restoreBackup(createBackup(sample(), prefs), storage)).toBe(
    "rollback-failed",
  );
  broken = false;
  const current = createBackup(defaultData(), {
    locale: "zh-CN",
    theme: "light",
  });
  expect(restoreBackup(current, storage)).toBe("saved");
  expect(values.get("riverlab-locale")).toBe("zh-CN");
  expect(values.get("pokguy-theme")).toBe("light");
  expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(current.data);
});
