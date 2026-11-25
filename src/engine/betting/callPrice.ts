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

// Price of calling now. The payable amount is what a call commits. Immediate
// odds use only the part an opposing contribution already covers, divided by
// the pots this player can win. The displayed total still includes chips they
// cannot win.
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
    amount: entry.totalContribution,
    folded: !stillContesting(entry.status),
  }));
  const before = calculatePotStructure(contributions);
  const after = calculatePotStructure(
    contributions.map((entry) =>
      entry.playerId === player.id
        ? { ...entry, amount: normalizeChips(entry.amount + payable) }
        : entry,
    ),
  );
  const contestable = normalizeChips(
    after.pots
      .filter((pot) => pot.eligiblePlayerIds.includes(player.id))
      .reduce((sum, pot) => sum + pot.amount, 0),
  );
  // A nominal call can exceed every opposing contribution. Those chips are
  // returned unless someone later covers them, so they are not immediate risk.
  // Subtract only the unmatched part added by this call; do not clamp the ratio.
  const unmatched = normalizeChips(
    Math.max(
      0,
      (after.uncalledReturns[player.id] ?? 0) -
        (before.uncalledReturns[player.id] ?? 0),
    ),
  );
  const risk = normalizeChips(Math.max(0, payable - unmatched));
  return {
    payable,
    contestable,
    odds: contestable > CHIP_EPSILON ? risk / contestable : 0,
  };
}
