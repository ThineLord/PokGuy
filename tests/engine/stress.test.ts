import { legalActionsFor } from "@/src/engine/betting/actionValidator";
import type { PokerAction } from "@/src/engine/betting/types";
import { cardId } from "@/src/engine/cards/cards";
import { SeededRandom } from "@/src/engine/deck/random";
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
