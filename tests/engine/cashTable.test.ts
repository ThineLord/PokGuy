import { cashTableContinuation } from "@/src/engine/state/cashTable";

describe("cash-table continuation", () => {
  it("does not silently rebuy players who lost their stack", () => {
    const result = cashTableContinuation(
      [
        { id: "hero", stack: 12 },
        { id: "ai-1", stack: 0 },
        { id: "ai-2", stack: 288 },
      ],
      "hero",
    );

    expect(result).toEqual({
      canDealNextHand: true,
      heroNeedsRebuy: false,
      fundedPlayerIds: ["hero", "ai-2"],
      bustedPlayerIds: ["ai-1"],
      reason: "ready",
    });
  });

  it("requires a manual rebuy when the user has zero chips", () => {
    expect(
      cashTableContinuation(
        [
          { id: "hero", stack: 0 },
          { id: "ai-1", stack: 150 },
          { id: "ai-2", stack: 150 },
        ],
        "hero",
      ),
    ).toMatchObject({
      canDealNextHand: false,
      heroNeedsRebuy: true,
      reason: "hero-busted",
    });
  });

  it("ends the table when fewer than two funded players remain", () => {
    expect(
      cashTableContinuation(
        [
          { id: "hero", stack: 300 },
          { id: "ai-1", stack: 0 },
        ],
        "hero",
      ),
    ).toMatchObject({
      canDealNextHand: false,
      heroNeedsRebuy: false,
      reason: "one-funded-player",
    });
  });

  it("allows a positive short stack to continue below the big blind", () => {
    expect(
      cashTableContinuation(
        [
          { id: "hero", stack: 0.25 },
          { id: "ai-1", stack: 199.75 },
        ],
        "hero",
      ),
    ).toMatchObject({
      canDealNextHand: true,
      reason: "ready",
    });
  });
});
