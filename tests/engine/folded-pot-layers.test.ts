import { parseCards, cardId } from "@/src/engine/cards/cards";
import { createDeck } from "@/src/engine/deck/deck";
import { legalActionsFor } from "@/src/engine/betting/actionValidator";
import {
  act,
  startHand,
  type PokerGameState,
} from "@/src/engine/state/gameState";
import { oddChipOrder, splitPot } from "@/src/engine/pots/sidePots";
import { resolveShowdown } from "@/src/engine/showdown/showdown";

const board = parseCards("AS KS QS JS TS");

function tiedPlayers() {
  return [
    {
      playerId: "B",
      seat: 0,
      amount: 0.08,
      folded: false,
      holeCards: parseCards("6C 6D"),
    },
    {
      playerId: "C",
      seat: 1,
      amount: 0.01,
      folded: true,
      holeCards: parseCards("2C 2D"),
    },
    {
      playerId: "D",
      seat: 2,
      amount: 0.02,
      folded: true,
      holeCards: parseCards("3C 3D"),
    },
    {
      playerId: "E",
      seat: 3,
      amount: 0.05,
      folded: true,
      holeCards: parseCards("4C 4D"),
    },
    {
      playerId: "A",
      seat: 4,
      amount: 0.08,
      folded: false,
      holeCards: parseCards("5C 5D"),
    },
  ];
}

function riggedDeck() {
  const prefix = parseCards(
    "2C 3C 4C 5C 6C 2D 3D 4D 5D 6D 7C AS KS QS 7D JS 7H TS",
  );
  const used = new Set(prefix.map(cardId));
  return [...prefix, ...createDeck().filter((card) => !used.has(cardId(card)))];
}

function play(
  game: PokerGameState,
  id: string,
  type: "fold" | "check" | "call" | "raise",
  amount?: number,
) {
  expect(game.actingPlayerId).toBe(id);
  return act(game, id, amount === undefined ? { type } : { type, amount });
}

describe("folded-only contribution boundaries", () => {
  it("splits one contestable pot instead of biasing each folded layer", () => {
    const result = resolveShowdown(tiedPlayers(), board, 0);
    expect(result.awards).toHaveLength(1);
    expect(result.awards[0].pot.amount).toBe(0.24);
    expect(result.awards[0].pot.eligiblePlayerIds).toEqual(["B", "A"]);
    expect(result.payouts).toEqual({ A: 0.12, B: 0.12, C: 0, D: 0, E: 0 });
    expect(
      Object.values(result.payouts).reduce((sum, amount) => sum + amount, 0),
    ).toBe(0.24);
  });

  it("keeps an even split when the button gives B odd-chip priority", () => {
    expect(oddChipOrder(["A", "B"], { A: 4, B: 0 }, 4)[0]).toBe("B");
    const result = resolveShowdown(tiedPlayers(), board, 4);
    expect(result.awards).toHaveLength(1);
    expect(result.payouts.A).toBe(0.12);
    expect(result.payouts.B).toBe(0.12);
  });

  it("matches one split of the whole contestable pot for three tied players", () => {
    const players = [
      {
        playerId: "a",
        seat: 1,
        amount: 0.09,
        folded: false,
        holeCards: parseCards("2C 3D"),
      },
      {
        playerId: "b",
        seat: 2,
        amount: 0.09,
        folded: false,
        holeCards: parseCards("4C 5D"),
      },
      {
        playerId: "c",
        seat: 3,
        amount: 0.09,
        folded: false,
        holeCards: parseCards("6C 7D"),
      },
      {
        playerId: "d",
        seat: 4,
        amount: 0.01,
        folded: true,
        holeCards: parseCards("8C 9D"),
      },
      {
        playerId: "e",
        seat: 5,
        amount: 0.03,
        folded: true,
        holeCards: parseCards("TC JD"),
      },
    ];
    const result = resolveShowdown(players, board, 0);
    expect(result.awards).toHaveLength(1);
    expect(result.awards[0].pot.amount).toBe(0.31);
    expect(result.payouts).toEqual({
      ...splitPot(0.31, ["a", "b", "c"], { a: 1, b: 2, c: 3 }, 0, 0.01),
      d: 0,
      e: 0,
    });
    expect(
      Object.values(result.payouts).reduce((sum, amount) => sum + amount, 0),
    ).toBeCloseTo(0.31, 8);
  });

  it("settles the legal folded-layer hand without moving a cent between the tie", () => {
    const seats = ["B", "C", "D", "E", "A"].map((id, seat) => ({
      id,
      name: id,
      seat,
      stack: 2,
      kind: (id === "B" ? "human" : "ai") as "human" | "ai",
    }));
    let game = startHand({
      players: seats,
      dealerSeat: 0,
      smallBlind: 0.01,
      bigBlind: 0.02,
      seed: 1,
      deck: riggedDeck(),
      handId: "hand-folded-layers",
    });
    game = play(game, "E", "raise", 0.05);
    game = play(game, "A", "raise", 0.08);
    game = play(game, "B", "call");
    game = play(game, "C", "fold");
    game = play(game, "D", "fold");
    game = play(game, "E", "fold");
    while (!game.settled) {
      const id = game.actingPlayerId!;
      expect(legalActionsFor(game, id).check.legal).toBe(true);
      game = play(game, id, "check");
    }
    expect(game.outcome?.payouts).toEqual({
      A: 0.12,
      B: 0.12,
      C: 0,
      D: 0,
      E: 0,
    });
    expect(game.players.map((player) => player.stack)).toEqual([
      2.04, 1.99, 1.98, 1.95, 2.04,
    ]);
    expect(game.players.reduce((sum, player) => sum + player.stack, 0)).toBe(
      10,
    );
  });

  it("splits the seeded five-handed tie as one 0.24 pot", () => {
    const seats = ["hero", "s1", "s2", "s3", "s4"].map((id, seat) => ({
      id,
      name: id,
      seat,
      stack: 10,
      kind: (id === "hero" ? "human" : "ai") as "human" | "ai",
    }));
    let game = startHand({
      players: seats,
      dealerSeat: 0,
      smallBlind: 0.01,
      bigBlind: 0.02,
      seed: 23,
      handId: "hand-legacy-seed-23",
    });
    game = play(game, "s3", "raise", 0.05);
    game = play(game, "s4", "raise", 0.08);
    game = play(game, "hero", "call");
    game = play(game, "s1", "fold");
    game = play(game, "s2", "fold");
    game = play(game, "s3", "fold");
    while (!game.settled) {
      const id = game.actingPlayerId!;
      expect(legalActionsFor(game, id).check.legal).toBe(true);
      game = play(game, id, "check");
    }
    expect(game.outcome?.payouts).toMatchObject({ hero: 0.12, s4: 0.12 });
    expect(game.outcome?.pots).toHaveLength(1);
    expect(game.outcome?.pots[0].amount).toBe(0.24);
    expect(game.outcome?.pots[0].eligiblePlayerIds).toEqual(["hero", "s4"]);
    expect(game.players.reduce((sum, player) => sum + player.stack, 0)).toBe(
      50,
    );
  });
});
