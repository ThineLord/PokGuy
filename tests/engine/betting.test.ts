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

  it("rejects sub-cent raise targets instead of silently changing the wager", () => {
    expect(
      validateAction(state(), "a", { type: "raise", amount: 20.005 }),
    ).toMatchObject({
      legal: false,
      reason: "Amount must use 0.01 chip units",
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

  it("normalizes floating-point dust to zero after an all-in sized bet", () => {
    const round = state({
      currentBet: 0,
      minRaiseIncrement: 0.1,
      bigBlind: 0.1,
      players: [
        {
          id: "a",
          seat: 0,
          stack: 0.1 + 0.2,
          streetContribution: 0,
          totalContribution: 0,
          status: "active",
          acted: false,
          lastActedBet: 0,
        },
        {
          id: "b",
          seat: 1,
          stack: 1,
          streetContribution: 0,
          totalContribution: 0,
          status: "active",
          acted: false,
          lastActedBet: 0,
        },
      ],
    });
    const next = applyBettingAction(round, "a", {
      type: "bet",
      amount: 0.3,
    });
    expect(next.players[0].stack).toBe(0);
    expect(next.players[0].status).toBe("all-in");
    expect(next.actingPlayerId).toBe("b");
  });
});

describe("consecutive short all-ins", () => {
  it("reopens individually at a full cumulative increment and preserves the next minimum", () => {
    let round = state({
      street: "flop",
      currentBet: 0,
      minRaiseIncrement: 10,
      bigBlind: 10,
      lastAggressorId: null,
    });
    round.players = [100, 14, 20, 100].map((stack, seat) => ({
      id: String.fromCharCode(97 + seat),
      seat,
      stack,
      streetContribution: 0,
      totalContribution: 0,
      status: "active",
      acted: false,
      lastActedBet: 0,
    }));
    round = applyBettingAction(round, "a", { type: "bet", amount: 10 });
    round = applyBettingAction(round, "b", { type: "all-in" });
    round = applyBettingAction(round, "c", { type: "all-in" });
    round = applyBettingAction(round, "d", { type: "call" });
    expect(round.actingPlayerId).toBe("a");
    expect(
      validateAction(round, "a", { type: "raise", amount: 29 }).legal,
    ).toBe(false);
    expect(
      validateAction(round, "a", { type: "raise", amount: 30 }).legal,
    ).toBe(true);
    round = applyBettingAction(round, "a", { type: "raise", amount: 30 });
    expect(round.minRaiseIncrement).toBe(10);
    expect(round.actingPlayerId).toBe("d");
    expect(
      validateAction(round, "d", { type: "raise", amount: 40 }).legal,
    ).toBe(true);
  });

  it("keeps a checked player's raising closed facing only a short opening all-in", () => {
    let round = state({ street: "flop", currentBet: 0 });
    round.players = round.players.map((player) => ({
      ...player,
      stack: player.id === "b" ? 6 : 100,
      streetContribution: 0,
      totalContribution: 0,
      acted: false,
      lastActedBet: 0,
    }));
    round = applyBettingAction(round, "a", { type: "check" });
    round = applyBettingAction(round, "b", { type: "all-in" });
    expect(
      validateAction(round, "c", { type: "raise", amount: 16 }).legal,
    ).toBe(true);
    round = applyBettingAction(round, "c", { type: "call" });
    expect(
      validateAction(round, "a", { type: "raise", amount: 16 }).legal,
    ).toBe(false);
    expect(validateAction(round, "a", { type: "call" }).legal).toBe(true);
  });
});
