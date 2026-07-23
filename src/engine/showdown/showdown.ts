import type { Card } from "../cards/cards";
import {
  compareEvaluations,
  evaluateBestHand,
  type HandEvaluation,
} from "../evaluator/evaluator";
import {
  calculatePotStructure,
  inferChipUnit,
  splitPot,
  type PotContribution,
  type SidePot,
} from "../pots/sidePots";

export interface ShowdownPlayer extends PotContribution {
  holeCards: Card[];
}

export interface PotAward {
  pot: SidePot;
  winnerIds: string[];
  shares: Record<string, number>;
}

export interface ShowdownResult {
  evaluations: Record<string, HandEvaluation>;
  awards: PotAward[];
  payouts: Record<string, number>;
  uncalledReturns: Record<string, number>;
}

export function resolveShowdown(
  players: ShowdownPlayer[],
  board: Card[],
  dealerSeat: number,
): ShowdownResult {
  if (board.length !== 5)
    throw new Error("Showdown requires a complete five-card board");
  const seats = Object.fromEntries(
    players.map((player) => [player.playerId, player.seat]),
  );
  const evaluations = Object.fromEntries(
    players
      .filter((player) => !player.folded)
      .map((player) => [
        player.playerId,
        evaluateBestHand([...player.holeCards, ...board]),
      ]),
  );
  const { pots, uncalledReturns } = calculatePotStructure(players);
  const payouts: Record<string, number> = Object.fromEntries(
    players.map((player) => [
      player.playerId,
      uncalledReturns[player.playerId] ?? 0,
    ]),
  );
  const chipUnit = inferChipUnit(players.map((player) => player.amount));
  const awards = pots.map((pot): PotAward => {
    const eligible = pot.eligiblePlayerIds.filter(
      (playerId) => evaluations[playerId],
    );
    if (eligible.length === 0)
      throw new Error(`Pot ${pot.id} has no eligible player`);
    let winners = [eligible[0]];
    for (const playerId of eligible.slice(1)) {
      const comparison = compareEvaluations(
        evaluations[playerId],
        evaluations[winners[0]],
      );
      if (comparison > 0) winners = [playerId];
      else if (comparison === 0) winners.push(playerId);
    }
    const shares = splitPot(pot.amount, winners, seats, dealerSeat, chipUnit);
    Object.entries(shares).forEach(([playerId, amount]) => {
      payouts[playerId] = (payouts[playerId] ?? 0) + amount;
    });
    return { pot, winnerIds: winners, shares };
  });
  return { evaluations, awards, payouts, uncalledReturns };
}

export function awardUncontestedPot(
  winnerId: string,
  contributions: PotContribution[],
): Record<string, number> {
  return {
    [winnerId]: contributions.reduce((sum, entry) => sum + entry.amount, 0),
  };
}
