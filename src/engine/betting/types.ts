export type Street = "preflop" | "flop" | "turn" | "river" | "showdown" | "complete";
export type PlayerStatus = "active" | "folded" | "all-in" | "sitting-out" | "busted";
export type PokerActionType = "fold" | "check" | "call" | "bet" | "raise" | "all-in";

export interface BettingPlayer {
  id: string;
  seat: number;
  stack: number;
  streetContribution: number;
  totalContribution: number;
  status: PlayerStatus;
  acted: boolean;
  lastActedBet: number;
}

export interface BettingRoundState {
  street: Street;
  players: BettingPlayer[];
  actingPlayerId: string | null;
  currentBet: number;
  minRaiseIncrement: number;
  bigBlind: number;
  actionSequence: number;
  lastAggressorId: string | null;
}

export interface PokerAction {
  type: PokerActionType;
  amount?: number;
}

export interface ActionValidation {
  legal: boolean;
  reason?: string;
  nearestLegalAmount?: number;
  toCall: number;
  minRaiseTo: number | null;
  maxRaiseTo: number;
  reopensBetting: boolean;
}
