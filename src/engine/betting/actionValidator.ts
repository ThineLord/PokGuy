import type {
  ActionValidation,
  BettingPlayer,
  BettingRoundState,
  PokerAction,
} from "./types";
import { CHIP_EPSILON, normalizeChips } from "../chips/chips";

export function amountToCall(
  state: BettingRoundState,
  player: BettingPlayer,
): number {
  return normalizeChips(
    Math.max(0, state.currentBet - player.streetContribution),
  );
}

export function maxRaiseTo(player: BettingPlayer): number {
  return normalizeChips(player.streetContribution + player.stack);
}

export function isBettingReopened(
  state: BettingRoundState,
  player: BettingPlayer,
): boolean {
  return (
    !player.acted ||
    state.currentBet - player.lastActedBet + CHIP_EPSILON >=
      state.minRaiseIncrement
  );
}

export function legalActionsFor(
  state: BettingRoundState,
  playerId: string,
): Record<string, ActionValidation> {
  const player = state.players.find((candidate) => candidate.id === playerId);
  const minimumTarget =
    state.currentBet === 0
      ? state.bigBlind
      : state.currentBet + state.minRaiseIncrement;
  const sizedTarget = player
    ? Math.min(maxRaiseTo(player), minimumTarget)
    : minimumTarget;
  return Object.fromEntries(
    (["fold", "check", "call", "bet", "raise", "all-in"] as const).map(
      (type) => [
        type,
        validateAction(
          state,
          playerId,
          type === "bet" || type === "raise"
            ? { type, amount: sizedTarget }
            : { type },
        ),
      ],
    ),
  );
}

export function validateAction(
  state: BettingRoundState,
  playerId: string,
  action: PokerAction,
): ActionValidation {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) return invalid("Unknown player", 0, null, 0);
  const toCall = amountToCall(state, player);
  const maximum = maxRaiseTo(player);
  const minRaiseTo =
    state.currentBet === 0
      ? state.bigBlind
      : state.currentBet + state.minRaiseIncrement;
  const base = {
    toCall,
    minRaiseTo,
    maxRaiseTo: maximum,
    reopensBetting: false,
  };

  if (state.actingPlayerId !== playerId)
    return { ...base, legal: false, reason: "Not this player's turn" };
  if (player.status !== "active" || player.stack <= 0) {
    return { ...base, legal: false, reason: "Player cannot act" };
  }

  switch (action.type) {
    case "fold":
      return { ...base, legal: true };
    case "check":
      return toCall <= CHIP_EPSILON
        ? { ...base, legal: true }
        : { ...base, legal: false, reason: `Cannot check facing ${toCall}` };
    case "call":
      return toCall > CHIP_EPSILON
        ? { ...base, legal: true }
        : { ...base, legal: false, reason: "Nothing to call" };
    case "bet":
    case "raise": {
      const expectedType = state.currentBet === 0 ? "bet" : "raise";
      if (action.type !== expectedType) {
        return {
          ...base,
          legal: false,
          reason: `Action must be ${expectedType}`,
        };
      }
      if (!isBettingReopened(state, player)) {
        return {
          ...base,
          legal: false,
          reason: "Betting has not been reopened",
        };
      }
      if (action.amount === undefined || !Number.isFinite(action.amount)) {
        return {
          ...base,
          legal: false,
          reason: "A target total is required",
          nearestLegalAmount: Math.min(minRaiseTo, maximum),
        };
      }
      if (action.amount > maximum + CHIP_EPSILON) {
        return {
          ...base,
          legal: false,
          reason: "Amount exceeds stack",
          nearestLegalAmount: maximum,
        };
      }
      if (action.amount <= state.currentBet + CHIP_EPSILON) {
        return {
          ...base,
          legal: false,
          reason: "Raise must exceed the current bet",
          nearestLegalAmount: Math.min(minRaiseTo, maximum),
        };
      }
      if (
        action.amount + CHIP_EPSILON < minRaiseTo &&
        action.amount + CHIP_EPSILON < maximum
      ) {
        return {
          ...base,
          legal: false,
          reason: `Minimum legal total is ${minRaiseTo}`,
          nearestLegalAmount: Math.min(minRaiseTo, maximum),
        };
      }
      return {
        ...base,
        legal: true,
        reopensBetting:
          action.amount - state.currentBet + CHIP_EPSILON >=
          state.minRaiseIncrement,
      };
    }
    case "all-in": {
      if (maximum <= player.streetContribution + CHIP_EPSILON) {
        return { ...base, legal: false, reason: "No chips available" };
      }
      const raises = maximum > state.currentBet + CHIP_EPSILON;
      if (raises && !isBettingReopened(state, player)) {
        return {
          ...base,
          legal: false,
          reason: "Betting has not been reopened; all-in may only call",
        };
      }
      return {
        ...base,
        legal: true,
        reopensBetting:
          raises &&
          maximum - state.currentBet + CHIP_EPSILON >= state.minRaiseIncrement,
      };
    }
  }
}

function invalid(
  reason: string,
  toCall: number,
  minRaiseTo: number | null,
  max: number,
): ActionValidation {
  return {
    legal: false,
    reason,
    toCall,
    minRaiseTo,
    maxRaiseTo: max,
    reopensBetting: false,
  };
}
