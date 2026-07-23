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

  it("uses the higher trip when seven cards contain two sets", () => {
    const result = evaluateBestHand(parseCards("AH AD AC KH KD KC 2S"));
    expect(result.category).toBe("full-house");
    expect(result.tiebreakers).toEqual([14, 13]);
  });

  it("uses only the highest two pairs and the best remaining kicker", () => {
    const result = evaluateBestHand(parseCards("AH AD KH KD QH QD JS"));
    expect(result.category).toBe("two-pair");
    expect(result.tiebreakers).toEqual([14, 13, 12]);
  });

  it("does not let a lower hole-card kicker replace the five-card board", () => {
    const boardPlays = evaluateBestHand(parseCards("2C 3D AH KD QS JC 9S"));
    const lowerHoleCards = evaluateBestHand(parseCards("8C 7D AH KD QS JC 9S"));
    expect(boardPlays.tiebreakers).toEqual([14, 13, 12, 11, 9]);
    expect(compareEvaluations(boardPlays, lowerHoleCards)).toBe(0);
  });

  it("ranks a six-high straight above the ace-to-five wheel", () => {
    const wheel = evaluateBestHand(parseCards("AS 2D 3H 4C 5S KD QH"));
    const sixHigh = evaluateBestHand(parseCards("2S 3D 4H 5C 6S KD QH"));
    expect(compareEvaluations(sixHigh, wheel)).toBe(1);
  });

  it("compares flushes by all five cards in descending order", () => {
    const aceQueen = evaluateBestHand(parseCards("AH QH 9H 5H 2H 3C 4D"));
    const aceJack = evaluateBestHand(parseCards("AS JS 9S 5S 2S 3C 4D"));
    expect(compareEvaluations(aceQueen, aceJack)).toBe(1);
  });
});
