import { cardId, rankLabel } from "@/src/engine/cards/cards";
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
    expect([...shuffled].map(cardId).sort()).toEqual(
      original.map(cardId).sort(),
    );
    expect(shuffled).not.toEqual(original);
  });

  it("is reproducible with the same seed", () => {
    const first = shuffleDeck(createDeck(), new SeededRandom(2026));
    const second = shuffleDeck(createDeck(), new SeededRandom(2026));
    expect(second).toEqual(first);
  });

  it("uses familiar face labels without leaking internal rank numbers", () => {
    expect(
      [2, 9, 10, 11, 12, 13, 14].map((rank) =>
        rankLabel(rank as Parameters<typeof rankLabel>[0]),
      ),
    ).toEqual(["2", "9", "10", "J", "Q", "K", "A"]);
  });
});

describe("secure shuffle sampling", () => {
  it("rejects the incomplete uint32 bucket instead of biasing three-way sampling", () => {
    const samples = [0xffffffff, 0, 0];
    const spy = vi
      .spyOn(globalThis.crypto, "getRandomValues")
      .mockImplementation((array) => {
        (array as Uint32Array)[0] = samples.shift()!;
        return array;
      });
    try {
      const cards = createDeck().slice(0, 3);
      expect(shuffleDeck(cards)).toEqual([cards[1], cards[2], cards[0]]);
      expect(spy).toHaveBeenCalledTimes(3);
    } finally {
      spy.mockRestore();
    }
  });

  it("never falls back to Math.random when secure entropy is unavailable", () => {
    const spy = vi
      .spyOn(globalThis.crypto, "getRandomValues")
      .mockImplementation(() => {
        throw new Error("No entropy");
      });
    try {
      expect(() => shuffleDeck(createDeck())).toThrow("No entropy");
    } finally {
      spy.mockRestore();
    }
  });
});
