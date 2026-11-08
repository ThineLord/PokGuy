import {
  appendCompletedHand,
  defaultData,
  migrateData,
} from "@/src/storage/storage";
import {
  act,
  startHand,
  startTrainingScenario,
  type PokerGameState,
} from "@/src/engine/state/gameState";
import { legalActionsFor } from "@/src/engine/betting/actionValidator";
const players = [
  { id: "hero", name: "Hero", seat: 0, stack: 100, kind: "human" as const },
  { id: "ai", name: "AI", seat: 1, stack: 100, kind: "ai" as const },
];
const options = {
  players,
  dealerSeat: 0,
  smallBlind: 0.5,
  bigBlind: 1,
  seed: 42,
};
function complete(game: PokerGameState) {
  for (let i = 0; i < 40 && !game.settled; i++) {
    const id = game.actingPlayerId!;
    game = act(game, id, {
      type: legalActionsFor(game, id).check.legal ? "check" : "call",
    });
  }
  return game;
}
it("separates cash and postflop scenarios and leaves cash adaptation untouched", () => {
  const cash = startHand({ ...options, handId: "hand-cash" });
  const data = appendCompletedHand(
    defaultData(),
    act(cash, "hero", { type: "fold" }),
    "hero",
  );
  const scenario = startTrainingScenario({
    ...options,
    heroId: "hero",
    startStreet: "river",
    handId: "scenario-river",
  });
  const result = appendCompletedHand(data, complete(scenario), "hero");
  expect(result.stats).toEqual(data.stats);
  expect(result.aiHabits).toEqual(data.aiHabits);
  expect(result.scenarioStats?.hands).toBe(1);
  expect(result.scenarioStats?.vpipOpportunities).toBe(0);
  expect(result.scenarioStats?.pfrOpportunities).toBe(0);
  expect(result.recentHands).toHaveLength(2);
  expect(migrateData(result)).toEqual(result);
});
it("preserves old mixed totals and habits without pretending to reconstruct full history", () => {
  const old = defaultData();
  delete old.statsScope;
  old.stats.hands = 500;
  old.stats.profitBb = 123;
  const result = migrateData(old);
  expect(result.stats.hands).toBe(0);
  expect(result.legacyStats?.hands).toBe(500);
  expect(result.legacyStats?.profitBb).toBe(123);
  expect(result.aiHabits).toEqual({});
  expect(migrateData(result)).toEqual(result);
});
it("excludes forced all-in hands with no preflop decision from VPIP/PFR denominators", () => {
  const game = startHand({
    ...options,
    players: [players[0], { ...players[1], stack: 0.25 }],
    handId: "hand-forced",
  });
  expect(game.settled).toBe(true);
  const result = appendCompletedHand(defaultData(), game, "hero");
  expect(result.stats.hands).toBe(1);
  expect(result.stats.vpipOpportunities).toBe(0);
  expect(result.stats.pfrOpportunities).toBe(0);
  expect(Object.values(result.stats.byPosition)[0].opportunities).toBe(0);
});
it("excludes all-in runouts and flop donk bets from continuation-bet opportunities", () => {
  const allIn = complete(
    act(startHand({ ...options, handId: "hand-allin" }), "hero", {
      type: "all-in",
    }),
  );
  expect(
    appendCompletedHand(defaultData(), allIn, "hero").stats.cbetOpportunities,
  ).toBe(0);
  let game = startHand({ ...options, handId: "hand-donk" });
  game = act(game, "hero", { type: "raise", amount: 3 });
  game = act(game, "ai", { type: "call" });
  expect(game.street).toBe("flop");
  game = act(game, "ai", { type: "bet", amount: 2 });
  game = act(game, "hero", { type: "fold" });
  const stats = appendCompletedHand(defaultData(), game, "hero").stats;
  expect(stats.cbetOpportunities).toBe(0);
  expect(stats.cbets).toBe(0);
});
it("counts an actual three-bet and an actual checked-to flop opportunity", () => {
  let game = startHand({ ...options, handId: "hand-threebet", dealerSeat: 1 });
  game = act(game, "ai", { type: "raise", amount: 3 });
  game = act(game, "hero", { type: "raise", amount: 9 });
  game = act(game, "ai", { type: "call" });
  game = act(game, "hero", { type: "bet", amount: 9 });
  game = act(game, "ai", { type: "fold" });
  const stats = appendCompletedHand(defaultData(), game, "hero").stats;
  expect(stats.threeBetOpportunities).toBe(1);
  expect(stats.threeBets).toBe(1);
  expect(stats.cbetOpportunities).toBe(1);
  expect(stats.cbets).toBe(1);
});

it("does not count a three-bet opportunity against a heads-up open shove", () => {
  let game = startHand({
    ...options,
    dealerSeat: 1,
    players: [players[0], { ...players[1], stack: 5 }],
    handId: "hand-open-shove",
  });
  game = act(game, "ai", { type: "all-in" });
  expect(legalActionsFor(game, "hero").raise.legal).toBe(false);
  game = act(game, "hero", { type: "fold" });
  expect(
    appendCompletedHand(defaultData(), game, "hero").stats
      .threeBetOpportunities,
  ).toBe(0);
});
it("clamps position numerators to their actual opportunity denominator", () => {
  const data = defaultData();
  data.stats.byPosition.BB = {
    hands: 10,
    profitBb: 0,
    opportunities: 1,
    vpip: 8,
    pfr: 5,
  };
  expect(migrateData(data).stats.byPosition.BB).toMatchObject({
    opportunities: 1,
    vpip: 1,
    pfr: 1,
  });
});
