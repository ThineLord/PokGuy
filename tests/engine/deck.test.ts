import { cardId } from "@/src/engine/cards/cards";
import { createDeck, shuffleDeck } from "@/src/engine/deck/deck";
import { SeededRandom } from "@/src/engine/deck/random";

describe("deck", () => {
  it("contains exactly 52 unique cards", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map(cardId)).size).toBe(52);
  });

  it("Fisher-Yates shuffle retains every card without duplicates", () => {
    const original = createDeck();
    const shuffled = shuffleDeck(original, new SeededRandom(42));
    expect(new Set(shuffled.map(cardId)).size).toBe(52);
    expect([...shuffled].map(cardId).sort()).toEqual(original.map(cardId).sort());
    expect(shuffled).not.toEqual(original);
  });

  it("is reproducible with the same seed", () => {
    const first = shuffleDeck(createDeck(), new SeededRandom(2026));
    const second = shuffleDeck(createDeck(), new SeededRandom(2026));
    expect(second).toEqual(first);
  });
});
