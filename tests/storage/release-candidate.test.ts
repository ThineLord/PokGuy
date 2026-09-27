import {
  appendCompletedHand,
  defaultData,
  migrateDataWithRecovery,
} from "@/src/storage/storage";
import { act, startHand } from "@/src/engine/state/gameState";

function savedHand() {
  const game = startHand({
    players: [
      { id: "hero", name: "Hero", seat: 0, stack: 10, kind: "human" },
      { id: "ai", name: "AI", seat: 1, stack: 10, kind: "ai" },
    ],
    dealerSeat: 0,
    smallBlind: 0.5,
    bigBlind: 1,
    seed: 23,
  });
  return appendCompletedHand(
    defaultData(),
    act(game, "hero", { type: "fold" }),
    "hero",
  );
}

describe("independent persisted-state regressions", () => {
  it.each([
    [
      "inconsistent hero profit",
      (data: ReturnType<typeof savedHand>) => {
        data.recentHands[0].heroProfitBb = 999;
      },
    ],
    [
      "showdown data attached to a fold result",
      (data: ReturnType<typeof savedHand>) => {
        data.recentHands[0].game.outcome!.showdown = {
          evaluations: null,
        } as never;
      },
    ],
    [
      "missing hole cards",
      (data: ReturnType<typeof savedHand>) => {
        delete (
          data.recentHands[0].game.players[0] as Partial<
            (typeof data.recentHands)[0]["game"]["players"][0]
          >
        ).holeCards;
      },
    ],
    [
      "invalid card encoding",
      (data: ReturnType<typeof savedHand>) => {
        data.recentHands[0].game.players[0].holeCards[0].rank = 99 as never;
      },
    ],
    [
      "duplicate dealt card",
      (data: ReturnType<typeof savedHand>) => {
        data.recentHands[0].game.players[0].holeCards[0] =
          data.recentHands[0].game.players[1].holeCards[0];
      },
    ],
    [
      "negative final stack",
      (data: ReturnType<typeof savedHand>) => {
        data.recentHands[0].game.players[0].stack = -1;
      },
    ],
    [
      "inconsistent payout",
      (data: ReturnType<typeof savedHand>) => {
        data.recentHands[0].game.outcome!.payouts.ai = 999;
      },
    ],
    [
      "infinite blind",
      (data: ReturnType<typeof savedHand>) => {
        data.recentHands[0].game.bigBlind = Infinity;
      },
    ],
    [
      "unfinished saved hand",
      (data: ReturnType<typeof savedHand>) => {
        data.recentHands[0].game.settled = false;
      },
    ],
    [
      "invalid action",
      (data: ReturnType<typeof savedHand>) => {
        data.recentHands[0].game.actions[0].action.type = "teleport" as never;
      },
    ],
  ])("drops %s without losing settings", (_, corrupt) => {
    const data = savedHand();
    data.settings.playerName = "Keep me";
    corrupt(data);
    const result = migrateDataWithRecovery(data);
    expect(result.recovered).toBe(true);
    expect(result.data.recentHands).toEqual([]);
    expect(result.data.settings.playerName).toBe("Keep me");
  });

  it("deduplicates history IDs and bounds impossible rates", () => {
    const data = savedHand();
    data.recentHands.push(structuredClone(data.recentHands[0]));
    data.stats.vpipHands = 100;
    data.stats.showdownWins = 100;
    const result = migrateDataWithRecovery(data);
    expect(result.data.recentHands).toHaveLength(1);
    expect(result.data.stats.vpipHands).toBeLessThanOrEqual(
      result.data.stats.vpipOpportunities,
    );
    expect(result.data.stats.showdownWins).toBeLessThanOrEqual(
      result.data.stats.showdowns,
    );
  });

  it("counts an all-in call as VPIP, not a preflop raise or three-bet", () => {
    let game = startHand({
      players: [
        { id: "hero", name: "Hero", seat: 0, stack: 2, kind: "human" },
        { id: "ai", name: "AI", seat: 1, stack: 10, kind: "ai" },
      ],
      dealerSeat: 0,
      smallBlind: 0.5,
      bigBlind: 1,
      seed: 24,
    });
    game = act(game, "hero", { type: "call" });
    game = act(game, "ai", { type: "raise", amount: 4 });
    game = act(game, "hero", { type: "all-in" });
    const data = appendCompletedHand(defaultData(), game, "hero");
    expect(data.stats.vpipHands).toBe(1);
    expect(data.stats.pfrHands).toBe(0);
    expect(data.stats.threeBets).toBe(0);
  });
});

it("does not invent a three-bet opportunity after the hero has folded", () => {
  let game = startHand({
    players: [
      { id: "hero", name: "Hero", seat: 0, stack: 10, kind: "human" },
      { id: "ai", name: "AI", seat: 1, stack: 10, kind: "ai" },
      { id: "other", name: "Other", seat: 2, stack: 10, kind: "ai" },
    ],
    dealerSeat: 0,
    smallBlind: 0.5,
    bigBlind: 1,
    seed: 25,
  });
  game = act(game, "hero", { type: "fold" });
  game = act(game, "ai", { type: "raise", amount: 3 });
  game = act(game, "other", { type: "fold" });
  expect(
    appendCompletedHand(defaultData(), game, "hero").stats
      .threeBetOpportunities,
  ).toBe(0);
});

it("does not call a raise facing a flop lead a continuation bet", () => {
  let game = startHand({
    players: [
      { id: "hero", name: "Hero", seat: 0, stack: 20, kind: "human" },
      { id: "ai", name: "AI", seat: 1, stack: 20, kind: "ai" },
    ],
    dealerSeat: 0,
    smallBlind: 0.5,
    bigBlind: 1,
    seed: 26,
  });
  game = act(game, "hero", { type: "raise", amount: 3 });
  game = act(game, "ai", { type: "call" });
  game = act(game, "ai", { type: "bet", amount: 2 });
  game = act(game, "hero", { type: "raise", amount: 4 });
  game = act(game, "ai", { type: "fold" });
  const stats = appendCompletedHand(defaultData(), game, "hero").stats;
  expect(stats.cbetOpportunities).toBe(0);
  expect(stats.cbets).toBe(0);
});
