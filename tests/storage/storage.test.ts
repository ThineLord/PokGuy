import {
  appendCompletedHand,
  DEFAULT_SETTINGS,
  defaultData,
  migrateData,
  loadData,
  loadDataWithRecovery,
  saveData,
  STORAGE_KEY,
  migrateDataWithRecovery,
} from "@/src/storage/storage";
import { PERSONALITIES } from "@/src/ai/personalities/presets";
import { parseCards } from "@/src/engine/cards/cards";
import { startHand, type PokerGameState } from "@/src/engine/state/gameState";
import { resolveShowdown } from "@/src/engine/showdown/showdown";

describe("versioned LocalStorage", () => {
  it("migrates version 1 settings and fills new defaults", () => {
    const migrated = migrateData({
      version: 1,
      settings: { playerName: "旧玩家", seatCount: 3 },
    });
    expect(migrated.version).toBe(2);
    expect(migrated.settings.playerName).toBe("旧玩家");
    expect(migrated.settings.animations).toBe(true);
    expect(migrated.settings.deckTheme).toBe("river-current");
    expect(migrated.aiProfiles).toHaveLength(8);
  });

  it("recovers from corrupted JSON", () => {
    const storage = { getItem: () => "{bad json" };
    expect(loadData(storage).settings.seatCount).toBe(6);
    expect(loadDataWithRecovery(storage).recovered).toBe(true);
  });

  it("does not report recovery for valid current data", () => {
    const source = defaultData();
    const storage = { getItem: () => JSON.stringify(source) };

    expect(loadDataWithRecovery(storage)).toEqual({
      data: source,
      recovered: false,
    });
  });

  it("falls back from an unknown deck theme", () => {
    const migrated = migrateData({
      version: 2,
      settings: { deckTheme: "broken-theme" },
    });
    expect(migrated.settings.deckTheme).toBe("river-current");
  });

  it("drops malformed training records without discarding valid feedback", () => {
    const validRecord = {
      handId: "hand-1",
      createdAt: "2026-08-01T12:00:00.000Z",
      grade: "偏紧",
      note: "Recheck the free option",
    };
    const migrated = migrateData({
      version: 2,
      trainingRecords: [
        null,
        {},
        { ...validRecord, handId: "" },
        { ...validRecord, createdAt: "not-a-date" },
        { ...validRecord, grade: "unknown" },
        { ...validRecord, note: 7 },
        validRecord,
      ],
    });

    expect(migrated.trainingRecords).toEqual([validRecord]);
  });

  it("recovers invalid table settings while preserving unrelated valid data", () => {
    const migrated = migrateData({
      ...defaultData(),
      settings: {
        ...DEFAULT_SETTINGS,
        playerName: "Keep Me",
        seatCount: 2.5,
        startingStackBb: null,
        smallBlind: 0,
        bigBlind: 0,
        selectedAiIds: null,
        animations: "yes",
        animationSpeed: "instant",
        aiDelayMs: 30_000,
        hintStrength: "maximum",
      },
    });

    expect(migrated.settings.playerName).toBe("Keep Me");
    expect(migrated.settings.seatCount).toBe(DEFAULT_SETTINGS.seatCount);
    expect(migrated.settings.startingStackBb).toBe(
      DEFAULT_SETTINGS.startingStackBb,
    );
    expect(migrated.settings.smallBlind).toBeGreaterThan(0);
    expect(migrated.settings.bigBlind).toBeGreaterThan(
      migrated.settings.smallBlind,
    );
    expect(migrated.settings.selectedAiIds).toEqual(
      DEFAULT_SETTINGS.selectedAiIds,
    );
    expect(migrated.settings.animations).toBe(DEFAULT_SETTINGS.animations);
    expect(migrated.settings.animationSpeed).toBe(
      DEFAULT_SETTINGS.animationSpeed,
    );
    expect(migrated.settings.aiDelayMs).toBe(DEFAULT_SETTINGS.aiDelayMs);
    expect(migrated.settings.hintStrength).toBe(DEFAULT_SETTINGS.hintStrength);
  });

  it("repairs malformed AI profiles without losing valid custom fields", () => {
    const customizedTag = {
      ...PERSONALITIES[0],
      name: "Custom TAG",
      vpip: 0.31,
      aggression: 2,
    };
    const migrated = migrateData({
      ...defaultData(),
      settings: {
        ...DEFAULT_SETTINGS,
        selectedAiIds: ["tag", "missing", "tag"],
      },
      aiProfiles: [customizedTag, null, null, null, null, null, null, null],
    });

    const tag = migrated.aiProfiles.find((profile) => profile.id === "tag");
    expect(migrated.aiProfiles.length).toBeGreaterThanOrEqual(8);
    expect(new Set(migrated.aiProfiles.map((profile) => profile.id)).size).toBe(
      migrated.aiProfiles.length,
    );
    expect(tag).toMatchObject({
      name: "Custom TAG",
      vpip: 0.31,
      aggression: PERSONALITIES[0].aggression,
    });
    expect(migrated.settings.selectedAiIds).toEqual(["tag"]);
  });

  it("preserves a valid custom-only opponent pool", () => {
    const source = defaultData();
    source.aiProfiles = PERSONALITIES.map((profile, index) => ({
      ...profile,
      id: `custom-${index}`,
      name: `Custom ${index}`,
    }));
    source.settings.selectedAiIds = [];

    const migrated = migrateData(source);
    expect(migrated.aiProfiles).toEqual(source.aiProfiles);
    expect(migrated.settings.selectedAiIds).toEqual([]);
    expect(migrateDataWithRecovery(source).recovered).toBe(false);
  });

  it("drops malformed AI habits while preserving complete observations", () => {
    const source = defaultData();
    const validHabit = {
      hands: 12,
      vpip: 0.3,
      pfr: 0.2,
      threeBet: 0.1,
      foldToThreeBet: 0.4,
      continuationBet: 0.6,
      foldToContinuationBet: 0.5,
      aggressionFactor: 1.8,
      showdownFrequency: 0.3,
      bluffFrequencyEstimate: 0.15,
      riverCallFrequency: 0.45,
    };
    source.aiHabits = {
      tag: validHabit,
      lag: { hands: 1, vpip: 0.2 } as never,
    };

    expect(migrateData(source).aiHabits).toEqual({ tag: validHabit });
  });

  it("rejects blind sizes that overflow the full table stack", () => {
    const migrated = migrateData({
      ...defaultData(),
      settings: {
        ...DEFAULT_SETTINGS,
        bigBlind: Number.MAX_VALUE / 200,
      },
    });

    expect(migrated.settings.smallBlind).toBe(DEFAULT_SETTINGS.smallBlind);
    expect(migrated.settings.bigBlind).toBe(DEFAULT_SETTINGS.bigBlind);
  });

  it("leaves valid settings and customized profiles unchanged", () => {
    const source = defaultData();
    source.settings = {
      ...source.settings,
      playerName: "River",
      seatCount: 4,
      startingStackBb: 250,
      smallBlind: 1,
      bigBlind: 2,
      aiDelayMs: 450,
    };
    source.aiProfiles = source.aiProfiles.map((profile, index) => ({
      ...profile,
      vpip: Math.min(1, profile.vpip + index / 100),
    }));
    source.aiProfiles.push({
      ...PERSONALITIES[0],
      id: "custom-profile",
      name: "Custom profile",
    });
    source.settings.selectedAiIds = ["custom-profile", "tag"];

    const migrated = migrateData(source);
    expect(migrated.settings).toEqual(source.settings);
    expect(migrated.aiProfiles).toEqual(source.aiProfiles);
  });

  it("round-trips data through a storage adapter", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
    };
    const data = migrateData({ version: 1, settings: { playerName: "River" } });
    expect(saveData(data, storage)).toBe(true);
    expect(values.has(STORAGE_KEY)).toBe(true);
    expect(loadData(storage).settings.playerName).toBe("River");
  });

  it("does not count an uncalled-chip return as a showdown win", () => {
    const base = startHand({
      players: [
        { id: "hero", name: "Hero", seat: 0, stack: 100, kind: "human" },
        { id: "villain", name: "Villain", seat: 1, stack: 50, kind: "ai" },
      ],
      dealerSeat: 0,
      smallBlind: 0.5,
      bigBlind: 1,
      seed: 7,
    });
    const board = parseCards("2C 3D 7S 8C 9H");
    const showdown = resolveShowdown(
      [
        {
          playerId: "hero",
          seat: 0,
          amount: 100,
          folded: false,
          holeCards: parseCards("KH KD"),
        },
        {
          playerId: "villain",
          seat: 1,
          amount: 50,
          folded: false,
          holeCards: parseCards("AH AD"),
        },
      ],
      board,
      0,
    );
    const complete: PokerGameState = {
      ...base,
      board,
      street: "complete",
      actingPlayerId: null,
      settled: true,
      actions: [],
      players: base.players.map((player) => ({
        ...player,
        holeCards:
          player.id === "hero" ? parseCards("KH KD") : parseCards("AH AD"),
        totalContribution: player.id === "hero" ? 100 : 50,
        streetContribution: player.id === "hero" ? 100 : 50,
        stack: player.id === "hero" ? 50 : 100,
        status: "all-in",
      })),
      outcome: {
        reason: "showdown",
        termination: "river-showdown",
        payouts: showdown.payouts,
        pots: showdown.awards.map((award) => award.pot),
        showdown,
      },
    };

    const stored = appendCompletedHand(defaultData(), complete, "hero");
    expect(stored.stats.showdowns).toBe(1);
    expect(stored.stats.showdownWins).toBe(0);
  });
});
