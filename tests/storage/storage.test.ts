import {
  appendCompletedHand,
  defaultData,
  migrateData,
  loadData,
  saveData,
  STORAGE_KEY,
} from "@/src/storage/storage";
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
  });

  it("falls back from an unknown deck theme", () => {
    const migrated = migrateData({
      version: 2,
      settings: { deckTheme: "broken-theme" },
    });
    expect(migrated.settings.deckTheme).toBe("river-current");
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
