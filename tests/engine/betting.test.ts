import {
  legalActionsFor,
  validateAction,
} from "@/src/engine/betting/actionValidator";
import { applyBettingAction } from "@/src/engine/betting/bettingEngine";
import type { BettingRoundState } from "@/src/engine/betting/types";

function state(overrides: Partial<BettingRoundState> = {}): BettingRoundState {
  return {
    street: "preflop",
    actingPlayerId: "a",
    currentBet: 10,
    minRaiseIncrement: 10,
    bigBlind: 10,
    actionSequence: 0,
    lastAggressorId: "b",
    players: [
      {
        id: "a",
        seat: 0,
        stack: 100,
        streetContribution: 0,
        totalContribution: 0,
        status: "active",
        acted: false,
        lastActedBet: 0,
      },
      {
        id: "b",
        seat: 1,
        stack: 90,
        streetContribution: 10,
        totalContribution: 10,
        status: "active",
        acted: true,
        lastActedBet: 10,
      },
      {
        id: "c",
        seat: 2,
        stack: 90,
        streetContribution: 10,
        totalContribution: 10,
        status: "active",
        acted: true,
        lastActedBet: 10,
      },
    ],
    ...overrides,
  };
}

describe("action validator", () => {
  it("rejects check when facing a bet", () => {
    expect(validateAction(state(), "a", { type: "check" })).toMatchObject({
      legal: false,
    });
  });

  it("rejects call when nothing is owed", () => {
    expect(
      validateAction(state({ currentBet: 0 }), "a", { type: "call" }),
    ).toMatchObject({ legal: false });
  });

  it("rejects a raise below the minimum and suggests the nearest total", () => {
    expect(
      validateAction(state(), "a", { type: "raise", amount: 15 }),
    ).toMatchObject({
      legal: false,
      nearestLegalAmount: 20,
    });
  });

  it("offers a legal minimum bet or raise to automated players", () => {
    expect(legalActionsFor(state({ currentBet: 0 }), "a").bet).toMatchObject({
      legal: true,
      minRaiseTo: 10,
    });
    expect(legalActionsFor(state(), "a").raise).toMatchObject({
      legal: true,
      minRaiseTo: 20,
    });
  });

  it("allows a short stack all-in below the normal minimum", () => {
    const short = state();
    short.players[0].stack = 15;
    expect(
      validateAction(short, "a", { type: "raise", amount: 15 }),
    ).toMatchObject({
      legal: true,
      reopensBetting: false,
    });
  });

  it("does not reopen raising after one incomplete all-in", () => {
    let round = state({ actingPlayerId: "a" });
    round.players[0].stack = 15;
    round = applyBettingAction(round, "a", { type: "all-in" });
    round.actingPlayerId = "b";
    expect(
      validateAction(round, "b", { type: "raise", amount: 30 }),
    ).toMatchObject({
      legal: false,
      reason: "Betting has not been reopened",
    });
    expect(validateAction(round, "b", { type: "call" }).legal).toBe(true);
  });

  it("reopens after cumulative incomplete raises reach a full increment", () => {
    const round = state({ currentBet: 20, actingPlayerId: "b" });
    round.players[1].acted = true;
    round.players[1].lastActedBet = 10;
    expect(
      validateAction(round, "b", { type: "raise", amount: 30 }).legal,
    ).toBe(true);
  });

  it("keeps the original minimum increment after a short all-in raise", () => {
    let round = state();
    round.players[0].stack = 15;
    round = applyBettingAction(round, "a", { type: "all-in" });
    expect(round.currentBet).toBe(15);
    expect(round.minRaiseIncrement).toBe(10);
  });
});
