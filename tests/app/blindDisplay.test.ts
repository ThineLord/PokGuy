import { describe, expect, it } from "vitest";
import {
  bigBlindStep,
  chipsToBigBlinds,
  formatBigBlinds,
  formatRecordedHandProfit,
  reasonWithBlindUnits,
} from "@/src/features/app/blindDisplay";

const blinds = [0.02, 0.25, 1, 1.5, 2, 2.5, 3, 10, 10_000_000];

describe("big blind display", () => {
  it("converts amounts inside action reasons and keeps the unit label", () => {
    expect(reasonWithBlindUnits("Minimum legal total is 4", 2)).toBe(
      "Minimum legal total is 2 BB",
    );
    expect(reasonWithBlindUnits("Cannot check facing 1.5", 1.5)).toBe(
      "Cannot check facing 1 BB",
    );
    expect(reasonWithBlindUnits("Amount must use 0.01 chip units", 3)).toBe(
      "Amount must use 0.01 chip units",
    );
  });

  it("keeps a 0.01 chip difference visible at the largest exercised blind", () => {
    const blind = 10_000_000;
    expect(formatBigBlinds(0.01, blind)).not.toBe("0");
    expect(formatBigBlinds(0.01, blind)).not.toBe(formatBigBlinds(0.02, blind));
    expect(formatBigBlinds(blind, blind)).not.toBe(
      formatBigBlinds(blind + 0.01, blind),
    );
    expect(chipsToBigBlinds(blind, blind)).not.toBe(
      chipsToBigBlinds(blind + 0.01, blind),
    );
  });

  it("round-trips legal chip amounts and keeps native steps one chip apart", () => {
    for (const blind of blinds) {
      const samples = [0.01, blind, blind + 0.01, blind * 2, blind * 2 + 0.01];
      for (const chips of samples) {
        const shown = Number(formatBigBlinds(chips, blind));
        expect(Number((shown * blind).toFixed(2))).toBe(chips);
        expect(
          Number((chipsToBigBlinds(chips, blind) * blind).toFixed(2)),
        ).toBe(chips);
        const stepped = Number(
          (
            (chipsToBigBlinds(chips, blind) + bigBlindStep(blind)) *
            blind
          ).toFixed(2),
        );
        expect(stepped).toBe(Number((chips + 0.01).toFixed(2)));
      }
      expect(chipsToBigBlinds(6.01, blind)).not.toBe(
        chipsToBigBlinds(6.02, blind),
      );
    }
    expect(formatBigBlinds(1.5, 1)).toBe("1.5");
    expect(formatBigBlinds(3, 2)).toBe("1.5");
    expect(formatBigBlinds(98.5, 1)).toBe("98.5");
    expect(formatBigBlinds(-1.5, 1)).toBe("-1.5");
  });

  it("keeps a 0.01 chip remainder visible at a 3-chip blind, including a loss", () => {
    expect(Number((100 / 3).toFixed(2))).toBe(Number((99.99 / 3).toFixed(2)));
    expect(formatBigBlinds(100, 3)).toBe("33.333");
    expect(formatBigBlinds(99.99, 3)).toBe("33.33");
    expect(formatBigBlinds(100.01, 3)).toBe("33.337");
    expect(formatBigBlinds(0.01, 3)).toBe("0.003");
    expect(formatBigBlinds(-0.01, 3)).toBe("-0.003");
    expect(formatBigBlinds(-1, 3)).toBe("-0.333");
    expect(
      formatRecordedHandProfit({
        heroProfitBb: -1 / 3,
        game: {
          bigBlind: 3,
          players: [
            { kind: "human", stack: 299, startingStack: 300 },
            { kind: "ai", stack: 301.01, startingStack: 300.01 },
          ],
        },
      }),
    ).toBe("-0.333");
    expect(
      formatRecordedHandProfit({
        heroProfitBb: -1 / 3,
        game: { bigBlind: 3 },
      }),
    ).toBe("-0.333");
    expect(
      formatRecordedHandProfit({
        heroProfitBb: 1.5,
      }),
    ).toBe("1.5");
  });
});
