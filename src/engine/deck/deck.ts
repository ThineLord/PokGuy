import { RANKS, SUITS, type Card } from "../cards/cards";
import { systemRandom, type RandomSource } from "./random";

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit })));
}

export function shuffleDeck(
  cards: readonly Card[],
  random: RandomSource = systemRandom,
): Card[] {
  const shuffled = cards.map((card) => ({ ...card }));
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random.next() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

export function drawCards(deck: readonly Card[], count: number): [Card[], Card[]] {
  if (!Number.isInteger(count) || count < 0 || count > deck.length) {
    throw new Error("Cannot draw the requested number of cards");
  }
  return [deck.slice(0, count), deck.slice(count)];
}
