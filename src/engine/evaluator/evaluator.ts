import { assertUniqueCards, type Card, type Rank } from "../cards/cards";

export const HAND_CATEGORIES = [
  "high-card",
  "pair",
  "two-pair",
  "three-of-a-kind",
  "straight",
  "flush",
  "full-house",
  "four-of-a-kind",
  "straight-flush",
] as const;

export type HandCategory = (typeof HAND_CATEGORIES)[number];

export interface HandEvaluation {
  category: HandCategory;
  categoryRank: number;
  tiebreakers: number[];
  cards: Card[];
  label: string;
}

function descending(a: number, b: number): number {
  return b - a;
}

function straightHigh(ranks: number[]): number | null {
  const unique = [...new Set(ranks)].sort(descending);
  if (unique.includes(14)) unique.push(1);
  for (let index = 0; index <= unique.length - 5; index += 1) {
    if (unique.slice(index, index + 5).every((rank, offset) => rank === unique[index] - offset)) {
      return unique[index];
    }
  }
  return null;
}

function evaluation(
  categoryRank: number,
  tiebreakers: number[],
  cards: Card[],
): HandEvaluation {
  const category = HAND_CATEGORIES[categoryRank];
  return { category, categoryRank, tiebreakers, cards, label: category };
}

export function evaluateFive(cards: Card[]): HandEvaluation {
  if (cards.length !== 5) throw new Error("Exactly five cards are required");
  assertUniqueCards(cards);

  const ranks = cards.map((card) => card.rank);
  const flush = cards.every((card) => card.suit === cards[0].suit);
  const highStraight = straightHigh(ranks);
  const counts = new Map<number, number>();
  ranks.forEach((rank) => counts.set(rank, (counts.get(rank) ?? 0) + 1));
  const groups = [...counts.entries()].sort(
    ([rankA, countA], [rankB, countB]) => countB - countA || rankB - rankA,
  );

  if (flush && highStraight) return evaluation(8, [highStraight], cards);
  if (groups[0][1] === 4) {
    return evaluation(7, [groups[0][0], groups[1][0]], cards);
  }
  if (groups[0][1] === 3 && groups[1]?.[1] === 2) {
    return evaluation(6, [groups[0][0], groups[1][0]], cards);
  }
  if (flush) return evaluation(5, [...ranks].sort(descending), cards);
  if (highStraight) return evaluation(4, [highStraight], cards);
  if (groups[0][1] === 3) {
    return evaluation(3, [groups[0][0], ...groups.slice(1).map(([rank]) => rank).sort(descending)], cards);
  }
  if (groups[0][1] === 2 && groups[1]?.[1] === 2) {
    const pairs = [groups[0][0], groups[1][0]].sort(descending);
    return evaluation(2, [...pairs, groups[2][0]], cards);
  }
  if (groups[0][1] === 2) {
    return evaluation(1, [groups[0][0], ...groups.slice(1).map(([rank]) => rank).sort(descending)], cards);
  }
  return evaluation(0, [...ranks].sort(descending), cards);
}

export function compareEvaluations(a: HandEvaluation, b: HandEvaluation): number {
  if (a.categoryRank !== b.categoryRank) return Math.sign(a.categoryRank - b.categoryRank);
  const length = Math.max(a.tiebreakers.length, b.tiebreakers.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (a.tiebreakers[index] ?? 0) - (b.tiebreakers[index] ?? 0);
    if (difference !== 0) return Math.sign(difference);
  }
  return 0;
}

function combinations(cards: Card[], size: number): Card[][] {
  const result: Card[][] = [];
  const build = (start: number, selected: Card[]) => {
    if (selected.length === size) {
      result.push(selected);
      return;
    }
    for (let index = start; index <= cards.length - (size - selected.length); index += 1) {
      build(index + 1, [...selected, cards[index]]);
    }
  };
  build(0, []);
  return result;
}

export function evaluateBestHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5 || cards.length > 7) throw new Error("Five to seven cards are required");
  assertUniqueCards(cards);
  return combinations(cards, 5)
    .map(evaluateFive)
    .reduce((best, current) => (compareEvaluations(current, best) > 0 ? current : best));
}

export function compareHands(a: Card[], b: Card[]): number {
  return compareEvaluations(evaluateBestHand(a), evaluateBestHand(b));
}

export function rankVector(evaluationResult: HandEvaluation): [number, ...number[]] {
  return [evaluationResult.categoryRank, ...evaluationResult.tiebreakers];
}

export function isNutStraightPotential(cards: Card[]): boolean {
  const ranks = cards.map((card) => card.rank as Rank);
  return straightHigh(ranks) !== null;
}
