import { amountToCall, validateAction } from "./actionValidator";
import type { BettingPlayer, BettingRoundState, PokerAction } from "./types";

const CHIP_EPSILON = 1e-9;

function nextActivePlayerId(
  state: BettingRoundState,
  fromSeat: number,
): string | null {
  const eligible = state.players
    .filter(
      (player) => player.status === "active" && player.stack > CHIP_EPSILON,
    )
    .sort((a, b) => a.seat - b.seat);
  if (eligible.length === 0) return null;
  return (
    eligible.find((player) => player.seat > fromSeat)?.id ?? eligible[0].id
  );
}

export function isRoundComplete(state: BettingRoundState): boolean {
  const contenders = state.players.filter(
    (player) =>
      player.status !== "folded" &&
      player.status !== "busted" &&
      player.status !== "sitting-out",
  );
  if (contenders.length <= 1) return true;
  return state.players
    .filter(
      (player) => player.status === "active" && player.stack > CHIP_EPSILON,
    )
    .every((player) => player.acted && amountToCall(state, player) === 0);
}

export function applyBettingAction(
  state: BettingRoundState,
  playerId: string,
  action: PokerAction,
): BettingRoundState {
  const validation = validateAction(state, playerId, action);
  if (!validation.legal) throw new Error(validation.reason ?? "Illegal action");
  const actor = state.players.find((player) => player.id === playerId)!;
  const previousBet = state.currentBet;
  let target = actor.streetContribution;

  if (action.type === "call")
    target += Math.min(validation.toCall, actor.stack);
  if (action.type === "bet" || action.type === "raise") target = action.amount!;
  if (action.type === "all-in") target = actor.streetContribution + actor.stack;

  const paid = Math.max(0, target - actor.streetContribution);
  const raiseIncrement = Math.max(0, target - previousBet);
  const fullRaise =
    target > previousBet && raiseIncrement >= state.minRaiseIncrement;

  let players = state.players.map((player): BettingPlayer => {
    if (player.id === playerId) {
      const rawRemaining = player.stack - paid;
      const remaining =
        Math.abs(rawRemaining) <= CHIP_EPSILON ? 0 : rawRemaining;
      return {
        ...player,
        stack: remaining,
        streetContribution: target,
        totalContribution: player.totalContribution + paid,
        status:
          action.type === "fold"
            ? "folded"
            : remaining === 0
              ? "all-in"
              : player.status,
        acted: true,
        lastActedBet: Math.max(previousBet, target),
      };
    }
    if (fullRaise && player.status === "active")
      return { ...player, acted: false };
    return player;
  });

  const currentBet = Math.max(previousBet, target);
  const minRaiseIncrement = fullRaise
    ? raiseIncrement
    : state.minRaiseIncrement;
  const interim: BettingRoundState = {
    ...state,
    players,
    currentBet,
    minRaiseIncrement,
    actionSequence: state.actionSequence + 1,
    lastAggressorId: target > previousBet ? playerId : state.lastAggressorId,
  };

  const actingPlayerId = isRoundComplete(interim)
    ? null
    : nextActivePlayerId(interim, actor.seat);
  players = interim.players;
  return { ...interim, players, actingPlayerId };
}

export function beginNextStreet(
  state: BettingRoundState,
  street: BettingRoundState["street"],
  firstToActId: string | null,
): BettingRoundState {
  return {
    ...state,
    street,
    actingPlayerId: firstToActId,
    currentBet: 0,
    minRaiseIncrement: state.bigBlind,
    lastAggressorId: null,
    players: state.players.map((player) => ({
      ...player,
      streetContribution: 0,
      acted: player.status !== "active",
      lastActedBet: 0,
    })),
  };
}
