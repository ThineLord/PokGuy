import { amountToCall } from "../../engine/betting/actionValidator";
import type { PokerAction } from "../../engine/betting/types";
import type { PokerGameState } from "../../engine/state/gameState";
import type { TrainingRecord } from "../../storage/types";

// This is a transparent heuristic, not a solver or a verdict on optimal play.
// Only observed pre-action values are stored; hidden opponent cards are excluded.
export function evaluateTrainingDecision(
  game: PokerGameState,
  heroId: string,
  action: PokerAction,
  estimate?: number,
): TrainingRecord {
  const hero = game.players.find((player) => player.id === heroId);
  if (!hero) throw new Error("Unknown hero");
  const pot = game.players.reduce(
    (sum, player) => sum + player.totalContribution,
    0,
  );
  const toCall = amountToCall(game, hero);
  const paid =
    action.type === "all-in"
      ? hero.stack
      : action.type === "call"
        ? Math.min(hero.stack, toCall)
        : action.type === "bet" || action.type === "raise"
          ? Math.max(
              0,
              Math.min(
                hero.stack,
                (action.amount ?? 0) - hero.streetContribution,
              ),
            )
          : 0;
  const equity =
    estimate !== undefined &&
    Number.isFinite(estimate) &&
    estimate >= 0 &&
    estimate <= 1
      ? estimate
      : null;
  const aggressive = paid > toCall;
  let grade: TrainingRecord["grade"] = "未充分评估";
  let reason: NonNullable<TrainingRecord["context"]>["reason"] = "unassessed";
  if (aggressive && paid - toCall > pot * 2.25) {
    grade = "尺度异常";
    reason = "oversize";
  } else if (action.type === "fold" && toCall === 0) {
    grade = "偏紧";
    reason = "free-fold";
  } else if (
    paid > 0 &&
    !aggressive &&
    equity !== null &&
    paid / (pot + paid) > equity + 0.08
  ) {
    grade = "偏松";
    reason = "low-equity-call";
  } else if (
    paid >= hero.stack - 0.000001 &&
    aggressive &&
    equity !== null &&
    equity < 0.55
  ) {
    grade = "高风险";
    reason = "low-equity-allin";
  }
  return {
    handId: game.handId,
    createdAt: new Date().toISOString(),
    grade,
    context: {
      policyVersion: 1,
      actionIndex: game.actions.length,
      street: game.street,
      potBefore: pot,
      toCall,
      stackBefore: hero.stack,
      amountCommitted: paid,
      equityEstimate: equity,
      reason,
    },
  };
}
