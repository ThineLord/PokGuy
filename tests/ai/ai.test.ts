import { adaptPersonality, smoothRate } from "@/src/ai/adaptation/adapt";
import { decideAIAction } from "@/src/ai/decision/decide";
import { estimateEquity, simulationDeck } from "@/src/ai/equity/monteCarlo";
import { getPersonality, PERSONALITIES } from "@/src/ai/personalities/presets";
import type { AIObservation } from "@/src/ai/types";
import { cardId, parseCards } from "@/src/engine/cards/cards";

function observation(): AIObservation {
  return {
    heroHoleCards: parseCards("AS KH") as AIObservation["heroHoleCards"],
    board: parseCards("QD 7C 2S"),
    street: "flop",
    pot: 10,
    toCall: 3,
    minRaiseTo: 9,
    maxRaiseTo: 100,
    currentBet: 3,
    heroStreetContribution: 0,
    heroStack: 100,
    effectiveStack: 100,
    position: 0.8,
    opponents: 2,
    allInOpponents: 0,
    legalActions: ["fold", "call", "raise", "all-in"],
    wasPreflopAggressor: true,
  };
}

describe("AI personalities", () => {
  it("provides eight distinct stable presets", () => {
    expect(PERSONALITIES).toHaveLength(8);
    expect(new Set(PERSONALITIES.map((profile) => profile.id)).size).toBe(8);
    expect(getPersonality("maniac").bluffFrequency).toBeGreaterThan(getPersonality("rock").bluffFrequency);
    expect(getPersonality("station").callDownTendency).toBeGreaterThan(getPersonality("tag").callDownTendency);
  });

  it("is deterministic for the same decision seed", () => {
    const first = decideAIAction(observation(), getPersonality("tag"), 77);
    const second = decideAIAction(observation(), getPersonality("tag"), 77);
    expect(second).toEqual(first);
  });

  it("ignores any extraneous hidden opponent cards", () => {
    const clean = observation();
    const contaminated = { ...clean, opponentHoleCards: parseCards("AC AD") } as AIObservation;
    expect(decideAIAction(contaminated, getPersonality("grinder"), 123)).toEqual(
      decideAIAction(clean, getPersonality("grinder"), 123),
    );
  });
});

describe("Monte Carlo equity", () => {
  it("removes every known card from the simulation deck", () => {
    const request = {
      holeCards: parseCards("AS KH") as [ReturnType<typeof parseCards>[number], ReturnType<typeof parseCards>[number]],
      board: parseCards("QD JC 2S"),
      deadCards: parseCards("3H 4H"),
      opponents: 2,
    };
    const remaining = new Set(simulationDeck(request).map(cardId));
    [...request.holeCards, ...request.board, ...request.deadCards].forEach((card) => {
      expect(remaining.has(cardId(card))).toBe(false);
    });
    expect(remaining.size).toBe(45);
  });

  it("is reproducible for the same seed", () => {
    const request = {
      holeCards: parseCards("AS AH") as [ReturnType<typeof parseCards>[number], ReturnType<typeof parseCards>[number]],
      board: parseCards("2C 7D 9S"),
      opponents: 1,
      iterations: 80,
      seed: 9,
    };
    expect(estimateEquity(request)).toEqual(estimateEquity(request));
  });
});

describe("bounded adaptation", () => {
  it("does not adapt before the minimum sample", () => {
    const base = getPersonality("tag");
    expect(adaptPersonality(base, { sampleSize: 10, foldRate: 1, callRate: 0, vpip: 0, continuationBetRate: 0, checkRate: 1 })).toEqual(base);
  });

  it("smooths observed rates with a prior", () => {
    expect(smoothRate(1, 1, 0.3, 30)).toBeCloseTo(10 / 31);
  });

  it("keeps mature adaptation within a conservative cap", () => {
    const base = getPersonality("lag");
    const adapted = adaptPersonality(base, { sampleSize: 300, foldRate: 1, callRate: 0, vpip: 1, continuationBetRate: 1, checkRate: 1 });
    expect(Math.abs(adapted.bluffFrequency - base.bluffFrequency)).toBeLessThanOrEqual(0.12 * base.adaptability + 1e-8);
  });
});
