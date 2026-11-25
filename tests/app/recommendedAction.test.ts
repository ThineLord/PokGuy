import { legalActionsFor } from "@/src/engine/betting/actionValidator";
import { callPrice } from "@/src/engine/betting/callPrice";
import {
  act,
  startHand,
  startTrainingScenario,
} from "@/src/engine/state/gameState";
import { recommendedHintAction } from "@/src/features/app/recommendedAction";

const blinds = {
  dealerSeat: 0,
  smallBlind: 0.5,
  bigBlind: 1,
  seed: 11,
};

function hintFor(
  game: NonNullable<ReturnType<typeof startHand>>,
  heroId: string,
  equity: number,
) {
  const price = callPrice(game, heroId);
  return recommendedHintAction({
    equity,
    currentBet: game.currentBet,
    toCall: price.payable,
    callOdds: price.odds,
    legal: legalActionsFor(game, heroId),
  });
}

describe("recommended action hint", () => {
  it("recommends a call when a strong hand cannot raise into an all-in", () => {
    const game = startHand({
      ...blinds,
      players: [
        { id: "hero", name: "Hero", seat: 0, stack: 100, kind: "human" },
        { id: "villain", name: "Villain", seat: 1, stack: 0.75, kind: "ai" },
      ],
    });
    const legal = legalActionsFor(game, "hero");
    expect(game.actingPlayerId).toBe("hero");
    expect(game.settled).toBe(false);
    expect(legal.call.legal).toBe(true);
    expect(legal.raise.legal).toBe(false);
    expect(legal["all-in"].legal).toBe(false);
    expect(hintFor(game, "hero", 0.9)).toBe("call");
  });

  it("still recommends a raise when a strong hand may legally raise", () => {
    const game = startHand({
      ...blinds,
      players: [
        { id: "hero", name: "Hero", seat: 0, stack: 100, kind: "human" },
        { id: "villain", name: "Villain", seat: 1, stack: 100, kind: "ai" },
      ],
    });
    expect(legalActionsFor(game, "hero").raise.legal).toBe(true);
    expect(hintFor(game, "hero", 0.9)).toBe("raise");
  });

  it("still recommends a bet when a strong hand may legally bet", () => {
    const game = startTrainingScenario({
      ...blinds,
      players: [
        { id: "villain", name: "Villain", seat: 0, stack: 100, kind: "ai" },
        { id: "hero", name: "Hero", seat: 1, stack: 100, kind: "human" },
      ],
      heroId: "hero",
      startStreet: "flop",
    });
    expect(game.actingPlayerId).toBe("hero");
    expect(game.currentBet).toBe(0);
    expect(legalActionsFor(game, "hero").bet.legal).toBe(true);
    expect(hintFor(game, "hero", 0.9)).toBe("bet");
  });

  it("still recommends a raise when one short all-in leaves another live player", () => {
    const game = startHand({
      ...blinds,
      players: [
        { id: "hero", name: "Hero", seat: 0, stack: 100, kind: "human" },
        { id: "short", name: "Short", seat: 1, stack: 0.25, kind: "ai" },
        { id: "live", name: "Live", seat: 2, stack: 100, kind: "ai" },
      ],
    });
    expect(legalActionsFor(game, "hero").raise.legal).toBe(true);
    expect(hintFor(game, "hero", 0.9)).toBe("raise");
    const called = act(game, "hero", { type: "call" });
    expect(called.settled).toBe(false);
  });

  it("uses the 45% short-stack price instead of the nominal gap or raw pot", () => {
    let game = startHand({
      ...blinds,
      players: [
        { id: "hero", name: "Hero", seat: 0, stack: 10, kind: "human" },
        { id: "button", name: "Button", seat: 1, stack: 100, kind: "ai" },
      ],
      dealerSeat: 1,
    });
    game = act(game, "button", { type: "all-in" });
    const price = callPrice(game, "hero");
    const pot = game.players.reduce(
      (sum, player) => sum + player.totalContribution,
      0,
    );
    expect(price.payable).toBe(9);
    expect(price.odds).toBeCloseTo(0.45);
    expect(price.odds).not.toBeCloseTo(9 / (pot + 9));
    expect(hintFor(game, "hero", 0.42)).toBe("call");
    expect(hintFor(game, "hero", 0.1)).toBe("fold");
  });
});
