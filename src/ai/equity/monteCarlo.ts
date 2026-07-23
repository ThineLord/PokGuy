import { assertUniqueCards, cardId, type Card } from "../../engine/cards/cards";
import { createDeck, shuffleDeck } from "../../engine/deck/deck";
import { SeededRandom, type RandomSource } from "../../engine/deck/random";
import {
  compareEvaluations,
  evaluateBestHand,
} from "../../engine/evaluator/evaluator";

export interface EquityRequest {
  holeCards: [Card, Card];
  board: Card[];
  opponents: number;
  deadCards?: Card[];
  iterations?: number;
  seed?: number;
}

export interface EquityResult {
  equity: number;
  wins: number;
  ties: number;
  losses: number;
  iterations: number;
}

export function simulationDeck(request: EquityRequest): Card[] {
  const known = [
    ...request.holeCards,
    ...request.board,
    ...(request.deadCards ?? []),
  ];
  assertUniqueCards(known);
  const knownIds = new Set(known.map(cardId));
  return createDeck().filter((card) => !knownIds.has(cardId(card)));
}

export function estimateEquity(request: EquityRequest): EquityResult {
  if (request.opponents < 1 || request.opponents > 5)
    throw new Error("Opponent count must be 1 to 5");
  if (request.board.length > 5)
    throw new Error("Board cannot exceed five cards");
  const iterations = Math.max(1, Math.floor(request.iterations ?? 160));
  const random: RandomSource = new SeededRandom(request.seed ?? 17_071);
  const baseDeck = simulationDeck(request);
  const cardsNeeded = request.opponents * 2 + (5 - request.board.length);
  if (cardsNeeded > baseDeck.length)
    throw new Error("Not enough unknown cards for simulation");
  let wins = 0;
  let ties = 0;
  let losses = 0;
  let equityShares = 0;

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const deck = shuffleDeck(baseDeck, random);
    let cursor = 0;
    const opponentHands = Array.from({ length: request.opponents }, () => [
      deck[cursor++],
      deck[cursor++],
    ]);
    const board = [
      ...request.board,
      ...deck.slice(cursor, cursor + (5 - request.board.length)),
    ];
    const hero = evaluateBestHand([...request.holeCards, ...board]);
    const opponents = opponentHands.map((holeCards) =>
      evaluateBestHand([...holeCards, ...board]),
    );
    const comparisons = opponents.map((hand) => compareEvaluations(hero, hand));
    if (comparisons.every((value) => value > 0)) {
      wins += 1;
      equityShares += 1;
    } else if (comparisons.every((value) => value >= 0)) {
      ties += 1;
      const tiedOpponents = comparisons.filter((value) => value === 0).length;
      equityShares += 1 / (tiedOpponents + 1);
    } else {
      losses += 1;
    }
  }
  return {
    equity: equityShares / iterations,
    wins,
    ties,
    losses,
    iterations,
  };
}

export async function estimateEquityAsync(
  request: EquityRequest,
): Promise<EquityResult> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  return estimateEquity(request);
}
