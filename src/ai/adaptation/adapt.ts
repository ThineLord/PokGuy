import type { PokerPersonality, UserTendencyProfile } from "../types";

const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));

export function adaptPersonality(
  base: PokerPersonality,
  user: UserTendencyProfile | undefined,
): PokerPersonality {
  if (!user || user.sampleSize < 20 || base.adaptability <= 0)
    return { ...base };
  const confidence = clamp((user.sampleSize - 20) / 80);
  const power = base.adaptability * confidence;
  const capped = (adjustment: number) => clamp(adjustment, -0.12, 0.12) * power;
  const boundedDelta = (adjustment: number) =>
    clamp(adjustment, -0.12 * power, 0.12 * power);
  const excessiveFolds = capped((user.foldRate - 0.48) * 0.42);
  const excessiveCalls = capped((user.callRate - 0.38) * 0.4);
  const loosePreflop = capped((user.vpip - 0.32) * 0.32);
  const frequentCbet = capped((user.continuationBetRate - 0.62) * 0.3);
  const passiveChecks = capped((user.checkRate - 0.46) * 0.3);
  return {
    ...base,
    bluffFrequency: clamp(
      base.bluffFrequency + boundedDelta(excessiveFolds - excessiveCalls),
    ),
    pfr: clamp(
      base.pfr + boundedDelta(excessiveFolds * 0.45 + loosePreflop * 0.35),
    ),
    aggression: clamp(
      base.aggression + boundedDelta(passiveChecks - excessiveCalls * 0.35),
    ),
    checkRaiseFrequency: clamp(
      base.checkRaiseFrequency + boundedDelta(frequentCbet),
    ),
  };
}

export function smoothRate(
  observedSuccesses: number,
  observedOpportunities: number,
  priorRate: number,
  priorWeight = 30,
): number {
  if (observedOpportunities < 0 || observedSuccesses < 0)
    throw new Error("Counts cannot be negative");
  return (
    (observedSuccesses + priorRate * priorWeight) /
    (observedOpportunities + priorWeight)
  );
}
