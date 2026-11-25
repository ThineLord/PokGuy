import { amountToCall } from "@/src/engine/betting/actionValidator";
import { callPrice } from "@/src/engine/betting/callPrice";
import {
  act,
  startHand,
  type PokerGameState,
} from "@/src/engine/state/gameState";
import { evaluateTrainingDecision } from "@/src/features/app/trainingFeedback";
import {
  appendCompletedHand,
  defaultData,
  migrateData,
} from "@/src/storage/storage";

const blinds = { smallBlind: 0.5, bigBlind: 1, seed: 1126 };

function pot(game: PokerGameState) {
  return game.players.reduce(
    (sum, player) => sum + player.totalContribution,
    0,
  );
}

function headsUpShove() {
  let game = startHand({
    ...blinds,
    players: [
      { id: "hero", name: "Hero", seat: 0, stack: 10, kind: "human" },
      { id: "button", name: "Button", seat: 1, stack: 100, kind: "ai" },
    ],
    dealerSeat: 1,
    handId: "hand-short-call",
  });
  game = act(game, "button", { type: "all-in" });
  return game;
}

describe("payable call price", () => {
  it("prices the heads-up short stack at 9/20 and settles the 20-chip pot", () => {
    const game = headsUpShove();
    const hero = game.players.find((player) => player.id === "hero")!;
    const price = callPrice(game, "hero");
    expect(game.actingPlayerId).toBe("hero");
    expect(hero.stack).toBe(9);
    expect(pot(game)).toBe(101);
    expect(amountToCall(game, hero)).toBe(99);
    expect(price).toMatchObject({ payable: 9, contestable: 20 });
    expect(price.odds).toBeCloseTo(9 / 20);
    expect(price.odds).not.toBeCloseTo(99 / (101 + 99));
    expect(price.odds).not.toBeCloseTo(9 / (101 + 9));

    const record = evaluateTrainingDecision(
      game,
      "hero",
      { type: "call" },
      0.5,
    );
    expect(record.context).toMatchObject({
      potBefore: 101,
      toCall: 9,
      stackBefore: 9,
      amountCommitted: 9,
    });

    const settled = act(game, "hero", { type: "call" });
    expect(settled.settled).toBe(true);
    expect(settled.outcome?.pots.map((entry) => entry.amount)).toEqual([20]);
    expect(settled.outcome?.uncalledReturns).toEqual({ button: 90 });
    expect(settled.players.reduce((sum, player) => sum + player.stack, 0)).toBe(
      110,
    );
  });

  it("keeps ordinary deep-stack calls and checks on the full pot", () => {
    let game = startHand({
      ...blinds,
      players: [
        { id: "hero", name: "Hero", seat: 0, stack: 100, kind: "human" },
        { id: "villain", name: "Villain", seat: 1, stack: 100, kind: "ai" },
      ],
      dealerSeat: 0,
      handId: "hand-deep-call",
    });
    const open = callPrice(game, "hero");
    expect(open).toMatchObject({ payable: 0.5, contestable: 2 });
    expect(open.odds).toBeCloseTo(0.5 / (pot(game) + 0.5));
    expect(
      evaluateTrainingDecision(game, "hero", { type: "call" }, 0.1).context,
    ).toMatchObject({
      toCall: 0.5,
      amountCommitted: 0.5,
      reason: "low-equity-call",
    });
    expect(
      evaluateTrainingDecision(game, "hero", { type: "call" }, 0.2).context
        ?.reason,
    ).toBe("unassessed");

    game = act(game, "hero", { type: "call" });
    game = act(game, "villain", { type: "check" });
    game = act(game, "villain", { type: "check" });
    expect(game.street).toBe("flop");
    expect(game.actingPlayerId).toBe("hero");
    expect(callPrice(game, "hero")).toMatchObject({ payable: 0, odds: 0 });
    expect(
      evaluateTrainingDecision(game, "hero", { type: "check" }).context,
    ).toMatchObject({ toCall: 0, amountCommitted: 0, reason: "unassessed" });

    game = act(game, "hero", { type: "bet", amount: 4 });
    const covered = callPrice(game, "villain");
    expect(covered.payable).toBe(4);
    expect(covered.contestable).toBeCloseTo(pot(game) + 4);
    expect(covered.odds).toBeCloseTo(4 / (pot(game) + 4));
  });

  it("prices a covered multiway flop from the whole pot, including an earlier street", () => {
    let game = startHand({
      ...blinds,
      players: [
        { id: "hero", name: "Hero", seat: 0, stack: 100, kind: "human" },
        { id: "sb", name: "SB", seat: 1, stack: 100, kind: "ai" },
        { id: "bb", name: "BB", seat: 2, stack: 100, kind: "ai" },
      ],
      dealerSeat: 0,
      handId: "hand-covered-multiway",
    });
    game = act(game, "hero", { type: "call" });
    game = act(game, "sb", { type: "call" });
    game = act(game, "bb", { type: "check" });
    game = act(game, "sb", { type: "bet", amount: 10 });
    game = act(game, "bb", { type: "call" });
    const price = callPrice(game, "hero");
    expect(game.actingPlayerId).toBe("hero");
    expect(price.payable).toBe(10);
    expect(price.contestable).toBeCloseTo(pot(game) + 10);
    expect(price.odds).toBeCloseTo(10 / (pot(game) + 10));
  });

  it("prices the short button from the main pot that holds the folded chips", () => {
    let game = startHand({
      ...blinds,
      players: [
        { id: "hero", name: "Hero", seat: 0, stack: 10, kind: "human" },
        { id: "sb", name: "SB", seat: 1, stack: 100, kind: "ai" },
        { id: "bb", name: "BB", seat: 2, stack: 100, kind: "ai" },
        { id: "utg", name: "UTG", seat: 3, stack: 100, kind: "ai" },
      ],
      dealerSeat: 0,
      handId: "hand-side-pot-call",
    });
    game = act(game, "utg", { type: "raise", amount: 3 });
    game = act(game, "hero", { type: "call" });
    game = act(game, "sb", { type: "call" });
    game = act(game, "bb", { type: "call" });
    expect(game.street).toBe("flop");
    game = act(game, "sb", { type: "bet", amount: 30 });
    game = act(game, "bb", { type: "call" });
    game = act(game, "utg", { type: "fold" });

    const hero = game.players.find((player) => player.id === "hero")!;
    const price = callPrice(game, "hero");
    expect(game.actingPlayerId).toBe("hero");
    expect(hero.stack).toBe(7);
    expect(pot(game)).toBe(72);
    expect(amountToCall(game, hero)).toBe(30);
    expect(price).toMatchObject({ payable: 7, contestable: 33 });
    expect(price.odds).toBeCloseTo(7 / 33);
    expect(price.odds).not.toBeCloseTo(7 / (72 + 7));
    expect(price.odds).not.toBeCloseTo(30 / (72 + 30));

    const loose = evaluateTrainingDecision(
      game,
      "hero",
      { type: "call" },
      0.12,
    );
    expect(loose.grade).toBe("偏松");
    expect(loose.context).toMatchObject({
      potBefore: 72,
      toCall: 7,
      stackBefore: 7,
      amountCommitted: 7,
      equityEstimate: 0.12,
      reason: "low-equity-call",
    });
    const shove = evaluateTrainingDecision(
      game,
      "hero",
      { type: "all-in" },
      0.12,
    );
    expect(shove.grade).toBe(loose.grade);
    expect(shove.context?.reason).toBe("low-equity-call");
    expect(shove.context?.amountCommitted).toBe(7);
    expect(
      evaluateTrainingDecision(game, "hero", { type: "call" }, 0.2).context,
    ).toMatchObject({ toCall: 7, amountCommitted: 7, reason: "unassessed" });

    game = act(game, "hero", { type: "call" });
    while (!game.settled) {
      const actor = game.actingPlayerId;
      if (!actor) throw new Error("missing actor");
      game = act(game, actor, { type: "check" });
    }
    expect(game.outcome?.pots.map((entry) => [entry.id, entry.amount])).toEqual(
      [
        ["main", 33],
        ["side-1", 46],
      ],
    );
    expect(game.outcome?.pots[0].eligiblePlayerIds).toEqual(
      expect.arrayContaining(["hero", "sb", "bb"]),
    );
    expect(game.outcome?.pots[0].eligiblePlayerIds).not.toContain("utg");
    expect(game.outcome?.pots[1].eligiblePlayerIds).toEqual(["sb", "bb"]);
    expect(game.players.reduce((sum, player) => sum + player.stack, 0)).toBe(
      310,
    );
  });

  it("keeps an older nominal to-call record readable", () => {
    const game = headsUpShove();
    const record = evaluateTrainingDecision(
      game,
      "hero",
      { type: "call" },
      0.5,
    );
    const legacy = {
      ...record,
      context: { ...record.context!, toCall: 99, amountCommitted: 9 },
    };
    const data = appendCompletedHand(
      defaultData(),
      act(game, "hero", { type: "call" }),
      "hero",
    );
    expect(
      migrateData({ ...data, trainingRecords: [legacy] }).trainingRecords,
    ).toEqual([legacy]);
    expect(data.version).toBe(2);
  });
});
