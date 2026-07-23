export interface PotContribution {
  playerId: string;
  seat: number;
  amount: number;
  folded: boolean;
}

export interface SidePot {
  id: string;
  amount: number;
  cap: number;
  contributors: string[];
  eligiblePlayerIds: string[];
}

export interface PotStructure {
  pots: SidePot[];
  uncalledReturns: Record<string, number>;
}

export function calculatePotStructure(
  contributions: PotContribution[],
): PotStructure {
  if (
    contributions.some(
      (entry) => entry.amount < 0 || !Number.isFinite(entry.amount),
    )
  ) {
    throw new Error("Contributions must be finite non-negative numbers");
  }
  const levels = [
    ...new Set(
      contributions.map((entry) => entry.amount).filter((amount) => amount > 0),
    ),
  ].sort((a, b) => a - b);
  const pots: SidePot[] = [];
  const uncalledReturns: Record<string, number> = {};
  let previous = 0;

  levels.forEach((cap) => {
    const participants = contributions.filter((entry) => entry.amount >= cap);
    const amount = (cap - previous) * participants.length;
    previous = cap;

    if (amount <= 0) return;
    if (participants.length === 1) {
      const [participant] = participants;
      uncalledReturns[participant.playerId] = Number(
        ((uncalledReturns[participant.playerId] ?? 0) + amount).toFixed(6),
      );
      return;
    }

    const potIndex = pots.length;
    pots.push({
      id: potIndex === 0 ? "main" : `side-${potIndex}`,
      amount,
      cap,
      contributors: participants.map((entry) => entry.playerId),
      eligiblePlayerIds: participants
        .filter((entry) => !entry.folded)
        .map((entry) => entry.playerId),
    });
  });

  return { pots, uncalledReturns };
}

export function calculateSidePots(contributions: PotContribution[]): SidePot[] {
  return calculatePotStructure(contributions).pots;
}

export function totalPot(contributions: PotContribution[]): number {
  return contributions.reduce((total, entry) => total + entry.amount, 0);
}

export function oddChipOrder(
  playerIds: string[],
  seatsByPlayer: Record<string, number>,
  dealerSeat: number,
): string[] {
  return [...playerIds].sort((a, b) => {
    const distanceA = (seatsByPlayer[a] - dealerSeat + 1000) % 1000 || 1000;
    const distanceB = (seatsByPlayer[b] - dealerSeat + 1000) % 1000 || 1000;
    return distanceA - distanceB;
  });
}

export function splitPot(
  amount: number,
  winnerIds: string[],
  seatsByPlayer: Record<string, number>,
  dealerSeat: number,
  chipUnit = 1,
): Record<string, number> {
  if (winnerIds.length === 0)
    throw new Error("A pot must have at least one winner");
  if (chipUnit <= 0) throw new Error("Chip unit must be positive");
  const units = Math.round(amount / chipUnit);
  const baseUnits = Math.floor(units / winnerIds.length);
  let remainder = units - baseUnits * winnerIds.length;
  const order = oddChipOrder(winnerIds, seatsByPlayer, dealerSeat);
  return Object.fromEntries(
    order.map((playerId) => {
      const extra = remainder > 0 ? 1 : 0;
      remainder -= extra;
      return [playerId, Number(((baseUnits + extra) * chipUnit).toFixed(6))];
    }),
  );
}

export function inferChipUnit(amounts: number[]): number {
  const scale = 1000;
  const values = amounts
    .filter((amount) => amount > 0)
    .map((amount) => Math.round(amount * scale));
  if (values.length === 0) return 1;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  return values.reduce(gcd) / scale;
}
