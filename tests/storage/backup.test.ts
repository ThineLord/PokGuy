import {
  createBackup,
  parseBackup,
  prepareRestore,
  readRestoreKeySnapshot,
  restoreBackup,
  restoreSnapshotMatches,
} from "@/src/storage/backup";
import {
  appendCompletedHand,
  defaultData,
  loadDataWithRecovery,
  STORAGE_KEY,
} from "@/src/storage/storage";
import { legalActionsFor } from "@/src/engine/betting/actionValidator";
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

function reverseKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reverseKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .reverse()
        .map(([key, inner]) => [key, reverseKeys(inner)]),
    );
  }
  return value;
}

function keptHands(data: ReturnType<typeof sample>) {
  const loaded = loadDataWithRecovery({
    getItem: (key: string) =>
      key === STORAGE_KEY ? JSON.stringify(data) : null,
  });
  const parsed = parseBackup(
    JSON.stringify(createBackup(data, prefs)),
    defaultData(),
    prefs,
  );
  expect(parsed.backup.preferences).toEqual(prefs);
  expect(loaded.data.recentHands).toEqual(parsed.backup.data.recentHands);
  return loaded.data.recentHands;
}

function playedHand(
  handId: string,
  stacks: number[],
  seed: number,
  script: "check-down" | "all-in",
) {
  let game = startHand({
    players: stacks.map((stack, seat) => ({
      id: seat === 0 ? "hero" : `ai-${seat}`,
      name: seat === 0 ? "Hero" : `AI ${seat}`,
      seat,
      stack,
      kind: (seat === 0 ? "human" : "ai") as "human" | "ai",
    })),
    dealerSeat: 0,
    smallBlind: 0.5,
    bigBlind: 1,
    seed,
    handId,
  });
  if (script === "all-in") {
    game = act(game, "hero", { type: "all-in" });
    while (!game.settled) {
      const id = game.actingPlayerId!;
      const legal = legalActionsFor(game, id);
      game = act(game, id, { type: legal.call.legal ? "call" : "fold" });
    }
  } else {
    while (!game.settled) {
      const id = game.actingPlayerId!;
      const legal = legalActionsFor(game, id);
      game = act(game, id, {
        type: legal.check.legal ? "check" : legal.call.legal ? "call" : "fold",
      });
    }
  }
  return appendCompletedHand(defaultData(), game, "hero", {});
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

  const nested = sample();
  const pots = nested.recentHands[0].game.outcome?.pots;
  if (!pots) throw new Error("fixture must be complete");
  nested.recentHands[0].game.outcome!.pots = pots.map((pot) => ({
    eligiblePlayerIds: pot.eligiblePlayerIds,
    contributors: pot.contributors,
    cap: pot.cap,
    amount: pot.amount,
    id: pot.id,
  }));
  expect(keptHands(nested)).toEqual(nested.recentHands);
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
it("matches an untouched restore snapshot and fails closed when a key changes or cannot be read", () => {
  const values = new Map<string, string>([
    ["riverlab-locale", "zh-CN"],
    ["pokguy-theme", "light"],
    [STORAGE_KEY, JSON.stringify(defaultData())],
  ]);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const baseline = readRestoreKeySnapshot(storage);
  expect(baseline).toEqual({
    locale: "zh-CN",
    theme: "light",
    data: values.get(STORAGE_KEY),
  });
  expect(restoreSnapshotMatches(baseline, storage)).toBe(true);
  storage.setItem(STORAGE_KEY, JSON.stringify(sample()));
  expect(restoreSnapshotMatches(baseline, storage)).toBe(false);
  expect(restoreSnapshotMatches(null, storage)).toBe(false);
  expect(
    readRestoreKeySnapshot({
      getItem: () => {
        throw new Error("denied");
      },
    }),
  ).toBeNull();
  expect(
    restoreSnapshotMatches(baseline, {
      getItem: () => {
        throw new Error("denied");
      },
    }),
  ).toBe(false);
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

it("accepts a valid pre-scope full backup while still rejecting damaged legacy fields", () => {
  const data = sample();
  delete data.statsScope;
  delete data.scenarioStats;
  delete data.legacyStats;
  delete data.legacyAiHabits;
  const backup = createBackup(data, prefs);
  const restored = parseBackup(JSON.stringify(backup), defaultData(), prefs)
    .backup.data;
  expect(restored.stats.hands).toBe(0);
  expect(restored.legacyStats).toEqual(data.stats);
  expect(restored.recentHands).toEqual(data.recentHands);
  expect(() =>
    parseBackup(
      JSON.stringify({
        ...backup,
        data: { ...data, stats: { ...data.stats, hands: -1 } },
      }),
      defaultData(),
      prefs,
    ),
  ).toThrow();
});

it("rejects a damaged modern scope marker without overwriting legacy totals", () => {
  const data = sample();
  data.legacyStats = { ...defaultData().stats, hands: 500 };
  delete data.statsScope;
  expect(() =>
    parseBackup(
      JSON.stringify(createBackup(data, prefs)),
      defaultData(),
      prefs,
    ),
  ).toThrow("backup-invalid-scope");
});

it("keeps fold, showdown, and unequal all-in hands after reversing object keys", () => {
  const showdown = playedHand("hand-river-showdown", [10, 10], 4, "check-down");
  const allIn = playedHand("hand-unequal-allin", [10, 4, 10], 8, "all-in");
  expect(showdown.recentHands[0].game.outcome?.reason).toBe("showdown");
  expect(allIn.recentHands[0].game.outcome?.pots.length).toBeGreaterThan(1);
  for (const data of [sample(), showdown, allIn]) {
    expect(
      keptHands(reverseKeys(data) as typeof data).map((hand) => hand.id),
    ).toEqual(data.recentHands.map((hand) => hand.id));
  }
});

it("accepts a showdown award pot whose keys were reordered on their own", () => {
  const data = playedHand("hand-award-order", [10, 10], 6, "check-down");
  const awards = data.recentHands[0].game.outcome?.showdown?.awards;
  if (!awards?.length) throw new Error("showdown fixture must award a pot");
  for (const award of awards) {
    award.pot = {
      eligiblePlayerIds: award.pot.eligiblePlayerIds,
      contributors: award.pot.contributors,
      cap: award.pot.cap,
      amount: award.pot.amount,
      id: award.pot.id,
    };
  }
  expect(keptHands(data).map((hand) => hand.id)).toEqual(["hand-award-order"]);
});
