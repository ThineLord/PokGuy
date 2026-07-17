import type { Card } from "../../engine/cards/cards";
import { evaluateBestHand } from "../../engine/evaluator/evaluator";
import { estimateEquity } from "../equity/monteCarlo";
import type { HandAssessment } from "../types";

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function preflopStrength([a, b]: [Card, Card]): number {
  const high = Math.max(a.rank, b.rank);
  const low = Math.min(a.rank, b.rank);
  const pair = a.rank === b.rank;
  const suited = a.suit === b.suit;
  const gap = high - low;
  let score = (high + low) / 28;
  if (pair) score = 0.52 + high / 30;
  if (suited) score += 0.055;
  if (gap <= 1) score += 0.045;
  if (gap >= 4) score -= 0.075;
  if (high === 14) score += 0.08;
  return clamp(score);
}

function texture(cards: Card[]): { draw: number; danger: number; nut: number } {
  const suits = new Map<string, number>();
  cards.forEach((card) => suits.set(card.suit, (suits.get(card.suit) ?? 0) + 1));
  const maxSuit = Math.max(0, ...suits.values());
  const ranks = [...new Set(cards.map((card) => card.rank))].sort((a, b) => a - b);
  let connected = 0;
  for (let index = 1; index < ranks.length; index += 1) if (ranks[index] - ranks[index - 1] <= 2) connected += 1;
  const paired = ranks.length < cards.length;
  return {
    draw: clamp((maxSuit >= 4 ? 0.55 : maxSuit === 3 ? 0.26 : 0) + connected * 0.08),
    danger: clamp((maxSuit >= 3 ? 0.28 : 0.08) + connected * 0.1 + (paired ? 0.16 : 0)),
    nut: clamp((cards.some((card) => card.rank === 14) ? 0.28 : 0.1) + (maxSuit >= 4 ? 0.35 : 0.1)),
  };
}

export function assessHand(
  holeCards: [Card, Card],
  board: Card[],
  opponents: number,
  seed = 901,
  iterations = 100,
): HandAssessment {
  const boardTexture = texture([...holeCards, ...board]);
  const equityEstimate = estimateEquity({ holeCards, board, opponents, seed, iterations }).equity;
  if (board.length < 3) {
    const strength = preflopStrength(holeCards);
    return { madeHandStrength: strength, drawStrength: boardTexture.draw, equityEstimate, nutPotential: boardTexture.nut, boardDanger: 0.12, showdownValue: strength };
  }
  const evaluation = evaluateBestHand([...holeCards, ...board]);
  const madeHandStrength = clamp((evaluation.categoryRank + 0.6) / 8.6);
  return {
    madeHandStrength,
    drawStrength: boardTexture.draw,
    equityEstimate,
    nutPotential: boardTexture.nut,
    boardDanger: boardTexture.danger,
    showdownValue: clamp(equityEstimate * 0.72 + madeHandStrength * 0.28),
  };
}
