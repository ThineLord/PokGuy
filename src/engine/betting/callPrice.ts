import { CHIP_EPSILON, normalizeChips } from "../chips/chips";
import { calculatePotStructure, type PotContribution } from "../pots/sidePots";
import { amountToCall } from "./actionValidator";
import type { BettingRoundState, PlayerStatus } from "./types";

export interface CallPrice {
  payable: number;
  contestable: number;
  odds: number;
}

function stillContesting(status: PlayerStatus): boolean {
  return status === "active" || status === "all-in";
}

// Price of calling now: chips this player can commit, divided by the pots
// they can win after that call. The displayed total still includes chips
// they cannot win.
export function callPrice(
  state: BettingRoundState,
  playerId: string,
): CallPrice {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new Error("Unknown player");
  const payable = normalizeChips(
    Math.min(Math.max(0, player.stack), amountToCall(state, player)),
  );
  if (payable <= CHIP_EPSILON) return { payable: 0, contestable: 0, odds: 0 };

  const contributions: PotContribution[] = state.players.map((entry) => ({
    playerId: entry.id,
    seat: entry.seat,
    amount:
      entry.id === player.id
        ? normalizeChips(entry.totalContribution + payable)
        : entry.totalContribution,
    folded: !stillContesting(entry.status),
  }));
  const contestable = normalizeChips(
    calculatePotStructure(contributions)
      .pots.filter((pot) => pot.eligiblePlayerIds.includes(player.id))
      .reduce((sum, pot) => sum + pot.amount, 0),
  );
  return {
    payable,
    contestable,
    odds: contestable > CHIP_EPSILON ? payable / contestable : 0,
  };
}
