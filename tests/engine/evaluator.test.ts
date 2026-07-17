import { parseCards } from "@/src/engine/cards/cards";
import {
  compareEvaluations,
  evaluateBestHand,
  evaluateFive,
} from "@/src/engine/evaluator/evaluator";

describe("hand evaluator", () => {
  test.each([
    ["AS KS QS JS TS", "straight-flush"],
    ["AH AD AC AS 2D", "four-of-a-kind"],
    ["KH KD KC 2S 2D", "full-house"],
    ["AH JH 8H 4H 2H", "flush"],
    ["9H 8D 7S 6C 5H", "straight"],
    ["QH QD QS 6C 2H", "three-of-a-kind"],
    ["JH JD 4S 4C 2H", "two-pair"],
    ["TH TD 8S 4C 2H", "pair"],
    ["AH JD 8S 4C 2H", "high-card"],
  ])("recognizes %s as %s", (cards, category) => {
    expect(evaluateFive(parseCards(cards)).category).toBe(category);
  });

  it("recognizes A2345 as a five-high straight", () => {
    const hand = evaluateFive(parseCards("AS 2D 3H 4C 5S"));
    expect(hand.category).toBe("straight");
    expect(hand.tiebreakers).toEqual([5]);
  });

  it("uses kickers to compare equal categories", () => {
    const aceKicker = evaluateFive(parseCards("QS QD AH 8C 2S"));
    const kingKicker = evaluateFive(parseCards("QH QC KH 8D 2C"));
    expect(compareEvaluations(aceKicker, kingKicker)).toBe(1);
  });

  it("uses the board when it is the best five-card hand", () => {
    const boardPlaysA = evaluateBestHand(parseCards("2C 3D AS KS QS JS TS"));
    const boardPlaysB = evaluateBestHand(parseCards("9C 9D AS KS QS JS TS"));
    expect(boardPlaysA.category).toBe("straight-flush");
    expect(compareEvaluations(boardPlaysA, boardPlaysB)).toBe(0);
  });

  it("selects the best five from seven", () => {
    const result = evaluateBestHand(parseCards("AH AD AC KH KD 2S 3S"));
    expect(result.category).toBe("full-house");
    expect(result.tiebreakers).toEqual([14, 13]);
  });
});
