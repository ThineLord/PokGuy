import { createDeck } from "@/src/engine/deck/deck";
import { cardId, parseCards } from "@/src/engine/cards/cards";
import { act, startHand, startTrainingScenario } from "@/src/engine/state/gameState";

const headsUpPlayers = [
  { id: "hero", name: "Hero", seat: 0, stack: 100, kind: "human" as const },
  { id: "villain", name: "Villain", seat: 1, stack: 100, kind: "ai" as const },
];

describe("game state machine", () => {
  it("gives the big blind an option after the button calls heads-up", () => {
    let game = startHand({
      players: headsUpPlayers,
      dealerSeat: 0,
      smallBlind: 0.5,
      bigBlind: 1,
      deck: createDeck(),
    });
    expect(game.actingPlayerId).toBe("hero");
    game = act(game, "hero", { type: "call" });
    expect(game.street).toBe("preflop");
    expect(game.actingPlayerId).toBe("villain");
    game = act(game, "villain", { type: "check" });
    expect(game.street).toBe("flop");
    expect(game.board).toHaveLength(3);
    expect(game.actingPlayerId).toBe("villain");
  });

  it("awards the pot once when everybody else folds", () => {
    const initial = startHand({
      players: headsUpPlayers,
      dealerSeat: 0,
      smallBlind: 0.5,
      bigBlind: 1,
      deck: createDeck(),
    });
    const complete = act(initial, "hero", { type: "fold" });
    expect(complete.outcome?.reason).toBe("folds");
    expect(complete.players.find((player) => player.id === "villain")?.stack).toBe(100.5);
    expect(() => act(complete, "villain", { type: "check" })).toThrow("already complete");
  });

  it("plays through every street and reaches showdown", () => {
    let game = startHand({
      players: headsUpPlayers,
      dealerSeat: 0,
      smallBlind: 0.5,
      bigBlind: 1,
      deck: createDeck(),
    });
    game = act(game, "hero", { type: "call" });
    game = act(game, "villain", { type: "check" });
    for (const street of ["flop", "turn", "river"] as const) {
      expect(game.street).toBe(street);
      game = act(game, "villain", { type: "check" });
      game = act(game, "hero", { type: "check" });
    }
    expect(game.street).toBe("complete");
    expect(game.board).toHaveLength(5);
    expect(game.outcome?.reason).toBe("showdown");
    expect(Object.values(game.outcome?.payouts ?? {}).reduce((a, b) => a + b, 0)).toBe(2);
  });

  it("runs out the board after all players are all-in", () => {
    const shortPlayers = headsUpPlayers.map((player) => ({ ...player, stack: 5 }));
    let game = startHand({
      players: shortPlayers,
      dealerSeat: 0,
      smallBlind: 0.5,
      bigBlind: 1,
      deck: createDeck(),
    });
    game = act(game, "hero", { type: "all-in" });
    game = act(game, "villain", { type: "call" });
    expect(game.street).toBe("complete");
    expect(game.board).toHaveLength(5);
    expect(game.outcome?.reason).toBe("showdown");
  });

  it("does not deadlock when only the big blind has chips behind", () => {
    const complete = startHand({
      players: [
        { ...headsUpPlayers[0], stack: 0.5 },
        { ...headsUpPlayers[1], stack: 10 },
      ],
      dealerSeat: 0,
      smallBlind: 0.5,
      bigBlind: 1,
      deck: createDeck(),
    });
    expect(complete.street).toBe("complete");
    expect(complete.board).toHaveLength(5);
    expect(complete.settled).toBe(true);
  });

  it("builds a scenario without duplicating specified or hidden cards", () => {
    const scenario = startTrainingScenario({
      players: headsUpPlayers,
      dealerSeat: 0,
      smallBlind: 0.5,
      bigBlind: 1,
      heroId: "hero",
      heroHoleCards: parseCards("AS AH") as [ReturnType<typeof parseCards>[number], ReturnType<typeof parseCards>[number]],
      board: parseCards("2C 7D 9S JC"),
      startStreet: "turn",
      seed: 42,
    });
    const cards = [...scenario.players.flatMap((player) => player.holeCards), ...scenario.board, ...scenario.deck];
    expect(new Set(cards.map(cardId)).size).toBe(cards.length);
    expect(scenario.players.find((player) => player.id === "hero")?.holeCards).toEqual(parseCards("AS AH"));
    expect(scenario.board).toHaveLength(4);
  });
});
