// @vitest-environment node
import { adaptPersonality, smoothRate } from "@/src/ai/adaptation/adapt";
import { decideAIAction } from "@/src/ai/decision/decide";
import { estimateEquity, simulationDeck } from "@/src/ai/equity/monteCarlo";
import { getPersonality, PERSONALITIES } from "@/src/ai/personalities/presets";
import type { AIObservation } from "@/src/ai/types";
import {
  legalActionsFor,
  validateAction,
} from "@/src/engine/betting/actionValidator";
import { cardId, parseCards, type Card } from "@/src/engine/cards/cards";
import { startHand } from "@/src/engine/state/gameState";

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
    expect(getPersonality("maniac").bluffFrequency).toBeGreaterThan(
      getPersonality("rock").bluffFrequency,
    );
    expect(getPersonality("station").callDownTendency).toBeGreaterThan(
      getPersonality("tag").callDownTendency,
    );
  });

  it("is deterministic for the same decision seed", () => {
    const first = decideAIAction(observation(), getPersonality("tag"), 77);
    const second = decideAIAction(observation(), getPersonality("tag"), 77);
    expect(second).toEqual(first);
  });

  it("stays inside the legal actions when the opponent is already all-in", () => {
    const game = startHand({
      players: [
        { id: "hero", name: "Hero", seat: 0, stack: 100, kind: "human" },
        { id: "villain", name: "Villain", seat: 1, stack: 0.75, kind: "ai" },
      ],
      dealerSeat: 0,
      smallBlind: 0.5,
      bigBlind: 1,
      seed: 11,
    });
    const actor = game.players.find((player) => player.id === "hero");
    const villain = game.players.find((player) => player.id === "villain");
    if (!actor || !villain) throw new Error("missing players");
    const legal = legalActionsFor(game, actor.id);
    const legalActions = Object.entries(legal)
      .filter(([, result]) => result.legal)
      .map(([action]) => action);
    const observation: AIObservation = {
      heroHoleCards: actor.holeCards as AIObservation["heroHoleCards"],
      board: game.board,
      street: game.street,
      pot: game.players.reduce(
        (sum, player) => sum + player.totalContribution,
        0,
      ),
      toCall: legal.call.toCall,
      minRaiseTo: legal.raise.minRaiseTo,
      maxRaiseTo: legal.raise.maxRaiseTo,
      currentBet: game.currentBet,
      heroStreetContribution: actor.streetContribution,
      heroStack: actor.stack,
      effectiveStack: Math.min(actor.stack, villain.stack),
      position: 0.2,
      opponents: 1,
      allInOpponents: 1,
      legalActions: legalActions as AIObservation["legalActions"],
      wasPreflopAggressor: false,
    };
    const containsCard = (value: unknown, id: string): boolean => {
      if (!value || typeof value !== "object") return false;
      if ("rank" in value && "suit" in value && cardId(value as Card) === id)
        return true;
      return Object.values(value).some((inner) => containsCard(inner, id));
    };
    for (const card of villain.holeCards) {
      expect(containsCard(observation, cardId(card))).toBe(false);
    }
    for (const profile of PERSONALITIES) {
      for (let seed = 1; seed <= 8; seed += 1) {
        const decision = decideAIAction(observation, profile, seed);
        expect(legalActions).toContain(decision.action);
        expect(
          validateAction(game, actor.id, {
            type: decision.action,
            amount: decision.amount,
          }).legal,
        ).toBe(true);
      }
    }
  });

  it("ignores any extraneous hidden opponent cards", () => {
    const clean = observation();
    const contaminated = {
      ...clean,
      opponentHoleCards: parseCards("AC AD"),
    } as AIObservation;
    expect(
      decideAIAction(contaminated, getPersonality("grinder"), 123),
    ).toEqual(decideAIAction(clean, getPersonality("grinder"), 123));
  });

  it("keeps aggressive and passive personalities observably distinct", () => {
    const actionsFor = (personalityId: string) =>
      Array.from({ length: 40 }, (_, seed) =>
        decideAIAction(observation(), getPersonality(personalityId), seed + 1),
      ).map((decision) => decision.action);
    const aggressiveCount = (actions: ReturnType<typeof actionsFor>) =>
      actions.filter((action) => ["bet", "raise", "all-in"].includes(action))
        .length;
    const foldCount = (actions: ReturnType<typeof actionsFor>) =>
      actions.filter((action) => action === "fold").length;

    const maniac = actionsFor("maniac");
    const rock = actionsFor("rock");
    const station = actionsFor("station");
    expect(aggressiveCount(maniac)).toBeGreaterThan(aggressiveCount(rock) + 3);
    expect(foldCount(station)).toBeLessThan(foldCount(rock));
  });
});

describe("Monte Carlo equity", () => {
  it("removes every known card from the simulation deck", () => {
    const request = {
      holeCards: parseCards("AS KH") as [
        ReturnType<typeof parseCards>[number],
        ReturnType<typeof parseCards>[number],
      ],
      board: parseCards("QD JC 2S"),
      deadCards: parseCards("3H 4H"),
      opponents: 2,
    };
    const remaining = new Set(simulationDeck(request).map(cardId));
    [...request.holeCards, ...request.board, ...request.deadCards].forEach(
      (card) => {
        expect(remaining.has(cardId(card))).toBe(false);
      },
    );
    expect(remaining.size).toBe(45);
  });

  it("is reproducible for the same seed", () => {
    const request = {
      holeCards: parseCards("AS AH") as [
        ReturnType<typeof parseCards>[number],
        ReturnType<typeof parseCards>[number],
      ],
      board: parseCards("2C 7D 9S"),
      opponents: 1,
      iterations: 80,
      seed: 9,
    };
    expect(estimateEquity(request)).toEqual(estimateEquity(request));
  });

  it("splits multiway ties by the actual number of tied players", () => {
    const result = estimateEquity({
      holeCards: parseCards("2C 3D") as [
        ReturnType<typeof parseCards>[number],
        ReturnType<typeof parseCards>[number],
      ],
      board: parseCards("TS JS QS KS AS"),
      opponents: 3,
      iterations: 20,
      seed: 19,
    });
    expect(result.ties).toBe(20);
    expect(result.equity).toBeCloseTo(0.25, 8);
  });

  it("rejects invalid simulation counts instead of returning NaN equity", () => {
    const base = {
      holeCards: parseCards("AS AH") as [
        ReturnType<typeof parseCards>[number],
        ReturnType<typeof parseCards>[number],
      ],
      board: parseCards("2C 7D 9S"),
      opponents: 1,
      seed: 3,
    };
    expect(() => estimateEquity({ ...base, opponents: Number.NaN })).toThrow(
      "Opponent count",
    );
    expect(() => estimateEquity({ ...base, iterations: Number.NaN })).toThrow(
      "Iterations",
    );
    expect(() => estimateEquity({ ...base, iterations: 100_001 })).toThrow(
      "Iterations",
    );
  });
});

describe("bounded adaptation", () => {
  it("does not adapt before the minimum sample", () => {
    const base = getPersonality("tag");
    expect(
      adaptPersonality(base, {
        sampleSize: 10,
        foldRate: 1,
        callRate: 0,
        vpip: 0,
        continuationBetRate: 0,
        checkRate: 1,
      }),
    ).toEqual(base);
  });

  it("smooths observed rates with a prior", () => {
    expect(smoothRate(1, 1, 0.3, 30)).toBeCloseTo(10 / 31);
  });

  it("keeps mature adaptation within a conservative cap", () => {
    const base = getPersonality("lag");
    const adapted = adaptPersonality(base, {
      sampleSize: 300,
      foldRate: 1,
      callRate: 0,
      vpip: 1,
      continuationBetRate: 1,
      checkRate: 1,
    });
    expect(
      Math.abs(adapted.bluffFrequency - base.bluffFrequency),
    ).toBeLessThanOrEqual(0.12 * base.adaptability + 1e-8);
  });
});

it("splits a shared royal flush across all nine players", () => {
  const result = estimateEquity({
    holeCards: parseCards("2C 3D") as AIObservation["heroHoleCards"],
    board: parseCards("AS KS QS JS TS"),
    opponents: 8,
    iterations: 20,
    seed: 9,
  });
  expect(result.equity).toBeCloseTo(1 / 9);
  expect(result.ties).toBe(20);
  expect(() =>
    estimateEquity({
      holeCards: parseCards("2C 3D") as AIObservation["heroHoleCards"],
      board: [],
      opponents: 9,
    }),
  ).toThrow("Opponent count must be 1 to 8");
});
