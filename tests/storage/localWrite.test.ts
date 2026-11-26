import { createBackup, parseBackup, restoreBackup } from "@/src/storage/backup";
import { commitLocalData, resolveLocalWrite } from "@/src/storage/localWrite";
import {
  appendCompletedHand,
  defaultData,
  STORAGE_KEY,
} from "@/src/storage/storage";
import type { PersistedData } from "@/src/storage/types";
import { act, startHand } from "@/src/engine/state/gameState";

function memoryStorage(initial: string | null = null) {
  const values = new Map<string, string>();
  if (initial !== null) values.set(STORAGE_KEY, initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
    raw: () => values.get(STORAGE_KEY) ?? null,
  };
}

function completed(handId: string): PersistedData {
  const game = startHand({
    players: [
      { id: "hero", name: "Hero", seat: 0, stack: 100, kind: "human" },
      { id: "ai", name: "AI", seat: 1, stack: 100, kind: "ai" },
    ],
    dealerSeat: 0,
    smallBlind: 0.5,
    bigBlind: 1,
    seed: 9,
    handId,
  });
  const data = appendCompletedHand(
    defaultData(),
    act(game, "hero", { type: "fold" }),
    "hero",
  );
  data.trainingRecords = [
    {
      handId,
      createdAt: "2026-11-25T00:00:00.000Z",
      grade: "偏紧",
    },
  ];
  return data;
}

function storedHands(raw: string | null) {
  return JSON.parse(raw ?? "{}").recentHands?.length ?? 0;
}

const previewPreferences = { locale: "zh-CN" as const, theme: "dark" as const };

function replaceTrapper(data: PersistedData): PersistedData {
  return {
    ...data,
    aiProfiles: data.aiProfiles.map((profile) =>
      profile.id === "trapper"
        ? {
            ...profile,
            id: "custom-opponent",
            name: "Custom Opponent",
            description: "Replaces the unselected trapper profile.",
          }
        : profile,
    ),
  };
}

function customOnly(data: PersistedData): PersistedData {
  const aiProfiles = data.aiProfiles.map((profile, index) => ({
    ...profile,
    id: `custom-${index}`,
    name: `Custom ${index}`,
  }));
  return {
    ...data,
    aiProfiles,
    settings: {
      ...data.settings,
      selectedAiIds: [aiProfiles[0].id, aiProfiles[1].id],
    },
  };
}

function expectPreview(data: PersistedData) {
  const preview = parseBackup(
    JSON.stringify(createBackup(data, previewPreferences)),
    defaultData(),
    previewPreferences,
  );
  expect(preview.legacy).toBe(false);
  expect(preview.backup.data.settings.selectedAiIds).toEqual(
    data.settings.selectedAiIds,
  );
  expect(preview.backup.data.aiProfiles.map((profile) => profile.id)).toEqual(
    data.aiProfiles.map((profile) => profile.id),
  );
}

describe("local write protection", () => {
  it("saves a one-tab edit when storage still matches the acknowledged snapshot", () => {
    const storage = memoryStorage(null);
    const first = commitLocalData(defaultData(), null, storage);
    expect(first.status).toBe("saved");
    if (first.status !== "saved") return;
    const next = {
      ...first.data,
      settings: { ...first.data.settings, playerName: "Solo" },
    };
    const second = commitLocalData(next, first.raw, storage);
    expect(second.status).toBe("saved");
    if (second.status !== "saved") return;
    expect(second.data.settings.playerName).toBe("Solo");
    expect(JSON.parse(second.raw).version).toBe(2);
    expect(JSON.parse(second.raw).format).toBeUndefined();
  });

  it("keeps a newer hand, its stats, and its training record when a stale tab edits settings or notes", () => {
    const stored = completed("hand-a");
    stored.settings = { ...stored.settings, seatCount: 2 };
    const raw = JSON.stringify(stored);
    const storage = memoryStorage(raw);
    const settings = commitLocalData(
      {
        ...defaultData(),
        settings: { ...defaultData().settings, playerName: "Stale Hero" },
      },
      null,
      storage,
    );
    expect(settings.status).toBe("saved");
    if (settings.status !== "saved") return;
    expect(settings.data.settings.playerName).toBe("Stale Hero");
    expect(settings.data.settings.seatCount).toBe(2);
    expect(settings.data.recentHands.map((hand) => hand.id)).toEqual([
      "hand-a",
    ]);
    expect(settings.data.stats.hands).toBe(1);
    expect(settings.data.trainingRecords).toHaveLength(1);

    const noted = commitLocalData(
      {
        ...settings.data,
        playerNotes: { "hand-a": "kept with the hand" },
      },
      settings.raw,
      storage,
    );
    expect(noted.status).toBe("saved");
    if (noted.status !== "saved") return;
    expect(noted.data.playerNotes["hand-a"]).toBe("kept with the hand");
    expect(noted.data.recentHands).toHaveLength(1);
    expect(noted.data.stats.hands).toBe(1);
    expect(noted.data.trainingRecords).toHaveLength(1);

    const staleNote = commitLocalData(
      {
        ...defaultData(),
        playerNotes: { "hand-a": "from the old copy" },
      },
      null,
      memoryStorage(raw),
    );
    expect(staleNote.status).toBe("saved");
    if (staleNote.status !== "saved") return;
    expect(staleNote.data.playerNotes["hand-a"]).toBe("from the old copy");
    expect(staleNote.data.recentHands).toHaveLength(1);
    expect(staleNote.data.stats.hands).toBe(1);
    expect(staleNote.data.trainingRecords).toHaveLength(1);
  });

  it("refuses a stale settlement and a retry of that same snapshot", () => {
    const stored = completed("hand-a");
    const raw = JSON.stringify(stored);
    const storage = memoryStorage(raw);
    const other = completed("hand-b");
    const first = commitLocalData(other, null, storage);
    expect(first.status).toBe("conflict");
    expect(storage.raw()).toBe(raw);
    const second = commitLocalData(other, null, storage);
    expect(second.status).toBe("conflict");
    expect(storage.raw()).toBe(raw);
    expect(storedHands(storage.raw())).toBe(1);
    expect(JSON.parse(storage.raw()!).recentHands[0].id).toBe("hand-a");
    expect(JSON.parse(storage.raw()!).stats.hands).toBe(1);
    expect(JSON.parse(storage.raw()!).trainingRecords).toHaveLength(1);
  });

  it("refuses overlapping edits and still allows a confirmed clear from the current snapshot", () => {
    const stored = completed("hand-a");
    stored.settings = { ...stored.settings, playerName: "From A" };
    const raw = JSON.stringify(stored);
    const storage = memoryStorage(raw);
    const conflict = commitLocalData(
      {
        ...defaultData(),
        settings: { ...defaultData().settings, playerName: "From B" },
      },
      null,
      storage,
    );
    expect(conflict.status).toBe("conflict");
    expect(storage.raw()).toBe(raw);

    const current = memoryStorage(raw);
    const cleared = commitLocalData(
      { ...stored, recentHands: [], playerNotes: {} },
      raw,
      current,
    );
    expect(cleared.status).toBe("saved");
    if (cleared.status !== "saved") return;
    expect(cleared.data.recentHands).toHaveLength(0);

    const newer = completed("hand-b");
    const staleClear = memoryStorage(JSON.stringify(newer));
    const refused = commitLocalData(
      { ...stored, recentHands: [], playerNotes: {} },
      raw,
      staleClear,
    );
    expect(refused.status).toBe("conflict");
    expect(JSON.parse(staleClear.raw()!).recentHands[0].id).toBe("hand-b");
  });

  it("keeps restored hands when the restoring tab edits, and when a stale tab edits after that restore", () => {
    const original = JSON.stringify(defaultData());
    const storage = memoryStorage(original);
    const restored = completed("hand-restored");
    restored.settings = { ...restored.settings, playerName: "Backup Hero" };
    expect(
      restoreBackup(
        createBackup(restored, { locale: "zh-CN", theme: "dark" }),
        storage,
      ),
    ).toBe("saved");
    const restoredRaw = storage.raw();
    expect(restoredRaw).not.toBe(original);
    const edited = commitLocalData(
      {
        ...restored,
        settings: { ...restored.settings, playerName: "After restore" },
      },
      restoredRaw,
      storage,
    );
    expect(edited.status).toBe("saved");
    if (edited.status !== "saved") return;
    expect(edited.data.settings.playerName).toBe("After restore");
    expect(edited.data.recentHands.map((hand) => hand.id)).toEqual([
      "hand-restored",
    ]);
    expect(edited.data.stats.hands).toBe(1);
    expect(edited.data.trainingRecords).toHaveLength(1);
    expect(JSON.parse(edited.raw).format).toBeUndefined();

    const stale = commitLocalData(
      {
        ...defaultData(),
        settings: { ...defaultData().settings, playerName: "Older tab" },
      },
      original,
      storage,
    );
    expect(stale.status).toBe("conflict");
    expect(storage.raw()).toBe(edited.raw);
    expect(JSON.parse(storage.raw()!).recentHands).toHaveLength(1);
    expect(JSON.parse(storage.raw()!).settings.playerName).toBe(
      "After restore",
    );
  });

  it("plans a legacy settings restore onto the stored hand without writing", () => {
    const stored = completed("hand-a");
    const raw = JSON.stringify(stored);
    let writes = 0;
    const storage = {
      getItem: (key: string) => (key === STORAGE_KEY ? raw : null),
      setItem: () => {
        writes += 1;
      },
    };
    const desired = {
      ...defaultData(),
      settings: { ...defaultData().settings, playerName: "Legacy name" },
      aiProfiles: stored.aiProfiles,
    };
    const resolved = resolveLocalWrite(desired, null, storage);
    expect(resolved.status).toBe("ready");
    if (resolved.status !== "ready") return;
    expect(writes).toBe(0);
    expect(resolved.data.settings.playerName).toBe("Legacy name");
    expect(resolved.data.recentHands).toHaveLength(1);
    expect(resolved.data.stats.hands).toBe(1);
    expect(resolved.data.trainingRecords).toHaveLength(1);
    expect(storage.getItem(STORAGE_KEY)).toBe(raw);
  });

  it("refuses a merged blind pair that is no longer legal and keeps the saved pair", () => {
    const base = defaultData();
    const stored = {
      ...base,
      settings: { ...base.settings, bigBlind: 0.6 },
    };
    const raw = JSON.stringify(stored);
    const storage = memoryStorage(raw);
    const staleSmallBlind = commitLocalData(
      {
        ...base,
        settings: { ...base.settings, smallBlind: 0.75 },
      },
      JSON.stringify(base),
      storage,
    );
    expect(staleSmallBlind.status).toBe("conflict");
    expect(storage.raw()).toBe(raw);
    expect(JSON.parse(storage.raw()!).settings).toMatchObject({
      smallBlind: 0.5,
      bigBlind: 0.6,
    });

    const reversed = memoryStorage(
      JSON.stringify({
        ...base,
        settings: { ...base.settings, smallBlind: 0.75 },
      }),
    );
    const before = reversed.raw();
    const staleBigBlind = commitLocalData(
      {
        ...base,
        settings: { ...base.settings, bigBlind: 0.6 },
      },
      JSON.stringify(base),
      reversed,
    );
    expect(staleBigBlind.status).toBe("conflict");
    expect(reversed.raw()).toBe(before);
    expect(JSON.parse(reversed.raw()!).settings).toMatchObject({
      smallBlind: 0.75,
      bigBlind: 1,
    });
  });

  it("merges compatible blind and settings edits that stay legal together", () => {
    const base = defaultData();
    const stored = {
      ...base,
      settings: { ...base.settings, bigBlind: 2, playerName: "From A" },
    };
    const raw = JSON.stringify(stored);
    const storage = memoryStorage(raw);
    const merged = commitLocalData(
      {
        ...base,
        settings: { ...base.settings, smallBlind: 0.75 },
        playerNotes: { later: "from the old page" },
      },
      JSON.stringify(base),
      storage,
    );
    expect(merged.status).toBe("saved");
    if (merged.status !== "saved") return;
    expect(merged.data.settings).toMatchObject({
      smallBlind: 0.75,
      bigBlind: 2,
      playerName: "From A",
    });
    expect(merged.data.playerNotes.later).toBe("from the old page");

    const wideBlind = 100_000_000_000;
    const wideRaw = JSON.stringify({
      ...base,
      settings: { ...base.settings, bigBlind: wideBlind },
    });
    const overflow = memoryStorage(wideRaw);
    const refused = commitLocalData(
      {
        ...base,
        settings: { ...base.settings, startingStackBb: 500 },
      },
      JSON.stringify(base),
      overflow,
    );
    expect(refused.status).toBe("conflict");
    expect(overflow.raw()).toBe(wideRaw);
    expect(JSON.parse(overflow.raw()!).settings).toMatchObject({
      startingStackBb: 100,
      bigBlind: wideBlind,
    });
  });

  it("refuses a merged selection that names a profile the saved list no longer includes", () => {
    const base = defaultData();
    const stored = replaceTrapper(base);
    const raw = JSON.stringify(stored);
    const storage = memoryStorage(raw);
    const acknowledged = JSON.stringify(base);
    const staleAdd = commitLocalData(
      {
        ...base,
        settings: {
          ...base.settings,
          selectedAiIds: [...base.settings.selectedAiIds, "trapper"],
        },
      },
      acknowledged,
      storage,
    );
    expect(staleAdd.status).toBe("conflict");
    expect(storage.raw()).toBe(raw);
    const preserved = JSON.parse(storage.raw()!);
    expect(preserved.settings.selectedAiIds).not.toContain("trapper");
    expect(preserved.settings.selectedAiIds).toEqual(
      base.settings.selectedAiIds,
    );
    expect(
      preserved.aiProfiles.map((profile: { id: string }) => profile.id),
    ).toEqual(stored.aiProfiles.map((profile) => profile.id));
    expectPreview(stored);
    expect(() =>
      parseBackup(
        JSON.stringify(
          createBackup(
            {
              ...stored,
              settings: {
                ...stored.settings,
                selectedAiIds: [...stored.settings.selectedAiIds, "trapper"],
              },
            },
            previewPreferences,
          ),
        ),
        defaultData(),
        previewPreferences,
      ),
    ).toThrow("backup-invalid-data");

    const selected = {
      ...base,
      settings: {
        ...base.settings,
        selectedAiIds: [...base.settings.selectedAiIds, "trapper"],
      },
    };
    const selectedRaw = JSON.stringify(selected);
    const reverse = memoryStorage(selectedRaw);
    const staleReplace = commitLocalData(
      replaceTrapper(base),
      acknowledged,
      reverse,
    );
    expect(staleReplace.status).toBe("conflict");
    expect(reverse.raw()).toBe(selectedRaw);
    expectPreview(selected);
  });

  it("merges a still-present opponent and a disjoint custom-profile edit", () => {
    const base = defaultData();
    const stored = replaceTrapper(base);
    const acknowledged = JSON.stringify(base);
    const added = commitLocalData(
      {
        ...base,
        settings: {
          ...base.settings,
          selectedAiIds: [...base.settings.selectedAiIds, "recreational"],
        },
      },
      acknowledged,
      memoryStorage(JSON.stringify(stored)),
    );
    expect(added.status).toBe("saved");
    if (added.status !== "saved") return;
    expect(added.data.settings.selectedAiIds).toEqual([
      ...base.settings.selectedAiIds,
      "recreational",
    ]);
    expect(added.data.aiProfiles.map((profile) => profile.id)).toEqual(
      stored.aiProfiles.map((profile) => profile.id),
    );
    expect(added.data.aiProfiles.map((profile) => profile.id)).not.toContain(
      "trapper",
    );
    expectPreview(added.data);

    const named = commitLocalData(
      {
        ...base,
        settings: { ...base.settings, playerName: "Stale Hero" },
        playerNotes: { later: "from the old page" },
      },
      acknowledged,
      memoryStorage(JSON.stringify(stored)),
    );
    expect(named.status).toBe("saved");
    if (named.status !== "saved") return;
    expect(named.data.settings.playerName).toBe("Stale Hero");
    expect(named.data.settings.selectedAiIds).toEqual(
      base.settings.selectedAiIds,
    );
    expect(named.data.aiProfiles.map((profile) => profile.id)).toContain(
      "custom-opponent",
    );
    expect(named.data.playerNotes.later).toBe("from the old page");
    expectPreview(named.data);
  });

  it("keeps a legal custom-only pool when the other edit does not touch it", () => {
    const base = defaultData();
    const stored = customOnly(base);
    const raw = JSON.stringify(stored);
    const storage = memoryStorage(raw);
    const merged = commitLocalData(
      {
        ...base,
        settings: { ...base.settings, playerName: "Custom Hero" },
        playerNotes: { later: "from the old page" },
      },
      JSON.stringify(base),
      storage,
    );
    expect(merged.status).toBe("saved");
    if (merged.status !== "saved") return;
    expect(merged.data.settings.playerName).toBe("Custom Hero");
    expect(merged.data.settings.selectedAiIds).toEqual(
      stored.settings.selectedAiIds,
    );
    expect(merged.data.aiProfiles.map((profile) => profile.id)).toEqual(
      stored.aiProfiles.map((profile) => profile.id),
    );
    expect(merged.data.playerNotes.later).toBe("from the old page");
    expectPreview(merged.data);
  });

  it("reports a storage failure without replacing the previous value", () => {
    const raw = JSON.stringify(completed("hand-a"));
    const storage = {
      getItem: () => raw,
      setItem: () => {
        throw new DOMException("full", "QuotaExceededError");
      },
    };
    const result = commitLocalData(
      {
        ...defaultData(),
        settings: { ...defaultData().settings, playerName: "Unread" },
      },
      raw,
      storage,
    );
    expect(result.status).toBe("failed");
    expect(storage.getItem()).toBe(raw);
  });
});
