export const SUITS = ["clubs", "diamonds", "hearts", "spades"] as const;
export const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const;

export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];

export interface Card {
  rank: Rank;
  suit: Suit;
}

const rankTokens: Record<string, Rank> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

const suitTokens: Record<string, Suit> = {
  c: "clubs",
  d: "diamonds",
  h: "hearts",
  s: "spades",
};

export function cardId(card: Card): string {
  return `${card.rank}-${card.suit}`;
}

export function sameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

export function parseCard(token: string): Card {
  const normalized = token.trim().toUpperCase();
  const rank = rankTokens[normalized.slice(0, -1)];
  const suit = suitTokens[normalized.slice(-1).toLowerCase()];
  if (!rank || !suit) throw new Error(`Invalid card token: ${token}`);
  return { rank, suit };
}

export function parseCards(tokens: string): Card[] {
  return tokens
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(parseCard);
}

export function assertUniqueCards(cards: Card[]): void {
  const ids = new Set(cards.map(cardId));
  if (ids.size !== cards.length) throw new Error("Duplicate cards are not allowed");
}

export function rankLabel(rank: Rank): string {
  const faces: Partial<Record<Rank, string>> = { 10: "T", 11: "J", 12: "Q", 13: "K", 14: "A" };
  return rank <= 9 ? String(rank) : faces[rank]!;
}
