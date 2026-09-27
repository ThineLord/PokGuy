import { legalActionsFor } from "@/src/engine/betting/actionValidator";
import { cardId } from "@/src/engine/cards/cards";
import { createDeck } from "@/src/engine/deck/deck";
import {
  act,
  startHand,
  startTrainingScenario,
} from "@/src/engine/state/gameState";

const players = [
  { id: "a", name: "A", seat: 0, stack: 10, kind: "human" as const },
  { id: "b", name: "B", seat: 1, stack: 10, kind: "ai" as const },
];
const options = {
  players,
  dealerSeat: 0,
  smallBlind: 0.5,
  bigBlind: 1,
  seed: 17,
};

describe("independent release-candidate regressions", () => {
  it("runs out when the small blind already covers an all-in big blind", () => {
    const game = startHand({
      ...options,
      players: [players[0], { ...players[1], stack: 0.25 }],
    });
    expect(game.settled).toBe(true);
    expect(game.actions).toEqual([]);
    expect(game.outcome?.uncalledReturns).toEqual({ a: 0.25 });
    expect(game.players.reduce((sum, player) => sum + player.stack, 0)).toBe(
      10.25,
    );
  });

  it("asks the sole funded player only for the actual short blind", () => {
    const game = startHand({
      ...options,
      players: [players[0], { ...players[1], stack: 0.75 }],
    });
    expect(legalActionsFor(game, "a").call.toCall).toBe(0.25);
    expect(legalActionsFor(game, "a").raise.legal).toBe(false);
    expect(legalActionsFor(game, "a")["all-in"].legal).toBe(false);
    const complete = act(game, "a", { type: "call" });
    expect(complete.settled).toBe(true);
    expect(complete.players[0].totalContribution).toBe(0.75);
  });

  it("retains the full preflop bring-in with two funded opponents of a short blind", () => {
    const game = startHand({
      ...options,
      players: [...players, { ...players[1], id: "c", seat: 2, stack: 0.25 }],
    });
    expect(game.currentBet).toBe(1);
    expect(legalActionsFor(game, "a").call.toCall).toBe(1);
    expect(legalActionsFor(game, "a").raise.legal).toBe(true);
  });

  it("deals relative to the resolved button when the requested button is busted", () => {
    const game = startHand({
      ...options,
      deck: createDeck(),
      players: [
        { ...players[0], stack: 0 },
        players[1],
        { ...players[1], id: "c", seat: 2 },
      ],
    });
    expect(game.dealerSeat).toBe(1);
    expect(game.players[2].holeCards[0]).toEqual(createDeck()[0]);
    expect(game.players[0].holeCards).toEqual([]);
    let complete = game;
    while (!complete.settled) {
      const id = complete.actingPlayerId!;
      complete = act(complete, id, {
        type: legalActionsFor(complete, id).check.legal ? "check" : "call",
      });
    }
    expect(complete.outcome?.showdown?.evaluations.a).toBeUndefined();
  });

  it("does not revive busted seats in a postflop scenario", () => {
    const game = startTrainingScenario({
      ...options,
      players: [...players, { ...players[1], id: "c", seat: 2, stack: 0 }],
      heroId: "a",
      startStreet: "flop",
    });
    expect(game.players[2].status).toBe("busted");
    expect(game.players[2].holeCards).toEqual([]);
    const cards = [
      ...game.deck,
      ...game.board,
      ...game.burnCards,
      ...game.players.flatMap((player) => player.holeCards),
    ];
    expect(new Set(cards.map(cardId)).size).toBe(52);
  });
});

it("settles player IDs that match JavaScript prototype names without inherited values", () => {
  let game = startHand({
    ...options,
    players: [
      { ...players[0], id: "__proto__" },
      { ...players[1], id: "toString" },
    ],
  });
  game = act(game, "__proto__", { type: "all-in" });
  game = act(game, "toString", { type: "call" });
  expect(game.settled).toBe(true);
  expect(game.players.reduce((sum, player) => sum + player.stack, 0)).toBe(20);
});

it("handles a prototype-named folded player without a phantom payout", () => {
  const game = startHand({
    ...options,
    players: [{ ...players[0], id: "toString" }, players[1]],
  });
  const complete = act(game, "toString", { type: "fold" });
  expect(complete.players[0].stack).toBe(9.5);
  expect(complete.players[1].stack).toBe(10.5);
});
