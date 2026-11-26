// @vitest-environment node
import { adaptPersonality, smoothRate } from "@/src/ai/adaptation/adapt";
import { publicBoardDanger } from "@/src/ai/assessment/assessHand";
import { decideAIAction } from "@/src/ai/decision/decide";
import { estimateEquity, simulationDeck } from "@/src/ai/equity/monteCarlo";
import { getPersonality, PERSONALITIES } from "@/src/ai/personalities/presets";
import type { AIObservation, PokerPersonality } from "@/src/ai/types";
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

  it("uses immediate call odds for the pot-odds decision", () => {
    const rock = getPersonality("rock");
    const facing = {
      ...observation(),
      legalActions: ["fold", "call"] as AIObservation["legalActions"],
      pot: 101,
      toCall: 9,
    };
    expect(
      decideAIAction({ ...facing, callOdds: 0.01 }, rock, 3).reasoningTags,
    ).toContain("good-pot-odds");
    expect(
      decideAIAction({ ...facing, callOdds: 0.99 }, rock, 3).reasoningTags,
    ).not.toContain("good-pot-odds");
    expect(
      decideAIAction(
        { ...observation(), callOdds: 3 / (10 + 3) },
        getPersonality("tag"),
        77,
      ),
    ).toEqual(decideAIAction(observation(), getPersonality("tag"), 77));
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

function withTrait(
  patch: Partial<PokerPersonality>,
  id = "tag",
): PokerPersonality {
  return { ...getPersonality(id), ...patch };
}

function traitSpot(patch: Partial<AIObservation> = {}): AIObservation {
  return {
    heroHoleCards: parseCards("7C 6D") as AIObservation["heroHoleCards"],
    board: [],
    street: "preflop",
    pot: 15,
    toCall: 10,
    minRaiseTo: 20,
    maxRaiseTo: 100,
    currentBet: 10,
    heroStreetContribution: 0,
    heroStack: 100,
    effectiveStack: 100,
    position: 0.5,
    opponents: 1,
    allInOpponents: 0,
    legalActions: ["fold", "call", "raise", "all-in"],
    wasPreflopAggressor: false,
    ...patch,
  };
}

describe("advertised trait sliders", () => {
  it("keeps the saved profile values for the three traits", () => {
    expect(getPersonality("tag")).toMatchObject({
      foldToPressure: 0.56,
      stackAwareness: 0.65,
      boardTextureAwareness: 0.65,
    });
    expect(getPersonality("rock").foldToPressure).toBe(0.76);
    expect(getPersonality("station")).toMatchObject({
      foldToPressure: 0.2,
      boardTextureAwareness: 0.36,
    });
    expect(getPersonality("grinder")).toMatchObject({
      stackAwareness: 0.94,
      boardTextureAwareness: 0.9,
    });
  });

  it("reads public board danger and ignores a preflop board", () => {
    expect(publicBoardDanger([])).toBeNull();
    expect(publicBoardDanger(parseCards("AH KH"))).toBeNull();
    const wet = publicBoardDanger(parseCards("AH KH QH"));
    const dry = publicBoardDanger(parseCards("QD 7C 2S"));
    expect(wet).not.toBeNull();
    expect(dry).not.toBeNull();
    expect(wet!).toBeGreaterThan(dry!);
  });

  it("folds a marginal hand to a real bet and ignores fold-to-pressure when nothing is owed", () => {
    const priced = traitSpot();
    const loose = decideAIAction(priced, withTrait({ foldToPressure: 0 }), 4);
    const tight = decideAIAction(priced, withTrait({ foldToPressure: 1 }), 4);
    expect(loose.action).toBe("call");
    expect(tight.action).toBe("fold");
    expect(tight.reasoningTags).toContain("folded-to-pressure");
    expect(loose.reasoningTags).not.toContain("folded-to-pressure");

    const free = traitSpot({
      toCall: 0,
      currentBet: 0,
      minRaiseTo: 2,
      legalActions: ["check", "bet", "all-in"],
    });
    expect(decideAIAction(free, withTrait({ foldToPressure: 0 }), 4)).toEqual(
      decideAIAction(free, withTrait({ foldToPressure: 1 }), 4),
    );

    const monster = traitSpot({
      heroHoleCards: parseCards("AH AD") as AIObservation["heroHoleCards"],
      pot: 12,
      toCall: 4,
      currentBet: 4,
      minRaiseTo: 12,
    });
    const monsterLoose = decideAIAction(
      monster,
      withTrait({ foldToPressure: 0 }),
      4,
    );
    const monsterTight = decideAIAction(
      monster,
      withTrait({ foldToPressure: 1 }),
      4,
    );
    expect(monsterTight).toEqual(monsterLoose);
    expect(monsterTight.action).toBe("raise");
  });

  it("changes short-stack commitment and leaves an ordinary stack unchanged", () => {
    const short = traitSpot({
      pot: 20.3,
      toCall: 10,
      currentBet: 10,
      effectiveStack: 22,
      heroStack: 22,
      maxRaiseTo: 22,
    });
    const unaware = decideAIAction(short, withTrait({ stackAwareness: 0 }), 4);
    const aware = decideAIAction(short, withTrait({ stackAwareness: 1 }), 4);
    expect(unaware.action).toBe("call");
    expect(aware.action).toBe("fold");
    expect(aware.reasoningTags).toContain("respected-stack-depth");
    expect(unaware.reasoningTags).not.toContain("respected-stack-depth");

    const kings = traitSpot({
      heroHoleCards: parseCards("KH KD") as AIObservation["heroHoleCards"],
      board: parseCards("2C 7D 9S"),
      street: "flop",
      pot: 30,
      toCall: 8,
      currentBet: 8,
      minRaiseTo: 16,
      effectiveStack: 40,
      heroStack: 40,
      maxRaiseTo: 40,
    });
    const flat = decideAIAction(kings, withTrait({ stackAwareness: 0 }), 2);
    const commit = decideAIAction(kings, withTrait({ stackAwareness: 1 }), 2);
    expect(flat.action).toBe("call");
    expect(commit.action).toBe("raise");
    expect(commit.reasoningTags).toContain("committed-short-stack");
    expect(flat.reasoningTags).not.toContain("committed-short-stack");
    expect(["fold", "call"]).toContain(
      decideAIAction(
        { ...kings, legalActions: ["fold", "call"] },
        withTrait({ stackAwareness: 1 }),
        2,
      ).action,
    );

    const ordinary = traitSpot({
      pot: 10,
      toCall: 3,
      currentBet: 3,
      minRaiseTo: 9,
    });
    expect(
      decideAIAction(ordinary, withTrait({ stackAwareness: 0 }), 4),
    ).toEqual(decideAIAction(ordinary, withTrait({ stackAwareness: 1 }), 4));

    const deep = traitSpot({
      heroHoleCards: parseCards("AS KH") as AIObservation["heroHoleCards"],
      pot: 8,
      toCall: 0,
      currentBet: 0,
      minRaiseTo: 2,
      maxRaiseTo: 200,
      effectiveStack: 200,
      heroStack: 200,
      legalActions: ["check", "bet", "all-in"],
    });
    const deepUnaware = decideAIAction(
      deep,
      withTrait({ stackAwareness: 0 }),
      1,
    );
    const deepAware = decideAIAction(deep, withTrait({ stackAwareness: 1 }), 1);
    expect(deepUnaware.action).toBe("bet");
    expect(deepAware.action).toBe("bet");
    expect(deepAware.amount).toBeLessThan(deepUnaware.amount ?? 0);
    expect(deepAware.amount).toBeGreaterThanOrEqual(
      (deepUnaware.amount ?? 0) * 0.75,
    );
    expect(deepAware.reasoningTags).toContain("sized-to-stack-depth");
    expect(deepUnaware.reasoningTags).not.toContain("sized-to-stack-depth");
  });

  it("tightens a wet public board, continues thinner on a dry one, and ignores texture preflop", () => {
    const wetCall = traitSpot({
      heroHoleCards: parseCards("TC 9D") as AIObservation["heroHoleCards"],
      board: parseCards("AH KH QH"),
      street: "flop",
      pot: 18.57,
      toCall: 10,
      currentBet: 10,
      minRaiseTo: 20,
    });
    const looseCall = decideAIAction(
      wetCall,
      withTrait({ boardTextureAwareness: 0 }),
      2,
    );
    const tightCall = decideAIAction(
      wetCall,
      withTrait({ boardTextureAwareness: 1 }),
      2,
    );
    expect(looseCall.action).toBe("call");
    expect(tightCall.action).toBe("fold");
    expect(tightCall.reasoningTags).toContain("cautious-board-texture");
    expect(tightCall.reasoningTags).not.toContain("folded-to-pressure");

    const wetBet = traitSpot({
      heroHoleCards: parseCards("8C 7D") as AIObservation["heroHoleCards"],
      board: parseCards("AH KH QH"),
      street: "flop",
      pot: 8,
      toCall: 0,
      currentBet: 0,
      minRaiseTo: 2,
      legalActions: ["check", "bet", "all-in"],
      wasPreflopAggressor: true,
    });
    expect(
      decideAIAction(wetBet, withTrait({ boardTextureAwareness: 0 }), 11)
        .action,
    ).toBe("bet");
    const checked = decideAIAction(
      wetBet,
      withTrait({ boardTextureAwareness: 1 }),
      11,
    );
    expect(checked.action).toBe("check");
    expect(checked.reasoningTags).toContain("cautious-board-texture");

    const dryBet = traitSpot({
      heroHoleCards: parseCards("8H 6D") as AIObservation["heroHoleCards"],
      board: parseCards("QD 7C 2S"),
      street: "flop",
      pot: 8,
      toCall: 0,
      currentBet: 0,
      minRaiseTo: 2,
      legalActions: ["check", "bet", "all-in"],
      wasPreflopAggressor: true,
    });
    expect(
      decideAIAction(dryBet, withTrait({ boardTextureAwareness: 0 }), 10)
        .action,
    ).toBe("check");
    const thin = decideAIAction(
      dryBet,
      withTrait({ boardTextureAwareness: 1 }),
      10,
    );
    expect(thin.action).toBe("bet");
    expect(thin.reasoningTags).toContain("dry-board-continue");

    const preflop = traitSpot({
      heroHoleCards: parseCards("8C 7D") as AIObservation["heroHoleCards"],
      pot: 8,
      toCall: 0,
      currentBet: 0,
      minRaiseTo: 2,
      legalActions: ["check", "bet", "all-in"],
      wasPreflopAggressor: true,
    });
    expect(
      decideAIAction(preflop, withTrait({ boardTextureAwareness: 0 }), 11),
    ).toEqual(
      decideAIAction(preflop, withTrait({ boardTextureAwareness: 1 }), 11),
    );
  });

  it("keeps hidden opponent cards out of the three trait decisions", () => {
    const hidden = parseCards("3S 4S");
    const spots = [
      traitSpot(),
      traitSpot({
        heroHoleCards: parseCards("TC 9D") as AIObservation["heroHoleCards"],
        board: parseCards("AH KH QH"),
        street: "flop",
        pot: 18.57,
        toCall: 10,
        currentBet: 10,
        minRaiseTo: 20,
      }),
      traitSpot({
        heroHoleCards: parseCards("KH KD") as AIObservation["heroHoleCards"],
        board: parseCards("2C 7D 9S"),
        street: "flop",
        pot: 30,
        toCall: 8,
        currentBet: 8,
        minRaiseTo: 16,
        effectiveStack: 40,
        heroStack: 40,
        maxRaiseTo: 40,
      }),
    ];
    const patches = [
      { foldToPressure: 0 },
      { foldToPressure: 1 },
      { stackAwareness: 0 },
      { stackAwareness: 1 },
      { boardTextureAwareness: 0 },
      { boardTextureAwareness: 1 },
    ];
    for (const spot of spots) {
      for (const patch of patches) {
        const personality = withTrait(patch);
        expect(
          decideAIAction(
            { ...spot, opponentHoleCards: hidden } as AIObservation,
            personality,
            4,
          ),
        ).toEqual(decideAIAction(spot, personality, 4));
      }
    }
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
