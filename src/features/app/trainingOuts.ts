import type { Street } from "../../engine/betting/types";
import type { Card } from "../../engine/cards/cards";
import { evaluateBestHand } from "../../engine/evaluator/evaluator";

const STREETS_WITH_CARDS_TO_COME = new Set<Street>(["preflop", "flop", "turn"]);

function isMadeRoyalFlush(cards: readonly Card[]): boolean {
  if (cards.length < 5 || cards.length > 7) return false;
  const evaluation = evaluateBestHand([...cards]);
  return (
    evaluation.category === "straight-flush" && evaluation.tiebreakers[0] === 14
  );
}

// The texture score is not a card count. Show it only while a later card can
// still improve the hand. A river has no card left, and a made royal flush
// cannot improve.
export function displayedTrainingOuts(input: {
  street: Street;
  holeCards: readonly Card[];
  board: readonly Card[];
  drawStrength: number;
}): number | null {
  if (
    !STREETS_WITH_CARDS_TO_COME.has(input.street) ||
    input.board.length >= 5
  ) {
    return null;
  }
  if (isMadeRoyalFlush([...input.holeCards, ...input.board])) return null;
  const estimate = Math.round(input.drawStrength * 16);
  if (!Number.isFinite(estimate)) return null;
  return Math.max(0, estimate);
}
