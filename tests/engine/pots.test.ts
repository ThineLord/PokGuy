import {
  calculatePotStructure,
  calculateSidePots,
  splitPot,
} from "@/src/engine/pots/sidePots";
import { parseCards } from "@/src/engine/cards/cards";
import { resolveShowdown } from "@/src/engine/showdown/showdown";

describe("pot manager", () => {
  it("builds one side pot for unequal all-ins", () => {
    const pots = calculateSidePots([
      { playerId: "a", seat: 0, amount: 50, folded: false },
      { playerId: "b", seat: 1, amount: 100, folded: false },
      { playerId: "c", seat: 2, amount: 100, folded: false },
    ]);
    expect(pots.map((pot) => [pot.amount, pot.eligiblePlayerIds])).toEqual([
      [150, ["a", "b", "c"]],
      [100, ["b", "c"]],
    ]);
  });

  it("builds multiple side pots for different all-in stacks", () => {
    const pots = calculateSidePots([
      { playerId: "a", seat: 0, amount: 25, folded: false },
      { playerId: "b", seat: 1, amount: 50, folded: false },
      { playerId: "c", seat: 2, amount: 100, folded: false },
      { playerId: "d", seat: 3, amount: 100, folded: true },
    ]);
    expect(pots.map((pot) => pot.amount)).toEqual([100, 75, 100]);
    expect(pots[2].eligiblePlayerIds).toEqual(["c"]);
  });

  it("builds three side pots and conserves every contribution", () => {
    const contributions = [1, 2, 3, 4, 4].map((amount, seat) => ({
      playerId: `p${seat}`,
      seat,
      amount,
      folded: false,
    }));
    const structure = calculatePotStructure(contributions);
    expect(structure.pots.map((pot) => pot.amount)).toEqual([5, 4, 3, 2]);
    expect(structure.pots.reduce((sum, pot) => sum + pot.amount, 0)).toBe(14);
    expect(structure.uncalledReturns).toEqual({});
  });

  it("excludes folded players from eligibility but keeps their chips", () => {
    const [pot] = calculateSidePots([
      { playerId: "a", seat: 0, amount: 30, folded: true },
      { playerId: "b", seat: 1, amount: 30, folded: false },
    ]);
    expect(pot.amount).toBe(60);
    expect(pot.contributors).toEqual(["a", "b"]);
    expect(pot.eligiblePlayerIds).toEqual(["b"]);
  });

  it("splits a two-way pot and awards odd chip left of button", () => {
    expect(splitPot(5, ["a", "b"], { a: 1, b: 3 }, 0)).toEqual({ a: 3, b: 2 });
  });

  it("splits a three-way pot", () => {
    expect(splitPot(10, ["a", "b", "c"], { a: 1, b: 2, c: 3 }, 0)).toEqual({
      a: 4,
      b: 3,
      c: 3,
    });
  });

  it("preserves fractional chip denominations when splitting", () => {
    expect(splitPot(1.5, ["a", "b"], { a: 1, b: 2 }, 0, 0.5)).toEqual({
      a: 1,
      b: 0.5,
    });
  });

  it("returns an unmatched excess instead of creating a one-player side pot", () => {
    expect(
      calculatePotStructure([
        { playerId: "short", seat: 0, amount: 50, folded: false },
        { playerId: "deep", seat: 1, amount: 100, folded: false },
      ]),
    ).toEqual({
      pots: [
        {
          id: "main",
          amount: 100,
          cap: 50,
          contributors: ["short", "deep"],
          eligiblePlayerIds: ["short", "deep"],
        },
      ],
      uncalledReturns: { deep: 50 },
    });
  });

  it("does not create a zero-value side pot from floating point residue", () => {
    expect(
      calculatePotStructure([
        { playerId: "a", seat: 0, amount: 100, folded: false },
        {
          playerId: "b",
          seat: 1,
          amount: 100.00000000000001,
          folded: false,
        },
        { playerId: "c", seat: 2, amount: 100, folded: false },
      ]),
    ).toEqual({
      pots: [
        {
          id: "main",
          amount: 300,
          cap: 100,
          contributors: ["a", "b", "c"],
          eligiblePlayerIds: ["a", "b", "c"],
        },
      ],
      uncalledReturns: {},
    });
  });

  it("uses the table chip unit for an odd-chip showdown split", () => {
    expect(splitPot(0.03, ["a", "b"], { a: 1, b: 2 }, 0, 0.01)).toEqual({
      a: 0.02,
      b: 0.01,
    });
  });

  it("rejects duplicate contributors and sub-cent contributions", () => {
    expect(() =>
      calculatePotStructure([
        { playerId: "a", seat: 0, amount: 1, folded: false },
        { playerId: "a", seat: 1, amount: 1, folded: false },
      ]),
    ).toThrow("unique player IDs");
    expect(() =>
      calculatePotStructure([
        { playerId: "a", seat: 0, amount: 1.005, folded: false },
      ]),
    ).toThrow("chip units");
  });

  it("orders odd chips by seat even when seat numbers exceed 1000", () => {
    expect(splitPot(0.03, ["a", "b"], { a: 1100, b: 5 }, 0, 0.01)).toEqual({
      b: 0.02,
      a: 0.01,
    });
  });
});

describe("showdown", () => {
  it("splits an odd-chip main pot while awarding a side pot to one winner", () => {
    const result = resolveShowdown(
      [
        {
          playerId: "short",
          seat: 0,
          amount: 0.01,
          folded: false,
          holeCards: parseCards("AH KD"),
        },
        {
          playerId: "deep",
          seat: 1,
          amount: 0.02,
          folded: false,
          holeCards: parseCards("AS KC"),
        },
        {
          playerId: "other",
          seat: 2,
          amount: 0.02,
          folded: false,
          holeCards: parseCards("QH QD"),
        },
      ],
      parseCards("2C 3D 4S 5H 9C"),
      2,
    );
    expect(result.awards.map((award) => award.winnerIds)).toEqual([
      ["short", "deep"],
      ["deep"],
    ]);
    expect(result.payouts).toEqual({ short: 0.02, deep: 0.03, other: 0 });
  });

  it("resolves main and side pots independently", () => {
    const result = resolveShowdown(
      [
        {
          playerId: "short",
          seat: 0,
          amount: 50,
          folded: false,
          holeCards: parseCards("AH AD"),
        },
        {
          playerId: "deep",
          seat: 1,
          amount: 100,
          folded: false,
          holeCards: parseCards("KH KD"),
        },
        {
          playerId: "other",
          seat: 2,
          amount: 100,
          folded: false,
          holeCards: parseCards("QH QD"),
        },
      ],
      parseCards("2C 3D 7S 8C 9H"),
      2,
    );
    expect(result.payouts).toEqual({ short: 150, deep: 100, other: 0 });
  });

  it("handles a board-play tie among multiple players", () => {
    const result = resolveShowdown(
      [
        {
          playerId: "a",
          seat: 1,
          amount: 30,
          folded: false,
          holeCards: parseCards("2C 3D"),
        },
        {
          playerId: "b",
          seat: 2,
          amount: 30,
          folded: false,
          holeCards: parseCards("4C 5D"),
        },
        {
          playerId: "c",
          seat: 3,
          amount: 30,
          folded: false,
          holeCards: parseCards("6C 7D"),
        },
      ],
      parseCards("AS KS QS JS TS"),
      0,
    );
    expect(result.payouts).toEqual({ a: 30, b: 30, c: 30 });
  });

  it("awards contested pots by hand strength and reports unmatched chips separately", () => {
    const result = resolveShowdown(
      [
        {
          playerId: "short",
          seat: 0,
          amount: 50,
          folded: false,
          holeCards: parseCards("AH AD"),
        },
        {
          playerId: "deep",
          seat: 1,
          amount: 100,
          folded: false,
          holeCards: parseCards("KH KD"),
        },
      ],
      parseCards("2C 3D 7S 8C 9H"),
      1,
    );

    expect(result.awards).toHaveLength(1);
    expect(result.awards[0].winnerIds).toEqual(["short"]);
    expect(result.uncalledReturns).toEqual({ deep: 50 });
    expect(result.payouts).toEqual({ short: 100, deep: 50 });
  });

  it("never awards a pot to a folded player even when their cards are strongest", () => {
    const result = resolveShowdown(
      [
        {
          playerId: "folded",
          seat: 0,
          amount: 30,
          folded: true,
          holeCards: parseCards("AH AD"),
        },
        {
          playerId: "live",
          seat: 1,
          amount: 30,
          folded: false,
          holeCards: parseCards("KH QD"),
        },
      ],
      parseCards("AC 7D 6S 4C 2H"),
      0,
    );

    expect(result.payouts).toEqual({ folded: 0, live: 60 });
    expect(result.evaluations.folded).toBeUndefined();
  });
});
