import { legalActionsFor } from "@/src/engine/betting/actionValidator";
import type { PokerAction } from "@/src/engine/betting/types";
import { cardId } from "@/src/engine/cards/cards";
import { SeededRandom } from "@/src/engine/deck/random";
import { isCompletedGame } from "@/src/storage/validateStoredGame";
import { act, startHand } from "@/src/engine/state/gameState";

const players = Array.from({ length: 6 }, (_, seat) => ({
  id: `p${seat}`,
  name: `P${seat}`,
  seat,
  stack: 40,
  kind: seat === 0 ? ("human" as const) : ("ai" as const),
}));

describe("seeded multi-hand stress", () => {
  it("finishes 120 varied hands without duplicate cards, deadlocks, or lost chips", () => {
    const initialChips = players.reduce((sum, player) => sum + player.stack, 0);

    for (let seed = 1; seed <= 120; seed += 1) {
      const random = new SeededRandom(seed * 7_919);
      let game = startHand({
        players,
        dealerSeat: seed % players.length,
        smallBlind: 0.5,
        bigBlind: 1,
        seed,
      });
      let actions = 0;

      while (!game.settled) {
        actions += 1;
        expect(actions).toBeLessThan(300);

        const actorId = game.actingPlayerId;
        expect(actorId).not.toBeNull();
        const actor = game.players.find((player) => player.id === actorId)!;
        const legal = legalActionsFor(game, actor.id);
        const roll = random.next();
        let action: PokerAction;

        if (roll > 0.965 && legal["all-in"].legal) {
          action = { type: "all-in" };
        } else if (roll > 0.78 && legal.raise.legal) {
          action = {
            type: "raise",
            amount: Math.min(
              actor.streetContribution + actor.stack,
              game.currentBet + game.minRaiseIncrement,
            ),
          };
        } else if (roll > 0.78 && legal.bet.legal) {
          action = { type: "bet", amount: game.bigBlind };
        } else if (legal.check.legal) {
          action = { type: "check" };
        } else if (roll < 0.82 && legal.call.legal) {
          action = { type: "call" };
        } else {
          action = { type: "fold" };
        }

        game = act(game, actor.id, action);
        const cards = [
          ...game.players.flatMap((player) => player.holeCards),
          ...game.board,
          ...game.burnCards,
          ...game.deck,
        ];
        expect(cards).toHaveLength(52);
        expect(new Set(cards.map(cardId)).size).toBe(52);

        if (!game.settled) {
          const accounted =
            game.players.reduce((sum, player) => sum + player.stack, 0) +
            game.players.reduce(
              (sum, player) => sum + player.totalContribution,
              0,
            );
          expect(accounted).toBeCloseTo(initialChips, 8);
        }
      }

      expect(
        game.players.reduce((sum, player) => sum + player.stack, 0),
      ).toBeCloseTo(initialChips, 8);
    }
  });
});

it("conserves chips and eligibility across 300 reproducible short-stack tables of 2–6 seats", () => {
  const stackSizes = [0, 0.01, 0.25, 0.5, 0.75, 1, 1.25, 2, 3, 11, 25];
  for (let seed = 1; seed <= 300; seed++) {
    const random = new SeededRandom(seed * 104729);
    const table = players.slice(0, 2 + (seed % 5)).map((player, i) => ({
      ...player,
      stack:
        i < 2
          ? stackSizes[1 + Math.floor(random.next() * (stackSizes.length - 1))]
          : stackSizes[Math.floor(random.next() * stackSizes.length)],
    }));
    const total = table.reduce(
      (sum, player) => sum + Math.round(player.stack * 100),
      0,
    );
    let game = startHand({
      players: table,
      dealerSeat: seed % table.length,
      smallBlind: 0.5,
      bigBlind: 1,
      seed,
    });
    let steps = 0;
    while (!game.settled) {
      expect(++steps, `seed ${seed}`).toBeLessThan(150);
      const actor = game.players.find(
        (player) => player.id === game.actingPlayerId,
      )!;
      expect(actor.status).toBe("active");
      expect(actor.stack).toBeGreaterThan(0);
      const legal = legalActionsFor(game, actor.id);
      const choices = Object.entries(legal).filter(
        ([, validation]) => validation.legal,
      );
      const [type, validation] =
        choices[Math.floor(random.next() * choices.length)];
      const action: PokerAction =
        type === "bet" || type === "raise"
          ? {
              type,
              amount: Math.min(validation.minRaiseTo!, validation.maxRaiseTo),
            }
          : { type: type as PokerAction["type"] };
      game = act(game, actor.id, action);
      const accounted = game.players.reduce(
        (sum, player) =>
          sum +
          Math.round(player.stack * 100) +
          (game.settled ? 0 : Math.round(player.totalContribution * 100)),
        0,
      );
      expect(accounted, `seed ${seed}`).toBe(total);
      expect(
        game.players.every(
          (player) =>
            player.stack >= 0 &&
            player.totalContribution <= player.startingStack,
        ),
      ).toBe(true);
    }
    const cards = [
      ...game.deck,
      ...game.board,
      ...game.burnCards,
      ...game.players.flatMap((player) => player.holeCards),
    ];
    expect(cards).toHaveLength(52);
    expect(new Set(cards.map(cardId)).size).toBe(52);
    expect(
      game.players.reduce(
        (sum, player) => sum + Math.round(player.stack * 100),
        0,
      ),
    ).toBe(total);
    for (const award of game.outcome?.showdown?.awards ?? []) {
      expect(
        Object.values(award.shares).reduce(
          (sum, value) => sum + Math.round(value * 100),
          0,
        ),
      ).toBe(Math.round(award.pot.amount * 100));
      expect(
        award.winnerIds.every(
          (id) =>
            game.players.find((player) => player.id === id)!.status !==
            "folded",
        ),
      ).toBe(true);
      expect(award.pot.contributors).toEqual(
        game.players
          .filter((player) => player.totalContribution >= award.pot.cap)
          .map((player) => player.id),
      );
    }
    expect(isCompletedGame(game), `history round-trip seed ${seed}`).toBe(true);
    expect(() => act(game, game.players[0].id, { type: "check" })).toThrow(
      "already complete",
    );
  }
});
