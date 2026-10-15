import {
  act,
  startHand,
  startTrainingScenario,
} from "@/src/engine/state/gameState";
import { legalActionsFor } from "@/src/engine/betting/actionValidator";
import { cardId } from "@/src/engine/cards/cards";
import {
  appendCompletedHand,
  defaultData,
  migrateDataWithRecovery,
  normalizeSettings,
} from "@/src/storage/storage";

const positions: Record<number, string[]> = {
  2: ["BTN / SB", "BB"],
  3: ["BTN", "SB", "BB"],
  4: ["BTN", "SB", "BB", "CO"],
  5: ["BTN", "SB", "BB", "UTG", "CO"],
  6: ["BTN", "SB", "BB", "UTG", "HJ", "CO"],
  7: ["BTN", "SB", "BB", "UTG", "LJ", "HJ", "CO"],
  8: ["BTN", "SB", "BB", "UTG", "UTG+1", "LJ", "HJ", "CO"],
  9: ["BTN", "SB", "BB", "UTG", "UTG+1", "MP", "LJ", "HJ", "CO"],
};
const players = (count: number) =>
  Array.from({ length: count }, (_, seat) => ({
    id: seat === 0 ? "hero" : `ai-${seat}`,
    name: `Player ${seat}`,
    seat,
    stack: 100,
    kind: seat === 0 ? ("human" as const) : ("ai" as const),
  }));

describe.each([2, 3, 4, 5, 6, 7, 8, 9])("%i-player tables", (count) => {
  it("deals unique cards and rotates positions and action order through every button", () => {
    for (let button = 0; button < count; button++) {
      let game = startHand({
        players: players(count),
        dealerSeat: button,
        smallBlind: 0.5,
        bigBlind: 1,
        seed: 42,
      });
      for (let offset = 0; offset < count; offset++) {
        expect(game.players[(button + offset) % count].positionLabel).toBe(
          positions[count][offset],
        );
      }
      expect(game.actingPlayerId).toBe(
        game.players[(button + (count === 2 ? 0 : 3)) % count].id,
      );
      expect(
        new Set(
          [...game.deck, ...game.players.flatMap((p) => p.holeCards)].map(
            cardId,
          ),
        ).size,
      ).toBe(52);
      for (let action = 0; action < count; action++) {
        const actor = game.actingPlayerId!;
        game = act(game, actor, {
          type: legalActionsFor(game, actor).check.legal ? "check" : "call",
        });
      }
      expect(game.street).toBe("flop");
      expect(game.actingPlayerId).toBe(game.players[(button + 1) % count].id);
    }
  });

  it("settles multiway all-ins with side pots and survives history reload", () => {
    let game = startHand({
      players: players(count).map((p, i) => ({ ...p, stack: 20 + i * 10 })),
      dealerSeat: 0,
      smallBlind: 0.5,
      bigBlind: 1,
      seed: count,
    });
    for (let step = 0; !game.settled && step < 30; step++) {
      const actor = game.actingPlayerId!;
      const legal = legalActionsFor(game, actor);
      game = act(game, actor, {
        type: legal["all-in"].legal
          ? "all-in"
          : legal.call.legal
            ? "call"
            : "check",
      });
    }
    expect(game.settled).toBe(true);
    expect(game.outcome?.reason).toBe("showdown");
    expect(game.board).toHaveLength(5);
    expect(game.players.reduce((sum, p) => sum + p.stack, 0)).toBe(
      count * 20 + count * (count - 1) * 5,
    );
    const data = defaultData();
    data.settings.seatCount = count;
    const saved = appendCompletedHand(data, game, "hero");
    const loaded = migrateDataWithRecovery(JSON.parse(JSON.stringify(saved)));
    expect(loaded.recovered).toBe(false);
    expect(loaded.data.recentHands).toHaveLength(1);
    expect(loaded.data.recentHands[0].game.players).toHaveLength(count);
    expect(loaded.data.settings.seatCount).toBe(count);
  });

  it("starts postflop training with the requested full table", () => {
    const game = startTrainingScenario({
      players: players(count),
      dealerSeat: 0,
      smallBlind: 0.5,
      bigBlind: 1,
      seed: 72,
      heroId: "hero",
      startStreet: "turn",
    });
    expect(game.players).toHaveLength(count);
    expect(game.board).toHaveLength(4);
    expect(
      game.players.every((p) => p.positionLabel && p.holeCards.length === 2),
    ).toBe(true);
  });
});

it("rejects unsupported player counts and repairs imported settings", () => {
  for (const count of [1, 10]) {
    expect(() =>
      startHand({
        players: players(count),
        dealerSeat: 0,
        smallBlind: 0.5,
        bigBlind: 1,
      }),
    ).toThrow("2 to 9");
    expect(normalizeSettings({ seatCount: count }).seatCount).toBe(6);
  }
  expect(normalizeSettings({ seatCount: 8.5 }).seatCount).toBe(6);
});
