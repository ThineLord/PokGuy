import { CHIP_EPSILON } from "../chips/chips";

export type CashTableContinuationReason =
  "ready" | "hero-busted" | "one-funded-player";

export interface CashTableStack {
  id: string;
  stack: number;
}

export interface CashTableContinuation {
  canDealNextHand: boolean;
  heroNeedsRebuy: boolean;
  fundedPlayerIds: string[];
  bustedPlayerIds: string[];
  reason: CashTableContinuationReason;
}

export function cashTableContinuation(
  players: CashTableStack[],
  heroId: string,
): CashTableContinuation {
  const fundedPlayerIds = players
    .filter((player) => player.stack > CHIP_EPSILON)
    .map((player) => player.id);
  const bustedPlayerIds = players
    .filter((player) => player.stack <= CHIP_EPSILON)
    .map((player) => player.id);
  const heroNeedsRebuy = !fundedPlayerIds.includes(heroId);
  const reason: CashTableContinuationReason = heroNeedsRebuy
    ? "hero-busted"
    : fundedPlayerIds.length < 2
      ? "one-funded-player"
      : "ready";

  return {
    canDealNextHand: reason === "ready",
    heroNeedsRebuy,
    fundedPlayerIds,
    bustedPlayerIds,
    reason,
  };
}
