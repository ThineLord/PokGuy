import type { Card } from "../engine/cards/cards";
import type { PokerActionType, Street } from "../engine/betting/types";

export interface PokerPersonality {
  id: string;
  name: string;
  description: string;
  vpip: number;
  pfr: number;
  aggression: number;
  bluffFrequency: number;
  callDownTendency: number;
  foldToPressure: number;
  positionAwareness: number;
  potOddsAwareness: number;
  stackAwareness: number;
  boardTextureAwareness: number;
  continuationBetFrequency: number;
  doubleBarrelFrequency: number;
  checkRaiseFrequency: number;
  slowPlayFrequency: number;
  trapFrequency: number;
  tiltSensitivity: number;
  adaptability: number;
  variance: number;
  thinkingSpeed: "fast" | "normal" | "slow";
}

export interface HandAssessment {
  madeHandStrength: number;
  drawStrength: number;
  equityEstimate: number;
  nutPotential: number;
  boardDanger: number;
  showdownValue: number;
}

export interface AIDecision {
  action: PokerActionType;
  amount?: number;
  confidence: number;
  reasoningTags: string[];
}

export interface AIObservation {
  heroHoleCards: [Card, Card];
  board: Card[];
  street: Street;
  pot: number;
  toCall: number;
  minRaiseTo: number | null;
  maxRaiseTo: number;
  currentBet: number;
  heroStreetContribution: number;
  heroStack: number;
  effectiveStack: number;
  position: number;
  opponents: number;
  allInOpponents: number;
  legalActions: PokerActionType[];
  wasPreflopAggressor: boolean;
  userProfile?: UserTendencyProfile;
}

export interface UserTendencyProfile {
  sampleSize: number;
  foldRate: number;
  callRate: number;
  vpip: number;
  continuationBetRate: number;
  checkRate: number;
}

export interface OpponentHabitStats {
  hands: number;
  vpip: number;
  pfr: number;
  threeBet: number;
  foldToThreeBet: number;
  continuationBet: number;
  foldToContinuationBet: number;
  aggressionFactor: number;
  showdownFrequency: number;
  bluffFrequencyEstimate: number;
  riverCallFrequency: number;
}
